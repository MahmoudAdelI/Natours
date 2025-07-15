import express from 'express';
import * as viewsController from '../controllers/viewsController.js';
import * as authController from '../controllers/authContorller.js';
import * as bookinController from '../controllers/bookingController.js';

const router = express.Router();

router.get('/profile', authController.protect, viewsController.getProfile);
router.get(
  '/my-bookings',
  authController.protect,
  viewsController.getMyBookings,
);
//for non-protected routes
router.use(authController.isLoggedIn);

router.get(
  '/',
  bookinController.createBookingCheckout,
  viewsController.getOverview,
);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLogin);
router.get('/forgot-password', viewsController.getForgotPassword);
router.get('/reset-password', viewsController.getResetPassword);
router.get('/signup', viewsController.getSignup);

export default router;
