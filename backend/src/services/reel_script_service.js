const db = require('../config/db');
const { generateWithRotation, generateScript } = require('./ai_provider_service');
const { BACKGROUNDS, ACCENT_COLORS, pickRandom } = require('./textStoryRenderer');


const CTA_TEXT = 'Full Story In First Comment 👇';
const CTA_SEGMENT = { text: 'Read More.....', style: 'cta' };

/** Pick random visual style for a new reel */
function pickTextStoryStyle() {
  const bg = pickRandom(BACKGROUNDS);
  const accent = pickRandom(ACCENT_COLORS);
  const animations = ['word_by_word', 'line_by_line', 'paragraph_fade'];
  return {
    backgroundColor: bg.color,
    patternId: bg.id,
    accentColor: accent,
    animationStyle: pickRandom(animations),
  };
}

/**
 * Convert plain story text into textSegments array.
 * - Quoted text ("..") → style:'quote'
 * - ALL_CAPS phrases (3+ chars) → style:'accent'
 * - Last segment → style:'cta'
 */
function buildTextSegments(text) {
  if (!text) return [CTA_SEGMENT];
  const segments = [];
  const quoteRe = /"([^"]+)"/g;
  let lastIdx = 0;
  let m;
  while ((m = quoteRe.exec(text)) !== null) {
    const before = text.slice(lastIdx, m.index);
    if (before) {
      splitByAccent(before).forEach(s => segments.push(s));
    }
    segments.push({ text: `"${m[1]}"`, style: 'quote' });
    lastIdx = m.index + m[0].length;
  }
  const after = text.slice(lastIdx);
  if (after) splitByAccent(after).forEach(s => segments.push(s));
  if (!segments.length) segments.push({ text, style: 'normal' });
  segments.push(CTA_SEGMENT);
  return segments;
}

function splitByAccent(text) {
  // Detect ALL_CAPS words (3+ chars) and phrases ending with ! or ...
  const parts = [];
  const accentRe = /([A-Z]{3,}[\s!.]*(?:[A-Z]{3,}\s*)*)/g;
  let last = 0;
  let m;
  while ((m = accentRe.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), style: 'normal' });
    parts.push({ text: m[0], style: 'accent' });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), style: 'normal' });
  return parts.length ? parts : [{ text, style: 'normal' }];
}

function generateCTA() {
  return CTA_TEXT;
}

function calculateSceneTiming(scenes, total = 15) {
  const MIN_DURATION = 15;
  const MAX_DURATION = 30;
  total = Math.min(MAX_DURATION, Math.max(MIN_DURATION, total));

  const cta = scenes.find((s) => s.type === 'cta');
  const others = scenes.filter((s) => s.type !== 'cta');
  const ctaDuration = cta ? 3.0 : 0;
  const remaining = total - ctaDuration;
  const perScene = others.length ? remaining / others.length : 0;

  let currentTime = 0;
  return scenes.map((scene) => {
    const dur = scene.type === 'cta' ? ctaDuration : parseFloat(perScene.toFixed(2));
    const start = currentTime;
    const end = currentTime + dur;
    currentTime += dur;
    return {
      ...scene,
      duration: dur,
      start_time: parseFloat(start.toFixed(2)),
      end_time: parseFloat(end.toFixed(2)),
    };
  });
}

function parseScenesFromAI(raw) {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return parsed.scenes || parsed;
  } catch (_) {
    return null;
  }
}

function parseScriptFromAI(raw) {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.scenes && Array.isArray(parsed.scenes)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[ScriptService] AI JSON parse failed:', e.message);
  }
  return null;
}

function generateFallbackScript(article, options) {
  const targetDuration = parseInt(options.target_duration) || 30;
  const title = article.title || 'Untitled Reel';
  const content = article.content || article.title || '';
  
  // Split content into sentences
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const hookText = sentences[0] || 'Check this out!';
  
  // Get 3-4 content sentences
  const contentSentences = sentences.slice(1, 5);
  if (contentSentences.length === 0) {
    contentSentences.push('Here is an interesting fact from the article.');
    contentSentences.push('There is more to learn about this topic.');
  }

  const ctaText = '📖 Check the link in the comments for the full story!';
  
  const totalScenes = 1 + contentSentences.length + 1; // hook + content + cta
  const ctaDuration = 3.0;
  const hookDuration = 3.0;
  const remainingDuration = targetDuration - hookDuration - ctaDuration;
  const perContentDuration = parseFloat((remainingDuration / contentSentences.length).toFixed(2));

  const scenes = [];
  scenes.push({ text: hookText, duration: hookDuration, type: 'hook' });
  
  contentSentences.forEach((text, idx) => {
    // Adjust last scene duration to match exactly targetDuration
    let dur = perContentDuration;
    if (idx === contentSentences.length - 1) {
      const currentSum = hookDuration + (perContentDuration * (contentSentences.length - 1)) + ctaDuration;
      dur = parseFloat((targetDuration - currentSum).toFixed(2));
    }
    scenes.push({ text, duration: dur, type: 'content' });
  });

  scenes.push({ text: ctaText, duration: ctaDuration, type: 'cta' });

  const voiceText = scenes.map(s => s.text).join(' ');

  return {
    scenes,
    total_duration: targetDuration,
    voice_text: voiceText,
    title
  };
}

function generateCaption(scenes, category, articleTitle) {
  const hook = scenes.find((s) => s.type === 'hook')?.text || 'You need to see this...';
  const tags = generateHashtags(category, 'suspense').slice(0, 8).join(' ');
  return `${hook}\n\n${articleTitle}\n\n${CTA_TEXT}\n\n${tags}`;
}

function generateHashtags(category, emotion) {
  const base = ['#viral', '#fyp', '#storytime', '#mustread', '#trending'];
  const catTags = {
    horror: ['#horror', '#scary', '#creepy', '#truecrime'],
    mystery: ['#mystery', '#unsolved', '#investigation'],
    crime: ['#crime', '#police', '#breakingnews'],
    emotional: ['#emotional', '#heartbreaking', '#family'],
    suspense: ['#suspense', '#plotwist', '#shocking'],
  };
  const specific = catTags[emotion] || catTags[category?.toLowerCase()] || catTags.suspense;
  return [...new Set([...specific, ...base])].slice(0, 25);
}

async function generateSuspenseScenes(articleTitle, articleContent, emotion, userId, duration = 15) {
  const storyStyle = pickTextStoryStyle();

  const prompt = `You are a viral Facebook "A Text Story" writer.
Create a highly suspenseful, emotional story based on this article for a short-form video reel.

Article Title: ${articleTitle}
Article Content: ${(articleContent || articleTitle).substring(0, 1200)}
Category: ${emotion}

Write a compelling 2-3 paragraph story in the FIRST PERSON ("I") perspective.
Rules:
- Make it extremely engaging, like a Reddit Story (e.g. "I recently got married. My husband has an adult son. I DO NOT HAVE CHILDREN...").
- Start with a SHOCKING hook sentence.
- Build intense suspense very quickly.
- End abruptly on a CLIFFHANGER mid-thought or at the most suspenseful line so the reader is forced to check the comments for the full story.
- Use ALL CAPS for the 1-2 most suspenseful/shocking sentences (these will be highlighted with a color background in the video).
- Include 1 short quote if relevant.
- Keep total text under 200 words. Make it punchy.
- Tone: ${emotion}. Conversational, raw, emotional.
- CRITICAL: Return valid JSON ONLY. Escape any quotes inside text with \\". Escape newlines inside strings with \\n. Do not put literal newlines inside the JSON string value.

Return ONLY valid JSON (no markdown):
{
  "scenes": [
    {"id":1,"type":"hook","text":"Scene 1 text","duration":3},
    {"id":2,"type":"beat","text":"Scene 2 text","duration":4},
    {"id":3,"type":"beat","text":"Scene 3 text","duration":4},
    {"id":4,"type":"cliffhanger","text":"Scene 4 text — ends with ...","duration":4}
  ],
  "fullStoryText": "The extremely suspenseful short story text with the ALL CAPS suspenseful sentence included."
}`;

  const aiResult = await generateWithRotation(prompt, userId);
  let parsed = null;
  try {
    const m = aiResult.text.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
  } catch (err) {
    console.error('[AI Parse Error]', err.message, 'Raw response:', aiResult.text);
  }

  let scenes = parsed?.scenes;
  const fullStory = parsed?.fullStoryText || (articleContent || articleTitle).substring(0, 600);

  if (!scenes || !Array.isArray(scenes) || scenes.length < 2) {
    scenes = [
      { id: 1, type: 'hook',        text: articleTitle, duration: 3 },
      { id: 2, type: 'beat',        text: fullStory.substring(0, 150), duration: 4 },
      { id: 3, type: 'cliffhanger', text: fullStory.substring(150, 300) + '...', duration: 4 },
    ];
  }

  scenes = calculateSceneTiming(scenes, duration);

  // Build Facebook-style textSegments from the full story
  const textSegments = buildTextSegments(fullStory);

  const caption = generateCaption(scenes, emotion, articleTitle);
  const hashtags = generateHashtags(emotion, emotion);

  return {
    scenes,
    textSegments,
    ...storyStyle,
    username: 'Story User',
    footerText: 'Full Story In First Comment 👇',
    caption,
    hashtags,
    duration,
    cta: generateCTA(),
    aiProvider: aiResult.provider || 'template',
    aiModel: aiResult.model || 'local',
  };
}

async function generateReelScript(article, options = {}) {
  const targetDuration = parseInt(options.target_duration) || 30;
  const tone = options.tone || 'casual';
  const theme = options.theme || 'suspense';

  const prompt = `You are a viral social media reel script writer.
Create a script for a video reel based on the following article:

Article Title: ${article.title}
Article Content: ${(article.content || '').substring(0, 1000)}

OPTIONS:
- Tone: ${tone}
- Target Duration: ${targetDuration} seconds
- Theme: ${theme}

FORMAT RULES:
1. Convert this into exactly 1 hook scene (exactly 3.0 seconds duration, type "hook"), followed by 3 to 4 content scenes (type "content"), and finally 1 call-to-action (CTA) scene (type "cta").
2. Each scene must have these exact JSON keys: "text", "duration" (in seconds as a float), and "type" ("hook", "content", or "cta").
3. The sum of all scene durations must equal the target duration (${targetDuration} seconds).
4. Provide a "voice_text" key representing the full narration string of the script.
5. Provide a "title" key with a catchy viral title for the reel.

Return ONLY valid JSON in this exact structure (do not include markdown block quotes):
{
  "scenes": [
    { "text": "Hook text...", "duration": 3.0, "type": "hook" },
    { "text": "Content scene 1...", "duration": 6.5, "type": "content" },
    { "text": "Content scene 2...", "duration": 6.5, "type": "content" },
    { "text": "Content scene 3...", "duration": 6.5, "type": "content" },
    { "text": "CTA text...", "duration": 4.5, "type": "cta" }
  ],
  "total_duration": ${targetDuration},
  "voice_text": "Full voice narration text combining hook and content scenes.",
  "title": "Catchy Reel Title"
}`;

  try {
    const aiResult = await generateScript(prompt, { provider: options.provider });
    
    if (aiResult && aiResult.text) {
      const parsed = parseScriptFromAI(aiResult.text);
      if (parsed) {
        // Enforce total_duration is set correctly
        parsed.total_duration = targetDuration;
        return parsed;
      }
    }
  } catch (err) {
    console.error('[ScriptService] generateReelScript AI call failed:', err.message);
  }

  // Fallback to local template extracted script
  return generateFallbackScript(article, options);
}

function saveReelScript(reelId, articleId, script) {
  db.prepare(`
    INSERT INTO reel_scripts (reel_id, article_id, scenes_json, caption, hashtags, ai_provider, ai_model, cta_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reelId,
    articleId,
    JSON.stringify(script.scenes),
    script.caption,
    JSON.stringify(script.hashtags),
    script.aiProvider,
    script.aiModel,
    script.cta
  );
}

module.exports = {
  generateSuspenseScenes,
  generateCaption,
  generateHashtags,
  generateCTA,
  calculateSceneTiming,
  saveReelScript,
  generateReelScript,
  buildTextSegments,
  pickTextStoryStyle,
};

