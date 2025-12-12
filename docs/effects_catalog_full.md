# Effect Catalog (Legacy Full Reference)

This document is a legacy, long-form effect reference and may not match the current canonical catalog schema or listing.

- Canonical catalog: `data/visual_effects.json`
- Current overview + guidance: `docs/effects_catalog.md`

Complete reference of all 70+ psychedelic visual effects in PsyVis Lab.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Overview](#overview)
2. [Understanding Effect Attributes](#understanding-effect-attributes)
3. [Enhancements](#enhancements) (6 effects)
4. [Distortions](#distortions) (12 effects)
5. [Geometry](#geometry) (9 effects)
6. [Hallucinations](#hallucinations) (5 effects)
7. [Perceptual](#perceptual) (5 effects)
8. [How Effects Combine](#how-effects-combine)
9. [Adding New Effects](#adding-new-effects)

---

## Overview

PsyVis Lab catalogs **37 distinct psychedelic visual effects** organized into 5 phenomenological groups. Each effect is:
- **Research-backed**: Based on experience reports and scientific literature
- **Dose-dependent**: Intensity varies with substance dose
- **Substance-specific**: Different substances emphasize different effects
- **Scale-aware**: Effects manifest at macro, meso, or micro spatial scales

---

## Understanding Effect Attributes

### Groups

- **Enhancements**: Amplification of normal visual processing (color, contrast, acuity)
- **Distortions**: Transformation of perceived geometry and motion
- **Geometry**: Emergence of structured patterns and form constants
- **Hallucinations**: Novel content not present in environment
- **Perceptual**: Alterations in depth, time, and sensory integration

### Intensity Range

Normalized 0.0 to 1.0 scale indicating typical manifestation range:
- **0.0-0.2**: Threshold (barely perceptible)
- **0.3-0.7**: Common (clear but manageable)
- **0.7-1.0**: Strong (intense, potentially overwhelming)

### Spatial Scales

- **Macro**: Whole scene or large-scale patterns
- **Meso**: Object-level features (textures, surfaces)
- **Micro**: Fine detail (edges, tiny patterns)

### Common Substances

Indicates which psychedelic substances typically produce this effect:
- **lsd**: LSD-25
- **psilocybin**: Psilocybin mushrooms
- **dmt**: N,N-DMT (smoked/vaped)
- **five_meo**: 5-MeO-DMT
- **mescaline**: Peyote/San Pedro
- **ayahuasca**: Oral DMT + MAOI
- **two_c_b**, **two_c_e**: 2C family phenethylamines
- **mdma**, **mda**: Empathogenic entactogens
- **salvia**: Salvia divinorum
- **deliriant**: Deliriant class (scopolamine, datura)

---

## Enhancements

Effects that amplify normal visual processing without introducing novel content.

### Color Enhancement

**Intensity Range**: 0.1 - 0.8 | **Scales**: Macro, Meso

Colors appear more vivid, saturated, and emotionally salient than baseline. This effect increases perceived saturation and separation between hues, making scenes feel more vibrant and alive. It often co-occurs with enhanced contrast and a sense that certain colors glow or carry meaning.

**Common in**: LSD, psilocybin, mescaline, DMT, 2C-B, 2C-E, MDMA, MDA

**Simulation Notes**: Increase saturation with gentle hue protection, then add selective vibrance in mid tones. Couple small color pulses to audio or motion for a living feel.

---

### Contrast Enhancement

**Intensity Range**: 0.1 - 0.7 | **Scales**: Macro, Meso

Edges, shadows, and highlights separate more strongly, giving a crisp and high-definition look. Local contrast increases can make textures pop and can amplify perceived depth. At higher intensity it can make scenes feel unreal or hyper-real, as if clarity is turned beyond natural optics.

**Common in**: LSD, psilocybin, mescaline, 2C-E

**Simulation Notes**: Use local contrast or unsharp masking with restraint to avoid crunchy artifacts. Modulate contrast more in mid tones than extremes for a natural but heightened look.

---

### Visual Acuity Enhancement

**Intensity Range**: 0.05 - 0.6 | **Scales**: Meso, Micro

Fine detail seems unusually clear, as if focus and resolution have increased. Perceived sharpness increases, especially at edges and along repeating texture boundaries. Many people describe an ultra-clear or ultra-crisp feeling that can shift into over-sharpened unreality at higher intensity.

**Common in**: LSD, psilocybin, mescaline

**Simulation Notes**: Add edge-aware sharpening and micro contrast, then stabilize over time to avoid shimmer. Pair with mild chroma smoothing to keep the look clean.

---

### Pattern Recognition Enhancement

**Intensity Range**: 0.1 - 0.7 | **Scales**: Meso, Micro

Hidden structure and meaningful forms seem to emerge from ambiguous textures. The visual system over-interprets weak cues, so noise and texture begin to suggest faces, symbols, and repeating motifs. This effect can seed more elaborate geometry and pareidolia when intensity rises.

**Common in**: LSD, psilocybin, DMT, ayahuasca

**Simulation Notes**: Use feature amplification on texture maps and add a low-strength semantic overlay from segmentation or edge maps. Keep it subtle at low intensity so it reads as emergence rather than sticker art.

---

### Glow and Haloes

**Intensity Range**: 0.1 - 0.8 | **Scales**: Macro, Meso

Bright areas bloom and can form soft haloes or auras around objects. Luminance spreads beyond its physical boundary, giving lights a radiant presence and edges a gentle aura. This can contribute to a dreamy, warm, or sacred feeling depending on palette and context.

**Common in**: MDMA, MDA, LSD, psilocybin, mescaline

**Simulation Notes**: Use bloom with a soft knee and a wide radius. Add a second subtle edge glow pass that follows high-contrast boundaries to suggest an aura.

---

### Texture Salience

**Intensity Range**: 0.1 - 0.7 | **Scales**: Micro

Surface textures become unusually attention-grabbing and rich. Materials like wood grain, fabric weave, foliage, and stone appear deeper and more structured than usual. This often precedes drifting and geometry because the visual system locks onto repeating micro features.

**Common in**: LSD, psilocybin, mescaline, 2C-B, 2C-E

**Simulation Notes**: Boost micro contrast and gently amplify periodic components of textures. Use time-coherent noise modulation so the texture feels alive without becoming unstable.

---

## Distortions

Effects that transform perceived geometry, motion, and structure without adding novel content.

### Breathing Surfaces

**Intensity Range**: 0.2 - 0.8 | **Scales**: Macro, Meso

Flat surfaces appear to expand and contract rhythmically. Walls, floors, and natural scenes can look like they inhale and exhale. The motion is usually slow, smooth, and spatially coherent, sometimes syncing with breath, music, or heartbeat.

**Common in**: LSD, psilocybin, mescaline

**Simulation Notes**: Apply a low-frequency displacement field with subtle depth-dependent scaling. Drive the phase with a slow oscillator and keep edges anchored so the effect reads as breathing, not camera shake.

---

### Visual Drifting

**Intensity Range**: 0.2 - 0.9 | **Scales**: Meso, Micro

Textures and boundaries gently slide, swirl, or creep in place. Drifting is a continuous transformation of perceived structure, often strongest on repeating textures. It can feel organic and fluid or geometric and tiled depending on substance and context.

**Common in**: LSD, psilocybin, mescaline, 2C-B, 2C-E

**Simulation Notes**: Use optical flow-aligned warping or a material-locked UV advection. Increase drift speed and curl noise over time as intensity rises, but preserve temporal coherence.

---

### Flowing Textures

**Intensity Range**: 0.3 - 0.9 | **Scales**: Micro

Surface detail behaves like a fluid, streaming along invisible currents. Fine texture features can appear to move as if carried by a gentle current, sometimes looping in stable cycles. This often appears in foliage, clouds, carpet, or patterned fabric.

**Common in**: LSD, psilocybin

**Simulation Notes**: Run a low-velocity vector field over texture space and advect texture coordinates. Add a small divergence-free curl component for an organic flow.

---

### Melting Deformation

**Intensity Range**: 0.3 - 0.9 | **Scales**: Meso

Objects and edges sag, drip, or lose rigidity as if softened. Hard boundaries can appear to liquefy, with gravity-like sagging or viscous motion. It often mixes with breathing and drifting, but has a distinct sense of structure losing stiffness.

**Common in**: LSD, psilocybin

**Simulation Notes**: Use anisotropic displacement biased downward plus edge softening. Increase viscosity and slow the motion to avoid turning it into simple blur.

---

### Morphing Objects

**Intensity Range**: 0.2 - 0.8 | **Scales**: Meso

Recognizable forms subtly change shape or identity while remaining partly anchored. Faces, hands, and objects can shift in proportion, expression, or texture, sometimes oscillating between interpretations. This is often reported as unsettling or fascinating depending on context.

**Common in**: LSD, psilocybin, 2C-E

**Simulation Notes**: Use segmentation-guided deformation so object boundaries can warp without destroying the whole scene. Blend between multiple plausible shapes with slow noise-driven interpolation.

---

### Tracers and Motion Trails

**Intensity Range**: 0.1 - 0.8 | **Scales**: Macro, Meso

Moving objects leave persistent trails or multiple ghosted copies. Motion can appear to smear across time, as if the visual system retains prior frames. Trails are often strongest around bright objects and fast movement.

**Common in**: LSD, psilocybin, 2C-B, MDMA, MDA

**Simulation Notes**: Accumulate prior frames using motion vectors and an exponential decay. Allow trail length to scale with intensity and with scene luminance.

---

### Afterimage Persistence

**Intensity Range**: 0.1 - 0.7 | **Scales**: Meso

Recent visual impressions linger as faint silhouettes or color stains. Afterimages can appear as negative or positive remnants, and may persist longer than usual. In some cases the afterimage can drift slightly, creating a ghostly overlay.

**Common in**: LSD, psilocybin, DMT

**Simulation Notes**: Blend a faint delayed version of the frame with local edge emphasis. Use a separate decay rate for chroma and luminance to mimic colored persistence.

---

### Perspective Warp

**Intensity Range**: 0.2 - 0.8 | **Scales**: Macro

Depth, angles, and camera-like perspective appear subtly distorted. Rooms can feel stretched, corners can bend, and depth cues can become exaggerated. The distortion can be smooth and lens-like or elastic and dreamlike depending on intensity.

**Common in**: LSD, psilocybin, salvia

**Simulation Notes**: Use a smoothly varying field-of-view modulation plus non-linear barrel and pincushion warps. Add slow oscillation and keep the horizon stable unless simulating disorientation.

---

### Field of View Stretching

**Intensity Range**: 0.4 - 1.0 | **Scales**: Macro

The visual field stretches or compresses as if vision is pulled into a band or funnel. This effect can feel like tunneling or like the scene is being stretched sideways or vertically. It is often reported in sudden-onset hallucinogens and can be very disorienting.

**Common in**: DMT, salvia

**Simulation Notes**: Apply a time-varying non-uniform scale around the center of gaze, combined with vignetting. Increase speed and amplitude sharply at high intensity for breakthrough-style transitions.

---

### Visual Snow

**Intensity Range**: 0.05 - 0.6 | **Scales**: Macro, Micro

A fine static-like grain overlays the scene, especially in low light. The field can contain shimmering speckle, crawling noise, or faint pointillism. It can be subtle and atmospheric or intense enough to interfere with clarity.

**Common in**: LSD, psilocybin, DMT

**Simulation Notes**: Add low-amplitude luminance noise that is temporally correlated rather than pure random. Make it stronger in shadows and periphery to mimic reported salience.

---

### Perspective Warp

**Intensity Range**: 0.2 - 0.8 | **Scales**: Macro

Depth, angles, and camera-like perspective appear subtly distorted. Rooms can feel stretched, corners can bend, and depth cues can become exaggerated.

**Common in**: LSD, psilocybin, salvia

---

### Field of View Stretching

**Intensity Range**: 0.4 - 1.0 | **Scales**: Macro

The visual field stretches or compresses as if vision is pulled into a band or funnel.

**Common in**: DMT, salvia

---

## Geometry

Structured patterns and form constants that emerge as overlays or primary visual content.

### Geometric Patterning

**Intensity Range**: 0.2 - 1.0 | **Scales**: Macro, Meso

Structured repeating patterns appear as overlays or as the primary visual content. Geometry can range from simple grids and tessellations to intricate fractal ornamentation. It can appear with eyes closed, on surfaces with eyes open, or as an immersive replacement of the scene.

**Common in**: LSD, psilocybin, mescaline, DMT, ayahuasca, 2C-E

**Simulation Notes**: Generate patterns procedurally and lock them to surfaces with tracking. Increase complexity, symmetry, and depth cues as intensity rises.

---

### Form Constant: Tunnel

**Intensity Range**: 0.4 - 1.0 | **Scales**: Macro

A funnel or tunnel structure appears to extend into depth, often with motion through it. The tunnel may be made of repeating motifs, rings, or lattices and can feel like movement toward a center point.

**Common in**: Mescaline, DMT, LSD

**Simulation Notes**: Use log-polar mapping or radial coordinates to generate a stable funnel. Animate by zooming the phase and rotating layers, with depth shading to sell immersion.

---

### Form Constant: Spiral

**Intensity Range**: 0.4 - 1.0 | **Scales**: Macro

Spiral vortices appear as rotating or unfolding structures in the visual field. Spirals can be single vortex forms or nested spirals that rotate and expand.

**Common in**: Mescaline, LSD, DMT

**Simulation Notes**: Build spiral fields in polar coordinates and modulate thickness with noise. Keep rotation smooth and add nested harmonics for the classic multi-spiral look.

---

### Form Constant: Lattice

**Intensity Range**: 0.3 - 1.0 | **Scales**: Macro, Meso

Regular grids, honeycombs, or checkerboard-like meshes overlay vision. Lattice imagery can appear as transparent structure on surfaces or as a full-field pattern.

**Common in**: Mescaline, LSD, psilocybin

**Simulation Notes**: Use tiling primitives and enforce symmetry. Add subtle parallax and depth modulation so the lattice reads as spatial rather than flat wallpaper.

---

### Form Constant: Cobweb

**Intensity Range**: 0.3 - 1.0 | **Scales**: Macro, Micro

Web-like filigree and radial mesh patterns appear, often delicate and detailed. Cobweb imagery can look like fine netting, lace, or radial spokes connected by thin arcs.

**Common in**: Mescaline, LSD

**Simulation Notes**: Generate thin line networks with radial symmetry and varying strand thickness. Use glow and slight motion to keep the filigree alive.

---

### Fractal Recursion

**Intensity Range**: 0.4 - 1.0 | **Scales**: Macro, Micro

Patterns repeat across scales, with self-similarity and infinite zoom impressions. Fractal imagery often feels endless, as if zooming reveals the same motif again and again.

**Common in**: DMT, LSD, mescaline, psilocybin

**Simulation Notes**: Use iterative fractal functions or feedback zoom shaders. Animate zoom and rotation smoothly and keep color cycling controlled to avoid visual noise.

---

### Mandala Forms

**Intensity Range**: 0.3 - 1.0 | **Scales**: Macro

Radially symmetric, centered patterns appear like ornate circular designs. Mandala forms often emerge behind closed eyes or in low light, and can feel emotionally charged or sacred.

**Common in**: Psilocybin, mescaline, DMT, ayahuasca

**Simulation Notes**: Generate radial symmetry with multiple rings and petal-like motifs. Add slow breathing in scale and subtle depth shading to suggest layered structure.

---

### Kaleidoscopic Tiling

**Intensity Range**: 0.3 - 1.0 | **Scales**: Macro, Meso

The scene repeats through mirrored symmetry, like looking through a kaleidoscope. Tiling can affect only textures, or it can replicate whole objects and regions of the scene.

**Common in**: Mescaline, LSD, DMT, 2C-E

**Simulation Notes**: Apply mirror-based symmetry transforms around a chosen center. Blend between multiple symmetry orders over time for dynamic kaleidoscope transitions.

---

## Hallucinations

Novel content not present in the physical environment.

### Closed Eye Visuals

**Intensity Range**: 0.2 - 1.0 | **Scales**: Macro

With eyes closed, imagery appears ranging from abstract patterns to complex scenes. Closed eye visuals often begin as color fields and geometry, then can develop into representational scenes at higher intensity.

**Common in**: LSD, psilocybin, mescaline, DMT, ayahuasca, MDA

**Simulation Notes**: Treat this as a full-frame generative layer rather than a surface overlay. Use coherent motion and evolving motifs, and ramp complexity with intensity.

---

### Internal Scene Hallucinations

**Intensity Range**: 0.5 - 1.0 | **Scales**: Macro

Imagery becomes scene-like, with places, characters, and narrative flow. This includes dreamlike sequences, memories, symbolic stories, and novel environments.

**Common in**: Ayahuasca, DMT, psilocybin, mescaline

**Simulation Notes**: Use a scene graph approach with motif persistence across cuts. Blend geometric scaffolding into representational imagery via gradual morphs rather than abrupt swaps.

---

### Entity Encounters

**Intensity Range**: 0.6 - 1.0 | **Scales**: Macro, Meso

Autonomous beings are perceived as present and can appear to interact. Entities may be humanoid, animal-like, or abstract, and are often described as having agency.

**Common in**: DMT, ayahuasca

**Simulation Notes**: Let agents emerge from structure using face and body priors plus symmetry. Keep them partially ambiguous at moderate intensity and more coherent only at strong intensity.

---

### Scene Replacement

**Intensity Range**: 0.7 - 1.0 | **Scales**: Macro

Normal perception is replaced by a different environment or reality. Instead of seeing the current room or landscape, perception shifts into an alternate scene that can feel fully real.

**Common in**: DMT, salvia

**Simulation Notes**: Implement a transition that rapidly increases geometry, then cross-fades into a generated world. Preserve motion continuity so the swap feels like passage rather than a hard cut.

---

### External Object Hallucinations

**Intensity Range**: 0.8 - 1.0 | **Scales**: Macro, Meso

Distinct objects or beings appear in the environment as if truly present. Unlike overlays and distortions, this adds novel objects with apparent solidity and stable placement in the scene.

**Common in**: Deliriants, salvia

**Simulation Notes**: Insert objects with correct occlusion, lighting, and shadow so they read as real. Keep behavior mundane and scene-consistent to mimic realism.

---

## Perceptual

Alterations in depth perception, time perception, and sensory integration.

### Pareidolia

**Intensity Range**: 0.2 - 0.9 | **Scales**: Meso, Micro

Meaningful forms such as faces or symbols are seen in ambiguous patterns. This effect turns noise and texture into interpretable shapes. It often acts as a bridge between simple patterning and more elaborate hallucinated content.

**Common in**: LSD, psilocybin, ayahuasca, DMT

**Simulation Notes**: Use weak semantic priors: lightly blend in face-like templates, symbol atlases, or segmentation-driven texture substitutions. Keep confidence low so forms flicker in and out.

---

### Audio-Visual Synesthesia

**Intensity Range**: 0.2 - 0.9 | **Scales**: Macro, Meso

Sounds influence visual motion, color, or structure as if the senses are coupled. Music can appear to drive the timing and shape of patterns, and visual intensity can rise with rhythmic or harmonic events.

**Common in**: LSD, psilocybin, MDMA, MDA

**Simulation Notes**: Map audio features to visual parameters: beat to motion amplitude, spectral centroid to hue, and loudness to bloom and contrast. Smooth the control signals to keep motion coherent.

---

### Depth and Scale Shift

**Intensity Range**: 0.2 - 0.9 | **Scales**: Macro

Distances and sizes feel unstable, with objects seeming closer, farther, larger, or smaller. Depth cues can become exaggerated or inconsistent, producing dollhouse or vastness impressions.

**Common in**: LSD, psilocybin, DMT, salvia

**Simulation Notes**: Use depth maps to modulate scale and blur in a time-varying way. Combine subtle focal length drift with selective object scaling for the most convincing effect.

---

### Time Slicing

**Intensity Range**: 0.3 - 0.9 | **Scales**: Macro, Meso

Motion is perceived in discrete slices, as if time is segmented into frames. Movement can look like a flipbook, with separated snapshots rather than smooth continuity.

**Common in**: LSD, psilocybin, DMT, salvia

**Simulation Notes**: Use multi-exposure compositing with gated frame holds, then soften with a small blur. Modulate the gating with audio rhythm for a synesthetic feel.

---

### Dissociative Spatial Discontinuity

**Intensity Range**: 0.5 - 1.0 | **Scales**: Macro

Space breaks into slices, panels, loops, or impossible rearrangements. Instead of smooth warping, the scene can fracture into repeated segments, rotate like pages, or move as if on mechanical tracks.

**Common in**: Salvia

**Simulation Notes**: Use tiling and slicing transforms with hard boundaries, then animate the panels with a single dominant direction. Keep color changes secondary so the effect reads as spatial, not decorative.

---

## How Effects Combine

### Dose Progression

**Threshold (0.0-0.3)**:
- Primarily enhancements (color, contrast, acuity)
- Subtle pattern recognition
- Minimal distortion

**Common (0.3-0.7)**:
- All enhancements peak
- Distortions emerge (breathing, drifting, morphing)
- Geometry begins (simple patterns, symmetry)
- Closed-eye visuals develop

**Strong (0.7-1.0)**:
- Intense geometry (fractals, form constants, kaleidoscopic)
- Hallucinations possible (entities, scene replacement)
- Perceptual alterations (synesthesia, time distortion)
- Maximum distortion intensity

### Substance Signatures

**LSD**: Sharp geometry, vivid colors, precise patterns, breathing textures

**Psilocybin**: Organic flow, emotional warmth, mandalas, gentle morphing

**DMT**: Hyperspace tunnels, alien entities, impossible colors, rapid transitions

**5-MeO-DMT**: White light, void, minimal form, ego dissolution

**Mescaline**: Crystalline geometry, warm colors, stable patterns, cultural symbolism

---

## Adding New Effects

See [CONTRIBUTING.md](../CONTRIBUTING.md#adding-effects-to-the-catalog) for detailed instructions on adding new effects to the catalog.

**Quick reference**:
1. Edit `data/visual_effects.json`
2. Follow schema exactly
3. Include research citations
4. Test with analysis workflow
5. Submit pull request

---

## References

- [PsychonautWiki Subjective Effects Index](https://psychonautwiki.org/wiki/Subjective_effect_index)
- Carhart-Harris et al. (2016). "Neural correlates of the LSD experience revealed by multimodal neuroimaging"
- Bressloff et al. (2001). "Geometric visual hallucinations, Euclidean symmetry and the functional architecture of striate cortex"
- [Substance Visual Profiles](./substance_visual_profiles.md) - Detailed phenomenology

---

**Questions?** Check the [User Guide](./USER_GUIDE.md) or [FAQ](./FAQ.md)
