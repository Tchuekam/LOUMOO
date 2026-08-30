/**
 * LOUMOO Centralized Error Hierarchy
 * Standardized application and HTTP domain errors
 */

class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'INTERNAL_ERROR';
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational !== undefined ? options.isOperational : true;
    this.details = options.details || null;
    this.context = options.context || {};
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        statusCode: this.statusCode
      }
    };
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details
    });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required or invalid credentials', details = null) {
    super(message, {
      code: 'UNAUTHENTICATED',
      statusCode: 401,
      details
    });
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions to perform this action', details = null) {
    super(message, {
      code: 'PERMISSION_DENIED',
      statusCode: 403,
      details
    });
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = '') {
    super(`${resource}${id ? ` with id '${id}'` : ''} was not found`, {
      code: 'NOT_FOUND',
      statusCode: 404,
      details: { resource, id }
    });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate state', details = null) {
    super(message, {
      code: 'CONFLICT',
      statusCode: 409,
      details
    });
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', retryAfterSeconds = 60) {
    super(message, {
      code: 'RATE_LIMITED',
      statusCode: 429,
      details: { retryAfterSeconds }
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

class InfrastructureError extends AppError {
  constructor(service = 'Infrastructure', message = 'Service connection failed', originalError = null) {
    super(`${service} error: ${message}`, {
      code: 'INFRASTRUCTURE_UNAVAILABLE',
      statusCode: 503,
      isOperational: true,
      details: { service, originalMessage: originalError?.message }
    });
    this.originalError = originalError;
  }
}

class ExternalServiceError extends AppError {
  constructor(provider = 'ExternalProvider', message = 'Provider returned an error', details = null) {
    super(`${provider} integration error: ${message}`, {
      code: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 502,
      details
    });
  }
}

class IdempotencyError extends AppError {
  constructor(message = 'A request with this idempotency key is currently executing', key = '') {
    super(message, {
      code: 'IDEMPOTENCY_CONFLICT',
      statusCode: 409,
      details: { idempotencyKey: key }
    });
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InfrastructureError,
  ExternalServiceError,
  IdempotencyError
};
