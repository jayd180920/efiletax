import { NextResponse } from "next/server";

/**
 * Handles API requests with proper error handling
 * @param handler - The async function that handles the request
 * @returns A NextResponse object
 */
export const apiHandler = async (
  handler: () => Promise<NextResponse>
): Promise<NextResponse> => {
  try {
    return await handler();
  } catch (error: any) {
    console.error("API Error:", error);

    // Determine status code based on error
    let statusCode = 500;
    let message = "Internal server error";

    if (error.name === "ValidationError") {
      statusCode = 400;
      message = error.message;
    } else if (error.name === "UnauthorizedError") {
      statusCode = 401;
      message = "Unauthorized";
    } else if (error.name === "ForbiddenError") {
      statusCode = 403;
      message = "Forbidden";
    } else if (error.name === "NotFoundError") {
      statusCode = 404;
      message = "Not found";
    }

    return NextResponse.json(
      { error: error.message || message },
      { status: statusCode }
    );
  }
};

/**
 * Custom error classes for API responses
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
