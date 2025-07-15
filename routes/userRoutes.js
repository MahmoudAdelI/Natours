import express from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authContorller.js';
import bookingRouter from './bookingRoutes.js';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.get('/logout', authController.logOut);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// protect all routes after this middleware
router.use(authController.protect);

// nested route
router.use('/:userId/bookings', bookingRouter);

router.patch('/update-password', authController.updatePassword);

router
  .route('/me')
  .get(userController.getMe, userController.getUser)
  .patch(
    userController.uploadImage,
    userController.resizeImage,
    userController.updateMe,
  )
  .delete(userController.deleteMe);

// restrict all routes after this middleware to admins only
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
