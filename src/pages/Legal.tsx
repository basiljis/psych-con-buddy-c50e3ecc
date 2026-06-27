import { useState, useMemo } from "react";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  Scale,
  BookOpen,
  Shield,
  GraduationCap,
  HeartPulse,
  FileText,
  ExternalLink,
  Building2,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Doc = {
  title: string;
  meta?: string;
  description: string;
  url: string;
  badge?: string;
};

type Section = {
  id: string;
  title: string;
  icon: typeof Scale;
  intro: string;
  docs: Doc[];
};

const sections: Section[] = [
  {
    id: "federal",
    title: "Федеральное законодательство",
    icon: Scale,
    intro:
      "Базовые федеральные законы, на основании которых построена работа платформы universum. в части образования, защиты прав детей и обработки персональных данных.",
    docs: [
      {
        title: "Федеральный закон от 29.12.2012 № 273-ФЗ «Об образовании в Российской Федерации»",
        meta: "ред. от 2024",
        description:
          "Регулирует психолого-педагогическую, медицинскую и социальную помощь обучающимся, деятельность ППк и ПМПК, обязанности образовательных организаций.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_140174/",
        badge: "Образование",
      },
      {
        title: "Федеральный закон от 27.07.2006 № 152-ФЗ «О персональных данных»",
        meta: "ред. от 2024",
        description:
          "Определяет требования к обработке персональных данных, в том числе специальных категорий (сведения о здоровье ребёнка), и обязанности оператора ПДн.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_61801/",
        badge: "ПДн",
      },
      {
        title: "Федеральный закон от 24.07.1998 № 124-ФЗ «Об основных гарантиях прав ребёнка в РФ»",
        description:
          "Гарантии прав ребёнка на получение образования и психолого-педагогической помощи, защита интересов несовершеннолетних.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_19558/",
      },
      {
        title: "Федеральный закон от 24.11.1995 № 181-ФЗ «О социальной защите инвалидов в РФ»",
        description:
          "Права детей-инвалидов на образование, реабилитацию и сопровождение, требования к доступной среде в образовательных организациях.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_8559/",
      },
      {
        title: "Федеральный закон от 21.11.2011 № 323-ФЗ «Об основах охраны здоровья граждан в РФ»",
        description:
          "Регламентирует медицинскую помощь несовершеннолетним, согласие законного представителя, врачебную тайну и охрану здоровья.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_121895/",
      },
      {
        title: "Федеральный закон от 27.07.2006 № 149-ФЗ «Об информации, ИТ и о защите информации»",
        description:
          "Правовые основы работы информационных систем, требования к защите информации, размещаемой в государственных и частных ИС.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_61798/",
      },
    ],
  },
  {
    id: "donm",
    title: "Приказ ДОНМ № 666 и регламенты ППк/ПМПК",
    icon: BookOpen,
    intro:
      "Ключевые ведомственные документы, регулирующие деятельность психолого-педагогических консилиумов и комиссий. Платформа автоматизирует протоколы и заключения в соответствии с этими требованиями.",
    docs: [
      {
        title: "Приказ Департамента образования и науки г. Москвы от 07.10.2021 № 666",
        meta: "Москва",
        description:
          "«Об утверждении Положения о деятельности психолого-педагогического консилиума в государственных образовательных организациях г. Москвы». Базовый документ для модуля ППк в universum.",
        url: "https://dpo.edu.gov.ru/documents/1197/",
        badge: "ППк",
      },
      {
        title: "Распоряжение Минпросвещения России от 09.09.2019 № Р-93",
        description:
          "«Об утверждении примерного Положения о психолого-педагогическом консилиуме образовательной организации». Федеральный ориентир для работы ППк.",
        url: "http://publication.pravo.gov.ru/Document/View/0001201909260010",
      },
      {
        title: "Приказ Минобрнауки России от 20.09.2013 № 1082",
        description:
          "«Об утверждении Положения о психолого-медико-педагогической комиссии». Регулирует деятельность ПМПК и взаимодействие с ППк образовательных организаций.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_153874/",
        badge: "ПМПК",
      },
      {
        title: "Письмо Минпросвещения России от 20.02.2019 № ТС-551/07",
        description:
          "«О сопровождении образования обучающихся с ОВЗ и инвалидностью». Методические указания по психолого-педагогическому сопровождению.",
        url: "https://docs.edu.gov.ru/document/c25e6c652e3d62b85daab93f9d3a3da9/",
      },
    ],
  },
  {
    id: "fgos",
    title: "ФГОС и образовательные стандарты",
    icon: GraduationCap,
    intro:
      "Федеральные государственные образовательные стандарты, в рамках которых выстраивается коррекционно-развивающая работа специалистов.",
    docs: [
      {
        title: "Приказ Минобрнауки России от 17.10.2013 № 1155 — ФГОС ДО",
        description: "Федеральный государственный образовательный стандарт дошкольного образования.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_154637/",
      },
      {
        title: "Приказ Минпросвещения России от 31.05.2021 № 286 — ФГОС НОО",
        description: "Федеральный государственный образовательный стандарт начального общего образования.",
        url: "http://publication.pravo.gov.ru/Document/View/0001202107050027",
      },
      {
        title: "Приказ Минобрнауки России от 19.12.2014 № 1598 — ФГОС НОО ОВЗ",
        description: "ФГОС начального общего образования обучающихся с ограниченными возможностями здоровья.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_175495/",
        badge: "ОВЗ",
      },
      {
        title: "Приказ Минобрнауки России от 19.12.2014 № 1599 — ФГОС УО",
        description: "ФГОС образования обучающихся с умственной отсталостью (интеллектуальными нарушениями).",
        url: "http://www.consultant.ru/document/cons_doc_LAW_175316/",
      },
    ],
  },
  {
    id: "health",
    title: "Методики Минздрава и охрана здоровья",
    icon: HeartPulse,
    intro:
      "Методические рекомендации, на которые опираются диагностические и коррекционные модули платформы (в том числе модуль «Лекотека»).",
    docs: [
      {
        title: "Методические рекомендации Минздрава России по работе с детьми раннего возраста",
        description:
          "Принципы ранней помощи, диагностики и сопровождения детей с риском нарушений развития, используемые в модуле раннего вмешательства.",
        url: "https://www.rosminzdrav.ru/documents",
      },
      {
        title: "Концепция развития ранней помощи в РФ (распоряжение Правительства РФ от 31.08.2016 № 1839-р)",
        description:
          "Основа межведомственного взаимодействия здравоохранения, образования и социальной защиты по ранней помощи семьям с детьми.",
        url: "http://government.ru/docs/24288/",
      },
      {
        title: "СанПиН 1.2.3685-21 — гигиенические нормативы",
        description:
          "Требования к условиям обучения, режиму работы с цифровыми средствами обучения и охране здоровья несовершеннолетних.",
        url: "http://publication.pravo.gov.ru/Document/View/0001202102030022",
      },
    ],
  },
  {
    id: "security",
    title: "Защита персональных данных и информационная безопасность",
    icon: Shield,
    intro:
      "Нормативные акты, определяющие требования к обработке и защите специальных категорий ПДн (сведений о здоровье обучающихся). Платформа размещена в защищённом сегменте Cloud.ru, соответствует уровню защищённости УЗ-1.",
    docs: [
      {
        title: "Постановление Правительства РФ от 01.11.2012 № 1119",
        description:
          "«Об утверждении требований к защите персональных данных при их обработке в ИСПДн». Определяет уровни защищённости (УЗ-1…УЗ-4).",
        url: "http://www.consultant.ru/document/cons_doc_LAW_137356/",
        badge: "УЗ-1",
      },
      {
        title: "Приказ ФСТЭК России от 18.02.2013 № 21",
        description:
          "Состав и содержание организационных и технических мер по обеспечению безопасности ПДн в информационных системах.",
        url: "https://fstec.ru/normotvorcheskaya/akty/53-prikazy/691",
      },
      {
        title: "Приказ ФСБ России от 10.07.2014 № 378",
        description: "Требования к защите ПДн с использованием средств криптографической защиты информации.",
        url: "http://www.consultant.ru/document/cons_doc_LAW_169199/",
      },
      {
        title: "Приказ Роскомнадзора от 24.02.2021 № 18",
        description:
          "Требования к содержанию согласия на обработку персональных данных, разрешённых субъектом для распространения.",
        url: "http://publication.pravo.gov.ru/Document/View/0001202103310021",
      },
    ],
  },
  {
    id: "registry",
    title: "Реестр российского ПО и интеллектуальная собственность",
    icon: Building2,
    intro:
      "Сведения о регистрации платформы в государственных реестрах и патентной защите решений.",
    docs: [
      {
        title: "Постановление Правительства РФ от 16.11.2015 № 1236",
        description:
          "Об установлении запрета на допуск иностранного ПО при закупках для государственных и муниципальных нужд. Основание для использования отечественного ПО.",
        url: "http://government.ru/docs/20651/",
      },
      {
        title: "Единый реестр российского программного обеспечения",
        description:
          "Реестр Минцифры России, в который внесены сведения о платформе universum. Подробности — на странице «Реестр российского ПО».",
        url: "https://reestr.digital.gov.ru/",
        badge: "Минцифры",
      },
    ],
  },
];

function matchesQuery(doc: Doc, q: string): boolean {
  return (
    doc.title.toLowerCase().includes(q) ||
    doc.description.toLowerCase().includes(q) ||
    (doc.meta?.toLowerCase().includes(q) ?? false) ||
    (doc.badge?.toLowerCase().includes(q) ?? false)
  );
}

export default function Legal() {
  const [query, setQuery] = useState("");

  useSeoMeta({
    title: "Нормативно-правовая база — законы и стандарты | universum.",
    description:
      "Перечень нормативных документов, на основании которых работает платформа universum.: ФЗ-273, ФЗ-152, Приказ ДОНМ № 666, ФГОС, требования ФСТЭК и ФСБ. Ссылки на официальные источники.",
    canonical: "/legal",
    keywords:
      "нормативно-правовая база, ФЗ-152, ФЗ-273, Приказ 666 ДОНМ, ППк, ПМПК, ФГОС ОВЗ, ФСТЭК, защита персональных данных",
  });

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map((section) => {
        const sectionMatch =
          section.title.toLowerCase().includes(q) ||
          section.intro.toLowerCase().includes(q);
        const matchedDocs = section.docs.filter((doc) => matchesQuery(doc, q));

        if (sectionMatch) {
          return section;
        }
        if (matchedDocs.length > 0) {
          return { ...section, docs: matchedDocs };
        }
        return null;
      })
      .filter((s): s is Section => s !== null);
  }, [query]);

  const totalDocs = filteredSections.reduce((sum, s) => sum + s.docs.length, 0);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="legal" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Нормативно-правовая база
            </h1>
            <p className="text-muted-foreground text-lg">
              Перечень федеральных законов, ведомственных приказов и стандартов,
              на основании которых разработана и эксплуатируется платформа universum.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Поиск по названию, описанию или типу документа…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-10"
              />
              {hasQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setQuery("")}
                  aria-label="Очистить поиск"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {hasQuery && (
              <p className="mt-2 text-sm text-muted-foreground">
                Найдено {totalDocs} {totalDocs === 1 ? "документ" : totalDocs >= 2 && totalDocs <= 4 ? "документа" : "документов"} в {filteredSections.length}{" "}
                {filteredSections.length === 1 ? "разделе" : "разделах"}
              </p>
            )}
          </div>

          {/* Quick TOC — hide when searching */}
          {!hasQuery && (
            <nav aria-label="Разделы документа" className="mb-12">
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="py-4 px-5">
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="text-primary hover:underline inline-flex items-center gap-2"
                        >
                          <s.icon className="h-3.5 w-3.5" />
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </nav>
          )}

          {filteredSections.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                По запросу «{query.trim()}» ничего не найдено
              </p>
              <p className="text-sm text-muted-foreground">
                Попробуйте изменить запрос или сбросить фильтр
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
                Сбросить поиск
              </Button>
            </div>
          ) : (
            filteredSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <section key={section.id} id={section.id} className="mb-12 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-semibold">{section.title}</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">{section.intro}</p>

                  <div className="space-y-3">
                    {section.docs.map((doc) => (
                      <Card key={doc.title} className="border-border/60">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                              <CardTitle className="text-base leading-snug">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors inline-flex items-start gap-1"
                                >
                                  <span>{doc.title}</span>
                                  <ExternalLink className="h-3.5 w-3.5 mt-1 flex-shrink-0 opacity-60" />
                                </a>
                              </CardTitle>
                            </div>
                            {doc.badge && (
                              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                {doc.badge}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pl-12">
                          {doc.meta && (
                            <p className="text-xs text-muted-foreground mb-1">{doc.meta}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {idx < filteredSections.length - 1 && <Separator className="mt-12" />}
                </section>
              );
            })
          )}

          <Card className="border-border/60 bg-muted/30 mt-8">
            <CardContent className="py-5 px-5">
              <p className="text-sm text-muted-foreground">
                Ссылки на нормативные документы ведут на официальные источники
                (КонсультантПлюс, Официальный интернет-портал правовой информации,
                сайты профильных ведомств). Актуальные редакции документов
                могут отличаться — пользуйтесь датой обращения и проверяйте
                действующую редакцию на момент применения.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
