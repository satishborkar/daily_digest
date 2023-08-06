const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.getAll = (Model, dataType, filters = {}) => {
  // filters object will be params on req
  return catchAsync(async (req, res, next) => {
    const feature = new APIFeatures(Model.find(filters), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    const docs = await feature.query;

    res.status(200).json({
      status: "success",
      result: docs.length,
      data: {
        [dataType]: docs,
      },
    });
  });
};

exports.getOne = (Model, dataType, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError(`No ${dataType} found with this Id`, 404));
    }

    res.status(200).json({
      status: "success",
      data: { [dataType]: doc },
    });
  });
};

exports.createOne = (Model, dataType) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (!doc) {
      return next(new AppError(`Unable to create a ${dataType}`, 404));
    }

    res.status(201).json({
      status: "success",
      data: { [dataType]: doc },
    });
  });
};

exports.updateOne = (Model, dataType) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No ${dataType} found to update`, 404));
    }

    res.status(200).json({
      status: "success",
      data: { [dataType]: doc },
    });
  });
};

exports.deleteOne = (Model, dataType) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No ${dataType} found to delete`, 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};
