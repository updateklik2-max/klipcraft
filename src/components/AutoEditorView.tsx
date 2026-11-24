import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import type {
  AspectRatioOption,
  Language,
  SceneBreakdown,
  SlangPersona,
  SubtitleSegment,
  SubtitleStyle,
  TransitionType,
  ViralAnalysisResult,
  VoiceName,
  VoiceoverAsset,
} from '../types';
import {
  PERSONA_LABELS,
  SUBTITLE_STYLE_LABELS,
  TRANSITION_LABELS,
  UI_COPY,
} from '../i18n';
import {
  autoGenerateSubtitlesFromScript,
  formatTimecode,
  getCanvasDimensions,
  getTotalTimelineDuration,
  resolveActiveSubtitle,
  resolveSceneAtTime,
} from '../utils/editorEngine';

interface AutoEditorViewProps {
  language: Language;
  contentLanguage: Language;
  analysis: ViralAnalysisResult;
  aspectRatio: AspectRatioOption;
  subtitleStyle: SubtitleStyle;
  voiceover: VoiceoverAsset | null;
  isGeneratingVoiceover: boolean;
  voiceoverError: string | null;
  onChangeAspectRatio: (ratio: AspectRatioOption) => void;
  onChangeSubtitleStyle: (style: SubtitleStyle) => void;
  onUpdateScenes: (scenes: SceneBreakdown[]) => void;
  onUpdateSubtitles: (subtitles: SubtitleSegment[]) => void;
  onUpdateScript: (script: string) => void;
  onGenerateVoiceover: (params: {
    script: string;
    voiceName: VoiceName;
    persona: SlangPersona;
    language: Language;
  }) => Promise<void>;
}

const VOICES: Array<{ id: VoiceName; desc: string }> = [
  { id: 'Puck', desc: 'Upbeat & Expressive' },
  { id: 'Kore', desc: 'Crisp & Editorial' },
  { id: 'Fenrir', desc: 'Bold & Punchy' },
  { id: 'Zephyr', desc: 'Warm & Casual' },
  { id: 'Charon', desc: 'Deep Documentary' },
];

export const AutoEditorView: React.FC<AutoEditorViewProps> = ({
  language,
  contentLanguage,
  analysis,
  aspectRatio,
  subtitleStyle,
  voiceover,
  isGeneratingVoiceover,
  voiceoverError,
  onChangeAspectRatio,
  onChangeSubtitleStyle,
  onUpdateScenes,
  onUpdateSubtitles,
  onUpdateScript,
  onGenerateVoiceover,
}) => {
  const copy = UI_COPY[language].editor;

  const [selectedPersona, setSelectedPersona] = useState<SlangPersona>(analysis.slangPersona);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Puck');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const playStartWallRef = useRef<number>(0);
  const playStartOffsetRef = useRef<number>(0);

  const totalDuration = Math.max(1, getTotalTimelineDuration(analysis.scenes));
  const dimensions = getCanvasDimensions(aspectRatio);

  // Preload scene images cleanly into memory and trigger canvas redraw when ready
  useEffect(() => {
    for (const scene of analysis.scenes) {
      if (!scene.imageUrl) continue;
      const existing = imageCacheRef.current.get(scene.imageUrl);
      if (existing) {
        if (existing.complete) {
          drawFrameAtTime(currentTime);
        }
        continue;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        drawFrameAtTime(currentTime);
      };
      img.src = scene.imageUrl;
      imageCacheRef.current.set(scene.imageUrl, img);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis.scenes]);

  // Draw a single composed frame onto the canvas
  const drawFrameAtTime = (timeSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    const active = resolveSceneAtTime(analysis.scenes, timeSec, 0.45);
    if (!active) return;

    const drawCoverImage = (
      img: HTMLImageElement | undefined,
      alpha: number,
      scale: number,
      offsetX = 0,
      offsetY = 0
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.scale(scale, scale);

      if (img && img.complete && img.naturalWidth > 0) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = width / height;
        let drawW = width;
        let drawH = height;
        if (imgAspect > canvasAspect) {
          drawH = height;
          drawW = height * imgAspect;
        } else {
          drawW = width;
          drawH = width / imgAspect;
        }
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
        grad.addColorStop(0, '#1E293B');
        grad.addColorStop(1, '#334155');
        ctx.fillStyle = grad;
        ctx.fillRect(-width / 2, -height / 2, width, height);
      }
      ctx.restore();
    };

    const currentImg = imageCacheRef.current.get(active.currentScene.imageUrl);
    const nextImg = active.nextScene ? imageCacheRef.current.get(active.nextScene.imageUrl) : undefined;
    const kenBurns = 1 + (active.localTimeSec / Math.max(1, active.sceneDurationSec)) * 0.08;
    const p = active.transitionProgress;

    if (p <= 0 || !active.nextScene) {
      drawCoverImage(currentImg, 1, kenBurns);
    } else {
      const t = active.activeTransition;
      if (t === 'cross-dissolve') {
        drawCoverImage(currentImg, 1 - p, kenBurns);
        drawCoverImage(nextImg, p, 1.04 - p * 0.04);
      } else if (t === 'whip-pan') {
        const ease = p * p * (3 - 2 * p);
        drawCoverImage(currentImg, 1, kenBurns, -ease * width, 0);
        drawCoverImage(nextImg, 1, 1.05, (1 - ease) * width, 0);
      } else if (t === 'slide-up') {
        const ease = 1 - Math.pow(1 - p, 3);
        drawCoverImage(currentImg, 1, kenBurns, 0, -ease * height * 0.35);
        drawCoverImage(nextImg, 1, 1.02, 0, (1 - ease) * height);
      } else if (t === 'glitch-cut') {
        if (p < 0.5) {
          const jitter = Math.sin(p * 45) * 14;
          drawCoverImage(currentImg, 1, kenBurns + 0.04, jitter, 0);
          ctx.fillStyle = 'rgba(225, 29, 72, 0.16)';
          ctx.fillRect(0, height * 0.28, width, 16);
          ctx.fillRect(0, height * 0.62, width, 10);
        } else {
          const jitter = Math.cos(p * 40) * 10;
          drawCoverImage(nextImg, 1, 1.03, jitter, 0);
        }
      } else {
        // zoom-punch
        if (p < 0.5) {
          drawCoverImage(currentImg, 1 - p * 0.4, kenBurns + p * 0.32);
        } else {
          drawCoverImage(nextImg, 1, 1.18 - (p - 0.5) * 0.36);
        }
      }
    }

    // Subtle contrast scrim at bottom for subtitle legibility
    const scrim = ctx.createLinearGradient(0, height * 0.55, 0, height);
    scrim.addColorStop(0, 'rgba(15, 23, 42, 0)');
    scrim.addColorStop(1, 'rgba(15, 23, 42, 0.78)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);

    // Render aesthetic subtitle overlay
    const activeSub = resolveActiveSubtitle(analysis.subtitles, timeSec);
    if (activeSub) {
      drawAestheticSubtitle(ctx, width, height, activeSub.words, activeSub.activeWordIndex, subtitleStyle);
    }
  };

  // Re-draw whenever static props or scrub position changes
  useEffect(() => {
    drawFrameAtTime(currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, aspectRatio, subtitleStyle, analysis.scenes, analysis.subtitles]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      return;
    }

    playStartWallRef.current = performance.now();
    playStartOffsetRef.current = currentTime >= totalDuration ? 0 : currentTime;

    if (audioRef.current && voiceover?.audioDataUrl) {
      audioRef.current.currentTime = playStartOffsetRef.current;
      audioRef.current.play().catch(() => {});
    }

    const tick = (now: number) => {
      const elapsed = (now - playStartWallRef.current) / 1000;
      const nextTime = playStartOffsetRef.current + elapsed;

      if (nextTime >= totalDuration) {
        setCurrentTime(totalDuration);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(nextTime);
      drawFrameAtTime(nextTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, totalDuration]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= totalDuration - 0.05) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
    }
  };

  const handleGlobalTransitionChange = (transition: TransitionType) => {
    onUpdateScenes(analysis.scenes.map((s) => ({ ...s, transition })));
  };

  const handleSceneChange = (index: number, patch: Partial<SceneBreakdown>) => {
    const next = analysis.scenes.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
    onUpdateScenes(next);
  };

  const handleSubtitleChange = (index: number, patch: Partial<SubtitleSegment>) => {
    const next = analysis.subtitles.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
    onUpdateSubtitles(next);
  };

  const handleAddSubtitle = () => {
    const lastEnd = analysis.subtitles[analysis.subtitles.length - 1]?.endSec ?? 0;
    const nextStart = Number(Math.min(totalDuration - 1, lastEnd).toFixed(1));
    const nextEnd = Number(Math.min(totalDuration, nextStart + 2.5).toFixed(1));
    onUpdateSubtitles([
      ...analysis.subtitles,
      {
        id: `sub-${Date.now()}`,
        startSec: Math.max(0, nextStart),
        endSec: Math.max(0.8, nextEnd),
        text: language === 'id' ? 'Baris subtitle baru...' : 'New subtitle line...',
      },
    ]);
  };

  const handleSyncSubtitlesFromScript = () => {
    const synced = autoGenerateSubtitlesFromScript(analysis.reimaginedScript, totalDuration);
    onUpdateSubtitles(synced);
  };

  // Real client-side WebM export using Canvas captureStream + optional Voiceover audio mix
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') {
      setExportStatus('MediaRecorder is unavailable in this browser.');
      return;
    }

    setIsPlaying(false);
    setIsExporting(true);
    setExportStatus(null);

    try {
      const videoStream = canvas.captureStream(30);
      let combinedStream: MediaStream = videoStream;
      let audioCtx: AudioContext | null = null;
      let audioSource: AudioBufferSourceNode | null = null;

      if (voiceover?.audioDataUrl) {
        try {
          audioCtx = new AudioContext();
          const res = await fetch(voiceover.audioDataUrl);
          const buf = await res.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(buf);
          const dest = audioCtx.createMediaStreamDestination();
          audioSource = audioCtx.createBufferSource();
          audioSource.buffer = decoded;
          audioSource.connect(dest);
          audioSource.start(0);
          combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch {
          // Fallback to video-only track if audio decode fails
        }
      }

      const mimeCandidate = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(combinedStream, { mimeType: mimeCandidate });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const donePromise = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(200);

      const startMs = performance.now();
      await new Promise<void>((resolve) => {
        const step = () => {
          const elapsedSec = (performance.now() - startMs) / 1000;
          setCurrentTime(Math.min(totalDuration, elapsedSec));
          drawFrameAtTime(Math.min(totalDuration, elapsedSec));
          if (elapsedSec >= totalDuration) {
            resolve();
          } else {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      });

      recorder.stop();
      await donePromise;
      if (audioSource) {
        try {
          audioSource.stop();
        } catch {
          // ignore
        }
      }
      if (audioCtx) {
        await audioCtx.close();
      }

      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysis.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'klipcraft-export'}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportStatus(copy.exportSuccess);
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {copy.heading}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleExportVideo}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{isExporting ? copy.exportingBtn : copy.exportBtn}</span>
        </button>
      </div>

      {exportStatus && (
        <p className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
          {exportStatus}
        </p>
      )}

      {/* Main Split: Live Canvas Player (left) + Voiceover & Auto-Edit Inspector (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Canvas Preview Player */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              {copy.canvasTitle}
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </span>
          </div>

          <div className="flex justify-center bg-slate-950 rounded-lg p-3 overflow-hidden">
            <canvas
              ref={canvasRef}
              data-testid="auto-editor-canvas"
              className={`rounded-md bg-slate-900 max-h-[460px] w-auto h-auto ${
                aspectRatio === '9:16'
                  ? 'aspect-[9/16]'
                  : aspectRatio === '16:9'
                    ? 'aspect-video w-full'
                    : 'aspect-square'
              }`}
            />
          </div>

          {/* Playback Controls & Scrubber */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? copy.pauseBtn : copy.playBtn}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copy.pauseBtn}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copy.playBtn}</span>
                  </>
                )}
              </button>

              <input
                type="range"
                aria-label="Timeline Scrubber"
                min={0}
                max={totalDuration}
                step={0.05}
                value={currentTime}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setIsPlaying(false);
                  setCurrentTime(next);
                  if (audioRef.current) audioRef.current.currentTime = next;
                }}
                className="flex-1 accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Right Column: Slang Voiceover Generator + Style Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Voiceover Studio */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-slate-900">
                {copy.voiceoverTitle}
              </h2>
              {voiceover && (
                <a
                  href={voiceover.audioDataUrl}
                  download={`voiceover-${voiceover.voiceName.toLowerCase()}.wav`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-rose-600"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copy.downloadWav}</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="vo-persona" className="block text-xs font-semibold text-slate-700">
                  {copy.personaLabel}
                </label>
                <select
                  id="vo-persona"
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value as SlangPersona)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {(Object.keys(PERSONA_LABELS) as SlangPersona[]).map((key) => (
                    <option key={key} value={key}>
                      {PERSONA_LABELS[key][language]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="vo-voice" className="block text-xs font-semibold text-slate-700">
                  {copy.voiceLabel}
                </label>
                <select
                  id="vo-voice"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} · {v.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="editor-vo-script" className="block text-xs font-semibold text-slate-700">
                Script
              </label>
              <textarea
                id="editor-vo-script"
                rows={3}
                value={analysis.reimaginedScript}
                onChange={(e) => onUpdateScript(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            {voiceoverError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{voiceoverError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={isGeneratingVoiceover}
                onClick={() =>
                  onGenerateVoiceover({
                    script: analysis.reimaginedScript,
                    voiceName: selectedVoice,
                    persona: selectedPersona,
                    language: contentLanguage,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isGeneratingVoiceover ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isGeneratingVoiceover ? copy.generatingVoBtn : copy.generateVoBtn}</span>
              </button>

              {voiceover && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{voiceover.voiceName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">~{voiceover.durationEstimateSec}s</span>
                </div>
              )}
            </div>

            {voiceover && (
              <audio
                ref={audioRef}
                controls
                src={voiceover.audioDataUrl}
                className="w-full h-9 pt-1"
              />
            )}
          </section>

          {/* Auto-Edit Transitions & Aesthetic Subtitles */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  {copy.aspectLabel}
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['9:16', '16:9', '1:1'] as AspectRatioOption[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => onChangeAspectRatio(ratio)}
                      className={`py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="global-transition"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {copy.transitionLabel}
                </label>
                <select
                  id="global-transition"
                  value={analysis.scenes[0]?.transition ?? 'zoom-punch'}
                  onChange={(e) => handleGlobalTransitionChange(e.target.value as TransitionType)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((t) => (
                    <option key={t} value={t}>
                      {TRANSITION_LABELS[t][language]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="subtitle-aesthetic"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {copy.subtitleStyleLabel}
                </label>
                <select
                  id="subtitle-aesthetic"
                  value={subtitleStyle}
                  onChange={(e) => onChangeSubtitleStyle(e.target.value as SubtitleStyle)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {(Object.keys(SUBTITLE_STYLE_LABELS) as SubtitleStyle[]).map((s) => (
                    <option key={s} value={s}>
                      {SUBTITLE_STYLE_LABELS[s][language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scene Timeline Strip */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                {copy.timelineHeading}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70"
                  >
                    <img
                      src={scene.imageUrl}
                      alt={`Timeline clip ${scene.sceneNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-10 h-14 object-cover rounded border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-800">
                          Clip {String(scene.sceneNumber).padStart(2, '0')}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {scene.durationSec}s
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          aria-label={`Duration seconds for clip ${scene.sceneNumber}`}
                          min={1}
                          max={15}
                          step={0.5}
                          value={scene.durationSec}
                          onChange={(e) =>
                            handleSceneChange(idx, {
                              durationSec: Math.max(1, Number(e.target.value) || 3),
                            })
                          }
                          className="w-16 px-2 py-1 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded"
                        />
                        <select
                          aria-label={`Transition for clip ${scene.sceneNumber}`}
                          value={scene.transition}
                          onChange={(e) =>
                            handleSceneChange(idx, {
                              transition: e.target.value as TransitionType,
                            })
                          }
                          className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                        >
                          {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((t) => (
                            <option key={t} value={t}>
                              {TRANSITION_LABELS[t][language]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Synced Subtitle Editor */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-slate-900">
            {copy.subtitlesHeading}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncSubtitlesFromScript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copy.syncScript}</span>
            </button>
            <button
              type="button"
              onClick={handleAddSubtitle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copy.addSubtitle}</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 border-t border-slate-200">
          {analysis.subtitles.map((sub, idx) => (
            <div
              key={sub.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center py-3"
            >
              <div className="sm:col-span-3 flex items-center gap-2">
                <input
                  type="number"
                  aria-label={`Subtitle ${idx + 1} start seconds`}
                  min={0}
                  step={0.1}
                  value={sub.startSec}
                  onChange={(e) =>
                    handleSubtitleChange(idx, { startSec: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-20 px-2 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded"
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="number"
                  aria-label={`Subtitle ${idx + 1} end seconds`}
                  min={0.5}
                  step={0.1}
                  value={sub.endSec}
                  onChange={(e) =>
                    handleSubtitleChange(idx, { endSec: Math.max(0.5, Number(e.target.value) || 1) })
                  }
                  className="w-20 px-2 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded"
                />
              </div>

              <div className="sm:col-span-8">
                <input
                  type="text"
                  aria-label={`Subtitle ${idx + 1} text`}
                  value={sub.text}
                  onChange={(e) => handleSubtitleChange(idx, { text: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  aria-label={`Delete subtitle line ${idx + 1}`}
                  onClick={() =>
                    onUpdateSubtitles(analysis.subtitles.filter((item) => item.id !== sub.id))
                  }
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

function drawAestheticSubtitle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  words: string[],
  activeWordIndex: number,
  style: SubtitleStyle
) {
  const fullText = words.join(' ');
  const baseFontSize = Math.round(width * 0.056);
  const yCenter = height * 0.82;
  const maxWidth = width * 0.84;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (style === 'minimal-bar') {
    ctx.font = `600 ${Math.round(baseFontSize * 0.86)}px "DM Sans", sans-serif`;
    const lines = wrapText(ctx, fullText, maxWidth);
    const lineHeight = baseFontSize * 1.25;
    const boxHeight = lines.length * lineHeight + 22;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(width * 0.08, yCenter - boxHeight / 2, width * 0.84, boxHeight);

    ctx.fillStyle = '#F8FAFC';
    lines.forEach((line, i) => {
      const y = yCenter - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight;
      ctx.fillText(line, width / 2, y);
    });
    ctx.restore();
    return;
  }

  if (style === 'editorial-clean') {
    ctx.font = `600 ${baseFontSize}px "Plus Jakarta Sans", sans-serif`;
    const lines = wrapText(ctx, fullText, maxWidth);
    const lineHeight = baseFontSize * 1.24;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    lines.forEach((line, i) => {
      const y = yCenter - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight;
      ctx.fillText(line, width / 2, y);
    });
    ctx.restore();
    return;
  }

  if (style === 'contrast-box') {
    ctx.font = `700 ${Math.round(baseFontSize * 0.92)}px "Plus Jakarta Sans", sans-serif`;
    const lines = wrapText(ctx, fullText.toUpperCase(), maxWidth);
    const lineHeight = baseFontSize * 1.32;
    lines.forEach((line, i) => {
      const y = yCenter - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight;
      const metrics = ctx.measureText(line);
      const padX = 16;
      const boxH = baseFontSize * 1.15;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(width / 2 - metrics.width / 2 - padX, y - boxH / 2, metrics.width + padX * 2, boxH);
      ctx.fillStyle = '#0F172A';
      ctx.fillText(line, width / 2, y);
    });
    ctx.restore();
    return;
  }

  // kinetic-bold (active word highlight)
  ctx.font = `700 ${Math.round(baseFontSize * 1.04)}px "Plus Jakarta Sans", sans-serif`;
  const wrappedLines = wrapWordObjects(ctx, words, maxWidth);
  const lineHeight = baseFontSize * 1.32;

  wrappedLines.forEach((lineWords, lineIdx) => {
    const lineText = lineWords.map((w) => w.word).join(' ');
    const totalW = ctx.measureText(lineText).width;
    let cursorX = width / 2 - totalW / 2;
    const y = yCenter - ((wrappedLines.length - 1) * lineHeight) / 2 + lineIdx * lineHeight;

    lineWords.forEach((item, wIdx) => {
      const wordText = wIdx < lineWords.length - 1 ? `${item.word} ` : item.word;
      const wordW = ctx.measureText(wordText).width;
      const isActive = item.index === activeWordIndex;

      if (isActive) {
        ctx.fillStyle = '#E11D48';
        ctx.fillRect(cursorX - 4, y - baseFontSize * 0.58, ctx.measureText(item.word).width + 8, baseFontSize * 1.16);
      }

      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(wordText, cursorX, y);
      cursorX += wordW;
    });
  });

  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapWordObjects(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxWidth: number
): Array<Array<{ word: string; index: number }>> {
  const lines: Array<Array<{ word: string; index: number }>> = [];
  let current: Array<{ word: string; index: number }> = [];

  words.forEach((word, index) => {
    const candidate = [...current.map((c) => c.word), word].join(' ');
    if (ctx.measureText(candidate).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = [{ word, index }];
    } else {
      current.push({ word, index });
    }
  });
  if (current.length > 0) lines.push(current);
  return lines;
}
