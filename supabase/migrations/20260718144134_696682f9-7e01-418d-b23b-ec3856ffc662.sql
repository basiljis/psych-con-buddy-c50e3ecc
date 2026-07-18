-- Заменяем ссылки на /auth в статьях блога на /register (страница выбора роли).
-- Для родительских контекстов - прямая ссылка на /parent-auth.
UPDATE public.blog_posts
SET content = REPLACE(content, 'href="/auth">Создать кабинет', 'href="/parent-auth">Создать кабинет родителя'),
    excerpt = REPLACE(excerpt, 'href="/auth">Создать кабинет', 'href="/parent-auth">Создать кабинет родителя')
WHERE category IN ('parents');

UPDATE public.blog_posts
SET content = REPLACE(content, 'href="/auth"', 'href="/register"'),
    excerpt = REPLACE(excerpt, 'href="/auth"', 'href="/register"');