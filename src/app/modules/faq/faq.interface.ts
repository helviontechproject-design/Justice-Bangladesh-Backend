export type TFaqRole = 'CLIENT' | 'LAWYER';

export interface IFaq {
  _id?: string;
  question: string;
  answer: string;
  role: TFaqRole;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
