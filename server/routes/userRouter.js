const express = require("express");
const userController = require("../controllers/userController");
const usersController = require("../controllers/usersController");
const { protectedOnly } = require("../controllers/authController");

const router = express.Router();

/******
 * All the route to /user are protected
 * ********/
router.use(protectedOnly);

router
  .route("/")
  .get(userController.NotValid)
  .post(userController.NotValid)
  .put(userController.NotValid)
  .patch(userController.NotValid)
  .delete(userController.NotValid);

router
  .route("/profile")
  .get(userController.NotValid)
  .post(userController.NotValid)
  .put(userController.NotValid)
  .patch(userController.NotValid)
  .delete(userController.NotValid);

router.get("/profile/me", userController.getMyDetails, usersController.getUser);

router.patch(
  "/profile/update",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMyDetails
);
router.delete("/profile/deactivate", userController.deleteMe);

module.exports = router;
