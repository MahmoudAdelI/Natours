import crypto from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Email from '../utils/mail.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res, sendUser) => {
  const token = signToken(user._id);
  if (user.password) user.password = undefined; // Remove password before sending the response to avoid exposing it
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production or false in dev,
  };
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    ...(sendUser && { data: { user } }),
  });
};
export const signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
  const url = `${req.protocol}://${req.get('host')}/profile`;
  await new Email(newUser, url).sendWelcome();
});

export const logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  createSendToken(user, 200, res, 1);
});

export const logOut = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1- verify token
      const promiseJwtVerify = promisify(jwt.verify);
      const decoded = await promiseJwtVerify(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2- check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 3- check if password has changed
      if (currentUser.isPasswordChanged(decoded.iat)) return next();

      // User is logged in
      // pass user to next midlleware (view controller) through res.locals
      res.locals.user = currentUser;
      return next();
    }
    next();
  } catch (error) {
    next();
  }
};

export const protect = catchAsync(async (req, res, next) => {
  // 1- get token & check if it's exists
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('you are not logged in'), 401);

  // 2- verify token
  const promiseJwtVerify = promisify(jwt.verify);
  const decoded = await promiseJwtVerify(token, process.env.JWT_SECRET);

  // 3- check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('this user does not exist', 401));

  // 4- check if password has changed
  if (currentUser.isPasswordChanged(decoded.iat))
    return next(new AppError('Invalid email or password', 401));

  // Grant access to protected route
  // and pass user to next midlleware through req
  req.user = currentUser;
  res.locals.user = currentUser; // for easy access in pug templates

  next();
});

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403),
      );
    }
    next();
  };

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1- find the user
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('there is no user with that email', 404));

  // 2- generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3- send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/?token=${resetToken}`;
  try {
    // console.log(user);
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'there was an error sending the email. try again later!',
        500,
      ),
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // 1- find user by token
  console.log(req.params.token);
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2- if user exists and password-reset-expiry is valid >> reset password
  if (!user) return next(new AppError('token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3- update passwordChangedAt property for the user(in the model doc middleware)
  // 4- log the user in and send jwt
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1- find the user
  const user = await User.findById(req.user.id).select('+password');

  // 2- check if posted old password is correct
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError('password is incorrect', 401));
  // 3- update password
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4- log the user in
  createSendToken(user, 200, res);
});
