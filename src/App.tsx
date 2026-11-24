import { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { AnalyzerView } from './components/AnalyzerView';
import { PromptsScriptView } from './components/PromptsScriptView';
import { AutoEditorView } from './components/AutoEditorView';
import { PublishApiView } from './components/PublishApiView';
import { VIRAL_PRESETS, type ViralPreset } from './data/presets';
import { UI_COPY } from './i18n';
import type {
  AspectRatioOption,
  Language,
  PlatformConfig,
  PublishLogEntry,
  SceneBreakdown,
  SlangPersona,
  SocialPlatform,
  SubtitleSegment,
  SubtitleStyle,
  ViralAnalysisResult,
  VoiceName,
  VoiceoverAsset,
  WorkspaceTab,
} from './types';

export default function App() {
  const [uiLanguage, setUiLanguage] = useState<Language>('id');
  const [contentLanguage, setContentLanguage] = useState<Language>('id');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('analyzer');

  const [slangPersona, setSlangPersona] = useState<SlangPersona>('jaksel-santai');
  const [targetFormat, setTargetFormat] = useState<AspectRatioOption>('9:16');
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('kinetic-bold');

  const [analysis, setAnalysis] = useState<ViralAnalysisResult>(VIRAL_PRESETS[0].analysis.id);
  const [voiceover, setVoiceover] = useState<VoiceoverAsset | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const [isGeneratingVo, setIsGeneratingVo] = useState(false);
  const [voError, setVoError] = useState<string | null>(null);

  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    {
      platform: 'tiktok',
      enabled: true,
      envConfigured: false,
      endpointUrl: 'https://open.tiktokapis.com/v2/post/publish/video/init/',
      accountHandle: '@klipcraft.studio',
      accessToken: '',
    },
    {
      platform: 'instagram',
      enabled: false,
      envConfigured: false,
      endpointUrl: 'https://graph.facebook.com/v21.0/',
      accountHandle: '@klipcraft.reels',
      accessToken: '',
      accountId: '',
    },
    {
      platform: 'youtube',
      enabled: false,
      envConfigured: false,
      endpointUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
      accountHandle: '@klipcraftshorts',
      accessToken: '',
    },
    {
      platform: 'webhook',
      enabled: false,
      envConfigured: false,
      endpointUrl: '',
      accountHandle: 'n8n-pipeline',
      accessToken: '',
    },
  ]);

  const [publishLogs, setPublishLogs] = useState<PublishLogEntry[]>([]);

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((status) => {
        if (!status) return;
        setPlatforms((prev) =>
          prev.map((cfg) => ({
            ...cfg,
            envConfigured: Boolean(status[cfg.platform]),
          }))
        );
      })
      .catch(() => {});
  }, []);

  const handleToggleUiLanguage = (lang: Language) => {
    setUiLanguage(lang);
    setContentLanguage(lang);
    setSlangPersona(lang === 'id' ? 'jaksel-santai' : 'genz-creator-en');
  };

  const handleSelectPreset = (preset: ViralPreset) => {
    const presetAnalysis = preset.analysis[contentLanguage];
    setAnalysis(presetAnalysis);
    setVoiceover(null);
    setAnalyzeError(null);
    setActiveTab('prompts');
  };

  const handleRunAnalysis = async (payload: {
    brief: string;
    videoUrl: string;
    frames: string[];
    language: Language;
    slangPersona: SlangPersona;
    targetFormat: AspectRatioOption;
  }) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze video.');
      }
      setAnalysis(data);
      setVoiceover(null);
      setActiveTab('prompts');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis request failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewriteScript = async (targetLang: Language, persona: SlangPersona) => {
    setIsRewriting(true);
    setRewriteError(null);

    try {
      const totalDurationSec = analysis.scenes.reduce((sum, s) => sum + s.durationSec, 0);
      const res = await fetch('/api/rewrite-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentScript: analysis.reimaginedScript,
          title: analysis.title,
          language: targetLang,
          slangPersona: persona,
          totalDurationSec,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rewrite script.');
      }

      setAnalysis((prev) => ({
        ...prev,
        language: targetLang,
        slangPersona: persona,
        reimaginedScript: data.reimaginedScript,
        subtitles: data.subtitles?.length ? data.subtitles : prev.subtitles,
      }));
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'Rewrite failed.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateVoiceover = async (params: {
    script: string;
    voiceName: VoiceName;
    persona: SlangPersona;
    language: Language;
  }) => {
    setIsGeneratingVo(true);
    setVoError(null);

    try {
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Voiceover synthesis failed.');
      }
      setVoiceover(data);
    } catch (err) {
      setVoError(err instanceof Error ? err.message : 'Voiceover request failed.');
    } finally {
      setIsGeneratingVo(false);
    }
  };

  const handleUpdateScript = (nextScript: string) => {
    setAnalysis((prev) => ({ ...prev, reimaginedScript: nextScript }));
  };

  const handleUpdateScenes = (scenes: SceneBreakdown[]) => {
    setAnalysis((prev) => ({ ...prev, scenes }));
  };

  const handleUpdateSubtitles = (subtitles: SubtitleSegment[]) => {
    setAnalysis((prev) => ({ ...prev, subtitles }));
  };

  const handleUpdatePlatform = (platform: SocialPlatform, patch: Partial<PlatformConfig>) => {
    setPlatforms((prev) =>
      prev.map((cfg) => (cfg.platform === platform ? { ...cfg, ...patch } : cfg))
    );
  };

  const handleSelectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const toolbarCopy = UI_COPY[uiLanguage].toolbar;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        language={uiLanguage}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onNewAnalysis={() => handleSelectTab('analyzer')}
      />

      {/* Workspace Context & Bilingual Language Toolbar (kept out of header per Top Bar Contract) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600 min-w-0">
            <span className="font-medium text-slate-500 whitespace-nowrap">
              {toolbarCopy.activeProject}:
            </span>
            <span className="font-semibold text-slate-900 truncate max-w-[280px]">
              {analysis.title}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="font-mono tabular-nums text-slate-500 whitespace-nowrap">
              {targetFormat}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 whitespace-nowrap">{toolbarCopy.interfaceLang}:</span>
              <div className="inline-flex p-0.5 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => handleToggleUiLanguage('id')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    uiLanguage === 'id' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleUiLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    uiLanguage === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 whitespace-nowrap">{toolbarCopy.contentLang}:</span>
              <div className="inline-flex p-0.5 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    setContentLanguage('id');
                    setSlangPersona('jaksel-santai');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    contentLanguage === 'id'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Indonesia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContentLanguage('en');
                    setSlangPersona('genz-creator-en');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    contentLanguage === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'analyzer' && (
          <AnalyzerView
            language={uiLanguage}
            contentLanguage={contentLanguage}
            slangPersona={slangPersona}
            targetFormat={targetFormat}
            isAnalyzing={isAnalyzing}
            errorMessage={analyzeError}
            onChangePersona={setSlangPersona}
            onChangeTargetFormat={setTargetFormat}
            onRunAnalysis={handleRunAnalysis}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activeTab === 'prompts' && (
          <PromptsScriptView
            language={uiLanguage}
            contentLanguage={contentLanguage}
            analysis={analysis}
            isRewriting={isRewriting}
            rewriteError={rewriteError}
            onUpdateScript={handleUpdateScript}
            onRewriteScript={handleRewriteScript}
            onGoToEditor={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'editor' && (
          <AutoEditorView
            language={uiLanguage}
            contentLanguage={contentLanguage}
            analysis={analysis}
            aspectRatio={targetFormat}
            subtitleStyle={subtitleStyle}
            voiceover={voiceover}
            isGeneratingVoiceover={isGeneratingVo}
            voiceoverError={voError}
            onChangeAspectRatio={setTargetFormat}
            onChangeSubtitleStyle={setSubtitleStyle}
            onUpdateScenes={handleUpdateScenes}
            onUpdateSubtitles={handleUpdateSubtitles}
            onUpdateScript={handleUpdateScript}
            onGenerateVoiceover={handleGenerateVoiceover}
          />
        )}

        {activeTab === 'publish' && (
          <PublishApiView
            language={uiLanguage}
            analysis={analysis}
            aspectRatio={targetFormat}
            platforms={platforms}
            publishLogs={publishLogs}
            onUpdatePlatform={handleUpdatePlatform}
            onAddLogEntry={(entry) => setPublishLogs((prev) => [entry, ...prev])}
          />
        )}
      </main>
    </div>
  );
}
