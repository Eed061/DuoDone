const BOT_TOKEN = '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Set WebApp URL (Vercel or Github Pages default)
const WEB_APP_URL = 'https://duodone.vercel.app';

async function callTelegramApi(method, payload = {}) {
  const response = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  console.log(`[${method}] Result:`, data);
  return data;
}

async function setupBot() {
  console.log('🤖 Setting up Telegram Bot...');

  // 1. Verify Bot Token
  const me = await callTelegramApi('getMe');
  if (!me.ok) {
    console.error('❌ Invalid Token:', me);
    return;
  }
  console.log(`✅ Bot verified: @${me.result.username} (${me.result.first_name})`);

  // 2. Set Bot Name
  await callTelegramApi('setMyName', {
    name: 'DuoDone 🏓 Змагання та Лічильники',
  });

  // 3. Set Full Description (shows on empty chat start screen)
  await callTelegramApi('setMyDescription', {
    description: `DuoDone — легкий веб-застосунок для пар та сімей для прозорого розподілу побутових завдань без токсичності та суперечок 🤝

🏓 Сценарій «Симетричний Пінг-понг»: почергова передача ходу конкретної справи (миття посуду, виніс сміття).
⚖️ Сценарій «Балансир балів»: спільний накопичувальний залік за шкалою XP із графічним перетягуванням каната.
🎡 «Рулетка долі»: розіграш призів та покарань наприкінці місяця.
🔢 «Лічильники дій»: автономні клікери з живим фотопідтвердженням через камеру, календарем та таймштампами.

Натисніть кнопкy нижче, щоб відкрити застосунок!`,
  });

  // 4. Set Short Description (shows in profile / share card)
  await callTelegramApi('setMyShortDescription', {
    short_description: 'DuoDone — змагальний блок, балансир XP балів та лічильники з фотофіксацією для пар! 🏓',
  });

  // 5. Set Bot Commands
  await callTelegramApi('setMyCommands', {
    commands: [
      { command: 'start', description: 'Відкрити DuoDone Mini App 🏓' },
      { command: 'help', description: 'Інструкція та підтримка ℹ️' },
    ],
  });

  // 6. Set Default Menu Button to open Web App directly
  await callTelegramApi('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Відкрити DuoDone 🏓',
      web_app: {
        url: WEB_APP_URL,
      },
    },
  });

  console.log('🎉 Telegram Bot fully configured!');
}

setupBot().catch(console.error);
