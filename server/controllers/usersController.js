const crudFactory = require("./crudFactory");
const User = require("../models/userModel");

// User Crud Operations most probably for admin

// Get All Users
exports.getAllUsers = crudFactory.getAll(User, "users");

// Get single user
exports.getUser = crudFactory.getOne(User, "user");

// Create user
exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: "failed",
    message:
      "User can not be created by using this resource, please use /signup instead.",
  });
};

// Update user if you have privilege to do so
exports.updateUser = crudFactory.updateOne(User, "user");

// Delete user if you have privilege to do so
exports.deleteUser = crudFactory.deleteOne(User, "user");
