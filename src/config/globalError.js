const devError = (err, res) => {
  res.status(err.statusCode).send({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const prodError = (err, res) => {
  res.status(err.statusCode).send({
    status: err.status,
    message: err.message,
  });
};

module.exports.globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    devError(err, res);
  }

  if (process.env.NODE_ENV === "production") {
    prodError(err, res);
  }
};
