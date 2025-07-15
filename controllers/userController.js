import multer from 'multer';
import sharp from 'sharp';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import * as factory from './handlerFactory.js';

// IF WE DON'T WANT EDIT THE IMAGE > SAVE TO THE DISK

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// IF WE WANT TO EDIT THE IMAGE > SAVE TO MEMORY
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('The file you provided is not an image', 400), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
});

// utils
const filterBody = (bodyObj, ...AllowedFields) => {
  const filteredBody = Object.keys(bodyObj).reduce((filtered, current) => {
    if (AllowedFields.includes(current)) {
      filtered[current] = bodyObj[current];
    }
    return filtered;
  }, {});
  return filteredBody;
};

export const uploadImage = upload.single('photo');

export const resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // must define the filename because we use it later in the updateMe controller
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

export const updateMe = catchAsync(async (req, res, next) => {
  // 1- throw error if user posted password data
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('to update password use /update-password'));
  // 2- prevent users from updating fields like role
  const filteredBody = filterBody(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3- update user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
export const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined!, use /signup',
  });
};
export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);
