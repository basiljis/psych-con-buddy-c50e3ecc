import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  ClipboardList,
  Database,
  BarChart3,
  BookOpen,
  Settings,
  ChevronDown,
  Users,
  Globe,
  Newspaper,
  Calendar,
  Wallet,
  Building,
  Cog,
  Info,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

type AdminViewMode = "specialist" | "parent" | "private" | "org_admin" | "director";

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  isOrgAdmin?: boolean;
  isDirector?: boolean;
  hasOrganizationAccess?: boolean;
  isPrivateSpecialist?: boolean;
  canAccessPublication?: boolean;
  adminViewMode?: AdminViewMode;
}

const childCardItem = { id: "child-card", label: "Карточка ребенка", icon: Users };

const ppkItems = [
  { id: "protocol", label: "Протокол ППк", icon: ClipboardList },
  { id: "list", label: "Список ППк", icon: Database },
  { id: "dashboard", label: "Дашборд", icon: BarChart3 },
];

const scheduleItem = {
  id: "schedule-module",
  label: "Расписание",
  icon: Calendar,
  subItems: [
    { id: "schedule-calendar", label: "Моё расписание" },
    { id: "schedule-children", label: "Дети" },
    { id: "schedule-statistics", label: "Статистика" },
    { id: "schedule-finance", label: "Финансы" },
  ],
};

const paymentSettingsItem = { id: "payment-settings", label: "Настройки оплаты", icon: Wallet };

const organizationItem = {
  id: "organization-module",
  label: "Организация",
  icon: Building,
  subItems: [
    { id: "organization-data", label: "Данные организации" },
    { id: "organization-employees", label: "Сотрудники" },
    { id: "organization-access-requests", label: "Заявки на доступ" },
    { id: "organization-schedule", label: "Расписание организации" },
    { id: "organization-rates", label: "Ставки специалистов" },
    { id: "organization-statistics", label: "Статистика" },
    { id: "organization-kpi", label: "KPI сотрудников" },
    { id: "organization-holidays", label: "Нерабочие дни" },
    { id: "organization-holiday-requests", label: "Запросы на согласование" },
    { id: "organization-settings", label: "Настройки" },
  ],
};

const publicationItem = { id: "public-profile", label: "Публичный профиль", icon: Globe };

const getInstructionsSubItems = (
  canSeePPK: boolean,
  canAccessSchedule: boolean,
  canSeeOrganization: boolean,
  isAdmin: boolean,
  isPrivateSpecialist: boolean,
) => {
  const items: { id: string; label: string }[] = [];
  if (canSeePPK) items.push({ id: "instructions-ppk", label: "ППк" });
  if (canAccessSchedule) items.push({ id: "instructions-schedule", label: "Расписание" });
  if (canSeeOrganization) items.push({ id: "instructions-organization", label: "Организация" });
  if (isPrivateSpecialist) items.push({ id: "instructions-private-practice", label: "Частная практика" });
  items.push({ id: "instructions-legal", label: "НПБ" });
  if (isAdmin) items.push({ id: "instructions-business-processes", label: "Бизнес-процессы" });
  return items;
};

const adminGroups = [
  {
    id: "admin-users",
    label: "Пользователи",
    icon: Users,
    subItems: [
      { id: "administration-access-requests", label: "Заявки" },
      { id: "administration-users", label: "Пользователи" },
      { id: "administration-org-admins", label: "Админы организаций" },
      { id: "administration-parent-children", label: "Родители и дети" },
    ],
  },
  {
    id: "admin-finance",
    label: "Финансы",
    icon: Wallet,
    subItems: [
      { id: "administration-commercial-offers", label: "КП заявки" },
      { id: "administration-subscriptions", label: "Подписки" },
      { id: "administration-payment-logs", label: "Логи платежей" },
      { id: "administration-finance-stats", label: "Финансовая статистика" },
    ],
  },
  {
    id: "admin-settings",
    label: "Настройки",
    icon: Cog,
    subItems: [
      { id: "administration-positions-roles", label: "Должности и роли" },
      { id: "administration-organizations", label: "Организации" },
      { id: "administration-checklist", label: "Чек-листы" },
      { id: "administration-parent-tests", label: "Тесты родителей" },
      { id: "administration-schedule", label: "Настройки расписания" },
      { id: "administration-school-years", label: "Учебные годы" },
      { id: "administration-workload-report", label: "Загрузка специалистов" },
      { id: "administration-session-notifications", label: "Уведомления" },
      { id: "administration-marketing", label: "Маркетинг и публикации" },
      { id: "administration-blog", label: "Блог (статьи)" },
      { id: "administration-instructions", label: "Инструкции" },
    ],
  },
  {
    id: "admin-info",
    label: "Инфо",
    icon: Info,
    subItems: [
      { id: "administration-statistics", label: "Статистика" },
      { id: "administration-analytics", label: "Аналитика" },
      { id: "administration-site-analytics", label: "SMM аналитика" },
      { id: "administration-system-health", label: "Мониторинг системы" },
    ],
  },
  {
    id: "admin-logs",
    label: "Логи",
    icon: FileText,
    subItems: [
      { id: "administration-auth-logs", label: "Логи авторизации" },
      { id: "administration-error-logs", label: "Логи ошибок" },
      { id: "administration-change-history", label: "История изменений" },
      { id: "administration-email-logs", label: "Логи Email" },
    ],
  },
];

export const MobileMenu = ({
  activeTab,
  onTabChange,
  isAdmin = false,
  isOrgAdmin = false,
  isDirector = false,
  hasOrganizationAccess = false,
  isPrivateSpecialist = false,
  canAccessPublication = false,
  adminViewMode,
}: MobileMenuProps) => {
  const [open, setOpen] = useState(false);

  const isInAdminViewMode = isAdmin && adminViewMode && adminViewMode !== "specialist";
  const showAdminSection = isAdmin && !isInAdminViewMode;
  const effectiveIsPrivateSpecialist =
    isInAdminViewMode && adminViewMode === "private" ? true : isPrivateSpecialist;
  const effectiveIsOrgAdmin = isInAdminViewMode && adminViewMode === "org_admin" ? true : isOrgAdmin;
  const effectiveIsDirector = isInAdminViewMode && adminViewMode === "director" ? true : isDirector;

  const canSeeOrganization =
    !effectiveIsPrivateSpecialist &&
    (effectiveIsOrgAdmin || effectiveIsDirector || (!isInAdminViewMode && isAdmin) || hasOrganizationAccess);
  const canAccessSchedule = true;
  const canSeePPK = true;

  const instructionsSubItems = getInstructionsSubItems(
    canSeePPK,
    canAccessSchedule,
    canSeeOrganization,
    isAdmin,
    effectiveIsPrivateSpecialist,
  );

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setOpen(false);
  };

  const renderCollapsibleGroup = (
    key: string,
    Icon: typeof Users,
    label: string,
    subItems: { id: string; label: string }[],
  ) => {
    const isGroupActive = subItems.some((s) => activeTab === s.id);
    return (
      <Collapsible key={key} defaultOpen={isGroupActive} className="space-y-1">
        <CollapsibleTrigger asChild>
          <Button
            variant={isGroupActive ? "default" : "ghost"}
            className="w-full justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {label}
            </div>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-4">
          {subItems.map((subItem) => (
            <Button
              key={subItem.id}
              variant={activeTab === subItem.id ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => handleTabClick(subItem.id)}
            >
              {subItem.label}
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 max-w-[90vw] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-6 pt-6 pb-2 shrink-0 border-b">
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-8 pt-4"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          <div className="space-y-2">
            {/* Core: Child card */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-3 flex items-center gap-2">
                Ядро системы
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600">
                  Core
                </span>
              </p>
              <Button
                variant={activeTab === childCardItem.id ? "default" : "outline"}
                className={`w-full justify-start gap-3 ${
                  activeTab === childCardItem.id
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                }`}
                onClick={() => handleTabClick(childCardItem.id)}
              >
                <childCardItem.icon className="h-4 w-4" />
                {childCardItem.label}
              </Button>
            </div>

            <Separator className="my-3" />

            {/* PPK system */}
            <p className="text-xs font-medium text-muted-foreground px-3">Система ППК</p>
            {ppkItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => handleTabClick(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}

            {/* Schedule */}
            <Separator className="my-3" />
            <p className="text-xs font-medium text-muted-foreground px-3">Работа специалиста</p>
            {renderCollapsibleGroup(
              scheduleItem.id,
              scheduleItem.icon,
              scheduleItem.label,
              scheduleItem.subItems,
            )}

            {/* Payment settings (private specialists) */}
            {effectiveIsPrivateSpecialist && (
              <Button
                variant={activeTab === paymentSettingsItem.id ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => handleTabClick(paymentSettingsItem.id)}
              >
                <paymentSettingsItem.icon className="h-4 w-4" />
                {paymentSettingsItem.label}
              </Button>
            )}

            {/* Organization */}
            {canSeeOrganization && (
              <>
                <Separator className="my-3" />
                <p className="text-xs font-medium text-muted-foreground px-3">Организация</p>
                {renderCollapsibleGroup(
                  organizationItem.id,
                  organizationItem.icon,
                  organizationItem.label,
                  organizationItem.subItems,
                )}
              </>
            )}

            {/* Publication */}
            {canAccessPublication && (
              <>
                <Separator className="my-3" />
                <p className="text-xs font-medium text-muted-foreground px-3">Публикация</p>
                <Button
                  variant={activeTab === publicationItem.id ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => handleTabClick(publicationItem.id)}
                >
                  <publicationItem.icon className="h-4 w-4" />
                  {publicationItem.label}
                </Button>
              </>
            )}

            {/* Instructions */}
            <Separator className="my-3" />
            <p className="text-xs font-medium text-muted-foreground px-3">Справка</p>
            {renderCollapsibleGroup(
              "instructions-module",
              BookOpen,
              "Инструкции",
              instructionsSubItems,
            )}

            {/* Admin */}
            {showAdminSection && (
              <>
                <Separator className="my-3" />
                <p className="text-xs font-medium text-muted-foreground px-3">Администрирование</p>
                {adminGroups.map((group) =>
                  renderCollapsibleGroup(group.id, group.icon, group.label, group.subItems),
                )}
              </>
            )}

            {/* Resources */}
            <Separator className="my-3" />
            <p className="text-xs font-medium text-muted-foreground px-3">Ресурсы</p>
            <Button asChild variant="ghost" className="w-full justify-start gap-3">
              <Link to="/blog" onClick={() => setOpen(false)}>
                <Newspaper className="h-4 w-4" />
                Блог
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-3">
              <Link to="/legal" onClick={() => setOpen(false)}>
                <FileText className="h-4 w-4" />
                Нормативная база
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-3">
              <Link to="/pricing" onClick={() => setOpen(false)}>
                <Wallet className="h-4 w-4" />
                Тарифы
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
