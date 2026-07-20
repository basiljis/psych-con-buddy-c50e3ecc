import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CookieConsent from "@/components/CookieConsent";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { PpkChecklistLeadMagnet } from "@/components/PpkChecklistLeadMagnet";
import {
  GraduationCap, Building2, Baby,
  ClipboardList, Calendar, FileText, Shield,
  CheckCircle, ArrowRight, Clock,
  BarChart3, UserCheck, Gamepad2,
  BookOpen, CalendarCheck, Bell, Users, Target,
  LucideIcon
} from "lucide-react";

type AudienceKey = "org" | "specialist" | "private" | "parent";

const howItWorks: { id: string; icon: LucideIcon }[] = [
  { id: "card", icon: FileText },
  { id: "protocols", icon: ClipboardList },
  { id: "planning", icon: Calendar },
  { id: "analytics", icon: BarChart3 },
];

const features: { id: string; icon: LucideIcon; isNew?: boolean; audience: AudienceKey[] }[] = [
  { id: "ppk", icon: ClipboardList, audience: ["org", "specialist"] },
  { id: "journal", icon: Calendar, isNew: true, audience: ["org", "specialist", "private"] },
  { id: "childCard", icon: FileText, audience: ["org", "specialist", "private", "parent"] },
  { id: "playroom", icon: Gamepad2, isNew: true, audience: ["parent"] },
  { id: "booking", icon: CalendarCheck, isNew: true, audience: ["org", "specialist", "private", "parent"] },
  { id: "directions", icon: Target, isNew: true, audience: ["specialist", "private", "parent"] },
  { id: "matching", icon: UserCheck, isNew: true, audience: ["parent"] },
  { id: "library", icon: BookOpen, isNew: true, audience: ["parent"] },
  { id: "analytics", icon: BarChart3, isNew: true, audience: ["org"] },
  { id: "notifications", icon: Bell, isNew: true, audience: ["org", "specialist", "private", "parent"] },
  { id: "security", icon: Shield, audience: ["org", "specialist", "private", "parent"] },
];

const audienceColors: Record<AudienceKey, string> = {
  org: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  specialist: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  private: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  parent: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

const userTypes = [
  {
    id: "org",
    icon: Building2,
    featureFlags: [{ isNew: true }, {}, { isNew: true }, { isNew: true }],
    link: "/for-organizations",
    authLink: "/register",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "specialist",
    icon: GraduationCap,
    featureFlags: [{ isNew: true }, { isNew: true }, { isNew: true }, {}],
    link: "/for-specialists",
    authLink: "/register",
    color: "from-orange-500/20 to-orange-600/10",
    borderColor: "border-orange-500/30",
  },
  {
    id: "parent",
    icon: Baby,
    featureFlags: [{ isNew: true }, {}, { isNew: true }, { isNew: true }],
    link: "/for-parents",
    authLink: "/parent-auth",
    color: "from-pink-500/20 to-pink-600/10",
    borderColor: "border-pink-500/30",
  },
];

interface PlanMeta {
  id: string;
  key: "org" | "specialistOrg" | "specialistPrivate" | "parent";
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  highlight: boolean;
  hasFreeLabel?: boolean;
  hasBadge?: boolean;
  hasYearlySaving?: boolean;
  hasComingSoon?: boolean;
  ctaLink: string;
}

const pricingPlansMeta: Record<"org" | "specialist" | "parent", PlanMeta[]> = {
  org: [
    { id: "org", key: "org", monthlyPrice: 2500, yearlyPrice: 25500, hasYearlySaving: true, hasBadge: true, highlight: true, ctaLink: "/register" },
  ],
  specialist: [
    { id: "specialistOrg", key: "specialistOrg", monthlyPrice: null, yearlyPrice: null, hasFreeLabel: true, highlight: false, ctaLink: "/register" },
    { id: "specialistPrivate", key: "specialistPrivate", monthlyPrice: 330, yearlyPrice: 2970, hasYearlySaving: true, hasBadge: true, hasComingSoon: true, highlight: true, ctaLink: "/register" },
  ],
  parent: [
    { id: "parent", key: "parent", monthlyPrice: null, yearlyPrice: null, hasFreeLabel: true, hasBadge: true, highlight: true, ctaLink: "/parent-auth" },
  ],
};

function PricingCard({ plan, billingPeriod }: { plan: PlanMeta; billingPeriod: "monthly" | "yearly" }) {
  const { t } = useTranslation("pages");
  const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const priceLabel = billingPeriod === "yearly" ? t("landing.pricing.priceYear") : t("landing.pricing.priceMonth");
  const base = `landing.pricing.plans.${plan.key}`;
  const features = t(`${base}.features`, { returnObjects: true }) as string[];
  const comingSoon = plan.hasComingSoon ? (t(`${base}.comingSoon`, { returnObjects: true }) as string[]) : [];

  return (
    <Card className={`relative flex flex-col transition-all hover:shadow-lg ${plan.highlight ? "border-primary border-2 shadow-md" : ""}`}>
      {plan.hasBadge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3 py-1 text-xs">{t(`${base}.badge`)}</Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{t(`${base}.name`)}</CardTitle>
        <CardDescription className="text-sm">{t(`${base}.subtitle`)}</CardDescription>
        <div className="mt-4">
          {plan.hasFreeLabel ? (
            <div className="text-lg font-bold text-primary leading-tight">{t(`${base}.freeLabel`)}</div>
          ) : price !== null ? (
            <div>
              <span className="text-3xl font-bold">{price.toLocaleString("ru-RU")}₽</span>
              <span className="text-muted-foreground text-sm ml-1">/ {priceLabel}</span>
              {plan.hasYearlySaving && billingPeriod === "yearly" && plan.monthlyPrice ? (
                <>
                  <div className="text-xs text-success mt-1 font-medium">{t(`${base}.yearlySaving`)}</div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5 line-through">
                    {t("landing.pricing.withoutDiscount", { price: (plan.monthlyPrice * 12).toLocaleString("ru-RU") })}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ul className="space-y-2 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {comingSoon.length > 0 && (
          <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("landing.pricing.comingSoon")}</span>
            </div>
            <ul className="space-y-1.5">
              {comingSoon.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 flex items-center justify-center flex-shrink-0 mt-0.5 text-muted-foreground/50">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link to={plan.ctaLink} className="mt-2">
          <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
            {t(`${base}.cta`)}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function PricingSection() {
  const { t } = useTranslation("pages");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="py-20 px-4" id="pricing">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">{t("landing.pricing.badge")}</Badge>
          <h2 className="text-3xl font-bold mb-4">{t("landing.pricing.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            {t("landing.pricing.subtitle")}
          </p>
          <div className="inline-flex items-center gap-2 bg-muted rounded-full px-2 py-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingPeriod === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${billingPeriod === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {t("landing.pricing.yearly")}
              <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">−15%</span>
            </button>
          </div>
        </div>

        <Tabs defaultValue="org" className="w-full">
          <TabsList className="mb-8 w-full max-w-lg mx-auto grid grid-cols-3">
            <TabsTrigger value="org" className="flex items-center justify-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {t("landing.pricing.tabs.org")}
            </TabsTrigger>
            <TabsTrigger value="specialist" className="flex items-center justify-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {t("landing.pricing.tabs.specialist")}
            </TabsTrigger>
            <TabsTrigger value="parent" className="flex items-center justify-center gap-1.5">
              <Baby className="h-4 w-4" />
              {t("landing.pricing.tabs.parent")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="org">
            <div className="flex justify-center">
              <div className="w-full max-w-xl">
                {pricingPlansMeta.org.map((plan) => (
                  <PricingCard key={plan.id} plan={plan} billingPeriod={billingPeriod} />
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              {t("landing.pricing.orgNote")} <Link to="/for-organizations" className="underline">{t("landing.pricing.orgNoteLink")}</Link>
            </p>
          </TabsContent>

          <TabsContent value="specialist">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                {t("landing.pricing.specialistNote")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {pricingPlansMeta.specialist.map((plan) => (
                <PricingCard key={plan.id} plan={plan} billingPeriod={billingPeriod} />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              <Link to="/for-specialists" className="underline">{t("landing.pricing.specialistLink")}</Link>
            </p>
          </TabsContent>

          <TabsContent value="parent">
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                {pricingPlansMeta.parent.map((plan) => (
                  <PricingCard key={plan.id} plan={plan} billingPeriod={billingPeriod} />
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              {t("landing.pricing.parentNote")} <Link to="/for-parents" className="underline">{t("landing.pricing.parentNoteLink")}</Link>
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useTranslation("pages");
  const [activeFilter, setActiveFilter] = useState<AudienceKey | null>(null);

  const filteredFeatures = activeFilter
    ? features.filter((f) => f.audience.includes(activeFilter))
    : features;

  const filterButtons: { key: AudienceKey | null; labelKey: string; icon?: LucideIcon }[] = [
    { key: null, labelKey: "all" },
    { key: "org", labelKey: "org", icon: Building2 },
    { key: "specialist", labelKey: "specialist", icon: GraduationCap },
    { key: "private", labelKey: "private", icon: Users },
    { key: "parent", labelKey: "parent", icon: Baby },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{t("landing.featuresSection.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("landing.featuresSection.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filterButtons.map((btn) => (
            <button
              key={btn.key ?? "all"}
              onClick={() => setActiveFilter(btn.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === btn.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.icon && <btn.icon className="h-4 w-4" />}
              {t(`landing.featuresSection.filters.${btn.labelKey}`)}
              <span
                className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeFilter === btn.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {btn.key === null ? features.length : features.filter((f) => f.audience.includes(btn.key!)).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <Card key={feature.id} className="hover:shadow-md transition-all relative overflow-hidden animate-in fade-in-0 duration-300">
              {feature.isNew && (
                <div className="absolute top-3 right-3">
                  <Badge variant="success" className="text-[10px] px-2">NEW</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t(`landing.featuresSection.items.${feature.id}.title`)}
                </CardTitle>
                <CardDescription>{t(`landing.featuresSection.items.${feature.id}.description`)}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {feature.audience.map((aud) => (
                    <span
                      key={aud}
                      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all hover:scale-105 ${audienceColors[aud]}`}
                      onClick={() => setActiveFilter(aud)}
                    >
                      {t(`landing.featuresSection.audienceLabels.${aud}`)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t("landing.featuresSection.empty")}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Landing() {
  const { t } = useTranslation("pages");

  useSeoMeta({
    title: t("landing.seo.title"),
    description: t("landing.seo.description"),
    canonical: "/landing",
    keywords: t("landing.seo.keywords"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "universum.",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "url": "https://unvrsm.ru",
        "description": t("landing.seo.schemaDescription"),
        "publisher": {
          "@type": "Organization",
          "name": "universum.",
          "url": "https://unvrsm.ru",
        },
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar currentPage="landing" />

      {/* Hero Section */}
      <section className="pt-24 md:pt-40 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            {t("landing.hero.badge")}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            universum.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("landing.hero.subtitle")}
          </p>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => document.getElementById("user-types")?.scrollIntoView({ behavior: "smooth" })}
          >
            {t("landing.hero.cta")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Personalized Journey Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">{t("landing.journey.badge")}</Badge>
            <h2 className="text-3xl font-bold mb-3">{t("landing.journey.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.journey.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <Link to="/for-organizations#calculator" className="group">
              <Card className="h-full border-2 border-blue-500/20 hover:border-blue-500/50 hover:shadow-xl transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative pb-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t("landing.journey.director.role")}</p>
                  <CardTitle className="text-lg leading-snug">{t("landing.journey.director.title")}</CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <CardDescription className="mb-4">
                    {t("landing.journey.director.description")}
                  </CardDescription>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all">
                    {t("landing.journey.director.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link to="/for-specialists#demo" className="group">
              <Card className="h-full border-2 border-orange-500/20 hover:border-orange-500/50 hover:shadow-xl transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative pb-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">{t("landing.journey.psychologist.role")}</p>
                  <CardTitle className="text-lg leading-snug">{t("landing.journey.psychologist.title")}</CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <CardDescription className="mb-4">
                    {t("landing.journey.psychologist.description")}
                  </CardDescription>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 group-hover:gap-2.5 transition-all">
                    {t("landing.journey.psychologist.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link to="/parent-auth" className="group">
              <Card className="h-full border-2 border-pink-500/20 hover:border-pink-500/50 hover:shadow-xl transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative pb-3">
                  <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Baby className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <p className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide">{t("landing.journey.parent.role")}</p>
                  <CardTitle className="text-lg leading-snug">{t("landing.journey.parent.title")}</CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <CardDescription className="mb-4">
                    {t("landing.journey.parent.description")}
                  </CardDescription>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 dark:text-pink-400 group-hover:gap-2.5 transition-all">
                    {t("landing.journey.parent.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Magnet Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-6">
            <Badge variant="secondary" className="mb-3">{t("landing.leadMagnet.badge")}</Badge>
            <h2 className="text-2xl font-bold mb-2">{t("landing.leadMagnet.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("landing.leadMagnet.subtitle")}
            </p>
          </div>
          <PpkChecklistLeadMagnet />
        </div>
      </section>

      {/* User Types Section */}
      <section id="user-types" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("landing.userTypesSection.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.userTypesSection.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {userTypes.map((type) => {
              const featureList = t(`landing.userTypes.${type.id}.features`, { returnObjects: true }) as string[];
              return (
                <Card
                  key={type.id}
                  className={`relative overflow-hidden border-2 ${type.borderColor} hover:shadow-lg transition-all group`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-50`} />
                  <CardHeader className="relative">
                    <div className="h-12 w-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <type.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{t(`landing.userTypes.${type.id}.title`)}</CardTitle>
                    <CardDescription>{t(`landing.userTypes.${type.id}.description`)}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <ul className="space-y-2">
                      {featureList.map((text, idx) => (
                        <li key={text} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="flex items-center gap-1.5">
                            {text}
                            {type.featureFlags[idx]?.isNew && (
                              <Badge variant="success" className="text-[10px] px-1.5 py-0">NEW</Badge>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-4">
                      <Link to={type.link} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          {t("landing.userTypesSection.more")}
                        </Button>
                      </Link>
                      <Link to={type.authLink} className="flex-1">
                        <Button className="w-full" size="sm">
                          {t("landing.userTypesSection.login")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("landing.howItWorks.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <Card key={item.id} className="relative overflow-hidden hover:shadow-lg transition-all group text-center">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/20" />
                <CardHeader className="pb-2">
                  <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{t(`landing.howItWorks.items.${item.id}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {t(`landing.howItWorks.items.${item.id}.description`)}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t("landing.ctaSection.title")}</h2>
          <p className="text-muted-foreground mb-8">
            {t("landing.ctaSection.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                <Building2 className="h-4 w-4" />
                {t("landing.ctaSection.org")}
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                {t("landing.ctaSection.specialist")}
              </Button>
            </Link>
            <Link to="/parent-auth">
              <Button size="lg" variant="outline" className="gap-2">
                <Baby className="h-4 w-4" />
                {t("landing.ctaSection.parent")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-10 px-4 border-t">
        <div className="container mx-auto max-w-4xl">
          <p className="text-center text-sm text-muted-foreground mb-6">{t("landing.partners.title")}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <a
              href="https://info.youcanread.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all hover:scale-105"
            >
              <img
                src="/assets/partners/youcanread-logo.svg"
                alt="Читай сам"
                className="h-6 md:h-8 w-auto opacity-60 group-hover:opacity-100 transition-opacity dark:invert"
              />
            </a>
            <a
              href="https://лабсс.рф"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all hover:scale-105"
            >
              <img
                src="/assets/partners/labss-logo.png"
                alt="ЛАБСС"
                className="h-8 md:h-10 w-auto opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />

      <CookieConsent />
    </div>
  );
}
