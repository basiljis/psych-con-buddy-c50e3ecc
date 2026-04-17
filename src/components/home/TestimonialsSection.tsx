import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Анна П.",
    role: "Педагог-психолог, ГБОУ № 1502",
    text: "Перешли с бумажных протоколов — экономия часа в день на каждого специалиста. Чек-листы по 666 приказу собраны идеально, родителям отправляем уведомления автоматически.",
    rating: 5,
  },
  {
    name: "Михаил К.",
    role: "Директор ППМС-центра",
    text: "Внедрили за неделю на 12 специалистов. Отчётность для ДОНМ формируется в один клик, статистика по нагрузке всегда под рукой. Поддержка отвечает быстро.",
    rating: 5,
  },
  {
    name: "Елена С.",
    role: "Логопед, частная практика",
    text: "Удобно вести карточки детей, родители сами записываются и оплачивают онлайн. За 330 рублей в месяц получаю полноценную CRM под мою специфику.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Что говорят пользователи
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Школы, ППМС-центры и частные специалисты по всей России
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/50 relative">
              <CardContent className="p-6">
                <Quote className="h-7 w-7 text-primary/20 mb-3" />
                <div className="flex gap-0.5 mb-3" aria-label={`Оценка ${t.rating} из 5`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5 text-foreground">
                  «{t.text}»
                </p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
