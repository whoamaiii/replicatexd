# Prompt Engineering Guide

Strategies for optimizing multi-flavor prompts in PsyVis Lab.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Overview](#overview)
2. [The Six Prompt Flavors](#the-six-prompt-flavors)
3. [How Prompts Are Constructed](#how-prompts-are-constructed)
4. [Flavor Selection Guide](#flavor-selection-guide)
5. [Customization Strategies](#customization-strategies)
6. [Model-Specific Optimization](#model-specific-optimization)
7. [Advanced Techniques](#advanced-techniques)
8. [Best Practices](#best-practices)

---

## Overview

PsyVis Lab generates **6 distinct prompt flavors** from each analysis, optimized for different creative goals and AI models. Understanding these flavors helps you achieve precise artistic control.

**Why multiple flavors?**
- Different AI models respond better to different prompt styles
- Creative goals vary (realism vs abstraction, precision vs freedom)
- External tools (Midjourney, Stable Diffusion) have unique syntax

---

## The Six Prompt Flavors

### 1. Structural (Surface-Locked)

**Philosophy**: Preserve composition, embed effects in surfaces

**Characteristics**:
- Emphasizes surface-locked geometry
- Includes structural constraints from maps
- Preserves recognizable elements
- Uses placement plan from router

**Example**:
```
A forest path with sunlight filtering through foliage. Enhanced color saturation (0.7)
with vivid greens and warm yellows. Gentle breathing motion (0.5) on moss surfaces,
following depth contours. Geometric patterns (0.6) embedded in tree bark texture,
locked to surface normals. Subject region: path and trees. Background: distant foliage.
Preserve edges, maintain composition.
```

**Best for**:
- Keeping subjects recognizable
- Architectural photography
- Portraits where identity matters
- Nature photography with clear subjects

**When to use**: Default choice for most use cases

---

### 2. Poetic (Lyrical Description)

**Philosophy**: Metaphorical, emotionally evocative language

**Characteristics**:
- Describes the *feeling* of effects
- Uses analogies and metaphors
- Less technical, more artistic
- Emphasizes emotional tone

**Example**:
```
A living forest where sunlight breathes through leaves like gentle waves. Colors pulse
with saturated life—emerald greens that seem to glow from within, amber light dancing
between branches. The bark whispers with hidden patterns, organic geometries revealing
themselves like nature's secret language. Everything moves as if the forest itself is
breathing, alive and aware.
```

**Best for**:
- Artistic interpretation
- Abstract or surreal outputs
- Emotional/spiritual themes
- Creative freedom over precision

**When to use**: When you want artistic license, not literal translation

---

### 3. Technical (Explicit Taxonomy)

**Philosophy**: Precise effect catalog language

**Characteristics**:
- Uses exact effect names from catalog
- Includes numerical intensities
- References spatial scales
- Minimal artistic interpretation

**Example**:
```
Base scene: forest path with dappled sunlight. Effects: color_enhancement intensity=0.7
scales=[macro,meso], breathing_surfaces intensity=0.5 scales=[meso],
geometric_patterning intensity=0.6 scales=[micro] on bark textures. Pattern
recognition enhancement active. Preserve structural edges. Surface lock strength: 0.8.
```

**Best for**:
- Predictable, repeatable results
- Research and documentation
- A/B testing effect variations
- Integration with structured generation systems

**When to use**: When precision and reproducibility matter most

---

### 4. Experimental (Novel Combinations)

**Philosophy**: Unexpected pairings, creative exploration

**Characteristics**:
- Mixes effects in unconventional ways
- Adds surprising elements
- Combines substance signatures
- Encourages model creativity

**Example**:
```
Forest path dissolving into crystalline geometry—organic breathing merged with alien
lattice structures. Colors shift beyond natural spectrum, pulsing with DMT-like
intensity while maintaining psilocybin's organic flow. Bark textures morph into
impossible fractals, each layer revealing nested worlds. Reality softens at edges,
inviting the viewer into hyperspace hidden within ordinary nature.
```

**Best for**:
- Discovery and surprise
- Novel aesthetic territories
- Cross-substance blends
- Pushing creative boundaries

**When to use**: When you want unexpected, unique outputs

---

### 5. Hybrid (Balanced Approach)

**Philosophy**: Combine multiple strategies

**Characteristics**:
- Structural foundation + poetic elements
- Technical precision + creative freedom
- Router guidance + artistic interpretation
- Best of all approaches

**Example**:
```
A forest path bathed in living light. [Structural] Subject: moss-covered path and tree
trunks, background: distant foliage. [Poetic] Colors breathe with enhanced saturation
(0.7), greens that pulse with life-force. [Technical] breathing_surfaces (0.5) on
moss and bark, surface-locked. [Creative] Subtle geometric whispers emerge in bark
grain, as if the forest is revealing hidden mathematics. Depth layered: vivid near,
soft geometric mid, atmospheric far.
```

**Best for**:
- General use when unsure
- Balancing realism and creativity
- Complex multi-region compositions
- Professional-quality outputs

**When to use**: Versatile default for advanced users

---

### 6. Minimal (Concise Essentials)

**Philosophy**: Shortest viable prompt, maximum efficiency

**Characteristics**:
- Core scene + key effects only
- No elaboration or redundancy
- Token-efficient
- Model fills in details

**Example**:
```
Forest path, dappled light. Enhanced color (0.7), breathing surfaces (0.5), subtle
geometry in bark. Preserve structure.
```

**Best for**:
- Token-limited models
- Fast iteration
- Simple scenes
- Letting model interpret freely

**When to use**: When brevity matters or model handles elaboration well

---

## How Prompts Are Constructed

### Base Components

All prompts include:

1. **Base Scene Description** (from vision analysis)
2. **Effect Instructions** (from detected effects)
3. **Router Placement** (if enabled)
4. **Map Guidance** (if maps generated)
5. **Surface Lock** (if applicable)

### Construction Pipeline

```typescript
function buildPrompt(analysis: ImageAnalysisResult, flavor: PromptFlavor): string {
  let prompt = ''

  // 1. Base scene
  prompt += analysis.baseSceneDescription

  // 2. Add effects (style varies by flavor)
  if (flavor === 'technical') {
    prompt += formatEffectsTechnical(analysis.effects)
  } else if (flavor === 'poetic') {
    prompt += formatEffectsPoetic(analysis.effects)
  }
  // ... etc for each flavor

  // 3. Add router plan if enabled
  if (routerSettings?.enabled) {
    prompt += buildPlacementPlan(analysis.effects, routerSettings)
  }

  // 4. Add map guidance if available
  if (mapSettings) {
    prompt += buildMapGuidance(mapSettings)
  }

  return prompt
}
```

### Effect Formatting by Flavor

**Structural**:
```
"Geometric patterns (intensity 0.8) embedded in surface textures, following normal maps"
```

**Poetic**:
```
"Hidden geometries whisper through textures, revealing themselves like secret languages"
```

**Technical**:
```
"geometric_patterning intensity=0.8 scales=[micro] surface_locked=true"
```

---

## Flavor Selection Guide

### Decision Tree

```
Are you using external tool (Midjourney, etc.)?
├─ Yes → Copy appropriate flavor and adapt syntax
│
└─ No → Generating with PsyVis Lab?
    │
    ├─ Need recognizable subjects? → Structural
    │
    ├─ Want artistic freedom? → Poetic or Experimental
    │
    ├─ Need reproducibility? → Technical
    │
    ├─ Unsure? → Hybrid
    │
    └─ Token limits? → Minimal
```

### By Use Case

**Portrait Photography**:
- 1st choice: Structural
- 2nd choice: Hybrid
- Avoid: Experimental (may distort identity)

**Abstract Art**:
- 1st choice: Experimental or Poetic
- 2nd choice: Hybrid
- Avoid: Structural (too constrained)

**Nature Photography**:
- 1st choice: Structural or Hybrid
- 2nd choice: Poetic
- Good for all except Minimal

**Research/Documentation**:
- 1st choice: Technical
- 2nd choice: Structural
- Avoid: Poetic, Experimental

**Architectural**:
- 1st choice: Structural
- 2nd choice: Technical
- Avoid: Experimental

---

## Customization Strategies

### Manual Prompt Editing

After copying prompt, you can:

**Add negative prompts**:
```
[Your prompt here]

Avoid: blurry, low quality, distorted anatomy, floating overlays
```

**Adjust weights**:
```
forest path (emphasis: vivid colors:1.3), (subtle geometry:0.8)
```

**Add style modifiers**:
```
[Your prompt here] in the style of Alex Grey, fractal art, visionary painting
```

### Combining Flavors

**Take best parts** from multiple flavors:

```
[Structural base] + [Poetic atmosphere] + [Technical precision]

A forest path with dappled sunlight [structural]. Colors breathe with living
saturation—emerald greens pulsing with bio-luminescent warmth [poetic].
color_enhancement=0.7, breathing_surfaces=0.5, geometric_patterning=0.6
[technical]. Surface locked to bark normals, preserve edges [structural].
```

### Adding Context

**Time of day**:
```
[Prompt] during golden hour, late afternoon light
```

**Weather/atmosphere**:
```
[Prompt] with morning mist, soft diffused light
```

**Camera parameters** (for photorealistic):
```
[Prompt] shot on 35mm film, shallow depth of field, f/2.8
```

---

## Model-Specific Optimization

### Midjourney

**Adaptations**:
- Use comma-separated keywords
- Add aspect ratio: `--ar 16:9`
- Include style parameters: `--style raw` or `--style expressive`
- Use double colons for weight: `forest::1.5 geometry::0.8`

**Example**:
```
forest path, dappled sunlight, enhanced colors, breathing textures, geometric bark
patterns, psychedelic, visionary art, intricate details --ar 16:9 --style raw --v 6
```

### Stable Diffusion

**Adaptations**:
- Use parentheses for emphasis: `(vivid colors:1.3)`
- Add sampling parameters in metadata
- Include negative prompt separately
- Use LoRA/embedding tags if available

**Example**:
```
forest path with dappled sunlight, (enhanced color saturation:1.2), breathing surfaces,
(geometric patterns:1.1) in bark texture, surface locked, psychedelic, detailed

Negative: blurry, low quality, oversaturated, artificial
```

### DALL-E 3

**Adaptations**:
- Natural language (similar to Poetic flavor)
- Be specific about composition
- Avoid technical jargon
- Emphasize artistic style

**Example**:
```
A photograph of a forest path with sunlight filtering through leaves. The colors are
extraordinarily vivid and saturated, with the entire scene seeming to gently breathe
and pulse with life. Subtle geometric patterns appear naturally integrated into the
bark of the trees, as if revealing hidden structure. Highly detailed, photorealistic.
```

### Leonardo.ai

**Adaptations**:
- Use preset styles (e.g., "Cinematic", "Anime")
- Combine with Structural flavor
- Add quality tags: "highly detailed, 8k"

---

## Advanced Techniques

### Dose-Specific Prompt Scaling

**Low dose (0.0-0.3)**: Emphasize enhancements only
```
Subtle color enhancement, slight clarity boost, minimal pattern recognition
```

**Medium dose (0.4-0.7)**: Add distortions
```
Vivid colors, gentle breathing, flowing textures, emerging geometric hints
```

**High dose (0.8-1.0)**: Full effects
```
Intense color, strong breathing, complex fractals, reality-bending geometry,
hallucination elements
```

### Multi-Stage Prompting

**Stage 1**: Generate base image
```
Forest path, natural lighting [no effects]
```

**Stage 2**: Apply effects via img2img
```
Transform with [effect prompt], strength: 0.7
```

### Negative Space Prompting

**For router protection**:
```
[Effect prompt] BUT preserve face identity exactly, keep hands anatomically correct,
maintain recognizable subject
```

---

## Best Practices

### Do:
- ✅ Start with Structural or Hybrid for first attempts
- ✅ Use Technical for research and reproducibility
- ✅ Copy and adapt prompts for external tools
- ✅ Combine router settings with appropriate flavors
- ✅ Iterate on prompt style based on results
- ✅ Keep notes on which flavors work best for your use cases

### Don't:
- ❌ Mix incompatible flavors without editing (Technical + Poetic)
- ❌ Use Minimal flavor for complex multi-region scenes
- ❌ Ignore router placement when it's important
- ❌ Copy prompts verbatim across different AI models without adaptation
- ❌ Use Experimental flavor when reproducibility matters

### Tips:
- **Test flavors** on same analysis to find preferences
- **Save successful prompts** for future reference
- **Adjust intensity** multipliers in router instead of editing prompts
- **Use maps** to improve structural flavor accuracy
- **Combine flavors** manually for best results

---

## Additional Resources

- [User Guide](./USER_GUIDE.md) - Basic prompt usage
- [Router Guide](./ROUTER_GUIDE.md) - Effect placement
- [Effects Catalog](./effects_catalog.md) - Effect families + intensity guide
- [Substance Profiles](./substance_visual_profiles.md) - Phenomenology

---

**Questions?** Check the [FAQ](./FAQ.md) or open an issue on [GitHub](https://github.com/your-repo/issues)
