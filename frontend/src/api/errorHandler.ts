import { isAxiosError } from 'axios';

export interface AppError {
  message: string;
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function parseApiError(error: unknown): AppError {
  if (isAxiosError(error)) {
    // If we have a specific error message format from our backend:
    const backendMessage = error.response?.data?.message;
    if (backendMessage && typeof backendMessage === 'string') {
      return {
        message: backendMessage,
        statusCode: error.response?.status,
        code: error.code,
      };
    }
    
    // Fallback for standard Axios errors
    return {
      message: error.message,
      statusCode: error.response?.status,
      code: error.code,
    };
  }

  // Handle generic JavaScript Errors
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Absolute fallback
  return {
    message: 'An unexpected error occurred. Please try again later.',
  };
}
