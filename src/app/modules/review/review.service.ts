import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IClientReview } from './review.interface';
import { ClientReview } from './review.model';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { ClientProfileModel } from '../client/client.model';
import { LawyerProfileModel } from '../lawyer/lawyer.model';
import { NotificationHelper } from '../notification/notification.helper';

// Helper function to calculate and update lawyer's average rating
const updateLawyerAverageRating = async (lawyerId: string | Types.ObjectId) => {
  const avgResult = await ClientReview.aggregate([
    { $match: { lawyerId: new Types.ObjectId(lawyerId), isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);
  const avgRating = avgResult[0]?.avgRating || 0;
  const totalReviews = avgResult[0]?.totalReviews || 0;
  await LawyerProfileModel.findByIdAndUpdate(lawyerId, {
    avarage_rating: Number(avgRating.toFixed(2)),
    totalReviews,
  });
};

const createReview = async (
  decodedUser: JwtPayload | null,
  payload: Partial<IClientReview>
) => {
  // Verify lawyer exists
  const lawyer = await LawyerProfileModel.findById(payload.lawyerId);
  if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');

  // Get client profile if logged in
  let clientId = null;
  if (decodedUser?.userId) {
    const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (client) {
      clientId = client._id;
      // Check duplicate
      const existing = await ClientReview.findOne({ clientId, lawyerId: payload.lawyerId });
      if (existing) throw new AppError(StatusCodes.BAD_REQUEST, 'You have already reviewed this lawyer');
    }
  }

  const review = await ClientReview.create({
    clientId,
    lawyerId: payload.lawyerId,
    rating: payload.rating,
    comment: payload.comment,
    isApproved: false,
  });

  if (clientId) {
    if (payload.lawyerId) {
      await LawyerProfileModel.findByIdAndUpdate(payload.lawyerId, { $push: { reviews: review._id } });
    }
  }

  return review;
};

const getAllReviews = async (query: Record<string, string>) => {
  const reviews = ClientReview.find()
    .populate('clientId', '_id profileInfo')
    .populate('lawyerId', '_id profile_Details');

  const queryBuilder = new QueryBuilder(reviews, query);

  const allReviews = queryBuilder.filter().sort().paginate();

  const [data, meta] = await Promise.all([
    allReviews.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getReviewsByService = async (serviceId: string) => {
  const reviews = await ClientReview.find({ serviceId: new Types.ObjectId(serviceId), isApproved: true })
    .populate('clientId', '_id profileInfo userId')
    .sort({ createdAt: -1 });
  return reviews;
};

const getReviewsByLawyer = async (lawyerId: string, query: Record<string, string>) => {
  const lawyer = await LawyerProfileModel.findById(lawyerId);
  if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');

  // Only show approved reviews to public
  const reviews = ClientReview.find({ lawyerId: new Types.ObjectId(lawyerId), isApproved: true })
    .populate('clientId', '_id profileInfo userId')
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(reviews, query);
  const lawyerReviews = queryBuilder.filter().paginate();
  const [data, meta] = await Promise.all([lawyerReviews.build().exec(), queryBuilder.getMeta()]);

  const avgRating = await ClientReview.aggregate([
    { $match: { lawyerId: new Types.ObjectId(lawyerId), isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);

  return { data, meta, stats: avgRating[0] || { avgRating: 0, totalReviews: 0 } };
};

// Admin: get all reviews (pending + approved)
const adminGetAllReviews = async (query: Record<string, string>) => {
  const reviews = ClientReview.find()
    .populate('clientId', '_id profileInfo')
    .populate('lawyerId', '_id profile_Details')
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(reviews, query);
  const result = queryBuilder.filter().sort().paginate();
  const [data, meta] = await Promise.all([result.build().exec(), queryBuilder.getMeta()]);
  return { data, meta };
};

// Admin: approve review
const adminApproveReview = async (id: string) => {
  const review = await ClientReview.findById(id);
  if (!review) throw new AppError(StatusCodes.NOT_FOUND, 'Review not found');
  review.isApproved = !review.isApproved;
  await review.save();
  // Recalculate lawyer rating based on approved reviews only
  if (review.lawyerId) {
    await updateLawyerAverageRating(review.lawyerId.toString());
  }
  return review;
};

// Admin: delete review
const adminDeleteReview = async (id: string) => {
  const review = await ClientReview.findById(id);
  if (!review) throw new AppError(StatusCodes.NOT_FOUND, 'Review not found');
  if (review.lawyerId) {
    await LawyerProfileModel.findByIdAndUpdate(review.lawyerId, { $pull: { reviews: review._id } });
  }
  await ClientReview.findByIdAndDelete(id);
  if (review.lawyerId) {
    await updateLawyerAverageRating(review.lawyerId.toString());
  }
};

const getMyReviews = async (
  decodedUser: JwtPayload,
  query: Record<string, string>
) => {
  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  const reviews = ClientReview.find({ clientId: client._id })
    .populate('lawyerId', '_id profile_Details')
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(reviews, query);

  const myReviews = queryBuilder.filter().paginate();

  const [data, meta] = await Promise.all([
    myReviews.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSingleReview = async (id: string) => {
  const review = await ClientReview.findById(id)
    .populate('clientId', '_id profileInfo')
    .populate('lawyerId', '_id profile_Details');

  if (!review) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Review not found');
  }

  return review;
};

const updateReview = async (
  id: string,
  decodedUser: JwtPayload,
  payload: Partial<IClientReview>
) => {
  const review = await ClientReview.findById(id);

  if (!review) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Review not found');
  }

  // Only client can update their own review
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client || !review.clientId.equals(client._id)) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You can only update your own reviews');
  }

  const updatedReview = await ClientReview.findByIdAndUpdate(id, payload, {
    new: true,
  })
    .populate('clientId', '_id profileInfo')
    .populate('lawyerId', '_id profile_Details');

  // Update lawyer's average rating after review update
  if (updatedReview && updatedReview.lawyerId) {
    await updateLawyerAverageRating(updatedReview.lawyerId.toString());
  }

  return updatedReview;
};

const deleteReview = async (id: string, decodedUser: JwtPayload) => {
  const review = await ClientReview.findById(id);

  if (!review) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Review not found');
  }

  // Only client can delete their own review
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client || !review.clientId.equals(client._id)) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You can only delete your own reviews');
  }

  // Remove review from lawyer's reviews array
  await LawyerProfileModel.findByIdAndUpdate(review.lawyerId, {
    $pull: { reviews: review._id },
  });

  await ClientReview.findByIdAndDelete(id);

  // Update lawyer's average rating after review deletion
  if (review.lawyerId) {
    await updateLawyerAverageRating(review.lawyerId.toString());
  }
};

const getReviewStats = async () => {
  const totalReviews = await ClientReview.countDocuments();

  const ratingDistribution = await ClientReview.aggregate([
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const avgRating = await ClientReview.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  return {
    totalReviews,
    ratingDistribution,
    avgRating: avgRating[0]?.avgRating || 0,
  };
};

export const reviewService = {
  createReview,
  getAllReviews,
  adminGetAllReviews,
  adminApproveReview,
  adminDeleteReview,
  getReviewsByLawyer,
  getReviewsByService,
  getMyReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getReviewStats,
};
