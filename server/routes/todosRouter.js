const express = require("express");
const todoController = require("../controllers/todosController");
const { protectedOnly } = require("../controllers/authController");

const router = express.Router();

/***
 * Some todos API's are accessible only for logged in users
 * ***/

router
  .route("/")
  .get(todoController.getAllTodo)
  .post(protectedOnly, todoController.createTodo);

router
  .route("/:id")
  .get(todoController.getTodo)
  .patch(protectedOnly, todoController.updateTodo)
  .delete(protectedOnly, todoController.deleteTodo);

module.exports = router;
