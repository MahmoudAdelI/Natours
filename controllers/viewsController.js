import Booking from '../models/bookingModel.js';
import Tour from '../models/tourModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', { title: 'All Tours', tours });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating name',
  });
  if (!tour)
    return next(new AppError('could not find a tour with that name'), 404);
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

export const getLogin = (req, res) => {
  res.status(200).render('login');
};
export const getForgotPassword = (req, res) => {
  res.status(200).render('forgotPassword');
};
export const getResetPassword = (req, res) => {
  res.status(200).render('resetPassword');
};

export const getSignup = (req, res) => {
  res.status(200).render('signup');
};

export const getProfile = (req, res) => {
  res.status(200).render('profile');
};

export const getMyBookings = catchAsync(async (req, res, next) => {
  // 1- find the bookings with the current user
  const bookings = await Booking.find({ user: req.user.id });
  // 2- map over them and extract the tour ids
  const tourIds = bookings.map((b) => b.tour);
  // 3- find the tours of those ids and render them
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', { title: 'My Bookings', tours });
});
