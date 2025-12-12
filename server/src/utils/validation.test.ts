import { describe, it, expect } from 'vitest'
import { isValidUUID, validateId, sanitizeFilename } from './validation'

describe('isValidUUID', () => {
  it('should return true for valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false) // v1
  })

  it('should return false for invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('')).toBe(false)
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
  })
})

describe('validateId', () => {
  it('should accept valid UUID', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000'
    expect(validateId(validUUID)).toBe(validUUID)
  })

  it('should reject path traversal attempts', () => {
    expect(() => validateId('../etc/passwd')).toThrow('contains illegal characters')
    expect(() => validateId('foo/../bar')).toThrow('contains illegal characters')
    expect(() => validateId('foo/bar')).toThrow('contains illegal characters')
    expect(() => validateId('foo\\bar')).toThrow('contains illegal characters')
  })

  it('should reject invalid UUIDs', () => {
    expect(() => validateId('not-a-uuid')).toThrow('must be a valid UUID')
    expect(() => validateId('')).toThrow('must be a non-empty string')
  })

  it('should include parameter name in error message', () => {
    expect(() => validateId('invalid', 'projectId')).toThrow('Invalid projectId')
  })
})

describe('sanitizeFilename', () => {
  it('should allow safe filenames', () => {
    expect(sanitizeFilename('image.png')).toBe('image.png')
    expect(sanitizeFilename('my-file_123.jpg')).toBe('my-file_123.jpg')
  })

  it('should sanitize unsafe characters', () => {
    expect(sanitizeFilename('file name.txt')).toBe('file_name.txt')
    expect(sanitizeFilename('file@#$.txt')).toBe('file___.txt')
  })

  it('should remove path components', () => {
    expect(sanitizeFilename('/etc/passwd')).toBe('passwd')
    expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd')
    expect(sanitizeFilename('path/to/file.txt')).toBe('file.txt')
  })

  it('should reject invalid filenames', () => {
    expect(() => sanitizeFilename('')).toThrow('must be a non-empty string')
    expect(() => sanitizeFilename('.')).toThrow('Invalid filename after sanitization')
    expect(() => sanitizeFilename('..')).toThrow('Invalid filename after sanitization')
  })
})
