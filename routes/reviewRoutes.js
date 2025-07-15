import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import * as authController from '../controllers/authContorller.js';

const router = express.Router({ mergeParams: true });
// mergeParams to access the params in the parent route
// express hides it by default to make routes modular and avoid conflicts
router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setUserTourIds,
    reviewController.isBooked,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.UpdateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );
export default router;
