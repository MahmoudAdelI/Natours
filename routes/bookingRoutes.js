import express from 'express';
import * as authController from '../controllers/authContorller.js';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router({ mergeParams: true });
router.use(authController.protect);

router.get('/checkout-session/:id', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
export default router;
