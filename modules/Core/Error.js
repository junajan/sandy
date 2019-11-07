/**
 * Error used for internal errors.
 */
class RuntimeError extends Error {
  constructor(error, data = {}) {
    super(error);

    this.name = this.constructor.name;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ConfigurationError extends Error {
  constructor(error, data = {}) {
    super(error);

    this.name = this.constructor.name;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

class RetriableError extends Error {
  constructor(error, data = {}) {
    super(error);

    this.name = this.constructor.name;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  RetriableError,
  RuntimeError,
  ConfigurationError,
};