import React, { useRef, useState } from 'react';
import { Film, Link2, Loader2, Upload, ArrowRight, AlertCircle } from 'lucide-react';
import type { AspectRatioOption, Language, SlangPersona } from '../types';
import { PERSONA_LABELS, UI_COPY } from '../i18n';
import { VIRAL_PRESETS, type ViralPreset } from '../data/presets';
import { extractKeyframesFromVideoFile } from '../utils/videoFrames';

interface AnalyzerViewProps {
  language: Language;
  contentLanguage: Language;
  slangPersona: SlangPersona;
  targetFormat: AspectRatioOption;
  isAnalyzing: boolean;
  errorMessage: string | null;
  onChangePersona: (persona: SlangPersona) => void;
  onChangeTargetFormat: (aspect: AspectRatioOption) => void;
  onRunAnalysis: (payload: {
    brief: string;
    videoUrl: string;
    frames: string[];
    language: Language;
    slangPersona: SlangPersona;
    targetFormat: AspectRatioOption;
  }) => Promise<void>;
  onSelectPreset: (preset: ViralPreset) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  language,
  contentLanguage,
  slangPersona,
  targetFormat,
  isAnalyzing,
  errorMessage,
  onChangePersona,
  onChangeTargetFormat,
  onRunAnalysis,
  onSelectPreset,
}) => {
  const copy = UI_COPY[language].analyzer;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [videoUrl, setVideoUrl] = useState('');
  const [brief, setBrief] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [videoMeta, setVideoMeta] = useState<{ durationSec: number; width: number; height: number } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalError(null);
    setIsExtracting(true);
    setUploadedFileName(file.name);

    try {
      const result = await extractKeyframesFromVideoFile(file, 4);
      setExtractedFrames(result.frames);
      setVideoMeta({
        durationSec: Number(result.durationSec.toFixed(1)),
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to extract frames from video.');
      setExtractedFrames([]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!brief.trim() && !videoUrl.trim() && extractedFrames.length === 0) {
      setLocalError(copy.noFileOrBriefError);
      return;
    }

    await onRunAnalysis({
      brief: brief.trim(),
      videoUrl: videoUrl.trim(),
      frames: extractedFrames,
      language: contentLanguage,
      slangPersona,
      targetFormat,
    });
  };

  const combinedError = localError || errorMessage;

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Input Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              {copy.heading}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {copy.subheading}
            </p>
          </div>

          {/* Video Upload Zone */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              {copy.uploadLabel}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/70">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {uploadedFileName
                    ? `${uploadedFileName}${videoMeta ? ` · ${videoMeta.durationSec}s · ${videoMeta.width}×${videoMeta.height}` : ''}`
                    : copy.uploadHint}
                </p>
                {extractedFrames.length > 0 && (
                  <p className="text-xs font-mono tabular-nums text-emerald-700">
                    {extractedFrames.length} {copy.framesExtracted}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  id="viral-video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isExtracting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{uploadedFileName ? copy.replaceVideo : copy.chooseVideo}</span>
                </button>
              </div>
            </div>

            {extractedFrames.length > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-2" data-testid="extracted-frames-grid">
                {extractedFrames.map((frame, i) => (
                  <div
                    key={i}
                    className="aspect-[9/16] rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={frame}
                      alt={`Extracted keyframe ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* URL Reference */}
          <div className="space-y-1.5">
            <label htmlFor="reference-url" className="block text-xs font-semibold text-slate-700">
              {copy.urlLabel}
            </label>
            <div className="relative">
              <Link2
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="reference-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={copy.urlPlaceholder}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Visual & Concept Brief */}
          <div className="space-y-1.5">
            <label htmlFor="video-brief" className="block text-xs font-semibold text-slate-700">
              {copy.briefLabel}
            </label>
            <textarea
              id="video-brief"
              rows={4}
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder={copy.briefPlaceholder}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 resize-y"
            />
          </div>

          {/* Persona & Target Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="analyzer-persona" className="block text-xs font-semibold text-slate-700">
                {copy.slangLabel}
              </label>
              <select
                id="analyzer-persona"
                value={slangPersona}
                onChange={(e) => onChangePersona(e.target.value as SlangPersona)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {(Object.keys(PERSONA_LABELS) as SlangPersona[]).map((key) => (
                  <option key={key} value={key}>
                    {PERSONA_LABELS[key][language]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">
                {copy.targetPlatformLabel}
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {(['9:16', '16:9', '1:1'] as AspectRatioOption[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onChangeTargetFormat(ratio)}
                    className={`py-2 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      targetFormat === ratio
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {combinedError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{combinedError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{copy.analyzingBtn}</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" aria-hidden="true" />
                  <span>{copy.analyzeBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Curated Viral Reference Presets */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.presetsHeading}
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {VIRAL_PRESETS.length} presets
            </span>
          </div>

          <div className="space-y-4">
            {VIRAL_PRESETS.map((preset) => {
              const previewAnalysis = preset.analysis[contentLanguage];
              const thumb = previewAnalysis.scenes[0]?.imageUrl;
              return (
                <article
                  key={preset.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-stretch"
                >
                  <div className="w-24 shrink-0 aspect-[9/16] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={preset.label[language]}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{preset.category[language]}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{preset.durationLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{previewAnalysis.scenes.length} scenes</span>
                      </div>
                      <h3 className="font-display text-sm font-semibold text-slate-900 leading-snug">
                        {preset.label[language]}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {preset.brief[language]}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectPreset(preset)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>{copy.loadPreset}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
};
