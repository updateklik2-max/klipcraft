import React, { useMemo, useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import type {
  AspectRatioOption,
  Language,
  PlatformConfig,
  PublishLogEntry,
  SocialPlatform,
  ViralAnalysisResult,
} from '../types';
import { UI_COPY } from '../i18n';
import { buildDefaultPublishCaption, buildPlatformPayload } from '../utils/socialPayloads';
import { getTotalTimelineDuration } from '../utils/editorEngine';

interface PublishApiViewProps {
  language: Language;
  analysis: ViralAnalysisResult;
  aspectRatio: AspectRatioOption;
  platforms: PlatformConfig[];
  publishLogs: PublishLogEntry[];
  onUpdatePlatform: (platform: SocialPlatform, patch: Partial<PlatformConfig>) => void;
  onAddLogEntry: (entry: PublishLogEntry) => void;
}

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  tiktok: 'TikTok Content API v2',
  instagram: 'Instagram Reels Graph API',
  youtube: 'YouTube Shorts Data API v3',
  webhook: 'Automation Webhook (n8n / Make)',
};

export const PublishApiView: React.FC<PublishApiViewProps> = ({
  language,
  analysis,
  aspectRatio,
  platforms,
  publishLogs,
  onUpdatePlatform,
  onAddLogEntry,
}) => {
  const copy = UI_COPY[language].publish;

  const [title, setTitle] = useState(analysis.title);
  const [caption, setCaption] = useState(buildDefaultPublishCaption(analysis));
  const [hashtagsText, setHashtagsText] = useState(analysis.hashtags.join(' '));
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [dispatchMode, setDispatchMode] = useState<'stage' | 'live'>('stage');
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>('tiktok');
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalDurationSec = getTotalTimelineDuration(analysis.scenes);
  const parsedTags = useMemo(
    () =>
      hashtagsText
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [hashtagsText]
  );

  const selectedPlatforms = platforms.filter((p) => p.enabled);

  const activePreviewConfig =
    platforms.find((p) => p.platform === previewPlatform) ?? platforms[0];

  const jsonPreview = useMemo(() => {
    const built = buildPlatformPayload({
      platform: previewPlatform,
      title,
      caption,
      hashtags: parsedTags,
      aspectRatio,
      scheduledAt: scheduleMode === 'later' ? scheduledAt : undefined,
      accountHandle: activePreviewConfig?.accountHandle,
      accountId: activePreviewConfig?.accountId,
      videoDurationSec: totalDurationSec,
    });
    return JSON.stringify(built, null, 2);
  }, [
    previewPlatform,
    title,
    caption,
    parsedTags,
    aspectRatio,
    scheduleMode,
    scheduledAt,
    activePreviewConfig,
    totalDurationSec,
  ]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !caption.trim()) {
      setErrorMsg('Title and caption are required.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setErrorMsg('Select at least one target platform.');
      return;
    }

    setIsPublishing(true);

    try {
      for (const target of selectedPlatforms) {
        const res = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: target.platform,
            title: title.trim(),
            caption: caption.trim(),
            hashtags: parsedTags,
            aspectRatio,
            scheduledAt: scheduleMode === 'later' ? scheduledAt : undefined,
            accountHandle: target.accountHandle,
            accountId: target.accountId,
            webhookUrl: target.endpointUrl,
            accessToken: target.accessToken,
            videoDurationSec: totalDurationSec,
            dryRun: dispatchMode === 'stage',
          }),
        });

        const data = await res.json();
        onAddLogEntry({
          id: `pub-${Date.now()}-${target.platform}`,
          platform: target.platform,
          title: title.trim(),
          status: res.ok ? data.status || 'delivered' : 'failed',
          httpStatus: data.httpStatus ?? res.status,
          message: res.ok ? data.message : data.error || 'Dispatch failed',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          payloadPreview: JSON.stringify(data.payload ?? {}, null, 2),
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Publishing error occurred.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 border-b border-slate-200 pb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {copy.heading}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{copy.subheading}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Connectors + Composer */}
        <form onSubmit={handleDispatch} className="lg:col-span-7 space-y-6">
          {/* Platform API Connectors */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.connectorsHeading}
            </h2>

            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {platforms.map((cfg) => (
                <div
                  key={cfg.platform}
                  className="py-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.enabled}
                        onChange={(e) =>
                          onUpdatePlatform(cfg.platform, { enabled: e.target.checked })
                        }
                        className="w-4 h-4 accent-rose-600 rounded"
                      />
                      <span className="text-sm font-semibold text-slate-900">
                        {PLATFORM_NAMES[cfg.platform]}
                      </span>
                    </label>

                    <span className="text-xs text-slate-500">
                      {cfg.envConfigured ? copy.envConnected : 'Session / Manual'}
                    </span>
                  </div>

                  {cfg.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {cfg.platform === 'webhook' ? (
                        <input
                          type="url"
                          aria-label="Webhook HTTPS URL"
                          value={cfg.endpointUrl}
                          onChange={(e) =>
                            onUpdatePlatform(cfg.platform, { endpointUrl: e.target.value })
                          }
                          placeholder="https://hook.make.com/..."
                          className="sm:col-span-2 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            aria-label={`${cfg.platform} account handle`}
                            value={cfg.accountHandle}
                            onChange={(e) =>
                              onUpdatePlatform(cfg.platform, { accountHandle: e.target.value })
                            }
                            placeholder="@creator_handle"
                            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                          <input
                            type="password"
                            aria-label={`${cfg.platform} bearer token`}
                            value={cfg.accessToken}
                            onChange={(e) =>
                              onUpdatePlatform(cfg.platform, { accessToken: e.target.value })
                            }
                            placeholder={copy.sessionTokenPlaceholder}
                            className="px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                          {cfg.platform === 'instagram' && (
                            <input
                              type="text"
                              aria-label="Instagram Business Account ID"
                              value={cfg.accountId || ''}
                              onChange={(e) =>
                                onUpdatePlatform(cfg.platform, { accountId: e.target.value })
                              }
                              placeholder="IG User ID (e.g. 1784140...)"
                              className="sm:col-span-2 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Publish Payload Composer */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.composerHeading}
            </h2>

            <div className="space-y-1.5">
              <label htmlFor="pub-title" className="block text-xs font-semibold text-slate-700">
                {copy.titleLabel}
              </label>
              <input
                id="pub-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pub-caption" className="block text-xs font-semibold text-slate-700">
                {copy.captionLabel}
              </label>
              <textarea
                id="pub-caption"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pub-tags" className="block text-xs font-semibold text-slate-700">
                Hashtags
              </label>
              <input
                id="pub-tags"
                type="text"
                value={hashtagsText}
                onChange={(e) => setHashtagsText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  {copy.scheduleLabel}
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('now')}
                    className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      scheduleMode === 'now'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {copy.scheduleNow}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('later')}
                    className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      scheduleMode === 'later'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {copy.scheduleLater}
                  </button>
                </div>
                {scheduleMode === 'later' && (
                  <input
                    type="datetime-local"
                    aria-label="Scheduled publish date and time"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  {copy.executionModeLabel}
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDispatchMode('stage')}
                    className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      dispatchMode === 'stage'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {copy.stageMode}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchMode('live')}
                    className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      dispatchMode === 'live'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {copy.liveMode}
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>{copy.securityNote}</span>
              </div>
              <button
                type="submit"
                disabled={isPublishing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isPublishing ? copy.publishingBtn : copy.publishBtn}</span>
              </button>
            </div>
          </section>
        </form>

        {/* Right: Live JSON Request Preview */}
        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              {copy.payloadHeading}
            </h2>
            <select
              aria-label="Inspect payload for platform"
              value={previewPlatform}
              onChange={(e) => setPreviewPlatform(e.target.value as SocialPlatform)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="tiktok">TikTok v2</option>
              <option value="instagram">Instagram Graph</option>
              <option value="youtube">YouTube v3</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[420px]">
            <code>{jsonPreview}</code>
          </pre>
        </aside>
      </div>

      {/* API Delivery Queue & Logs Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            {copy.queueHeading}
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {publishLogs.length} requests
          </span>
        </div>

        {publishLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">{copy.emptyQueue}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Platform</th>
                  <th className="py-2.5 px-4 font-semibold">Title</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">HTTP</th>
                  <th className="py-2.5 px-4 font-semibold">Response</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publishLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-medium text-slate-900 uppercase">
                      {entry.platform}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-[200px] truncate">
                      {entry.title}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          entry.status === 'delivered'
                            ? 'text-emerald-700'
                            : entry.status === 'scheduled'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {entry.status === 'delivered' && (
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {entry.status === 'scheduled' && (
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {entry.status === 'failed' && (
                          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span className="capitalize">{entry.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-600">
                      {entry.httpStatus ?? '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-[300px] truncate">
                      {entry.message}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-500">
                      {entry.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
