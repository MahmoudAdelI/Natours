import Stripe from 'stripe';
import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import Booking from '../models/bookingModel.js';
import * as factory from './handlerFactory.js';

const stripe = new Stripe(process.env.STRIPE_SK);
/*eslint-disable*/
export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1- get the booked tour
  const tour = await Tour.findById(req.params.id);
  // 2- create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Required
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.id}&user=${req.user.id}&price=${tour.price}`, // home
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // tour page
    customer_email: req.user.email,
    client_reference_id: req.params.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });
  // 3- send the session
  res.status(200).json({
    status: 'success',
    session,
  });
});

export const createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

export const createBooking = factory.createOne(Booking);
export const getBooking = factory.getOne(Booking);
export const getAllBooking = factory.getAll(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
