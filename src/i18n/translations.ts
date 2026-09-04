export type Language = 'uk' | 'en' | 'pl' | 'de' | 'es' | 'fr' | 'ru';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'uk', name: 'Українська', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🌐' },
];

export const MONTH_NAMES: Record<Language, string[]> = {
  uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

export const DAY_NAMES: Record<Language, string[]> = {
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

export const CAT_QUOTES: Record<Language, { general: string[]; completion: string[] }> = {
  uk: {
    general: [
      'Підбивати підсумки краще за келихом вина 🍷 Але щоб не дійшло до суперечки! 😅',
      'Всесвіт надав вам другу половинку для кохання, а не для війни через посуд! 💖',
      'Побутовий конфлікт вирішується обіймами... і шматочком ковбаски 🍖',
      'Життя надто коротке, щоб сваритися через шкарпетки. Сходіть на фільм 🎬',
      'Забули винести сміття — закрутіть рулетку на масаж 💆‍♂️',
      'Кава у ліжко здатна пробачити непомиту пательню. Випробувано! ☕',
      'Замість суперечок про вечерю — просто замовте піцу. Родина ціла! 🍕',
      'Я Барсік Всемогутній і я наказую вам негайно обійнятися! 🐾'
    ],
    completion: [
      'Пишаюсь тобою! Ковбаска в холодильнику — твій трофей 🥩',
      'Ти — гордість Нації! Патруль чистоти передає подяку 🎖️',
      'І що, навіть нічого не розбив? Ну ти даєш! 😳',
      'Оце так швидкість! Пилосос аж від заздрощів розчулився 💨',
      'Герой дня! Тепер з чистою совістю можна пити каву ☕',
      'Хід передано! Тепер черга вашої другої половинки 🏓',
      'Так тримати! Очки XP нараховано, можна відкорковувати вино 🥂'
    ]
  },
  en: {
    general: [
      'Summing up the month is best done with a glass of wine 🍷 keep it cozy! 😅',
      'The universe gave you a partner for love, not for chore wars! 💖',
      'Household disputes are best solved with a hug... and a treat 🍖',
      'Life is too short to fight over socks. Go watch a movie 🎬',
      'Forgot the trash? Spin the roulette wheel for a back massage 💆‍♂️',
      'Coffee in bed forgives even an unwashed pan. Tested! ☕',
      'Instead of arguing over dinner — just order pizza! 🍕',
      'I am Barsik the Almighty and I order you to hug right now! 🐾'
    ],
    completion: [
      'Proud of you! The treat in the fridge is your earned trophy 🥩',
      'You are the hero of the house! Cleanliness patrol approves 🎖️',
      'And you didn\'t even break anything? Impressive! 😳',
      'Now that is speed! The vacuum cleaner is jealous 💨',
      'Hero of the day! Now relax with a cup of coffee ☕',
      'Turn passed! Now it\'s your partner\'s turn to shine 🏓',
      'Keep it up! XP points awarded, time to celebrate 🥂'
    ]
  },
  pl: {
    general: [
      'Podsumowanie miesiąca najlepiej robić przy kieliszku wina 🍷 😅',
      'Wszechświat dał ci drugą połówkę do miłości, a nie do wojen domowych! 💖',
      'Konflikty domowe rozwiązuje się przytuleniem... i przekąską 🍖',
      'Życie jest za krótkie na kłótnie o skarpetki. Idźcie na film 🎬',
      'Zapomniałeś wyjść ze śmieciami? Zakręć ruletką na masaż 💆‍♂️',
      'Kawa do łóżka wybacza nieumytą patelnię. Sprawdzone! ☕',
      'Zamiast spierać się o kolację — zamówcie pizzę! 🍕',
      'Jestem Barsik Wszechmogący i nakazuję wam się przytulić! 🐾'
    ],
    completion: [
      'Ddumny z ciebie! Smakołyk w lodówce to twoje trofeum 🥩',
      'Bohater domu! Patrol czystości przekazuje podziękowania 🎖️',
      'I nic nie rozbiłeś? Brawo! 😳',
      'Ale tempo! Odkurzacz aż się wzruszył 💨',
      'Bohater dnia! Czas na zasłużoną kawę ☕',
      'Kolej przekazana! Teraz ruch partnera 🏓',
      'Tak trzymać! Punkty XP przyznane 🥂'
    ]
  },
  de: {
    general: [
      'Monatsbilanz macht man am besten bei einem Glas Wein 🍷 😅',
      'Das Universum hat euch einander für die Liebe gegeben, nicht für Haushaltskriege! 💖',
      'Streit im Haushalt löst man mit einer Umarmung... und einem Snack 🍖',
      'Das Leben ist zu kurz für Sockendiskussionen. Geht ins Kino 🎬',
      'Müll vergessen? Dreht das Roulette für eine Massage 💆‍♂️',
      'Kaffee im Bett verzeiht jede ungespülte Pfanne. Getestet! ☕',
      'Statt Streit beim Abendessen — einfach Pizza bestellen! 🍕',
      'Ich bin Barsik der Allmächtige und befehle euch, euch zu umarmen! 🐾'
    ],
    completion: [
      'Stolz auf dich! Der Snack im Kühlschrank gehört dir 🥩',
      'Held des Tages! Die Sauberkeitspatrouille dankt 🎖️',
      'Und nichts ging kaputt? Respekt! 😳',
      'Was für ein Tempo! Der Staubsauger staunt 💨',
      'Erfolg! Jetzt entspannt einen Kaffee trinken ☕',
      'Zug abgegeben! Jetzt ist der Partner dran 🏓',
      'Weiter so! XP-Punkte wurden gutgeschrieben 🥂'
    ]
  },
  es: {
    general: [
      'Resumir el mes es mejor con una copa de vino 🍷 ¡mantén la paz! 😅',
      '¡El universo te dio tu pareja para amar, no para guerras domésticas! 💖',
      'Las discusiones de casa se resuelven con un abrazo... y un bocadillo 🍖',
      'La vida es corta para pelear por calcetines. Vean una película 🎬',
      '¿Olvidaste la basura? Gira la ruleta para un masaje 💆‍♂️',
      'El café en la cama perdona cualquier sartén sin lavar. ¡Comprobado! ☕',
      'En vez de discutir por la cena — ¡pidan pizza! 🍕',
      '¡Soy Barsik el Todopoderoso y ordeno que se abracen ahora! 🐾'
    ],
    completion: [
      '¡Orgulloso de ti! El premio en la nevera es tu trofeo 🥩',
      '¡Héroe de la casa! La patrulla de limpieza lo aprueba 🎖️',
      '¿Y no rompiste nada? ¡Impresionante! 😳',
      '¡Qué velocidad! La aspiradora se sorprende 💨',
      '¡Héroe del día! Hora de disfrutar un café ☕',
      '¡Turno pasado! Ahora le toca a tu pareja 🏓',
      '¡Sigue así! Puntos XP otorgados 🥂'
    ]
  },
  fr: {
    general: [
      'Faire le bilan du mois est plus doux avec un verre de vin 🍷 😅',
      'L\'univers vous a donné un partenaire pour aimer, pas pour faire la guerre du ménage ! 💖',
      'Les petits conflits se règlent par un câlin... et une gourmandise 🍖',
      'La vie est trop courte pour se disputer pour des chaussettes. Allez au cinéma 🎬',
      'Oublié les poubelles ? Tournez la roulette pour un massage 💆‍♂️',
      'Le café au lit fait tout pardonner. Testé et approuvé ! ☕',
      'Au lieu de discuter pour le dîner — commandez une pizza ! 🍕',
      'Je suis Barsik le Tout-Puissant et j\'ordonne un câlin immédiat ! 🐾'
    ],
    completion: [
      'Fier de toi ! La récompense dans le frigo est à toi 🥩',
      'Héros de la maison ! La patrouille de la propreté félicite 🎖️',
      'Et tu n\'as rien cassé ? Chapeau ! 😳',
      'Quelle rapidité ! L\'aspirateur est jaloux 💨',
      'Héros du jour ! Moment café mérité ☕',
      'Tour passé ! Au tour du partenaire de jouer 🏓',
      'Continue ainsi ! Points XP crédités 🥂'
    ]
  },
  ru: {
    general: [
      'Подводить итоги лучше за бокалом вина 🍷 Главное — сохранять уют! 😅',
      'Вселенная дала вам вторую половинку для любви, а не для войн из-за посуды! 💖',
      'Любой бытовой конфликт решается объятиями... и вкусняшкой 🍖',
      'Жизнь слишком коротка, чтобы спорить из-за носков. Сходите на фильм 🎬',
      'Забыли вынести мусор — закрутите рулетку на массаж 💆‍♂️',
      'Кофе в постель способен простить немытую сковороду. Проверено! ☕',
      'Вместо споров об ужине — просто закажите пиццу! 🍕',
      'Я Барсик Всемогущий и я приказываю вам немедленно обняться! 🐾'
    ],
    completion: [
      'Горжусь тобой! Вкусняшка в холодильнике — твой заслуженный трофей 🥩',
      'Ты — гордость дома! Патруль чистоты передает благодарность 🎖️',
      'И что, даже ничего не разбил? Ну ты даешь! 😳',
      'Вот это скорость! Пылесос аж растрогался 💨',
      'Герой дня! Теперь с чистой совестью можно пить кофе ☕',
      'Ход передан! Теперь очередь второй половинки показать класс 🏓',
      'Так держать! Очки XP начислены, время праздновать 🥂'
    ]
  }
};

export const translations: Record<Language, Record<string, string>> = {
  uk: {
    // Navigation
    nav_dashboard: 'Головна',
    nav_calendar: 'Календар',
    nav_roulette: 'Рулетка',
    nav_settings: 'Налаштування',
    badge_final: 'Фінал',

    // Header & User modal
    space_default: 'Наш затишний дім',
    edit_profile: 'Редагувати партнерів',
    active_partner: 'Активний профіль',
    switch_user_hint: 'Натисніть для перемикання активного партнера',
    edit_names_title: 'Імена та Фото Партнерів',
    edit_names_subtitle: 'Вкажіть власні імена та аватарки',
    who_are_you: 'Хто ви на цьому пристрої:',
    partner_1_label: '👨 Партнер 1',
    partner_2_label: '👩 Партнер 2',
    save_changes: 'Зберегти зміни',
    cancel: 'Скасувати',
    tg_id_bound: 'TG ID: Прив’язано під час входу',
    tg_id_invite: 'TG ID: Прив’язано при прийнятті запрошення',

    // Quick Start Banner
    quick_start_title: 'Все готово! Вводити нічого не треба 🎉',
    quick_start_desc: 'Ми вже створили для вашої пари готові завдання (🧽 Миття посуду, 🗑️ Виніс сміття) та лічильники. Тапай по кнопках і передавай хід!',
    quick_start_btn: 'Супер, погнали! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ До кінця циклу:',
    cycle_leading: 'Ви лідируєте з',
    cycle_trailing: 'Лідирує',
    cycle_tie: 'Рівна кількість балів:',
    cycle_finished_title: 'Раунд Завершено! 🏆',
    cycle_winner_msg: 'Ви чудово попрацювали цього циклу! 🌟',
    cycle_loser_msg: 'Нажаль, цього циклу удача була на боці партнера...',
    cycle_tie_msg: 'Нічия в балах! Рівна боротьба 🤝',
    go_to_roulette: 'Перейти до Рулетки 🎡',

    // Balancer Card
    balancer_title: 'Балансир хатніх справ (XP)',
    balancer_equal: 'Повна гармонія у внеску! ⚖️',
    balancer_lead: 'з перевагою у',

    // Tasks section
    tasks_section_title: 'Блок «DuoDone» (Черга завдань)',
    tasks_active_count: 'активних',
    tasks_empty: 'Немає закріплених завдань. Увімкніть їх у Налаштуваннях!',
    task_your_turn: 'Твоя черга робити! 👈',
    task_partner_turn: 'Черга партнера',
    task_done_btn: 'Зроблено! Передати хід 🚀',
    task_out_of_turn: 'Зробив позачергово! ⚡',

    // Counters section
    counters_section_title: 'Блок «Лічильники» (Плитки дій)',
    counters_on_screen: 'на екрані',
    counters_more: 'Більше лічильників',
    counters_hide: 'Сховати додаткові лічильники',

    // Calendar
    calendar_timeline_title: 'Стрічка подій за',
    calendar_events_count: 'подій',
    calendar_no_activity: 'В цей день активності не зафіксовано.',
    calendar_photo_btn: 'Фото',

    // Roulette Wheel
    roulette_final_title: 'Підсумки періоду (Фінал)',
    roulette_winner_label: 'Переможець циклу:',
    roulette_tie_label: 'Нічия в балах! Боротьба була рівною 🤝',
    roulette_prizes_tab: 'Призи (Переможцю)',
    roulette_penalties_tab: 'Штрафи (Поступаючому)',
    roulette_spin_btn: 'КРУТИТИ РУЛЕТКУ 🎡',
    roulette_spinning: 'Обертається...',
    roulette_winner_choice: 'Випадковий вибір долі:',
    roulette_cycle_question: 'Коли бажаєте завершити цикл?',
    roulette_weekly: '📅 Щотижня (7д)',
    roulette_monthly: '📆 Щомісяця (30д)',
    roulette_custom: '⚙️ Свій термін',
    roulette_off: '⏸️ Без таймера',
    roulette_set_custom: 'Встановити',
    roulette_days_input_ph: 'Кількість днів (напр. 40)',
    roulette_reset_cycle: 'Почати новий цикл 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Мудрість',
    cat_reaction_badge: 'Реакція 😼',
    cat_close_title: 'Сховати котика',

    // Settings
    settings_language: 'Мова застосунку / Language',
    settings_language_desc: 'Оберіть мову інтерфейсу для вашої пари',
    settings_cat: 'Кіт-Порадник 🐱',
    settings_cat_desc: 'Персональний помічник з гумором та порадами',
    settings_dashboard: 'Конфігуратор Головного Екрана ⚙️',
    settings_share: 'Запросити Партнера 📩',
    settings_tasks: 'Управління Завданнями DuoDone 🏓',
    settings_roulette: 'Управління Рулеткою 🎡',
    share_card_btn: 'Поділитись карткою у Telegram 📩',
    copy_invite_btn: 'Скопіювати текст запрошення 📋',
    invite_copied: 'Скопійовано! 📋',
  },
  en: {
    // Navigation
    nav_dashboard: 'Home',
    nav_calendar: 'Calendar',
    nav_roulette: 'Roulette',
    nav_settings: 'Settings',
    badge_final: 'Final',

    // Header & User modal
    space_default: 'Our Cozy Home',
    edit_profile: 'Edit Partners',
    active_partner: 'Active Profile',
    switch_user_hint: 'Tap to switch active partner',
    edit_names_title: 'Partner Names & Photos',
    edit_names_subtitle: 'Set custom names and avatars',
    who_are_you: 'Who are you on this device:',
    partner_1_label: '👨 Partner 1',
    partner_2_label: '👩 Partner 2',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    tg_id_bound: 'TG ID: Bound on login',
    tg_id_invite: 'TG ID: Bound on invite accept',

    // Quick Start Banner
    quick_start_title: 'All set! No configuration needed 🎉',
    quick_start_desc: 'We created ready-made tasks (🧽 Washing dishes, 🗑️ Taking out trash) and counters. Just tap and pass turns!',
    quick_start_btn: 'Awesome, let\'s go! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ Cycle ends in:',
    cycle_leading: 'You lead with',
    cycle_trailing: 'Leading:',
    cycle_tie: 'Equal scores:',
    cycle_finished_title: 'Round Completed! 🏆',
    cycle_winner_msg: 'You did an amazing job this cycle! 🌟',
    cycle_loser_msg: 'Unfortunately, luck was on your partner\'s side...',
    cycle_tie_msg: 'It\'s a tie! Great match 🤝',
    go_to_roulette: 'Go to Roulette 🎡',

    // Balancer Card
    balancer_title: 'Chore Balancer (XP)',
    balancer_equal: 'Perfect contribution balance! ⚖️',
    balancer_lead: 'leading by',

    // Tasks section
    tasks_section_title: '«DuoDone» Queue (Tasks)',
    tasks_active_count: 'active',
    tasks_empty: 'No pinned tasks. Enable them in Settings!',
    task_your_turn: 'Your turn to do it! 👈',
    task_partner_turn: 'Partner\'s turn',
    task_done_btn: 'Done! Pass turn 🚀',
    task_out_of_turn: 'Done out of turn! ⚡',

    // Counters section
    counters_section_title: '«Counters» Block (Action Tiles)',
    counters_on_screen: 'on screen',
    counters_more: 'More counters',
    counters_hide: 'Hide extra counters',

    // Calendar
    calendar_timeline_title: 'Activity timeline for',
    calendar_events_count: 'events',
    calendar_no_activity: 'No activity recorded on this day.',
    calendar_photo_btn: 'Photo',

    // Roulette Wheel
    roulette_final_title: 'Period Summary (Final)',
    roulette_winner_label: 'Cycle Winner:',
    roulette_tie_label: 'Tie score! Equal fight 🤝',
    roulette_prizes_tab: 'Prizes (Winner)',
    roulette_penalties_tab: 'Penalties (Runner-up)',
    roulette_spin_btn: 'SPIN THE WHEEL 🎡',
    roulette_spinning: 'Spinning...',
    roulette_winner_choice: 'Random choice of fate:',
    roulette_cycle_question: 'When do you want to end the cycle?',
    roulette_weekly: '📅 Weekly (7d)',
    roulette_monthly: '📆 Monthly (30d)',
    roulette_custom: '⚙️ Custom period',
    roulette_off: '⏸️ No timer',
    roulette_set_custom: 'Set',
    roulette_days_input_ph: 'Number of days (e.g. 40)',
    roulette_reset_cycle: 'Start New Cycle 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Wisdom',
    cat_reaction_badge: 'Reaction 😼',
    cat_close_title: 'Hide cat',

    // Settings
    settings_language: 'App Language / Language',
    settings_language_desc: 'Select interface language for your pair',
    settings_cat: 'Cat Counselor 🐱',
    settings_cat_desc: 'Personal AI helper with humor and tips',
    settings_dashboard: 'Dashboard Configurator ⚙️',
    settings_share: 'Invite Partner 📩',
    settings_tasks: 'Manage DuoDone Tasks 🏓',
    settings_roulette: 'Manage Roulette 🎡',
    share_card_btn: 'Share card on Telegram 📩',
    copy_invite_btn: 'Copy invite text 📋',
    invite_copied: 'Copied! 📋',
  },
  pl: {
    // Navigation
    nav_dashboard: 'Główna',
    nav_calendar: 'Kalendarz',
    nav_roulette: 'Ruletka',
    nav_settings: 'Ustawienia',
    badge_final: 'Finał',

    // Header & User modal
    space_default: 'Nasz przytulny dom',
    edit_profile: 'Edytuj partnerów',
    active_partner: 'Aktywny profil',
    switch_user_hint: 'Kliknij, aby przełączyć aktywnego partnera',
    edit_names_title: 'Imiona i Zdjęcia Partnerów',
    edit_names_subtitle: 'Ustaw własne imiona i awatary',
    who_are_you: 'Kim jesteś na tym urządzeniu:',
    partner_1_label: '👨 Partner 1',
    partner_2_label: '👩 Partner 2',
    save_changes: 'Zapisz zmiany',
    cancel: 'Anuluj',
    tg_id_bound: 'TG ID: Połączono podczas logowania',
    tg_id_invite: 'TG ID: Połączono po przyjęciu zaproszenia',

    // Quick Start Banner
    quick_start_title: 'Wszystko gotowe! Ниc nie trzeba wpisywać 🎉',
    quick_start_desc: 'Stworzyliśmy dla Was gotowe zadania (🧽 Mycie naczyń, 🗑️ Wynoszenie śmieci) i liczniki. Klikaj i przekazuj kolejkę!',
    quick_start_btn: 'Super, zaczynamy! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ Do końca cyklu:',
    cycle_leading: 'Prowadzisz z',
    cycle_trailing: 'Prowadzi:',
    cycle_tie: 'Równa liczba punktów:',
    cycle_finished_title: 'Runda Zakończona! 🏆',
    cycle_winner_msg: 'Wspaniale pracowałeś w tym cyklu! 🌟',
    cycle_loser_msg: 'Niestety, tym razem szczęście sprzyjało partnerowi...',
    cycle_tie_msg: 'Remis w punktach! Równa walka 🤝',
    go_to_roulette: 'Przejdź do Ruletki 🎡',

    // Balancer Card
    balancer_title: 'Balancer obowiązków (XP)',
    balancer_equal: 'Pełna harmonia wkładu! ⚖️',
    balancer_lead: 'z przewagą',

    // Tasks section
    tasks_section_title: 'Kolejka «DuoDone» (Zadania)',
    tasks_active_count: 'aktywnych',
    tasks_empty: 'Brak przypiętych zadań. Włącz je w Ustawieniach!',
    task_your_turn: 'Twoja kolej! 👈',
    task_partner_turn: 'Kolej partnera',
    task_done_btn: 'Zrobione! Przekaż kolejkę 🚀',
    task_out_of_turn: 'Zrobione poza kolejnością! ⚡',

    // Counters section
    counters_section_title: 'Blok «Liczniki» (Akcje)',
    counters_on_screen: 'na ekranie',
    counters_more: 'Więcej liczników',
    counters_hide: 'Ukryj dodatkowe liczniki',

    // Calendar
    calendar_timeline_title: 'Oś czasu aktywności dla',
    calendar_events_count: 'zdarzeń',
    calendar_no_activity: 'Brak aktywności w tym dniu.',
    calendar_photo_btn: 'Zdjęcie',

    // Roulette Wheel
    roulette_final_title: 'Podsumowanie okresu (Finał)',
    roulette_winner_label: 'Zwycięzca cyklu:',
    roulette_tie_label: 'Remis! Równa walka 🤝',
    roulette_prizes_tab: 'Nagrody (Dla Zwycięzcy)',
    roulette_penalties_tab: 'Kary (Dla Drugiego)',
    roulette_spin_btn: 'ZAKRĘĆ RULETKĄ 🎡',
    roulette_spinning: 'Obraca się...',
    roulette_winner_choice: 'Losowy wybór losu:',
    roulette_cycle_question: 'Kiedy chcesz zakończyć cykl?',
    roulette_weekly: '📅 Co tydzień (7d)',
    roulette_monthly: '📆 Co miesiąc (30d)',
    roulette_custom: '⚙️ Własny okres',
    roulette_off: '⏸️ Bez timera',
    roulette_set_custom: 'Ustaw',
    roulette_days_input_ph: 'Liczba dni (np. 40)',
    roulette_reset_cycle: 'Rozpocznij Nowy Cykl 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Mądrość',
    cat_reaction_badge: 'Reakcja 😼',
    cat_close_title: 'Ukryj kota',

    // Settings
    settings_language: 'Język aplikacji / Language',
    settings_language_desc: 'Wybierz język interfejsu dla Waszej pary',
    settings_cat: 'Kot Doradca 🐱',
    settings_cat_desc: 'Osobisty asystent z humorem i poradami',
    settings_dashboard: 'Konfigurator Ekranu Głównego ⚙️',
    settings_share: 'Zaproś Partnera 📩',
    settings_tasks: 'Zarządzanie Zadaniami DuoDone 🏓',
    settings_roulette: 'Zarządzanie Ruletką 🎡',
    share_card_btn: 'Udostępnij kartę na Telegramie 📩',
    copy_invite_btn: 'Skopiuj tekst zaproszenia 📋',
    invite_copied: 'Skopiowano! 📋',
  },
  de: {
    // Navigation
    nav_dashboard: 'Start',
    nav_calendar: 'Kalender',
    nav_roulette: 'Roulette',
    nav_settings: 'Einstellungen',
    badge_final: 'Finale',

    // Header & User modal
    space_default: 'Unser gemütliches Zuhause',
    edit_profile: 'Partner bearbeiten',
    active_partner: 'Aktives Profil',
    switch_user_hint: 'Tippen zum Wechseln des aktiven Partners',
    edit_names_title: 'Partnernamen & Fotos',
    edit_names_subtitle: 'Eigene Namen und Avatare festlegen',
    who_are_you: 'Wer sind Sie auf diesem Gerät:',
    partner_1_label: '👨 Partner 1',
    partner_2_label: '👩 Partner 2',
    save_changes: 'Änderungen speichern',
    cancel: 'Abbrechen',
    tg_id_bound: 'TG ID: Beim Login verknüpft',
    tg_id_invite: 'TG ID: Beim Einladungsbeitritt verknüpft',

    // Quick Start Banner
    quick_start_title: 'Alles bereit! Keine Einrichtung nötig 🎉',
    quick_start_desc: 'Wir haben bereits Aufgaben (🧽 Geschirr spülen, 🗑️ Müll rausbringen) und Zähler erstellt. Einfach tippen!',
    quick_start_btn: 'Super, los geht\'s! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ Zyklus endet in:',
    cycle_leading: 'Du führst mit',
    cycle_trailing: 'Es führt:',
    cycle_tie: 'Gleicher Punktestand:',
    cycle_finished_title: 'Runde Beendet! 🏆',
    cycle_winner_msg: 'Tolle Arbeit in diesem Zyklus! 🌟',
    cycle_loser_msg: 'Leider war das Glück diesmal beim Partner...',
    cycle_tie_msg: 'Unentschieden! Toller Kampf 🤝',
    go_to_roulette: 'Zum Roulette 🎡',

    // Balancer Card
    balancer_title: 'Haushalts-Balancer (XP)',
    balancer_equal: 'Perfekte Harmonie! ⚖️',
    balancer_lead: 'mit Vorsprung von',

    // Tasks section
    tasks_section_title: '«DuoDone» Warteschlange (Aufgaben)',
    tasks_active_count: 'aktiv',
    tasks_empty: 'Keine angehefteten Aufgaben. In Einstellungen aktivieren!',
    task_your_turn: 'Du bist dran! 👈',
    task_partner_turn: 'Partner ist dran',
    task_done_btn: 'Erledigt! Weitergeben 🚀',
    task_out_of_turn: 'Außer der Reihe erledigt! ⚡',

    // Counters section
    counters_section_title: '«Zähler» Block (Aktionskacheln)',
    counters_on_screen: 'auf dem Bildschirm',
    counters_more: 'Mehr Zähler',
    counters_hide: 'Zusätzliche Zähler verbergen',

    // Calendar
    calendar_timeline_title: 'Aktivitäts-Zeitleiste für',
    calendar_events_count: 'Ereignisse',
    calendar_no_activity: 'An diesem Tag wurde keine Aktivität aufgezeichnet.',
    calendar_photo_btn: 'Foto',

    // Roulette Wheel
    roulette_final_title: 'Periodenübersicht (Finale)',
    roulette_winner_label: 'Zyklussieger:',
    roulette_tie_label: 'Unentschieden! Ausgeglichener Kampf 🤝',
    roulette_prizes_tab: 'Preise (Für Sieger)',
    roulette_penalties_tab: 'Strafen (Für Zweiten)',
    roulette_spin_btn: 'RAD DREHEN 🎡',
    roulette_spinning: 'Dreht sich...',
    roulette_winner_choice: 'Zufällige Wahl des Schicksals:',
    roulette_cycle_question: 'Wann möchten Sie den Zyklus beenden?',
    roulette_weekly: '📅 Wöchentlich (7T)',
    roulette_monthly: '📆 Monatlich (30T)',
    roulette_custom: '⚙️ Eigener Zeitraum',
    roulette_off: '⏸️ Ohne Timer',
    roulette_set_custom: 'Festlegen',
    roulette_days_input_ph: 'Anzahl Tage (z.B. 40)',
    roulette_reset_cycle: 'Neuen Zyklus Starten 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Weisheit',
    cat_reaction_badge: 'Reaktion 😼',
    cat_close_title: 'Katze ausblenden',

    // Settings
    settings_language: 'App-Sprache / Language',
    settings_language_desc: 'Wählen Sie die Sprache für Ihr Paar',
    settings_cat: 'Katzen-Ratgeber 🐱',
    settings_cat_desc: 'Persönlicher Helfer mit Humor und Tipps',
    settings_dashboard: 'Startbildschirm-Konfigurator ⚙️',
    settings_share: 'Partner einladen 📩',
    settings_tasks: 'DuoDone Aufgaben verwalten 🏓',
    settings_roulette: 'Roulette verwalten 🎡',
    share_card_btn: 'Karte auf Telegram teilen 📩',
    copy_invite_btn: 'Einladungstext kopieren 📋',
    invite_copied: 'Kopiert! 📋',
  },
  es: {
    // Navigation
    nav_dashboard: 'Inicio',
    nav_calendar: 'Calendario',
    nav_roulette: 'Ruleta',
    nav_settings: 'Ajustes',
    badge_final: 'Final',

    // Header & User modal
    space_default: 'Nuestro acogedor hogar',
    edit_profile: 'Editar parejas',
    active_partner: 'Perfil activo',
    switch_user_hint: 'Toca para cambiar de pareja activa',
    edit_names_title: 'Nombres y Fotos de Parejas',
    edit_names_subtitle: 'Define nombres y avatares personalizados',
    who_are_you: 'Quién eres en este dispositivo:',
    partner_1_label: '👨 Pareja 1',
    partner_2_label: '👩 Pareja 2',
    save_changes: 'Guardar cambios',
    cancel: 'Cancelar',
    tg_id_bound: 'TG ID: Vinculado al iniciar sesión',
    tg_id_invite: 'TG ID: Vinculado al aceptar invitación',

    // Quick Start Banner
    quick_start_title: '¡Todo listo! Sin configuración 🎉',
    quick_start_desc: 'Hemos creado tareas listas (🧽 Lavar platos, 🗑️ Sacar basura) y contadores. ¡Solo toca y pasa el turno!',
    quick_start_btn: '¡Genial, vamos! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ El ciclo termina en:',
    cycle_leading: 'Lideras con',
    cycle_trailing: 'Lidera:',
    cycle_tie: 'Puntuación igualada:',
    cycle_finished_title: '¡Ronda Completada! 🏆',
    cycle_winner_msg: '¡Hiciste un trabajo increíble en este ciclo! 🌟',
    cycle_loser_msg: 'Lamentablemente, la suerte estuvo del lado de tu pareja...',
    cycle_tie_msg: '¡Empate! Gran combate 🤝',
    go_to_roulette: 'Ir a la Ruleta 🎡',

    // Balancer Card
    balancer_title: 'Balanceador de tareas (XP)',
    balancer_equal: '¡Armonía perfecta en la contribución! ⚖️',
    balancer_lead: 'con ventaja de',

    // Tasks section
    tasks_section_title: 'Cola «DuoDone» (Tareas)',
    tasks_active_count: 'activas',
    tasks_empty: 'No hay tareas fijadas. ¡Actívalas en Ajustes!',
    task_your_turn: '¡Es tu turno de hacerlo! 👈',
    task_partner_turn: 'Turno de la pareja',
    task_done_btn: '¡Hecho! Pasar turno 🚀',
    task_out_of_turn: '¡Hecho fuera de turno! ⚡',

    // Counters section
    counters_section_title: 'Bloque «Contadores» (Acciones)',
    counters_on_screen: 'en pantalla',
    counters_more: 'Más contadores',
    counters_hide: 'Ocultar contadores extra',

    // Calendar
    calendar_timeline_title: 'Línea de tiempo para',
    calendar_events_count: 'eventos',
    calendar_no_activity: 'No hay actividad registrada este día.',
    calendar_photo_btn: 'Foto',

    // Roulette Wheel
    roulette_final_title: 'Resumen del período (Final)',
    roulette_winner_label: 'Ganador del ciclo:',
    roulette_tie_label: '¡Empate! Lucha igualada 🤝',
    roulette_prizes_tab: 'Premios (Ganador)',
    roulette_penalties_tab: 'Penalizaciones (Segundo)',
    roulette_spin_btn: 'GIRAR LA RULETA 🎡',
    roulette_spinning: 'Girando...',
    roulette_winner_choice: 'Elección aleatoria del destino:',
    roulette_cycle_question: '¿Cuándo deseas terminar el ciclo?',
    roulette_weekly: '📅 Semanal (7d)',
    roulette_monthly: '📆 Mensual (30d)',
    roulette_custom: '⚙️ Período propio',
    roulette_off: '⏸️ Sin temporizador',
    roulette_set_custom: 'Establecer',
    roulette_days_input_ph: 'Número de días (ej. 40)',
    roulette_reset_cycle: 'Iniciar Nuevo Ciclo 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Sabiduría',
    cat_reaction_badge: 'Reacción 😼',
    cat_close_title: 'Ocultar gato',

    // Settings
    settings_language: 'Idioma de la App / Language',
    settings_language_desc: 'Elige el idioma de interfaz para tu pareja',
    settings_cat: 'Gato Consejero 🐱',
    settings_cat_desc: 'Asistente personal con humor y consejos',
    settings_dashboard: 'Configurador de Inicio ⚙️',
    settings_share: 'Invitar Pareja 📩',
    settings_tasks: 'Gestionar Tareas DuoDone 🏓',
    settings_roulette: 'Gestionar Ruleta 🎡',
    share_card_btn: 'Compartir tarjeta en Telegram 📩',
    copy_invite_btn: 'Copiar texto de invitación 📋',
    invite_copied: '¡Copiado! 📋',
  },
  fr: {
    // Navigation
    nav_dashboard: 'Accueil',
    nav_calendar: 'Calendrier',
    nav_roulette: 'Roulette',
    nav_settings: 'Paramètres',
    badge_final: 'Finale',

    // Header & User modal
    space_default: 'Notre maison douillette',
    edit_profile: 'Modifier les partenaires',
    active_partner: 'Profil actif',
    switch_user_hint: 'Appuyez pour changer de partenaire actif',
    edit_names_title: 'Noms et Photos des Partenaires',
    edit_names_subtitle: 'Définissez vos noms et avatars',
    who_are_you: 'Qui êtes-vous sur cet appareil :',
    partner_1_label: '👨 Partenaire 1',
    partner_2_label: '👩 Partenaire 2',
    save_changes: 'Enregistrer les modifications',
    cancel: 'Annuler',
    tg_id_bound: 'TG ID : Lié à la connexion',
    tg_id_invite: 'TG ID : Lié lors de l\'acceptation',

    // Quick Start Banner
    quick_start_title: 'Tout est prêt ! Pas de config requise 🎉',
    quick_start_desc: 'Nous avons créé des tâches prêtes (🧽 Vaisselle, 🗑️ Poubelles) et des compteurs. Appuyez et passez le tour !',
    quick_start_btn: 'Super, c\'est parti ! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ Le cycle se termine dans :',
    cycle_leading: 'Vous menez avec',
    cycle_trailing: 'En tête :',
    cycle_tie: 'Score égal :',
    cycle_finished_title: 'Manche Terminée ! 🏆',
    cycle_winner_msg: 'Vous avez fait un travail incroyable ce cycle ! 🌟',
    cycle_loser_msg: 'Malheureusement, la chance était du côté de votre partenaire...',
    cycle_tie_msg: 'Égalité parfaite ! Beau match 🤝',
    go_to_roulette: 'Aller à la Roulette 🎡',

    // Balancer Card
    balancer_title: 'Équilibreur de tâches (XP)',
    balancer_equal: 'Harmonie parfaite dans les contributions ! ⚖️',
    balancer_lead: 'avec une avance de',

    // Tasks section
    tasks_section_title: 'File d\'attente «DuoDone» (Tâches)',
    tasks_active_count: 'actives',
    tasks_empty: 'Aucune tâche épinglée. Activez-les dans les Paramètres !',
    task_your_turn: 'C\'est votre tour ! 👈',
    task_partner_turn: 'Tour du partenaire',
    task_done_btn: 'Fait ! Passer le tour 🚀',
    task_out_of_turn: 'Fait hors tour ! ⚡',

    // Counters section
    counters_section_title: 'Bloc «Compteurs» (Tuiles d\'action)',
    counters_on_screen: 'à l\'écran',
    counters_more: 'Plus de compteurs',
    counters_hide: 'Masquer les compteurs extra',

    // Calendar
    calendar_timeline_title: 'Chronologie des activités pour',
    calendar_events_count: 'événements',
    calendar_no_activity: 'Aucune activité enregistrée ce jour.',
    calendar_photo_btn: 'Photo',

    // Roulette Wheel
    roulette_final_title: 'Résumé de la période (Finale)',
    roulette_winner_label: 'Gagnant du cycle :',
    roulette_tie_label: 'Égalité ! Match serré 🤝',
    roulette_prizes_tab: 'Prix (Pour le gagnant)',
    roulette_penalties_tab: 'Pénalités (Pour le second)',
    roulette_spin_btn: 'TOURNER LA ROULETTE 🎡',
    roulette_spinning: 'Tourne...',
    roulette_winner_choice: 'Choix aléatoire du destin :',
    roulette_cycle_question: 'Quand souhaitez-vous terminer le cycle ?',
    roulette_weekly: '📅 Hebdomadaire (7j)',
    roulette_monthly: '📆 Mensuel (30j)',
    roulette_custom: '⚙️ Période personnalisée',
    roulette_off: '⏸️ Sans minuteur',
    roulette_set_custom: 'Définir',
    roulette_days_input_ph: 'Nombre de jours (ex. 40)',
    roulette_reset_cycle: 'Démarrer un Nouveau Cycle 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Sagesse',
    cat_reaction_badge: 'Réaction 😼',
    cat_close_title: 'Masquer le chat',

    // Settings
    settings_language: 'Langue de l\'App / Language',
    settings_language_desc: 'Choisissez la langue d\'interface pour votre couple',
    settings_cat: 'Chat Conseiller 🐱',
    settings_cat_desc: 'Assistant personnel avec humour et conseils',
    settings_dashboard: 'Configurateur d\'Accueil ⚙️',
    settings_share: 'Inviter un Partenaire 📩',
    settings_tasks: 'Gérer les Tâches DuoDone 🏓',
    settings_roulette: 'Gérer la Roulette 🎡',
    share_card_btn: 'Partager la carte sur Telegram 📩',
    copy_invite_btn: 'Copier le texte d\'invitation 📋',
    invite_copied: 'Copié ! 📋',
  },
  ru: {
    // Navigation
    nav_dashboard: 'Главная',
    nav_calendar: 'Календарь',
    nav_roulette: 'Рулетка',
    nav_settings: 'Настройки',
    badge_final: 'Финал',

    // Header & User modal
    space_default: 'Наш уютный дом',
    edit_profile: 'Редактировать партнеров',
    active_partner: 'Активный профиль',
    switch_user_hint: 'Нажмите для переключения активного партнера',
    edit_names_title: 'Имена и Фото Партнеров',
    edit_names_subtitle: 'Укажите имена и аватарки',
    who_are_you: 'Кто вы на этом устройстве:',
    partner_1_label: '👨 Партнер 1',
    partner_2_label: '👩 Партнер 2',
    save_changes: 'Сохранить изменения',
    cancel: 'Отмена',
    tg_id_bound: 'TG ID: Привязано при входе',
    tg_id_invite: 'TG ID: Привязано при принятии приглашения',

    // Quick Start Banner
    quick_start_title: 'Все готово! Вводить ничего не нужно 🎉',
    quick_start_desc: 'Мы уже создали для вашей пары готовые задачи (🧽 Мытье посуды, 🗑️ Вынос мусора) и счетчики. Тапай по кнопкам и передавай ход!',
    quick_start_btn: 'Супер, погнали! 🚀',

    // Cycle Banner
    cycle_countdown: '⏳ До конца цикла:',
    cycle_leading: 'Вы лидируете с',
    cycle_trailing: 'Лидирует:',
    cycle_tie: 'Равное количество баллов:',
    cycle_finished_title: 'Раунд Завершен! 🏆',
    cycle_winner_msg: 'Вы отлично поработали в этом цикле! 🌟',
    cycle_loser_msg: 'К сожалению, в этом цикле удача была на стороне партнера...',
    cycle_tie_msg: 'Ничья по баллам! Равная борьба 🤝',
    go_to_roulette: 'Перейти к Рулетке 🎡',

    // Balancer Card
    balancer_title: 'Балансир бытовых дел (XP)',
    balancer_equal: 'Полная гармония во вкладе! ⚖️',
    balancer_lead: 'с преимуществом в',

    // Tasks section
    tasks_section_title: 'Блок «DuoDone» (Очередь задач)',
    tasks_active_count: 'активных',
    tasks_empty: 'Нет закрепленных задач. Включите их в Настройках!',
    task_your_turn: 'Твоя очередь делать! 👈',
    task_partner_turn: 'Очередь партнера',
    task_done_btn: 'Сделано! Передать ход 🚀',
    task_out_of_turn: 'Сделано вне очереди! ⚡',

    // Counters section
    counters_section_title: 'Блок «Счетчики» (Плитки действий)',
    counters_on_screen: 'на экране',
    counters_more: 'Больше счетчиков',
    counters_hide: 'Скрыть дополнительные счетчики',

    // Calendar
    calendar_timeline_title: 'Лента событий за',
    calendar_events_count: 'событий',
    calendar_no_activity: 'В этот день активности не зафиксировано.',
    calendar_photo_btn: 'Фото',

    // Roulette Wheel
    roulette_final_title: 'Итоги периода (Финал)',
    roulette_winner_label: 'Победитель цикла:',
    roulette_tie_label: 'Ничья по баллам! Борьба была равной 🤝',
    roulette_prizes_tab: 'Призы (Победителю)',
    roulette_penalties_tab: 'Штрафы (Уступающему)',
    roulette_spin_btn: 'КРУТИТЬ РУЛЕТКУ 🎡',
    roulette_spinning: 'Вращается...',
    roulette_winner_choice: 'Случайный выбор судьбы:',
    roulette_cycle_question: 'Когда хотите завершить цикл?',
    roulette_weekly: '📅 Еженедельно (7д)',
    roulette_monthly: '📆 Ежемесячно (30д)',
    roulette_custom: '⚙️ Свой срок',
    roulette_off: '⏸️ Без таймера',
    roulette_set_custom: 'Установить',
    roulette_days_input_ph: 'Количество дней (напр. 40)',
    roulette_reset_cycle: 'Начать новый цикл 🔄',

    // Cat counselor
    cat_wisdom_badge: 'Мудрость',
    cat_reaction_badge: 'Реакция 😼',
    cat_close_title: 'Скрыть котика',

    // Settings
    settings_language: 'Язык приложения / Language',
    settings_language_desc: 'Выберите язык интерфейса для вашей пары',
    settings_cat: 'Кот-Советник 🐱',
    settings_cat_desc: 'Персональный помощник с юмором и советами',
    settings_dashboard: 'Конфигуратор Главного Экрана ⚙️',
    settings_share: 'Пригласить Партнера 📩',
    settings_tasks: 'Управление Задачами DuoDone 🏓',
    settings_roulette: 'Управление Рулеткой 🎡',
    share_card_btn: 'Поделиться карточкой в Telegram 📩',
    copy_invite_btn: 'Скопировать текст приглашения 📋',
    invite_copied: 'Скопировано! 📋',
  },
};

export function getTranslation(lang: Language, key: string, params?: Record<string, string | number>): string {
  const langDict = translations[lang] || translations.uk;
  let text = langDict[key] || translations.uk[key] || key;
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
    });
  }
  return text;
}
