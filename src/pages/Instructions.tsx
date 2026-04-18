import { useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  Building2,
  GraduationCap,
  Heart,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/instructions/hero.jpg";
import orgAdminImg from "@/assets/instructions/role-org-admin.jpg";
import specialistImg from "@/assets/instructions/role-specialist.jpg";
import parentImg from "@/assets/instructions/role-parent.jpg";

type RoleKey = "org-admin" | "specialist" | "parent";

interface Step {
  title: string;
  description: string;
  details: string[];
}

interface RoleGuide {
  key: RoleKey;
  title: string;
  shortTitle: string;
  tagline: string;
  icon: typeof Building2;
  image: string;
  badge: string;
  steps: Step[];
  cta: { label: string; href: string };
}

const ROLE_GUIDES: RoleGuide[] = [
  {
    key: "org-admin",
    title: "Администратор организации",
    shortTitle: "Организации",
    tagline:
      "Подключите школу или ППМС-центр, добавьте сотрудников и контролируйте работу всей команды в одном окне.",
    icon: Building2,
    image: orgAdminImg,
    badge: "Для руководителей и завучей",
    cta: { label: "Зарегистрировать организацию", href: "/auth" },
    steps: [
      {
        title: "1. Регистрация организации",
        description:
          "Заполните анкету организации: ИНН, название, адрес, контактное лицо. Мы проверим данные и активируем аккаунт.",
        details: [
          "Подача заявки занимает 3 минуты",
          "Поддержка ЕКИС/ЕАИС ДОНМ — данные подгружаются автоматически",
          "Назначение администратора и заместителей",
        ],
      },
      {
        title: "2. Добавление сотрудников",
        description:
          "Создайте учётные записи специалистов: психологи, логопеды, дефектологи. Распределите роли и права доступа.",
        details: [
          "Массовый импорт из CSV или ручное добавление",
          "Гибкие права: ППк, расписание, статистика",
          "Отправка приглашений по e-mail с авто-логином",
        ],
      },
      {
        title: "3. Настройка расписания и KPI",
        description:
          "Загрузите часы работы, праздники, тарифы. Настройте показатели эффективности команды.",
        details: [
          "Календарь с учётом российских и школьных праздников",
          "KPI по количеству занятий, ППк, договоров",
          "Отчёты по нагрузке специалистов",
        ],
      },
      {
        title: "4. Контроль и отчётность",
        description:
          "В реальном времени видите статистику, журналы изменений и финансовые показатели.",
        details: [
          "Дашборд: занятия, ППк, доходы, отзывы",
          "История всех действий пользователей",
          "Выгрузка отчётов в Excel и PDF",
        ],
      },
    ],
  },
  {
    key: "specialist",
    title: "Специалист (психолог / логопед / дефектолог)",
    shortTitle: "Специалистам",
    tagline:
      "Сосредоточьтесь на детях — рутину возьмёт на себя система. ППк, протоколы, расписание и связь с родителями в одном кабинете.",
    icon: GraduationCap,
    image: specialistImg,
    badge: "Для педагогов-психологов и дефектологов",
    cta: { label: "Войти как специалист", href: "/auth" },
    steps: [
      {
        title: "1. Карточка ребёнка",
        description:
          "Создайте подробное досье: ФИО, дата рождения, класс, история обращений, документы, согласия родителей.",
        details: [
          "Хранение согласий по ФЗ-152",
          "Файлы и фото — до 50 МБ на ребёнка",
          "Связь карточки с родительским аккаунтом",
        ],
      },
      {
        title: "2. Протокол ППк",
        description:
          "Заполняйте структурированный протокол по Приказу ДОНМ № 666: чек-листы, динамика, рекомендации.",
        details: [
          "Шаблоны для разных уровней образования (НОО/ООО/СОО)",
          "Автоматический расчёт радар-диаграммы динамики",
          "Экспорт готового PDF с шапкой организации",
        ],
      },
      {
        title: "3. Расписание занятий",
        description:
          "Планируйте индивидуальные и групповые занятия, видеоконсультации, выезды.",
        details: [
          "Drag-and-drop в календаре",
          "Авто-напоминания родителям в Telegram и e-mail",
          "Учёт отмен, переносов и больничных",
        ],
      },
      {
        title: "4. Аналитика и развитие",
        description:
          "Отслеживайте прогресс ребёнка, сравнивайте результаты, формируйте заключения.",
        details: [
          "Сравнение протоколов в динамике",
          "Рекомендации на основе результатов тестов",
          "База материалов и упражнений по сферам развития",
        ],
      },
    ],
  },
  {
    key: "parent",
    title: "Родитель (законный представитель)",
    shortTitle: "Родителям",
    tagline:
      "Запишите ребёнка к специалисту, проходите развивающие тесты дома, получайте рекомендации и следите за прогрессом.",
    icon: Heart,
    image: parentImg,
    badge: "Для родителей и опекунов",
    cta: { label: "Кабинет родителя", href: "/parent-auth" },
    steps: [
      {
        title: "1. Регистрация и подтверждение согласия",
        description:
          "Создайте аккаунт по e-mail или телефону. Подпишите цифровое согласие на обработку данных ребёнка.",
        details: [
          "Подтверждение по SMS / e-mail",
          "Согласие хранится в защищённом виде (УЗ-1)",
          "Возможность отозвать согласие в любой момент",
        ],
      },
      {
        title: "2. Добавление ребёнка",
        description:
          "Заполните карточку ребёнка: имя, возраст, образовательный уровень, особенности развития.",
        details: [
          "Поддержка нескольких детей в одном аккаунте",
          "Привязка к организации по уникальному коду",
          "Безопасный логин для самого ребёнка (рабочее пространство)",
        ],
      },
      {
        title: "3. Развивающие тесты и материалы",
        description:
          "Проходите чек-листы развития, получайте подборки упражнений по возрасту и сфере.",
        details: [
          "Тесты для возрастов от 1 до 18 лет",
          "Видео-инструкции и шаги выполнения",
          "Загрузка фото/видео результатов для специалиста",
        ],
      },
      {
        title: "4. Запись и общение со специалистом",
        description:
          "Бронируйте свободные слоты, получайте напоминания и читайте заключения ППк.",
        details: [
          "Календарь свободных слотов организации",
          "Уведомления в Telegram и по e-mail",
          "Доступ к ознакомительным версиям заключений",
        ],
      },
    ],
  },
];

const Instructions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as RoleKey) || "org-admin";

  useSeoMeta({
    title: "Инструкции — как работает Universum для школ, специалистов и родителей",
    description:
      "Пошаговые инструкции по работе с платформой Universum: регистрация организации, ведение ППк, расписание и кабинет родителя.",
    canonical: "https://www.unvrsm.ru/instructions",
  });

  const activeRole = useMemo<RoleKey>(() => {
    const fromUrl = searchParams.get("role") as RoleKey | null;
    if (fromUrl && ROLE_GUIDES.some((r) => r.key === fromUrl)) return fromUrl;
    return initialRole;
  }, [searchParams, initialRole]);

  const handleRoleChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("role", next);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (!searchParams.get("role")) {
      const params = new URLSearchParams(searchParams);
      params.set("role", "org-admin");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar showSecondaryNav={false} currentPage="other" />

      <main className="flex-1 pt-20 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Демонстрация работы системы
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Инструкции по&nbsp;работе с&nbsp;Universum
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Подробный гид по платформе для каждой роли: администратора организации,
                специалиста и родителя. Узнайте, как система упрощает работу
                ППк, расписания и взаимодействия с семьями.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Попробовать систему
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/for-organizations">Подробнее об организациях</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Соответствует ФЗ-152, Приказу ДОНМ № 666, методикам Минздрава РФ
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Иллюстрация инструкций Universum"
                width={1280}
                height={512}
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </section>

        <Separator className="my-4" />

        {/* Roles tabs */}
        <section className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Выберите свою роль
            </h2>
            <p className="text-muted-foreground">
              Каждый раздел показывает реальный путь пользователя в системе
            </p>
          </div>

          <Tabs value={activeRole} onValueChange={handleRoleChange} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
              {ROLE_GUIDES.map((role) => {
                const Icon = role.icon;
                return (
                  <TabsTrigger key={role.key} value={role.key} className="gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{role.shortTitle}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {ROLE_GUIDES.map((role) => {
              const Icon = role.icon;
              return (
                <TabsContent key={role.key} value={role.key} className="space-y-8">
                  {/* Role hero */}
                  <Card className="overflow-hidden border-2">
                    <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8 items-center">
                      <div>
                        <Badge className="mb-3 gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {role.badge}
                        </Badge>
                        <h3 className="text-2xl md:text-3xl font-bold mb-3">
                          {role.title}
                        </h3>
                        <p className="text-muted-foreground mb-5">{role.tagline}</p>
                        <Button asChild>
                          <Link to={role.cta.href}>
                            {role.cta.label}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <img
                        src={role.image}
                        alt={`Иллюстрация: ${role.title}`}
                        width={1024}
                        height={640}
                        loading="lazy"
                        className="w-full h-auto rounded-xl"
                      />
                    </div>
                  </Card>

                  {/* Steps */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {role.steps.map((step, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {step.details.map((detail, dIdx) => (
                              <li
                                key={dIdx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 py-12">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Готовы попробовать Universum?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Зарегистрируйтесь и получите 14 дней бесплатного доступа ко всем
                возможностям платформы.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">Начать бесплатно</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">Тарифы</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Instructions;
