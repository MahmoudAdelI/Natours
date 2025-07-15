import express from 'express';
import * as tourController from '../controllers/tourController.js';
import * as authController from '../controllers/authContorller.js';
import reviewRouter from './reviewRoutes.js';
import bookingRouter from './bookingRoutes.js';

const router = express.Router();
// router.param('id', tourController.checkID);

// nested route
router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/bookings', bookingRouter);

// geospatial query
router
  .route('/tours-within/center/:latlng/distance/:distance/unit/:unit')
  .get(tourController.getToursWithin);
router
  .route('/distances/center/:latlng/unit/:unit')
  .get(tourController.getDistances);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tours-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadImages,
    tourController.resizeImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

export default router;
