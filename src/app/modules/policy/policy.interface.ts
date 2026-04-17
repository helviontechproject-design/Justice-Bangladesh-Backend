export type TPolicyType = 'terms' | 'privacy' | 'payment' | 'refund' | 'about';
export type TPolicyRole = 'CLIENT' | 'LAWYER';

export interface IPolicy {
  _id?: string;
  type: TPolicyType;
  role: TPolicyRole;
  content: string;
  updatedAt?: Date;
}
