## Substance specific visual profiles

## Purpose
This document summarizes commonly reported visual effects of several psychoactive substances, with an emphasis on how to reproduce those effects in image and video simulation.

This is written for phenomenology and modelling. It is not medical advice and it is not intended as guidance for real world use.

## How to read dose and intensity notes
Throughout, dose is described qualitatively.

* Threshold: subtle, mostly enhancements and mild distortions
* Common: clear psychedelic style distortions and geometry, but reality is still mostly anchored
* Strong: immersive geometry and hallucinations become likely, scene replacement can occur for some substances

## LSD

### Overview
LSD is a long lasting classic psychedelic with a strong tendency toward high contrast, high saturation visual enhancement plus dynamic distortions and intricate geometric patterning. Visual effects often build gradually, with early enhancement giving way to stronger surface drift and geometry during the peak.

Typical timing (oral) is onset about 20 to 60 minutes, peak about 2 to 5 hours, and total duration often about 8 to 12 hours.

### Typical visual effects
* Onset: color and contrast lift, edge crispness, and texture salience tend to appear first
* Peak: breathing and drifting, tracers, and dense geometry become most prominent
* Enhancements: strong color enhancement, contrast and edge clarity, increased salience of textures
* Distortions: breathing and drifting of surfaces, flowing and morphing textures, tracers and afterimages
* Geometry: complex repeating patterns on surfaces, fractal recursion, symmetry and tiling, vivid closed eye geometry
* Hallucinations: usually secondary to distortions and geometry unless intensity is strong; internal scenes can occur at higher intensity
* Perceptual alterations: pronounced pareidolia, audio to visual coupling where music shapes visuals, occasional depth and scale shifts

### Dose and intensity notes
* Threshold: color and contrast lift, subtle edge crispness, mild shimmering on high frequency textures
* Common: clear breathing and drifting, visible pattern overlays on natural textures, noticeable tracers
* Strong: dense geometry can dominate the field, normal object boundaries dissolve into flowing forms, internal scenes and entity like motifs may appear especially with eyes closed

### Qualitative signature
A common LSD visual signature is sharp, neon leaning, highly detailed and fluid at the same time: edges pop, colors feel electrically vivid, and surfaces seem animated with organized motion. Compared with many tryptamines, LSD visuals often feel more like a long sustained augmentation of the external world rather than a rapid full scene replacement.

### Simulation notes
* Use global and local contrast enhancement plus controlled saturation lift, with emphasis on bright colors and luminous highlights
* Add time coherent surface drift: a slow breathing warp plus a smaller scale flowing texture advection
* Add tracers using motion vector based frame accumulation with decay
* Layer semi transparent geometric overlays that lock to surfaces via optical flow or planar tracking, then modulate complexity with intensity
* For strong LSD looks, add occasional symmetry tiling and recursive zoom motifs, and allow object segmentation boundaries to soften

### Sources
* PsychonautWiki: LSD; Visual effects, Psychedelics
* Erowid: LSD Basics; LSD Effects
* Carhart Harris et al. 2016. Neural correlates of the LSD experience revealed by multimodal neuroimaging. PNAS. PMID 27071089
* Tagliazucchi et al. 2016. Increased Global Functional Connectivity Correlates with LSD Induced Ego Dissolution. Current Biology. PMID 27085214

## Psilocybin mushrooms

### Overview
Psilocybin producing mushrooms are classic serotonergic psychedelics with visual effects that often feel softer and more organic than LSD, with strong patterning on natural textures and a high likelihood that mood and meaning shape what is seen.

Typical timing (oral) is onset about 15 to 60 minutes, peak often within about 1 to 3 hours, and total duration commonly about 4 to 7 hours.

### Typical visual effects
* Onset: warmth, texture shimmer, and gentle breathing are common early features
* Peak: organic drifting and rich closed eye imagery often become the focus
* Enhancements: color warmth and saturation, heightened detail in natural textures, increased pattern salience
* Distortions: breathing and gentle morphing, especially in plants, wood grain, clouds, and faces; tracers can occur
* Geometry: closed eye patterns and mandala like structures, often described as organic, rounded, vine like, or nature themed
* Hallucinations: at higher intensity, internal scenes and narrative imagery are more common than for LSD
* Perceptual alterations: strong pareidolia and animacy, emotional coloring of perception, occasional synesthesia where music influences visual flow

### Dose and intensity notes
* Threshold: enhanced color and depth, mild motion in patterns and peripheral shimmer
* Common: pronounced breathing of surfaces and organic drifting, clear closed eye geometry with natural motifs
* Strong: immersive internal scenes and archetypal imagery can dominate when eyes are closed; open eye perception can become highly animated and symbolically loaded

### Qualitative signature
A typical psilocybin look is earthy, alive, and emotionally infused: textures ripple like living tissue, nature imagery is amplified, and scenes feel meaning saturated. Geometry is often present but tends to read as soft, biological, and less neon than LSD.

### Simulation notes
* Prefer warmer palettes and less razor sharp edge enhancement than LSD
* Drive organic drift with fluid like deformation fields and subtle growth like motion in textures
* Use pattern overlays that resemble botanical or mycelial motifs, with lower angularity and more curvature
* Tie visual modulation to an audio envelope or affect signal so the imagery feels emotionally responsive

### Sources
* PsychonautWiki: Psilocybin; Visual effects, Psychedelics
* Erowid: Psilocybin mushroom Effects
* Kometer et al. 2013. Activation of Serotonin 2A Receptors Underlies the Psilocybin Induced Effects on alpha oscillations, N170 visual evoked potentials, and visual hallucinations. Journal of Neuroscience. PMID 23785166

## N,N‑DMT smoked or vaped

### Overview
Inhaled N,N‑DMT is extremely rapid onset and high intensity. Visual effects commonly escalate from fast moving geometric patterns into immersive scene replacement, often accompanied by reports of autonomous entity encounters.

Typical timing (inhaled) is onset within about 15 to 60 seconds, peak within a few minutes, and primary effects often resolve within about 6 to 20 minutes.

### Typical visual effects
* Onset: a rapid ramp of shimmer and geometry, often within seconds
* Peak: immersive hyper geometry and scene replacement, with entity encounters in some experiences
* Enhancements: extreme color intensity, novel or unusual color qualities, high apparent detail density
* Distortions: rapid field wide warping and “loading screen” style transitions as the scene destabilizes
* Geometry: high complexity hyper geometric lattices, tunnels, rotating mandalas, and fast unfolding symmetry
* Hallucinations: high likelihood of immersive internal scenes; entity encounters are commonly reported in breakthrough intensity experiences
* Perceptual alterations: strong depth and scale discontinuities, non ordinary spatial structure, rapid narrative jumps

Distinctive motifs commonly reported include tunnel like ingress, chrysanthemum like blooming geometry, ornate architectural spaces, and entity rich scenes.

### Dose and intensity notes
* Threshold: quick onset shimmer, edge outline effects, intensified colors, brief closed eye geometry
* Common: dense geometric overlays and partial scene transformation, with strong closed eye visual immersion
* Strong: full scene replacement can occur, often with perceived entry into a coherent alternate environment and entity encounters

### Qualitative signature
A common N,N‑DMT signature is hyper saturated, hyper detailed, and extremely fast: geometry feels crisp, deeply symmetrical, and often “higher dimensional” rather than merely decorative. Compared with LSD or psilocybin, the transition into full immersion is much steeper and the visual world can feel like an autonomous place.

### Simulation notes
* Use rapid ramping of intensity with a short time constant, then a similarly rapid decay
* Implement a layered pipeline: strong global warp plus nested geometric fields plus a high frequency detail amplification stage
* Use symmetry and lattice generators with depth cues, and animate them with fast phase rotation and zoom
* For entity rich looks, combine pareidolia and segmentation driven hallucination overlays so faces and agent like forms emerge from structure

### Sources
* PsychonautWiki: DMT; Visual effects, Psychedelics
* Erowid: DMT Effects
* Lawrence et al. 2022. Phenomenology and content of the inhaled N,N‑dimethyltryptamine experience. Scientific Reports. PMID 35610230
* Timmermann et al. 2019. Neural correlates of the DMT experience assessed with multivariate EEG. Scientific Reports. PMID 31745107
* Davis et al. 2020. Entity encounter experiences under N,N‑DMT: phenomenology, interpretation, and enduring effects. Journal of Psychopharmacology. PMID 32345112

## Ayahuasca oral DMT with MAOI

### Overview
Ayahuasca is an oral admixture typically combining DMT containing plants with MAOI active beta carbolines. The visual profile is often visionary and narrative, with vivid internal imagery and culturally shaped motifs, developing more slowly than inhaled DMT and lasting much longer.

Typical timing (oral) is onset about 20 to 60 minutes, with strongest effects often around about 1 to 2 hours, and total duration commonly about 4 to 8 hours.

### Typical visual effects
* Onset: waviness, breathing, and subtle patterning often build before the strongest visions
* Peak: elaborate closed eye visions and symbolic scenes are common for many users
* Enhancements: increased color vividness and contrast, glow around lights and high contrast edges
* Distortions: waviness and breathing of surfaces, especially during the ramp into peak
* Geometry: closed eye patterning can be strong, often transitioning into representational visions
* Hallucinations: elaborate closed eye visions are common, including scenes and symbolic narratives; entity and animal motifs are frequently reported
* Perceptual alterations: synesthesia and meaning enhancement can be prominent, with memory and emotion shaping visual content

Distinctive motifs often include serpents, felines, insect like beings, and ritual or nature imagery, but content varies strongly with context.

### Dose and intensity notes
* Threshold: mild enhancement plus subtle patterning behind closed eyes
* Common: clear closed eye visions and structured imagery, with open eye distortions that keep the external world present
* Strong: long sequences of internally generated scenes can dominate, sometimes with perceived communication or guidance themes

### Qualitative signature
Ayahuasca visuals are often described as cinematic and story like: geometry is present but frequently becomes representational, with a sense of meaning and agency. Compared with inhaled DMT, the pacing is slower and the visions may feel more emotionally and autobiographically organized.

### Simulation notes
* Bias toward closed eye style sequences: generate coherent scene transitions rather than only overlays on a fixed camera view
* Use narrative stitching: keep motifs consistent across cuts and morphs, as if a story is unfolding
* Combine geometric scaffolding with image to image transformation so patterns resolve into animals, faces, and symbolic scenes

### Sources
* PsychonautWiki: Ayahuasca; Visual effects, Psychedelics
* Erowid: Ayahuasca Basics; Ayahuasca Effects
* Riba et al. 2001. Psychometric assessment of the Hallucinogen Rating Scale. Drug and Alcohol Dependence. PMID 11295326
* de Araujo et al. 2012. Seeing with the eyes shut: neural basis of enhanced imagery following Ayahuasca ingestion. Human Brain Mapping. PMID 21922603

## Mescaline peyote and San Pedro

### Overview
Mescaline is a classic psychedelic phenethylamine, historically central to the scientific study of geometric hallucinations. It is strongly associated with vivid color enhancement and stable geometric patterning, including classic form constant motifs.

Typical timing (oral) is onset about 45 to 90 minutes, peak commonly around about 2 to 4 hours, and total duration often about 10 to 14 hours.

### Typical visual effects
* Onset: color brilliance and texture shimmer, with early geometric ornamentation
* Peak: stable form constant geometry and kaleidoscopic repetition tend to dominate
* Enhancements: strong color brilliance, shimmer, and aesthetic salience
* Distortions: gentle breathing and drifting, with less frenetic warping than DMT
* Geometry: prominent form constants such as lattices, spirals, tunnels, and cobweb like filigree; kaleidoscopic tiling and mandala structures
* Hallucinations: internal imagery can become elaborate at strong intensity, but many reports emphasize ornamentation and pattern over entity narratives
* Perceptual alterations: synesthesia and texture meaning can occur, with a steady contemplative tone

### Dose and intensity notes
* Threshold: color brightening, texture shimmer, mild patterned overlays
* Common: sustained geometric patterning, kaleidoscopic repetition, and clear closed eye geometry
* Strong: high density geometry that can fill the field, with occasional internal scenes and strong depth effects

### Qualitative signature
Mescaline often reads as crystalline and ornamental: geometric patterns feel like luminous decorative architecture, frequently in kaleidoscopic and filigreed forms. Compared with LSD, the look is often less neon and less aggressively sharp, but still richly colored and highly patterned.

### Simulation notes
* Use bright but balanced color enhancement with emphasis on luminous mids and highlights
* Implement form constant generators: lattice, spiral, tunnel, cobweb, then map them into view space with log polar style warps
* Animate slowly and steadily, prioritizing coherence over rapid novelty

### Sources
* PsychonautWiki: Mescaline; Visual effects, Psychedelics
* Erowid: Mescaline dose and duration information; cactus experience guides
* Bressloff and Cowan 2002. What geometric visual hallucinations tell us about the visual cortex. Neural Computation. PMCID PMC1088430
* Holze et al. 2023. Comparative acute effects of mescaline, LSD, and psilocybin in healthy participants. Neuropsychopharmacology. PMID 37231080

## 2C family with focus on 2C‑B and 2C‑E

### Overview
The 2C series are psychedelic phenethylamines with a strong tendency toward visual patterning and color enhancement. 2C‑B is often described as visually rich but comparatively manageable, while 2C‑E is frequently described as more intense, more geometric, and more cognitively demanding.

Typical timing (oral) varies by compound, but onset is often about 20 to 90 minutes, with peak effects around about 2 to 4 hours, and total duration often about 4 to 9 hours.

### Typical visual effects
* Onset: color pop and glow, followed by early pattern salience on textured surfaces
* Peak: overlay driven geometry and drifting, with 2C‑E often feeling sharper and more forceful
* Enhancements: strong color enhancement, especially with bright or luminous light sources; heightened texture contrast
* Distortions: patterned drifting on surfaces, cartoon like morphing, mild to moderate tracers
* Geometry: clear surface overlays, symmetric tiling, and fractal like motifs; 2C‑E often trends toward sharper geometry
* Hallucinations: usually less immersive scene replacement than DMT, but closed eye visuals can be strong at higher intensity
* Perceptual alterations: music can strongly steer the feel of motion and pattern; body sensation can modulate visual intensity

### Dose and intensity notes
* Threshold: brightened colors, slight glow, pattern salience with subtle motion
* Common: stable pattern overlays and drifting, with enjoyable geometry and moderate tracers
* Strong: dense patterning, stronger morphing and depth warps, and more intense closed eye visuals; 2C‑E may feel notably more forceful in geometry and affect

### Qualitative signature
A common 2C‑B signature is playful, vivid, and overlay driven: the world can look decorated with luminous patterns, sometimes with a cartoon or posterized vibe. A common 2C‑E signature is crisper and more geometric, with higher perceived structure and less softness.

### Simulation notes
* Emphasize luminous color pop and glow effects on light sources and saturated objects
* Use overlay geometry that feels “attached” to surfaces, with relatively stable structure compared with LSD
* For 2C‑B, lean into playful palettes and smooth motion; for 2C‑E, increase angularity, symmetry, and contrast

### Sources
* PsychonautWiki: 2C‑B; 2C‑E; Visual effects, Psychedelics
* Erowid: 2C‑B Effects; 2C‑E Effects
* Papaseit et al. 2018. Acute pharmacological effects of 2C‑B in humans. Frontiers in Pharmacology. PMID 29593537
* Vizeli et al. 2020. Pharmacokinetics and subjective effects of 2C‑E in recreational users. PMID 32256350

## MDMA and MDA

### Overview
MDMA is primarily an entactogen and stimulant and is usually not strongly visual compared with classic psychedelics. Visual changes tend to be mild and context dependent. MDA, a related compound, is more consistently psychedelic and tends to produce stronger and longer lasting visual alterations than MDMA.

Typical timing (oral) for MDMA is onset about 30 to 60 minutes, peak about 1 to 2 hours, and total duration often about 3 to 6 hours. MDA often lasts longer, commonly about 4 to 8 hours or more, with more noticeable visual components.

### Typical visual effects
* Onset: glow and pleasant brightness shifts are common early cues
* Peak: for MDMA, visuals often remain in enhancement territory; for MDA, patterned imagery is more likely
* Enhancements: color appreciation, glow around lights, increased pattern salience in the environment
* Distortions: mild tracers can appear in some settings, especially with moving lights; subtle waviness can occur
* Geometry: for MDMA, strong geometry is uncommon; for MDA, closed eye visuals and patterned imagery are more likely
* Hallucinations: well formed external hallucinations are not typical for MDMA; MDA shows more hallucinogen like imagery in controlled studies
* Perceptual alterations: strong affective beauty and social salience; occasional synesthesia like coupling where music feels visual

### Dose and intensity notes
* Threshold: enhanced brightness and pleasant glow, minimal distortions
* Common: mild trails and visual “sparkle” in lights and textures, mostly enhancements rather than restructuring
* Strong: MDMA can still remain mostly non visual, but MDA is more likely to show clear patterning and internal imagery

### Qualitative signature
A typical MDMA visual signature is “everything looks better”: lights feel soft and radiant, colors feel emotionally warm, and patterns are aesthetically magnetic without strong warping. A typical MDA signature moves closer to a classic psychedelic look: more closed eye imagery, more patterning, and a longer tail of visual effects.

### Simulation notes
* Keep distortion amplitudes low and focus on glow, warmth, and gentle contrast shaping
* Add very mild motion trails around bright moving objects rather than global tracers
* If simulating MDA, increase closed eye style geometry and allow modest surface drift

### Sources
* PsychonautWiki: MDMA; MDA; Visual effects, Psychedelics
* Erowid: MDMA bits on visual changes; MDA Effects
* Liechti et al. 2000. Psychological and physiological effects of MDMA after pretreatment with ketanserin. PMID 10989266
* Liechti et al. 2025. MDMA versus MDA comparison study including visual alterations. PMID 40999236
* Holze et al. 2019. Acute effects of MDA in healthy participants. PMID 30967099

## 5‑MeO‑DMT

### Overview
5‑MeO‑DMT is a potent psychedelic with rapid onset, often characterized more by dissolution of self and sensory boundaries than by complex colorful visuals. Visual effects can be minimal or dominated by bright field effects and reduced form structure.

Typical timing is rapid onset within seconds when inhaled and a short primary duration on the order of minutes, while intranasal formulations in controlled studies show peak within minutes and resolution within about an hour.

### Typical visual effects
* Onset: rapid brightening and boundary softening, sometimes within seconds for inhalation
* Peak: field wide intensity and dissolution, often with minimal structured imagery
* Enhancements: brightening of the entire field, glow, and “whiteout” like luminance
* Distortions: loss of stable edges and boundaries rather than ornate deformation
* Geometry: when present, tends to be simple and high contrast, sometimes monochrome or minimally colored
* Hallucinations: immersive content is less reliably visual than for N,N‑DMT; the experience often emphasizes non visual unity states
* Perceptual alterations: strong non dual or ego dissolving phenomenology that can accompany minimal imagery

### Dose and intensity notes
* Threshold: subtle light and color shifts, soft halos
* Common: strong boundary dissolution and bright field effects, with limited structured imagery
* Strong: field wide intensity can become so high that distinct objects or patterns are hard to maintain, producing a sense of pure brightness or void

### Qualitative signature
A common 5‑MeO‑DMT signature is luminous dissolution: the scene may not “fill with pictures” as with DMT, but instead loses separations, compressing perception toward brightness, emptiness, or uniform glow.

### Simulation notes
* Reduce reliance on geometric overlays; focus on boundary erosion, bloom, and global luminance ramps
* Use exposure and bloom as primary controls, with optional minimal monochrome geometry at higher intensity
* Let structure collapse toward uniform fields rather than adding representational imagery

### Sources
* PsychonautWiki: 5‑MeO‑DMT
* Erowid: 5‑MeO‑DMT Basics
* Uthaug et al. 2025. Mapping the phenomenology of intranasal 5‑MeO‑DMT in psychedelic naive healthy adults. Scientific Reports. PMID 38072874

## Salvia divinorum

### Overview
Salvia divinorum and its active compound salvinorin A are hallucinogens with a distinctive profile compared with serotonergic psychedelics. Visual effects are often abrupt and scene restructuring, with strong alterations of spatial continuity, perspective, and self location.

Typical timing (inhaled) is onset within about 20 to 60 seconds, peak within a couple of minutes, and return toward baseline often within about 20 to 40 minutes.

### Typical visual effects
* Onset: abrupt perspective shift and scene instability, often within seconds when inhaled
* Peak: strong spatial discontinuity and possible scene replacement into alternate environments
* Enhancements: not a primary feature, although brightness and contrast shifts can occur
* Distortions: strong spatial tearing, folding, stretching, and repetition effects; “page turning” or “conveyor belt” style motion is often reported
* Geometry: less classic fractal geometry and more structural slicing and tiling of the scene
* Hallucinations: rapid scene replacement and alternate environment experiences can occur, sometimes with a cartoon like or mechanical feel
* Perceptual alterations: strong dissociative perspective shifts, loss of self location, and confusion about what is real or where one is

### Dose and intensity notes
* Threshold: brief dreamlike shifts in perspective and mild scene instability
* Common: strong spatial restructuring, repeated panels or slices of the scene, and compelling motion sensations
* Strong: full immersion into alternate scenes with severe discontinuity from ordinary perception

### Qualitative signature
Salvia often looks and feels like reality is being physically rearranged rather than decorated: the scene can fracture into repeating strips, rotate like a hinged book, or slide as if on a mechanical track. Compared with classic psychedelics, the geometry is less ornamental and more structural and discontinuous.

### Simulation notes
* Prioritize discontinuities: slicing, tiling, and panel based repetition that moves coherently through time
* Use aggressive perspective jumps and scene cuts that still preserve a single motion direction, like conveyor motion
* Avoid overly “psychedelic” rainbow fractals as a default; keep color changes secondary to spatial restructuring

### Sources
* PsychonautWiki: Salvia divinorum
* Erowid: Salvia divinorum Basics; Salvia Effects
* Johnson et al. 2011. Human psychopharmacology and dose effects of salvinorin A. Drug and Alcohol Dependence. PMID 21131142

## Contrast note on deliriants (comparison only)

### Overview
Anticholinergic deliriants are included here only as a contrast class. Their hallucinations are often realistic, confusing, and difficult to distinguish from reality, and they typically lack the crisp geometric patterning associated with classic psychedelics.

### Typical visual effects
* Onset: growing confusion and visual misinterpretations can precede more formed hallucinations
* Peak: realistic hallucinations with low insight are more characteristic than geometric overlays
* Hallucinations: fully formed people, insects, and objects can appear as if they are truly present
* Distortions: blurred vision and difficulty focusing can contribute to misinterpretations
* Perceptual alterations: high confusion, poor insight, and a dreamlike delirious narrative quality

### Simulation notes
* Prefer realistic object insertion over geometric overlays
* Add attentional instability and poor scene coherence rather than symmetric patterning

### Sources
* Diphenhydramine intoxication with vivid insect hallucinations case report. PMID 3338401
* Datura stramonium delirium with visual hallucinations case report. PMID 25341608
