const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name field should not be blank"],
    },
    email: {
      type: String,
      required: [true, "Email field should not be blank"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Email field is not valid format"],
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    password: {
      type: String,
      required: [true, "Password field should not be blank"],
      minLength: 8,
      // This will not return password field in response
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, "Confirm Password field should not be blank"],
      minLength: 8,
      // This will not return password field in response
      select: false,
      validate: {
        // Validating password again conform password fields while creating and saving an user
        validator: function (el) {
          if (this.password) return el === this.password;
          return;
        },
        message: "Password field and ConfirmPassword field should be same",
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetTokenExpire: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

/************
 * QUERY MIDDLEWARE
 * ***************/

/**********
 * There are following types of middleware available in MongoDB
 * QUERY
 * AGGREGATE
 * MODEL
 * DOCUMENT
 * ************/

userSchema.pre(/^find/, function (next) {
  // find all user with active true value only
  this.find({ active: { $ne: false } });
  next();
});

/************
 * DOCUMENT MIDDLEWARE
 * ***************/

/*********
 * Update passwordChangedAt property whenever user changes his password
 * Not while creating user or other information of user object change
 * **********/
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  // subtracting 1000 milliseconds because sometime DB takes time to update prop.
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/*********
 * Encrypt the password using Hash methods
 * before saving or creating new user or user update the password in DB
 * **********/
userSchema.pre("save", async function (next) {
  // do not hash password if there is no changes in password filed
  if (!this.isModified("password")) {
    return next();
  }

  // Hash the password with 12 rounds of hashing which is ideal and would take max 2-3 seconds to decode
  this.password = await bcrypt.hash(this.password, 12);

  // We can not able to delete fields from Model so reset it to undefined
  this.confirmPassword = undefined;
  next();
});

/******************
 * DOCUMENT instance methods
 * *********************/

// Compare is user provide password is same as hashed password in user object
userSchema.methods.comparePasswords = async function (
  userPassword,
  passwordHash
) {
  return await bcrypt.compare(userPassword, passwordHash);
};

// Check whether user has recently changes password post JWT token has issued to user
userSchema.methods.isPwdChangedAfterJwtTknIssued = function (jwtTknTimestamp) {
  if (this.passwordChangedAt) {
    const pwdChangeLastTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    /*********
     * jwtTknTimestamp time should be less than pwdChangeLastTime
     *  which mean password is not been changed post JWT token issued
     * ***********/
    return jwtTknTimestamp < pwdChangeLastTime;
  }

  return false;
};

/***************
 * Create Password reset token methods which will return a token
 * *********************/
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetTokenExpire = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
