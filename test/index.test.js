import assert from 'node:assert/strict';
import test from 'node:test';

import worker, {
  buildDiscordWebhookUrl,
  createDiscordPayloads,
  MultipartDelivery,
  sendDiscordPayload,
} from '../src/index.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.alarm = null;
  }

  async get(key) {
    const value = this.values.get(key);
    return value === undefined ? undefined : structuredClone(value);
  }

  async put(key, value) {
    this.values.set(key, structuredClone(value));
  }

  async delete(key) {
    this.values.delete(key);
  }

  async setAlarm(timestamp) {
    this.alarm = timestamp;
  }

  async deleteAlarm() {
    this.alarm = null;
  }
}

function addMultipartBinding(env) {
  const objects = new Map();
  env.MULTIPART_DELIVERIES = {
    getByName(name) {
      if (!objects.has(name)) {
        objects.set(name, new MultipartDelivery(
          { storage: new MemoryStorage() },
          env,
        ));
      }
      const instance = objects.get(name);
      return { fetch: (request, init) => instance.fetch(new Request(request, init)) };
    },
  };
  return env;
}

test('requests confirmed Discord delivery while preserving webhook parameters', () => {
  assert.equal(
    buildDiscordWebhookUrl('https://discord.example/webhook'),
    'https://discord.example/webhook?wait=true',
  );
  assert.equal(
    buildDiscordWebhookUrl('https://discord.example/webhook?thread_id=123&wait=false'),
    'https://discord.example/webhook?thread_id=123&wait=true',
  );
  assert.equal(
    buildDiscordWebhookUrl('https://discord.example/webhook?WAIT=false'),
    'https://discord.example/webhook?wait=true',
  );
});

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
    return Response.json({ id: 'message-1' });
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
  assert.equal(forwarded.url, 'https://discord.example/webhook?wait=true');
  assert.equal(forwarded.init.method, 'POST');
  assert.equal(JSON.parse(forwarded.init.body).embeds[0].description, 'A useful thought');
});

test('forwards every part of a long note as a separate message in order', async (t) => {
  const forwarded = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    forwarded.push({ url, payload: JSON.parse(init.body) });
    return Response.json({ id: `message-${forwarded.length}` });
  });

  const note = `${'first'.repeat(1000)} and the rest`;
  const env = addMultipartBinding({
    DISCORD_WEBHOOK_URL: 'https://discord.example/webhook',
  });
  const response = await worker.fetch(
    new Request('https://relay.example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: note, timestamp: 1_700_000_000 }),
    }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'ok (2 messages)');
  assert.equal(forwarded.length, 2);
  assert.equal(
    forwarded.every(({ url }) => url === 'https://discord.example/webhook?wait=true'),
    true,
  );
  assert.equal(
    forwarded.map(({ payload }) => payload.embeds[0].description).join(''),
    note,
  );
});

test('resumes a failed multipart delivery without duplicating confirmed parts', async (t) => {
  const forwarded = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const payload = JSON.parse(init.body);
    forwarded.push(payload);
    if (forwarded.length === 2) {
      return new Response('temporary failure', { status: 500 });
    }
    return Response.json({ id: `message-${forwarded.length}` });
  });

  const env = addMultipartBinding({
    DISCORD_WEBHOOK_URL: 'https://discord.example/webhook',
  });
  const note = `${'first'.repeat(1000)} and the rest`;
  const makeRequest = (timestamp) => new Request('https://relay.example', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: note, timestamp }),
  });

  const failed = await worker.fetch(makeRequest(1_700_000_000), env);
  assert.equal(failed.status, 502);
  assert.equal(forwarded.length, 2);

  const retried = await worker.fetch(makeRequest(1_700_000_100), env);
  assert.equal(retried.status, 200);
  assert.equal(await retried.text(), 'ok (2 messages)');
  assert.deepEqual(
    forwarded.map((payload) => payload.embeds[0].footer.text),
    ['Part 1 of 2', 'Part 2 of 2', 'Part 2 of 2'],
  );
  assert.equal(
    forwarded.filter((payload) => payload.embeds[0].footer.text === 'Part 1 of 2').length,
    1,
  );
  assert.equal(
    forwarded[2].embeds[0].timestamp,
    '2023-11-14T22:13:20.000Z',
  );
});

test('waits for retry_after and retries a Discord 429 once', async () => {
  const delays = [];
  let calls = 0;
  const response = await sendDiscordPayload(
    'https://discord.example/webhook?wait=true',
    { content: 'hello' },
    {
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) {
          return Response.json(
            { message: 'rate limited', retry_after: 0.25 },
            { status: 429 },
          );
        }
        return Response.json({ id: 'message-1' });
      },
      sleepImpl: async (delay) => { delays.push(delay); },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [250]);
});

test('returns the second 429 after the one allowed rate-limit retry', async () => {
  const delays = [];
  let calls = 0;
  const response = await sendDiscordPayload(
    'https://discord.example/webhook?wait=true',
    { content: 'hello' },
    {
      fetchImpl: async () => {
        calls += 1;
        return Response.json(
          { message: 'rate limited', retry_after: 0.1 },
          { status: 429 },
        );
      },
      sleepImpl: async (delay) => { delays.push(delay); },
    },
  );

  assert.equal(response.status, 429);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [100]);
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
