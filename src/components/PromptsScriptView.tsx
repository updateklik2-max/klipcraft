import React, { useState } from 'react';
import { Check, Copy, ArrowRight, RefreshCw, Loader2, Film } from 'lucide-react';
import type { Language, SlangPersona, ViralAnalysisResult } from '../types';
import { PERSONA_LABELS, TRANSITION_LABELS, UI_COPY } from '../i18n';

interface PromptsScriptViewProps {
  language: Language;
  contentLanguage: Language;
  analysis: ViralAnalysisResult;
  isRewriting: boolean;
  rewriteError: string | null;
  onUpdateScript: (nextScript: string) => void;
  onRewriteScript: (targetLang: Language, persona: SlangPersona) => Promise<void>;
  onGoToEditor: () => void;
}

export const PromptsScriptView: React.FC<PromptsScriptViewProps> = ({
  language,
  contentLanguage,
  analysis,
  isRewriting,
  rewriteError,
  onUpdateScript,
  onRewriteScript,
  onGoToEditor,
}) => {
  const copy = UI_COPY[language].prompts;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<SlangPersona>(analysis.slangPersona);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
    } catch {
      // Clipboard blocked in some headless contexts; ignore silently
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Summary + Strategy */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{analysis.sourceLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{analysis.scenes.length} scenes</span>
            <span aria-hidden="true">·</span>
            <span>{analysis.language.toUpperCase()}</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {analysis.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={onGoToEditor}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{copy.sendToVoiceover}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Hook & Pacing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            {copy.hookHeading}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{analysis.hookStrategy}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            {copy.pacingHeading}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{analysis.pacingSummary}</p>
        </div>
      </div>

      {/* Editable Slang Script Studio */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label
            htmlFor="editable-viral-script"
            className="font-display text-base font-semibold text-slate-900"
          >
            {copy.scriptHeading}
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Slang Persona for Rewrite"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as SlangPersona)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900"
            >
              {(Object.keys(PERSONA_LABELS) as SlangPersona[]).map((key) => (
                <option key={key} value={key}>
                  {PERSONA_LABELS[key][language]}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isRewriting}
              onClick={() => onRewriteScript(contentLanguage, selectedPersona)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRewriting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{isRewriting ? copy.rewritingBtn : copy.rewriteBtn}</span>
            </button>
          </div>
        </div>

        <textarea
          id="editable-viral-script"
          rows={4}
          value={analysis.reimaginedScript}
          onChange={(e) => onUpdateScript(e.target.value)}
          className="w-full px-4 py-3 text-sm sm:text-base leading-relaxed text-slate-900 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
        />

        {rewriteError && (
          <p role="alert" className="text-xs text-red-700">
            {rewriteError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-700">{copy.hashtagsLabel}:</span>
            <span>{analysis.hashtags.join(' · ')}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('hashtags', analysis.hashtags.join(' '))}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            {copiedKey === 'hashtags' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{copiedKey === 'hashtags' ? copy.copied : copy.copyPrompt}</span>
          </button>
        </div>
      </section>

      {/* Scene Breakdown: T2I & T2V Prompts */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          {copy.scenesHeading}
        </h2>

        <div className="space-y-4">
          {analysis.scenes.map((scene) => {
            const t2iKey = `t2i-${scene.id}`;
            const t2vKey = `t2v-${scene.id}`;
            return (
              <article
                key={scene.id}
                className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start"
              >
                <div className="md:col-span-2">
                  <div className="aspect-[9/16] max-w-[130px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={`Scene ${scene.sceneNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="md:col-span-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        Scene {String(scene.sceneNumber).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{scene.durationSec}s</span>
                      <span aria-hidden="true">·</span>
                      <span>{scene.cameraMotion}</span>
                      <span aria-hidden="true">·</span>
                      <span>{TRANSITION_LABELS[scene.transition][language]}</span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-800">{scene.visualSummary}</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                    {/* Text-to-Image Prompt */}
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {copy.t2iLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(t2iKey, scene.t2iPrompt)}
                          aria-label={`Copy Text-to-Image prompt for scene ${scene.sceneNumber}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          {copiedKey === t2iKey ? (
                            <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{copiedKey === t2iKey ? copy.copied : copy.copyPrompt}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-700 leading-relaxed">
                        {scene.t2iPrompt}
                      </p>
                    </div>

                    {/* Text-to-Video Prompt */}
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {copy.t2vLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(t2vKey, scene.t2vPrompt)}
                          aria-label={`Copy Text-to-Video prompt for scene ${scene.sceneNumber}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          {copiedKey === t2vKey ? (
                            <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{copiedKey === t2vKey ? copy.copied : copy.copyPrompt}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-700 leading-relaxed">
                        {scene.t2vPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
