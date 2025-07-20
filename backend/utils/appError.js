class AppError extends Error {
  constructor() {
    super();
  }
  
  createError(message, statusCode, statusTxt) {
    this.message = message;
    this.statusCode = statusCode;
    this.statusTxt = statusTxt;
    return this;
  }
}

module.exports = new AppError();