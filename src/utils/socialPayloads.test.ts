import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlatformPayload, formatCaptionWithTags } from './socialPayloads';
import { validateWebhookUrl } from '../../server/security';

test('formats captions and deduplicates hashtags cleanly', () => {
  const formatted = formatCaptionWithTags('Wajib coba street food ini!', [
    'kulinerjakarta',
    '#kulinerjakarta',
    'fyp',
  ]);
  assert.equal(formatted, 'Wajib coba street food ini!\n\n#kulinerjakarta #fyp');
});

test('builds valid TikTok, Instagram, YouTube, and Webhook API payloads', () => {
  const tiktok = buildPlatformPayload({
    platform: 'tiktok',
    title: 'Nasi Goreng Api Wajan',
    caption: 'Literally wajib mampir kalau lagi di Jakarta.',
    hashtags: ['streetfood', 'kuliner'],
    aspectRatio: '9:16',
    videoDurationSec: 18,
  });
  assert.match(tiktok.endpointPath, /open\.tiktokapis\.com/);
  assert.equal(typeof tiktok.body.post_info, 'object');

  const yt = buildPlatformPayload({
    platform: 'youtube',
    title: 'Minimalist Desk Setup Tour',
    caption: 'Clean dark desk setup.',
    hashtags: ['#desksetup'],
    aspectRatio: '9:16',
    videoDurationSec: 15,
  });
  assert.match((yt.body.snippet as { title: string }).title, /#Shorts/);
});

test('blocks SSRF private/loopback/non-HTTPS webhook URLs and allows valid HTTPS endpoints', () => {
  assert.equal(validateWebhookUrl('http://localhost:3000/hook').valid, false);
  assert.equal(validateWebhookUrl('https://127.0.0.1/hook').valid, false);
  assert.equal(validateWebhookUrl('https://169.254.169.254/latest').valid, false);
  assert.equal(validateWebhookUrl('https://10.0.0.5/webhook').valid, false);
  assert.equal(validateWebhookUrl('https://hook.make.com/abc123').valid, true);
});
