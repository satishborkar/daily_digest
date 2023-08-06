const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/sign-in", authController.login);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

// Only Protected users are allowed to change password
router.patch(
  "/change-password",
  authController.protectedOnly,
  authController.changePassword
);

module.exports = router;
