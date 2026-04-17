import { Schema, model } from 'mongoose';
import { ICategory } from './category.interface';

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

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
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
    consultationFee: {
      type: Number,
      default: 500,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);


categorySchema.pre('validate', function (next) {
  const doc = this as ICategory & { name: string; slug?: string };
  if (!doc.slug && doc.name) {
    doc.slug = slugify(doc.name);
  }
  next();
});

export const CategoryModel = model<ICategory>('Category', categorySchema);
export default CategoryModel;
