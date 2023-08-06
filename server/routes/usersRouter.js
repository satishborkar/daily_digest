const express = require("express");
const usersController = require("../controllers/usersController");
const {
  protectedOnly,
  restrictedTo,
} = require("../controllers/authController");

const router = express.Router();

/********
 * All routes for users are protected & role basis access i.e. admin only
 * ************/
router.use(protectedOnly);
router.use(restrictedTo("admin"));

router
  .route("/")
  .get(usersController.getAllUsers)
  .post(usersController.createUser);

router
  .route("/:id")
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
