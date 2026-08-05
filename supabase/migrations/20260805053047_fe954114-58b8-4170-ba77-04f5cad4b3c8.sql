UPDATE blog_posts SET content_en = replace(content_en,
'<h2>What to do with results</h2>',
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

<h2>What to do with results</h2>$$),
updated_at = now()
WHERE slug = 'roditel-v-universum-besplatnyy-kabinet';