import { JwtPayload } from "jsonwebtoken";
import { IClientProfile } from "./client.interface";
import { ClientProfileModel } from "./client.model";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ClientSearchableFields } from "../../constants";





const updateClient = async (decodedUser: JwtPayload, ClientId: string, payload: Partial<IClientProfile>)=>{
  const client = await ClientProfileModel.findById(ClientId);

  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized to perform this action');
  }
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'client not found');
  }


  const updatedLawyer = await ClientProfileModel.findByIdAndUpdate(
    ClientId,
    payload,
    { new: true }
  );
 return updatedLawyer;
};


const getAllClients = async (query: Record<string, string>, decodedUser: JwtPayload) => {

  if(!decodedUser.userId){
    throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized to access this resource');
  }
 
  const allClients = ClientProfileModel.find().populate('userId', 'isActive profilePhoto phoneNo email');

 const queryBuilder = new QueryBuilder(allClients, query);

  const allParcels = queryBuilder
    .search(ClientSearchableFields)
    .filter()
    .paginate();

  const [data, meta] = await Promise.all([
    allParcels.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getClientbyid = async (clientId: string) => {
  const client = await ClientProfileModel.findById(clientId)
    .populate('userId', 'name phoneNo email profile isActive')
    .populate({
      path: 'savedLawyers',
      select: 'userId profile_Details per_consultation_fee avarage_rating totalReviews specialties categories isOnline favorite_count',
      populate: [
        { path: 'userId', select: 'name email profile' },
        { path: 'specialties', select: 'name' },
        { path: 'categories', select: 'name slug icon' },
      ]
    });

  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');
  }

  return client;
};


const deleteClient = async (clientId: string) => {
  const client = await ClientProfileModel.findById(clientId);
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');
  }
  await ClientProfileModel.findByIdAndDelete(clientId);
  return client;
};

const toggleSaveLawyer = async (decodedUser: JwtPayload, lawyerId: string) => {
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');

  const alreadySaved = client.savedLawyers?.some(
    (id: any) => id.toString() === lawyerId
  );

  if (alreadySaved) {
    await ClientProfileModel.findByIdAndUpdate(client._id, {
      $pull: { savedLawyers: lawyerId },
    });
    return { saved: false };
  } else {
    await ClientProfileModel.findByIdAndUpdate(client._id, {
      $addToSet: { savedLawyers: lawyerId },
    });
    return { saved: true };
  }
};

const getSavedLawyers = async (decodedUser: JwtPayload) => {
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId })
    .populate({
      path: 'savedLawyers',
      select: 'userId profile_Details per_consultation_fee avarage_rating totalReviews specialties isOnline',
      populate: [
        { path: 'userId', select: 'profilePhoto' },
        { path: 'specialties', select: 'title' },
      ],
    });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');
  return client.savedLawyers ?? [];
};

export const clientServices = {
  updateClient,
  getAllClients,
  getClientbyid,
  deleteClient,
  toggleSaveLawyer,
  getSavedLawyers,
};