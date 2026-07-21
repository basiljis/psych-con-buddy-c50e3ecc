import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchSystemSetting } from "@/hooks/useSystemSetting";

interface Props {
  /** 'organization' — педагоги школ/ППМС, 'private' — частная практика */
  mode: "organization" | "private";
}

/**
 * Подсказка о применении автоодобрения для выбранного типа регистрации.
 * Частная практика — всегда без подтверждения администратором.
 * Педагоги организаций — зависит от глобальной настройки auto_approve_org_users.
 */
export const AutoApproveStatusHint = ({ mode }: Props) => {
  const { t } = useTranslation('auth');
  const [autoApprove, setAutoApprove] = useState<boolean | null>(null);

  useEffect(() => {
    if (mode === "private") {
      setAutoApprove(true);
      return;
    }
    let cancelled = false;
    fetchSystemSetting<boolean>("auto_approve_org_users", true).then((v) => {
      if (!cancelled) setAutoApprove(v);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (autoApprove === null) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('autoApprove.checking')}
      </div>
    );
  }

  const isPrivate = mode === "private";
  const enabled = autoApprove;

  const Icon = enabled ? ShieldCheck : ShieldAlert;
  const tone = enabled
    ? "border-primary/30 bg-primary/5 text-foreground"
    : "border-amber-500/30 bg-amber-500/5 text-foreground";
  const iconTone = enabled ? "text-primary" : "text-amber-600";

  const title = enabled
    ? t('autoApprove.accessGranted')
    : t('autoApprove.adminApprovalRequired');

  const description = isPrivate
    ? t('autoApprove.privateDesc')
    : enabled
      ? t('autoApprove.orgAutoDesc')
      : t('autoApprove.orgManualDesc');

  const tooltip = isPrivate
    ? t('autoApprove.privateTooltip')
    : t('autoApprove.orgTooltip');

  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${tone}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconTone}`} />
      <div className="flex-1 space-y-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground leading-snug">{description}</p>
      </div>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              aria-label={tooltip}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
