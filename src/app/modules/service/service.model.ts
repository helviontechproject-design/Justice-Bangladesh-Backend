import { Schema, model } from 'mongoose';
import { IService } from './service.interface';

function slugify(s: string) {
  return s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}

const ServiceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: false,
      default: 0,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    iconUrl: {
      type: String,
      required: false,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


ServiceSchema.pre('validate', function (next) {
  const doc = this as IService & { name: string; slug?: string };
  if (!doc.slug && doc.name) {
    doc.slug = slugify(doc.name);
  }
  next();
});

export const ServiceModel = model<IService>('Service', ServiceSchema);

