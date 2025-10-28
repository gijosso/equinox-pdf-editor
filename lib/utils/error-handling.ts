// Base error types
export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number
  abstract readonly isRetryable: boolean

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    }
  }
}

// Generic error class for fallback cases
export class GenericError extends AppError {
  readonly code = "GENERIC_ERROR" as const
  readonly statusCode = 500
  readonly isRetryable = false

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

// Database-related errors
export class DatabaseError extends AppError {
  readonly code = "DATABASE_ERROR" as const
  readonly statusCode = 500
  readonly isRetryable = true

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class DocumentNotFoundError extends AppError {
  readonly code = "DOCUMENT_NOT_FOUND" as const
  readonly statusCode = 404
  readonly isRetryable = false

  constructor(documentId: string) {
    super(`Document with id "${documentId}" not found`, {documentId})
  }
}

export class AnnotationNotFoundError extends AppError {
  readonly code = "ANNOTATION_NOT_FOUND" as const
  readonly statusCode = 404
  readonly isRetryable = false

  constructor(annotationId: string) {
    super(`Annotation with id "${annotationId}" not found`, {annotationId})
  }
}

export class EditorNotFoundError extends AppError {
  readonly code = "EDITOR_NOT_FOUND" as const
  readonly statusCode = 404
  readonly isRetryable = false

  constructor(documentId: string) {
    super(`Editor state for document "${documentId}" not found`, {documentId})
  }
}

export class VersionNotFoundError extends AppError {
  readonly code = "VERSION_NOT_FOUND" as const
  readonly statusCode = 404
  readonly isRetryable = false

  constructor(versionId: string) {
    super(`Version with id "${versionId}" not found`, {versionId})
  }
}

export class EditNotFoundError extends AppError {
  readonly code = "EDIT_NOT_FOUND" as const
  readonly statusCode = 404
  readonly isRetryable = false

  constructor(editId: string) {
    super(`Edit with id "${editId}" not found`, {editId})
  }
}

export class TextEditNotFoundError extends AppError {
  readonly code = "TEXT_EDIT_NOT_FOUND" as const
  readonly statusCode = 404
  readonly isRetryable = false

  constructor(textEditId: string) {
    super(`Text edit with id "${textEditId}" not found`, {textEditId})
  }
}

// File-related errors
export class FileError extends AppError {
  readonly code = "FILE_ERROR" as const
  readonly statusCode = 400
  readonly isRetryable = false
}

export class FileSizeError extends AppError {
  readonly code = "FILE_SIZE_ERROR" as const
  readonly statusCode = 413
  readonly isRetryable = false

  constructor(maxSize: number, actualSize: number) {
    super(`File size exceeds maximum allowed size of ${maxSize} bytes. Actual size: ${actualSize} bytes`, {
      maxSize,
      actualSize,
    })
  }
}

export class FileTypeError extends AppError {
  readonly code = "FILE_TYPE_ERROR" as const
  readonly statusCode = 415
  readonly isRetryable = false

  constructor(expectedType: string, actualType: string) {
    super(`Invalid file type. Expected: ${expectedType}, Actual: ${actualType}`, {
      expectedType,
      actualType,
    })
  }
}

export class FileCorruptedError extends AppError {
  readonly code = "FILE_CORRUPTED_ERROR" as const
  readonly statusCode = 422
  readonly isRetryable = false

  constructor(filename: string) {
    super(`File "${filename}" appears to be corrupted or invalid`, {filename})
  }
}

// Validation errors
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR" as const
  readonly statusCode = 400
  readonly isRetryable = false

  constructor(message: string, field?: string, value?: unknown) {
    super(message, {field, value})
  }
}

// Network/API errors
export class NetworkError extends AppError {
  readonly code = "NETWORK_ERROR" as const
  readonly statusCode = 0
  readonly isRetryable = true

  constructor(message: string, originalError?: Error) {
    super(message, {originalError: originalError?.message})
  }
}

// PDF processing errors
export class PDFProcessingError extends AppError {
  readonly code = "PDF_PROCESSING_ERROR" as const
  readonly statusCode = 422
  readonly isRetryable = false

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

// Generic error handler
export class ErrorHandler {
  /**
   * Handles errors consistently across the application
   */
  static handle(error: unknown, context?: Record<string, unknown>): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error
    }

    // If it's a standard Error, wrap it appropriately
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes("database") || error.message.includes("Dexie")) {
        return new DatabaseError(error.message, context)
      }

      if (error.message.includes("network") || error.message.includes("fetch")) {
        return new NetworkError(error.message, error)
      }

      if (error.message.includes("PDF") || error.message.includes("pdf")) {
        return new PDFProcessingError(error.message, context)
      }

      // Default to a generic error
      return new GenericError(error.message, context)
    }

    // Handle non-Error objects
    const message = typeof error === "string" ? error : "An unknown error occurred"
    return new GenericError(message, context)
  }

  /**
   * Logs errors consistently
   */
  static log(error: AppError, additionalContext?: Record<string, unknown>): void {
    const logData = {
      ...error.toJSON(),
      ...additionalContext,
      timestamp: new Date().toISOString(),
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Application Error:", logData)
    } else {
      // In production, you might want to send to an error tracking service
      console.error("Application Error:", logData)
    }
  }

  static getUserMessage(error: AppError): string {
    switch (error.code) {
      case "DOCUMENT_NOT_FOUND":
        return "The requested document could not be found."
      case "ANNOTATION_NOT_FOUND":
        return "The requested annotation could not be found."
      case "EDITOR_NOT_FOUND":
        return "Editor state could not be loaded."
      case "VERSION_NOT_FOUND":
        return "The requested version could not be found."
      case "EDIT_NOT_FOUND":
        return "The requested edit could not be found."
      case "FILE_SIZE_ERROR":
        return "The file is too large. Please choose a smaller file."
      case "FILE_TYPE_ERROR":
        return "Invalid file type. Please upload a PDF file."
      case "FILE_CORRUPTED_ERROR":
        return "The file appears to be corrupted. Please try a different file."
      case "VALIDATION_ERROR":
        return error.message
      case "NETWORK_ERROR":
        return "Network error occurred. Please check your connection and try again."
      case "PDF_PROCESSING_ERROR":
        return "Error processing PDF. The file may be corrupted or unsupported."
      case "DATABASE_ERROR":
        return "A database error occurred. Please try again."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }
}

// Result type for consistent error handling
export type Result<T, E extends AppError = AppError> = {success: true; data: T} | {success: false; error: E}

// Utility function to create success results
export function success<T>(data: T): Result<T> {
  return {success: true, data}
}

// Utility function to create error results
export function failure<E extends AppError>(error: E): Result<never, E> {
  return {success: false, error}
}

// Utility function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<Result<T>> {
  try {
    const data = await operation()
    return success(data)
  } catch (error) {
    const appError = ErrorHandler.handle(error, context)
    ErrorHandler.log(appError, context)
    return failure(appError)
  }
}

// Utility function to wrap database operations with error handling
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<Result<T, DatabaseError>> {
  try {
    const data = await operation()
    return {success: true, data}
  } catch (error) {
    const appError = ErrorHandler.handle(error, context)
    ErrorHandler.log(appError, context)
    // Convert AppError to DatabaseError
    const dbError =
      appError instanceof DatabaseError
        ? appError
        : new DatabaseError(appError.message, {...appError.context, ...context})
    return {success: false, error: dbError}
  }
}
