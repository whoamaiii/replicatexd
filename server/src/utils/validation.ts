/**
 * Validates that a string is a valid UUID v4
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Sanitizes and validates a project ID or generation ID
 * Throws an error if the ID is invalid or contains path traversal attempts
 */
export function validateId(id: string, paramName: string = 'id'): string {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid ${paramName}: must be a non-empty string`)
  }

  const trimmed = id.trim()

  // Check for path traversal attempts
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error(`Invalid ${paramName}: contains illegal characters`)
  }

  // Validate UUID format
  if (!isValidUUID(trimmed)) {
    throw new Error(`Invalid ${paramName}: must be a valid UUID`)
  }

  return trimmed
}

/**
 * Sanitizes a filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: must be a non-empty string')
  }

  // Remove any path components
  const basename = filename.split(/[/\\]/).pop() || ''

  // Remove any characters that aren't alphanumeric, dash, underscore, or dot
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_')

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    throw new Error('Invalid filename after sanitization')
  }

  return sanitized
}
