import mongoose from 'mongoose';
import Tour from './tourModel.js';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Review must be at least 1'],
      max: [5, 'Review must be less or equal to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  //to apply the virtuals
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' }).select('-__v');
  next();
});
reviewSchema.statics.calcAvgRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats ? stats[0].numRatings : 0,
    ratingsAverage: stats ? stats[0].avgRating : 4.5,
  });
};

reviewSchema.post('save', async function (doc, next) {
  // this.constructor refers to the Review model
  await this.constructor.calcAvgRating(this.tour);
  next();
});

// updating tour ratings after updating or deleting reviews
reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  await this.constructor.calcAvgRating(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
