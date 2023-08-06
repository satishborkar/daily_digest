const cookieParser = require("cookie-parser");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const helmet = require("helmet");
const morgan = require("morgan");

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const usersRouter = require("./routes/usersRouter");
const todosRouter = require("./routes/todosRouter");
const globalAppErrorHandler = require("./controllers/errorsController");

const AppError = require("./utils/appError");

const app = express();

/*******
 * Security Header middleware
 * **********/
app.use(helmet());

/********************************
 * DEV logs middleware
 * ******************************/
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/************
* To avoid BRUTE FORCE ATTACKs and DENIAL-OF-SERVICE(DOS) ATTACKs
* We will have some limit for API call from single IP within a hours

* It will maintain request count in RESPONSE HEADER -
* X-RateLimit-Remaining : 99
* X-RateLimit-Limit:100,
* X-RateLimit-Reset:1688535975
*************/

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again after an hour",
});

app.use("/api", limiter);

/***
 * Body parser, reading a data from body into req.body
 * limit: 10kb will be maximum payload size which application will be delivering to client
 ****/
app.use(
  express.json({
    limit: "100kb",
  })
);

/***
 * For submitting FORMDATA middleware
 ****/
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/***
 * Cookie parser
 ****/
app.use(cookieParser());

/***
 * Data sanitization against NoSQL injection [NOSQL QUERY INJECTION]
 * Data sanitization against XSS [CROSS-SITE SCRIPTING (XSS) ATTACKS]
 *
 ****/
app.use(mongoSanitize()); // will sanitize all NoQSL queries to be pass from client
app.use(xss()); // will clean HTML code from client

/***
 * Prevent parameters pollution (removing unwanted query parameters from API)
 ****/
app.use(
  hpp({
    whitelist: ["title", "description", "status", "priority"],
  })
);

/****
 * Test Middleware
 * ****/

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log("__request:time ------------------- ", req.requestTime);
  next();
});

/*********
 * Routes
 * *********/
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/todos", todosRouter);

/*********
 * Fallback Urls handler or page not found route
 * *********/

app.use("*", (req, res, next) => {
  // handle page not found here
  // res.status(404).json({
  //   status: "failed",
  //   message: `Can't find ${req.originalUrl} on the server`,
  // });
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

/***************
 * Once Error object created by new AppError class anywhere in app below middleware
 * will handle error response
 * *****************/

app.use(globalAppErrorHandler);

module.exports = app;
