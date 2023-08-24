const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");

exports.getMyDetails = (req, res, next) => {
  /***
   * As a logged in user we will have user object on req so
   * we can obtain user ID from there and by using factory we can find the user detail
   * ****/
  req.params.id = req.user.id;
  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload images only", 404), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.updateMyDetails = catchAsync(async (req, res, next) => {
  /**
   * Don't allow user to update primary auth info password & email
   * **/
  if (req.body.password) {
    return next(
      new AppError(
        "Updating password is not allowed from this resource, please use `/change-password` API for the same",
        401
      )
    );
  }

  /**
   * if we wanna block user from being update an email
   * then we have to maintain an api to re-validate updated email
   * hence not blocking the user as of now
   * ***/

  //   if (req.body.email) {
  //     return next(
  //       new AppError(
  //         "As of now updating an email associated with login so we are not allowing to update",
  //         401
  //       )
  //     );
  //   }

  const payload = filterReqBody(req.body, "name", "phone", "email", "role");

  //   If we have an user photo upload though req then add file name in the payload
  if (req.file) payload.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, payload, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * As a fallback we will have an create user API
 * which will not send any response instead let user know correct API path
 * */

exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: "error",
    message:
      "Creating an user does not supports here!, please use /signup resource instead",
  });
};

const filterReqBody = (obj, ...allowedFields) => {
  const payload = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      payload[el] = obj[el];
    }
  });

  return payload;
};

exports.NotValid = (req, res, next) => {
  res.status(500).json({
    status: "error",
    message: "Not a valid API path",
  });
};
