# Frequently Asked Questions

Common questions about PsyVis Lab.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [General Questions](#general-questions)
2. [Technical Questions](#technical-questions)
3. [Usage Questions](#usage-questions)
4. [Effect & Substance Questions](#effect--substance-questions)
5. [Troubleshooting](#troubleshooting)
6. [Contributing & Community](#contributing--community)

---

## General Questions

### What is PsyVis Lab?

PsyVis Lab is an AI-powered application for analyzing images and generating psychedelic visual effect variants. It uses vision models to detect visual features and map them to substance-specific psychedelic effects based on scientific research and phenomenological reports.

---

### Is this legal?

Yes. PsyVis Lab is software that creates visual art inspired by documented psychedelic phenomenology. It does not contain, produce, or synthesize any controlled substances. It's a tool for research, art, and education.

---

### Do I need API credits to use this?

Yes. You need an OpenRouter account with API credits. The free tier includes starting credits. OpenRouter provides access to multiple AI models at competitive pricing.

Get an API key at: [https://openrouter.ai](https://openrouter.ai)

---

### Can I use this offline?

No, currently requires internet for API calls to OpenRouter. Local model support (Ollama, llama.cpp) is planned for future releases.

---

### How much does it cost to run?

**Costs vary by usage**:
- Vision analysis: ~$0.01-0.05 per image (depending on size)
- Image generation: ~$0.05-0.20 per image (depending on model and size)
- Average workflow: $0.10-0.30 per complete analysis + generation

Check [OpenRouter pricing](https://openrouter.ai/docs#pricing) for current rates.

---

### Is my data private?

**Privacy details**:
- Images are sent to OpenRouter API for analysis/generation (see [OpenRouter Privacy Policy](https://openrouter.ai/privacy))
- Images are NOT permanently stored on our servers
- Generated images saved to library (optional, configurable retention)
- No tracking or analytics in the application
- All processing happens server-side, API keys never exposed to browser

---

## Technical Questions

### What AI models are used?

**Vision Analysis**: `openai/gpt-4o` via OpenRouter (default, configurable)

**Image Generation**: `black-forest-labs/flux.2-pro` via OpenRouter (recommended)

Other supported models: Any vision or image model available on OpenRouter

---

### What tech stack powers PsyVis Lab?

**Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS

**Backend**: Express 4, Node.js (ESM), Zod validation

**AI**: OpenRouter API (multi-model support)

**Optional**: Python 3.9+ for structural map generation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

---

### Can I self-host?

Yes! See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions. Options include:
- Single VPS with systemd
- Docker containers
- Cloud platforms (AWS, Google Cloud, Azure)

---

### What are the system requirements?

**Minimum**:
- Node.js 18+
- 2GB RAM
- 10GB storage

**Recommended**:
- Node.js 20 LTS
- 4GB RAM
- 50GB SSD storage
- Optional: Python 3.9+ for maps

---

### Why is analysis/generation slow?

**Expected times**:
- Analysis: 30-90 seconds (AI processing)
- Generation: 60-180 seconds (AI image generation)
- Map generation: 15-30 seconds (Python worker)

**Speed is limited by**:
- OpenRouter API latency (not under our control)
- Image size (larger = slower)
- Prompt complexity

See [PERFORMANCE.md](./PERFORMANCE.md) for optimization tips.

---

## Usage Questions

### How do I get started?

1. **Install**: `npm install`
2. **Configure**: Copy `env.example` to `.env`, add `OPENROUTER_API_KEY`
3. **Run**: `npm run dev`
4. **Upload**: Drag image into upload zone
5. **Analyze**: Select substance and dose, click "Analyze"
6. **Generate**: Review effects, click "Generate Variant"

See [USER_GUIDE.md](./USER_GUIDE.md) for detailed walkthrough.

---

### What makes a good input image?

**Best results**:
- Nature scenes (forests, flowers, water)
- Geometric architecture
- Abstract art and patterns
- Portraits with clear features
- Textured surfaces

**Recommended size**: 1024-2048px (largest dimension)

**Avoid**:
- Very dark/low-contrast images
- Extremely compressed (artifacts)
- Pure solid colors
- Very small images (<256px)

---

### How accurate are the psychedelic effects?

Effects are based on:
- Systematic phenomenological research
- Experience reports from PsychonautWiki and Erowid
- Scientific literature on psychedelic neuroscience

**However**: Individual experiences vary significantly based on set, setting, dose, biochemistry, and substance purity. These are **approximations**, not exact reproductions.

---

### Can I use generated images commercially?

**Check these factors**:
1. **Input image copyright**: Do you own rights to the original?
2. **Generated image rights**: Review [OpenRouter Terms](https://openrouter.ai/terms) and model-specific licenses
3. **Fair use**: Depends on jurisdiction and use case

**Recommendation**: Use your own original images as input for commercial work.

---

### Can I export prompts to other tools?

**Yes!** Copy prompts from Prompt Lab and use in:
- Midjourney (adapt syntax: comma-separated, add --parameters)
- DALL-E 3 (use as-is or slight adaptation)
- Stable Diffusion (add negative prompt, adjust weights)
- Leonardo.ai, Playground AI, etc.

See [PROMPT_ENGINEERING.md](./PROMPT_ENGINEERING.md) for adaptation guides.

---

## Effect & Substance Questions

### How many effects are there?

**37 distinct effects** organized in 5 groups:
- **Enhancements** (6): Color, contrast, acuity, etc.
- **Distortions** (12): Breathing, drifting, morphing, etc.
- **Geometry** (9): Fractals, mandalas, form constants
- **Hallucinations** (5): Entities, scene replacement
- **Perceptual** (5): Synesthesia, time distortion

See [effects_catalog.md](./effects_catalog.md) for the Effects Studio catalog guide.

---

### What's the difference between substances?

Each substance has a unique visual signature:

**LSD**: Sharp geometric patterns, vivid colors, precise fractals, breathing textures

**Psilocybin**: Organic flow, emotional warmth, gentle morphing, mandala forms

**DMT**: Hyperspace tunnels, alien entities, impossible colors, breakthrough visuals

**5-MeO-DMT**: White light, void, minimal form, ego dissolution, unity consciousness

**Mescaline**: Crystalline geometry, warm colors, stable patterns, indigenous motifs

See [substance_visual_profiles.md](./substance_visual_profiles.md) for detailed phenomenology.

---

### What does the dose parameter mean?

**Normalized 0.0 to 1.0 scale**:

- **0.0-0.3** (Threshold): Subtle enhancements only
- **0.3-0.7** (Common): Clear effects, scene still anchored
- **0.7-1.0** (Strong): Intense geometry, potential hallucinations

**Not** a direct dosage in mg/μg. It's a subjective intensity scale mapped to typical dose ranges for each substance.

---

### Can I create custom substance profiles?

Not currently via UI, but you can:
1. Use "custom_mix" substance ID
2. Manually adjust effect intensities with overrides
3. Contribute new profiles (see [CONTRIBUTING.md](../CONTRIBUTING.md))

---

### How do I add new effects?

See [CONTRIBUTING.md - Adding Effects](../CONTRIBUTING.md#adding-effects-to-the-catalog).

**Quick summary**:
1. Edit `data/visual_effects.json`
2. Follow schema exactly
3. Include research citations
4. Test with analysis
5. Submit pull request

---

## Troubleshooting

### "Invalid API key" error

**Solutions**:
1. Check `.env` has `OPENROUTER_API_KEY=sk-or-v1-...`
2. Verify key is valid at [OpenRouter Keys](https://openrouter.ai/keys)
3. Restart server after updating `.env`

---

### Analysis/generation times out

**Solutions**:
1. Reduce image size (resize to 1024px max)
2. Check internet connection stability
3. Try again (API can be slow during peak times)
4. Check [OpenRouter Status](https://status.openrouter.ai)

---

### Maps not generating

**Solutions**:
1. Check `MAPS_ENABLED=true` in `.env`
2. Verify Python installed: `python3 --version`
3. Install dependencies: `pip install opencv-python Pillow numpy mediapipe`
4. Check logs for specific errors

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for comprehensive guide.

---

### Generated image doesn't show effects

**Possible causes**:
- Dose too low (try 0.6-0.8)
- Effects too subtle (boost with group multipliers)
- Model variance (try generating again)
- Router blocking effects (check protection settings)

**Solutions**:
1. Increase dose
2. Use group multipliers: `geometry: 1.5`, `distortions: 1.5`
3. Try "experimental" prompt flavor
4. Disable router protection

---

### Out of memory errors

**Solutions**:
1. Reduce image size before upload
2. Lower `MAPS_MAX_IMAGE_MP` in `.env`
3. Increase server RAM
4. Clear map cache: `rm -rf map_cache/*`
5. Reduce library retention days

---

## Contributing & Community

### How can I contribute?

**Many ways to help**:
- Add new effects to catalog
- Expand substance profiles
- Improve documentation
- Fix bugs
- Add tests
- Create tutorials
- Share example generations

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

---

### Where can I get help?

**Resources**:
- [User Guide](./USER_GUIDE.md) - Complete usage instructions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [GitHub Discussions](https://github.com/your-repo/discussions) - Community help
- [GitHub Issues](https://github.com/your-repo/issues) - Bug reports

---

### Is there a community?

**Connect with other users**:
- GitHub Discussions (Q&A, ideas, showcase)
- GitHub Issues (bugs, features)
- Discord (if available - check README)

**Share your work**: Tag #PsyVisLab on social media

---

### Can I request features?

Yes! Open a [Feature Request](https://github.com/your-repo/issues/new?template=feature_request.md) on GitHub.

**Popular requests**:
- Video/animation support
- Batch processing
- Local model integration
- Mobile app
- Real-time preview

---

### How is this different from other AI art tools?

**Unique features**:
- **Research-backed effects**: 70+ catalogued effects from scientific literature
- **Substance-specific**: Different visual signatures for each psychedelic
- **Phenomenological accuracy**: Effects mapped to actual reports, not random filters
- **Effect router**: Precise control over where effects appear
- **Multi-flavor prompts**: 6 different prompt strategies
- **Open source**: Transparent, customizable, community-driven

---

## Still Have Questions?

**Check these resources**:
- [Complete Documentation](../README.md#links) - All guides
- [API Reference](./API_REFERENCE.md) - Technical details
- [Effects Catalog](./effects_catalog.md) - Effect families + intensity guide

**Need more help?**
- Open a [GitHub Discussion](https://github.com/your-repo/discussions)
- File an [Issue](https://github.com/your-repo/issues)
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated**: 2025-12-12 | [Edit this page](https://github.com/your-repo/edit/main/docs/FAQ.md)
