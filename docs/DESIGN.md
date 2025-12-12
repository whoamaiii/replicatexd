## Psychedelic Visual Replicasion Lab

### Goal
Build a polished creative lab that takes one input image and produces:

1. A strict structured JSON analysis describing sober scene understanding plus psychedelic effect mapping
2. Ready to paste prompts to recreate or amplify the visuals
3. An optional generated psychedelic image variant

### Architecture
1. `psyvis_lab/src` contains the Vite React TypeScript UI
2. `psyvis_lab/server/src` contains the Express TypeScript API server
3. `psyvis_lab/shared/types` contains shared TypeScript contracts for requests and responses

### API contracts
1. `POST /api/analyze`
   1. Input includes `imageDataUrl`, `substance`, `dose`, optional `customMixText`
   2. Output is `ImageAnalysisResult`
2. `POST /api/generate`
   1. Input includes `imageDataUrl`, `analysis`, `substance`, `dose`, and `generationMode`
   2. Output includes base64 image data and mime type

### OpenAI integration
1. Vision analysis uses the OpenAI Responses API with model GPT 5.2
   1. Input includes `input_text` instructions plus `input_image` with the uploaded image data url
   2. Output must be JSON only and is validated server side
2. Image generation uses the OpenAI Responses API with the `image_generation` tool enabled
   1. Output is extracted by filtering `image_generation_call` items and reading their `result` base64

### Data model
The core analysis object is `ImageAnalysisResult`.

1. `baseScene` contains sober scene details
2. `geometry` contains detected form constants and symmetry notes
3. `psychedelicMapping` contains intensity plus effect list
4. `prompts` contains ready to paste prompts including `openAIImagePrompt`

### Configuration
1. `OPENAI_API_KEY` is required on the server
2. `OPENAI_MODEL` is optional and defaults to GPT 5.2
3. No secret key is ever sent to the browser

### Growth paths
1. Add URL based image input
2. Add batch analysis
3. Add effect library curation and versioned schemas
4. Add model routing and prompt presets per substance

