import type { AspectRatioOption, SocialPlatform, ViralAnalysisResult } from '../types';

export interface SocialPublishInput {
  platform: SocialPlatform;
  title: string;
  caption: string;
  hashtags: string[];
  aspectRatio: AspectRatioOption;
  scheduledAt?: string;
  accountHandle?: string;
  accountId?: string;
  videoDurationSec: number;
}

export function formatCaptionWithTags(caption: string, hashtags: string[]): string {
  const cleanCaption = caption.trim();
  const normalizedTags = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`));

  const uniqueTags = Array.from(new Set(normalizedTags));
  if (uniqueTags.length === 0) return cleanCaption;
  return cleanCaption ? `${cleanCaption}\n\n${uniqueTags.join(' ')}` : uniqueTags.join(' ');
}

export function buildPlatformPayload(input: SocialPublishInput): {
  endpointPath: string;
  method: 'POST';
  body: Record<string, unknown>;
} {
  const fullCaption = formatCaptionWithTags(input.caption, input.hashtags);

  switch (input.platform) {
    case 'tiktok':
      return {
        endpointPath: 'https://open.tiktokapis.com/v2/post/publish/video/init/',
        method: 'POST',
        body: {
          post_info: {
            title: fullCaption.slice(0, 2200),
            privacy_level: 'SELF_ONLY',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: Math.round(input.videoDurationSec * 520000),
            chunk_size: Math.round(input.videoDurationSec * 520000),
            total_chunk_count: 1,
          },
        },
      };

    case 'instagram':
      return {
        endpointPath: `https://graph.facebook.com/v21.0/${input.accountId || '{ig_user_id}'}/media`,
        method: 'POST',
        body: {
          media_type: 'REELS',
          caption: fullCaption.slice(0, 2200),
          share_to_feed: true,
        },
      };

    case 'youtube':
      return {
        endpointPath: 'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
        method: 'POST',
        body: {
          snippet: {
            title: `${input.title.slice(0, 88)} #Shorts`,
            description: fullCaption,
            tags: input.hashtags.map((t) => t.replace(/^#/, '')).slice(0, 15),
            categoryId: '22',
          },
          status: {
            privacyStatus: input.scheduledAt ? 'private' : 'public',
            publishAt: input.scheduledAt || undefined,
            selfDeclaredMadeForKids: false,
          },
        },
      };

    case 'webhook':
    default:
      return {
        endpointPath: '{custom_webhook_url}',
        method: 'POST',
        body: {
          event: 'klipcraft.content.publish',
          title: input.title,
          caption: fullCaption,
          aspectRatio: input.aspectRatio,
          durationSec: input.videoDurationSec,
          scheduledAt: input.scheduledAt || null,
          accountHandle: input.accountHandle || null,
          dispatchedAt: new Date().toISOString(),
        },
      };
  }
}

export function buildDefaultPublishCaption(analysis: ViralAnalysisResult): string {
  const hookLine = analysis.reimaginedScript.split(/[.!?]/)[0]?.trim() || analysis.title;
  return `${hookLine}. ${analysis.hookStrategy}`;
}
