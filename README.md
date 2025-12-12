# PsyVis Lab

A web application for analyzing and generating psychedelic visual effects using AI image generation and analysis.

## Features

- **Image Analysis**: Upload images and analyze them for psychedelic visual effects
- **AI-Powered Generation**: Generate new images with specified visual effects
- **Project Library**: Save and manage generated images with metadata
- **Effects Database**: Comprehensive database of visual effects categorized by type
- **Customizable Prompts**: Fine-tune generation prompts for better results

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API key (for AI model access)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd replicatexd
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your API keys:

```bash
cp env.example .env
```

Edit `.env` and configure the following:

```env
# Required: OpenRouter API key
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: Fallback API key name
OPENAI_API_KEY=your_api_key_here

# Optional: Model configuration (defaults shown)
OPENAI_VISION_MODEL=openai/gpt-5.2
OPENAI_IMAGE_MODEL=black-forest-labs/flux.2-pro

# Optional: Server port (default: 5174)
PORT=5174

# Optional: CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Optional: Library settings
LIBRARY_OUTPUT_DIR=psyvis_lab_output
LIBRARY_RETENTION_DAYS=5
LIBRARY_TRASH_ENABLED=true
LIBRARY_TRASH_GRACE_HOURS=24
```

### 4. Run the development server

```bash
npm run dev
```

This will start both the backend API server and the frontend development server concurrently.

- Frontend: http://localhost:5173
- Backend API: http://localhost:5174

## Project Structure

```
replicatexd/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── lib/               # Utility libraries and API clients
│   └── types/             # TypeScript type definitions
├── server/                 # Backend Express server
│   └── src/
│       ├── config/        # Server configuration
│       ├── openai/        # OpenAI/OpenRouter client
│       ├── routes/        # API routes
│       ├── services/      # Business logic services
│       └── utils/         # Utility functions
├── shared/                 # Shared types between frontend and backend
│   └── types/
├── data/                   # Static data files
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run dev:web` - Start frontend development server only
- `npm run dev:server` - Start backend development server only
- `npm run build` - Build both frontend and backend for production
- `npm run build:web` - Build frontend only
- `npm run build:server` - Build backend only
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Analysis
- `POST /api/analyze` - Analyze an image for visual effects

### Generation
- `POST /api/generate` - Generate a new image based on analysis

### Library
- `GET /api/library/projects` - List all projects
- `GET /api/library/projects/:projectId` - Get project details
- `POST /api/library/projects/:projectId/save` - Save/unsave a project
- `DELETE /api/library/projects/:projectId` - Delete a project
- `GET /api/library/file/:projectId/:generationId` - Download generated image
- `GET /api/library/bundle/:projectId/:generationId` - Download project bundle (zip)

### Prompts
- `GET /api/prompts` - Get available prompt templates

## Security Features

- ✅ CORS configuration with origin validation
- ✅ Rate limiting (100 requests per 15 minutes per IP)
- ✅ Path traversal protection
- ✅ UUID validation for all IDs
- ✅ Request logging for debugging and monitoring
- ✅ Graceful shutdown handling
- ✅ Input sanitization and validation

## Library Management

The application automatically manages generated images:

- **Auto-cleanup**: Unsaved projects expire after configured retention period (default: 5 days)
- **Trash system**: Expired projects are moved to trash with grace period (default: 24 hours)
- **Permanent deletion**: After grace period, trashed projects are permanently deleted
- **Manual save**: Projects can be manually saved to prevent auto-cleanup

Cleanup runs:
- On server startup
- Every 6 hours automatically

## Development

### Type Safety

The project uses TypeScript with strict mode enabled for both frontend and backend:
- Strict null checks
- No implicit any
- No unused locals or parameters
- Type-safe API contracts using Zod

### Code Style

ESLint is configured for both frontend and backend. Run `npm run lint` to check for issues.

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables in `.env`

3. Serve the built files:
   - Frontend: `dist/` directory (static files)
   - Backend: `server/dist/` directory

4. Recommended: Use a process manager like PM2:
   ```bash
   pm2 start server/dist/index.js --name psyvis-lab
   ```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes* | - | OpenRouter API key for AI models |
| `OPENAI_API_KEY` | Yes* | - | Alternative to OPENROUTER_API_KEY |
| `OPENROUTER_BASE_URL` | No | https://openrouter.ai/api/v1 | OpenRouter API base URL |
| `OPENAI_VISION_MODEL` | No | openai/gpt-5.2 | Vision analysis model |
| `OPENAI_IMAGE_MODEL` | No | black-forest-labs/flux.2-pro | Image generation model |
| `PORT` | No | 5174 | Server port |
| `CORS_ORIGINS` | No | localhost URLs | Allowed CORS origins (comma-separated) |
| `LIBRARY_OUTPUT_DIR` | No | psyvis_lab_output | Directory for generated files |
| `LIBRARY_RETENTION_DAYS` | No | 5 | Days before unsaved projects expire |
| `LIBRARY_TRASH_ENABLED` | No | true | Enable trash system |
| `LIBRARY_TRASH_GRACE_HOURS` | No | 24 | Hours before permanent deletion |

*One of OPENROUTER_API_KEY or OPENAI_API_KEY is required

## Troubleshooting

### API Key Issues
- Verify your OpenRouter API key is valid
- Check that the API key has sufficient credits
- Ensure the key has access to the required models

### CORS Errors
- Add your frontend URL to `CORS_ORIGINS` in `.env`
- For development, include both localhost:5173 and localhost:5174

### File System Errors
- Ensure the application has write permissions for `LIBRARY_OUTPUT_DIR`
- Check available disk space

### Rate Limiting
- Default limit: 100 requests per 15 minutes per IP
- Adjust in `server/src/index.ts` if needed

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
