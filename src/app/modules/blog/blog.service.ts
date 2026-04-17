import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { Blog } from './blog.model';
import { IBlog } from './blog.interface';

const createBlog = async (payload: Partial<IBlog>) => {
  return Blog.create(payload);
};

const getAllBlogs = async () => {
  return Blog.find({ isActive: true }).sort({ createdAt: -1 });
};

const getAllBlogsAdmin = async () => {
  return Blog.find().sort({ createdAt: -1 });
};

const updateBlog = async (id: string, payload: Partial<IBlog>) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new AppError(StatusCodes.NOT_FOUND, 'Blog not found');
  return Blog.findByIdAndUpdate(id, payload, { new: true });
};

const deleteBlog = async (id: string) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new AppError(StatusCodes.NOT_FOUND, 'Blog not found');
  return Blog.findByIdAndDelete(id);
};

export const blogService = { createBlog, getAllBlogs, getAllBlogsAdmin, updateBlog, deleteBlog };
