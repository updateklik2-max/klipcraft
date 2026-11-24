import type { Language, SlangPersona, SubtitleStyle, TransitionType } from './types';

export interface UIStrings {
  nav: {
    analyzer: string;
    prompts: string;
    editor: string;
    publish: string;
    newAnalysis: string;
  };
  toolbar: {
    activeProject: string;
    interfaceLang: string;
    contentLang: string;
  };
  analyzer: {
    heading: string;
    subheading: string;
    uploadLabel: string;
    uploadHint: string;
    framesExtracted: string;
    urlLabel: string;
    urlPlaceholder: string;
    briefLabel: string;
    briefPlaceholder: string;
    slangLabel: string;
    targetPlatformLabel: string;
    analyzeBtn: string;
    analyzingBtn: string;
    presetsHeading: string;
    loadPreset: string;
    emptyBriefError: string;
    noFileOrBriefError: string;
    chooseVideo: string;
    replaceVideo: string;
  };
  prompts: {
    heading: string;
    hookHeading: string;
    pacingHeading: string;
    scriptHeading: string;
    rewriteBtn: string;
    rewritingBtn: string;
    sendToVoiceover: string;
    scenesHeading: string;
    t2iLabel: string;
    t2vLabel: string;
    cameraLabel: string;
    copyPrompt: string;
    copied: string;
    hashtagsLabel: string;
  };
  editor: {
    heading: string;
    voiceoverTitle: string;
    personaLabel: string;
    voiceLabel: string;
    generateVoBtn: string;
    generatingVoBtn: string;
    downloadWav: string;
    canvasTitle: string;
    aspectLabel: string;
    transitionLabel: string;
    subtitleStyleLabel: string;
    playBtn: string;
    pauseBtn: string;
    exportBtn: string;
    exportingBtn: string;
    exportSuccess: string;
    timelineHeading: string;
    subtitlesHeading: string;
    addSubtitle: string;
    syncScript: string;
    sceneDuration: string;
  };
  publish: {
    heading: string;
    subheading: string;
    connectorsHeading: string;
    composerHeading: string;
    titleLabel: string;
    captionLabel: string;
    scheduleLabel: string;
    scheduleNow: string;
    scheduleLater: string;
    executionModeLabel: string;
    stageMode: string;
    liveMode: string;
    securityNote: string;
    publishBtn: string;
    publishingBtn: string;
    testWebhookBtn: string;
    queueHeading: string;
    emptyQueue: string;
    payloadHeading: string;
    envConnected: string;
    sessionTokenPlaceholder: string;
  };
}

export const UI_COPY: Record<Language, UIStrings> = {
  id: {
    nav: {
      analyzer: 'Analisa Video',
      prompts: 'Prompt & Script',
      editor: 'Voiceover & Edit',
      publish: 'Publish API',
      newAnalysis: 'Analisa Baru',
    },
    toolbar: {
      activeProject: 'Proyek Aktif',
      interfaceLang: 'Bahasa UI',
      contentLang: 'Bahasa Konten',
    },
    analyzer: {
      heading: 'Bedah Video Viral Jadi Aset Konten AI',
      subheading:
        'Upload video referensi atau masukkan link dan konsep konten. AI akan mengekstrak hook, prompt Text-to-Image, Text-to-Video, dan script bahasa gaul siap produksi.',
      uploadLabel: 'Upload File Video Viral (MP4, WebM, MOV)',
      uploadHint: 'Frame kunci diekstrak otomatis di browser untuk analisa visual.',
      framesExtracted: 'frame diekstrak',
      urlLabel: 'Link Video Referensi (TikTok, Reels, Shorts)',
      urlPlaceholder: 'https://www.tiktok.com/@kreator/video/...',
      briefLabel: 'Deskripsi Visual, Hook, atau Ide Konten',
      briefPlaceholder:
        'Contoh: Video street food malam hari dengan angle POV wajan panas, transisi cepat pas api menyala, suara ASMR renyah, lalu review jujur...',
      slangLabel: 'Gaya Bahasa & Persona Script',
      targetPlatformLabel: 'Format Target',
      analyzeBtn: 'Analisa & Generate Aset',
      analyzingBtn: 'Menganalisa Video...',
      presetsHeading: 'Template Video Viral Siap Pakai',
      loadPreset: 'Gunakan Template',
      emptyBriefError: 'Masukkan deskripsi video atau upload file video terlebih dahulu.',
      noFileOrBriefError: 'Harap upload video atau isi deskripsi/link video untuk dianalisa.',
      chooseVideo: 'Pilih Video',
      replaceVideo: 'Ganti Video',
    },
    prompts: {
      heading: 'Arsitektur Prompt & Script Viral',
      hookHeading: 'Strategi Hook 3 Detik Pertama',
      pacingHeading: 'Pola Ritme & Retensi',
      scriptHeading: 'Script Voiceover (Bisa Diedit)',
      rewriteBtn: 'Tulis Ulang Gaya Gaul',
      rewritingBtn: 'Menulis Ulang...',
      sendToVoiceover: 'Lanjut ke Voiceover & Edit',
      scenesHeading: 'Breakdown Scene: Prompt T2I & T2V',
      t2iLabel: 'Prompt Text-to-Image',
      t2vLabel: 'Prompt Text-to-Video',
      cameraLabel: 'Gerakan Kamera',
      copyPrompt: 'Salin',
      copied: 'Tersalin',
      hashtagsLabel: 'Rekomendasi Hashtag',
    },
    editor: {
      heading: 'Studio Voiceover Gaul & Auto-Edit Video',
      voiceoverTitle: 'Generator Voiceover AI',
      personaLabel: 'Gaya Bahasa Gaul',
      voiceLabel: 'Karakter Suara',
      generateVoBtn: 'Buat Voiceover AI',
      generatingVoBtn: 'Memproses Suara...',
      downloadWav: 'Unduh WAV',
      canvasTitle: 'Pratinjau Auto-Edit & Subtitle Estetik',
      aspectLabel: 'Rasio Layar',
      transitionLabel: 'Transisi Dinamis',
      subtitleStyleLabel: 'Gaya Subtitle',
      playBtn: 'Putar Preview',
      pauseBtn: 'Jeda',
      exportBtn: 'Export Video (.webm)',
      exportingBtn: 'Merender Video...',
      exportSuccess: 'Video WebM berhasil diexport.',
      timelineHeading: 'Timeline Scene & Transisi',
      subtitlesHeading: 'Editor Subtitle Sinkron',
      addSubtitle: 'Tambah Baris',
      syncScript: 'Sinkron dari Script',
      sceneDuration: 'Durasi (detik)',
    },
    publish: {
      heading: 'Integrasi API Publikasi Media Sosial',
      subheading:
        'Konfigurasikan kredensial API platform atau webhook otomatis (n8n / Make) untuk mempublikasikan metadata, script, dan video hasil render secara langsung.',
      connectorsHeading: 'Koneksi Platform API',
      composerHeading: 'Payload Publikasi Konten',
      titleLabel: 'Judul Video / Konten',
      captionLabel: 'Caption & Hashtags',
      scheduleLabel: 'Waktu Publikasi',
      scheduleNow: 'Publish Sekarang',
      scheduleLater: 'Jadwalkan',
      executionModeLabel: 'Mode Eksekusi API',
      stageMode: 'Validasi & Antrekan',
      liveMode: 'Kirim HTTP Langsung',
      securityNote: 'Token hanya disimpan di memori sesi atau env server',
      publishBtn: 'Kirim ke Platform Terpilih',
      publishingBtn: 'Mengirim via API...',
      testWebhookBtn: 'Tes Koneksi',
      queueHeading: 'Antrean & Log Pengiriman API',
      emptyQueue: 'Belum ada pengiriman API. Pilih platform dan klik Kirim untuk memulai.',
      payloadHeading: 'Pratinjau JSON Request',
      envConnected: 'Terhubung via Server Env',
      sessionTokenPlaceholder: 'Masukkan Bearer Access Token sesi (opsional)...',
    },
  },
  en: {
    nav: {
      analyzer: 'Video Analyzer',
      prompts: 'Prompts & Script',
      editor: 'Voiceover & Edit',
      publish: 'Publish API',
      newAnalysis: 'New Analysis',
    },
    toolbar: {
      activeProject: 'Active Project',
      interfaceLang: 'UI Language',
      contentLang: 'Content Language',
    },
    analyzer: {
      heading: 'Deconstruct Viral Videos Into AI Production Assets',
      subheading:
        'Upload a reference video or paste a link and concept brief. AI extracts the retention hook, Text-to-Image prompts, Text-to-Video motion prompts, and an engaging creator script.',
      uploadLabel: 'Upload Viral Video File (MP4, WebM, MOV)',
      uploadHint: 'Keyframes are sampled locally in-browser for multimodal visual analysis.',
      framesExtracted: 'frames extracted',
      urlLabel: 'Reference Video URL (TikTok, Reels, Shorts)',
      urlPlaceholder: 'https://www.tiktok.com/@creator/video/...',
      briefLabel: 'Visual Breakdown, Hook Idea, or Concept Brief',
      briefPlaceholder:
        'Example: Late-night street food POV shot above a blazing wok, fast whip-pan cuts on flame bursts, crisp ASMR sizzle, followed by an honest tasting reaction...',
      slangLabel: 'Script Voice & Slang Persona',
      targetPlatformLabel: 'Target Format',
      analyzeBtn: 'Analyze & Generate Assets',
      analyzingBtn: 'Analyzing Video...',
      presetsHeading: 'Ready-to-Remix Viral Presets',
      loadPreset: 'Load Preset',
      emptyBriefError: 'Please upload a video file or enter a visual brief first.',
      noFileOrBriefError: 'Please upload a video or enter a concept brief/URL to analyze.',
      chooseVideo: 'Choose Video',
      replaceVideo: 'Replace Video',
    },
    prompts: {
      heading: 'Prompt Architecture & Viral Script',
      hookHeading: 'First 3-Second Hook Strategy',
      pacingHeading: 'Pacing & Retention Arc',
      scriptHeading: 'Voiceover Script (Editable)',
      rewriteBtn: 'Rewrite Slang Style',
      rewritingBtn: 'Rewriting...',
      sendToVoiceover: 'Send to Voiceover & Editor',
      scenesHeading: 'Scene Breakdown: T2I & T2V Prompts',
      t2iLabel: 'Text-to-Image Prompt',
      t2vLabel: 'Text-to-Video Prompt',
      cameraLabel: 'Camera Motion',
      copyPrompt: 'Copy',
      copied: 'Copied',
      hashtagsLabel: 'Recommended Hashtags',
    },
    editor: {
      heading: 'Slang Voiceover Studio & Auto-Edit Composer',
      voiceoverTitle: 'AI Voiceover Generator',
      personaLabel: 'Slang Persona',
      voiceLabel: 'Voice Talent',
      generateVoBtn: 'Generate AI Voiceover',
      generatingVoBtn: 'Synthesizing Audio...',
      downloadWav: 'Download WAV',
      canvasTitle: 'Auto-Edit Preview & Aesthetic Subtitles',
      aspectLabel: 'Aspect Ratio',
      transitionLabel: 'Dynamic Transition',
      subtitleStyleLabel: 'Subtitle Aesthetic',
      playBtn: 'Play Preview',
      pauseBtn: 'Pause',
      exportBtn: 'Export Video (.webm)',
      exportingBtn: 'Rendering Video...',
      exportSuccess: 'WebM video exported successfully.',
      timelineHeading: 'Scene & Transition Timeline',
      subtitlesHeading: 'Synced Subtitle Editor',
      addSubtitle: 'Add Line',
      syncScript: 'Sync from Script',
      sceneDuration: 'Duration (sec)',
    },
    publish: {
      heading: 'Social Media API Publishing Integration',
      subheading:
        'Configure direct platform API credentials or automation webhooks (n8n / Make) to publish video metadata, scripts, and rendered outputs directly.',
      connectorsHeading: 'Platform API Connectors',
      composerHeading: 'Publish Payload Composer',
      titleLabel: 'Video / Post Title',
      captionLabel: 'Caption & Hashtags',
      scheduleLabel: 'Publish Timing',
      scheduleNow: 'Publish Now',
      scheduleLater: 'Schedule',
      executionModeLabel: 'API Execution Mode',
      stageMode: 'Validate & Stage',
      liveMode: 'Live HTTP Dispatch',
      securityNote: 'Tokens stay in session memory or server env',
      publishBtn: 'Publish to Selected Platforms',
      publishingBtn: 'Dispatching API...',
      testWebhookBtn: 'Test Connection',
      queueHeading: 'API Delivery Queue & Logs',
      emptyQueue: 'No API dispatches yet. Select a platform and click Publish to begin.',
      payloadHeading: 'Live JSON Request Preview',
      envConnected: 'Connected via Server Env',
      sessionTokenPlaceholder: 'Enter session Bearer Access Token (optional)...',
    },
  },
};

export const PERSONA_LABELS: Record<SlangPersona, { id: string; en: string; stylePrompt: string }> = {
  'jaksel-santai': {
    id: 'Jaksel Santai (Mix ID-EN)',
    en: 'Jakarta Casual (Mix ID-EN)',
    stylePrompt:
      'Conversational South Jakarta creator tone, upbeat, natural Indonesian slang mixed smoothly with casual English words like literally, honestly, vibes, game-changer, crisp pacing.',
  },
  'tongkrongan-hype': {
    id: 'Anak Tongkrongan Hype (ID)',
    en: 'Energetic Street Slang (ID)',
    stylePrompt:
      'High-energy Indonesian creator voice, punchy, expressive, relatable slang like gokil, parah sih, asli nagih, wajib coba, fast hook delivery.',
  },
  'storyteller-id': {
    id: 'Storyteller Sinematik (ID)',
    en: 'Cinematic Storyteller (ID)',
    stylePrompt:
      'Warm, intriguing Indonesian documentary narrator, clear articulation, measured pauses before reveals, modern conversational Indonesian.',
  },
  'genz-creator-en': {
    id: 'Gen-Z Creator Slang (EN)',
    en: 'Gen-Z Creator Slang (EN)',
    stylePrompt:
      'Fast-paced modern US/global short-form creator voice, punchy hook, expressive cadence, natural conversational slang like lowkey, unreal, no gatekeeping, trust me.',
  },
  'punchy-doc-en': {
    id: 'Punchy Micro-Doc (EN)',
    en: 'Punchy Micro-Doc (EN)',
    stylePrompt:
      'Crisp, authoritative short-form explainer voice, tight pacing, dramatic emphasis on contrast and numbers.',
  },
};

export const TRANSITION_LABELS: Record<TransitionType, { id: string; en: string }> = {
  'zoom-punch': { id: 'Zoom Punch', en: 'Zoom Punch' },
  'whip-pan': { id: 'Whip Pan', en: 'Whip Pan' },
  'glitch-cut': { id: 'Glitch Cut', en: 'Glitch Cut' },
  'cross-dissolve': { id: 'Cross Dissolve', en: 'Cross Dissolve' },
  'slide-up': { id: 'Slide Up', en: 'Slide Up' },
};

export const SUBTITLE_STYLE_LABELS: Record<SubtitleStyle, { id: string; en: string }> = {
  'kinetic-bold': { id: 'Kinetic Pop (Kata Aktif)', en: 'Kinetic Pop (Active Word)' },
  'editorial-clean': { id: 'Editorial Clean', en: 'Editorial Clean' },
  'minimal-bar': { id: 'Minimal Scrim Bar', en: 'Minimal Scrim Bar' },
  'contrast-box': { id: 'Blok Kontras Tinggi', en: 'High-Contrast Block' },
};
