const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const { promisify } = require("util");

const signInToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateTokenAndSendResponse = (user, statusCode, res, next) => {
  try {
    const token = signInToken(user._id);

    // Send token to client via secure cookie way
    const cookieOptions = {
      expiresIn: new Date(
        Date.now(),
        process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 20 * 1000
      ),
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);
    // Reset user password in User object which we will send back to clint
    user.password = undefined;

    // Send response to client
    res.status(statusCode).json({
      status: "success",
      // attaching token here to dev env use only
      token,
      data: {
        user,
      },
    });
  } catch (err) {
    return next(
      new AppError(
        "Something went wrong while create a user, please try again!",
        500
      )
    );
  }
};

/***
 * Middleware to access of features only for logged users
 * *****/
exports.protectedOnly = catchAsync(async (req, res, next) => {
  // 1 check is JWT token exist & valid, token might be available on header or in Cookies
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in, please login and try again.", 401)
    );
  }

  // 2 Verify Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3 Check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("No user found with this token", 401));
  }

  // 4 Check if user recently changes password since token issue
  if (currentUser.isPwdChangedAfterJwtTknIssued(decoded.at)) {
    return next(
      new AppError("Invalid token, please login again and try again.", 401)
    );
  }

  // 5 if everything seems to be OK then attach user to req body
  req.user = currentUser;
  /******
   * if wanted to access user in views files of pug
   *  req.locals.user = currentUser;
   * *******/

  next();
});

/***
 * Middleware to restrict access of some features
 * *****/
exports.restrictedTo = (...roles) => {
  // expected roles are user, admin, superUser etc.
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get("host")}/profile`;
  await new Email(newUser, url).sendWelcome();

  generateTokenAndSendResponse(newUser, 201, res, next);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1 check both email & pass
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }
  // 2 check if user exist in DB
  const user = await User.findOne({ email }).select("+password");

  // 3 access document methods instance to check both passwords are same
  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError("Incorrect email or password"), 401);
  }

  generateTokenAndSendResponse(user, 201, res, next);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "logout", {
    expiresIn: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 get the user based on Posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError(`No user found with ${req.body.email} id`, 404));
  }

  // 2 Generate Access token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3 Send email to user with token
  try {
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message:
        "We have ent an email to your inbox, please check and reset your password.",
    });
  } catch (err) {
    /******************
     * While creating reset token we create two fields on model i.e. passwordResetToken & passwordResetTokenExpire
     * since we got an error while creating a token we have to delete these fields
     * *********************/
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was some issue with resetting your password link, please tray again",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 search user with provided token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // passwordResetTokenExpire time should be greater that now
    passwordResetTokenExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new AppError("Invalid token or expired", 400));
  }

  /*****
   * update USER not this properties to new if user exist and token matches
   * *******/
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;

  await user.save();

  // Share jwt token and cookies with user
  generateTokenAndSendResponse(user, 200, res);
});

exports.changePassword = catchAsync(async (req, res, next) => {
  if (!(req.body.password === req.body.confirmPassword)) {
    return next(
      new AppError(
        "password & confirm password does not match with each other",
        401
      )
    );
  }
  // get user from email ID
  const user = await User.findById(req.user._id).select("+password");

  if (
    !user ||
    !(await user.comparePasswords(req.body.currentPassword, user.password))
  ) {
    return next(
      new AppError("Incorrect existing password, please try again", 401)
    );
  }

  // Update the password from req.body
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // once user update anytime we have to create & share new token with client
  generateTokenAndSendResponse(user, 200, res, next);
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "Token is provided",
  });
});
