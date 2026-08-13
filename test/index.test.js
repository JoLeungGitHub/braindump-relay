import assert from 'node:assert/strict';
import test from 'node:test';

import worker, { createDiscordPayloads } from '../src/index.js';

test('builds a branded Discord embed from a Brain Dump note', () => {
  const [payload] = createDiscordPayloads({
    text: 'Remember the milk',
    timestamp: 1_700_000_000,
  });

  assert.equal(payload.username, 'Brain Dump');
  assert.equal(payload.embeds[0].description, 'Remember the milk');
  assert.equal(payload.embeds[0].color, 0xff9900);
  assert.equal(payload.embeds[0].timestamp, '2023-11-14T22:13:20.000Z');
  assert.equal(payload.embeds[0].footer, undefined);
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
});

test('supports appearance overrides and ignores invalid timestamps', () => {
  const [payload] = createDiscordPayloads(
    { text: '', timestamp: 'not-a-date' },
    {
      DISCORD_USERNAME: 'Thoughts',
      DISCORD_AVATAR_URL: 'https://example.com/avatar.png',
      DISCORD_EMBED_COLOR: '#12abef',
    },
  );

  assert.equal(payload.username, 'Thoughts');
  assert.equal(payload.avatar_url, 'https://example.com/avatar.png');
  assert.equal(payload.embeds[0].description, '*Empty note*');
  assert.equal(payload.embeds[0].color, 0x12abef);
  assert.equal(payload.embeds[0].timestamp, undefined);
});

test('splits long notes without losing any text', () => {
  const note = `${'a'.repeat(4095)}🧠${'b'.repeat(1000)}\nLast line`;
  const payloads = createDiscordPayloads({ text: note });

  assert.equal(payloads.length, 2);
  assert.equal(
    payloads.map((payload) => payload.embeds[0].description).join(''),
    note,
  );
  assert.equal(payloads[0].embeds[0].footer.text, 'Part 1 of 2');
  assert.equal(payloads[1].embeds[0].footer.text, 'Part 2 of 2');
});

test('forwards the embed payload to Discord', async (t) => {
  let forwarded;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    forwarded = { url, init };
    return new Response(null, { status: 204 });
  });

  const response = await worker.fetch(
    new Request('https://relay.example', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'A useful thought', timestamp: 1_700_000_000 }),
    }),
    {
      BEARER_TOKEN: 'secret',
      DISCORD_WEBHOOK_URL: 'https://discord.example/webhook',
    },
  );

  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://discord.example/webhook');
  assert.equal(forwarded.init.method, 'POST');
  assert.equal(JSON.parse(forwarded.init.body).embeds[0].description, 'A useful thought');
});

test('forwards every part of a long note as a separate message in order', async (t) => {
  const forwarded = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    forwarded.push({ url, payload: JSON.parse(init.body) });
    return new Response(null, { status: 204 });
  });

  const note = `${'first'.repeat(1000)} and the rest`;
  const response = await worker.fetch(
    new Request('https://relay.example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: note, timestamp: 1_700_000_000 }),
    }),
    { DISCORD_WEBHOOK_URL: 'https://discord.example/webhook' },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'ok (2 messages)');
  assert.equal(forwarded.length, 2);
  assert.equal(
    forwarded.map(({ payload }) => payload.embeds[0].description).join(''),
    note,
  );
});

test('rejects unauthorized requests before forwarding them', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(null));

  const response = await worker.fetch(
    new Request('https://relay.example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }),
    {
      BEARER_TOKEN: 'secret',
      DISCORD_WEBHOOK_URL: 'https://discord.example/webhook',
    },
  );

  assert.equal(response.status, 401);
  assert.equal(fetchMock.mock.callCount(), 0);
});
