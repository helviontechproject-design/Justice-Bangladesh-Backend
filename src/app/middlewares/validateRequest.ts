import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest =
  (zodSchema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('=== VALIDATE REQUEST ===');
      console.log('Route:', req.path);
      console.log('Method:', req.method);
      console.log('Body before validation:', JSON.stringify(req.body, null, 2));
      
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      
      console.log('Body to validate:', JSON.stringify(req.body, null, 2));
      req.body = await zodSchema.parseAsync(req.body);
      console.log('Validation passed');
      next();
    } catch (error) {
      console.error('Validation error:', error);
      next(error);
    }
  };
