# Router Guide

Advanced guide to the Effect Router system for precise control over psychedelic effect placement.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Overview](#overview)
2. [How the Router Works](#how-the-router-works)
3. [Region Targeting](#region-targeting)
4. [Depth Band Targeting](#depth-band-targeting)
5. [Group Multipliers](#group-multipliers)
6. [Per-Effect Rules](#per-effect-rules)
7. [Surface Lock Mechanics](#surface-lock-mechanics)
8. [Map Integration](#map-integration)
9. [Advanced Routing Strategies](#advanced-routing-strategies)
10. [Practical Examples](#practical-examples)

---

## Overview

The **Effect Router** gives granular control over **where** effects manifest in generated images. Without routing, all detected effects apply globally. With routing, you can:

- Apply geometry only to the background
- Protect faces from distortions
- Enhance colors only in the foreground
- Route effects by depth (near/mid/far)
- Scale entire effect groups up or down

**When to use**:
- Portrait generation (protect identity)
- Architectural images (preserve structure)
- Precise artistic control
- Multi-element compositions (separate treatment for each region)

---

## How the Router Works

### Processing Pipeline

```
1. Analysis detects effects with intensities
   │
   ├─→ color_enhancement: 0.7
   ├─→ breathing: 0.5
   ├─→ geometric_patterning: 0.8
   └─→ ...
   │
2. Router settings define placement rules
   │
   ├─→ Default regions: [subject, background]
   ├─→ Default depth bands: [mid, far]
   ├─→ Group multipliers: { geometry: 1.5 }
   ├─→ Per-effect rules: [breathing → face only]
   │
3. Router service generates placement plan
   │
   ├─→ "Apply color_enhancement at 0.7 to subject+background, mid+far depth"
   ├─→ "Apply breathing at 0.5 to face only, all depths"
   ├─→ "Apply geometric_patterning at 1.2 (0.8 × 1.5) to subject+background"
   │
4. Placement plan added to generation prompt
   │
5. Image model follows routing instructions
```

### Placement Plan Format

The router generates human-readable instructions:

```
Effect Placement Plan:
- color_enhancement (0.70): subject, background | mid, far depths
- breathing (0.50): face only | all depths | protect edges
- geometric_patterning (1.20): background only | far depth | surface locked
```

This text is appended to the generation prompt to guide the AI model.

---

## Region Targeting

### Available Regions

**face** - Detected face areas
- Requires: Face mask from map generation
- Use for: Protecting identity, face-specific effects

**hands** - Detected hand areas
- Requires: Hands mask from map generation
- Use for: Protecting anatomy, hand-specific effects

**subject** - Main focal point or foreground
- Detected via: Segmentation or depth (nearest regions)
- Use for: Emphasizing primary content

**background** - Everything behind the subject
- Detected via: Inverse of subject mask
- Use for: Environmental effects, context

**global** - Entire image uniformly
- Always available
- Use for: Universal effects (color shifts, overall tone)

### Region Detection Logic

```typescript
// Simplified region detection
function detectRegions(image, maps) {
  const regions = {
    face: maps.faceMask || null,
    hands: maps.handsMask || null,
    subject: detectSubjectFromDepth(maps.depth) || detectSubjectFromSegmentation(maps.segmentation),
    background: invert(subject),
    global: fullImageMask,
  }
  return regions
}
```

### Setting Default Regions

**In UI**: Select checkboxes in Effect Router Panel

**In API request**:
```typescript
{
  routerSettings: {
    enabled: true,
    defaultRegions: ['subject', 'background'], // Effects apply here by default
    protectFace: true,   // Override: never apply to face
    protectHands: true,  // Override: never apply to hands
  }
}
```

**Effect**: All effects will target `subject + background` unless overridden by per-effect rules.

---

## Depth Band Targeting

### Depth Bands

Requires depth map from map generation.

**near** - Objects closest to camera (depth < 0.33)
- Use for: Foreground emphasis, near-field effects

**mid** - Middle-distance elements (0.33 ≤ depth < 0.67)
- Use for: Primary content, balanced effects

**far** - Background and distant objects (depth ≥ 0.67)
- Use for: Environmental atmosphere, distant geometry

### Depth-Based Routing

**Example use case**: Apply breathing only to mid-ground foliage, not foreground flowers or distant mountains.

```typescript
{
  routerSettings: {
    enabled: true,
    defaultDepthBands: ['mid', 'far'],
    rules: [
      {
        effectId: 'breathing',
        regions: ['subject'],
        depthBands: ['mid'],  // Only mid-depth
        strength: 0.8,
        protectEdges: false,
      },
    ],
  }
}
```

**Result**: Breathing applies only to mid-depth portions of the subject region.

---

## Group Multipliers

Scale entire effect categories uniformly.

### Available Groups

- **enhancements**: Color, contrast, acuity, pattern recognition
- **distortions**: Breathing, drifting, morphing, tracers
- **geometry**: Fractals, mandalas, form constants
- **hallucinations**: Entities, scene replacement
- **perceptual**: Synesthesia, time distortion, depth shifts

### Multiplier Values

- **0.0**: Disable group completely
- **0.5**: Reduce group to half strength
- **1.0**: Normal strength (default)
- **1.5**: Boost group by 50%
- **2.0**: Double strength (maximum recommended)

### Example

**Goal**: Strong geometry, minimal hallucinations

```typescript
{
  groupMultipliers: {
    geometry: 1.8,       // 80% boost
    hallucinations: 0.2, // 80% reduction
  }
}
```

**Effect**: If `geometric_patterning` was detected at 0.6, it becomes 0.6 × 1.8 = **1.08** (clamped to 1.0).

If `entity_encounters` was detected at 0.5, it becomes 0.5 × 0.2 = **0.1** (barely visible).

---

## Per-Effect Rules

Override specific effects with custom placement.

### Rule Structure

```typescript
{
  effectId: string           // Effect to override (e.g., "breathing")
  regions: string[]          // Where to apply (e.g., ["face", "subject"])
  depthBands: string[]       // Which depths (e.g., ["near", "mid"])
  strength: number           // Multiplier 0.0-2.0
  protectEdges: boolean      // Preserve structural boundaries
}
```

### Rule Priority

1. **Per-effect rules** override group multipliers and defaults
2. **Protection flags** (`protectFace`, `protectHands`) override everything
3. **Multiple rules** for same effect: Last rule wins

### Example Rules

**Enhance colors only on subject foreground**:
```typescript
{
  effectId: 'color_enhancement',
  regions: ['subject'],
  depthBands: ['near'],
  strength: 1.5,
  protectEdges: false,
}
```

**Apply breathing to entire background, preserve edges**:
```typescript
{
  effectId: 'breathing',
  regions: ['background'],
  depthBands: ['mid', 'far'],
  strength: 1.0,
  protectEdges: true,
}
```

**Geometry only on distant background**:
```typescript
{
  effectId: 'geometric_patterning',
  regions: ['background'],
  depthBands: ['far'],
  strength: 2.0,
  protectEdges: false,
}
```

---

## Surface Lock Mechanics

Controls how tightly geometric effects embed in image surfaces.

### Surface Lock Strength

**0.0** - Floating overlays
- Geometry appears as screen-space overlay
- Minimal interaction with scene structure
- Less realistic but more visible

**0.5** - Balanced (default)
- Geometry follows major surfaces
- Some independence from structure
- Good compromise

**1.0** - Maximum surface adhesion
- Geometry locked to every surface contour
- Follows normal maps and depth cues
- Most realistic psychedelic aesthetic

### How It Works

**Low surface lock** (0.0-0.3):
```
Prompt: "Add geometric patterns as overlay, minimal depth interaction"
```

**Medium surface lock** (0.4-0.7):
```
Prompt: "Geometric patterns follow major surfaces, respect depth"
```

**High surface lock** (0.8-1.0):
```
Prompt: "Geometric patterns embedded in every surface, follow normals and depth precisely"
```

### Recommended Values

- **Abstract art**: 0.2-0.4 (freedom to float)
- **Nature photography**: 0.6-0.8 (organic integration)
- **Architecture**: 0.8-1.0 (structure preservation)
- **Portraits**: 0.7-0.9 (realistic embedding)

---

## Map Integration

Router uses structural maps to guide placement.

### Map Types Used

**Depth Map** → Depth band targeting
- Segments image into near/mid/far
- Enables depth-based rules

**Segmentation** → Region detection
- Identifies subject vs background
- Provides semantic boundaries

**Face/Hands Masks** → Protection regions
- Prevents unwanted effects on critical anatomy
- Enables face/hand-specific rules

**Normal Map** → Surface lock
- Guides geometric pattern orientation
- Ensures effects follow curvature

**Edge Map** → Edge protection
- Preserves structural boundaries when `protectEdges: true`
- Prevents geometry from crossing object borders

### Without Maps

Router still functions but with reduced precision:
- No depth targeting (all depths treated equally)
- No face/hands protection
- Subject/background detected via heuristics
- Surface lock uses image gradients instead of normals

---

## Advanced Routing Strategies

### Strategy 1: Portrait with Geometric Background

**Goal**: Keep face recognizable, add geometry to background

```typescript
{
  enabled: true,
  defaultRegions: ['background'],
  defaultDepthBands: ['mid', 'far'],
  protectFace: true,
  protectHands: true,
  surfaceLockStrength: 0.8,
  groupMultipliers: {
    enhancements: 1.3,  // Boost colors everywhere
    geometry: 1.8,      // Strong geometry on background
    distortions: 0.4,   // Minimal distortions
  },
}
```

**Result**: Face intact with enhanced colors, background filled with geometric patterns.

---

### Strategy 2: Selective Breathing

**Goal**: Breathing on organic textures only, not hard edges

```typescript
{
  enabled: true,
  protectEdges: true,  // Global edge protection
  rules: [
    {
      effectId: 'breathing',
      regions: ['subject', 'background'],
      depthBands: ['all'],
      strength: 0.9,
      protectEdges: true,  // Preserve object boundaries
    },
  ],
}
```

**Result**: Breathing applies smoothly to surfaces, stops at edges (buildings, trees, etc. keep sharp boundaries).

---

### Strategy 3: Depth-Stratified Effects

**Goal**: Different effects at different depths

```typescript
{
  enabled: true,
  rules: [
    {
      effectId: 'color_enhancement',
      regions: ['global'],
      depthBands: ['near'],
      strength: 1.5,
    },
    {
      effectId: 'geometric_patterning',
      regions: ['global'],
      depthBands: ['mid'],
      strength: 1.2,
    },
    {
      effectId: 'visual_drifting',
      regions: ['global'],
      depthBands: ['far'],
      strength: 0.8,
    },
  ],
}
```

**Result**: Foreground has vivid colors, middle ground has geometry, background has subtle drifting.

---

### Strategy 4: Maximum Transformation

**Goal**: Intense effects everywhere except face

```typescript
{
  enabled: true,
  defaultRegions: ['global'],
  protectFace: true,
  surfaceLockStrength: 0.6,
  groupMultipliers: {
    enhancements: 1.8,
    distortions: 1.6,
    geometry: 2.0,
    hallucinations: 1.2,
  },
}
```

**Result**: Extreme transformation with face preserved as anchor point.

---

## Practical Examples

### Example 1: Architectural Photography

```typescript
{
  enabled: true,
  defaultRegions: ['background', 'subject'],
  protectEdges: true,
  surfaceLockStrength: 0.9,
  groupMultipliers: {
    geometry: 1.8,
    distortions: 0.5,
  },
  rules: [
    {
      effectId: 'geometric_patterning',
      regions: ['global'],
      depthBands: ['all'],
      strength: 1.5,
      protectEdges: true,
    },
  ],
}
```

**Result**: Building surfaces covered in geometric patterns that follow architectural lines, structural edges preserved.

---

### Example 2: Nature Scene with Foreground Focus

```typescript
{
  enabled: true,
  defaultRegions: ['background'],
  defaultDepthBands: ['far'],
  surfaceLockStrength: 0.7,
  rules: [
    {
      effectId: 'color_enhancement',
      regions: ['subject'],
      depthBands: ['near'],
      strength: 1.8,
    },
    {
      effectId: 'breathing',
      regions: ['background'],
      depthBands: ['mid', 'far'],
      strength: 1.0,
    },
  ],
}
```

**Result**: Foreground flowers have intense color enhancement, background foliage breathes gently.

---

### Example 3: Face Transformation (Entity Mode)

```typescript
{
  enabled: true,
  protectFace: false,  // Allow face transformation
  protectHands: true,
  groupMultipliers: {
    geometry: 2.0,
    hallucinations: 1.5,
  },
  rules: [
    {
      effectId: 'morphing_objects',
      regions: ['face'],
      depthBands: ['near'],
      strength: 1.8,
    },
    {
      effectId: 'geometric_patterning',
      regions: ['face'],
      depthBands: ['near'],
      strength: 2.0,
      protectEdges: false,
    },
  ],
}
```

**Result**: Face morphs and develops geometric patterns (entity-like transformation).

---

## Troubleshooting

**Effects not appearing in expected regions**:
- Check maps are generated (`POST /api/maps/ensure`)
- Verify region detection in map preview
- Try increasing effect strength multiplier

**Face still affected despite protection**:
- Ensure face mask generated successfully
- Check `protectFace: true` is set
- Some subtle enhancements may still apply (color, contrast)

**Geometry not following surfaces**:
- Increase `surfaceLockStrength` to 0.8+
- Ensure normal map generated
- Try `protectEdges: true` for clearer boundaries

**Depth targeting not working**:
- Verify depth map generated
- Check depth values in map preview
- Ensure depth bands set correctly in rules

---

## Additional Resources

- [User Guide](./USER_GUIDE.md) - Basic router usage
- [Maps Documentation](./maps_and_controls.md) - Structural maps
- [API Reference](./API_REFERENCE.md) - RouterSettings schema

---

**Questions?** Check the [FAQ](./FAQ.md) or open an issue on [GitHub](https://github.com/your-repo/issues)
