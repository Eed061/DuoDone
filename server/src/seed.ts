import { run, uid } from './db.js';

export type Lang = 'uk' | 'en' | 'pl' | 'de' | 'es';

export function normalizeLang(raw?: unknown): Lang {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .slice(0, 2);
  if (s === 'en' || s === 'pl' || s === 'de' || s === 'es') return s;
  return 'uk';
}

const SEED: Record<
  Lang,
  {
    tasks: { emoji: string; title: string; xp: number; photo: number }[];
    counters: { emoji: string; title: string; step: number; xp: number; photo: string; show: number }[];
    reward: string[];
    penalty: string[];
  }
> = {
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
  pl: {
    tasks: [
      { emoji: '🍽️', title: 'Umyć naczynia', xp: 2, photo: 0 },
      { emoji: '🗑️', title: 'Wynieść śmieci', xp: 1, photo: 0 },
      { emoji: '🧺', title: 'Zrobić pranie', xp: 3, photo: 1 },
      { emoji: '🍳', title: 'Ugotować kolację', xp: 4, photo: 0 },
      { emoji: '🛏️', title: 'Pościelić łóżko', xp: 1, photo: 0 },
    ],
    counters: [
      { emoji: '🧹', title: 'Odkurzanie', step: 1, xp: 2, photo: 'none', show: 1 },
      { emoji: '🪟', title: 'Mycie okien', step: 1, xp: 3, photo: 'optional', show: 1 },
      { emoji: '🪴', title: 'Podlać kwiaty', step: 1, xp: 1, photo: 'none', show: 1 },
      { emoji: '🛒', title: 'Zakupy spożywcze', step: 1, xp: 2, photo: 'optional', show: 1 },
      { emoji: '🐾', title: 'Spacer z pupilem', step: 1, xp: 1, photo: 'none', show: 0 },
    ],
    reward: ['Masaż 15 minut 💆', 'Śniadanie do łóżka 🥐', 'Wybór filmu na wieczór 🎬', 'Wieczór bez obowiązków 🛋️', 'Ulubiony deser 🍰'],
    penalty: ['Zmywanie 2 dni z rzędu 🍽️', 'Sprzątanie łazienki 🛁', 'Ugotować kolację 🍝', 'Śmieci przez cały tydzień 🗑️', 'Poranna kawa dla partnera ☕'],
  },
  de: {
    tasks: [
      { emoji: '🍽️', title: 'Geschirr spülen', xp: 2, photo: 0 },
      { emoji: '🗑️', title: 'Müll rausbringen', xp: 1, photo: 0 },
      { emoji: '🧺', title: 'Wäsche waschen', xp: 3, photo: 1 },
      { emoji: '🍳', title: 'Abendessen kochen', xp: 4, photo: 0 },
      { emoji: '🛏️', title: 'Bett machen', xp: 1, photo: 0 },
    ],
    counters: [
      { emoji: '🧹', title: 'Staubsaugen', step: 1, xp: 2, photo: 'none', show: 1 },
      { emoji: '🪟', title: 'Fenster putzen', step: 1, xp: 3, photo: 'optional', show: 1 },
      { emoji: '🪴', title: 'Pflanzen gießen', step: 1, xp: 1, photo: 'none', show: 1 },
      { emoji: '🛒', title: 'Einkaufen', step: 1, xp: 2, photo: 'optional', show: 1 },
      { emoji: '🐾', title: 'Gassi gehen', step: 1, xp: 1, photo: 'none', show: 0 },
    ],
    reward: ['15 Min. Massage 💆', 'Frühstück ans Bett 🥐', 'Film für heute Abend wählen 🎬', 'Freier Abend ohne Pflichten 🛋️', 'Lieblingsdessert 🍰'],
    penalty: ['2 Tage hintereinander spülen 🍽️', 'Bad putzen 🛁', 'Abendessen kochen 🍝', 'Eine Woche lang Müll 🗑️', 'Morgenkaffee für Partner ☕'],
  },
  es: {
    tasks: [
      { emoji: '🍽️', title: 'Lavar los platos', xp: 2, photo: 0 },
      { emoji: '🗑️', title: 'Sacar la basura', xp: 1, photo: 0 },
      { emoji: '🧺', title: 'Hacer la colada', xp: 3, photo: 1 },
      { emoji: '🍳', title: 'Preparar la cena', xp: 4, photo: 0 },
      { emoji: '🛏️', title: 'Hacer la cama', xp: 1, photo: 0 },
    ],
    counters: [
      { emoji: '🧹', title: 'Pasar la aspiradora', step: 1, xp: 2, photo: 'none', show: 1 },
      { emoji: '🪟', title: 'Limpiar ventanas', step: 1, xp: 3, photo: 'optional', show: 1 },
      { emoji: '🪴', title: 'Regar las plantas', step: 1, xp: 1, photo: 'none', show: 1 },
      { emoji: '🛒', title: 'Hacer la compra', step: 1, xp: 2, photo: 'optional', show: 1 },
      { emoji: '🐾', title: 'Pasear a la mascota', step: 1, xp: 1, photo: 'none', show: 0 },
    ],
    reward: ['Masaje de 15 minutos 💆', 'Desayuno en la cama 🥐', 'Elegir la película de hoy 🎬', 'Tarde libre sin tareas 🛋️', 'Postre favorito 🍰'],
    penalty: ['Lavar platos 2 días seguidos 🍽️', 'Limpiar el baño 🛁', 'Preparar la cena 🍝', 'Basura toda la semana 🗑️', 'Café por la mañana para tu pareja ☕'],
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

export const DEFAULT_NAMES: Record<Lang, { p1: string; p2: string; cat: string; home: string }> = {
  uk: { p1: 'Партнер 1', p2: 'Партнер 2', cat: 'Мурчик', home: 'Наш затишний дім' },
  en: { p1: 'Partner 1', p2: 'Partner 2', cat: 'Whiskers', home: 'Our cozy home' },
  pl: { p1: 'Partner 1', p2: 'Partner 2', cat: 'Mruczek', home: 'Nasz przytulny dom' },
  de: { p1: 'Partner 1', p2: 'Partner 2', cat: 'Schnurrli', home: 'Unser gemütliches Zuhause' },
  es: { p1: 'Pareja 1', p2: 'Pareja 2', cat: 'Michi', home: 'Nuestro hogar acogedor' },
};

const TEMPLATE_NAMES = new Set([
  'партнер',
  'партнер 1',
  'партнер 2',
  'partner',
  'partner 1',
  'partner 2',
  'pareja',
  'pareja 1',
  'pareja 2',
  '',
]);
export const isTemplateName = (n: string | null | undefined) => TEMPLATE_NAMES.has((n || '').trim().toLowerCase());
