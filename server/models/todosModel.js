const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      unique: true,
      maxLength: [40, "Max length is 40 characters"],
      minLength: [3, "Min length is 3 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxLength: [200, "Max length is 200 characters"],
      minLength: [3, "Min length is 3 characters"],
    },
    status: {
      type: String,
      enum: ["completed", "incomplete", "discarded"],
      default: "incomplete",
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: Number,
      // enum: ["high", "medium", "low", "very-low", "no-priority"],
      enum: [1, 2, 3, 4, 5],
      default: 2,
      validate: {
        validator: function (el) {
          if (typeof el === "number" && el <= 5) {
            return true;
          }
          return false;
        },
        message: "priority must be number between 0 to 5",
      },
    },
    slug: {
      type: String,
    },
  },
  {
    // adds created date and updated date automatically
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

/*************
 * DOCUMENT Middleware
 * **************/
todoSchema.pre("save", function (next) {
  this.slug = slugify(this.title, {
    lower: true,
  });
  next();
});

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
