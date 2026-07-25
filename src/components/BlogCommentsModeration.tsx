import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, Trash2, MessageSquare, Reply, ExternalLink, Ban } from "lucide-react";
import { Link } from "react-router-dom";

type Status = "pending" | "approved" | "rejected" | "spam";

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  content: string;
  status: Status;
  is_author_reply: boolean;
  created_at: string;
  post?: { slug: string; title: string } | null;
}

const STATUS_LABEL: Record<Status | "all", string> = {
  all: "Все",
  pending: "На модерации",
  approved: "Одобрено",
  rejected: "Отклонено",
  spam: "Спам",
};

export function BlogCommentsModeration() {
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let query = (supabase as any)
      .from("blog_comments")
      .select("*, post:blog_posts(slug, title)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) toast.error("Не удалось загрузить комментарии");
    else setItems((data as Comment[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  const counts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  async function setStatus(id: string, status: Status) {
    setBusy(id);
    const { error } = await (supabase as any).from("blog_comments").update({ status }).eq("id", id);
    setBusy(null);
    if (error) return toast.error("Ошибка обновления");
    toast.success("Статус обновлён");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить комментарий безвозвратно?")) return;
    setBusy(id);
    const { error } = await (supabase as any).from("blog_comments").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error("Ошибка удаления");
    toast.success("Удалено");
    load();
  }

  async function submitReply(parent: Comment) {
    if (replyText.trim().length < 2) return toast.error("Слишком короткий ответ");
    setBusy(parent.id);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;
    const authorName = sessionData.session?.user?.user_metadata?.full_name
      || sessionData.session?.user?.email
      || "Редакция universum.";
    const { error } = await (supabase as any).from("blog_comments").insert({
      post_id: parent.post_id,
      parent_id: parent.id,
      author_name: authorName,
      content: replyText.trim(),
      status: "approved",
      is_author_reply: true,
      user_id: uid,
    });
    setBusy(null);
    if (error) return toast.error("Не удалось отправить ответ");
    toast.success("Ответ опубликован");
    setReplyFor(null);
    setReplyText("");
    load();
  }

  const statusBadge = (s: Status) => {
    const map: Record<Status, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-slate-100 text-slate-700 border-slate-200",
      spam: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return <Badge variant="outline" className={map[s]}>{STATUS_LABEL[s]}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Модерация комментариев</h2>
        <div className="ml-auto flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as Status | "all")}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["pending", "approved", "rejected", "spam", "all"] as const).map((k) => (
                <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load}>Обновить</Button>
        </div>
      </div>

      {filter === "all" && (
        <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
          {(["pending", "approved", "rejected", "spam"] as const).map((k) => (
            <span key={k}>{STATUS_LABEL[k]}: <b className="text-foreground">{counts[k] || 0}</b></span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Загрузка…</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Комментариев нет</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-semibold">{c.author_name}</span>
                  {c.author_email && <span className="text-xs text-muted-foreground">{c.author_email}</span>}
                  {c.is_author_reply && <Badge variant="secondary">Ответ автора</Badge>}
                  {c.parent_id && <Badge variant="outline" className="text-xs">Ответ</Badge>}
                  {statusBadge(c.status)}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("ru-RU")}
                  </span>
                </div>

                {c.post && (
                  <Link
                    to={`/blog/${c.post.slug}#comments`}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> {c.post.title}
                  </Link>
                )}

                <p className="text-sm whitespace-pre-wrap leading-relaxed border-l-2 border-muted pl-3">
                  {c.content}
                </p>

                <div className="flex flex-wrap gap-2">
                  {c.status !== "approved" && (
                    <Button size="sm" variant="default" disabled={busy === c.id}
                      onClick={() => setStatus(c.id, "approved")}>
                      <Check className="h-4 w-4 mr-1" /> Одобрить
                    </Button>
                  )}
                  {c.status !== "rejected" && (
                    <Button size="sm" variant="outline" disabled={busy === c.id}
                      onClick={() => setStatus(c.id, "rejected")}>
                      <X className="h-4 w-4 mr-1" /> Отклонить
                    </Button>
                  )}
                  {c.status !== "spam" && (
                    <Button size="sm" variant="outline" disabled={busy === c.id}
                      onClick={() => setStatus(c.id, "spam")}>
                      <Ban className="h-4 w-4 mr-1" /> Спам
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busy === c.id}
                    onClick={() => { setReplyFor(replyFor === c.id ? null : c.id); setReplyText(""); }}>
                    <Reply className="h-4 w-4 mr-1" /> Ответить
                  </Button>
                  <Button size="sm" variant="destructive" disabled={busy === c.id}
                    onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Удалить
                  </Button>
                </div>

                {replyFor === c.id && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Ответ от имени редакции (публикуется сразу)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      maxLength={4000}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setReplyFor(null)}>Отмена</Button>
                      <Button size="sm" onClick={() => submitReply(c)} disabled={busy === c.id}>
                        Опубликовать ответ
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
