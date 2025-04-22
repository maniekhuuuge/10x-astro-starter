/**
 * Utility for logging errors with additional context
 */
export class ErrorLogger {
  /**
   * Logs an error with context information
   * @param error - The error object
   * @param context - Additional context information
   */
  static logError(error: unknown, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const logEntry = {
      timestamp,
      message: errorMessage,
      stack: errorStack,
      ...context
    };
    
    console.error('ERROR LOG:', JSON.stringify(logEntry));
  }
  
  /**
   * Logs a database operation error
   * @param operation - The database operation that failed
   * @param error - The error object
   * @param details - Additional details about the operation
   */
  static logDatabaseError(operation: string, error: unknown, details?: Record<string, unknown>): void {
    this.logError(error, {
      type: 'DATABASE_ERROR',
      operation,
      ...details
    });
  }
  
  /**
   * Logs a validation error
   * @param errors - Validation error messages
   * @param inputData - The input data that failed validation (sensitive data should be masked)
   */
  static logValidationError(errors: string[], inputData?: unknown): void {
    // Mask or sanitize sensitive data if needed
    const sanitizedData = inputData ? this.sanitizeData(inputData) : undefined;
    
    this.logError(new Error('Validation Error'), {
      type: 'VALIDATION_ERROR',
      validationErrors: errors,
      inputData: sanitizedData
    });
  }
  
  /**
   * Sanitizes potentially sensitive data before logging
   * @param data - The data to sanitize
   * @returns Sanitized data object
   */
  private static sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    // For this implementation, we'll just check if the object has certain
    // sensitive fields and mask them
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
} 