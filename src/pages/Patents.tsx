import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { FileText, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Patents() {
  useSeoMeta({
    title: "Патенты и свидетельства — АИС ППк | universum.",
    description:
      "Свидетельство о депонировании компонента «АИС ППк» платформы universum. Регистрационный номер 307-082-374, выдано 22.08.2025 РЦИС / АО «НРИС».",
    canonical: "/patents",
    keywords:
      "патенты, свидетельство, депонирование, РЦИС, НРИС, АИС ППк, авторское право, universum",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Патенты и свидетельства
            </h1>
            <p className="text-muted-foreground text-lg">
              Зарегистрированные объекты интеллектуальной собственности — компоненты платформы universum.
            </p>
          </div>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Депонированные компоненты</h2>
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base leading-tight">
                      АИС ППк — модуль психолого-педагогического консилиума
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    Депонировано
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  «АИС ППк» — компонент платформы universum., обеспечивающий ведение протоколов
                  психолого-педагогического консилиума, формирование заключений и хранение результатов
                  обследования обучающихся. Компьютерная программа депонирована в Акционерном обществе
                  «Национальный реестр интеллектуальной собственности» (АО «НРИС») и зарегистрирована в
                  Российском центре оборота прав на результаты творческой деятельности (РЦИС).
                  Свидетельство подтверждает авторство и приоритет разработки.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Регистрационный номер:</span>{" "}
                    <span className="font-medium">307-082-374</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дата депонирования:</span>{" "}
                    <span className="font-medium">22.08.2025</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Тип объекта:</span>{" "}
                    <span className="font-medium">Компьютерная программа</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Свидетельство РЦИС №:</span>{" "}
                    <span className="font-medium">0864-181-444</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/documents/certificate-aispk.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Скачать свидетельство (PDF)
                  </a>
                  <a
                    href="https://nris.ru/deposits/check-certificate/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    Проверить подлинность на nris.ru
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
