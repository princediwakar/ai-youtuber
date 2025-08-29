# Debug Mode Guide

When `DEBUG_MODE=true` is set in your environment variables, the system bypasses all scheduling restrictions for easier development and testing.

## How to Enable Debug Mode

Add this to your `.env.local` or `.env` file:
```bash
DEBUG_MODE=true
```

## What Changes in Debug Mode

### 1. **Generate Quiz API** (`/api/jobs/generate-quiz`)

**Production Mode:**
- Follows the GenerationSchedule strictly
- Only generates for personas scheduled at current hour
- Example: Only generates `viral_knowledge` at 8 AM on weekdays

**Debug Mode:**
- Ignores schedule completely
- Generates for ALL personas every time API is called
- Generates: `viral_knowledge`, `guess_challenge`, `rapid_fire`, `challenge_mode`, `english_learning`

### 2. **Upload Quiz Videos API** (`/api/jobs/upload-quiz-videos`)

**Production Mode:**
- Follows the UploadSchedule strictly
- Only uploads videos for personas scheduled at current hour
- Example: Only uploads `rapid_fire` videos at 12 PM on weekdays

**Debug Mode:**
- Ignores schedule completely
- Uploads ANY pending videos regardless of persona or time
- Processes all videos in upload queue

## Debug Mode Indicators

When debug mode is active, you'll see these console logs:

**Generation:**
```
🔧 DEBUG MODE: Generating for all personas: viral_knowledge, guess_challenge, rapid_fire, challenge_mode, english_learning
```

**Upload:**
```
🔧 DEBUG MODE: Uploading any pending videos regardless of schedule
YouTube upload batch completed. Processed 5 jobs for: all personas (debug mode).
```

## Benefits for Development

1. **No Time Restrictions** - Test generation/upload anytime
2. **Full Coverage** - Always generates/uploads all content types
3. **Faster Testing** - Don't wait for scheduled hours
4. **Complete Pipeline** - Test entire system end-to-end

## Production Safety

- Debug mode is automatically `false` in production
- Only affects API behavior, not video quality or content
- Schedule restrictions automatically resume when debug mode is disabled

## Testing Workflow

1. Set `DEBUG_MODE=true` in `.env.local`
2. Call `/api/jobs/generate-quiz` to generate content for all personas
3. Process frames and video assembly as normal
4. Call `/api/jobs/upload-quiz-videos` to upload everything
5. Check results in `/quiz-dashboard`

Remember to set `DEBUG_MODE=false` or remove it entirely for production deployments!