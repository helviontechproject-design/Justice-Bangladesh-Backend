import { Types } from 'mongoose';

export type TReportStatus = 'pending' | 'resolved';

export interface IReport {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  userRole: 'CLIENT' | 'LAWYER';
  subject: string;
  description: string;
  status: TReportStatus;
  adminReply?: string;
  repliedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
