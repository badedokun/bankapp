/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

/**
 * Not Found middleware
 * Handles 404 errors for undefined routes
 */
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
}

/**
 * Global error handler middleware
 * Handles all errors and returns standardized error responses
 */
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('API Error:', {
    message: error.message,
    status: error.status || error.statusCode || 500,
    code: error.code || 'INTERNAL_ERROR',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent',
    tenantId: req.tenant?.id,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Database errors
  if (error.code?.startsWith('23') {
    if (error.code === '23505' {
      // Unique constraint violation
      error.status = 409;
      error.message = 'Duplicate entry - resource already exists';
      error.code = 'DUPLICATE_ENTRY';
    } else if (error.code === '23503' {
      // Foreign key violation
      error.status = 400;
      error.message = 'Invalid reference - related resource not found';
      error.code = 'INVALID_REFERENCE';
    } else if (error.code === '23514' {
      // Check constraint violation
      error.status = 400;
      error.message = 'Invalid data - constraint violation';
      error.code = 'CONSTRAINT_VIOLATION';
    }
  }

  // Connection errors
  if (error.code === 'ECONNREFUSED' {
    error.status = 503;
    error.message = 'Database connection failed';
    error.code = 'DATABASE_CONNECTION_ERROR';
  }

  // Validation errors
  if (error.name === 'ValidationError' {
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    error.details = Object.values(error.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' {
    error.status = 401;
    error.message = 'Invalid authentication token';
    error.code = 'INVALID_TOKEN';
  }

  if (error.name === 'TokenExpiredError' {
    error.status = 401;
    error.message = 'Authentication token expired';
    error.code = 'TOKEN_EXPIRED';
  }

  // Rate limiting errors
  if (error.status === 429) {
    error.message = 'Too many requests';
    error.code = 'RATE_LIMIT_EXCEEDED';
  }

  // Default error response structure
  const response = {
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add additional details for specific error types
  if (error.details) {
    response.details = error.details;
  }

  if (error.field) {
    response.field = error.field;
  }

  if (error.expected && error.actual) {
    response.validation = {
      expected: error.expected,
      actual: error.actual
    };
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development' {
    response.stack = error.stack;
    response.originalError = {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    };
  }

  // Security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  // Send error response
  res.status(error.status || error.statusCode || 500).json(response);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error with additional properties
 */
class APIError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }
}

/**
 * Predefined error creators
 */
const errors = {
  badRequest: (message = 'Bad request', code = 'BAD_REQUEST', details = null) => {
    return new APIError(message, 400, code, details);
  },
  
  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED' => {
    return new APIError(message, 401, code);
  },
  
  forbidden: (message = 'Forbidden', code = 'FORBIDDEN' => {
    return new APIError(message, 403, code);
  },
  
  notFound: (message = 'Resource not found', code = 'NOT_FOUND' => {
    return new APIError(message, 404, code);
  },
  
  conflict: (message = 'Resource conflict', code = 'CONFLICT' => {
    return new APIError(message, 409, code);
  },
  
  tooManyRequests: (message = 'Too many requests', code = 'TOO_MANY_REQUESTS' => {
    return new APIError(message, 429, code);
  },
  
  internalError: (message = 'Internal server error', code = 'INTERNAL_ERROR' => {
    return new APIError(message, 500, code);
  },
  
  serviceUnavailable: (message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE' => {
    return new APIError(message, 503, code);
  }
};

export default {
  notFound,
  errorHandler,
  asyncHandler,
  APIError,
  errors
};