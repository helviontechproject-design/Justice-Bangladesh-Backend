import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { Video } from './video.model';
import { IVideo } from './video.interface';

const createVideo = async (payload: Partial<IVideo>) => {
  return Video.create(payload);
};

const getAllVideos = async () => {
  return Video.find({ isActive: true }).sort({ createdAt: -1 });
};

const getAllVideosAdmin = async () => {
  return Video.find().sort({ createdAt: -1 });
};

const updateVideo = async (id: string, payload: Partial<IVideo>) => {
  const video = await Video.findById(id);
  if (!video) throw new AppError(StatusCodes.NOT_FOUND, 'Video not found');
  return Video.findByIdAndUpdate(id, payload, { new: true });
};

const deleteVideo = async (id: string) => {
  const video = await Video.findById(id);
  if (!video) throw new AppError(StatusCodes.NOT_FOUND, 'Video not found');
  return Video.findByIdAndDelete(id);
};

export const videoService = { createVideo, getAllVideos, getAllVideosAdmin, updateVideo, deleteVideo };
