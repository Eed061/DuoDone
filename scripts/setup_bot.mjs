import https from 'https';

const BOT_TOKEN = '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const WEBHOOK_URL = 'https://duodone-one.vercel.app/api/bot';

function telegramPost(method, bodyData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bodyData);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      family: 4,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('🤖 Registering Webhook for Telegram Bot...');

  const hookRes = await telegramPost('setWebhook', {
    url: WEBHOOK_URL,
  });
  console.log('setWebhook:', hookRes);
}

run().catch(console.error);
