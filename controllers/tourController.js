import multer from 'multer';
import sharp from 'sharp';
import Tour from '../models/tourModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as factory from './handlerFactory.js';
import APIFeatures from '../utils/apiFeatures.js';

export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng)
    return new AppError(
      'Please provide latitudes and longitudes in the format lat,lng',
      400,
    );

  const radius = unit === 'm' ? distance / 3963.2 : distance / 6378.1;
  const query = Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  const toursWithFeatures = new APIFeatures(query, req.query)
    .filter()
    .limitFields()
    .sort()
    .paginate();
  const tours = await toursWithFeatures.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

export const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  //                                           to Ml      to Km
  const distanceMultiplier = unit === 'm' ? 0.000621371 : 0.001;
  if (!lat || !lng)
    return new AppError(
      'Please provide latitudes and longitudes in the format lat,lng',
      400,
    );
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: { distances },
  });
});

export const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  // This allows us to reuse the same getAllTours function for this specific case.
  // This is useful for creating a specific route for top tours without duplicating code.
  next();
};

export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});
export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //splits arrays to single docs
    },
    {
      $match: {
        // simply for quering data
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //aggregate by month
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' }, //creates array of occuring docs
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        //removes fields with value 0
        _id: 0,
      },
    },
    {
      $sort: { numToursStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

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

export const uploadImages = upload.fields([
  { name: 'images', maxCount: 3 },
  { name: 'imageCover', maxCount: 3 },
]);

export const resizeImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();
  // 1- imageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2- images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toFile(`public/img/tours/${fileName}`);
      req.body.images.push(fileName);
    }),
  );
  next();
});
export const getAllTours = factory.getAll(Tour);
export const getTour = factory.getOne(Tour, { path: 'reviews' });
export const createTour = factory.createOne(Tour);
export const updateTour = factory.updateOne(Tour);
export const deleteTour = factory.deleteOne(Tour);
