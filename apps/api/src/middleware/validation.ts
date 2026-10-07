import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { formatZodErrors } from '@insta-automation/validation';

export interface ValidatableSchema {
  parseAsync(data: any): Promise<any>;
}

export function validate(schema: ValidatableSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request input validation failed',
            details: formatZodErrors(err),
          },
          requestId: req.requestId,
        });
      }
      return next(err);
    }
  };
}
