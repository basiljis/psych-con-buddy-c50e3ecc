import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

type Testimonial = { name: string; role: string; text: string };

export function TestimonialsSection() {
  const { t } = useTranslation("pages");
  const testimonials = t("testimonials.items", { returnObjects: true }) as Testimonial[];
  const rating = 5;

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("testimonials.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((tt) => (
            <Card key={tt.name} className="border-border/50 relative">
              <CardContent className="p-6">
                <Quote className="h-7 w-7 text-primary/20 mb-3" />
                <div className="flex gap-0.5 mb-3" aria-label={t("testimonials.ratingAria", { rating })}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5 text-foreground">«{tt.text}»</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-sm">{tt.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tt.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
