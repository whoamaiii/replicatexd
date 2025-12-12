import { Buffer } from 'node:buffer'

export function float32ToBase64(vec: Float32Array): string {
  return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength).toString('base64')
}

export function base64ToFloat32(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64')
  // Copy into a new ArrayBuffer so the returned Float32Array is not backed by a larger Buffer.
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  // If length isn't divisible by 4, this will throw; that's fine (corrupt index).
  return new Float32Array(ab)
}

export function l2Normalize(vec: Float32Array): Float32Array {
  let sum = 0
  for (let i = 0; i < vec.length; i++) sum += vec[i]! * vec[i]!
  const norm = Math.sqrt(sum)
  if (!Number.isFinite(norm) || norm <= 0) return vec
  const out = new Float32Array(vec.length)
  for (let i = 0; i < vec.length; i++) out[i] = vec[i]! / norm
  return out
}

export function dot(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length)
  let sum = 0
  for (let i = 0; i < n; i++) sum += a[i]! * b[i]!
  return sum
}

