import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_TOKEN = '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const WEB_APP_URL = 'https://duodone-one.vercel.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).send('DuoDone Bot Webhook Running');
  }

  try {
    const update = req.body;
    if (update && update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const firstName = update.message.from?.first_name || 'Друже';

      if (text.startsWith('/start') || text.startsWith('/help')) {
        const parts = text.split(' ');
        const startParam = parts.length > 1 ? parts[1] : '';
        const appUrl = startParam ? `${WEB_APP_URL}?start=${encodeURIComponent(startParam)}` : WEB_APP_URL;

        const isAccept = startParam.startsWith('accept_');
        const welcomeMessage = isAccept
          ? `🤝 **Запрошення прийнято!**\n\nВітаємо у спільному просторі DuoDone! 🎉\nВи верифіковані як **Партнер №2**.\n\nТисни кнопку нижче, щоб увійти та розпочати спільний побут без суперечок! 🚀`
          : `🏓 Привіт, ${firstName}! Вітаємо у DuoDone — офіційній зоні побутового миру та справедливості! 🤝\n\nБільше жодних токсичних суперечок на тему «хто сто років не виносив сміття» та «хто залишив чашку у раковині» 😅\n\n🔥 Що тут на вас чекає:\n• 🏓 **Симетричний Пінг-понг**: помив посуд ➔ тапнув ➔ хід перелетів до партнера.\n• ⚖️ **XP Балансир**: заробляй бали за справи та перетягуй канат на свій бік.\n• 🎡 **Рулетка Долі**: наприкінці місяця той, хто програв, миє взуття або робить масаж 😈\n\nТисни кнопку нижче і розрулюй побут за 5 секунд! 🚀`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeMessage,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: isAccept ? '✅ Прийняти та відкрити DuoDone 🚀' : '🏓 Відкрити DuoDone Mini App 🚀',
                    web_app: { url: appUrl },
                  },
                ],
              ],
            },
          }),
        });
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  return res.status(200).json({ ok: true });
}
