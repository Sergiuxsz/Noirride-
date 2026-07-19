import { HttpsError, FunctionsErrorCode } from 'firebase-functions/v2/https';

export class AppError extends Error {
  public readonly code: FunctionsErrorCode;
  public readonly details?: unknown;

  constructor(code: FunctionsErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  public toHttpsError(): HttpsError {
    return new HttpsError(this.code, this.message, this.details);
  }
}

export function handleControllerError(error: unknown): HttpsError {
  if (error instanceof AppError) {
    return error.toHttpsError();
  }
  if (error instanceof HttpsError) {
    return error;
  }
  if (error instanceof Error) {
    return new HttpsError('internal', error.message);
  }
  return new HttpsError('internal', 'An unexpected error occurred in NoirRide protocol services.');
}
