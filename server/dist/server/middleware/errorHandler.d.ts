/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */
import { Request, Response, NextFunction } from 'express';
interface CustomRequest extends Request {
    tenant?: any;
    user?: any;
}
interface CustomError extends Error {
    status?: number;
    statusCode?: number;
    code?: string;
    details?: any;
    field?: string;
    expected?: any;
    actual?: any;
    errno?: number;
    syscall?: string;
    errors?: any;
}
/**
 * Not Found middleware
 * Handles 404 errors for undefined routes
 */
declare function notFound(req: Request, _res: Response, next: NextFunction): void;
/**
 * Global error handler middleware
 * Handles all errors and returns standardized error responses
 */
declare function errorHandler(err: CustomError, req: CustomRequest, res: Response, _next: NextFunction): void;
/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create custom error with additional properties
 */
declare class APIError extends Error {
    status: number;
    code: string;
    details: any;
    constructor(message: string, status?: number, code?: string, details?: any);
}
/**
 * Predefined error creators
 */
declare const errors: {
    badRequest: (message?: string, code?: string, details?: any) => APIError;
    unauthorized: (message?: string, code?: string) => APIError;
    forbidden: (message?: string, code?: string) => APIError;
    notFound: (message?: string, code?: string) => APIError;
    conflict: (message?: string, code?: string) => APIError;
    tooManyRequests: (message?: string, code?: string) => APIError;
    internalError: (message?: string, code?: string) => APIError;
    serviceUnavailable: (message?: string, code?: string) => APIError;
};
export { notFound, errorHandler, asyncHandler, APIError, errors };
declare const _default: {
    notFound: typeof notFound;
    errorHandler: typeof errorHandler;
    asyncHandler: typeof asyncHandler;
    APIError: typeof APIError;
    errors: {
        badRequest: (message?: string, code?: string, details?: any) => APIError;
        unauthorized: (message?: string, code?: string) => APIError;
        forbidden: (message?: string, code?: string) => APIError;
        notFound: (message?: string, code?: string) => APIError;
        conflict: (message?: string, code?: string) => APIError;
        tooManyRequests: (message?: string, code?: string) => APIError;
        internalError: (message?: string, code?: string) => APIError;
        serviceUnavailable: (message?: string, code?: string) => APIError;
    };
};
export default _default;
//# sourceMappingURL=errorHandler.d.ts.map