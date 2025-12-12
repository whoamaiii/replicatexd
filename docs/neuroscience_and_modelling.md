## Neuroscience and modelling knowledge

## Goal
Summarize mechanisms that plausibly generate psychedelic visual effects, and translate them into modelling hooks for image and video simulation.

## Model provider note
The server side model calls in this project are routed through OpenRouter.

Vision plus analysis uses the OpenRouter Responses endpoint with model openai/gpt-5.2.

Reimagined image generation uses OpenRouter chat completions with an image capable model such as black-forest-labs/flux.2-pro.

Configure the server with OPENROUTER_API_KEY and optionally OPENROUTER_BASE_URL.

## Serotonergic psychedelics and 5‑HT2A driven cortical dynamics
Classic psychedelics such as LSD, psilocybin, mescaline, and N,N‑DMT share a key pharmacological driver: agonism at serotonin 2A receptors (5‑HT2A) in cortex. Human studies repeatedly show that blocking 5‑HT2A with ketanserin strongly reduces or abolishes many hallmark psychedelic effects, including visual alterations.

A controlled psilocybin study linked 5‑HT2A activation to measurable changes in occipital alpha oscillations and early visual evoked potentials, with those changes correlating with reported visual hallucinations. This provides a direct bridge from receptor action to altered visual processing.

Practical modelling takeaway: increasing cortical excitability and decreasing the stability of early visual representations should push a simulator from enhancement into distortions, then into structured geometry and hallucinations.

## Retino cortical mapping, form constants, and pattern formation
Many geometric hallucinations fall into recurring families historically called form constants: tunnels, spirals, lattices, and cobweb like meshes. A major computational neuroscience line explains these as emergent patterns of activity in primary visual cortex (V1), shaped by V1 lateral connectivity and by the retinotopic mapping from visual field to cortex.

Bressloff and Cowan showed that when V1 dynamics enter pattern forming regimes, the resulting cortical activity patterns, when mapped back into visual coordinates, naturally produce the same families of hallucinated forms. This links phenomenology to symmetry and connectivity constraints of V1. Work in this area is often described as a neural analogue of Turing style pattern formation, where interactions between excitation and inhibition yield stable spatial modes.

Practical modelling takeaway: a small library of procedural generators for tunnels, spirals, lattices, and cobweb filigree, plus a retinotopic style warp and time evolution, can cover a surprisingly large fraction of classic geometric imagery.

## Thalamic gating, predictive processing, and REBUS
Psychedelic visual effects are not only bottom level V1 patterns. They also involve changes in how the brain filters sensory input and how strongly top down expectations constrain perception.

Thalamic connectivity studies under LSD show altered thalamo cortical coupling and increased global or thalamic connectivity patterns that depend on 5‑HT2A activation. Conceptually, reduced thalamic gating can increase the gain on incoming sensory data and also allow more internally generated activity to enter perceptual inference.

In predictive processing terms, perception combines sensory evidence with prior expectations. The REBUS model proposes psychedelics relax the precision weighting of high level priors, allowing bottom up signals and latent content to play a larger role. This creates a plausible pathway to intensified pareidolia, meaning amplification, and scene like hallucinations: the system becomes more willing to explain ambiguous input with rich internal hypotheses.

Practical modelling takeaway: treat hallucination as altered inference. Increase ambiguity, reduce stabilization, and add semantic feature amplification so that weak cues can grow into strong interpretations.

## Brain network changes and increased signal complexity
Neuroimaging work under LSD shows increased functional connectivity of visual cortex with other networks and links these changes to reported hallucination intensity. Complementary work using complexity measures finds that LSD and psilocybin increase fractal dimension of brain activity and functional connectivity networks, consistent with higher dynamical complexity.

Practical modelling takeaway: visuals should become more complex across space and time as intensity rises. This can be implemented as multi scale modulation, deeper feedback, and richer coupling between modules that are normally more independent.

## Computational and simulation inspiration
Deep neural network feature amplification can create psychedelic like transformations by amplifying learned features and feeding them back into the image. The Hallucination Machine applied such feature amplification to panoramic video in virtual reality, producing subjective ratings that overlap with some psychedelic phenomenology dimensions while not reproducing all aspects of drug states.

Practical modelling takeaway: a hybrid approach is effective.

* Procedural layer: geometry generators, warps, trails, symmetry, and palette control
* Learned layer: feature amplification or diffusion based transforms guided by segmentation and prompts

## Translating mechanisms into simulation parameters
A practical parameterization that maps well onto both phenomenology and modelling is:

* Enhancements
  * colorGain
  * localContrastGain
  * edgeAcuityGain
  * glowBloomStrength
  * textureSalienceGain
* Distortions
  * breathingAmplitude
  * driftSpeed
  * flowCurlStrength
  * meltViscosity
  * tracerPersistence
  * afterimageDecay
  * fovWarpAmount
* Geometry
  * geometryOpacity
  * geometryComplexity
  * symmetryOrder
  * formConstantMix (tunnel, spiral, lattice, cobweb)
  * fractalRecursionDepth
  * kaleidoscopeMix
* Hallucinations
  * closedEyeSceneStrength
  * sceneCoherence
  * entityEmergenceStrength
  * sceneReplacementProbability
* Perceptual alterations
  * pareidoliaGain
  * audioVisualCoupling
  * depthScaleInstability

The key implementation detail is time coherence: psychedelic visuals are usually experienced as living and continuous rather than as random frame noise. Even when rapid, the motion tends to have structure.

## References
* Carhart Harris et al. 2016. Neural correlates of the LSD experience revealed by multimodal neuroimaging. PNAS. PMID 27071089
* Kometer et al. 2013. Activation of Serotonin 2A Receptors Underlies the Psilocybin Induced Effects on alpha oscillations, N170 visual evoked potentials, and visual hallucinations. Journal of Neuroscience. PMID 23785166
* Preller et al. 2018. Changes in global and thalamic brain connectivity in LSD induced altered states of consciousness are attributable to the 5‑HT2A receptor. eLife. PMCID PMC6377471
* Carhart Harris and Friston 2019. REBUS and the Anarchic Brain. Pharmacological Reviews. PMID 31221820
* Bressloff and Cowan 2002. What geometric visual hallucinations tell us about the visual cortex. Neural Computation. PMCID PMC1088430
* Tagliazucchi et al. 2016. Increased Global Functional Connectivity Correlates with LSD Induced Ego Dissolution. Current Biology. PMID 27085214
* Varley et al. 2020. Serotonergic psychedelics LSD and psilocybin increase fractal dimension of cortical brain activity. NeuroImage. PMID 32619708
* Suzuki et al. 2017. The Hallucination Machine: a deep dream virtual reality platform for studying altered perceptual phenomenology. Scientific Reports. PMID 29167538
* de Araujo et al. 2012. Seeing with the eyes shut: neural basis of enhanced imagery following Ayahuasca ingestion. Human Brain Mapping. PMID 21922603
