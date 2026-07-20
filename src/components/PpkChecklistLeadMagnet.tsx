import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, FileCheck, Shield, ClipboardCheck, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { robotoRegularBase64 } from "@/assets/fonts/roboto-regular-base64";
import { robotoBoldBase64 } from "@/assets/fonts/roboto-bold-base64";

type ChecklistSection = { category: string; items: string[] };

const checklistItemsByLang: Record<"ru" | "en", ChecklistSection[]> = {
  ru: [
    {
      category: "Документация ППк",
      items: [
        "Приказ о создании ППк с указанием актуального персонального состава членов",
        "Положение о ППк, утверждённое руководителем образовательной организации",
        "График плановых заседаний на текущий учебный год (не менее 3 в год)",
        "Журнал записи и учёта заседаний ППк (пронумерован, прошит, скреплён печатью)",
        "Протоколы всех заседаний: плановых и внеплановых (подписаны всеми членами)",
        "Коллегиальные заключения ППк по каждому обследованному ребёнку",
        "Согласия родителей (законных представителей) на обследование и сопровождение (ФЗ-152)",
        "Представления специалистов (психолога, логопеда, дефектолога, педагога) на каждого ребёнка",
        "Журнал направлений детей на ПМПК и учёт выданных рекомендаций",
      ],
    },
    {
      category: "Состав и квалификация членов ППк",
      items: [
        "Председатель ППк назначен приказом руководителя (заместитель директора по УВР)",
        "Секретарь ППк назначен, ведёт документацию, протоколирует заседания",
        "В составе обязательные специалисты: педагог-психолог, учитель-логопед, учитель-дефектолог",
        "Педагоги и воспитатели, работающие с ребёнком, привлекаются к заседаниям",
        "Квалификация всех членов подтверждена документально (дипломы, удостоверения о ПК)",
        "Члены ППк прошли повышение квалификации по профилю за последние 3 года",
        "Протоколы подписаны всеми присутствующими членами комиссии",
      ],
    },
    {
      category: "Работа с детьми и сопровождение",
      items: [
        "Карты развития (индивидуальные карты учёта) ведутся на каждого ребёнка",
        "Индивидуальные образовательные маршруты (ИОМ) разработаны и актуализированы",
        "Динамика развития фиксируется не реже 1 раза в полугодие (промежуточная диагностика)",
        "Рекомендации ПМПК/ЦПМПК учтены, реализуются и отражены в документах",
        "Результаты диагностики оформлены по установленному образцу (протокол обследования)",
        "Ведётся мониторинг эффективности коррекционно-развивающей работы",
        "Заключения ППк содержат конкретные рекомендации по каждой сфере развития",
        "Организован контроль выполнения рекомендаций педагогами и специалистами",
      ],
    },
    {
      category: "Взаимодействие с родителями (законными представителями)",
      items: [
        "Письменные согласия получены до проведения обследования ребёнка",
        "Родители уведомлены о дате и цели заседания ППк заблаговременно",
        "Родители ознакомлены с коллегиальным заключением ППк (под подпись)",
        "Проведены консультации по выполнению рекомендаций в домашних условиях",
        "Направления на ПМПК оформлены только с письменного согласия родителей",
        "Ведётся журнал консультаций родителей с фиксацией тематики и результатов",
      ],
    },
    {
      category: "Хранение и защита персональных данных",
      items: [
        "Документы ППк хранятся в защищённом месте (сейф, запираемый шкаф)",
        "Доступ к документам ограничен кругом членов ППк и руководителя ОО",
        "Электронные данные защищены паролем, доступ по персональным учётным записям",
        "Срок хранения документов ППк соблюдается — не менее 5 лет (Приказ № 666)",
        "Организация зарегистрирована в Роскомнадзоре как оператор ПДн",
        "Имеется утверждённая политика обработки персональных данных (ФЗ-152)",
        "Передача данных третьим лицам осуществляется только на законных основаниях",
      ],
    },
  ],
  en: [
    {
      category: "PPC documentation",
      items: [
        "Order establishing the PPC with the current personal composition of members",
        "PPC regulations approved by the head of the educational organization",
        "Schedule of planned meetings for the current academic year (at least 3 per year)",
        "PPC meeting logbook (numbered, bound, sealed)",
        "Minutes of all meetings: planned and unplanned (signed by all members)",
        "Collegial PPC conclusions for each examined child",
        "Consents of parents (legal guardians) to examination and support (FZ-152)",
        "Specialist reports (psychologist, speech therapist, defectologist, teacher) for each child",
        "Log of PMPC referrals and records of issued recommendations",
      ],
    },
    {
      category: "Committee composition and qualifications",
      items: [
        "PPC chair appointed by order of the head (deputy director for academic affairs)",
        "PPC secretary appointed, maintains documentation, records meetings",
        "Required specialists included: educational psychologist, speech therapist, defectologist",
        "Teachers and educators working with the child are involved in meetings",
        "All members' qualifications are documented (diplomas, professional development certificates)",
        "PPC members have completed relevant professional development in the last 3 years",
        "Minutes are signed by all committee members present",
      ],
    },
    {
      category: "Work with children and support",
      items: [
        "Development records (individual tracking cards) are kept for each child",
        "Individual educational routes (IER) are developed and updated",
        "Development dynamics are recorded at least once per semester (interim diagnostics)",
        "PMPC/CPMPC recommendations are considered, implemented and reflected in documents",
        "Diagnostic results are formatted per the established template (examination protocol)",
        "Monitoring of correctional and developmental work effectiveness is in place",
        "PPC conclusions contain specific recommendations for each area of development",
        "Compliance with recommendations by teachers and specialists is monitored",
      ],
    },
    {
      category: "Interaction with parents (legal guardians)",
      items: [
        "Written consents obtained prior to the child's examination",
        "Parents are notified of the PPC meeting date and purpose in advance",
        "Parents are informed of the collegial PPC conclusion (with signature)",
        "Consultations conducted on implementing recommendations at home",
        "PMPC referrals are made only with the written consent of parents",
        "A log of parent consultations is maintained with topics and outcomes",
      ],
    },
    {
      category: "Storage and protection of personal data",
      items: [
        "PPC documents are stored in a secure location (safe, lockable cabinet)",
        "Access to documents is restricted to PPC members and the head of the organization",
        "Electronic data is password-protected, accessed via personal accounts",
        "PPC document retention period is observed — at least 5 years (Order № 666)",
        "The organization is registered with Roskomnadzor as a personal data operator",
        "An approved personal data processing policy is in place (FZ-152)",
        "Transfer of data to third parties is carried out only on legal grounds",
      ],
    },
  ],
};

type PdfCopy = {
  title: string;
  subtitle: string;
  brand: string;
  footer1: string;
  footer2: string;
  filename: string;
};

const pdfCopyByLang: Record<"ru" | "en", PdfCopy> = {
  ru: {
    title: "Чек-лист: Готовность ППк к проверке",
    subtitle: "Составлено на основе Приказа ДОНМ Москвы № 666 и методических рекомендаций",
    brand: "universum. — платформа автоматизации ППк | unvrsm.ru",
    footer1: "Автоматизируйте ведение ППк с платформой universum.",
    footer2: "Бесплатный пробный период — 7 дней.",
    filename: "checklist-ppk-proverka.pdf",
  },
  en: {
    title: "Checklist: PPC readiness for inspection",
    subtitle: "Based on Moscow DoE Order № 666 and methodological guidelines",
    brand: "universum. — PPC automation platform | unvrsm.ru",
    footer1: "Automate your PPC workflow with universum.",
    footer2: "Free trial — 7 days.",
    filename: "checklist-ppk-inspection.pdf",
  },
};

function generatePDF(lang: "ru" | "en") {
  const items = checklistItemsByLang[lang];
  const copy = pdfCopyByLang[lang];
  const doc = new jsPDF({ format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  doc.setFontSize(18);
  doc.setFont("Roboto", "bold");
  doc.text(copy.title, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(copy.subtitle, margin, y);
  y += 5;
  doc.text(copy.brand, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 12;

  items.forEach((section) => {
    if (y > 260) {
      doc.addPage();
      y = 25;
    }
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(margin, y - 5, contentWidth, 9, 2, 2, "F");
    doc.text(section.category, margin + 4, y + 1);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    section.items.forEach((item) => {
      if (y > 275) {
        doc.addPage();
        y = 25;
      }
      doc.setDrawColor(180, 180, 180);
      doc.rect(margin + 2, y - 3.5, 4, 4);
      doc.text(item, margin + 10, y);
      y += 7;
    });
    y += 5;
  });

  if (y > 260) {
    doc.addPage();
    y = 25;
  }
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(copy.footer1, margin, y);
  y += 5;
  doc.text(copy.footer2, margin, y);
  y += 5;
  doc.setTextColor(41, 98, 255);
  doc.textWithLink("https://unvrsm.ru/", margin, y, { url: "https://unvrsm.ru/" });
  doc.setTextColor(0, 0, 0);

  doc.save(copy.filename);
}

export function PpkChecklistLeadMagnet() {
  const { t, i18n } = useTranslation("pages");
  const lang: "ru" | "en" = i18n.language?.startsWith("en") ? "en" : "ru";
  const items = checklistItemsByLang[lang];

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t("landing.leadMagnet.toast.emailRequired"));
      return;
    }

    setLoading(true);
    try {
      await supabase.from("lead_magnet_downloads" as any).insert({
        email: email.trim(),
        full_name: name.trim() || null,
        magnet_slug: "ppk-checklist",
      } as any);

      generatePDF(lang);
      setDownloaded(true);
      toast.success(t("landing.leadMagnet.toast.success"));
    } catch {
      toast.error(t("landing.leadMagnet.toast.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        className="border-2 border-dashed border-primary/30 hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer group bg-primary/5"
        onClick={() => setOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {t("landing.leadMagnet.card.free")}
                </Badge>
                <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  PDF
                </Badge>
              </div>
              <CardTitle className="text-lg mt-1">
                {t("landing.leadMagnet.card.title")}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-3">
            {t("landing.leadMagnet.card.desc")}
          </CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClipboardCheck className="h-3.5 w-3.5" />
              {t("landing.leadMagnet.card.items")}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              {t("landing.leadMagnet.card.order")}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              PDF
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          >
            <Download className="h-4 w-4" />
            {t("landing.leadMagnet.card.cta")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {t("landing.leadMagnet.dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("landing.leadMagnet.dialog.description")}
            </DialogDescription>
          </DialogHeader>

          {!downloaded ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead-email">{t("landing.leadMagnet.dialog.emailLabel")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder={t("landing.leadMagnet.dialog.emailPh")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-name">{t("landing.leadMagnet.dialog.nameLabel")}</Label>
                <Input
                  id="lead-name"
                  type="text"
                  placeholder={t("landing.leadMagnet.dialog.namePh")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium">{t("landing.leadMagnet.dialog.insideTitle")}</p>
                {items.map((s) => (
                  <p key={s.category} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                    {s.category} ({t("landing.leadMagnet.dialog.itemsCount", { count: s.items.length })})
                  </p>
                ))}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <Download className="h-4 w-4" />
                {loading ? t("landing.leadMagnet.dialog.submitting") : t("landing.leadMagnet.dialog.submit")}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                {t("landing.leadMagnet.dialog.consent")}{" "}
                <a href="/privacy" className="underline">
                  {t("landing.leadMagnet.dialog.privacyLink")}
                </a>
              </p>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-lg">{t("landing.leadMagnet.dialog.successTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("landing.leadMagnet.dialog.successDesc")}
                </p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">{t("landing.leadMagnet.dialog.automateTitle")}</p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/auth";
                  }}
                >
                  {t("landing.leadMagnet.dialog.tryFree")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
