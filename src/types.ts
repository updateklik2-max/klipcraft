export type Language = 'id' | 'en';

export type WorkspaceTab = 'analyzer' | 'prompts' | 'editor' | 'publish';

export type SlangPersona =
  | 'jaksel-santai'
  | 'tongkrongan-hype'
  | 'storyteller-id'
  | 'genz-creator-en'
  | 'punchy-doc-en';

export type TransitionType =
  | 'zoom-punch'
  | 'whip-pan'
  | 'glitch-cut'
  | 'cross-dissolve'
  | 'slide-up';

export type SubtitleStyle =
  | 'kinetic-bold'
  | 'editorial-clean'
  | 'minimal-bar'
  | 'contrast-box';

export type AspectRatioOption = '9:16' | '16:9' | '1:1';

export type VoiceName = 'Puck' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Charon';

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube' | 'webhook';

export interface SceneBreakdown {
  id: string;
  sceneNumber: number;
  durationSec: number;
  visualSummary: string;
  t2iPrompt: string;
  t2vPrompt: string;
  cameraMotion: string;
  transition: TransitionType;
  imageUrl: string;
}

export interface SubtitleSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  emphasisWord?: string;
}

export interface ViralAnalysisResult {
  id: string;
  title: string;
  sourceLabel: string;
  language: Language;
  slangPersona: SlangPersona;
  hookStrategy: string;
  pacingSummary: string;
  reimaginedScript: string;
  hashtags: string[];
  scenes: SceneBreakdown[];
  subtitles: SubtitleSegment[];
}

export interface VoiceoverAsset {
  audioDataUrl: string;
  mimeType: string;
  voiceName: VoiceName;
  persona: SlangPersona;
  language: Language;
  durationEstimateSec: number;
  generatedAt: string;
}

export interface PlatformConfig {
  platform: SocialPlatform;
  enabled: boolean;
  envConfigured: boolean;
  endpointUrl: string;
  accountHandle: string;
  accessToken: string;
  accountId?: string;
}

export interface PublishLogEntry {
  id: string;
  platform: SocialPlatform;
  title: string;
  status: 'delivered' | 'scheduled' | 'failed';
  httpStatus?: number;
  message: string;
  timestamp: string;
  payloadPreview: string;
}
