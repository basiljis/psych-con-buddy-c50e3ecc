import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Send, CheckCircle2, Copy, RefreshCw, Unlink } from "lucide-react";

interface TelegramLinkCardProps {
  userId?: string;
  parentUserId?: string;
  linkType?: "specialist" | "parent" | "admin";
}

interface ChatLink {
  id: string;
  link_code: string;
  chat_id: number | null;
  username: string | null;
  linked_at: string | null;
  is_active: boolean;
}

const BOT_USERNAME = "unvrsmru_bot";

export const TelegramLinkCard = ({ userId, parentUserId, linkType = "specialist" }: TelegramLinkCardProps) => {
  const [link, setLink] = useState<ChatLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadLink = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("telegram_chat_links")
        .select("id, link_code, chat_id, username, linked_at, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (userId) query = query.eq("user_id", userId);
      else if (parentUserId) query = query.eq("parent_user_id", parentUserId);

      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error("[TelegramLinkCard] loadLink error:", error);
        toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
      }
      setLink((data as ChatLink | null) ?? null);
    } catch (err: any) {
      console.error("[TelegramLinkCard] loadLink exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLink();
  }, [userId, parentUserId]);

  const generateCode = async () => {
    setCreating(true);
    try {
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_telegram_link_code");
      if (codeErr) throw codeErr;

      const { error } = await supabase.from("telegram_chat_links").insert({
        user_id: userId ?? null,
        parent_user_id: parentUserId ?? null,
        link_code: codeData as string,
        link_type: linkType,
        chat_id: 0, // placeholder, will be updated when user runs /start
        is_active: true,
      } as any);

      if (error) throw error;
      await loadLink();
      toast({ title: "Код создан", description: "Откройте бота в Telegram и отправьте команду /start с кодом" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast({ title: "Скопировано", description: "Команда скопирована в буфер обмена" });
  };

  const unlink = async () => {
    if (!link) return;
    const { error } = await supabase
      .from("telegram_chat_links")
      .update({ is_active: false })
      .eq("id", link.id);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setLink(null);
    toast({ title: "Привязка отключена" });
  };

  const isLinked = link?.chat_id && link.chat_id !== 0 && link.linked_at;
  const startCommand = link ? `/start ${link.link_code}` : "";
  const botUrl = link ? `https://t.me/${BOT_USERNAME}?start=${link.link_code}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Telegram уведомления
          {isLinked && <Badge variant="default" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Подключено</Badge>}
        </CardTitle>
        <CardDescription>
          Получайте уведомления о новых заявках, сессиях и протоколах прямо в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : !link ? (
          <Button onClick={generateCode} disabled={creating} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {creating ? "Создание..." : "Подключить Telegram"}
          </Button>
        ) : isLinked ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Привязан Telegram-аккаунт</p>
              <p className="font-medium">@{link.username ?? "пользователь"}</p>
            </div>
            <Button variant="outline" onClick={unlink} className="w-full">
              <Unlink className="h-4 w-4 mr-2" />
              Отключить
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium">Шаги для подключения:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Откройте бота: <a href={botUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">@{BOT_USERNAME}</a></li>
                <li>Нажмите «Start» или отправьте команду:</li>
              </ol>
              <div className="flex items-center gap-2">
                <Input value={startCommand} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyCommand(startCommand)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Код действителен до отключения</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadLink} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Проверить статус
              </Button>
              <Button variant="outline" onClick={unlink}>
                <Unlink className="h-4 w-4 mr-2" />
                Отменить
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
