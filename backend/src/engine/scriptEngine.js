const { generateSuspenseScript } = require('./aiEngine');

const SCRIPT_PROMPT_TEMPLATE = [
  'You are an expert cinematic video producer.',
  'Convert the following article title/summary into a suspenseful short video script.',
  'The video will be vertical 9:16.',
  'Maximum 6 short scenes. It must build suspense and leave the viewer wanting more.',
  '',
  'Article Details:',
  'Title: {title}',
  'Source Category: {category}',
  '',
  'Return ONLY a valid JSON array of objects representing the scenes. No markdown, no intro text.',
  'Format for each scene object:',
  '{ "text": "Subtitle text for this scene (max 6 words)", "emotion": "suspenseful, shocking, emotional, or mysterious", "visual_cue": "What kind of image/motion fits here" }'
].join('\n');

const CAPTION_PROMPT_TEMPLATE = [
  'Write a viral social media caption for this article. Make it engaging, suspenseful, and include 5 relevant hashtags.',
  'The final line MUST be exactly: "📖 Full Read Story Details In Comments 👇"',
  '',
  'Article Title: {title}'
].join('\n');

/**
 * Parses the raw AI output into a valid JSON array
 */
const parseAIScript = (rawOutput) => {
  try {
    const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(rawOutput);
  } catch (error) {
    console.error('Failed to parse AI script JSON. Using fallback.');
    return [
      { text: "You won't believe this...", emotion: 'suspenseful', visual_cue: 'slow zoom' },
      { text: 'Everything changed suddenly.', emotion: 'shocking', visual_cue: 'fast blur' },
      { text: 'The truth is finally out.', emotion: 'mysterious', visual_cue: 'fade in' }
    ];
  }
};

/**
 * Applies timing and cinematic pacing to the scenes.
 * Reels are min 15s, max 30s total.
 */
const calculatePacing = (scenes) => {
  // Dynamic duration based on scene count: min 15s, max 30s
  const sceneCount = Math.max(scenes.length, 1);
  const baseDuration = Math.min(30, Math.max(15, sceneCount * 4.5));
  const ctaDuration = 3.0;
  const contentDuration = baseDuration - ctaDuration;
  const timePerScene = contentDuration / sceneCount;
  let currentStartTime = 0;

  return scenes.map((scene, idx) => {
    // CTA scene gets fixed duration
    const dur = (scene.emotion === 'cta' || idx === scenes.length - 1) ? ctaDuration : parseFloat(timePerScene.toFixed(2));
    const paced = {
      ...scene,
      start_time: parseFloat(currentStartTime.toFixed(2)),
      duration: dur,
      end_time: parseFloat((currentStartTime + dur).toFixed(2))
    };
    currentStartTime += dur;
    return paced;
  });
};

/**
 * Always appends the mandatory CTA scene
 */
const addCTAScene = (scenes) => {
  const lastSceneEnd = scenes.length > 0 ? scenes[scenes.length - 1].end_time : 0;
  scenes.push({
    text: '📖 Full Read Story Details In Comments 👇',
    emotion: 'cta',
    visual_cue: 'static glow overlay',
    start_time: lastSceneEnd,
    duration: 3.0,
    end_time: parseFloat((lastSceneEnd + 3.0).toFixed(2))
  });
  return scenes;
};

/**
 * Master function to generate the complete script and pacing
 */
const buildReelScript = async (article, userId) => {
  const prompt = SCRIPT_PROMPT_TEMPLATE
    .replace('{title}', article.title)
    .replace('{category}', article.source_category || 'general');

  const rawOutput = await generateSuspenseScript(prompt, userId);
  let scenes = parseAIScript(rawOutput);

  if (scenes.length > 6) scenes = scenes.slice(0, 6);
  scenes = calculatePacing(scenes);
  scenes = addCTAScene(scenes);

  return scenes;
};

/**
 * Generate viral caption and hashtags
 */
const buildReelCaption = async (article, userId) => {
  const prompt = CAPTION_PROMPT_TEMPLATE.replace('{title}', article.title);
  try {
    return await generateSuspenseScript(prompt, userId);
  } catch (err) {
    return 'This story will shock you...\n\n📖 Full Read Story Details In Comments 👇\n#viral #story #shocking';
  }
};

module.exports = {
  buildReelScript,
  buildReelCaption
};
