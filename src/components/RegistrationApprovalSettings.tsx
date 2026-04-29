import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useToast } from "@/hooks/use-toast";

export const RegistrationApprovalSettings = () => {
  const { value: autoApprove, loading, update } = useSystemSetting<boolean>(
    "auto_approve_org_users",
    true
  );
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    const ok = await update(checked);
    if (ok) {
      toast({
        title: checked ? "Автоодобрение включено" : "Автоодобрение выключено",
        description: checked
          ? "Педагоги школ регистрируются без подтверждения администратором."
          : "Заявки педагогов школ требуют ручного одобрения администратором.",
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройку",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5" />
          Подтверждение регистрации педагогов школ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="auto-approve-toggle" className="text-sm font-medium">
              Регистрация без подтверждения администратором
            </Label>
            <p className="text-sm text-muted-foreground">
              Если включено — педагоги школ получают доступ сразу после регистрации.
              Если выключено — заявки попадают в раздел «Заявки на доступ» для ручной валидации.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="auto-approve-toggle"
              checked={!!autoApprove}
              disabled={loading}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
