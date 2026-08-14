// Relay for the Pebble Brain Dump app's Custom Webhook feature.
// Brain Dump POSTs { text, timestamp }; this reshapes it into a Discord embed.

const MAX_DESCRIPTION_LENGTH = 4096;
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

export default {
  async fetch(req, env) {
    if (req.method !== 'POST') {
      return new Response('braindump-relay: POST only', {
        status: 405,
        headers: { Allow: 'POST' },
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
    for (const payload of payloads) {
      const discordResp = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!discordResp.ok) {
        const errText = await discordResp.text();
        return new Response(`discord error ${discordResp.status}: ${errText}`, { status: 502 });
      }
    }

    return new Response(payloads.length === 1 ? 'ok' : `ok (${payloads.length} messages)`);
  },
};
