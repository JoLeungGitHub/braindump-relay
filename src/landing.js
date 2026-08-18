const APP_ICON_URL =
  'https://raw.githubusercontent.com/adrienthiery/pebble-brain-dump-app/main/icon_80x80.png';

export function renderLandingPage(requestUrl) {
  const origin = new URL(requestUrl).origin;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#11100e">
  <meta name="description" content="A small Cloudflare Worker that reliably bridges Pebble Brain Dump notes to Discord until native support reaches the app.">
  <meta property="og:title" content="Brain Dump Relay">
  <meta property="og:description" content="Your thoughts, bridged to Discord—reliably, losslessly, and only for as long as it is needed.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin}/">
  <meta property="og:image" content="${origin}/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Brain Dump Relay: a Pebble note crossing an orange bridge into Discord">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Brain Dump Relay">
  <meta name="twitter:description" content="Your thoughts, bridged to Discord—reliably, losslessly, and only for as long as it is needed.">
  <meta name="twitter:image" content="${origin}/og.png">
  <title>Brain Dump Relay — Pebble notes to Discord</title>
  <link rel="icon" href="${APP_ICON_URL}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <aside class="announcement" aria-label="Project update">
    <a href="https://github.com/adrienthiery/pebble-brain-dump-app/pull/7">
      <span class="status-dot" aria-hidden="true"></span>
      <span><strong>Upstream update:</strong> Native Discord support has merged and will ship in a future app release.</span>
      <span class="announcement-link">See the merged PR <span aria-hidden="true">↗</span></span>
    </a>
  </aside>

  <header class="site-header">
    <a class="brand" href="/" aria-label="Brain Dump Relay home">
      <img src="${APP_ICON_URL}" width="38" height="38" alt="">
      <span>Brain Dump Relay</span>
    </a>
    <nav aria-label="Primary navigation">
      <a href="#features">Why it exists</a>
      <a href="#how-it-works">How it works</a>
      <a href="#setup">Setup</a>
    </nav>
    <a class="button button-small button-outline" href="https://github.com/JoLeungGitHub/braindump-relay">
      View on GitHub <span aria-hidden="true">↗</span>
    </a>
  </header>

  <main id="main">
    <section class="hero wrap" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">Pebble <span>→</span> Cloudflare <span>→</span> Discord</p>
        <h1 id="hero-title">Your thoughts,<br><em>bridged</em> to Discord.</h1>
        <p class="hero-lede">A tiny Cloudflare Worker that turns Brain Dump’s Custom Webhook posts into clean Discord embeds. Native support is on the way; until the app update lands, the relay stays on duty.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="https://github.com/JoLeungGitHub/braindump-relay">View on GitHub <span aria-hidden="true">↗</span></a>
          <a class="text-link" href="#setup">Set up the relay <span aria-hidden="true">↓</span></a>
        </div>
        <p class="hero-note"><span aria-hidden="true">♡</span> Open source. Minimal. Temporary by design.</p>
      </div>

      <div class="relay-visual" aria-label="A Brain Dump note travels through the relay and arrives in Discord">
        <article class="watch-stage stage">
          <div class="watch">
            <div class="watch-button" aria-hidden="true"></div>
            <div class="watch-screen">
              <div class="screen-top"><span>Brain Dump</span><span>1/1</span></div>
              <p>Idea: keep the relay running until native Discord support ships.</p>
              <div class="screen-bottom">Send note?</div>
            </div>
          </div>
          <div class="stage-label"><strong>Pebble Brain Dump</strong><span>Capture a thought</span></div>
        </article>

        <div class="signal signal-one" aria-hidden="true"><span></span><b>›</b></div>

        <article class="relay-stage stage">
          <div class="relay-node" aria-hidden="true">
            <span class="bridge-mark">⌁</span>
          </div>
          <div class="stage-label"><strong>Brain Dump Relay</strong><span>Shape and forward</span></div>
        </article>

        <div class="signal signal-two" aria-hidden="true"><span></span><b>›</b></div>

        <article class="discord-stage stage">
          <div class="discord-card">
            <div class="discord-channel"><span class="discord-badge">D</span><span># brain-dump</span></div>
            <div class="discord-message">
              <img src="${APP_ICON_URL}" width="32" height="32" alt="">
              <div>
                <p class="discord-author">Brain Dump <span>APP</span></p>
                <p>Idea: keep the relay running until native Discord support ships.</p>
                <span class="discord-time">Timestamped automatically</span>
              </div>
            </div>
          </div>
          <div class="stage-label"><strong>Discord</strong><span>Delivered as an embed</span></div>
        </article>
      </div>
    </section>

    <section class="feature-grid wrap" id="features" aria-label="Relay features">
      <article class="feature-card">
        <span class="feature-number">01</span>
        <div>
          <h2>Lossless notes</h2>
          <p>Long notes are split into ordered messages without discarding a single character.</p>
        </div>
      </article>
      <article class="feature-card">
        <span class="feature-number">02</span>
        <div>
          <h2>Reliable delivery</h2>
          <p>Confirmed parts stay confirmed. Retries resume where they stopped and respect Discord rate limits.</p>
        </div>
      </article>
      <article class="feature-card">
        <span class="feature-number">03</span>
        <div>
          <h2>Easy to retire</h2>
          <p>When native support reaches the app, switch destinations and turn the bridge off.</p>
        </div>
      </article>
    </section>

    <section class="how wrap" id="how-it-works" aria-labelledby="how-title">
      <div class="section-heading">
        <p class="eyebrow">How it works</p>
        <h2 id="how-title">A small bridge with one job.</h2>
        <p>The relay changes the message shape, not the thought itself.</p>
      </div>
      <ol class="steps">
        <li>
          <span>1</span>
          <h3>Brain Dump posts</h3>
          <p>Your Pebble sends the note and capture time through its Custom Webhook destination.</p>
        </li>
        <li>
          <span>2</span>
          <h3>The relay reshapes</h3>
          <p>The Worker builds a branded embed, safely splits long notes, and suppresses mentions.</p>
        </li>
        <li>
          <span>3</span>
          <h3>Discord confirms</h3>
          <p>Each message is delivered in order, with retries that do not start the note over.</p>
        </li>
      </ol>
    </section>

    <section class="setup wrap" id="setup" aria-labelledby="setup-title">
      <div class="setup-panel">
        <div class="section-heading">
          <p class="eyebrow">Use it for now</p>
          <h2 id="setup-title">Keep the bridge running.</h2>
          <p>Deploy the Worker, add your Discord webhook secret, then paste the Worker URL into Brain Dump’s Custom Webhook settings.</p>
        </div>
        <div class="setup-list" aria-label="Setup summary">
          <div><span>01</span><p><strong>Deploy</strong> the Worker to your Cloudflare account.</p></div>
          <div><span>02</span><p><strong>Store</strong> your Discord webhook as <code>DISCORD_WEBHOOK_URL</code>.</p></div>
          <div><span>03</span><p><strong>Connect</strong> Brain Dump’s Custom Webhook to the Worker URL.</p></div>
        </div>
        <a class="button button-primary" href="https://github.com/JoLeungGitHub/braindump-relay#setup">Open setup guide <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="sunset wrap" aria-labelledby="sunset-title">
      <div class="sunset-art" aria-hidden="true">
        <span class="sun"></span>
        <span class="horizon"></span>
        <span class="bridge-line"></span>
      </div>
      <div class="sunset-copy">
        <p class="eyebrow">Sunset plan</p>
        <h2 id="sunset-title">A bridge, not a destination.</h2>
        <p>This project filled a real gap. Once the next Brain Dump release includes its native Discord destination, point the app directly at the same Discord webhook, verify one note, and retire the relay.</p>
        <div class="sunset-path" aria-label="Relay retirement steps">
          <span>App update ships</span><i aria-hidden="true"></i><span>Switch destination</span><i aria-hidden="true"></i><span>Relay rests</span>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer wrap">
    <p>Built for the gap between a good idea and its native release.</p>
    <div>
      <a href="https://github.com/JoLeungGitHub/braindump-relay">Source</a>
      <a href="https://github.com/adrienthiery/pebble-brain-dump-app">Brain Dump app</a>
      <a href="https://github.com/adrienthiery/pebble-brain-dump-app/pull/7">Merged PR #7</a>
    </div>
  </footer>
</body>
</html>`;
}

export const landingPageCss = `
:root {
  color-scheme: dark;
  --bg: #11100e;
  --bg-deep: #0b0a09;
  --panel: #171512;
  --panel-soft: #1d1a16;
  --line: rgba(255, 244, 230, 0.12);
  --line-strong: rgba(255, 153, 0, 0.34);
  --ink: #f7f1e8;
  --muted: #aaa198;
  --orange: #ff9900;
  --orange-bright: #ffad29;
  --blurple: #5865f2;
  --wrap: min(1180px, calc(100% - 40px));
  --radius: 18px;
}

* { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  background: var(--bg-deep);
}

body {
  margin: 0;
  min-width: 320px;
  color: var(--ink);
  background:
    radial-gradient(circle at 71% 13%, rgba(255, 153, 0, 0.08), transparent 24rem),
    linear-gradient(180deg, #0d0c0b 0, var(--bg) 42rem, #0b0a09 100%);
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.16;
  pointer-events: none;
  background-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.025) 4px);
}

a { color: inherit; }
img { display: block; }

.skip-link {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 20;
  padding: 10px 14px;
  color: #11100e;
  background: var(--orange);
  border-radius: 8px;
  transform: translateY(-160%);
}

.skip-link:focus { transform: translateY(0); }

.wrap { width: var(--wrap); margin-inline: auto; }

.announcement {
  border-bottom: 1px solid var(--line);
  background: rgba(255, 153, 0, 0.045);
}

.announcement a {
  width: var(--wrap);
  min-height: 44px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #d8cfc4;
  font-size: 13px;
  text-decoration: none;
}

.announcement strong,
.announcement-link { color: var(--orange-bright); }
.announcement-link { margin-left: 8px; white-space: nowrap; }

.status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--orange);
  box-shadow: 0 0 16px rgba(255, 153, 0, 0.7);
}

.site-header {
  width: var(--wrap);
  min-height: 82px;
  margin-inline: auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 32px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-decoration: none;
  text-transform: uppercase;
}

.brand img { border-radius: 9px; }

nav { display: flex; gap: 30px; }
nav a, .site-footer a {
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
}
nav a:hover, .site-footer a:hover { color: var(--ink); }

.site-header > .button { justify-self: end; }

.button {
  min-height: 48px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.button:hover { transform: translateY(-2px); }
.button-primary { color: #17110a; background: var(--orange); }
.button-primary:hover { background: var(--orange-bright); }
.button-outline { border-color: var(--line-strong); color: var(--orange-bright); }
.button-outline:hover { background: rgba(255,153,0,0.08); }
.button-small { min-height: 42px; padding-inline: 16px; }

.hero {
  padding-block: 92px 72px;
  display: grid;
  grid-template-columns: minmax(360px, 0.82fr) minmax(560px, 1.18fr);
  align-items: center;
  gap: clamp(48px, 6vw, 96px);
}

.eyebrow {
  margin: 0 0 18px;
  color: var(--orange-bright);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.eyebrow span { color: #726a61; padding-inline: 4px; }

h1, h2, h3, p { margin-top: 0; }

h1 {
  max-width: 660px;
  margin-bottom: 24px;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
  font-size: clamp(58px, 6.2vw, 94px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 0.94;
  text-transform: uppercase;
}

h1 em { color: var(--orange); font-style: normal; }

.hero-lede {
  max-width: 570px;
  margin-bottom: 30px;
  color: #bdb4aa;
  font-size: clamp(17px, 1.4vw, 20px);
  line-height: 1.65;
}

.hero-actions { display: flex; align-items: center; gap: 24px; }

.text-link {
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  text-underline-offset: 5px;
}

.hero-note { margin: 24px 0 0; color: #8f877f; font-size: 13px; }
.hero-note span { margin-right: 7px; color: var(--orange); font-size: 18px; }

.relay-visual {
  position: relative;
  min-height: 420px;
  display: grid;
  grid-template-columns: 1fr 68px 0.72fr 68px 1.25fr;
  align-items: center;
}

.stage { position: relative; z-index: 1; text-align: center; }
.stage-label { margin-top: 18px; display: grid; gap: 2px; }
.stage-label strong { font-size: 14px; }
.stage-label span { color: #8e867e; font-size: 12px; }
.relay-stage .stage-label strong { color: var(--orange-bright); }

.watch {
  position: relative;
  width: 150px;
  margin-inline: auto;
  padding: 20px 15px;
  background: linear-gradient(145deg, #3a3733, #151412 70%);
  border: 2px solid #4b4741;
  border-radius: 28px;
  box-shadow: 0 24px 56px rgba(0,0,0,0.48), inset 0 0 0 4px #0a0908;
}

.watch::before, .watch::after {
  content: "";
  position: absolute;
  left: 35px;
  width: 76px;
  height: 34px;
  z-index: -1;
  background: #181715;
  border: 1px solid #383531;
}

.watch::before { top: -26px; border-radius: 10px 10px 2px 2px; }
.watch::after { bottom: -26px; border-radius: 2px 2px 10px 10px; }

.watch-button {
  position: absolute;
  top: 52px;
  right: -8px;
  width: 7px;
  height: 36px;
  background: #302d29;
  border-radius: 0 4px 4px 0;
}

.watch-screen {
  min-height: 164px;
  padding: 9px;
  display: flex;
  flex-direction: column;
  color: #171613;
  background: #d9d3c1;
  border: 5px solid #080807;
  border-radius: 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-align: left;
  box-shadow: inset 0 0 18px rgba(72, 66, 51, 0.22);
}

.screen-top, .screen-bottom { display: flex; justify-content: space-between; font-size: 8px; font-weight: 800; }
.watch-screen p { margin: 16px 0 auto; font-size: 11px; line-height: 1.3; }
.screen-bottom { padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.35); }

.relay-node {
  width: 98px;
  aspect-ratio: 1;
  margin-inline: auto;
  display: grid;
  place-items: center;
  color: var(--orange);
  background: linear-gradient(145deg, #252019, #0e0d0b);
  border: 1px solid var(--orange);
  border-radius: 24px;
  box-shadow: 0 0 0 8px rgba(255,153,0,0.04), 0 0 42px rgba(255,153,0,0.22);
}

.bridge-mark { font-size: 56px; line-height: 1; transform: rotate(90deg); }

.signal { display: flex; align-items: center; color: var(--orange); }
.signal span { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--orange), transparent); }
.signal b { font-size: 25px; font-weight: 400; }

.discord-card {
  overflow: hidden;
  color: #dbdee1;
  background: #292b2f;
  border: 1px solid #55575f;
  border-radius: 15px;
  text-align: left;
  box-shadow: 0 28px 68px rgba(0,0,0,0.45);
}

.discord-channel {
  padding: 13px 16px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: #b5bac1;
  background: #232428;
  border-bottom: 1px solid #3b3d43;
  font-size: 12px;
}

.discord-badge {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: white;
  background: var(--blurple);
  border-radius: 7px;
  font-size: 11px;
  font-weight: 800;
}

.discord-message {
  position: relative;
  margin: 17px;
  padding: 2px 2px 2px 13px;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
}

.discord-message::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--orange);
  border-radius: 3px;
}

.discord-message img { border-radius: 50%; }
.discord-message p { margin-bottom: 4px; font-size: 12px; line-height: 1.45; }
.discord-message .discord-author { color: #f2f3f5; font-weight: 750; }
.discord-author span { padding: 1px 4px; color: white; background: var(--blurple); border-radius: 3px; font-size: 7px; }
.discord-time { color: #949ba4; font-size: 9px; }

.feature-grid {
  padding-bottom: 96px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature-card {
  min-height: 170px;
  padding: 26px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  background: linear-gradient(145deg, rgba(30,27,23,0.9), rgba(18,17,15,0.96));
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.feature-number {
  color: var(--orange);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}

.feature-card h2 { margin-bottom: 8px; font-size: 20px; line-height: 1.2; }
.feature-card p { margin-bottom: 0; color: var(--muted); font-size: 14px; }

.how {
  padding-block: 96px;
  border-top: 1px solid var(--line);
}

.section-heading { max-width: 600px; }
.section-heading h2, .sunset-copy h2 {
  margin-bottom: 14px;
  font-size: clamp(34px, 4vw, 58px);
  letter-spacing: -0.04em;
  line-height: 1.05;
}
.section-heading > p:last-child, .sunset-copy > p { color: var(--muted); }

.steps {
  margin: 56px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  list-style: none;
}

.steps li { position: relative; padding: 0 42px 0 0; }
.steps li:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 18px;
  right: 24px;
  left: 54px;
  height: 1px;
  background: linear-gradient(90deg, var(--line-strong), var(--line));
}
.steps li > span {
  width: 36px;
  height: 36px;
  margin-bottom: 24px;
  display: grid;
  place-items: center;
  color: var(--orange);
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
.steps h3 { margin-bottom: 8px; font-size: 18px; }
.steps p { margin-bottom: 0; color: var(--muted); font-size: 14px; }

.setup { padding-block: 40px 96px; }
.setup-panel {
  padding: clamp(28px, 5vw, 64px);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 58px 80px;
  align-items: start;
  background:
    radial-gradient(circle at 0 0, rgba(255,153,0,0.12), transparent 24rem),
    var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: 24px;
}
.setup-panel > .button { grid-column: 1; width: max-content; }
.setup-list { grid-column: 2; grid-row: 1 / span 2; display: grid; gap: 22px; }
.setup-list > div { padding-bottom: 20px; display: grid; grid-template-columns: 38px 1fr; gap: 14px; border-bottom: 1px solid var(--line); }
.setup-list > div:last-child { border-bottom: 0; }
.setup-list span { color: var(--orange); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.setup-list p { margin: 0; color: var(--muted); font-size: 14px; }
.setup-list strong { color: var(--ink); }
code { color: var(--orange-bright); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }

.sunset {
  overflow: hidden;
  margin-bottom: 96px;
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 24px;
}

.sunset-art {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  background: linear-gradient(180deg, #29170c 0%, #8a4107 65%, #120e0a 66%);
}
.sun {
  position: absolute;
  left: 50%;
  bottom: 27%;
  width: 150px;
  aspect-ratio: 1;
  background: #ffc267;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 70px rgba(255,153,0,0.58);
}
.horizon {
  position: absolute;
  inset: auto 0 25% 0;
  height: 2px;
  background: rgba(255,220,160,0.58);
  box-shadow: 0 18px 0 rgba(255,183,72,0.12), 0 36px 0 rgba(255,183,72,0.06);
}
.bridge-line {
  position: absolute;
  right: 0;
  bottom: 30%;
  left: 0;
  height: 10px;
  background: #110d09;
  box-shadow: 0 -3px 0 rgba(255,170,45,0.7);
}
.bridge-line::before {
  content: "";
  position: absolute;
  right: 18%;
  bottom: -75px;
  left: 18%;
  height: 95px;
  border: 9px solid #110d09;
  border-top: 0;
  border-radius: 0 0 50% 50%;
}

.sunset-copy { padding: clamp(34px, 6vw, 76px); align-self: center; }
.sunset-path { margin-top: 30px; display: flex; align-items: center; gap: 14px; color: #bbb2a8; font-size: 12px; }
.sunset-path i { flex: 1; height: 1px; background: repeating-linear-gradient(90deg, var(--orange) 0 3px, transparent 3px 8px); opacity: 0.5; }

.site-footer {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  color: #7f7870;
  border-top: 1px solid var(--line);
  font-size: 13px;
}
.site-footer p { margin: 0; }
.site-footer div { display: flex; gap: 24px; }

:focus-visible { outline: 2px solid var(--orange); outline-offset: 4px; }

@media (max-width: 1040px) {
  .site-header { grid-template-columns: 1fr auto; }
  .site-header nav { display: none; }
  .hero { grid-template-columns: 1fr; padding-top: 70px; }
  .hero-copy { max-width: 760px; }
  .relay-visual { width: min(760px, 100%); margin-inline: auto; }
}

@media (max-width: 760px) {
  :root { --wrap: min(620px, calc(100% - 28px)); }
  .announcement a { padding-block: 10px; align-items: flex-start; justify-content: flex-start; line-height: 1.4; }
  .announcement-link { display: none; }
  .site-header { min-height: 70px; }
  .brand { font-size: 12px; letter-spacing: 0.1em; }
  .brand img { width: 32px; height: 32px; }
  .site-header > .button { display: none; }
  .hero { padding-block: 56px 58px; }
  h1 { font-size: clamp(50px, 15vw, 74px); }
  .relay-visual {
    min-height: 0;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .signal { width: 1px; height: 34px; margin-inline: auto; flex-direction: column; }
  .signal span { width: 1px; background: linear-gradient(180deg, transparent, var(--orange), transparent); }
  .signal b { height: 12px; line-height: 10px; transform: rotate(90deg); }
  .watch { width: 138px; }
  .relay-node { width: 88px; }
  .discord-card { max-width: 330px; margin-inline: auto; }
  .feature-grid, .steps { grid-template-columns: 1fr; }
  .feature-grid { padding-bottom: 70px; }
  .feature-card { min-height: 0; }
  .how { padding-block: 70px; }
  .steps { gap: 36px; }
  .steps li { padding-right: 0; }
  .steps li:not(:last-child)::after { top: 50px; right: auto; bottom: -26px; left: 17px; width: 1px; height: auto; }
  .setup { padding-bottom: 70px; }
  .setup-panel { grid-template-columns: 1fr; gap: 34px; }
  .setup-panel > .button, .setup-list { grid-column: 1; grid-row: auto; }
  .sunset { grid-template-columns: 1fr; margin-bottom: 70px; }
  .sunset-art { min-height: 260px; }
  .sunset-path { align-items: flex-start; flex-direction: column; }
  .sunset-path i { width: 1px; min-height: 20px; flex: none; background: repeating-linear-gradient(180deg, var(--orange) 0 3px, transparent 3px 8px); }
  .site-footer { padding-block: 34px; align-items: flex-start; flex-direction: column; }
  .site-footer div { flex-wrap: wrap; }
}

@media (max-width: 440px) {
  .hero-actions { align-items: stretch; flex-direction: column; }
  .hero-actions .button { width: 100%; }
  .text-link { text-align: center; }
  .feature-card { grid-template-columns: 1fr; gap: 10px; }
  .setup-panel > .button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
`;
