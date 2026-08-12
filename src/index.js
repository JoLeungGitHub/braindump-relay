// Relay for the Pebble Brain Dump app's Custom Webhook feature.
// Brain Dump always POSTs { text, timestamp } — Discord webhooks require
// a "content" field, so this reshapes the payload before forwarding.

export default {
  async fetch(req, env) {
    if (req.method !== 'POST') {
      return new Response('braindump-relay: POST only', { status: 405 });
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
    } catch (e) {
      return new Response('bad json', { status: 400 });
    }

    const text = (body && body.text) ? String(body.text) : '(empty note)';
    // Discord's <t:epoch:f> renders in each viewer's own local timezone —
    // no manual TZ handling needed here.
    const content = body && body.timestamp
      ? `${text}\n_(<t:${body.timestamp}:f>)_`
      : text;

    const discordResp = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!discordResp.ok) {
      const errText = await discordResp.text();
      return new Response(`discord error ${discordResp.status}: ${errText}`, { status: 502 });
    }

    return new Response('ok');
  },
};
