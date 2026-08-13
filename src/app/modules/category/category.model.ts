import { Schema, model } from 'mongoose';
import { ICategory } from './category.interface';

function slugify(s: string) {
  // Convert to lowercase and trim
  let slug = s.toString().toLowerCase().trim();
  
  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, '-');
  
  // Remove any character that's not: Unicode letters, numbers, or hyphens
  // This preserves Bangla, Arabic, Chinese, etc. characters
  slug = slug.replace(/[^\p{L}\p{N}\-]/gu, '');
  
  // Collapse multiple hyphens into one
  slug = slug.replace(/\-+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^\-+|\-+$/g, '');
  
  // If slug is empty after all replacements, use a fallback
  if (!slug) {
    slug = 'category-' + Date.now();
  }
  
  return slug;
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
