# Background Audio Configuration

The video assembly system automatically selects background audio in this priority order:

## Available Audio Tracks

### 1. `minimal-focus.mp3` ⭐ **CURRENT**
- **Style**: Minimal 432Hz focus tone
- **Feel**: Calm, concentration-enhancing
- **Best For**: Educational content, study material
- **Volume**: Very low (3% mix)
- **Duration**: 30 seconds (loops automatically)

### 2. `uplifting-ambient.mp3` 
- **Style**: Uplifting C major chord progression  
- **Feel**: Motivational, positive energy
- **Best For**: Achievement-focused content
- **Volume**: Low (6% mix)
- **Duration**: 30 seconds (loops automatically)

### 3. `quiz-ambient.mp3`
- **Style**: Gentle educational ambient
- **Feel**: Balanced, non-distracting
- **Best For**: General quiz content
- **Volume**: Low (8% mix) 
- **Duration**: 30 seconds (loops automatically)

### 4. `background.mp3` 
- **Style**: Original background track
- **Feel**: Fallback option
- **Best For**: Default when others unavailable

## How to Switch Audio

To use a different background audio:

1. **Remove current priority tracks**:
   ```bash
   rm /Users/prince/Developer/Youtube-Uploader/public/audio/minimal-focus.mp3
   ```

2. **The system automatically falls back to next available track**

3. **To add custom audio**:
   - Place MP3 file in `/public/audio/` 
   - Update priority order in `assemble-video/route.ts`
   - Ensure 30+ second duration for proper looping

## Audio Specifications

- **Format**: MP3, 128kbps
- **Sample Rate**: 44.1kHz  
- **Channels**: Mono
- **Duration**: 30+ seconds (auto-loops)
- **Volume**: Mixed at 3-8% to avoid distraction
- **Effects**: Echo, reverb, filtering applied for ambience

## Testing Audio

Generate new quiz video to test current audio selection:
```bash
export CRON_SECRET="tdD0pkJYJM0Ozj4f1jPuLBybMXLx3lqfnTqJf0tFx7c="
curl -X POST http://localhost:3000/api/jobs/generate-quiz -H "Authorization: Bearer $CRON_SECRET" -d '{"persona": "vocabulary"}'
```