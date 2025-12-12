# Effects Catalog (Effects Studio)

`data/visual_effects.json` is the canonical effect catalog used by PsyVis Lab.

This document is a concise reference for how the catalog is organized and how to interpret intensities when editing an **Active Mix** in Effects Studio.

## Families

Effects Studio uses `family` for UI grouping. This is independent from the existing `group` (`enhancements`, `distortions`, `geometry`, `hallucinations`, `perceptual`), which remains the core analysis + prompt taxonomy.

### Amplification

Amplifications make normal perception feel “turned up” without fundamentally changing the geometry of the scene.

Typical signatures:
- richer color and contrast
- increased clarity, acuity, or pattern salience

Common failure modes:
- **HDR crunch** (too much local contrast) instead of “heightened clarity”
- **haloing** from aggressive sharpening/bloom
- **neon clipping** (oversaturated primaries) that stops looking photographic

### Suppression

Suppressions reduce or destabilize how visual information is perceived (clarity, color discrimination, interpretation).

Typical signatures:
- reduced saturation / “greyed out” palette
- blurred or doubled perception
- difficulty integrating features into a stable interpretation

Common failure modes:
- confusing **acuity suppression** with simple “blur filter” (it should feel like degraded perception, not just low-res)
- making suppression effects permanent and global when they should feel **intermittent** (especially peripheral misinterpretations)

### Distortion

Distortions warp, drift, segment, or otherwise transform pre-existing visual data.

Typical signatures:
- time-coherent warping (drifting, breathing, melting, flowing)
- optical artifacts (after images, tracers, diffraction)
- segmentation / slicing (cubism, orbism, scenery slicing)

Common failure modes:
- **camera shake** instead of surface-locked warping
- **shimmering** from frame-incoherent warps
- mixing up drifting substyles:
  - **breathing** = rhythmic expansion/contraction
  - **melting** = sagging/liquefying structure
  - **flowing** = texture advection along a “current”
  - **morphing** = shape/identity interpolation while staying anchored

### Geometry

Geometry covers structured planforms and repeating patterns, from low-level visual noise to fully immersive “breakthrough” structure.

Typical signatures:
- symmetry, tilings, lattices, tunnels, spirals
- pattern layers that can start surface-embedded and become immersive

Common failure modes:
- **floating overlays**: geometry should be surface-embedded unless explicitly at high override levels
- **wireframe cages / decals** sitting in front of the scene
- geometry that is “random noise” instead of structured, repeatable patterns

### Cognitive

Cognitive effects represent higher-order meaning, interpretation, and “content-like” experience.

Typical signatures:
- pareidolia, synesthetic coupling
- entity/scene-level hallucination motifs
- high-level geometry that feels “readable” (8A/8B)

Common failure modes:
- literal text labels or UI-like glyph overlays (keep meaning implied)
- jumping straight to full characters/entities without progression from structure

## Intensity (0 → 1)

All effect intensities are normalized from `0` to `1`.

Practical interpretation (guideline):
- `0.00` → absent
- `0.10–0.30` → subtle but noticeable
- `0.30–0.70` → clear / dominant in the look
- `0.70–1.00` → intense / potentially scene-defining

`typicalIntensityRange` is a per-effect hint used by presets. It represents a reasonable band for that effect **when it is present**; it is not a rule.

## Prompt selection controls

Effects Studio separates:

- **Active Mix**: everything you have enabled (including low-intensity effects)
- **Used Effects**: the subset actually sent into prompt building

The two global controls that gate “Used Effects” are:
- **Threshold**: minimum intensity required for an effect to be included
- **Max effects**: cap for prompt brevity

## Sources

Short descriptions and simulation hints are paraphrased from (and aligned to) PsychonautWiki’s effect taxonomy:

- Visual effects: https://psychonautwiki.org/wiki/Visual_effects
- Visual amplifications: https://psychonautwiki.org/wiki/Visual_amplifications
- Visual suppressions: https://psychonautwiki.org/wiki/Visual_suppressions
- Visual distortions: https://psychonautwiki.org/wiki/Visual_distortions
- Geometry: https://psychonautwiki.org/wiki/Geometry
- Subjective effect index (naming/grouping cross-check): https://psychonautwiki.org/wiki/Subjective_effect_index

Per-effect `sources` are stored in `data/visual_effects.json` for documentation and auditing. The UI should not display or quote source text verbatim.

