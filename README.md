# 🌀 PsyVis Lab

> AI-powered analysis and generation of substance-specific psychedelic visual effects

Transform images into scientifically-informed psychedelic visual experiences using AI vision analysis and a comprehensive catalog of 70+ documented effects.

---

## Why PsyVis Lab?

**Scientifically-Grounded Effects**
Not random filters—every effect is mapped to actual phenomenology from LSD, psilocybin, DMT, 5-MeO-DMT, and mescaline research.

**Intelligent AI Analysis**
Vision models detect structural elements (symmetry, organic forms, geometric patterns, depth cues) and intelligently route them to substance-specific effect profiles.

**Multi-Flavor Prompt System**
Generate variants using 6 different prompt strategies optimized for OpenAI, Midjourney, Kling, and technical applications.

**Research & Art Tool**
Built for consciousness researchers, psychedelic-assisted therapy visualization, visionary artists, and VR/game developers exploring altered-state aesthetics.

---

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- [OpenRouter API key](https://openrouter.ai) (free tier available)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd psyvis_lab
npm install

# Configure environment
cp env.example .env
# Add your OPENROUTER_API_KEY to .env

# Start development servers (frontend + backend)
npm run dev
```

### Access
Open [http://localhost:5173](http://localhost:5173)

### First Analysis
1. Upload an image (nature, architecture, art—anything works)
2. Select substance profile and intensity (0.0 = threshold, 1.0 = breakthrough)
3. Click **Analyze Image**
4. Explore detected effects, structural maps, and generated prompts
5. Generate a psychedelic variant

---

## ✨ Features

### 🔍 AI Vision Analysis
- Detects 20+ structural features: symmetry, fractals, organic forms, geometric patterns, depth cues
- Intelligent effect routing based on image characteristics
- Customizable analysis models (GPT-4o, Claude Sonnet, Gemini via OpenRouter)

### 🎨 Psychedelic Effect Library
- **70+ scientifically-documented effects** across 5 categories:
  - **Enhancements**: Color saturation, contrast, visual acuity, pattern recognition
  - **Distortions**: Breathing, drifting, morphing, tracers, afterimages
  - **Geometry**: Fractals, mandalas, form constants, tunnels
  - **Hallucinations**: Scene replacement, entity manifestation, novel content
  - **Perceptual**: Synesthesia, time distortion, depth perception shifts
- Each effect includes intensity ranges, typical manifestation patterns, and simulation notes

### 🧪 Substance Profiles
- **LSD**: Geometric patterns, enhanced colors, vivid fractals, breathing textures
- **Psilocybin**: Organic forms, natural enhancement, emotional coloring, gentle drift
- **DMT**: Intense geometric fractals, alien aesthetics, hyperspace tunnels, entity encounters
- **5-MeO-DMT**: Void states, unity consciousness, infinite white light, ego dissolution
- **Mescaline**: Enhanced textures, indigenous patterns, warm color shifts, stable geometry
- **Custom Mix**: Blend multiple substance profiles with custom intensity curves

### 🎭 Multi-Flavor Prompt System
Six generation strategies optimized for different creative goals:
- **Structural**: Preserves composition with surface-locked effects
- **Poetic**: Lyrical, metaphorical descriptions for artistic interpretation
- **Technical**: Explicit taxonomy language for precise control
- **Experimental**: Novel combinations and unexpected pairings
- **Hybrid**: Balanced approach combining multiple strategies
- **Minimal**: Concise, essential-only prompts

### 🗺️ Structural Maps
Optional map generation for guided effect placement:
- **Depth Maps**: Spatial layering and perspective preservation
- **Normal Maps**: Surface curvature and lighting cues
- **Edge Maps**: Composition and structural lines
- **Segmentation**: Object-aware boundaries
- **Face/Hands Masks**: Protection regions for identity preservation

### 🎯 Effect Router
Granular control over where effects manifest:
- Region targeting (face, hands, subject, background, global)
- Depth band placement (near, mid, far)
- Per-effect strength multipliers
- Group-level scaling (boost all geometry, reduce all hallucinations, etc.)
- Surface lock strength to embed effects in image structure

### 📚 Project Library
- Save analysis results with custom notes
- Auto-cleanup for temporary projects (configurable retention)
- Pin projects permanently
- Export prompts for use in external tools (Midjourney, DALL-E, Stable Diffusion)
- Download bundles (image + metadata + prompts)

---

## 💡 Who Is This For?

**🔬 Consciousness Researchers**
Visualize and communicate subjective psychedelic phenomenology. Create reference materials for clinical settings. Study pattern recognition and visual processing alterations.

**🎨 Visionary Artists**
Generate concept art with substance-specific aesthetics. Explore visual territories informed by altered states. Create portfolio work with unique stylistic direction grounded in research.

**🧘 Psychedelic-Assisted Therapy**
Prepare clients visually for therapeutic journeys. Process and externalize visual experiences post-session. Create personalized integration materials.

**🎮 Game & VR Developers**
Design psychedelic game environments with authentic aesthetics. Research visual effects for altered-state simulations. Generate asset concepts and mood boards.

**📚 Educators & Harm Reductionists**
Create educational materials about psychedelic effects. Illustrate safety information and set/setting concepts. Demystify visual phenomena for informed decision-making.

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS
- **Backend**: Express 4, Node.js (ESM)
- **AI Services**: OpenRouter API (multi-model support), OpenAI fallback
- **Validation**: Zod schemas for all API inputs
- **Optional**: Python for advanced structural map generation

### System Overview
```
┌─────────────────┐      ┌──────────────────┐
│  React Frontend │◄────►│  Express Backend │
│   (Port 5173)   │ API  │   (Port 5174)    │
└─────────────────┘      └────────┬─────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  OpenRouter API    │
                        │  Vision + Image    │
                        └────────────────────┘
```

### Project Structure
```
psyvis_lab/
├── src/              # React frontend
│   ├── components/   # UI components (analysis, prompts, maps, router, etc.)
│   ├── lib/          # Client utilities and API client
│   └── types/        # Frontend type definitions
├── server/src/       # Express backend
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic (analysis, generation, prompts, etc.)
│   ├── openai/       # OpenRouter/OpenAI client
│   └── config/       # Environment validation
├── shared/types/     # Shared TypeScript interfaces
├── data/             # Effect catalog (visual_effects.json)
└── docs/             # Additional documentation
```

### Data Flow
1. User uploads image (stored as data URL in browser)
2. Backend sends to vision model with substance-specific effect detection prompt
3. Model returns structural analysis + mapped effects
4. Frontend displays results and generates multi-flavor prompts
5. Optional: Generate variant through image model with effect guidance

**See also**: [docs/DESIGN.md](./docs/DESIGN.md) • [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)

---

## 🛠️ Development

### Commands
```bash
npm run dev          # Start both frontend + backend concurrently
npm run dev:web      # Frontend only (port 5173)
npm run dev:server   # Backend only (port 5174)
npm run build        # Production build (web + server)
npm run lint         # ESLint check
npm run test         # Run all tests (Vitest)
```

### Environment Variables
```env
OPENROUTER_API_KEY=your_key_here  # Required
OPENAI_API_KEY=your_key_here      # Optional fallback
PORT=5174                          # Server port
LIBRARY_RETENTION_DAYS=5           # Auto-cleanup days for unsaved projects
MAPS_ENABLED=true                  # Enable structural map generation
```

**See**: [env.example](./env.example) for complete list

### Development Proxy
Vite proxies `/api/*` requests to Express backend at `127.0.0.1:5174`

### Adding New Effects
1. Edit `data/visual_effects.json`
2. Follow existing schema:
   ```json
   {
     "id": "unique_effect_id",
     "group": "enhancements|distortions|geometry|hallucinations|perceptual",
     "family": "amplification|suppression|distortion|geometry|cognitive",
     "displayName": "Human-readable name",
     "shortDescription": "One-line summary",
     "simulationHints": ["Practical knob 1", "Practical knob 2", "Practical knob 3"],
     "typicalIntensityRange": { "min": 0.0, "max": 1.0 },
     "doseResponse": { "curve": "linear|easeIn|easeOut", "anchor": "micro|common|heroic" },
     "sources": [{ "label": "PsychonautWiki — ...", "url": "https://psychonautwiki.org/wiki/..." }]
   }
   ```
3. Effects automatically available in UI after restart

---

## 🗺️ Roadmap

- [ ] Real-time generation preview with streaming
- [ ] Batch processing for multiple images
- [ ] Advanced structural map algorithms (Python integration complete)
- [ ] Video/animation support with temporal coherence
- [ ] Community effect library contributions and curation
- [ ] API endpoints for programmatic access
- [ ] Mobile app (React Native)
- [ ] Local model support (Ollama, llama.cpp)

---

## 🤝 Contributing

Contributions welcome! Areas of interest:

**Effect Library**
Add new documented effects with phenomenological citations. Expand substance profiles with research references.

**UI/UX**
Improve workflows and visualizations. Enhance accessibility and mobile responsiveness.

**Model Integration**
Add support for new vision and image generation models. Optimize prompts for specific model capabilities.

**Documentation**
Create examples, tutorials, and case studies. Improve API documentation with more examples.

**Testing**
Expand test coverage for services and components. Add integration tests for complete workflows.

### Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**See**: [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines

---

## ⚠️ Responsible Use

This tool is designed for:
- Research and educational purposes
- Artistic exploration and creative work
- Therapeutic preparation and integration support
- Understanding consciousness and perception

### Important Notes
- This software does NOT contain or synthesize controlled substances
- Visual representations are approximations based on phenomenological reports
- Individual experiences vary significantly based on set, setting, dosage, and biochemistry
- Not medical advice—consult qualified professionals for therapeutic applications
- Respect intellectual property when generating derivative works
- Follow harm reduction principles if exploring altered states of consciousness

### Resources
- [MAPS](https://maps.org) - Multidisciplinary Association for Psychedelic Studies
- [Erowid](https://erowid.org) - Experience reports and safety information
- [Fireside Project](https://firesideproject.org) - Peer support hotline
- [PsychonautWiki](https://psychonautwiki.org) - Subjective effects index

---

## ❓ FAQ

**Q: Do I need API credits to use this?**
A: Yes, you need an OpenRouter account. Free tier includes credits to get started. OpenRouter provides access to multiple AI models at competitive pricing.

**Q: Can I use this offline?**
A: No, currently requires internet for API calls. Local model support (Ollama, llama.cpp) is planned for future releases.

**Q: What image models are supported for generation?**
A: OpenRouter supports 50+ models. Recommended: FLUX.2-Pro, DALL-E 3, Stable Diffusion XL. Check [provider_capabilities.md](./docs/provider_capabilities.md) for details.

**Q: How accurate are the effect representations?**
A: Based on systematic phenomenological research and experience reports from PsychonautWiki, Erowid, and scientific literature. However, individual experiences vary significantly.

**Q: Can I export prompts for other tools?**
A: Yes! Copy prompts from the Prompt Lab and use in Midjourney, Leonardo, ComfyUI, or any text-to-image tool.

**Q: Is this legal?**
A: Yes. The software creates visual art inspired by documented phenomenology. It does not involve, produce, or encourage the use of controlled substances.

**Q: How are uploaded images handled?**
A: Images stored as data URLs in browser memory and localStorage. Temporarily sent to OpenRouter API for analysis (see OpenRouter privacy policy). Never permanently stored on our servers.

---

## 🙏 Acknowledgments

Built with inspiration from:
- Phenomenological research by the [Qualia Research Institute](https://qri.org)
- Visual effect taxonomies from [PsychonautWiki](https://psychonautwiki.org) and [Subjective Effect Index](https://effectindex.com)
- Clinical research by MAPS, Johns Hopkins Center for Psychedelic Research, and Imperial College London
- Visionary art traditions and psychedelic culture

**Technology:**
- OpenRouter for multi-model API access
- Anthropic, OpenAI, and Google for AI models
- Open source community for foundational tools

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

This project is open source and free to use for research, educational, and commercial purposes with attribution.

---

## 🔗 Links

- [Complete Documentation](./docs/) - Technical guides and references
- [API Reference](./docs/API_REFERENCE.md) - Endpoint documentation
- [User Guide](./docs/USER_GUIDE.md) - How to use the application
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design deep dive
- [Effects Catalog](./docs/effects_catalog.md) - Effect families + intensity guide
- [Substance Profiles](./docs/substance_visual_profiles.md) - Phenomenological details
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history

---

**Made with 🧬 for consciousness exploration, artistic expression, and scientific understanding**
