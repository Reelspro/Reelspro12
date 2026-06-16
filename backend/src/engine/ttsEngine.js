/**
 * ttsEngine.js — Phase 18: Free AI Voiceover (Google TTS via gtts)
 * Uses Google Translate's FREE TTS endpoint — No API Key Required.
 *
 * Flow:
 *  1. Take all scene texts
 *  2. Join into a single narration string
 *  3. Generate MP3 voiceover file via gtts
 *  4. Return the path for FFmpeg to mix with the video
 */

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');

const rootDir = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../../');
const TEMP_DIR = path.resolve(rootDir, 'output/temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const VOICE_MAP = {
  'Aria': 'en-US-AriaNeural',
  'Jenny': 'en-US-JennyNeural',
  'Guy': 'en-US-GuyNeural',
  'Christopher': 'en-US-ChristopherNeural',
  'Eric': 'en-US-EricNeural',
  'Michelle': 'en-US-MichelleNeural',
  'Roger': 'en-US-RogerNeural'
};

const cleanTextForTTS = (text) => {
  return text
    .replace(/[🎬🎙️📖👇⚡🔥💀🚨⚠️❤️😱🤯]/gu, '')
    .replace(/[#@]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const generateVoiceover = async (texts, reelId, voiceName = 'Jenny') => {
  try {
    const narrationTexts = texts.slice(0, -1).map(cleanTextForTTS).filter(t => t.length > 2);
    
    if (narrationTexts.length === 0) {
      console.warn('[TTS] No valid text found for voiceover, skipping.');
      return null;
    }

    // Add dramatic pauses between sentences for emotional delivery
    const narration = narrationTexts.join('... ');
    const outputPath = path.join(TEMP_DIR, `${reelId}_voiceover.mp3`);
    const edgeVoice = VOICE_MAP[voiceName] || VOICE_MAP['Jenny'];

    console.log(`[TTS] Generating emotional voiceover (Voice: ${edgeVoice}) for reel ${reelId}...`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // Use SSML for emotional, slower delivery with dramatic pitch
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${edgeVoice}">
        <prosody rate="-15%" pitch="-5%" volume="loud">
          ${narration}
        </prosody>
      </voice>
    </speak>`;
    
    let audioStream;
    let trySsml = true;
    try {
      // Try SSML first for emotional delivery
      const result = await tts.toStream(ssml);
      audioStream = result.audioStream;
    } catch (_) {
      trySsml = false;
    }

    if (trySsml && audioStream) {
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        audioStream.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
        audioStream.on('error', reject);
      });
    }

    // Check if the SSML output is valid, otherwise fallback to plain text
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
      console.log('[TTS] SSML silent failure or too small, retrying with plain text...');
      const result = await tts.toStream(narration);
      audioStream = result.audioStream;

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        audioStream.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
        audioStream.on('error', reject);
      });
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
      console.warn('[TTS] Output file missing or too small, skipping voiceover.');
      return null;
    }

    console.log(`[TTS] Emotional voiceover generated: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
    return outputPath;

  } catch (err) {
    console.error('[TTS] Voiceover generation failed:', err.message);
    return null;
  }
};

/**
 * Adjust voiceover speed using FFmpeg's atempo filter
 * Keeps the voiceover within the reel's total duration
 * @param {string} inputPath   - Input MP3 path
 * @param {string} outputPath  - Output MP3 path
 * @param {number} targetDuration - Target duration in seconds
 * @returns {Promise<string>}
 */
const fitVoiceoverToDuration = async (inputPath, outputPath, targetDuration = 20.0) => {
  try {
    // Get actual duration of the voiceover
    const probeCmd = `"${ffmpegStatic}" -i "${inputPath}" 2>&1`;
    let durationSec = 9.0;

    try {
      const probeOut = execSync(probeCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const match = probeOut.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/);
      if (match) {
        durationSec = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
      }
    } catch (e) {
      // ffmpeg writes to stderr, use that
      const stderr = e.stderr?.toString() || '';
      const match = stderr.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/);
      if (match) {
        durationSec = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
      }
    }

    if (durationSec <= 0) return inputPath;

    const speedRatio = durationSec / targetDuration;

    // atempo filter range: 0.5 to 2.0
    if (speedRatio < 0.8 || speedRatio > 1.5) {
      // If it's already close, just return original
      if (Math.abs(speedRatio - 1.0) < 0.2) return inputPath;
    }

    const clampedSpeed = Math.min(Math.max(speedRatio, 0.5), 2.0);
    const cmd = `"${ffmpegStatic}" -y -i "${inputPath}" -filter:a "atempo=${clampedSpeed.toFixed(3)}" -t ${targetDuration} "${outputPath}"`;
    
    execSync(cmd, { stdio: 'ignore' });
    
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 100) {
      console.log(`[TTS] Voiceover speed adjusted: ${clampedSpeed.toFixed(2)}x -> ${outputPath}`);
      return outputPath;
    }
    
    return inputPath; // Return original if adjustment failed
  } catch (err) {
    console.error('[TTS] Speed adjustment failed:', err.message);
    return inputPath;
  }
};

module.exports = {
  generateVoiceover,
  fitVoiceoverToDuration
};
