import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinaryUpload } from './cloudinary.config';
import multer from 'multer';

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => {
    // generate safe filename
    const fileName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '-') 
      .replace(/[^a-z0-9\-\.]/g, ''); 

    const extension = file.originalname.split('.').pop();

    const uniqueFileName =
      Math.random().toString(36).substring(2) +
      '-' +
      Date.now() +
      '-' +
      fileName +
      '.' +
      extension;

    return {
      folder: 'uploads',
      public_id: uniqueFileName,
      ...({ resource_type: 'auto' } as Record<string, any>),
    };
  },
});

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
    files: 5,                   // max 5 files per request
  },
});
