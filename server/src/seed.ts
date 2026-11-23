import { run, uid } from './db.js';

type Lang = 'uk' | 'en';

const SEED = {
  uk: {
    tasks: [
      { emoji: '🍽️', title: 'Помити посуд', xp: 2, photo: 0 },
      { emoji: '🗑️', title: 'Винести сміття', xp: 1, photo: 0 },
      { emoji: '🧺', title: 'Попрати білизну', xp: 3, photo: 1 },
      { emoji: '🍳', title: 'Приготувати вечерю', xp: 4, photo: 0 },
      { emoji: '🛏️', title: 'Застелити ліжко', xp: 1, photo: 0 },
    ],
    counters: [
      { emoji: '🧹', title: 'Пилососіння', step: 1, xp: 2, photo: 'none', show: 1 },
      { emoji: '🪟', title: 'Миття вікон', step: 1, xp: 3, photo: 'optional', show: 1 },
      { emoji: '🪴', title: 'Полити квіти', step: 1, xp: 1, photo: 'none', show: 1 },
      { emoji: '🛒', title: 'Закупка продуктів', step: 1, xp: 2, photo: 'optional', show: 1 },
      { emoji: '🐾', title: 'Вигул улюбленця', step: 1, xp: 1, photo: 'none', show: 0 },
    ],
    reward: ['Масаж 15 хвилин 💆', 'Сніданок у ліжко 🥐', 'Вибір фільму на вечір 🎬', 'Вечір без справ 🛋️', 'Улюблений десерт 🍰'],
    penalty: ['Помити посуд 2 дні поспіль 🍽️', 'Прибрати ванну 🛁', 'Приготувати вечерю 🍝', 'Винести сміття весь тиждень 🗑️', 'Зробити каву партнеру зранку ☕'],
  },
  en: {
    tasks: [
      { emoji: '🍽️', title: 'Wash the dishes', xp: 2, photo: 0 },
      { emoji: '🗑️', title: 'Take out the trash', xp: 1, photo: 0 },
      { emoji: '🧺', title: 'Do the laundry', xp: 3, photo: 1 },
      { emoji: '🍳', title: 'Cook dinner', xp: 4, photo: 0 },
      { emoji: '🛏️', title: 'Make the bed', xp: 1, photo: 0 },
    ],
    counters: [
      { emoji: '🧹', title: 'Vacuuming', step: 1, xp: 2, photo: 'none', show: 1 },
      { emoji: '🪟', title: 'Window cleaning', step: 1, xp: 3, photo: 'optional', show: 1 },
      { emoji: '🪴', title: 'Water the plants', step: 1, xp: 1, photo: 'none', show: 1 },
      { emoji: '🛒', title: 'Grocery run', step: 1, xp: 2, photo: 'optional', show: 1 },
      { emoji: '🐾', title: 'Walk the pet', step: 1, xp: 1, photo: 'none', show: 0 },
    ],
    reward: ['15-minute massage 💆', 'Breakfast in bed 🥐', 'Pick tonight’s movie 🎬', 'Chore-free evening 🛋️', 'Favourite dessert 🍰'],
    penalty: ['Dishes two days in a row 🍽️', 'Clean the bathroom 🛁', 'Cook dinner 🍝', 'Trash duty all week 🗑️', 'Morning coffee for partner ☕'],
  },
};

export function seedSpace(spaceId: string, lang: Lang) {
  const s = SEED[lang] || SEED.uk;
  const now = Date.now();
  s.tasks.forEach((t, i) =>
    run(
      `INSERT INTO tasks (id, space_id, emoji, title, xp, photo_required, turn_role, sort, created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      uid(),
      spaceId,
      t.emoji,
      t.title,
      t.xp,
      t.photo,
      i % 2 === 0 ? 'p1' : 'p2',
      i,
      now + i,
    ),
  );
  s.counters.forEach((c, i) =>
    run(
      `INSERT INTO counters (id, space_id, emoji, title, step, xp, photo_mode, show_on_dashboard, sort, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      uid(),
      spaceId,
      c.emoji,
      c.title,
      c.step,
      c.xp,
      c.photo,
      c.show,
      i,
      now + i,
    ),
  );
  for (const [pool, items] of [
    ['reward', s.reward],
    ['penalty', s.penalty],
  ] as const) {
    items.forEach((text, i) =>
      run(`INSERT INTO roulette (id, space_id, pool, text, created_at) VALUES (?,?,?,?,?)`, uid(), spaceId, pool, text, now + i),
    );
  }
}

export const DEFAULT_NAMES = {
  uk: { p1: 'Партнер 1', p2: 'Партнер 2', cat: 'Мурчик' },
  en: { p1: 'Partner 1', p2: 'Partner 2', cat: 'Whiskers' },
};

const TEMPLATE_NAMES = new Set(['партнер', 'партнер 1', 'партнер 2', 'partner', 'partner 1', 'partner 2', '']);
export const isTemplateName = (n: string | null | undefined) => TEMPLATE_NAMES.has((n || '').trim().toLowerCase());
