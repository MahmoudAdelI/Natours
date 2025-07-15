import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';
import modelName from '../utils/getModelName.js';

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        [modelName(Model)]: newDoc,
      },
    });
  });

// query filtering helper function
const filter = (params) => {
  switch (params) {
    case params.tourId:
      return { tour: params.tourId };
    case params.userId:
      return { user: params.userId };
    default:
      return {};
  }
};
export const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // this is to allow nested GET review on "tour/:tourId/reviews" (hack)
    // const { tourId } = req.params;
    // const filter = tourId ? { tour: tourId } : {};
    //...

    const features = new APIFeatures(Model.find(filter(req.params)), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        [`${modelName(Model)}s`]: docs,
      },
    });
  });
export const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id).populate(popOptions);
    if (!doc) {
      return next(
        new AppError(`Could not find a tour with id: ${req.params.id}`, 404),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        [modelName(Model)]: doc,
      },
    });
  });

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(
          `Could not find a ${modelName(Model)} with id: ${req.params.id}`,
          404,
        ),
      );
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(
        new AppError(
          `Could not find a ${modelName(Model)} with id: ${req.params.id}`,
          404,
        ),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        [modelName(Model)]: doc,
      },
    });
  });
