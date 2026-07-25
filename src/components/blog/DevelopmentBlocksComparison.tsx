import { Fragment as FragmentWithKey, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, BookOpen, GraduationCap, ChevronLeft, ChevronRight, X, Lightbulb } from "lucide-react";

/**
 * Interactive comparison of the 5 development domains across
 * pedagogical frameworks. Russian ФГОС ДО is the baseline; other
 * approaches can be toggled on/off and cells that diverge from the
 * baseline are highlighted.
 *
 * Ключевые термины в ячейках подсвечены и раскрываются в поповере
 * с определением и ссылкой на первоисточник (сноска).
 */

type ApproachId = "fgos" | "headstart" | "eyfs" | "who" | "germany";

type CellText = { ru: string; en: string };

type Approach = {
  id: ApproachId;
  short: CellText;
  full: CellText;
  region: CellText;
  source: { label: string; url: string };
  baseline?: boolean;
};

const APPROACHES: Approach[] = [
  {
    id: "fgos",
    baseline: true,
    short: { ru: "ФГОС ДО (РФ)", en: "FGOS DO (RU)" },
    full: {
      ru: "ФГОС дошкольного образования / ФАОП",
      en: "Russian Federal Standard for Preschool Education",
    },
    region: { ru: "Россия", en: "Russia" },
    source: { label: "fgos.ru", url: "https://fgos.ru/fgos/fgos-do/" },
  },
  {
    id: "headstart",
    short: { ru: "Head Start ELOF (США)", en: "Head Start ELOF (US)" },
    full: {
      ru: "Early Learning Outcomes Framework",
      en: "Head Start Early Learning Outcomes Framework",
    },
    region: { ru: "США", en: "USA" },
    source: {
      label: "eclkc.ohs.acf.hhs.gov",
      url: "https://eclkc.ohs.acf.hhs.gov/interactive-head-start-early-learning-outcomes-framework-ages-birth-five",
    },
  },
  {
    id: "eyfs",
    short: { ru: "EYFS (Великобритания)", en: "EYFS (UK)" },
    full: {
      ru: "Early Years Foundation Stage",
      en: "Early Years Foundation Stage (UK)",
    },
    region: { ru: "Великобритания", en: "UK" },
    source: {
      label: "gov.uk",
      url: "https://www.gov.uk/government/publications/early-years-foundation-stage-framework--2",
    },
  },
  {
    id: "who",
    short: { ru: "ВОЗ / Nurturing Care", en: "WHO / Nurturing Care" },
    full: {
      ru: "Nurturing Care Framework (ВОЗ, UNICEF)",
      en: "Nurturing Care Framework (WHO, UNICEF)",
    },
    region: { ru: "Международный", en: "International" },
    source: { label: "who.int", url: "https://nurturing-care.org/" },
  },
  {
    id: "germany",
    short: { ru: "Bildungsplan (Германия)", en: "Bildungsplan (Germany)" },
    full: {
      ru: "Bayerischer Bildungs- und Erziehungsplan",
      en: "Bavarian Education and Upbringing Plan",
    },
    region: { ru: "Германия", en: "Germany" },
    source: {
      label: "ifp.bayern.de",
      url: "https://www.ifp.bayern.de/veroeffentlichungen/BEP.php",
    },
  },
];

type BlockId = "physical" | "speech" | "cognitive" | "social" | "play";

type Block = {
  id: BlockId;
  title: CellText;
  emoji: string;
  cells: Record<ApproachId, CellText>;
};

const BLOCKS: Block[] = [
  {
    id: "physical",
    emoji: "🏃",
    title: { ru: "Физическое / моторное", en: "Physical / Motor" },
    cells: {
      fgos: {
        ru: "Физическое развитие: [[крупная моторика|gross-motor]] и [[мелкая моторика|fine-motor]], ЗОЖ, координация.",
        en: "Physical development: [[gross motor|gross-motor]] & [[fine motor|fine-motor]], healthy lifestyle, coordination.",
      },
      headstart: {
        ru: "[[Perceptual, Motor and Physical Development|elof-pmp]] — восприятие, движение, здоровье и безопасность.",
        en: "[[Perceptual, Motor and Physical Development|elof-pmp]] — perception, motion, health & safety.",
      },
      eyfs: {
        ru: "Physical Development — [[крупная моторика|gross-motor]] и [[мелкая моторика|fine-motor]] + health and self-care как отдельный акцент.",
        en: "Physical Development — [[gross motor|gross-motor]] & [[fine motor|fine-motor]] + explicit health and self-care strand.",
      },
      who: {
        ru: "[[Good health|nc-health]] + [[Adequate nutrition|nc-nutrition]] — здоровье и питание как отдельные компоненты ухода.",
        en: "[[Good health|nc-health]] + [[Adequate nutrition|nc-nutrition]] as separate pillars of nurturing care.",
      },
      germany: {
        ru: "Körper, Bewegung, Gesundheit — тело, движение, здоровье как единый образовательный домен.",
        en: "Körper, Bewegung, Gesundheit — body, motion, health as one educational domain.",
      },
    },
  },
  {
    id: "speech",
    emoji: "💬",
    title: { ru: "Речевое / коммуникация", en: "Speech / Communication" },
    cells: {
      fgos: {
        ru: "Речевое развитие: словарь, грамматика, [[связная речь|connected-speech]], знакомство с книжной культурой.",
        en: "Speech development: vocabulary, grammar, [[connected speech|connected-speech]], book culture.",
      },
      headstart: {
        ru: "Language & Communication + отдельно [[Literacy|literacy]]: чтение, письмо, [[фонематика|phonology]].",
        en: "Language & Communication + separate [[Literacy|literacy]] strand: reading, writing, [[phonology|phonology]].",
      },
      eyfs: {
        ru: "Communication and Language + [[Literacy|literacy]] — устная речь и грамотность разделены.",
        en: "Communication and Language + [[Literacy|literacy]] split into two prime/specific areas.",
      },
      who: {
        ru: "[[Opportunities for early learning|nc-learning]] — язык рассматривается как часть [[отзывчивого взаимодействия|nc-responsive]].",
        en: "[[Opportunities for early learning|nc-learning]] — language embedded in [[responsive caregiving|nc-responsive]].",
      },
      germany: {
        ru: "Sprache und Literacy — билингвальный акцент, ранняя грамотность через диалог.",
        en: "Sprache und Literacy — bilingual focus, early literacy through dialogue.",
      },
    },
  },
  {
    id: "cognitive",
    emoji: "🧠",
    title: { ru: "Познавательное / когнитивное", en: "Cognitive" },
    cells: {
      fgos: {
        ru: "Познавательное развитие: любознательность, элементарные математические и естественно-научные представления.",
        en: "Cognitive development: curiosity, early math and science concepts.",
      },
      headstart: {
        ru: "[[Cognition|elof-cognition]] — математика и научное мышление как отдельные подобласти.",
        en: "[[Cognition|elof-cognition]] — mathematics and scientific reasoning as distinct sub-domains.",
      },
      eyfs: {
        ru: "Mathematics + Understanding the World — математика и мир вокруг разделены.",
        en: "Mathematics + Understanding the World as two specific areas.",
      },
      who: {
        ru: "[[Opportunities for early learning|nc-learning]] — когнитивное развитие через стимулирующую среду.",
        en: "[[Opportunities for early learning|nc-learning]] — cognition through a stimulating environment.",
      },
      germany: {
        ru: "Mathematik, Naturwissenschaft, Technik — три отдельных домена ([[STEM|stem]]-подход).",
        en: "Mathematik, Naturwissenschaft, Technik — three separate [[STEM|stem]] domains.",
      },
    },
  },
  {
    id: "social",
    emoji: "🤝",
    title: { ru: "Социально-эмоциональное", en: "Social-Emotional" },
    cells: {
      fgos: {
        ru: "Социально-коммуникативное развитие: нормы, эмоции, самостоятельность, безопасность.",
        en: "Social-communicative development: norms, emotions, autonomy, safety.",
      },
      headstart: {
        ru: "Social and Emotional Development — самосознание, отношения, [[эмоциональная регуляция|emotion-regulation]].",
        en: "Social and Emotional Development — self-awareness, relationships, [[emotion regulation|emotion-regulation]].",
      },
      eyfs: {
        ru: "Personal, Social and Emotional Development — один из трёх [[«prime areas»|prime-areas]].",
        en: "Personal, Social and Emotional Development — one of three [[prime areas|prime-areas]].",
      },
      who: {
        ru: "[[Responsive caregiving|nc-responsive]] + [[Safety and security|nc-safety]] — базовая [[привязанность|attachment]] и защита.",
        en: "[[Responsive caregiving|nc-responsive]] + [[Safety and security|nc-safety]] — [[attachment|attachment]] and protection.",
      },
      germany: {
        ru: "Soziale und emotionale Kompetenzen + Werte — включая ценностное воспитание.",
        en: "Soziale und emotionale Kompetenzen + values education explicitly included.",
      },
    },
  },
  {
    id: "play",
    emoji: "🎨",
    title: { ru: "Игра и творчество", en: "Play & Creativity" },
    cells: {
      fgos: {
        ru: "Художественно-эстетическое развитие: музыка, ИЗО, восприятие искусства; игра — сквозная деятельность.",
        en: "Arts & aesthetic development; play as cross-cutting activity.",
      },
      headstart: {
        ru: "[[Approaches to Learning|elof-atl]] — инициатива, любознательность, настойчивость.",
        en: "[[Approaches to Learning|elof-atl]] — initiative, curiosity, persistence.",
      },
      eyfs: {
        ru: "Expressive Arts and Design + [[характеристики эффективного обучения|coel]] (play-based).",
        en: "Expressive Arts and Design + [[characteristics of effective learning|coel]] (play-based).",
      },
      who: {
        ru: "Игра — часть [[responsive caregiving|nc-responsive]] и [[early learning opportunities|nc-learning]].",
        en: "Play is embedded in [[responsive caregiving|nc-responsive]] and [[learning opportunities|nc-learning]].",
      },
      germany: {
        ru: "Ästhetik, Kunst und Kultur + Musik — отдельные эстетические домены.",
        en: "Ästhetik, Kunst und Kultur + Musik as separate aesthetic domains.",
      },
    },
  },
];

/** Глоссарий терминов, встречающихся в ячейках. Ключи совпадают с id в маркерах [[label|id]]. */
type Term = {
  title: CellText;
  definition: CellText;
  source: { label: string; url: string };
};

const GLOSSARY: Record<string, Term> = {
  "gross-motor": {
    title: { ru: "Крупная моторика", en: "Gross motor skills" },
    definition: {
      ru: "Движения крупных мышечных групп: ходьба, бег, прыжки, равновесие, координация всего тела.",
      en: "Movements of large muscle groups: walking, running, jumping, balance, whole-body coordination.",
    },
    source: { label: "CDC · Developmental Milestones", url: "https://www.cdc.gov/ncbddd/actearly/milestones/index.html" },
  },
  "fine-motor": {
    title: { ru: "Мелкая моторика", en: "Fine motor skills" },
    definition: {
      ru: "Точные движения кистей и пальцев: захват, письмо, работа с мелкими предметами.",
      en: "Precise hand and finger movements: grasping, writing, manipulating small objects.",
    },
    source: { label: "CDC · Developmental Milestones", url: "https://www.cdc.gov/ncbddd/actearly/milestones/index.html" },
  },
  "connected-speech": {
    title: { ru: "Связная речь", en: "Connected speech" },
    definition: {
      ru: "Развёрнутое высказывание из нескольких предложений, объединённых темой и логикой (рассказ, пересказ, описание).",
      en: "Extended utterance made of several sentences linked by topic and logic (story, retelling, description).",
    },
    source: { label: "ASHA · Language In Brief", url: "https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/language-in-brief/" },
  },
  literacy: {
    title: { ru: "Literacy / грамотность", en: "Literacy" },
    definition: {
      ru: "Ранние навыки чтения и письма: фонематический слух, знание букв, понимание текста.",
      en: "Early reading and writing skills: phonological awareness, letter knowledge, comprehension.",
    },
    source: { label: "NAEYC · Early Literacy", url: "https://www.naeyc.org/resources/topics/early-literacy" },
  },
  phonology: {
    title: { ru: "Фонематика", en: "Phonology / phonemic awareness" },
    definition: {
      ru: "Способность различать и оперировать звуками речи — основа обучения чтению.",
      en: "Ability to distinguish and manipulate speech sounds — foundational for reading.",
    },
    source: { label: "NICHD · Reading Research", url: "https://www.nichd.nih.gov/health/topics/reading" },
  },
  stem: {
    title: { ru: "STEM", en: "STEM" },
    definition: {
      ru: "Science, Technology, Engineering, Mathematics — интегрированный подход к обучению точным и естественным наукам.",
      en: "Science, Technology, Engineering, Mathematics — integrated approach to sciences and math.",
    },
    source: { label: "NAEYC · STEM in Early Learning", url: "https://www.naeyc.org/resources/pubs/yc/may2018/stem-in-early-childhood" },
  },
  "emotion-regulation": {
    title: { ru: "Эмоциональная регуляция", en: "Emotion regulation" },
    definition: {
      ru: "Способность распознавать и управлять своими эмоциями — ключевой предиктор школьной готовности.",
      en: "Ability to recognise and manage one's emotions — key predictor of school readiness.",
    },
    source: { label: "Harvard · Center on the Developing Child", url: "https://developingchild.harvard.edu/science/key-concepts/executive-function/" },
  },
  attachment: {
    title: { ru: "Привязанность", en: "Attachment" },
    definition: {
      ru: "Устойчивая эмоциональная связь ребёнка со значимым взрослым (Bowlby, Ainsworth). Основа безопасности и исследования мира.",
      en: "Stable emotional bond between child and caregiver (Bowlby, Ainsworth). Basis for security and exploration.",
    },
    source: { label: "APA · Attachment Theory", url: "https://dictionary.apa.org/attachment-theory" },
  },
  "prime-areas": {
    title: { ru: "Prime areas (EYFS)", en: "Prime areas (EYFS)" },
    definition: {
      ru: "Три ключевые области раннего развития по EYFS: Communication and Language, Physical Development, Personal/Social/Emotional.",
      en: "Three core early-development areas in EYFS: Communication & Language, Physical, Personal/Social/Emotional.",
    },
    source: { label: "gov.uk · EYFS framework", url: "https://www.gov.uk/government/publications/early-years-foundation-stage-framework--2" },
  },
  coel: {
    title: { ru: "Характеристики эффективного обучения", en: "Characteristics of Effective Learning" },
    definition: {
      ru: "В EYFS: играя и исследуя, активно обучаясь, творчески и критически мысля — три способа, как ребёнок учится.",
      en: "In EYFS: playing & exploring, active learning, creating & thinking critically — three ways children learn.",
    },
    source: { label: "Early Education · CoEL", url: "https://early-education.org.uk/characteristics-of-effective-learning/" },
  },
  "elof-pmp": {
    title: { ru: "ELOF · Perceptual, Motor & Physical", en: "ELOF · Perceptual, Motor & Physical" },
    definition: {
      ru: "Домен Head Start ELOF: восприятие, крупная и мелкая моторика, здоровье и безопасность.",
      en: "Head Start ELOF domain: perception, gross/fine motor, health and safety.",
    },
    source: { label: "Head Start ELOF", url: "https://eclkc.ohs.acf.hhs.gov/interactive-head-start-early-learning-outcomes-framework-ages-birth-five" },
  },
  "elof-cognition": {
    title: { ru: "ELOF · Cognition", en: "ELOF · Cognition" },
    definition: {
      ru: "Домен ELOF: математическое мышление, научное исследование, решение проблем.",
      en: "ELOF domain: mathematical thinking, scientific reasoning, problem solving.",
    },
    source: { label: "Head Start ELOF", url: "https://eclkc.ohs.acf.hhs.gov/interactive-head-start-early-learning-outcomes-framework-ages-birth-five" },
  },
  "elof-atl": {
    title: { ru: "ELOF · Approaches to Learning", en: "ELOF · Approaches to Learning" },
    definition: {
      ru: "Домен ELOF: инициатива, любознательность, настойчивость, саморегуляция в обучении.",
      en: "ELOF domain: initiative, curiosity, persistence, self-regulation in learning.",
    },
    source: { label: "Head Start ELOF", url: "https://eclkc.ohs.acf.hhs.gov/interactive-head-start-early-learning-outcomes-framework-ages-birth-five" },
  },
  "nc-health": {
    title: { ru: "Good health", en: "Good health" },
    definition: {
      ru: "Первый компонент Nurturing Care: физическое и психическое здоровье ребёнка и матери.",
      en: "First Nurturing Care component: physical and mental health of child and mother.",
    },
    source: { label: "WHO · Nurturing Care", url: "https://nurturing-care.org/" },
  },
  "nc-nutrition": {
    title: { ru: "Adequate nutrition", en: "Adequate nutrition" },
    definition: {
      ru: "Компонент Nurturing Care: адекватное питание с первых дней жизни, включая грудное вскармливание.",
      en: "Nurturing Care component: adequate nutrition from birth, including breastfeeding.",
    },
    source: { label: "WHO · Nurturing Care", url: "https://nurturing-care.org/" },
  },
  "nc-responsive": {
    title: { ru: "Responsive caregiving", en: "Responsive caregiving" },
    definition: {
      ru: "Отзывчивый уход: взрослый замечает и адекватно реагирует на сигналы ребёнка. Ключевой компонент Nurturing Care.",
      en: "Caregiver notices and responds appropriately to child's cues. Core Nurturing Care component.",
    },
    source: { label: "WHO · Nurturing Care", url: "https://nurturing-care.org/" },
  },
  "nc-safety": {
    title: { ru: "Safety and security", en: "Safety and security" },
    definition: {
      ru: "Компонент Nurturing Care: физическая и эмоциональная безопасность, отсутствие насилия и пренебрежения.",
      en: "Nurturing Care component: physical and emotional safety, freedom from violence and neglect.",
    },
    source: { label: "WHO · Nurturing Care", url: "https://nurturing-care.org/" },
  },
  "nc-learning": {
    title: { ru: "Opportunities for early learning", en: "Opportunities for early learning" },
    definition: {
      ru: "Компонент Nurturing Care: возможности для раннего обучения через игру и стимулирующее взаимодействие.",
      en: "Nurturing Care component: opportunities for early learning through play and stimulating interaction.",
    },
    source: { label: "WHO · Nurturing Care", url: "https://nurturing-care.org/" },
  },
};

/** Пояснения для новичков: чем подходы отличаются друг от друга в каждом блоке. */
const BEGINNER_NOTES: Record<BlockId, CellText> = {
  physical: {
    ru: "ФГОС объединяет моторику и ЗОЖ в один блок. Head Start и EYFS выделяют «здоровье и самообслуживание» отдельным акцентом, ВОЗ — вообще ставит здоровье и питание в основу ухода. Германия объединяет тело, движение и здоровье в единый образовательный домен.",
    en: "FGOS bundles motor skills and healthy lifestyle together. Head Start and EYFS make 'health and self-care' a separate strand; WHO puts health and nutrition at the foundation of care. Germany merges body, motion and health into one educational domain.",
  },
  speech: {
    ru: "ФГОС говорит о «речевом развитии» целиком. Англоязычные подходы (Head Start, EYFS) разделяют устную речь и грамотность (literacy) на два отдельных направления. ВОЗ вписывает язык в отзывчивое взаимодействие взрослого и ребёнка.",
    en: "FGOS treats 'speech development' as a whole. English-language frameworks (Head Start, EYFS) split oral language and literacy into two separate strands. WHO embeds language inside responsive caregiving.",
  },
  cognitive: {
    ru: "У ФГОС — общий блок «познавательное развитие». Head Start и EYFS выделяют математику отдельно. Германия идёт дальше и делит когнитивное развитие на три STEM-домена: математика, естественные науки, техника.",
    en: "FGOS uses a single 'cognitive development' block. Head Start and EYFS make mathematics a separate strand. Germany goes further and splits cognition into three STEM domains: math, natural sciences and technology.",
  },
  social: {
    ru: "Все подходы согласны, что социально-эмоциональное развитие — фундамент. EYFS даже относит его к «prime areas». ВОЗ делает акцент на привязанности и безопасности, Германия добавляет ценностное воспитание.",
    en: "All frameworks agree social-emotional development is foundational. EYFS lists it among the 'prime areas'. WHO emphasises attachment and safety; Germany explicitly adds values education.",
  },
  play: {
    ru: "ФГОС видит игру как сквозную деятельность, а искусство — как отдельный блок. Head Start добавляет «подходы к обучению» (инициатива, любознательность). EYFS вводит характеристики эффективного обучения на основе игры.",
    en: "FGOS treats play as cross-cutting and the arts as a separate block. Head Start adds 'approaches to learning' (initiative, curiosity). EYFS defines play-based characteristics of effective learning.",
  },
};

type TourStep = { title: CellText; body: CellText };

const TOUR_STEPS: TourStep[] = [
  {
    title: { ru: "Шаг 1. Базовый подход", en: "Step 1. Baseline framework" },
    body: {
      ru: "ФГОС ДО закреплён как базовый — его нельзя отключить. Все остальные подходы сравниваются именно с ним, чтобы вам было проще увидеть отличия от привычной российской модели.",
      en: "FGOS DO is pinned as baseline — it can't be turned off. Every other framework is compared to it so you can see how it diverges from the familiar Russian model.",
    },
  },
  {
    title: { ru: "Шаг 2. Включайте подходы", en: "Step 2. Toggle frameworks" },
    body: {
      ru: "Нажмите на «таблетку» подхода (Head Start, EYFS, ВОЗ, Германия), чтобы добавить или убрать колонку. Начните с 2–3 подходов — так проще сравнивать.",
      en: "Click a framework pill (Head Start, EYFS, WHO, Germany) to add or remove its column. Start with 2–3 frameworks — it makes comparison easier.",
    },
  },
  {
    title: { ru: "Шаг 3. Подсветка отличий", en: "Step 3. Highlight differences" },
    body: {
      ru: "Переключатель «Подсвечивать отличия» окрашивает ячейки, которые отличаются от ФГОС. Так вы за секунду видите, где подход расходится с российской моделью.",
      en: "The 'Highlight differences' switch tints cells that diverge from FGOS. In a second you can see exactly where a framework departs from the Russian model.",
    },
  },
  {
    title: { ru: "Шаг 4. Термины и сноски", en: "Step 4. Glossary & footnotes" },
    body: {
      ru: "Подчёркнутые пунктиром слова (например, «мелкая моторика», «STEM», «привязанность») — кликабельны. В поповере — короткое определение и ссылка на первоисточник (CDC, ASHA, WHO, NAEYC).",
      en: "Dotted-underline words (e.g. 'fine motor', 'STEM', 'attachment') are clickable. The popover gives a short definition and a link to a primary source (CDC, ASHA, WHO, NAEYC).",
    },
  },
  {
    title: { ru: "Шаг 5. Заметки для новичков", en: "Step 5. Beginner notes" },
    body: {
      ru: "Под каждой строкой появляется жёлтая заметка: краткое объяснение, чем подходы отличаются в этой сфере развития и почему это важно. Можно выключить, когда освоитесь.",
      en: "A yellow note appears below each row: a short explanation of how the frameworks differ in this domain and why it matters. Turn it off once you're comfortable.",
    },
  },
];

const STR = {
  ru: {
    title: "Сравнительная таблица блоков развития",
    subtitle:
      "Включайте подходы, чтобы увидеть, как одни и те же сферы развития описаны в разных странах. Отличия от ФГОС ДО подсвечиваются. Кликайте по подчёркнутым терминам — там определение и ссылка на источник.",
    baseline: "Базовый подход",
    highlight: "Подсвечивать отличия",
    learning: "Режим обучения",
    approaches: "Подходы",
    domain: "Сфера развития",
    source: "Источник",
    definition: "Определение",
    openSource: "Открыть источник",
    hint: "Совет: включите 2–3 подхода и наводите на подчёркнутые термины — раскроются определения и сноски.",
    tourTitle: "Пошаговая экскурсия",
    tourStep: "Шаг",
    tourOf: "из",
    tourPrev: "Назад",
    tourNext: "Далее",
    tourFinish: "Готово",
    tourClose: "Закрыть подсказки",
    beginnerLabel: "Пояснение для новичков",
    learningOn: "Обучение включено — под каждым блоком появилось короткое пояснение отличий между подходами.",
  },
  en: {
    title: "Interactive comparison of development domains",
    subtitle:
      "Toggle frameworks to see how the same domains are framed across countries. Cells that diverge from FGOS DO are highlighted. Click underlined terms for definitions and sources.",
    baseline: "Baseline",
    highlight: "Highlight differences",
    learning: "Learning mode",
    approaches: "Frameworks",
    domain: "Domain",
    source: "Source",
    definition: "Definition",
    openSource: "Open source",
    hint: "Tip: enable 2–3 frameworks and click underlined terms to reveal definitions and footnotes.",
    tourTitle: "Guided tour",
    tourStep: "Step",
    tourOf: "of",
    tourPrev: "Back",
    tourNext: "Next",
    tourFinish: "Done",
    tourClose: "Close hints",
    beginnerLabel: "Beginner note",
    learningOn: "Learning mode on — a short note explaining how the frameworks differ appears under each block.",
  },
};

/** Разбор строки с маркерами [[label|termId]] на React-узлы с поповерами. */
function renderWithTerms(
  text: string,
  lang: "ru" | "en",
  s: (typeof STR)["ru"],
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, id] = m;
    const term = GLOSSARY[id];
    if (!term) {
      parts.push(label);
    } else {
      parts.push(
        <Popover key={`t-${i++}-${m.index}`}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline underline decoration-dotted decoration-primary/60 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors font-medium cursor-pointer"
            >
              {label}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm" side="top" align="start">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="font-semibold leading-tight">{term.title[lang]}</div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {term.definition[lang]}
            </p>
            <div className="border-t border-border/60 pt-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                {s.source}
              </div>
              <a
                href={term.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs"
              >
                {term.source.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </PopoverContent>
        </Popover>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Голый текст без маркеров — для сравнения ячеек между собой. */
function stripMarkers(text: string): string {
  return text.replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, "$1");
}

export default function DevelopmentBlocksComparison() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "ru")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "ru";
  const s = STR[lang];

  const [active, setActive] = useState<Set<ApproachId>>(
    new Set(["fgos", "headstart", "eyfs"]),
  );
  const [highlight, setHighlight] = useState(true);
  const [learning, setLearning] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const enableLearning = (on: boolean) => {
    setLearning(on);
    if (on) setTourStep(0);
  };

  const toggle = (id: ApproachId) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (id === "fgos") return next;
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleApproaches = useMemo(
    () => APPROACHES.filter((a) => active.has(a.id) || a.baseline),
    [active],
  );

  return (
    <section
      aria-label={s.title}
      className="not-prose my-10 rounded-2xl border border-border/70 bg-gradient-to-br from-accent/40 via-background to-background p-5 md:p-7"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-xl bg-primary/10 text-primary p-2">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-semibold leading-tight">
            {s.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          {s.approaches}:
        </span>
        {APPROACHES.map((a) => {
          const isActive = active.has(a.id) || a.baseline;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              disabled={a.baseline}
              className={`text-xs md:text-sm rounded-full border px-3 py-1.5 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              } ${a.baseline ? "cursor-default" : "cursor-pointer"}`}
              aria-pressed={isActive}
              title={a.full[lang]}
            >
              {a.short[lang]}
              {a.baseline && (
                <span className="ml-1.5 opacity-80">· {s.baseline}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <GraduationCap className={`h-4 w-4 ${learning ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground">{s.learning}</span>
            <Switch checked={learning} onCheckedChange={enableLearning} />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">{s.highlight}</span>
            <Switch checked={highlight} onCheckedChange={setHighlight} />
          </label>
        </div>
      </div>

      {/* Guided tour */}
      {learning && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary text-primary-foreground p-2 shrink-0">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {s.tourTitle} · {s.tourStep} {tourStep + 1} {s.tourOf} {TOUR_STEPS.length}
                </div>
                <button
                  type="button"
                  onClick={() => enableLearning(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={s.tourClose}
                  title={s.tourClose}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h4 className="font-semibold text-base md:text-lg mb-1 leading-tight">
                {TOUR_STEPS[tourStep].title[lang]}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TOUR_STEPS[tourStep].body[lang]}
              </p>
              <div className="mt-3 h-1 w-full rounded-full bg-primary/15 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTourStep((n) => Math.max(0, n - 1))}
                  disabled={tourStep === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {s.tourPrev}
                </Button>
                {tourStep < TOUR_STEPS.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setTourStep((n) => Math.min(TOUR_STEPS.length - 1, n + 1))}
                    className="gap-1"
                  >
                    {s.tourNext}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => enableLearning(false)}>
                    {s.tourFinish}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="p-3 md:p-4 font-semibold min-w-[160px] sticky left-0 bg-muted/50 z-10">
                    {s.domain}
                  </th>
                  {visibleApproaches.map((a) => (
                    <th
                      key={a.id}
                      className="p-3 md:p-4 font-semibold min-w-[220px] align-top"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span>{a.short[lang]}</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {a.region[lang]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOCKS.map((b) => {
                  const baseText = stripMarkers(b.cells.fgos[lang]);
                  return (
                    <FragmentWithKey key={b.id}>
                      <tr className="border-t border-border/60 align-top">
                        <th
                          scope="row"
                          className="p-3 md:p-4 text-left font-medium sticky left-0 bg-background z-10"
                        >
                          <div className="flex items-center gap-2">
                            <span aria-hidden className="text-lg">{b.emoji}</span>
                            <span>{b.title[lang]}</span>
                          </div>
                        </th>
                        {visibleApproaches.map((a) => {
                          const raw = b.cells[a.id][lang];
                          const differs =
                            !a.baseline && stripMarkers(raw) !== baseText;
                          return (
                            <td
                              key={a.id}
                              className={`p-3 md:p-4 leading-relaxed transition-colors ${
                                highlight && differs
                                  ? "bg-amber-50 dark:bg-amber-500/10 ring-1 ring-inset ring-amber-300/50 dark:ring-amber-400/30"
                                  : ""
                              }`}
                            >
                              {renderWithTerms(raw, lang, s)}
                            </td>
                          );
                        })}
                      </tr>
                      {learning && (
                        <tr key={`${b.id}-note`} className="border-t border-primary/20">
                          <td
                            colSpan={visibleApproaches.length + 1}
                            className="p-3 md:p-4 bg-primary/5"
                          >
                            <div className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary mr-2">
                                  {s.beginnerLabel}
                                </span>
                                <span className="text-foreground/90 leading-relaxed">
                                  {BEGINNER_NOTES[b.id][lang]}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </FragmentWithKey>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleApproaches.map((a) => (
          <a
            key={a.id}
            href={a.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Badge variant="outline" className="font-normal gap-1">
              {a.short[lang]}
              <ExternalLink className="h-3 w-3" />
            </Badge>
            <span className="hidden md:inline">{a.source.label}</span>
          </a>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{s.hint}</p>
    </section>
  );
}
