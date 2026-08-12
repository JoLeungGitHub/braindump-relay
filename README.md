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

Discord's webhook execute endpoint requires a `content` field and rejects
anything else with a 400. This Worker sits in between, reshapes the payload,
and forwards it to Discord — so notes show up as clean chat messages with a
timestamp that renders correctly in each viewer's own timezone.

> Note: a native "Discord format" option has since been proposed upstream —
> see [pebble-brain-dump-app#7](https://github.com/adrienthiery/pebble-brain-dump-app/pull/7).
> If/when that merges, this relay becomes optional (you can point Brain Dump
> straight at your Discord webhook).

## How it works

1. Brain Dump POSTs `{ text, timestamp }` to this Worker's URL.
2. The Worker builds `{ content: "<text>\n_(<t:<timestamp>:f>)_" }` — the
   `<t:...:f>` bit is Discord's native timestamp markup, which Discord
   renders client-side in each viewer's own local timezone.
3. The Worker POSTs that to `DISCORD_WEBHOOK_URL` and returns its result.

## Setup

```bash
npm install -g wrangler   # if not already installed
wrangler login            # or set CLOUDFLARE_API_TOKEN
wrangler secret put DISCORD_WEBHOOK_URL   # paste your Discord channel webhook URL
wrangler deploy
```

Then in the Brain Dump app's settings, under **Custom Webhook**:
- **URL:** your deployed Worker URL (e.g. `https://braindump-relay.<subdomain>.workers.dev`)
- **Method:** POST

Optionally set a `BEARER_TOKEN` secret (`wrangler secret put BEARER_TOKEN`)
and configure the same value as the Bearer token in Brain Dump's settings
to require auth on requests to the Worker.

## Testing

```bash
curl -X POST https://<your-worker>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"text":"test note","timestamp":'"$(date +%s)"'}'
```

Or just follow the setup and try it out!

<img width="330" height="114" alt="image" src="https://github.com/user-attachments/assets/179f6e02-9193-42d8-a53d-65a64395534e" />

