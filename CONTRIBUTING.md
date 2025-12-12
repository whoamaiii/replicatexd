# Contributing to PsyVis Lab

Thank you for your interest in contributing to PsyVis Lab! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)
8. [Documentation Contributions](#documentation-contributions)
9. [Adding Effects to the Catalog](#adding-effects-to-the-catalog)
10. [Adding Substance Profiles](#adding-substance-profiles)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers have the right to remove, edit, or reject comments, commits, code, issues, and other contributions that do not align with this Code of Conduct.

**Report violations** to: [conduct@your-domain.com](mailto:conduct@your-domain.com)

---

## How Can I Contribute?

### 1. Effect Library Contributions

**Add new documented effects** with phenomenological research:
- Find effects in scientific literature or experience databases
- Document with proper citations
- Include intensity ranges and substance associations

### 2. Substance Profile Expansion

**Expand existing profiles** with:
- Research references from clinical studies
- Dose-dependent effect patterns
- Cultural and historical context
- Safety and harm reduction information

### 3. UI/UX Improvements

**Enhance interface and experience**:
- Improve accessibility (WCAG compliance)
- Mobile responsiveness
- Workflow optimizations
- Visual design refinements

### 4. Model Integration

**Add support for new AI models**:
- Vision analysis models (Claude, Gemini, etc.)
- Image generation models (FLUX variants, SD3, etc.)
- Prompt optimization for specific models

### 5. Documentation

**Create or improve documentation**:
- Tutorials and examples
- Video walkthroughs
- API usage examples
- Case studies

### 6. Testing

**Expand test coverage**:
- Unit tests for services
- Integration tests for API workflows
- Frontend component tests
- Visual regression tests

### 7. Bug Fixes

**Fix reported issues**:
- Check [Issues](https://github.com/your-repo/issues) for bugs
- Reproduce and fix
- Add tests to prevent regression

---

## Development Setup

### Prerequisites

- Node.js 18+ (20 LTS recommended)
- npm 9+
- Git
- OpenRouter API key ([get one free](https://openrouter.ai))
- Optional: Python 3.9+ for map generation

### Initial Setup

1. **Fork the repository**

   Click "Fork" button on [GitHub](https://github.com/your-repo)

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/psyvis-lab.git
   cd psyvis-lab
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/original-owner/psyvis-lab.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Configure environment**

   ```bash
   cp env.example .env
   # Edit .env and add your OPENROUTER_API_KEY
   ```

6. **Start development servers**

   ```bash
   npm run dev
   ```

   Access at [http://localhost:5173](http://localhost:5173)

---

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- Enable strict mode (already configured)
- Define types explicitly (avoid `any`)
- Use shared types from `shared/types/` when possible

**Example**:
```typescript
// Good
import type { ImageAnalysisResult } from '../../../shared/types/analysis'

function processAnalysis(result: ImageAnalysisResult): void {
  // ...
}

// Bad
function processAnalysis(result: any) {
  // ...
}
```

### Code Style

- **ESLint**: All code must pass linting
  ```bash
  npm run lint
  ```

- **Formatting**: Consistent indentation (2 spaces)
- **Imports**: Organize imports logically
  ```typescript
  // 1. Node built-ins
  import { Router } from 'express'

  // 2. External dependencies
  import { z } from 'zod'

  // 3. Internal shared types
  import type { AnalyzeResponse } from '../../../shared/types/api'

  // 4. Internal modules
  import { analyzeImage } from '../services/analysisService'
  ```

### Naming Conventions

- **Files**: camelCase (e.g., `analysisService.ts`)
- **Components**: PascalCase (e.g., `EffectsPanel.tsx`)
- **Functions**: camelCase (e.g., `analyzeImage()`)
- **Types**: PascalCase (e.g., `ImageAnalysisResult`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_IMAGE_SIZE`)

### Comments

- **Use comments** to explain "why", not "what"
- **JSDoc** for public APIs
  ```typescript
  /**
   * Analyze image to detect psychedelic effects
   * @param request - Image data and substance parameters
   * @returns Analysis result with detected effects
   */
  export async function analyzeImage(request: AnalyzeRequest): Promise<ImageAnalysisResult> {
    // ...
  }
  ```

### Component Structure (React)

```tsx
// 1. Imports
import React from 'react'
import type { SomeType } from './types'

// 2. Types/Interfaces
interface Props {
  value: string
  onChange: (value: string) => void
}

// 3. Component
export function MyComponent({ value, onChange }: Props) {
  // 3a. Hooks
  const [state, setState] = React.useState(false)

  // 3b. Handlers
  const handleClick = () => {
    setState(!state)
  }

  // 3c. Render
  return (
    <div onClick={handleClick}>
      {value}
    </div>
  )
}
```

---

## Testing Requirements

### Running Tests

```bash
# All tests
npm test

# Server tests only
npm run test:server

# Web tests only
npm run test:web

# Watch mode
npm test -- --watch
```

### Test Coverage

- **New features**: Must include tests
- **Bug fixes**: Add regression test
- **Target coverage**: 70%+ for critical paths

### Writing Tests

**Use Vitest** (configured in `vitest.config.ts`):

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myModule'

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

### Test Organization

- **Co-locate tests**: `file.ts` → `file.test.ts`
- **Describe blocks**: Group related tests
- **Clear names**: Describe what is being tested

---

## Pull Request Process

### Before Creating PR

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Run tests**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

### PR Guidelines

**Title format**:
- `feat: add new effect detection algorithm`
- `fix: resolve analysis timeout issue`
- `docs: update API reference`
- `refactor: simplify router logic`
- `test: add coverage for prompt engine`

**Description should include**:
- What changed and why
- Related issue number (if applicable)
- Screenshots (for UI changes)
- Breaking changes (if any)

**Template**:
```markdown
## Description
Brief description of changes.

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Manually tested

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks** must pass:
   - ESLint
   - TypeScript compilation
   - Tests
   - Build

2. **Maintainer review**:
   - Code quality
   - Test coverage
   - Documentation
   - Alignment with project goals

3. **Address feedback**:
   - Make requested changes
   - Push updates to same branch

4. **Merge**:
   - Maintainer will merge when approved
   - Delete feature branch after merge

---

## Issue Reporting

### Before Creating Issue

1. **Search existing issues**: Avoid duplicates
2. **Verify it's a bug**: Not a usage question
3. **Try latest version**: `git pull && npm install`

### Bug Report Template

```markdown
**Describe the bug**
Clear and concise description.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment:**
 - OS: [e.g., macOS 14]
 - Node: [e.g., 20.10.0]
 - Browser: [e.g., Chrome 120]

**Additional context**
Any other information.
```

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description of the problem.

**Describe the solution you'd like**
Clear and concise description.

**Describe alternatives you've considered**
Alternative solutions.

**Additional context**
Mockups, examples, etc.
```

---

## Documentation Contributions

### Documentation Structure

```
docs/
├── API_REFERENCE.md       # API endpoints
├── USER_GUIDE.md          # End-user guide
├── ARCHITECTURE.md        # Technical design
├── DEPLOYMENT.md          # Production setup
├── TROUBLESHOOTING.md     # Common issues
├── effects_catalog.md     # Effect families + intensity guide
├── effects_catalog_full.md# Legacy long-form reference
├── ROUTER_GUIDE.md        # Router deep dive
└── PROMPT_ENGINEERING.md  # Prompt strategies
```

### Writing Guidelines

- **Use clear language**: Avoid jargon when possible
- **Include examples**: Code snippets, commands
- **Add screenshots**: For UI documentation
- **Link related docs**: Cross-reference other pages
- **Keep up-to-date**: Update when code changes

### Documentation PRs

- Same process as code PRs
- Label with `documentation`
- No tests required (but check markdown syntax)

---

## Adding Effects to the Catalog

### Effect Schema

Edit `data/visual_effects.json`:

```json
{
  "id": "unique_effect_id",
  "group": "enhancements|distortions|geometry|hallucinations|perceptual",
  "family": "amplification|suppression|distortion|geometry|cognitive",
  "displayName": "Human-Readable Name",
  "shortDescription": "One-sentence summary.",
  "simulationHints": ["Practical knob 1", "Practical knob 2", "Practical knob 3"],
  "typicalIntensityRange": { "min": 0.0, "max": 1.0 },
  "doseResponse": { "curve": "linear|easeIn|easeOut", "anchor": "micro|common|heroic" },
  "sources": [{ "label": "PsychonautWiki — ...", "url": "https://psychonautwiki.org/wiki/..." }]
}
```

### Requirements

1. **Unique ID**: No duplicates, lowercase with underscores
2. **Research-backed**: Include citations in `sources`
3. **Clear descriptions**: Understandable to non-experts
4. **Accurate ranges**: Based on phenomenological reports
5. **Substance associations**: Verify in literature

### Citation Format

In `sources`, reference authoritative sources (keep descriptions paraphrased; do not copy large text verbatim):
```json
"sources": [
  { "label": "PsychonautWiki — Visual distortions", "url": "https://psychonautwiki.org/wiki/Visual_distortions" }
]
```

### Testing

After adding effect:
1. Restart server
2. Analyze test image
3. Verify effect appears in UI
4. Check prompt generation includes effect

---

## Adding Substance Profiles

### Profile Location

Edit `docs/substance_visual_profiles.md`

### Profile Structure

```markdown
### Substance Name (Chemical Name)

**Overview**
- ROA: Route of administration
- Duration: Onset, peak, offset
- Classification: Pharmacological class

**Visual Effects**
1. **Enhancements**
   - Specific enhancement patterns
   - Dose dependency

2. **Distortions**
   - Characteristic distortions
   - Intensity progression

3. **Geometry**
   - Geometric signature
   - Form constants

4. **Hallucinations**
   - Hallucination characteristics
   - Breakthrough threshold

**Dose Levels**
- Threshold: 0.0-0.2
- Common: 0.3-0.7
- Strong: 0.7-1.0

**Signature**
Qualitative description of unique aesthetic.

**References**
- Scientific citations
- Experience databases
```

### Requirements

1. **Scientific accuracy**: Cite peer-reviewed research
2. **Harm reduction**: Include safety information
3. **Phenomenological detail**: Specific visual characteristics
4. **Dose correlation**: Map to 0.0-1.0 scale

---

## Community

### Communication Channels

- **GitHub Discussions**: General questions, ideas
- **GitHub Issues**: Bug reports, feature requests
- **Discord** (if available): Real-time chat
- **Email**: contact@your-domain.com

### Getting Help

- **Documentation**: Check docs/ first
- **FAQ**: Common questions answered
- **Troubleshooting**: Known issues and solutions
- **Discussions**: Ask the community

---

## Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md (for significant contributions)
- Documentation (where applicable)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PsyVis Lab!** Your efforts help advance consciousness research, artistic expression, and scientific understanding.
