/**
 * Base class for all expected, user-facing application errors.
 * `message` is safe to show to the client; anything sensitive belongs in
 * `debugDetails`, which callers should log server-side only.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly debugDetails?: unknown;

  constructor(
    message: string,
    opts: { code: string; httpStatus: number; debugDetails?: unknown }
  ) {
    super(message);
    this.name = new.target.name;
    this.code = opts.code;
    this.httpStatus = opts.httpStatus;
    this.debugDetails = opts.debugDetails;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The submitted data is invalid.", debugDetails?: unknown) {
    super(message, { code: "VALIDATION_ERROR", httpStatus: 400, debugDetails });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "You need to sign in to continue.") {
    super(message, { code: "AUTHENTICATION_ERROR", httpStatus: 401 });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many attempts. Please try again later.") {
    super(message, { code: "RATE_LIMITED", httpStatus: 429 });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, { code: "AUTHORIZATION_ERROR", httpStatus: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} was not found.`, { code: "NOT_FOUND", httpStatus: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(message = "This action conflicts with the current state.") {
    super(message, { code: "CONFLICT", httpStatus: 409 });
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, { code: "BUSINESS_RULE_VIOLATION", httpStatus: 422 });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, debugDetails?: unknown) {
    super(`We couldn't reach ${service}. Please try again shortly.`, {
      code: "EXTERNAL_SERVICE_ERROR",
      httpStatus: 502,
      debugDetails,
    });
  }
}

/**
 * Converts any thrown value into a safe { message, code } pair for the
 * client, while preserving the full error server-side for logs.
 */
export function toClientError(err: unknown): { message: string; code: string } {
  if (err instanceof AppError) {
    if (err.debugDetails) {
      // eslint-disable-next-line no-console
      console.error(`[${err.code}]`, err.message, err.debugDetails);
    }
    return { message: err.message, code: err.code };
  }
  // eslint-disable-next-line no-console
  console.error("[UNHANDLED_ERROR]", err);
  return { message: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" };
}
