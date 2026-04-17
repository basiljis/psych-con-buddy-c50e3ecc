import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  Building2,
  GraduationCap,
  Users,
  ShieldCheck,
  ClipboardCheck,
  CalendarDays,
  FileText,
  BarChart3,
  ArrowRight,
  Sparkles,
  Award,
  Lock,
} from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "Организациям",
    description: "Школы, детские сады, ППМС-центры. Управление ППк, расписаниями, отчётностью.",
    href: "/for-organizations",
    color: "from-blue-500/10 to-blue-500/5",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: GraduationCap,
    title: "Специалистам",
    description: "Психологи, логопеды, дефектологи. Протоколы, диагностики, личный кабинет.",
    href: "/for-specialists",
    color: "from-orange-500/10 to-orange-500/5",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: Users,
    title: "Родителям",
    description: "Запись на консультации, тесты развития ребёнка, доступ к рекомендациям.",
    href: "/for-parents",
    color: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
];

const features = [
  {
    icon: ClipboardCheck,
    title: "Протоколы ППк",
    description: "По Приказу № 666 ДОНМ. Чек-листы, выводы, рекомендации.",
  },
  {
    icon: CalendarDays,
    title: "Расписание",
    description: "Индивидуальные и групповые занятия, напоминания родителям.",
  },
  {
    icon: FileText,
    title: "Диагностики",
    description: "Тесты развития, методики Минздрава, экспорт результатов.",
  },
  {
    icon: BarChart3,
    title: "Аналитика и отчёты",
    description: "Статистика по специалистам, нагрузка, динамика учеников.",
  },
];

const trust = [
  { icon: ShieldCheck, label: "ФЗ‑152", sub: "УЗ‑1, СберОблако" },
  { icon: Award, label: "Реестр ПО РФ", sub: "Отечественное ПО" },
  { icon: Lock, label: "Защита данных", sub: "RLS, 2FA, IP-фильтр" },
  { icon: Sparkles, label: "Приказ № 666", sub: "ДОНМ Москвы" },
];

const stats = [
  { value: "150+", label: "организаций" },
  { value: "2 000+", label: "специалистов" },
  { value: "50 000+", label: "протоколов" },
  { value: "5 лет", label: "хранение данных" },
];

export default function Home() {
  useSeoMeta({
    title: "Universum — цифровая платформа для ППк, психологов и логопедов",
    description:
      "Платформа для школ, ППМС-центров и специалистов: протоколы ППк, диагностики, расписание, отчётность. Соответствие ФЗ‑152 и Приказу № 666 ДОНМ.",
    canonical: "https://unvrsm.ru/",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="landing" />

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 -z-10 h-[400px] w-[800px] rounded-full bg-primary/10 blur-3xl" />

        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-background/50 backdrop-blur text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Развитие. Для каждого.
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Цифровая платформа{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              для психолого-педагогической работы
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Протоколы ППк, диагностики, расписание и отчётность в одном месте.
            Для школ, ППМС-центров и частной практики.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button asChild size="lg" className="text-base h-12 px-8">
              <Link to="/auth">
                Запросить демо
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base h-12 px-8">
              <Link to="/auth">Попробовать бесплатно</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8 border-t">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Audiences */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Кому подходит</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Выберите свою роль — и узнайте, как платформа упростит вашу работу
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((a) => (
              <Link key={a.href} to={a.href} className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-border/50">
                  <CardContent className="p-8">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-5`}
                    >
                      <a.icon className={`h-7 w-7 ${a.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                      {a.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      Подробнее
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Key features */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ключевые возможности</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Всё, что нужно для работы психолого-педагогической службы
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg">
              <Link to="/features">
                Все возможности
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Доверие и соответствие</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Все требования российского законодательства соблюдены
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trust.map((t) => (
              <div
                key={t.label}
                className="flex flex-col items-center text-center p-6 rounded-xl border bg-card"
              >
                <t.icon className="h-8 w-8 text-primary mb-3" />
                <div className="font-semibold text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button asChild variant="ghost" size="sm">
              <Link to="/documents">Сертификация</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/registry">Реестр отечественного ПО</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/privacy-policy">Политика конфиденциальности</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
            <CardContent className="p-10 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Начните уже сегодня
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Подключение за один день. Бесплатный пробный период для специалистов.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="text-base h-12 px-8">
                  <Link to="/auth">
                    Запросить демо
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base h-12 px-8">
                  <Link to="/pricing">Тарифы</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
