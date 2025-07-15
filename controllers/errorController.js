import AppError from '../utils/appError.js';

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Somthin went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send mesage to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors, //for arrays
    });

    // Programming or unknown error: don't leak error details
  } else {
    // 1- Log the error
    console.error('ERROR: ', err);

    // 2- send generic message
    res.status(500).json({
      status: 'error',
      message: 'something went wrong!',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const duplicateField = err.errorResponse.keyValue.name;
  const message = `Duplicate field value: '${duplicateField}'. please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((err) => err.message);
  // const message = `Invalid input data: ${errors}`;
  const message = `Invalid input data`;
  return new AppError(message, 400, errors);
};
const handleJWTError = () => new AppError('Invalid token, please log in', 401);
const handleExpiredJWTError = () =>
  new AppError('your token has expired, please log in again', 401);

export default (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Using { ...err } loses non-enumerable props like .name in modern JS/Mongoose
    // Use Object.create(err) to safely preserve full error details
    let error = Object.create(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleExpiredJWTError(error);
    sendErrorProd(error, res);
  }
};
