# Changelog

All notable changes to PsyVis Lab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Real-time generation preview with streaming
- Batch processing for multiple images
- Video/animation support with temporal coherence
- Community effect library contributions
- Local model support (Ollama, llama.cpp)
- Mobile app (React Native)

---

## [0.1.0] - 2025-12-12

### Added
- **Complete Documentation Suite**
  - README.md with comprehensive project introduction
  - API_REFERENCE.md with full endpoint documentation
  - USER_GUIDE.md with workflows and examples
  - DEPLOYMENT.md for production setup
  - TROUBLESHOOTING.md with common issues and solutions
  - CONTRIBUTING.md with development guidelines
  - effects_catalog.md and effects_catalog_full.md
  - ARCHITECTURE.md with technical deep dive
  - ROUTER_GUIDE.md for effect placement strategies
  - PROMPT_ENGINEERING.md for prompt optimization
  - PERFORMANCE.md for optimization guide
  - FAQ.md for common questions

- **Core Features** (existing, now documented)
  - AI vision analysis with OpenRouter API integration
  - 70+ psychedelic effect catalog with research backing
  - Multi-flavor prompt generation (6 flavors)
  - Effect router for precise placement control
  - Structural map generation (depth, normals, edges, face, hands)
  - Project library with auto-cleanup
  - 5 substance profiles (LSD, psilocybin, DMT, 5-MeO-DMT, mescaline)

### Changed
- Improved error handling with HttpError class
- Enhanced API error responses with upstream status codes
- Updated dependencies (jpeg-js, pngjs for image processing)

### Fixed
- Better error messages for OpenRouter API failures
- Proper status code propagation (502 for upstream 500+ errors)

---

## [0.0.0] - Initial Development

### Added
- Initial project setup
- Basic frontend with React 19 and Vite 7
- Backend API with Express 4
- OpenRouter integration for vision and image generation
- Effect catalog with JSON schema
- Type-safe shared types between frontend/backend
- Development environment with hot reload

---

## Version History

### Semantic Versioning

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner
- **PATCH** version when making backwards compatible bug fixes

### Release Process

1. Update version in `package.json`
2. Update this CHANGELOG with release notes
3. Create git tag: `git tag -a v0.1.0 -m "Release 0.1.0"`
4. Push tag: `git push origin v0.1.0`
5. Create GitHub release with notes from CHANGELOG

---

## Categories

### Added
New features and additions to the codebase.

### Changed
Changes in existing functionality or behavior.

### Deprecated
Features that will be removed in upcoming releases.

### Removed
Features that have been removed from the codebase.

### Fixed
Bug fixes and corrections.

### Security
Security-related changes and patches.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to PsyVis Lab.

Report bugs and suggest features via [GitHub Issues](https://github.com/your-repo/issues).
