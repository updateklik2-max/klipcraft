import type {
  AspectRatioOption,
  SceneBreakdown,
  SubtitleSegment,
  TransitionType,
} from '../types';

export interface ActiveSceneState {
  currentScene: SceneBreakdown;
  nextScene: SceneBreakdown | null;
  sceneIndex: number;
  localTimeSec: number;
  sceneDurationSec: number;
  transitionProgress: number; // 0 when not in transition, 0..1 during transition window
  activeTransition: TransitionType;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export function getCanvasDimensions(aspect: AspectRatioOption): CanvasDimensions {
  switch (aspect) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '1:1':
      return { width: 720, height: 720 };
    case '9:16':
    default:
      return { width: 540, height: 960 };
  }
}

export function getTotalTimelineDuration(scenes: SceneBreakdown[]): number {
  if (scenes.length === 0) return 0;
  return scenes.reduce((acc, s) => acc + Math.max(0.5, Number(s.durationSec) || 3), 0);
}

export function resolveSceneAtTime(
  scenes: SceneBreakdown[],
  timeSec: number,
  transitionDurationSec = 0.45
): ActiveSceneState | null {
  if (scenes.length === 0) return null;

  const clampedTime = Math.max(0, timeSec);
  let cursor = 0;

  for (let i = 0; i < scenes.length; i++) {
    const dur = Math.max(0.5, Number(scenes[i].durationSec) || 3);
    const end = cursor + dur;

    if (clampedTime < end || i === scenes.length - 1) {
      const localTimeSec = Math.min(dur, Math.max(0, clampedTime - cursor));
      const nextScene = i < scenes.length - 1 ? scenes[i + 1] : null;
      const effectiveTransitionDur = Math.min(transitionDurationSec, dur * 0.45);
      const timeRemaining = dur - localTimeSec;

      let transitionProgress = 0;
      if (nextScene && timeRemaining <= effectiveTransitionDur && effectiveTransitionDur > 0) {
        transitionProgress = Math.min(
          1,
          Math.max(0, (effectiveTransitionDur - timeRemaining) / effectiveTransitionDur)
        );
      }

      return {
        currentScene: scenes[i],
        nextScene,
        sceneIndex: i,
        localTimeSec,
        sceneDurationSec: dur,
        transitionProgress,
        activeTransition: scenes[i].transition,
      };
    }

    cursor = end;
  }

  return null;
}

export function resolveActiveSubtitle(
  subtitles: SubtitleSegment[],
  timeSec: number
): { segment: SubtitleSegment; activeWordIndex: number; words: string[] } | null {
  const seg = subtitles.find((s) => timeSec >= s.startSec && timeSec <= s.endSec);
  if (!seg) return null;

  const words = seg.text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const span = Math.max(0.1, seg.endSec - seg.startSec);
  const progress = Math.min(0.999, Math.max(0, (timeSec - seg.startSec) / span));
  const activeWordIndex = Math.floor(progress * words.length);

  return { segment: seg, activeWordIndex, words };
}

export function autoGenerateSubtitlesFromScript(
  script: string,
  totalDurationSec: number
): SubtitleSegment[] {
  const cleaned = script
    .replace(/\[.*?\]|<.*?>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const rawChunks = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((c) => c.trim())
    .filter(Boolean);

  // Split long sentences into readable 5-7 word short-form caption bites
  const bites: string[] = [];
  for (const chunk of rawChunks) {
    const words = chunk.split(/\s+/);
    if (words.length <= 7) {
      bites.push(chunk);
    } else {
      for (let i = 0; i < words.length; i += 6) {
        bites.push(words.slice(i, i + 6).join(' '));
      }
    }
  }

  const duration = Math.max(3, totalDurationSec || bites.length * 2.5);
  const totalWords = bites.reduce((sum, b) => sum + b.split(/\s+/).length, 0) || 1;

  let currentSec = 0;
  return bites.map((text, idx) => {
    const wordCount = text.split(/\s+/).length;
    const slice = Math.max(0.8, (wordCount / totalWords) * duration);
    const startSec = Number(currentSec.toFixed(2));
    const endSec = Number(Math.min(duration, currentSec + slice).toFixed(2));
    currentSec = endSec;
    return {
      id: `sub-${idx + 1}`,
      startSec,
      endSec: endSec > startSec ? endSec : Number((startSec + 0.8).toFixed(2)),
      text,
    };
  });
}

export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
