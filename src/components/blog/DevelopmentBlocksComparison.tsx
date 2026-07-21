import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, ExternalLink } from "lucide-react";

/**
 * Interactive comparison of the 5 development domains across
 * pedagogical frameworks. Russian ФГОС ДО is the baseline; other
 * approaches can be toggled on/off and cells that diverge from the
 * baseline are highlighted.
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
    source: {
      label: "fgos.ru",
      url: "https://fgos.ru/fgos/fgos-do/",
    },
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
    source: {
      label: "who.int",
      url: "https://nurturing-care.org/",
    },
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
        ru: "Физическое развитие: крупная и мелкая моторика, ЗОЖ, координация.",
        en: "Physical development: gross & fine motor, healthy lifestyle, coordination.",
      },
      headstart: {
        ru: "Perceptual, Motor and Physical Development — восприятие, движение, здоровье и безопасность.",
        en: "Perceptual, Motor and Physical Development — perception, motion, health & safety.",
      },
      eyfs: {
        ru: "Physical Development — gross & fine motor + health and self-care как отдельный акцент.",
        en: "Physical Development — gross & fine motor + explicit health and self-care strand.",
      },
      who: {
        ru: "Good health + Adequate nutrition — здоровье и питание как отдельные компоненты ухода.",
        en: "Good health + Adequate nutrition as separate pillars of nurturing care.",
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
        ru: "Речевое развитие: словарь, грамматика, связная речь, знакомство с книжной культурой.",
        en: "Speech development: vocabulary, grammar, connected speech, book culture.",
      },
      headstart: {
        ru: "Language & Communication + отдельно Literacy: чтение, письмо, фонематика.",
        en: "Language & Communication + separate Literacy strand: reading, writing, phonology.",
      },
      eyfs: {
        ru: "Communication and Language + Literacy — устная речь и грамотность разделены.",
        en: "Communication and Language + Literacy split into two prime/specific areas.",
      },
      who: {
        ru: "Opportunities for early learning — язык рассматривается как часть отзывчивого взаимодействия.",
        en: "Opportunities for early learning — language embedded in responsive caregiving.",
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
        ru: "Cognition — математика и научное мышление как отдельные подобласти.",
        en: "Cognition — mathematics and scientific reasoning as distinct sub-domains.",
      },
      eyfs: {
        ru: "Mathematics + Understanding the World — математика и мир вокруг разделены.",
        en: "Mathematics + Understanding the World as two specific areas.",
      },
      who: {
        ru: "Opportunities for early learning — когнитивное развитие через стимулирующую среду.",
        en: "Opportunities for early learning — cognition through a stimulating environment.",
      },
      germany: {
        ru: "Mathematik, Naturwissenschaft, Technik — три отдельных домена (STEM-подход).",
        en: "Mathematik, Naturwissenschaft, Technik — three separate STEM domains.",
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
        ru: "Social and Emotional Development — самосознание, отношения, эмоциональная регуляция.",
        en: "Social and Emotional Development — self-awareness, relationships, emotion regulation.",
      },
      eyfs: {
        ru: "Personal, Social and Emotional Development — один из трёх «prime areas».",
        en: "Personal, Social and Emotional Development — one of three prime areas.",
      },
      who: {
        ru: "Responsive caregiving + Safety and security — базовая привязанность и защита.",
        en: "Responsive caregiving + Safety and security — attachment and protection.",
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
        ru: "Approaches to Learning — инициатива, любознательность, настойчивость.",
        en: "Approaches to Learning — initiative, curiosity, persistence.",
      },
      eyfs: {
        ru: "Expressive Arts and Design + характеристики эффективного обучения (play-based).",
        en: "Expressive Arts and Design + characteristics of effective learning (play-based).",
      },
      who: {
        ru: "Игра — часть responsive caregiving и early learning opportunities.",
        en: "Play is embedded in responsive caregiving and learning opportunities.",
      },
      germany: {
        ru: "Ästhetik, Kunst und Kultur + Musik — отдельные эстетические домены.",
        en: "Ästhetik, Kunst und Kultur + Musik as separate aesthetic domains.",
      },
    },
  },
];

const STR = {
  ru: {
    title: "Сравнительная таблица блоков развития",
    subtitle:
      "Включайте подходы, чтобы увидеть, как одни и те же сферы развития описаны в разных странах. Отличия от ФГОС ДО подсвечиваются.",
    baseline: "Базовый подход",
    highlight: "Подсвечивать отличия",
    approaches: "Подходы",
    domain: "Сфера развития",
    source: "Источник",
    hint: "Совет: включите 2–3 подхода одновременно, чтобы сравнить формулировки.",
  },
  en: {
    title: "Interactive comparison of development domains",
    subtitle:
      "Toggle frameworks to see how the same domains are framed across countries. Cells that diverge from FGOS DO are highlighted.",
    baseline: "Baseline",
    highlight: "Highlight differences",
    approaches: "Frameworks",
    domain: "Domain",
    source: "Source",
    hint: "Tip: enable 2–3 frameworks to compare wording side by side.",
  },
};

export default function DevelopmentBlocksComparison() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "ru")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "ru";
  const s = STR[lang];

  const [active, setActive] = useState<Set<ApproachId>>(
    new Set(["fgos", "headstart", "eyfs"])
  );
  const [highlight, setHighlight] = useState(true);

  const toggle = (id: ApproachId) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (id === "fgos") return next; // baseline always on
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleApproaches = useMemo(
    () => APPROACHES.filter((a) => active.has(a.id) || a.baseline),
    [active]
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
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{s.highlight}</span>
          <Switch checked={highlight} onCheckedChange={setHighlight} />
        </div>
      </div>

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
                  const baseText = b.cells.fgos[lang];
                  return (
                    <tr key={b.id} className="border-t border-border/60 align-top">
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
                        const text = b.cells[a.id][lang];
                        const differs = !a.baseline && text !== baseText;
                        return (
                          <td
                            key={a.id}
                            className={`p-3 md:p-4 leading-relaxed transition-colors ${
                              highlight && differs
                                ? "bg-amber-50 dark:bg-amber-500/10 ring-1 ring-inset ring-amber-300/50 dark:ring-amber-400/30"
                                : ""
                            }`}
                          >
                            {text}
                          </td>
                        );
                      })}
                    </tr>
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
