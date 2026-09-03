import https from 'https';

const BOT_TOKEN = '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const WEB_APP_URL = 'https://duodone.vercel.app';

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
  console.log('🤖 Updating full description...');

  const cleanDescription = `DuoDone — веб-застосунок для пар та сімей для прозорого розподілу побутових завдань 🤝

🏓 Симетричний пінг-понг: почергова передача ходу конкретної справи.
⚖️ Балансир XP балів: спільний залік з перетягуванням каната.
🎡 Рулетка долі: розіграш призів та покарань наприкінці місяця.
🔢 Лічильники дій: автономні клікери з живим фотопідтвердженням.

Натисніть кнопку «Відкрити DuoDone 🏓» нижче!`;

  const fullDescRes = await telegramPost('setMyDescription', {
    description: cleanDescription,
  });
  console.log('setMyDescription:', fullDescRes);
}

run().catch(console.error);
