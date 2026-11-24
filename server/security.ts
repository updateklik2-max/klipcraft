const PRIVATE_IPV4_PATTERNS = [
  /^127\./,
  /^10\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
]);

export function validateWebhookUrl(rawUrl: string): { valid: true; url: URL } | { valid: false; reason: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, reason: 'Webhook URL is required.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Invalid URL syntax.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTPS webhook endpoints are permitted.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    PRIVATE_IPV4_PATTERNS.some((re) => re.test(host))
  ) {
    return { valid: false, reason: 'Private, loopback, and internal network hosts are blocked.' };
  }

  return { valid: true, url: parsed };
}

export function sanitizeText(value: unknown, maxLength = 4000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}
