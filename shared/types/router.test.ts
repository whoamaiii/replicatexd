import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// RouterSettingsSchema mirrors what's in server/src/routes/generate.ts
// This ensures validation consistency
const RouterSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    defaultRegions: z.array(z.enum(['face', 'hands', 'subject', 'background', 'global'])).optional(),
    defaultDepthBands: z.array(z.enum(['near', 'mid', 'far'])).optional(),
    protectFace: z.boolean().optional(),
    protectHands: z.boolean().optional(),
    protectEdges: z.boolean().optional(),
    surfaceLockStrength: z.number().min(0).max(1).optional(),
    groupMultipliers: z
      .object({
        enhancements: z.number().optional(),
        distortions: z.number().optional(),
        geometry: z.number().optional(),
        hallucinations: z.number().optional(),
        perceptual: z.number().optional(),
      })
      .optional(),
    rules: z
      .array(
        z.object({
          effectId: z.string(),
          regions: z.array(z.enum(['face', 'hands', 'subject', 'background', 'global'])),
          depthBands: z.array(z.enum(['near', 'mid', 'far'])),
          strength: z.number().min(0).max(2),
          protectEdges: z.boolean(),
        }),
      )
      .optional(),
  })
  .optional()

describe('RouterSettings validation', () => {
  describe('valid settings', () => {
    it('accepts undefined (all optional)', () => {
      const result = RouterSettingsSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('accepts empty object', () => {
      const result = RouterSettingsSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('accepts complete valid settings', () => {
      const validSettings = {
        enabled: true,
        defaultRegions: ['subject', 'background'],
        defaultDepthBands: ['near', 'mid', 'far'],
        protectFace: true,
        protectHands: true,
        protectEdges: true,
        surfaceLockStrength: 0.6,
        groupMultipliers: {
          enhancements: 1.0,
          distortions: 1.0,
          geometry: 1.5,
          hallucinations: 0.5,
          perceptual: 1.0,
        },
        rules: [
          {
            effectId: 'breathing',
            regions: ['subject'],
            depthBands: ['near', 'mid'],
            strength: 1.2,
            protectEdges: true,
          },
        ],
      }

      const result = RouterSettingsSchema.safeParse(validSettings)
      expect(result.success).toBe(true)
    })

    it('accepts partial settings', () => {
      const partialSettings = {
        protectFace: false,
        surfaceLockStrength: 0.8,
      }

      const result = RouterSettingsSchema.safeParse(partialSettings)
      expect(result.success).toBe(true)
    })

    it('accepts boundary values for surfaceLockStrength', () => {
      expect(RouterSettingsSchema.safeParse({ surfaceLockStrength: 0 }).success).toBe(true)
      expect(RouterSettingsSchema.safeParse({ surfaceLockStrength: 1 }).success).toBe(true)
      expect(RouterSettingsSchema.safeParse({ surfaceLockStrength: 0.5 }).success).toBe(true)
    })

    it('accepts boundary values for rule strength', () => {
      const ruleWithMinStrength = {
        rules: [{
          effectId: 'test',
          regions: ['subject'],
          depthBands: ['mid'],
          strength: 0,
          protectEdges: false,
        }],
      }
      const ruleWithMaxStrength = {
        rules: [{
          effectId: 'test',
          regions: ['subject'],
          depthBands: ['mid'],
          strength: 2,
          protectEdges: false,
        }],
      }

      expect(RouterSettingsSchema.safeParse(ruleWithMinStrength).success).toBe(true)
      expect(RouterSettingsSchema.safeParse(ruleWithMaxStrength).success).toBe(true)
    })
  })

  describe('invalid settings', () => {
    it('rejects invalid region value', () => {
      const result = RouterSettingsSchema.safeParse({
        defaultRegions: ['invalid_region'],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errorMessage = result.error.issues[0].message
        expect(errorMessage).toContain('Invalid enum value')
      }
    })

    it('rejects invalid depth band value', () => {
      const result = RouterSettingsSchema.safeParse({
        defaultDepthBands: ['close'],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid enum value')
      }
    })

    it('rejects surfaceLockStrength below 0', () => {
      const result = RouterSettingsSchema.safeParse({
        surfaceLockStrength: -0.1,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Number must be greater than or equal to 0')
      }
    })

    it('rejects surfaceLockStrength above 1', () => {
      const result = RouterSettingsSchema.safeParse({
        surfaceLockStrength: 1.1,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Number must be less than or equal to 1')
      }
    })

    it('rejects rule strength above 2', () => {
      const result = RouterSettingsSchema.safeParse({
        rules: [{
          effectId: 'test',
          regions: ['subject'],
          depthBands: ['mid'],
          strength: 2.1,
          protectEdges: false,
        }],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Number must be less than or equal to 2')
      }
    })

    it('rejects rule with missing required fields', () => {
      const result = RouterSettingsSchema.safeParse({
        rules: [{
          effectId: 'test',
          // missing regions, depthBands, strength, protectEdges
        }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-boolean for protectFace', () => {
      const result = RouterSettingsSchema.safeParse({
        protectFace: 'yes',
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-number for groupMultipliers', () => {
      const result = RouterSettingsSchema.safeParse({
        groupMultipliers: {
          geometry: 'high',
        },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('error messages', () => {
    it('provides clear error for invalid region', () => {
      const result = RouterSettingsSchema.safeParse({
        defaultRegions: ['arm'],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.path).toContain('defaultRegions')
      }
    })

    it('provides clear error path for nested rule errors', () => {
      const result = RouterSettingsSchema.safeParse({
        rules: [{
          effectId: 'test',
          regions: ['invalid'],
          depthBands: ['mid'],
          strength: 1,
          protectEdges: false,
        }],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.path.join('.')).toContain('rules')
      }
    })
  })
})
