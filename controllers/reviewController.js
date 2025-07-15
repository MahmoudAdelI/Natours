import Booking from '../models/bookingModel.js';
import Review from '../models/reviewModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as factory from './handlerFactory.js';

export const setUserTourIds = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

export const isBooked = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({
    tour: req.body.tour,
    user: req.body.user,
  });

  if (!booking)
    return next(
      new AppError('You can only review tours you have booked.', 400),
    );

  next();
});
// BAD AT SCALE (PERFORMANCE ISSUE)
// export const checkDoubleReviews = catchAsync(async (req, res, next) => {
//   // to prevent a user form reviewing a tour multiple times
//   const tour = await Tour.findById(req.body.tour).populate('reviews');
//   const alreadyReviewed = tour.reviews.some((r) => r.user.id === req.body.user);
//   if (alreadyReviewed)
//     return next(
//       new AppError('You have already submitted a review for this tour.', 400),
//     );
//   next();
// });
export const getAllReviews = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const UpdateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);
