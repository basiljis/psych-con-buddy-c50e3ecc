UPDATE public.blog_posts
SET content = REPLACE(
  REPLACE(
    content,
    'Скрининг речевого развития по возрастным нормам — прямо в личном кабинете.',
    'Тесты развития ребёнка (0–18 лет), включая ориентиры по речи — прямо в личном кабинете.'
  ),
  'Подробнее — <a href="/for-parents">для родителей</a> и <a href="/pricing">тарифы</a> (от 330 ₽/мес). <a href="/auth">Создать кабинет →</a>',
  'Личный кабинет родителя — <strong>бесплатно</strong> (регистрация, тесты, запись, доступ к заключениям). Подписка нужна только специалистам и организациям — см. <a href="/pricing">тарифы</a>. Подробнее — <a href="/for-parents">для родителей</a>. <a href="/auth">Создать кабинет →</a>'
)
WHERE slug = 'kak-ponyat-chto-rebenku-nuzhen-logoped';

UPDATE public.blog_posts
SET content = REPLACE(
  content,
  'Подробный гид: <a href="/guides/pmpk-preparation">Подготовка к ПМПК</a>. См. также <a href="/for-parents">возможности для родителей</a> и <a href="/pricing">тарифы</a>. <a href="/auth">Создать кабинет →</a>',
  'Подробный гид: <a href="/guides/pmpk-preparation">Подготовка к ПМПК</a>. См. также <a href="/for-parents">возможности для родителей</a> — кабинет родителя бесплатный. <a href="/auth">Создать кабинет →</a>'
)
WHERE slug = 'podgotovka-k-pmpk';

UPDATE public.blog_posts
SET content = REPLACE(
  content,
  'Подробнее — <a href="/for-specialists">для специалистов</a> и <a href="/pricing">тарифы подписки</a>. <a href="/auth">Попробовать бесплатно →</a>',
  'Подробнее — <a href="/for-specialists">для специалистов</a> и <a href="/pricing">тарифы</a> (Специалист — 330 ₽/мес, Организация — 2 500 ₽/мес, бесплатный тариф — до 5 детей). <a href="/auth">Попробовать бесплатно →</a>'
)
WHERE slug = 'kak-provesti-ppk-v-shkole';

UPDATE public.blog_posts
SET content = REPLACE(
  content,
  'Подробнее — <a href="/for-organizations">для организаций</a> и <a href="/pricing">тарифы</a>. <a href="/auth">Оставить заявку →</a>',
  'Подробнее — <a href="/for-organizations">для организаций</a> и <a href="/pricing">тарифы</a> (Организация — от 2 500 ₽/мес за всю организацию, до 10 сотрудников; Корпоративный — по запросу). <a href="/auth">Оставить заявку →</a>'
)
WHERE slug = 'sluzhba-soprovozhdeniya-po-prikazu-666';