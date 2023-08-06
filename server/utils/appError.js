/**********************************
 * Operational error or exception
 * Programming error or bugs
 **********************************/

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${this.status}`.startsWith(4) ? "failed" : "error";
    this.operational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
