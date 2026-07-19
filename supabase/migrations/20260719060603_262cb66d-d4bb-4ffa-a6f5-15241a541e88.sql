
-- Replace internal /legal/* anchors with verified primary sources.
UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/federal">Распоряжение Минпросвещения РФ № Р‑93 (2020)</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_333385/" target="_blank" rel="noopener">Распоряжение Минпросвещения РФ № Р‑93 (2019)</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/federal">Приказ Минпросвещения № 1082 (2022)</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_491014/" target="_blank" rel="noopener">Приказ Минпросвещения России № 763 (2024) — Положение о ПМПК</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/donm">Приказ ДОНМ № 666</a>',
  '<a href="https://docs.cntd.ru/document/351851591" target="_blank" rel="noopener">Приказ ДОНМ № 666</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/fgos">ФГОС НОО и ФГОС ОВЗ</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_175495/" target="_blank" rel="noopener">ФГОС НОО и ФГОС ОВЗ</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/security">152‑ФЗ «О персональных данных»</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_61801/" target="_blank" rel="noopener">152‑ФЗ «О персональных данных»</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/federal">Распоряжение Минпросвещения № Р‑93</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_333385/" target="_blank" rel="noopener">Распоряжение Минпросвещения № Р‑93</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/federal">Приказ № 1082</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_491014/" target="_blank" rel="noopener">Приказ № 763</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/fgos">ФГОС и ФГОС ОВЗ</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_175495/" target="_blank" rel="noopener">ФГОС и ФГОС ОВЗ</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/health">Методики Минздрава</a>',
  '<a href="https://minzdrav.gov.ru/documents" target="_blank" rel="noopener">Методики Минздрава</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/security">152‑ФЗ</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_61801/" target="_blank" rel="noopener">152‑ФЗ</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/security">ПП РФ № 1119</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_137356/" target="_blank" rel="noopener">ПП РФ № 1119</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/federal">№ 1082 (2022)</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_491014/" target="_blank" rel="noopener">№ 763 (2024)</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/security">согласие на обработку персональных данных</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_61801/" target="_blank" rel="noopener">согласие на обработку персональных данных</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/health">методикам Минздрава РФ</a>',
  '<a href="https://minzdrav.gov.ru/documents" target="_blank" rel="noopener">методикам Минздрава РФ</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/donm">ЦПМПК г. Москвы</a>',
  '<a href="https://gppc.ru/czpmpk/" target="_blank" rel="noopener">ЦПМПК г. Москвы</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/donm">ППк</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_333385/" target="_blank" rel="noopener">ППк</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/federal">ПМПК</a>',
  '<a href="https://www.consultant.ru/document/cons_doc_LAW_491014/" target="_blank" rel="noopener">ПМПК</a>');

UPDATE blog_posts SET content = replace(content,
  '<a href="/legal/health">Минздрава РФ</a>',
  '<a href="https://minzdrav.gov.ru/documents" target="_blank" rel="noopener">Минздрава РФ</a>');
