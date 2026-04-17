import { Report } from './report.model';
import { IReport } from './report.interface';
import { Types } from 'mongoose';

const create = async (payload: Partial<IReport>) => Report.create(payload);

const getMyReports = async (userId: string) =>
  Report.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });

const getAll = async (status?: string) => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  return Report.find(filter)
    .populate('userId', 'email phoneNo profilePhoto role')
    .sort({ createdAt: -1 });
};

const reply = async (id: string, adminReply: string) =>
  Report.findByIdAndUpdate(
    id,
    { adminReply, status: 'resolved', repliedAt: new Date() },
    { new: true }
  ).populate('userId', 'email phoneNo profilePhoto role fcmTokens');

export const reportService = { create, getMyReports, getAll, reply };
