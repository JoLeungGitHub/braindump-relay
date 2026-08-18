// Relay for the Pebble Brain Dump app's Custom Webhook feature.
// Brain Dump POSTs { text, timestamp }; this reshapes it into a Discord embed.

import { landingPageCss, renderLandingPage } from './landing.js';

const MAX_DESCRIPTION_LENGTH = 4096;
const DELIVERY_STATE_KEY = 'delivery';
const DELIVERY_STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_AVATAR_URL =
  'https://raw.githubusercontent.com/adrienthiery/pebble-brain-dump-app/main/icon_144x144.png';

function splitNote(value) {
  const note = value === undefined || value === null ? '' : String(value);
  if (!note.trim()) {
    return ['*Empty note*'];
  }

  if (note.length <= MAX_DESCRIPTION_LENGTH) {
    return [note];
  }

  const chunks = [];
  let start = 0;

  while (start < note.length) {
    let end = Math.min(start + MAX_DESCRIPTION_LENGTH, note.length);

    // Avoid cutting a Unicode surrogate pair (such as an emoji) in half.
    if (
      end < note.length
      && note.charCodeAt(end - 1) >= 0xd800
      && note.charCodeAt(end - 1) <= 0xdbff
      && note.charCodeAt(end) >= 0xdc00
      && note.charCodeAt(end) <= 0xdfff
    ) {
      end -= 1;
    }

    chunks.push(note.slice(start, end));
    start = end;
  }

  return chunks;
}

function formatTimestamp(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  // Brain Dump sends Unix seconds. Also accept milliseconds for easier testing
  // and compatibility with other clients that may post to the relay.
  const milliseconds = Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function parseColor(value) {
  if (typeof value !== 'string') {
    return 0xff9900;
  }

  const normalized = value.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(normalized)
    ? Number.parseInt(normalized, 16)
    : 0xff9900;
}

export function buildDiscordWebhookUrl(value) {
  const url = new URL(value);

  // URLSearchParams is case-sensitive, but Discord's parameter name is not
  // useful in duplicate variants. Remove any existing spelling before forcing
  // confirmed delivery.
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase() === 'wait') {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.set('wait', 'true');
  return url.toString();
}

export function createDiscordPayloads(body, env = {}) {
  const chunks = splitNote(body?.text);
  const timestamp = formatTimestamp(body?.timestamp);

  return chunks.map((description, index) => {
    const embed = {
      description,
      color: parseColor(env.DISCORD_EMBED_COLOR),
    };

    if (chunks.length > 1) {
      embed.footer = { text: `Part ${index + 1} of ${chunks.length}` };
    }

    if (timestamp) {
      embed.timestamp = timestamp;
    }

    return {
      username: env.DISCORD_USERNAME || 'Brain Dump',
      avatar_url: env.DISCORD_AVATAR_URL || DEFAULT_AVATAR_URL,
      embeds: [embed],
      // Notes are user-authored text; never let one unexpectedly ping somebody.
      allowed_mentions: { parse: [] },
    };
  });
}

export async function createMultipartDeliveryKey(value) {
  const note = value === undefined || value === null ? '' : String(value);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(note));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function getDiscordRetryDelayMs(response) {
  let retryAfter = null;

  try {
    const body = await response.clone().json();
    if (body.retry_after !== undefined) {
      retryAfter = Number(body.retry_after);
    }
  } catch {
    // Discord also provides Retry-After, so a non-JSON body is still usable.
  }

  if (!(retryAfter >= 0)) {
    retryAfter = Number(response.headers.get('Retry-After'));
  }
  if (!(retryAfter >= 0)) {
    retryAfter = 1;
  }

  return Math.ceil(retryAfter * 1000);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function sendDiscordPayload(
  webhookUrl,
  payload,
  { fetchImpl = fetch, sleepImpl = sleep } = {},
) {
  for (let attempt = 0; attempt <= 1; attempt += 1) {
    const response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status !== 429 || attempt === 1) {
      return response;
    }

    await sleepImpl(await getDiscordRetryDelayMs(response));
  }

  throw new Error('unreachable');
}

async function discordErrorResponse(response) {
  const errText = await response.text();
  return {
    status: 502,
    body: `discord error ${response.status}: ${errText}`,
  };
}

// Multipart progress must survive a separate upstream retry. One Durable Object
// is selected per note text and stores only an incomplete delivery. A retry with
// the same text resumes at the first part Discord has not confirmed.
export class MultipartDelivery {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.inFlight = null;
  }

  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('multipart delivery: POST only', { status: 405 });
    }

    let incoming;
    try {
      incoming = await request.json();
    } catch {
      return new Response('bad multipart delivery', { status: 400 });
    }

    if (!Array.isArray(incoming.payloads) || incoming.payloads.length < 2) {
      return new Response('bad multipart delivery', { status: 400 });
    }

    // Concurrent retries for the same note share one delivery attempt.
    if (!this.inFlight) {
      this.inFlight = this.deliver(incoming)
        .finally(() => { this.inFlight = null; });
    }

    const result = await this.inFlight;
    return new Response(result.body, { status: result.status });
  }

  async deliver(incoming) {
    let delivery = await this.state.storage.get(DELIVERY_STATE_KEY);
    const now = Date.now();

    if (!delivery || delivery.expiresAt <= now) {
      delivery = {
        payloads: incoming.payloads,
        nextPart: 0,
        expiresAt: now + DELIVERY_STATE_TTL_MS,
      };
      await this.state.storage.put(DELIVERY_STATE_KEY, delivery);
      if (this.state.storage.setAlarm) {
        await this.state.storage.setAlarm(delivery.expiresAt);
      }
    }

    const webhookUrl = buildDiscordWebhookUrl(this.env.DISCORD_WEBHOOK_URL);
    while (delivery.nextPart < delivery.payloads.length) {
      let response;
      try {
        response = await sendDiscordPayload(
          webhookUrl,
          delivery.payloads[delivery.nextPart],
        );
      } catch (error) {
        return { status: 502, body: `discord network error: ${error.message}` };
      }

      if (!response.ok) {
        return discordErrorResponse(response);
      }

      delivery.nextPart += 1;
      delivery.expiresAt = Date.now() + DELIVERY_STATE_TTL_MS;
      await this.state.storage.put(DELIVERY_STATE_KEY, delivery);
      if (this.state.storage.setAlarm) {
        await this.state.storage.setAlarm(delivery.expiresAt);
      }
    }

    await this.state.storage.delete(DELIVERY_STATE_KEY);
    if (this.state.storage.deleteAlarm) {
      await this.state.storage.deleteAlarm();
    }
    return { status: 200, body: `ok (${delivery.payloads.length} messages)` };
  }

  async alarm() {
    await this.state.storage.delete(DELIVERY_STATE_KEY);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(req.method === 'HEAD' ? null : renderLandingPage(req.url), {
          headers: {
            'Cache-Control': 'public, max-age=300',
            'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self' https://raw.githubusercontent.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
            'Content-Type': 'text/html; charset=utf-8',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }

      if (url.pathname === '/styles.css') {
        return new Response(req.method === 'HEAD' ? null : landingPageCss, {
          headers: {
            'Cache-Control': 'public, max-age=86400',
            'Content-Type': 'text/css; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }

      if (url.pathname === '/og.png' && env.ASSETS) {
        return env.ASSETS.fetch(req);
      }

      return new Response('not found', { status: 404 });
    }

    if (req.method !== 'POST') {
      return new Response('method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD, POST' },
      });
    }

    // Optional shared-secret check: if BEARER_TOKEN is set, require it.
    if (env.BEARER_TOKEN) {
      const auth = req.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.BEARER_TOKEN}`) {
        return new Response('unauthorized', { status: 401 });
      }
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response('bad json', { status: 400 });
    }

    if (!env.DISCORD_WEBHOOK_URL) {
      return new Response('missing DISCORD_WEBHOOK_URL', { status: 500 });
    }

    const payloads = createDiscordPayloads(body, env);
    const discordWebhookUrl = buildDiscordWebhookUrl(env.DISCORD_WEBHOOK_URL);

    if (payloads.length > 1) {
      if (!env.MULTIPART_DELIVERIES) {
        return new Response('missing MULTIPART_DELIVERIES binding', { status: 500 });
      }

      const deliveryKey = await createMultipartDeliveryKey(body?.text);
      const delivery = env.MULTIPART_DELIVERIES.getByName(deliveryKey);
      return delivery.fetch('https://multipart-delivery.internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payloads }),
      });
    }

    let discordResp;
    try {
      discordResp = await sendDiscordPayload(discordWebhookUrl, payloads[0]);
    } catch (error) {
      return new Response(`discord network error: ${error.message}`, { status: 502 });
    }

    if (!discordResp.ok) {
      const error = await discordErrorResponse(discordResp);
      return new Response(error.body, { status: error.status });
    }

    return new Response('ok');
  },
};
