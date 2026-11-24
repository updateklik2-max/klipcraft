import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { PERSONA_LABELS } from './src/i18n.ts';
import { buildPlatformPayload } from './src/utils/socialPayloads.ts';
import { sanitizeText, validateWebhookUrl } from './server/security.ts';
import type { Language, SlangPersona, SocialPlatform, VoiceName } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getPersonaStyle(persona: SlangPersona): string {
  return PERSONA_LABELS[persona]?.stylePrompt ?? PERSONA_LABELS['jaksel-santai'].stylePrompt;
}

function normalizeTransition(value: string | undefined): 'zoom-punch' | 'whip-pan' | 'glitch-cut' | 'cross-dissolve' | 'slide-up' {
  const allowed = ['zoom-punch', 'whip-pan', 'glitch-cut', 'cross-dissolve', 'slide-up'] as const;
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as (typeof allowed)[number];
  }
  return 'zoom-punch';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/integrations/status', (_req, res) => {
    res.json({
      gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      tiktok: Boolean(process.env.TIKTOK_ACCESS_TOKEN),
      instagram: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID),
      youtube: Boolean(process.env.YOUTUBE_ACCESS_TOKEN),
      webhook: Boolean(process.env.SOCIAL_WEBHOOK_URL),
    });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const brief = sanitizeText(req.body?.brief, 3000);
      const videoUrl = sanitizeText(req.body?.videoUrl, 500);
      const language: Language = req.body?.language === 'en' ? 'en' : 'id';
      const slangPersona: SlangPersona =
        req.body?.slangPersona && req.body.slangPersona in PERSONA_LABELS
          ? req.body.slangPersona
          : language === 'id'
            ? 'jaksel-santai'
            : 'genz-creator-en';
      const targetFormat = sanitizeText(req.body?.targetFormat, 30) || '9:16';
      const rawFrames: unknown[] = Array.isArray(req.body?.frames) ? req.body.frames.slice(0, 6) : [];

      if (!brief && !videoUrl && rawFrames.length === 0) {
        res.status(400).json({ error: 'Provide a video file, reference URL, or visual concept brief.' });
        return;
      }

      const ai = getGeminiClient();

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      for (const frame of rawFrames) {
        if (typeof frame === 'string' && frame.startsWith('data:image/')) {
          const commaIdx = frame.indexOf(',');
          if (commaIdx > -1) {
            const meta = frame.slice(5, commaIdx);
            const mimeType = meta.split(';')[0] || 'image/jpeg';
            const data = frame.slice(commaIdx + 1);
            if (data.length > 0 && data.length < 4_000_000) {
              parts.push({ inlineData: { mimeType, data } });
            }
          }
        }
      }

      const languageDirective =
        language === 'id'
          ? 'Write title, hookStrategy, pacingSummary, reimaginedScript, visualSummary, and subtitles in natural Indonesian (Bahasa Indonesia). Keep t2iPrompt and t2vPrompt in crisp, detailed English so image/video AI generators produce maximum quality.'
          : 'Write all fields in crisp, modern English.';

      const promptText = [
        `You are an elite viral short-form video strategist, AI prompt architect, and scriptwriter.`,
        `Analyze the provided video keyframes (if attached) and/or reference brief/URL.`,
        `Target output format: ${targetFormat}.`,
        `Target voiceover persona: ${getPersonaStyle(slangPersona)}`,
        languageDirective,
        videoUrl ? `Reference URL: ${videoUrl}` : '',
        brief ? `Creator Brief / Notes: ${brief}` : '',
        `Create 4 distinct scenes (3-5 seconds each) with highly specific Text-to-Image (t2iPrompt) and Text-to-Video (t2vPrompt) prompts, dynamic transition choices (zoom-punch, whip-pan, glitch-cut, cross-dissolve, slide-up), a punchy reimagined voiceover script (35-65 words) with authentic slang, and 4-6 synced subtitle segments matching the total scene durations.`,
      ]
        .filter(Boolean)
        .join('\n\n');

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              hookStrategy: { type: Type.STRING },
              pacingSummary: { type: Type.STRING },
              reimaginedScript: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    durationSec: { type: Type.NUMBER },
                    visualSummary: { type: Type.STRING },
                    t2iPrompt: { type: Type.STRING },
                    t2vPrompt: { type: Type.STRING },
                    cameraMotion: { type: Type.STRING },
                    transition: { type: Type.STRING },
                  },
                },
              },
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    startSec: { type: Type.NUMBER },
                    endSec: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());

      const fallbackImages = [
        '/src/assets/images/scene_street_food_1795502590753.jpg',
        '/src/assets/images/scene_coffee_pour_1795502591694.jpg',
        '/src/assets/images/scene_creator_studio_1795502591798.jpg',
        '/src/assets/images/scene_desk_setup_1795502590745.jpg',
      ];

      const validFrames = rawFrames.filter((f): f is string => typeof f === 'string' && f.startsWith('data:image/'));

      const scenes = Array.isArray(parsed.scenes)
        ? parsed.scenes.slice(0, 6).map((s: Record<string, unknown>, idx: number) => ({
            id: `scene-${Date.now()}-${idx + 1}`,
            sceneNumber: Number(s.sceneNumber) || idx + 1,
            durationSec: Math.min(10, Math.max(2, Number(s.durationSec) || 4)),
            visualSummary: String(s.visualSummary || `Scene ${idx + 1}`),
            t2iPrompt: String(s.t2iPrompt || ''),
            t2vPrompt: String(s.t2vPrompt || ''),
            cameraMotion: String(s.cameraMotion || 'Smooth Push-In'),
            transition: normalizeTransition(typeof s.transition === 'string' ? s.transition : undefined),
            imageUrl: validFrames[idx % validFrames.length] || fallbackImages[idx % fallbackImages.length],
          }))
        : [];

      const subtitles = Array.isArray(parsed.subtitles)
        ? parsed.subtitles.map((sub: Record<string, unknown>, idx: number) => ({
            id: `sub-${Date.now()}-${idx + 1}`,
            startSec: Math.max(0, Number(sub.startSec) || idx * 3.5),
            endSec: Math.max(0.8, Number(sub.endSec) || (idx + 1) * 3.5),
            text: String(sub.text || ''),
          }))
        : [];

      res.json({
        id: `analysis-${Date.now()}`,
        title: String(parsed.title || 'AI Viral Remix'),
        sourceLabel: videoUrl ? 'URL Reference' : validFrames.length > 0 ? 'Uploaded Video' : 'Concept Brief',
        language,
        slangPersona,
        hookStrategy: String(parsed.hookStrategy || ''),
        pacingSummary: String(parsed.pacingSummary || ''),
        reimaginedScript: String(parsed.reimaginedScript || ''),
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : ['#viral', '#aicontent'],
        scenes,
        subtitles,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze video.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/rewrite-script', async (req, res) => {
    try {
      const currentScript = sanitizeText(req.body?.currentScript, 2500);
      const title = sanitizeText(req.body?.title, 200);
      const totalDurationSec = Math.max(4, Number(req.body?.totalDurationSec) || 16);
      const language: Language = req.body?.language === 'en' ? 'en' : 'id';
      const slangPersona: SlangPersona =
        req.body?.slangPersona && req.body.slangPersona in PERSONA_LABELS
          ? req.body.slangPersona
          : language === 'id'
            ? 'jaksel-santai'
            : 'genz-creator-en';

      if (!currentScript) {
        res.status(400).json({ error: 'Script text is required.' });
        return;
      }

      const ai = getGeminiClient();
      const targetLangLabel = language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Rewrite the following short-form video voiceover script into ${targetLangLabel} using this exact persona: ${getPersonaStyle(slangPersona)}. Keep it punchy, natural, and timed to roughly ${totalDurationSec} seconds. Topic: ${title}. Original script: ${currentScript}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reimaginedScript: { type: Type.STRING },
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    startSec: { type: Type.NUMBER },
                    endSec: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        reimaginedScript: String(parsed.reimaginedScript || currentScript),
        subtitles: Array.isArray(parsed.subtitles)
          ? parsed.subtitles.map((s: Record<string, unknown>, idx: number) => ({
              id: `sub-rw-${Date.now()}-${idx + 1}`,
              startSec: Number(s.startSec) || idx * 3.5,
              endSec: Number(s.endSec) || (idx + 1) * 3.5,
              text: String(s.text || ''),
            }))
          : [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rewrite script.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/voiceover', async (req, res) => {
    try {
      const script = sanitizeText(req.body?.script, 2500);
      const allowedVoices: VoiceName[] = ['Puck', 'Kore', 'Fenrir', 'Zephyr', 'Charon'];
      const voiceName: VoiceName = allowedVoices.includes(req.body?.voiceName) ? req.body.voiceName : 'Puck';
      const slangPersona: SlangPersona =
        req.body?.slangPersona && req.body.slangPersona in PERSONA_LABELS
          ? req.body.slangPersona
          : 'jaksel-santai';
      const language: Language = req.body?.language === 'en' ? 'en' : 'id';

      if (!script) {
        res.status(400).json({ error: 'Voiceover script cannot be empty.' });
        return;
      }

      const ai = getGeminiClient();
      const styleDirective = `${getPersonaStyle(slangPersona)} Speak naturally in ${
        language === 'id' ? 'Indonesian with authentic Jakarta/creator inflection' : 'English with energetic creator pacing'
      }.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: script,
                speechMetadata: {
                  style: styleDirective,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || 'audio/wav';

      if (!base64Audio) {
        res.status(502).json({ error: 'TTS model returned no audio data.' });
        return;
      }

      const wordCount = script.split(/\s+/).filter(Boolean).length;
      const durationEstimateSec = Math.max(2, Number((wordCount / 2.6).toFixed(1)));

      res.json({
        audioDataUrl: `data:${mimeType};base64,${base64Audio}`,
        mimeType,
        voiceName,
        persona: slangPersona,
        language,
        durationEstimateSec,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate voiceover audio.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/publish', async (req, res) => {
    try {
      const platform: SocialPlatform = ['tiktok', 'instagram', 'youtube', 'webhook'].includes(req.body?.platform)
        ? req.body.platform
        : 'webhook';
      const title = sanitizeText(req.body?.title, 150);
      const caption = sanitizeText(req.body?.caption, 2200);
      const hashtags = Array.isArray(req.body?.hashtags) ? req.body.hashtags.map(String).slice(0, 20) : [];
      const aspectRatio = ['9:16', '16:9', '1:1'].includes(req.body?.aspectRatio) ? req.body.aspectRatio : '9:16';
      const scheduledAt = sanitizeText(req.body?.scheduledAt, 64) || undefined;
      const accountHandle = sanitizeText(req.body?.accountHandle, 80) || undefined;
      const accountId = sanitizeText(req.body?.accountId, 80) || process.env.INSTAGRAM_ACCOUNT_ID || undefined;
      const videoDurationSec = Math.max(1, Number(req.body?.videoDurationSec) || 16);
      const dryRun = Boolean(req.body?.dryRun);

      if (!title || !caption) {
        res.status(400).json({ error: 'Title and caption are required before publishing.' });
        return;
      }

      const payload = buildPlatformPayload({
        platform,
        title,
        caption,
        hashtags,
        aspectRatio,
        scheduledAt,
        accountHandle,
        accountId,
        videoDurationSec,
      });

      if (dryRun) {
        res.json({
          status: scheduledAt ? 'scheduled' : 'delivered',
          httpStatus: 202,
          message: scheduledAt
            ? `Payload validated & queued for ${scheduledAt}`
            : `Payload validated & staged for ${platform.toUpperCase()} API`,
          endpoint: payload.endpointPath,
          payload: payload.body,
        });
        return;
      }

      if (platform === 'webhook') {
        const rawWebhookUrl = sanitizeText(req.body?.webhookUrl, 500) || process.env.SOCIAL_WEBHOOK_URL || '';
        const check = validateWebhookUrl(rawWebhookUrl);
        if (!check.valid) {
          res.status(400).json({ error: check.reason });
          return;
        }

        const upstream = await fetch(check.url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'KlipCraft-Studio/1.0' },
          body: JSON.stringify(payload.body),
          signal: AbortSignal.timeout(10000),
        });

        const text = await upstream.text();
        res.status(upstream.ok ? 200 : 502).json({
          status: upstream.ok ? (scheduledAt ? 'scheduled' : 'delivered') : 'failed',
          httpStatus: upstream.status,
          message: upstream.ok
            ? `Webhook accepted payload (HTTP ${upstream.status})`
            : `Webhook rejected payload (HTTP ${upstream.status}): ${text.slice(0, 160)}`,
          endpoint: check.url.hostname,
          payload: payload.body,
        });
        return;
      }

      // Direct OAuth/Bearer token dispatch for TikTok, Instagram, or YouTube
      const sessionToken = sanitizeText(req.body?.accessToken, 1024);
      const envToken =
        platform === 'tiktok'
          ? process.env.TIKTOK_ACCESS_TOKEN
          : platform === 'instagram'
            ? process.env.INSTAGRAM_ACCESS_TOKEN
            : process.env.YOUTUBE_ACCESS_TOKEN;

      const token = sessionToken || envToken;
      if (!token) {
        res.status(400).json({
          error: `Missing ${platform.toUpperCase()} Access Token. Enter a session Bearer token or configure server environment secrets, or use "Stage / Validate Payload" mode.`,
        });
        return;
      }

      const targetEndpoint = payload.endpointPath;
      const upstream = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload.body),
        signal: AbortSignal.timeout(12000),
      });

      const responseBody = await upstream.text();
      res.status(upstream.ok ? 200 : 502).json({
        status: upstream.ok ? (scheduledAt ? 'scheduled' : 'delivered') : 'failed',
        httpStatus: upstream.status,
        message: upstream.ok
          ? `${platform.toUpperCase()} API accepted request (HTTP ${upstream.status})`
          : `${platform.toUpperCase()} API returned HTTP ${upstream.status}: ${responseBody.slice(0, 180)}`,
        endpoint: targetEndpoint,
        payload: payload.body,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publishing request failed.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KlipCraft Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
