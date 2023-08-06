const crudFactory = require("./crudFactory");
const Todo = require("../models/todosModel");

// Get all TODO's
exports.getAllTodo = crudFactory.getAll(Todo, "todos");

// Get single TODO
exports.getTodo = crudFactory.getOne(Todo, "todo");

// Create TODO
exports.createTodo = crudFactory.createOne(Todo, "todo");

// Update TODO
exports.updateTodo = crudFactory.updateOne(Todo, "todo");

// Delete TODO
exports.deleteTodo = crudFactory.deleteOne(Todo, "todo");
