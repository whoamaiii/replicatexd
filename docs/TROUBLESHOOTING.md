# Troubleshooting Guide

Common issues and solutions for PsyVis Lab.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [API & Authentication Errors](#api--authentication-errors)
4. [Analysis Failures](#analysis-failures)
5. [Generation Failures](#generation-failures)
6. [Map Generation Issues](#map-generation-issues)
7. [Performance Problems](#performance-problems)
8. [Library & Storage Issues](#library--storage-issues)
9. [Network & CORS Errors](#network--cors-errors)
10. [How to Report Bugs](#how-to-report-bugs)

---

## Quick Diagnostics

### Health Check

```bash
curl http://localhost:5174/api/health
```

**Expected**: `200 OK`

**If fails**: Backend not running or wrong port

### Check Logs

**Development**:
```bash
# Backend logs in terminal where npm run dev:server is running
```

**Production (systemd)**:
```bash
sudo journalctl -u psyvis-lab -n 100 -f
```

**Production (Docker)**:
```bash
docker-compose logs -f psyvis-lab
```

### Verify Environment

```bash
# Check if .env exists
ls -la .env

# Check API key is set (should show first few chars)
grep OPENROUTER_API_KEY .env | head -c 30
```

---

## Installation Issues

### npm install fails

**Error**: `EACCES: permission denied`

**Solution**:
```bash
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ./node_modules
npm install
```

---

**Error**: `Unsupported Node.js version`

**Solution**:
```bash
# Check version
node --version

# Must be 18.0.0+
# Install correct version:
nvm install 20
nvm use 20
```

---

**Error**: `Package not found` or `404`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete lock file and node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Build fails

**Error**: `TypeScript compilation errors`

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# Should be ~5.9.3
# Reinstall dependencies
npm ci
npm run build
```

---

**Error**: `Out of memory` during build

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## API & Authentication Errors

### "OpenAI request failed. Check your API key"

**Cause**: Invalid or missing `OPENROUTER_API_KEY`

**Solution**:

1. **Verify key in `.env`**:
   ```bash
   cat .env | grep OPENROUTER_API_KEY
   ```

2. **Check key validity**:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY"
   ```
   Should return model list, not 401 error

3. **Regenerate key** at [OpenRouter](https://openrouter.ai/keys)

4. **Restart server** after updating `.env`:
   ```bash
   # Development
   Ctrl+C and npm run dev

   # Production
   sudo systemctl restart psyvis-lab
   ```

---

### "Rate limit exceeded"

**Cause**: Too many requests to OpenRouter API

**Solution**:

1. **Check OpenRouter dashboard** for quota
2. **Upgrade plan** if needed
3. **Implement retry logic** (already built-in with 120s/180s timeouts)
4. **Wait and retry** (usually resets within minutes)

---

### "Insufficient credits"

**Cause**: OpenRouter account balance depleted

**Solution**:
1. Visit [OpenRouter billing](https://openrouter.ai/account)
2. Add credits
3. Check auto-reload settings

---

## Analysis Failures

### Analysis times out (120s)

**Cause**: Image too large, slow API response, or network issue

**Solution**:

1. **Reduce image size**:
   ```bash
   # Resize to max 2048px
   # Use online tool or ImageMagick:
   convert input.jpg -resize 2048x2048\> output.jpg
   ```

2. **Check network speed**:
   ```bash
   ping openrouter.ai
   ```

3. **Try different substance** (simpler prompts may be faster)

4. **Check OpenRouter status**: [status.openrouter.ai](https://status.openrouter.ai)

---

### "Invalid request" (400)

**Cause**: Malformed request body

**Solution**:

1. **Check image format**:
   - Must be base64 data URL
   - Must start with `data:image/`

2. **Check dose**:
   - Must be between 0.0 and 1.0

3. **Check substance ID**:
   - Must be one of: `lsd`, `psilocybin`, `dmt`, `five_meo`, `mescaline`, `custom_mix`

---

### Analysis returns empty effects array

**Cause**: Model failed to detect suitable effects, or image is too simple

**Solution**:

1. **Try different image** with more visual interest
2. **Increase dose** (higher doses detect more effects)
3. **Try different substance** profile
4. **Check image isn't corrupted**:
   ```bash
   file image.jpg
   # Should show valid image metadata
   ```

---

### Effects don't match substance profile

**Cause**: Model interpretation variance, or image characteristics

**Solution**:

1. **This is expected behavior** - AI models have variance
2. **Try multiple analyses** and compare
3. **Use effect overrides** to manually adjust
4. **Choose different substance** if output consistently off

---

## Generation Failures

### Generation times out (180s)

**Cause**: Image generation can be slow, especially for complex prompts

**Solution**:

1. **Simplify prompt**:
   - Use "minimal" flavor
   - Reduce number of effects (use overrides to zero out some)

2. **Try different generation mode**:
   - Switch from `base_image_edit` to `prompt_only`

3. **Disable router and maps** (reduces prompt complexity)

4. **Check OpenRouter model status**:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     | grep -A5 "flux"
   ```

---

### Generated image is black/corrupted

**Cause**: Model failure, unsupported format, or timeout

**Solution**:

1. **Check console logs** for errors
2. **Try again** (generation can fail intermittently)
3. **Reduce image size** of input
4. **Try different model** (configure `OPENAI_MODEL` in .env)

---

### Generation doesn't show effects

**Cause**: Effects too subtle, model didn't follow prompt, or low dose

**Solution**:

1. **Increase dose** (try 0.7-0.9)
2. **Use group multipliers**:
   - Set geometry to 1.5+
   - Set distortions to 1.5+
3. **Use "experimental" prompt flavor**
4. **Try multiple generations** (variance is normal)

---

### "HttpError: upstream error" (502)

**Cause**: OpenRouter API returned 500+ error

**Solution**:

1. **Check OpenRouter status page**
2. **Retry in a few minutes**
3. **Check logs** for specific error details:
   ```bash
   grep "upstream error" logs
   ```
4. **If persistent**, try different model or contact OpenRouter support

---

## Map Generation Issues

### "Maps not enabled"

**Cause**: `MAPS_ENABLED=false` in environment

**Solution**:
```env
# In .env
MAPS_ENABLED=true
```

Restart server.

---

### Python worker fails

**Error**: `Python executable not found`

**Solution**:

1. **Install Python 3.9+**:
   ```bash
   python3 --version
   ```

2. **Update `.env`**:
   ```env
   MAPS_PYTHON_PATH=/usr/bin/python3
   # Or full path from: which python3
   ```

---

**Error**: `ModuleNotFoundError: No module named 'cv2'`

**Solution**:
```bash
pip3 install opencv-python Pillow numpy mediapipe

# Or with virtual environment:
python3 -m venv venv
source venv/bin/activate
pip install opencv-python Pillow numpy mediapipe

# Update .env:
MAPS_PYTHON_PATH=/path/to/venv/bin/python3
```

---

### Maps generation is very slow

**Cause**: Large image, CPU-bound processing

**Solution**:

1. **Reduce image size**:
   - Set `MAPS_MAX_IMAGE_MP=2` (default is 4)

2. **Disable unused maps**:
   ```env
   MAPS_SEGMENTATION_ENABLED=false
   MAPS_FACE_MASK_ENABLED=false
   MAPS_HANDS_MASK_ENABLED=false
   ```

3. **Only generate when needed** (maps are cached)

---

### Face/hands not detected

**Cause**: Face/hands not visible, obscured, or at angle

**Solution**:

1. **Use frontal images** for faces
2. **Ensure good lighting**
3. **Hands must be clearly visible** (not hidden)
4. **This is expected** if no face/hands in image

---

## Performance Problems

### High memory usage

**Cause**: Large images, map caching, library accumulation

**Solution**:

1. **Reduce image sizes** before upload
2. **Lower retention days**:
   ```env
   LIBRARY_RETENTION_DAYS=3
   ```
3. **Clear map cache**:
   ```bash
   rm -rf map_cache/*
   ```
4. **Increase server RAM** or use swap:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

---

### Slow analysis/generation

**Cause**: Network latency, API load, or large images

**Solution**:

1. **Check network speed**:
   ```bash
   curl -o /dev/null -s -w '%{time_total}\n' https://openrouter.ai
   # Should be < 1 second
   ```

2. **Use smaller images** (512-1024px)

3. **Check server load**:
   ```bash
   top
   # CPU usage should be reasonable
   ```

4. **Consider geographic proximity** to OpenRouter servers

---

### Frontend slow/unresponsive

**Cause**: Large data URLs in memory, many projects in library

**Solution**:

1. **Clear browser localStorage**:
   ```javascript
   // In browser console
   localStorage.clear()
   ```

2. **Delete old projects** from library

3. **Use download/bundle** instead of keeping in browser

4. **Close other tabs** (browsers have memory limits)

---

## Library & Storage Issues

### "Failed to save project"

**Cause**: Filesystem permission error

**Solution**:

```bash
# Check directory exists
ls -ld psyvis_lab_output/

# Fix permissions
sudo chown -R $USER:$USER psyvis_lab_output/
chmod 755 psyvis_lab_output/
```

---

### Projects not expiring

**Cause**: Cleanup scheduler not running

**Solution**:

1. **Check logs** for cleanup messages
2. **Verify settings**:
   ```env
   LIBRARY_TRASH_ENABLED=true
   LIBRARY_RETENTION_DAYS=5
   ```
3. **Restart server** to restart scheduler

---

### Disk space full

**Cause**: Too many saved projects

**Solution**:

1. **Check usage**:
   ```bash
   du -sh psyvis_lab_output/
   df -h
   ```

2. **Delete old projects** manually:
   ```bash
   find psyvis_lab_output/ -type d -mtime +30 -exec rm -rf {} \;
   ```

3. **Reduce retention**:
   ```env
   LIBRARY_RETENTION_DAYS=2
   ```

---

### Bundle download fails

**Cause**: Missing file, permission issue, or archiver error

**Solution**:

1. **Check file exists**:
   ```bash
   ls -la psyvis_lab_output/proj_*/gen_*
   ```

2. **Check archiver installed** (should be in dependencies)

3. **Check logs** for specific error

4. **Download image individually** instead of bundle

---

## Network & CORS Errors

### "CORS policy blocked"

**Cause**: Frontend and backend on different origins, CORS not configured

**Solution**:

**Development**:
Already configured via Vite proxy. If still seeing errors:
```bash
# Verify frontend is on 5173, backend on 5174
# Check vite.config.ts has proxy configuration
```

**Production**:
Update `server/src/index.ts`:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}))
```

---

### "Failed to fetch" or "Network error"

**Cause**: Backend not running, wrong URL, or firewall

**Solution**:

1. **Check backend is running**:
   ```bash
   curl http://localhost:5174/api/health
   ```

2. **Check firewall**:
   ```bash
   sudo ufw status
   # Allow port if needed:
   sudo ufw allow 5174
   ```

3. **Check URL** in browser dev tools network tab

4. **Try different network** (corporate firewalls may block)

---

### Connection timeout

**Cause**: Very slow network or API issues

**Solution**:

1. **Check internet connection**
2. **Increase timeout** (already 120s/180s - very generous)
3. **Try wired connection** instead of Wi-Fi
4. **Contact ISP** if persistent

---

## How to Report Bugs

### Before Reporting

1. **Search existing issues**: [GitHub Issues](https://github.com/your-repo/issues)
2. **Try latest version**: `git pull && npm install && npm run build`
3. **Check this guide** thoroughly

### Information to Include

**Required**:
- OS and version (e.g., Ubuntu 22.04, macOS 14)
- Node.js version: `node --version`
- Browser and version (if frontend issue)
- Steps to reproduce
- Expected vs actual behavior

**Helpful**:
- Error messages (full text)
- Screenshots
- Logs (last 50 lines)
- `package.json` version numbers
- Environment variable settings (NEVER include API keys)

### Report Template

```markdown
**Describe the bug**
A clear description of what happened.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., Ubuntu 22.04]
 - Node: [e.g., 20.10.0]
 - Browser: [e.g., Chrome 120]
 - Version: [e.g., 0.1.0]

**Logs**
```
Paste relevant logs here
```

**Additional context**
Any other information.
```

### Where to Report

**GitHub Issues**: https://github.com/your-repo/issues

**Community Support**: [Discussions](https://github.com/your-repo/discussions)

**Security Issues**: Email security@your-domain.com (do not post publicly)

---

## Additional Resources

- [User Guide](./USER_GUIDE.md) - Usage instructions
- [API Reference](./API_REFERENCE.md) - API documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production setup
- [FAQ](./FAQ.md) - Frequently asked questions

---

**Still stuck?** Open an issue with as much detail as possible, and we'll help debug!
