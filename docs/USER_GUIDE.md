# User Guide

Complete guide to using PsyVis Lab for psychedelic visual effect analysis and generation.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Images](#uploading-images)
3. [Understanding Analysis Results](#understanding-analysis-results)
4. [Using the Effect Router](#using-the-effect-router)
5. [Generating Structural Maps](#generating-structural-maps)
6. [Generating Variants](#generating-variants)
7. [Project Management](#project-management)
8. [Advanced Features](#advanced-features)
9. [Tips for Best Results](#tips-for-best-results)
10. [Common Workflows](#common-workflows)

---

## Getting Started

### First Time Setup

1. **Launch the application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser

2. **Verify API key configuration**
   - Check that `.env` contains your `OPENROUTER_API_KEY`
   - You should see the upload panel (not an error message)

3. **Prepare an image**
   - Use JPG, PNG, or WebP format
   - Recommended size: 512px to 2048px (largest dimension)
   - Best subjects: nature, architecture, art, portraits, abstract patterns

---

## Uploading Images

### Drag and Drop
1. Drag an image file into the upload zone
2. Image preview appears immediately
3. Proceed to analysis controls

### Click to Browse
1. Click the upload zone
2. Select image from file browser
3. Image loads into preview panel

### Best Image Types

**Excellent Results:**
- Nature scenes (forests, flowers, clouds, water)
- Geometric architecture
- Abstract art and patterns
- Portraits with clear features
- Textured surfaces (wood, stone, fabric)

**Good Results:**
- Urban landscapes
- Interior spaces
- Digital art
- Fractal imagery
- Macro photography

**May Need Adjustment:**
- Very dark images (low contrast)
- Highly compressed images (artifacts)
- Extremely simple scenes (solid colors)
- Very busy/chaotic compositions

---

## Understanding Analysis Results

### Substance and Dose Selection

**Substance Profiles:**

- **LSD**: Geometric patterns, vivid colors, sharp edges, fractal detail
  - *Common dose (0.3-0.7)*: Enhanced colors, pattern recognition, gentle breathing
  - *Strong dose (0.7-1.0)*: Complex geometry, intense fractals, reality distortion

- **Psilocybin**: Organic forms, natural enhancement, emotional warmth
  - *Common (0.3-0.7)*: Color shifts, flowing patterns, gentle morphing
  - *Strong (0.7-1.0)*: Deep geometry, entity perception, mystical themes

- **DMT**: Hyperspace aesthetics, alien geometry, breakthrough visuals
  - *Common (0.3-0.7)*: Intense colors, rapid geometry, chrysanthemum patterns
  - *Strong (0.7-1.0)*: Complete scene replacement, entity encounters, impossible geometry

- **5-MeO-DMT**: Void states, unity consciousness, minimal form
  - *Common (0.3-0.7)*: Brightness, ego softening, spatial dissolution
  - *Strong (0.7-1.0)*: White light, infinite space, complete ego dissolution

- **Mescaline**: Enhanced textures, indigenous patterns, warm colors
  - *Common (0.3-0.7)*: Color warmth, pattern amplification, stable geometry
  - *Strong (0.7-1.0)*: Deep symbolism, cultural motifs, crystalline structures

- **Custom Mix**: Blend characteristics from multiple substances

### Analysis Panel

After clicking **Analyze Image**, you'll see:

**Base Scene Description**
- Natural language description of the image
- Identifies key visual elements
- Notes composition and lighting

**Detected Effects** (70+ possible effects in 5 groups)

1. **Enhancements** (teal badges)
   - Color enhancement, contrast boost, visual acuity
   - Pattern recognition, depth enhancement
   - Usually appear at all dose levels

2. **Distortions** (purple badges)
   - Breathing, drifting, morphing, tracers
   - Time perception changes, afterimages
   - Increase with dose intensity

3. **Geometry** (blue badges)
   - Fractals, mandalas, form constants, tessellations
   - Tunnels, spirals, symmetrical patterns
   - Dominant at moderate to strong doses

4. **Hallucinations** (pink badges)
   - Scene replacement, entity manifestation, novel content
   - Internal visions, autonomous imagery
   - Rare at common doses, prominent at strong doses

5. **Perceptual** (amber badges)
   - Synesthesia, time distortion, depth shifts
   - Pareidolia, perspective alterations
   - Present at all levels, quality changes with dose

**Effect Intensity**
- Each effect shows intensity (0.0 to 1.0)
- Hover over badges to see detailed descriptions
- Intensities guide generation strength

**Summaries**
- Geometry Summary: Overview of geometric patterns detected
- Distortion Summary: Key distortion effects
- Hallucination Summary: Hallucination characteristics (if any)

### Prompt Lab Panel

Displays 6 ready-to-use prompt flavors:

**Structural** - Preserves composition with surface-locked effects
- Best for: Keeping recognizable structures
- Use when: You want the subject clearly identifiable

**Poetic** - Lyrical, metaphorical descriptions
- Best for: Artistic interpretation
- Use when: You want creative freedom

**Technical** - Explicit taxonomy language
- Best for: Precise control over effects
- Use when: You need predictable results

**Experimental** - Novel combinations and unexpected pairings
- Best for: Discovery and surprise
- Use when: You want unique outputs

**Hybrid** - Balanced approach combining strategies
- Best for: General use
- Use when: You want a middle ground

**Minimal** - Concise, essential-only prompts
- Best for: Model-specific optimizations
- Use when: Token limits matter

**Copy Button**: Click to copy any prompt for use in external tools (Midjourney, DALL-E, ComfyUI, etc.)

---

## Using the Effect Router

The Effect Router gives granular control over **where** effects manifest in the image.

### Enable Router
1. Toggle **Enable Effect Router** in the router panel
2. Router settings will be included in generation

### Region Targeting

**Available Regions:**
- **Face**: Detected face areas (if present)
- **Hands**: Detected hand areas (if present)
- **Subject**: Main focal point or foreground
- **Background**: Everything behind the subject
- **Global**: Entire image uniformly

**Default Regions**: Select which regions receive effects by default

**Region Protection**:
- **Protect Face**: Prevents effects from altering face structure
- **Protect Hands**: Preserves hand anatomy
- **Protect Edges**: Maintains structural boundaries

### Depth Band Targeting

**Depth Bands** (requires depth map):
- **Near**: Objects closest to camera
- **Mid**: Middle-distance elements
- **Far**: Background and distant objects

**Example**: Apply breathing only to mid-ground foliage, not foreground flowers

### Group Multipliers

Boost or reduce entire effect categories:

- **Enhancements**: Adjust all color/contrast/acuity effects
  - 0.0 = Disable enhancements
  - 1.0 = Normal strength (default)
  - 2.0 = Double strength

- **Distortions**: Scale breathing, drifting, morphing
- **Geometry**: Control geometric pattern intensity
- **Hallucinations**: Adjust hallucination strength
- **Perceptual**: Modify perceptual alterations

**Use Cases**:
- Set geometry to 1.5, hallucinations to 0.3 for controlled geometric emphasis
- Set enhancements to 2.0 for vivid colors without distortions

### Per-Effect Rules

Override specific effects with custom rules:

**Rule Structure**:
1. Select effect (e.g., "breathing")
2. Choose regions (e.g., subject + background)
3. Choose depth bands (e.g., near + mid)
4. Set strength multiplier (0.0 to 2.0)
5. Toggle edge protection

**Example Rule**:
- Effect: "color_enhancement"
- Regions: subject only
- Depth: near
- Strength: 1.5
- Protect edges: true

*Result*: Color enhancement 1.5× stronger on near-field subject, preserving edges

### Surface Lock Strength

Controls how tightly geometric effects embed in image surfaces:

- **0.0**: Floating overlays (less realistic)
- **0.5**: Balanced (default)
- **1.0**: Maximum surface adhesion (most realistic)

**Recommendation**: Keep at 0.7-0.9 for authentic psychedelic aesthetics

---

## Generating Structural Maps

Structural maps guide where effects appear based on image structure.

### Enable Maps
1. Click **Generate Maps** button in Maps panel
2. Wait for Python worker to process (5-30 seconds)
3. Maps appear as thumbnail previews

### Available Map Types

**Depth Map** (grayscale)
- Shows spatial layering
- Lighter = closer to camera
- Darker = farther away
- Use for: Depth-based effect placement

**Normal Map** (colorful)
- Encodes surface orientation
- RGB channels = XYZ surface angles
- Use for: Surface-locked geometry

**Edge Map** (black lines on white)
- Detects structural boundaries
- Use for: Edge protection, composition preservation

**Segmentation** (colored regions)
- Semantic object boundaries
- Use for: Object-specific effects

**Face Mask** (if faces detected)
- 468 facial landmarks
- Use for: Face protection or face-only effects

**Hands Mask** (if hands detected)
- 21 landmarks per hand
- Use for: Hand protection or hand-specific effects

### Adjust Map Influence

**Depth Weight** (0.0 to 1.0)
- How much depth information guides placement
- Higher = stricter depth adherence

**Normals Weight**
- Surface curvature influence
- Higher = effects follow surface contours more

**Edges Weight**
- Edge detection influence
- Higher = stronger edge preservation

**Face/Hands Protection**
- Toggle to enable/disable masks
- When enabled, effects avoid these regions

### Map Caching

- Maps are cached by image hash
- Re-analyzing same image reuses existing maps
- Cache persists between sessions
- Delete cache folder to regenerate

---

## Generating Variants

### Generation Modes

**Base Image Edit** (default, recommended)
- Uses input image as structural foundation
- Preserves composition and recognizable elements
- Applies effects as transformations
- Best for: Most use cases

**Prompt Only**
- Generates entirely from text description
- No structural constraints from input
- High creativity, low structure preservation
- Best for: Abstract or highly divergent outputs

### Generate Button

1. Review analysis and router settings
2. Click **Generate Variant**
3. Progress indicator shows generation status
4. Result appears in preview panel (up to 180 seconds)

### Comparing Results

- Original image shows on left
- Generated variant on right
- Toggle between views to see changes

### Used Prompt

Displays the exact prompt sent to the AI model, including:
- Base scene description
- Effect instructions
- Router placement rules
- Map guidance (if enabled)
- Surface lock constraints

---

## Project Management

### Auto-Save

Every generation creates a project:
- Project ID assigned automatically
- Unsaved projects expire after 5 days (configurable)
- Expiration countdown shown in Project Status panel

### Save Permanently

1. Click **Pin Project** in Project Status panel
2. Project marked as saved (expiration removed)
3. Saved projects persist indefinitely

### Library Panel

Browse all projects:
- Thumbnail previews
- Substance and dose info
- Creation date
- Saved status
- Expiration date (if unsaved)

### Download Options

**Download Image**
- Single image file (PNG/JPG)
- Click download icon on generation card

**Download Bundle**
- ZIP file containing:
  - Generated image
  - `metadata.json` (full analysis data)
  - `prompts.txt` (all prompt flavors)
- Click bundle icon on generation card

### Delete Projects

1. Click trash icon on project card
2. Confirm deletion
3. All files permanently removed

---

## Advanced Features

### Custom Effect Overrides

Manually adjust effect intensities:
1. Open **Effects Override Panel**
2. Use sliders to increase/decrease specific effects
3. Changes reflected in prompts and generation

### Multiple Generations

1. Generate initial variant
2. Adjust settings (router, maps, overrides)
3. Generate again from same analysis
4. Compare results side-by-side

### External Prompt Use

1. Copy prompt from Prompt Lab
2. Paste into Midjourney, DALL-E, Leonardo, etc.
3. Use for non-PsyVis generation workflows

### Batch Workflow (manual)

1. Analyze first image → copy prompts → save project
2. Analyze second image → copy prompts → save project
3. Repeat for collection
4. Export all prompts from library

---

## Tips for Best Results

### Image Selection

**Do:**
- Use high-quality images (minimal compression)
- Choose images with interesting textures and patterns
- Include organic shapes for psilocybin profiles
- Use geometric architecture for LSD profiles
- Select portraits for entity-focused DMT experiences

**Don't:**
- Use extremely low resolution images
- Choose pure solid colors or gradients
- Upload heavily filtered/edited images
- Use images with extreme darkness or brightness

### Substance and Dose

**For Subtle Enhancements (0.1-0.3)**:
- Color and contrast boost
- Pattern recognition enhancement
- Minimal distortion

**For Classic Psychedelic (0.4-0.7)**:
- Balanced effects across categories
- Recognizable but altered scenes
- Moderate geometry

**For Breakthrough Experiences (0.8-1.0)**:
- Intense geometry and hallucinations
- Potential scene replacement
- Maximum intensity across all effects

### Router Settings

**Preserve Identity**:
- Enable face and hands protection
- Set hallucinations multiplier to 0.2-0.4
- Use structural prompt flavor

**Maximum Transformation**:
- Disable all protection
- Set geometry and hallucinations to 1.5+
- Use experimental prompt flavor

**Natural Integration**:
- Surface lock strength 0.8-0.9
- Protect edges enabled
- Default regions: subject + background

### Map Settings

**For Realistic Depth**:
- Depth weight: 0.8
- Normals weight: 0.6
- Edges weight: 0.4

**For Abstract Freedom**:
- Depth weight: 0.2
- Normals weight: 0.3
- Edges weight: 0.1

**For Portrait Protection**:
- Face protection: enabled
- Hands protection: enabled
- Surface lock: 0.9

---

## Common Workflows

### Workflow 1: Nature Photography → Psychedelic Art

1. Upload forest/nature image
2. Substance: Psilocybin, Dose: 0.6
3. Analyze image
4. Enable router:
   - Default regions: subject + background
   - Geometry multiplier: 1.3
   - Protect edges: false
5. Generate maps
6. Generate variant with structural flavor
7. Download bundle

**Expected Result**: Natural scene with organic breathing textures, enhanced colors, gentle geometric patterns in foliage

### Workflow 2: Portrait → Entity Encounter

1. Upload portrait image
2. Substance: DMT, Dose: 0.8
3. Analyze image
4. Enable router:
   - Face protection: **disabled** (allow transformation)
   - Geometry multiplier: 1.8
   - Hallucinations multiplier: 1.5
5. Use experimental prompt flavor
6. Generate variant

**Expected Result**: Face transformed into entity-like appearance with intense geometric patterns

### Workflow 3: Architecture → Fractal Geometry

1. Upload geometric building image
2. Substance: LSD, Dose: 0.7
3. Analyze image
4. Enable router:
   - Geometry multiplier: 2.0
   - Distortions multiplier: 0.5
   - Surface lock: 0.9
5. Generate maps with high normals weight (0.8)
6. Generate variant

**Expected Result**: Building surfaces covered in fractal patterns that follow architectural lines

### Workflow 4: Export Prompts for Midjourney

1. Upload reference image
2. Select substance and dose
3. Analyze image
4. Open Prompt Lab
5. Copy Midjourney-optimized prompt
6. Add Midjourney parameters: `--ar 16:9 --style raw --v 6`
7. Paste into Midjourney Discord

**Expected Result**: Midjourney generation guided by PsyVis analysis

### Workflow 5: Multi-Substance Comparison

1. Upload single image
2. Analyze with LSD 0.6 → save project
3. Re-upload same image
4. Analyze with Psilocybin 0.6 → save project
5. Re-upload same image
6. Analyze with DMT 0.6 → save project
7. Compare results in library

**Expected Result**: Three variants showing substance-specific aesthetic signatures

---

## Troubleshooting

**See**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed error solutions.

**Common Issues**:
- Analysis timeout → reduce image size
- Generation fails → check API credits
- Maps not generating → ensure Python installed
- Effects seem random → adjust dose and router settings

---

## Additional Resources

- [API Reference](./API_REFERENCE.md) - For developers building integrations
- [Effects Catalog](./effects_catalog.md) - Effect families + intensity guide
- [Substance Profiles](./substance_visual_profiles.md) - Phenomenological details
- [Router Guide](./ROUTER_GUIDE.md) - Advanced routing strategies
- [Prompt Engineering](./PROMPT_ENGINEERING.md) - Prompt optimization tips

---

**Questions?** Check the [FAQ](./FAQ.md) or open an issue on GitHub.
