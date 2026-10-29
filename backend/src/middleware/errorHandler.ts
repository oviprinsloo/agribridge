import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  errors?: any[];

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Occurred]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors || [],
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A resource with this identifier or unique attribute already exists.',
      code: 'DUPLICATE_RESOURCE',
      errors: err.meta?.target ? [err.meta.target] : [],
    });
    return;
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Requested record was not found in database.',
      code: 'NOT_FOUND',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An unexpected server error occurred.' : message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
  });
};
