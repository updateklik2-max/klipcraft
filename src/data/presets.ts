import type { Language, ViralAnalysisResult } from '../types';

export interface ViralPreset {
  id: string;
  label: { id: string; en: string };
  category: { id: string; en: string };
  durationLabel: string;
  referenceUrl: string;
  brief: { id: string; en: string };
  analysis: Record<Language, ViralAnalysisResult>;
}

const IMG_STREET_FOOD = '/src/assets/images/scene_street_food_1795502590753.jpg';
const IMG_COFFEE = '/src/assets/images/scene_coffee_pour_1795502591694.jpg';
const IMG_DESK = '/src/assets/images/scene_desk_setup_1795502590745.jpg';
const IMG_STUDIO = '/src/assets/images/scene_creator_studio_1795502591798.jpg';

export const VIRAL_PRESETS: ViralPreset[] = [
  {
    id: 'street-food-pov',
    label: {
      id: 'Kuliner Malam POV & ASMR Wajan',
      en: 'Night Market Wok POV & ASMR',
    },
    category: { id: 'Kuliner & F&B', en: 'Food & Lifestyle' },
    durationLabel: '00:16',
    referenceUrl: 'https://www.tiktok.com/@kuliner.jkt/video/7481029384',
    brief: {
      id: 'Video kuliner malam POV jarak dekat saat api wajan menyala, potong cepat ke tuangan es kopi matcha, ditutup review jujur gaya Jaksel.',
      en: 'Close-up POV night market wok flame opener, fast whip-pan cut into an iced matcha espresso pour, closed with an honest creator review.',
    },
    analysis: {
      id: {
        id: 'preset-food-id',
        title: 'Nasi Goreng Wok Hay & Matcha Malam',
        sourceLabel: 'Template · Kuliner Malam 9:16',
        language: 'id',
        slangPersona: 'jaksel-santai',
        hookStrategy:
          'Buka langsung dengan visual api wajan menyambar di detik 0.0-1.5 tanpa intro salam, lalu kasih klaim kontras harga vs rasa.',
        pacingSummary:
          'Cut setiap 3.5-4.5 detik dengan kombinasi Zoom Punch dan Whip Pan agar retensi penonton bertahan di atas 75%.',
        reimaginedScript:
          'Jujurly, ini hidden gem malam paling gokil yang gue temuin minggu ini. Bayangin lima belas ribu udah dapet aroma wok hay se-smoky ini, asli bukan kaleng-kaleng. Habis yang gurih, kita balance pake iced matcha espresso di seberangnya biar vibes-nya dapet banget.',
        hashtags: ['#kulinerjakarta', '#streetfood', '#hiddengem', '#foodieindonesia', '#fyp'],
        scenes: [
          {
            id: 'food-id-1',
            sceneNumber: 1,
            durationSec: 4,
            visualSummary: 'Shot POV jarak dekat api wajan menyala di warung tenda malam hari.',
            t2iPrompt:
              'Editorial vertical 9:16 documentary photo of Indonesian night market street food stall, blazing wok flame, rising aromatic steam, warm tungsten bulbs, shallow depth of field, Leica 35mm film aesthetic',
            t2vPrompt:
              'Rapid low-angle push-in toward sizzling wok as orange flames erupt, subtle handheld micro-shake, billowing smoke in warm tungsten light, 60fps crisp motion',
            cameraMotion: 'Fast Push-In + Handheld',
            transition: 'zoom-punch',
            imageUrl: IMG_STREET_FOOD,
          },
          {
            id: 'food-id-2',
            sceneNumber: 2,
            durationSec: 4,
            visualSummary: 'Transisi whip-pan ke gelas fluted berisi es matcha dan tuangan espresso.',
            t2iPrompt:
              'Close-up vertical 9:16 editorial food photo of artisan iced matcha espresso pour in fluted glass on brushed travertine stone, morning window shadows, condensation droplets',
            t2vPrompt:
              'Slow-motion macro pour of dark espresso cascading into vibrant green iced matcha milk swirls, crisp condensation droplets catching side sunlight',
            cameraMotion: 'Macro Slow-Motion Tilt',
            transition: 'whip-pan',
            imageUrl: IMG_COFFEE,
          },
          {
            id: 'food-id-3',
            sceneNumber: 3,
            durationSec: 4,
            visualSummary: 'Kreator merapikan kamera gimbal di studio untuk segmen verdict jujur.',
            t2iPrompt:
              'Vertical 9:16 behind-the-scenes portrait of content creator holding cinema camera on gimbal inside modern acoustic wood studio, softbox key light, crisp natural grading',
            t2vPrompt:
              'Smooth gimbal arc around content creator adjusting lens focus in warm wood-slat studio, soft key light glow, documentary sharpness',
            cameraMotion: 'Smooth Gimbal Orbit',
            transition: 'cross-dissolve',
            imageUrl: IMG_STUDIO,
          },
          {
            id: 'food-id-4',
            sceneNumber: 4,
            durationSec: 4,
            visualSummary: 'Closing frame setup meja editing untuk riset spot kuliner berikutnya.',
            t2iPrompt:
              'Minimalist architectural workspace desk setup at dusk, warm desk lamp over mechanical keyboard and dual monitors, concrete texture, vertical 9:16 editorial composition',
            t2vPrompt:
              'Slow pull-back from glowing dual monitors displaying timeline waveforms and architectural desk lamp in moody dusk lighting',
            cameraMotion: 'Slow Pull-Back',
            transition: 'slide-up',
            imageUrl: IMG_DESK,
          },
        ],
        subtitles: [
          { id: 'f-id-1', startSec: 0, endSec: 3.8, text: 'Jujurly ini hidden gem malam paling gokil!' },
          { id: 'f-id-2', startSec: 3.8, endSec: 7.8, text: 'Lima belas ribu dapet aroma wok hay se-smoky ini.' },
          { id: 'f-id-3', startSec: 7.8, endSec: 12.0, text: 'Lanjut balance pake iced matcha espresso biar makin pas.' },
          { id: 'f-id-4', startSec: 12.0, endSec: 16.0, text: 'Save dulu biar weekend ini gak bingung mau kemana.' },
        ],
      },
      en: {
        id: 'preset-food-en',
        title: 'Midnight Wok Hay & Iced Matcha Contrast',
        sourceLabel: 'Template · Night Food 9:16',
        language: 'en',
        slangPersona: 'genz-creator-en',
        hookStrategy:
          'Open immediately on the blazing wok flame in the first 1.5 seconds with zero greeting, pairing a bold price contrast right over the peak action.',
        pacingSummary:
          'Cut every 4 seconds using Zoom Punch and Whip Pan transitions to lock short-form retention above 75%.',
        reimaginedScript:
          'No gatekeeping, this late-night street wok spot is genuinely unreal for under two dollars. That smoky char hits different in person. And right across the street, we wash it down with an iced matcha espresso pour that feels like a ten-dollar cafe.',
        hashtags: ['#streetfood', '#nightmarket', '#matchalover', '#foodreels', '#creatorworkflow'],
        scenes: [
          {
            id: 'food-en-1',
            sceneNumber: 1,
            durationSec: 4,
            visualSummary: 'Close-up POV of blazing wok flames at a bustling night market stall.',
            t2iPrompt:
              'Editorial vertical 9:16 documentary photo of Indonesian night market street food stall, blazing wok flame, rising aromatic steam, warm tungsten bulbs, shallow depth of field',
            t2vPrompt:
              'Rapid low-angle push-in toward sizzling wok as orange flames erupt, subtle handheld micro-shake, billowing smoke in warm tungsten light',
            cameraMotion: 'Fast Push-In + Handheld',
            transition: 'zoom-punch',
            imageUrl: IMG_STREET_FOOD,
          },
          {
            id: 'food-en-2',
            sceneNumber: 2,
            durationSec: 4,
            visualSummary: 'Whip-pan cut into fluted glass iced matcha espresso pour.',
            t2iPrompt:
              'Close-up vertical 9:16 editorial food photo of artisan iced matcha espresso pour in fluted glass on brushed travertine stone, morning window shadows',
            t2vPrompt:
              'Slow-motion macro pour of dark espresso cascading into vibrant green iced matcha swirls with sunlit condensation droplets',
            cameraMotion: 'Macro Slow-Motion Tilt',
            transition: 'whip-pan',
            imageUrl: IMG_COFFEE,
          },
          {
            id: 'food-en-3',
            sceneNumber: 3,
            durationSec: 4,
            visualSummary: 'Behind-the-scenes creator gimbal shot for honest verdict.',
            t2iPrompt:
              'Vertical 9:16 behind-the-scenes portrait of content creator holding cinema camera on gimbal inside modern acoustic wood studio, softbox key light',
            t2vPrompt:
              'Smooth gimbal arc around content creator dialing focus in warm wood-slat studio, crisp softbox lighting',
            cameraMotion: 'Smooth Gimbal Orbit',
            transition: 'cross-dissolve',
            imageUrl: IMG_STUDIO,
          },
          {
            id: 'food-en-4',
            sceneNumber: 4,
            durationSec: 4,
            visualSummary: 'Closing moody desk edit scene showing workflow.',
            t2iPrompt:
              'Minimalist architectural workspace desk setup at dusk, warm desk lamp over mechanical keyboard and dual monitors, concrete texture, vertical 9:16',
            t2vPrompt:
              'Slow pull-back from glowing dual monitors displaying editing timeline in dusk architectural room',
            cameraMotion: 'Slow Pull-Back',
            transition: 'slide-up',
            imageUrl: IMG_DESK,
          },
        ],
        subtitles: [
          { id: 'f-en-1', startSec: 0, endSec: 3.8, text: 'No gatekeeping, this midnight wok spot is unreal.' },
          { id: 'f-en-2', startSec: 3.8, endSec: 7.8, text: 'That smoky char for under two bucks hits different.' },
          { id: 'f-en-3', startSec: 7.8, endSec: 12.0, text: 'Wash it down with this iced matcha espresso pour.' },
          { id: 'f-en-4', startSec: 12.0, endSec: 16.0, text: 'Save this route before your next weekend run.' },
        ],
      },
    },
  },
  {
    id: 'creator-desk-workflow',
    label: {
      id: 'Setup Meja Kerja & Workflow Konten AI',
      en: 'Minimalist Desk Setup & Creator Gear',
    },
    category: { id: 'Teknologi & Kreatif', en: 'Tech & Productivity' },
    durationLabel: '00:15',
    referenceUrl: 'https://www.youtube.com/shorts/dQw9SetupTour',
    brief: {
      id: 'Tour setup meja kerja arsitektural saat senja, lampu meja hangat, lanjut ke proses syuting kamera gimbal di studio dan kopi pagi.',
      en: 'Architectural dusk desk tour with warm task lighting, cutting to gimbal studio filming and morning iced coffee ritual.',
    },
    analysis: {
      id: {
        id: 'preset-desk-id',
        title: 'Setup Meja Arsitektural & Ritme Kreator',
        sourceLabel: 'Template · Tech & Gear 9:16',
        language: 'id',
        slangPersona: 'tongkrongan-hype',
        hookStrategy:
          'Mulai dari kontras pencahayaan senja yang tenang lalu pecah dengan transisi Glitch Cut ke gear kamera biar audiens langsung penasaran.',
        pacingSummary:
          'Ritme 3.5 detik per klip dengan transisi Glitch Cut dan Slide Up untuk menjaga tempo konten edukasi gear.',
        reimaginedScript:
          'Asli sih, setup meja yang rapi itu langsung naikin mood bikin konten dua kali lipat. Kuncinya gak perlu rame RGB, cukup lampu meja hangat dan keyboard mekanikal yang clean. Pas udah dapet idenya, tinggal angkat gimbal, seduh es kopi, langsung eksekusi!',
        hashtags: ['#desksetup', '#setupminimalis', '#contentcreator', '#produktif', '#geartour'],
        scenes: [
          {
            id: 'desk-id-1',
            sceneNumber: 1,
            durationSec: 4,
            visualSummary: 'Wide shot meja kerja beton minimalis dengan lampu meja hangat di waktu senja.',
            t2iPrompt:
              'Minimalist architectural workspace desk setup at dusk, warm architectural desk lamp illuminating anodized aluminum mechanical keyboard, dual monitors, concrete wall, 9:16',
            t2vPrompt:
              'Gentle dolly push-in across matte desk mat toward mechanical keyboard bathed in warm brass lamp light while blue dusk glows outside',
            cameraMotion: 'Gentle Dolly Push-In',
            transition: 'glitch-cut',
            imageUrl: IMG_DESK,
          },
          {
            id: 'desk-id-2',
            sceneNumber: 2,
            durationSec: 4,
            visualSummary: 'Kreator mengoperasikan kamera cinema di atas gimbal dengan lighting softbox.',
            t2iPrompt:
              'Behind-the-scenes vertical portrait of content creator studio with cinema camera on gimbal, softbox key light, acoustic wood slat wall, crisp editorial look',
            t2vPrompt:
              'Dynamic lateral tracking shot following creator balancing cinema gimbal rig in front of acoustic wood panels',
            cameraMotion: 'Lateral Tracking',
            transition: 'zoom-punch',
            imageUrl: IMG_STUDIO,
          },
          {
            id: 'desk-id-3',
            sceneNumber: 3,
            durationSec: 4,
            visualSummary: 'Ritual kopi matcha espresso di meja batu travertine sebelum sesi edit.',
            t2iPrompt:
              'Close-up vertical editorial food photography of artisan iced matcha espresso pour in fluted glass tumbler on brushed travertine counter, dramatic window shadows',
            t2vPrompt:
              'Crisp overhead-to-eye-level tilt as espresso ribbons swirl into chilled matcha milk on sunlit stone counter',
            cameraMotion: 'Tilt Reveal',
            transition: 'cross-dissolve',
            imageUrl: IMG_COFFEE,
          },
        ],
        subtitles: [
          { id: 'd-id-1', startSec: 0, endSec: 4.0, text: 'Setup meja rapi itu auto naikin mood bikin konten.' },
          { id: 'd-id-2', startSec: 4.0, endSec: 8.0, text: 'Gak perlu rame RGB, cukup lampu hangat dan gear clean.' },
          { id: 'd-id-3', startSec: 8.0, endSec: 12.0, text: 'Seduh es kopi, angkat gimbal, langsung gas eksekusi!' },
        ],
      },
      en: {
        id: 'preset-desk-en',
        title: 'Architectural Desk & Creator Gear Flow',
        sourceLabel: 'Template · Tech & Gear 9:16',
        language: 'en',
        slangPersona: 'punchy-doc-en',
        hookStrategy:
          'Lead with moody architectural dusk lighting and snap into a Glitch Cut to the gimbal rig so tech viewers stick around for the breakdown.',
        pacingSummary:
          'Tight 4-second beat structure pairing Glitch Cut and Zoom Punch transitions with clear visual contrast.',
        reimaginedScript:
          'Here is why clean desk geometry beats flashing neon every single time. One warm brass task lamp over raw concrete instantly locks in focus. Pair it with a lightweight gimbal rig and your morning matcha ritual, and shooting daily feels effortless.',
        hashtags: ['#desksetup', '#minimalisttech', '#creatorgear', '#filmmaking', '#workspace'],
        scenes: [
          {
            id: 'desk-en-1',
            sceneNumber: 1,
            durationSec: 4,
            visualSummary: 'Architectural concrete workspace bathed in warm desk lamp light at dusk.',
            t2iPrompt:
              'Minimalist architectural workspace desk setup at dusk, warm architectural desk lamp illuminating anodized aluminum mechanical keyboard, dual monitors, concrete wall, 9:16',
            t2vPrompt:
              'Gentle dolly push-in across matte desk mat toward mechanical keyboard bathed in warm brass lamp light',
            cameraMotion: 'Gentle Dolly Push-In',
            transition: 'glitch-cut',
            imageUrl: IMG_DESK,
          },
          {
            id: 'desk-en-2',
            sceneNumber: 2,
            durationSec: 4,
            visualSummary: 'Creator balancing cinema camera on gimbal inside wood-slat studio.',
            t2iPrompt:
              'Behind-the-scenes vertical portrait of content creator studio with cinema camera on gimbal, softbox key light, acoustic wood slat wall',
            t2vPrompt:
              'Dynamic lateral tracking shot following creator balancing cinema gimbal rig in front of acoustic wood panels',
            cameraMotion: 'Lateral Tracking',
            transition: 'zoom-punch',
            imageUrl: IMG_STUDIO,
          },
          {
            id: 'desk-en-3',
            sceneNumber: 3,
            durationSec: 4,
            visualSummary: 'Iced matcha espresso pour on sunlit travertine counter.',
            t2iPrompt:
              'Close-up vertical editorial food photography of artisan iced matcha espresso pour in fluted glass tumbler on brushed travertine counter',
            t2vPrompt:
              'Crisp tilt as espresso ribbons swirl into chilled matcha milk on sunlit stone counter',
            cameraMotion: 'Tilt Reveal',
            transition: 'cross-dissolve',
            imageUrl: IMG_COFFEE,
          },
        ],
        subtitles: [
          { id: 'd-en-1', startSec: 0, endSec: 4.0, text: 'Clean desk geometry beats flashing neon every time.' },
          { id: 'd-en-2', startSec: 4.0, endSec: 8.0, text: 'Pair one warm task lamp with a lightweight gimbal rig.' },
          { id: 'd-en-3', startSec: 8.0, endSec: 12.0, text: 'Morning matcha poured, and daily shooting feels effortless.' },
        ],
      },
    },
  },
];
