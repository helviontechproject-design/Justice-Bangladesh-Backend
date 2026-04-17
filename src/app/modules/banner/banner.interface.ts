export interface IBanner extends Document {
  ImageUrl: string;
  isActive: boolean;
  target: 'client' | 'lawyer' | 'all';
  createdAt: Date;
  updatedAt: Date;
}
