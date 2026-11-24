import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';

// Isolated test DB
const TEST_DATA = path.resolve('data-test-' + process.pid);
process.env.DATA_DIR = TEST_DATA;
process.env.DISABLE_FIREBASE_SYNC = '1';
const BOT_TOKEN = '123456:TEST_BOT_TOKEN_SECRET';

const { apiRouter } = await import('../src/routes.js');
const { UPLOAD_DIR } = await import('../src/storage.js');

const app = express();
app.use('/api', apiRouter({ botToken: BOT_TOKEN, allowInsecureTg: false, publicConfig: { botUsername: 'duodone_bot', appShortName: 'app', publicUrl: 'https://duodone.example', telegramAuth: true } }));
app.use('/uploads', express.static(UPLOAD_DIR));

const server = http.createServer(app);
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as any).port;
const base = `http://127.0.0.1:${port}`;

function signTgInitData(user: { id: number; first_name: string; username?: string }, startParam?: string) {
  const params = new URLSearchParams();
  params.set('auth_date', String(Math.floor(Date.now() / 1000)));
  params.set('user', JSON.stringify(user));
  if (startParam) params.set('start_param', startParam);
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

async function req(method: string, url: string, token?: string, body?: any) {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

try {
  // 1. Dima signs in via Telegram HMAC-validated initData, creates space "Дім", renames partners to "Діма" & "Віка"
  const dimaAuth = await req('POST', '/api/auth/telegram', undefined, {
    initData: signTgInitData({ id: 1001, first_name: 'Dmytro_TG', username: 'dima_tg' }),
  });
  assert.equal(dimaAuth.status, 200);
  assert.equal(dimaAuth.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, max-age=0');
  const dimaToken = dimaAuth.data.token;

  const createdDom = await req('POST', '/api/spaces', dimaToken, { name: 'Дім' });
  assert.equal(createdDom.status, 200);
  const domId = createdDom.data.spaceId;

  const renamedDom = await req('PATCH', `/api/spaces/${domId}`, dimaToken, { p1Name: 'Діма', p2Name: 'Віка' });
  assert.equal(renamedDom.status, 200);
  assert.equal(renamedDom.data.space.p1.name, 'Діма');
  assert.equal(renamedDom.data.space.p2.name, 'Віка');
  const domCode = renamedDom.data.space.inviteCode;

  // 2. Vika opens invite on iPhone (her Telegram profile name is "Viktoria_Official", NOT "Віка")
  const vikaAuth1 = await req('POST', '/api/auth/telegram', undefined, {
    initData: signTgInitData({ id: 1002, first_name: 'Viktoria_Official', username: 'vika_tg' }, `join_${domCode}`),
  });
  assert.equal(vikaAuth1.status, 200);
  const vikaToken = vikaAuth1.data.token;

  const vikaJoinDom = await req('POST', '/api/spaces/join', vikaToken, { code: domCode });
  assert.equal(vikaJoinDom.status, 200);

  // Vika reloads / signs in again via Telegram — custom names "Діма" & "Віка" MUST NOT be overwritten by Telegram first_name
  await req('POST', '/api/auth/telegram', undefined, {
    initData: signTgInitData({ id: 1002, first_name: 'Viktoria_Changed_In_TG', username: 'vika_tg' }),
  });
  const domStateForVika = await req('GET', `/api/spaces/${domId}/state`, vikaToken);
  assert.equal(domStateForVika.data.space.p1.name, 'Діма');
  assert.equal(domStateForVika.data.space.p2.name, 'Віка');

  // 3. Oleg creates space "Пара Олега" and sends invite to Vika
  const olegAuth = await req('POST', '/api/auth/telegram', undefined, {
    initData: signTgInitData({ id: 1003, first_name: 'Олег', username: 'oleg_tg' }),
  });
  const olegToken = olegAuth.data.token;
  const createdOleg = await req('POST', '/api/spaces', olegToken, { name: 'Пара Олега' });
  const olegSpaceId = createdOleg.data.spaceId;
  const olegState = await req('GET', `/api/spaces/${olegSpaceId}/state`, olegToken);
  const olegCode = olegState.data.space.inviteCode;

  // 4. Vika joins Oleg's space — she now has TWO spaces ("Дім" and "Пара Олега"); Dima & Oleg only see their own
  const vikaJoinOleg = await req('POST', '/api/spaces/join', vikaToken, { code: olegCode });
  assert.equal(vikaJoinOleg.status, 200);
  assert.deepEqual(
    vikaJoinOleg.data.spaces.map((s: any) => s.name),
    ['Дім', 'Пара Олега'],
  );

  const dimaMe = await req('GET', '/api/me', dimaToken);
  assert.deepEqual(
    dimaMe.data.spaces.map((s: any) => s.name),
    ['Дім'],
  );

  const olegMe = await req('GET', '/api/me', olegToken);
  assert.deepEqual(
    olegMe.data.spaces.map((s: any) => s.name),
    ['Пара Олега'],
  );

  // Dima trying to access Oleg's space directly → 403 forbidden
  const dimaPeekOleg = await req('GET', `/api/spaces/${olegSpaceId}/state`, dimaToken);
  assert.equal(dimaPeekOleg.status, 403);

  // Third person trying to join already full space "Дім" → 403 space_full
  const strangerAuth = await req('POST', '/api/auth/guest', undefined, { lang: 'uk' });
  const strangerJoin = await req('POST', '/api/spaces/join', strangerAuth.data.token, { code: domCode });
  assert.equal(strangerJoin.status, 403);
  assert.equal(strangerJoin.data.error, 'space_full');

  // 5. Vika uploads 2 photos and completes a task → URLs stored and visible to Dima
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  const uploadPhoto = async () => {
    const fd = new FormData();
    fd.append('spaceId', domId);
    fd.append('file', new Blob([png1x1], { type: 'image/png' }), 'photo.png');
    const r = await req('POST', '/api/upload', vikaToken, fd);
    assert.equal(r.status, 200);
    assert.match(r.data.url, /^\/uploads\//);
    return r.data.url as string;
  };
  const url1 = await uploadPhoto();
  const url2 = await uploadPhoto();

  const tasks = domStateForVika.data.tasks;
  const vikaTurnTask = tasks.find((t: any) => t.turnRole === 'p2');
  const completed = await req('POST', `/api/spaces/${domId}/tasks/${vikaTurnTask.id}/complete`, vikaToken, {
    photos: [url1, url2],
  });
  assert.equal(completed.status, 200);

  const dimaStateAfter = await req('GET', `/api/spaces/${domId}/state`, dimaToken);
  assert.deepEqual(dimaStateAfter.data.logs[0].photos, [url1, url2]);
  assert.equal(dimaStateAfter.data.xp.p2, vikaTurnTask.xp);

  const imgFetch = await fetch(base + url1);
  assert.equal(imgFetch.status, 200);

  // 6. Dual-partner log deletion approval: Vika requests deletion → not deleted until Dima confirms
  const logId = dimaStateAfter.data.logs[0].id;
  const vikaDelReq = await req('DELETE', `/api/spaces/${domId}/logs/${logId}`, vikaToken);
  assert.equal(vikaDelReq.status, 200);
  assert.equal(vikaDelReq.data.deleteStatus, 'requested');
  assert.equal(vikaDelReq.data.logs.length, 1);
  assert.equal(vikaDelReq.data.logs[0].deleteRequestedBy, 'p2');

  // Dima confirms deletion → log is now deleted
  const dimaDelConfirm = await req('DELETE', `/api/spaces/${domId}/logs/${logId}`, dimaToken);
  assert.equal(dimaDelConfirm.status, 200);
  assert.equal(dimaDelConfirm.data.deleteStatus, 'deleted');
  assert.equal(dimaDelConfirm.data.logs.length, 0);
  assert.equal(dimaDelConfirm.data.xp.p2, 0);

  // 7. Counters master toggle (showCounters)
  const toggleCountersOff = await req('PATCH', `/api/spaces/${domId}`, dimaToken, { showCounters: false });
  assert.equal(toggleCountersOff.data.space.showCounters, false);
  const toggleCountersOn = await req('PATCH', `/api/spaces/${domId}`, dimaToken, { showCounters: true });
  assert.equal(toggleCountersOn.data.space.showCounters, true);

  // 8. Roulette item editing & space factory-reset (keeps space + partners, resets logs & settings)
  const rlItem = toggleCountersOn.data.roulette[0];
  const rlEdited = await req('PATCH', `/api/spaces/${domId}/roulette/${rlItem.id}`, dimaToken, {
    text: 'Романтична вечеря 🕯️',
    pool: 'reward',
  });
  assert.equal(rlEdited.status, 200);
  assert.equal(rlEdited.data.roulette.find((x: any) => x.id === rlItem.id).text, 'Романтична вечеря 🕯️');

  await req('PATCH', `/api/spaces/${domId}`, dimaToken, { mode: 'balancer', showCounters: false });
  const factoryReset = await req('POST', `/api/spaces/${domId}/factory-reset`, dimaToken);
  assert.equal(factoryReset.status, 200);
  assert.equal(factoryReset.data.space.name, 'Дім');
  assert.equal(factoryReset.data.space.p1.name, 'Діма');
  assert.equal(factoryReset.data.space.p2.name, 'Віка');
  assert.equal(factoryReset.data.space.p1.linked, true);
  assert.equal(factoryReset.data.space.p2.linked, true);
  assert.equal(factoryReset.data.space.mode, 'symmetric');
  assert.equal(factoryReset.data.space.showCounters, true);
  assert.equal(factoryReset.data.logs.length, 0);
  assert.ok(factoryReset.data.tasks.length >= 5);

  console.log('ALL ACCEPTANCE TESTS PASSED');
} finally {
  server.close();
  try {
    fs.rmSync(TEST_DATA, { recursive: true, force: true });
  } catch {}
}
