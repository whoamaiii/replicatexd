# Maps and Controls for Structural Guidance

This document covers the structural maps used by PsyVis Lab to preserve spatial coherence during psychedelic image generation.

## Overview

Structural maps are derived images that encode geometric and semantic information about the input image. By generating these maps upfront, PsyVis Lab can guide generation to preserve perspective, edges, and protect sensitive regions like faces and hands.

---

## Map Types

### Depth Maps

**What they are:** Grayscale images encoding the relative distance of each pixel from the camera. Closer regions appear lighter (or darker, depending on convention), farther regions appear opposite.

**Use in image editing:**
- Preserve perspective and spatial layering
- Ensure foreground/background separation
- Guide lighting consistency
- Prevent floating geometry by anchoring effects to surfaces at correct depths

**Generation approach:** PsyVis Lab uses [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2), a NeurIPS 2024 foundation model for monocular depth estimation. It significantly outperforms earlier methods in fine-grained details and robustness.

> "Depth Anything V2 significantly outperforms V1 in fine-grained details and robustness. Compared with SD-based models, it enjoys faster inference speed, fewer parameters, and higher depth accuracy."
> — [Depth Anything V2 Project](https://depth-anything-v2.github.io/)

**Model variants:**
- `vits` (Small): ~25M parameters, Apache-2.0 license, fastest
- `vitb` (Base): ~98M parameters, CC-BY-NC-4.0 license
- `vitl` (Large): ~335M parameters, CC-BY-NC-4.0 license

### Normal Maps

**What they are:** RGB images encoding surface orientation at each pixel. The red channel represents the X-axis normal component, green is Y-axis, and blue is Z-axis.

**Use in image editing:**
- Preserve surface curvature and texture flow
- Ensure lighting-coherent effects
- Guide how patterns wrap around surfaces

**Generation approach:** Computed from depth maps via Sobel gradient filters. This approximation works well for smooth surfaces but may have artifacts at sharp depth discontinuities.

```
dzdx = Sobel(depth, direction=X)
dzdy = Sobel(depth, direction=Y)
normal = normalize([-dzdx, -dzdy, 1])
```

### Edge Maps

**What they are:** Binary or grayscale images highlighting detected edges in the input image.

**Use in image editing:**
- Preserve composition and major structural lines
- Maintain silhouette boundaries
- Guide where psychedelic effects should respect object boundaries

**Generation approach:** OpenCV Canny edge detection with automatic threshold selection based on image statistics:

```python
median = np.median(gray_image)
low = int(max(0, 0.67 * median))
high = int(min(255, 1.33 * median))
edges = cv2.Canny(gray, low, high)
```

Reference: [OpenCV Canny Tutorial](https://docs.opencv.org/4.x/da/d22/tutorial_py_canny.html)

### Segmentation Masks

**What they are:** Labeled images where each region belongs to a semantic class (person, background, object, etc.).

**Use in image editing:**
- Object-aware generation boundaries
- Apply different effect intensities to different regions
- Foreground/background separation

**Generation approach:** For basic use, a simple foreground/background mask derived from depth thresholding. For advanced use, models like [Segment Anything (SAM)](https://github.com/facebookresearch/segment-anything) provide precise object boundaries.

### Face Masks

**What they are:** Binary masks isolating face regions in the image.

**Use in image editing:**
- Protect facial identity during generation
- Prevent unwanted facial distortion
- Avoid extra eyes or facial feature multiplication

**Generation approach:** [MediaPipe Face Mesh](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md) provides 468 3D facial landmarks in real-time. The convex hull of these landmarks creates the face mask.

> "Each face is represented as a list of 468 face landmarks and each landmark is composed of x, y and z."
> — MediaPipe Documentation

### Hands Masks

**What they are:** Binary masks isolating hand regions in the image.

**Use in image editing:**
- Preserve hand anatomy and finger count
- Prevent hand distortion (a common failure mode in AI generation)
- Maintain gesture recognizability

**Generation approach:** [MediaPipe Hands](https://github.com/google/mediapipe/blob/master/docs/solutions/hands.md) detects 21 hand landmarks per hand. The convex hull plus dilation creates a protective mask region.

> "The hand tracking model estimates 21 key hand landmarks (e.g., fingertips, knuckles, wrists) for each hand."
> — MediaPipe Documentation

---

## ControlNet Background (Reference Only)

ControlNet is a neural network architecture that adds conditional control to diffusion models. While PsyVis Lab does not implement ControlNet directly, understanding its principles informs our prompt-based guidance approach.

**How ControlNet works:**
- Copies diffusion model weights into "locked" (frozen) and "trainable" copies
- The trainable copy learns to interpret conditioning signals (depth, edges, etc.)
- Zero convolutions ensure no initial distortion to the base model

> "ControlNet allows guidance in the form of one or more of depth, edges, normal, or semantic channels."
> — [ControlNet GitHub](https://github.com/lllyasviel/ControlNet)

**Supported conditioning types:**
- Depth maps (spatial layering)
- Canny edges (structure preservation)
- Normal maps (surface orientation)
- Segmentation maps (semantic guidance)
- Pose keypoints (human pose control)

Reference: Zhang & Agrawala, "Adding Conditional Control to Text-to-Image Diffusion Models" ([arXiv:2302.05543](https://arxiv.org/abs/2302.05543))

---

## Tradeoffs and Failure Modes

### Depth Estimation Errors

| Scenario | Issue | Mitigation |
|----------|-------|------------|
| Reflective surfaces | Mirrors/windows confuse depth | Lower depth weight in settings |
| Transparent objects | Glass appears at wrong depth | Use edge maps as backup |
| Repetitive textures | Depth aliasing patterns | Increase model size (vitb/vitl) |
| Extreme close-ups | Depth range compression | Normalize per-image |

### Edge Detection Issues

| Scenario | Issue | Mitigation |
|----------|-------|------------|
| Low contrast | Missing edges | Lower Canny threshold |
| Noise/grain | Spurious edges | Pre-blur or raise threshold |
| Soft boundaries (hair, fur) | Incomplete boundaries | Combine with segmentation |

### Face/Hands Detection Failures

| Scenario | Issue | Mitigation |
|----------|-------|------------|
| Extreme angles | Detection misses | Disable protection for that image |
| Multiple overlapping faces | Merged masks | Process at higher resolution |
| Unusual hand positions | Partial detection | Increase mask dilation |
| Non-realistic faces (art) | May not detect | Works best on photos |

---

## Recommended Default Configuration

For psychedelic replication with structural preservation:

```typescript
const DEFAULT_MAP_SETTINGS = {
  // Depth: Strong guidance for spatial coherence
  depthEnabled: true,
  depthWeight: 0.7,

  // Normals: Usually not needed unless surface detail is critical
  normalsEnabled: false,
  normalsWeight: 0.5,

  // Edges: Moderate guidance for composition
  edgesEnabled: true,
  edgesWeight: 0.5,

  // Segmentation: Off by default (slower, optional)
  segmentationEnabled: false,
  segmentationWeight: 0.5,

  // Face protection: On by default for portraits
  faceProtectionEnabled: true,
  faceProtectionStrength: 0.8,

  // Hands protection: On by default
  handsProtectionEnabled: true,
  handsProtectionStrength: 0.6,

  // Surface lock: Ensures effects embed in surfaces
  surfaceLockEnabled: true,
  surfaceLockStrength: 0.6,
}
```

**Rationale:**
- High depth weight preserves the 3D feel of the original scene
- Moderate edge weight allows organic flow while respecting boundaries
- Strong face protection prevents identity drift
- Surface lock ensures psychedelic effects appear as textures on surfaces, not floating overlays

---

## Citations

1. Yang et al., "Depth Anything V2: A More Capable Foundation Model for Monocular Depth Estimation," NeurIPS 2024. [GitHub](https://github.com/DepthAnything/Depth-Anything-V2) | [Project Page](https://depth-anything-v2.github.io/)

2. Zhang & Agrawala, "Adding Conditional Control to Text-to-Image Diffusion Models," ICCV 2023. [arXiv:2302.05543](https://arxiv.org/abs/2302.05543) | [GitHub](https://github.com/lllyasviel/ControlNet)

3. Google MediaPipe. [Face Mesh](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md) | [Hands](https://github.com/google/mediapipe/blob/master/docs/solutions/hands.md)

4. OpenCV Canny Edge Detection. [Tutorial](https://docs.opencv.org/4.x/da/d22/tutorial_py_canny.html)

5. Kirillov et al., "Segment Anything," Meta AI 2023. [GitHub](https://github.com/facebookresearch/segment-anything)
