module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.log("MAIN ERROR OBJ >>>>>>>>", err.name);
  if (err.name === "CastError") {
    handleCastErrorDB(err, req, res);
  } else if (err.code === 11000) {
    handleDuplicateFieldValueError(err, req, res);
  } else if (err.name === "ValidationError") {
    handleInvalidFieldValueError(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    sendProdError(err, req, res);
  } else {
    sendDevError(err, req, res);
  }
};

const sendDevError = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    res.status(err.statusCode).json({
      status: "Something went wrong!.",
      message: err.message,
    });
  }
};

const sendProdError = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.operational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming or unknown error : don't expose to client
      res.status(err.statusCode).json({
        status: "Something went wrong!.",
        message: err.message,
      });
    }
  } else {
    res.status(500).json({
      status: "Something went wrong!.",
      message: "Please try again later",
    });
  }
};

const handleDuplicateFieldValueError = (err, req, res) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}, please change field value!.`;

  res.status(400).json({
    status: "failed",
    message: message,
  });
};

const handleInvalidFieldValueError = (err, req, res) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;

  res.status(400).json({
    status: "failed",
    message: message,
  });
};

const handleCastErrorDB = (err, req, res) => {
  const message = `Invalid ${err.path}:${err.value}`;
  res.status(400).json({
    status: "failed",
    message: message,
  });
};
