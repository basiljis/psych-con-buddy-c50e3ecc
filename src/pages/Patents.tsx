import { useTranslation } from "react-i18next";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { FileText, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Patents() {
  const { t, i18n } = useTranslation("pages");
  const isEn = (i18n.resolvedLanguage || i18n.language || "ru").toLowerCase().startsWith("en");

  useSeoMeta({
    title: t("patents.seoTitle"),
    description: t("patents.seoDescription"),
    canonical: "/patents",
    keywords:
      "патенты, свидетельство, депонирование, РЦИС, НРИС, АИС ППк, авторское право, universum",
    locale: isEn ? "en_US" : "ru_RU",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {t("patents.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("patents.subtitle")}
            </p>
          </div>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">{t("patents.sectionTitle")}</h2>
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base leading-tight">
                      {t("patents.cardTitle")}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    {t("patents.badge")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("patents.description")}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("patents.regNumber")}</span>{" "}
                    <span className="font-medium">307-082-374</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("patents.depositDate")}</span>{" "}
                    <span className="font-medium">22.08.2025</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("patents.objectType")}</span>{" "}
                    <span className="font-medium">{t("patents.objectTypeValue")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("patents.certNumber")}</span>{" "}
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
                    {t("patents.downloadCert")}
                  </a>
                  <a
                    href="https://nris.ru/deposits/check-certificate/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    {t("patents.verify")}
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
