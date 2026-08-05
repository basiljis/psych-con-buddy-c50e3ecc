UPDATE blog_posts SET
content = replace(content,
'<h2>Что делать с результатами</h2>',
$$<h2>Какие тесты есть в системе прямо сейчас</h2>
<ul>
  <li><strong>«Мой ребёнок растёт»</strong> — базовый скрининг развития по 5 сферам (моторика, речь, познание, социальное и эмоциональное развитие). Родитель отвечает на вопросы о наблюдаемых навыках, результат нормируется по возрасту и выводится на радар-диаграмму.</li>
  <li><strong>«Стиль моего родительства»</strong> — тест о семейной среде как контекстуальном факторе развития. Его результаты подключаются к карточке ребёнка и помогают специалистам ППк точнее интерпретировать динамику и давать персональные рекомендации, а не шаблонные.</li>
</ul>
<p>Оба теста бесплатны, занимают 5–10 минут и доступны повторно — чтобы отслеживать динамику, а не разовый «снимок».</p>

<h2>Личный кабинет ребёнка: развитие через игру</h2>
<p>У ребёнка есть собственный вход в систему (отдельный логин и пароль, которые выдаёт родитель или специалист). Внутри — не «уроки», а игровые блоки заданий по тем же 5 сферам развития:</p>
<ul>
  <li><strong>Моторика</strong> — «Весёлые пальчики», «Ловкие ручки».</li>
  <li><strong>Речь</strong> — «Говорим правильно», «Учимся рассказывать».</li>
  <li><strong>Познание</strong> — «Умные задачки», «Тренируем память».</li>
  <li><strong>Общение</strong> — «Дружим вместе».</li>
  <li><strong>Эмоции</strong> — «Мои эмоции».</li>
</ul>
<p>Каждый блок — 4–5 коротких интерактивных заданий на 10–15 минут, с баллами и понятным прогрессом. Система фиксирует, что выполнено, сколько времени ушло и где ребёнок затрудняется — родитель и специалист видят это в карточке ребёнка. Игры не заменяют занятий со специалистом: это регулярная тренировка между встречами и дополнительный источник объективных данных о динамике.</p>

<h2>Что делать с результатами</h2>$$),
content_en = replace(content_en,
'<h2>What to do with the results</h2>',
$$<h2>Which tests are available right now</h2>
<ul>
  <li><strong>"My child is growing"</strong> — a baseline developmental screening across the 5 domains (motor, speech, cognition, social and emotional development). Parents answer questions about observed skills; results are age-normed and shown on a radar chart.</li>
  <li><strong>"My parenting style"</strong> — a questionnaire about the family environment as a contextual factor of development. Its results are linked to the child's record and help the school panel interpret progress accurately and give personalised, not templated, recommendations.</li>
</ul>
<p>Both tests are free, take 5–10 minutes and can be retaken to track dynamics rather than a one-off snapshot.</p>

<h2>The child's own account: development through play</h2>
<p>The child has a separate login (credentials issued by the parent or the specialist). Inside there are no "lessons" but playful task blocks covering the same 5 domains:</p>
<ul>
  <li><strong>Motor skills</strong> — "Happy fingers", "Nimble hands".</li>
  <li><strong>Speech</strong> — "Speaking correctly", "Learning to tell a story".</li>
  <li><strong>Cognition</strong> — "Smart puzzles", "Memory training".</li>
  <li><strong>Social skills</strong> — "Friends together".</li>
  <li><strong>Emotions</strong> — "My emotions".</li>
</ul>
<p>Each block contains 4–5 short interactive tasks (10–15 minutes) with points and clear progress. The system records what was completed, how long it took and where the child struggles — parents and specialists see this in the child's record. The games do not replace sessions with a specialist: they are regular practice between meetings and an extra source of objective data on progress.</p>

<h2>What to do with the results</h2>$$),
updated_at = now()
WHERE slug = 'roditel-v-universum-besplatnyy-kabinet';