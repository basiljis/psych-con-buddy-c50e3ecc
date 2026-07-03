import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, FileText, BookOpen } from "lucide-react";
import { getLegalSection, legalSections } from "@/data/legalSections";

export default function LegalSection() {
  const { sectionId = "" } = useParams<{ sectionId: string }>();
  const section = getLegalSection(sectionId);

  useSeoMeta({
    title: section
      ? `${section.title} — нормативная база | universum.`
      : "Раздел не найден — нормативная база | universum.",
    description: section
      ? `${section.intro} Полный перечень документов раздела «${section.shortTitle}» со ссылками на официальные источники.`
      : "Запрошенный раздел нормативной базы не найден.",
    canonical: `/legal/${sectionId}`,
  });

  if (!section) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNavbar currentPage="legal" showSecondaryNav={false} />
        <main className="flex-1 pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center py-16">
            <h1 className="text-2xl font-semibold mb-3">Раздел не найден</h1>
            <p className="text-muted-foreground mb-6">
              Возможно, ссылка устарела. Вернитесь к списку разделов нормативной базы.
            </p>
            <Button asChild>
              <Link to="/legal">
                <ArrowLeft className="h-4 w-4 mr-2" />
                К нормативной базе
              </Link>
            </Button>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const Icon = section.icon;
  const otherSections = legalSections.filter((s) => s.id !== section.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="legal" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 flex-wrap" aria-label="Хлебные крошки">
            <Link to="/legal" className="hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Нормативная база
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{section.shortTitle}</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Icon className="h-6 w-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">{section.title}</h1>
            </div>
            <p className="text-muted-foreground text-lg">{section.intro}</p>
          </div>

          <div className="space-y-3 mb-12">
            {section.docs.map((doc) => (
              <DocCard key={doc.title} doc={doc} />
            ))}
          </div>

          {/* Other sections */}
          <section aria-labelledby="other-sections" className="mt-12">
            <h2 id="other-sections" className="text-xl font-semibold mb-4">
              Другие разделы нормативной базы
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {otherSections.map((s) => {
                const SIcon = s.icon;
                return (
                  <Link
                    key={s.id}
                    to={`/legal/${s.id}`}
                    className="group block rounded-lg border border-border/60 bg-card p-4 hover:border-primary/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <SIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm group-hover:text-primary">
                        {s.shortTitle}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.title}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
