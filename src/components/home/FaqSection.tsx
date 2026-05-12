import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import pagesRu from "@/i18n/locales/pages.ru.json";

type FaqItem = { q: string; a: string };

// Re-exported for JSON-LD on Home — uses RU items as canonical for SEO indexing
export const homeFaqItems: FaqItem[] = (pagesRu as { faq: { items: FaqItem[] } }).faq.items;

export function FaqSection() {
  const { t } = useTranslation("pages");
  const items = t("faq.items", { returnObjects: true }) as FaqItem[];

  return (
    <section className="py-16 md:py-24 px-4 bg-muted/30" id="faq">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("faq.title")}</h2>
          <p className="text-muted-foreground">{t("faq.subtitle")}</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
