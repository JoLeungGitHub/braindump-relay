# braindump-relay

Cloudflare Worker that relays webhook posts from the [Pebble Brain Dump
app](https://github.com/adrienthiery/pebble-brain-dump-app) into a Discord
channel via a Discord webhook.

## Why

Brain Dump's Custom Webhook destination always POSTs a JSON body shaped
like:

```json
{ "text": "...", "timestamp": 1234567890 }
```

Discord expects its own webhook message shape. This Worker sits in between,
reshapes the payload, and forwards it to Discord so each note appears as a
compact, branded embed with the Brain Dump icon, a colored accent, and a subtle
timestamp that renders correctly in each viewer's own timezone.

> Note: a native Discord destination has now merged upstream — see
> [pebble-brain-dump-app#7](https://github.com/adrienthiery/pebble-brain-dump-app/pull/7).
> It has not shipped in an app release yet, so the relay remains useful for now.
> Once that update lands, Brain Dump can point straight at the Discord webhook.

## How it works

1. Brain Dump POSTs `{ text, timestamp }` to this Worker's URL.
2. The Worker builds a Discord embed containing the note and capture time.
   Mentions are disabled so captured text cannot unexpectedly ping a Discord
   user.
3. The Worker POSTs that to `DISCORD_WEBHOOK_URL` and returns its result.

Opening the Worker URL in a browser serves the project landing page. `POST`
requests continue to use the relay API described above.

Notes longer than Discord's 4,096-character embed limit are split across as
many sequential messages as needed. Each footer is labeled `Part 1 of 2`,
`Part 2 of 2`, and so on; no note text is discarded.

## Setup

```bash
npm install
npx wrangler login            # or set CLOUDFLARE_API_TOKEN
npx wrangler secret put DISCORD_WEBHOOK_URL   # paste your Discord channel webhook URL
npm run deploy
```

Then in the Brain Dump app's settings, under **Custom Webhook**:
- **URL:** your deployed Worker URL (e.g. `https://braindump-relay.<subdomain>.workers.dev`)
- **Method:** POST

Optionally set a `BEARER_TOKEN` secret (`npx wrangler secret put BEARER_TOKEN`)
and configure the same value as the Bearer token in Brain Dump's settings
to require auth on requests to the Worker.

### Appearance options

The defaults work without any extra configuration. You can optionally add
Worker variables to customize them:

- `DISCORD_USERNAME` — sender name (default: `Brain Dump`)
- `DISCORD_AVATAR_URL` — sender icon URL (default: Brain Dump's app icon)
- `DISCORD_EMBED_COLOR` — six-digit hex accent (default: `#ff9900`)

## Testing

Run the unit tests locally:

```bash
npm test
```

To test the deployed Worker:

```bash
curl -X POST https://<your-worker>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"text":"test note","timestamp":'"$(date +%s)"'}'
```

Or just follow the setup and try it out!

<img width="309" height="142" alt="image" src="https://github.com/user-attachments/assets/269ba52e-dd0e-4ff0-9953-09e6a559451e" />


