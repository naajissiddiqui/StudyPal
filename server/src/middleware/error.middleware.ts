import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('⚠️ Express Error Handler:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const issues = err.issues || [];
    res.status(400).json({
      error: 'Validation Error',
      message: issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
      details: issues
    });
    return;
  }

  // Handle Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      error: 'Duplicate Error',
      message: `An account with this ${field} already exists.`
    });
    return;
  }

  // Handle Mongoose CastError / ValidationError
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
}
