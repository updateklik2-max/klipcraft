export interface ExtractedVideoFrames {
  durationSec: number;
  width: number;
  height: number;
  frames: string[]; // data:image/jpeg;base64,...
}

export async function extractKeyframesFromVideoFile(
  file: File,
  maxFrames = 4
): Promise<ExtractedVideoFrames> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Video metadata timeout')), 10000);
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('Unable to decode video file in browser.'));
      };
    });

    const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 12;
    const width = video.videoWidth || 540;
    const height = video.videoHeight || 960;

    // Scale down thumbnails cleanly for fast Gemini multimodal upload & canvas playback
    const maxEdge = 640;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetW = Math.max(180, Math.round(width * scale));
    const targetH = Math.max(180, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable.');
    }

    const frames: string[] = [];
    const sampleCount = Math.min(maxFrames, Math.max(2, Math.floor(durationSec / 2) || maxFrames));

    for (let i = 0; i < sampleCount; i++) {
      const fraction = (i + 0.5) / sampleCount;
      const targetTime = Math.min(Math.max(0.05, durationSec * fraction), Math.max(0.1, durationSec - 0.1));

      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, 1500);
        video.onseeked = () => {
          window.clearTimeout(timer);
          resolve();
        };
        video.currentTime = targetTime;
      });

      ctx.drawImage(video, 0, 0, targetW, targetH);
      frames.push(canvas.toDataURL('image/jpeg', 0.82));
    }

    return { durationSec, width, height, frames };
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  }
}
