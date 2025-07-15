export default class AppError extends Error {
  constructor(message, statusCode, errors) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // for arrays
    // Attach the stack trace to this (the error instance "AppError").
    Error.captureStackTrace(this, this.constructor);
  }
}
