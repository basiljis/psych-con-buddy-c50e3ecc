import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  is_author_reply: boolean;
  created_at: string;
}

const commentSchema = z.object({
  author_name: z.string().trim().min(1, "min").max(100, "max"),
  author_email: z.string().trim().email("email").max(255).or(z.literal("")).optional(),
  content: z.string().trim().min(2, "min").max(4000, "max"),
});

interface Props {
  postId: string;
  isEn?: boolean;
}

const L = (isEn: boolean) => ({
  title: isEn ? "Comments" : "Комментарии",
  none: isEn ? "Be the first to comment." : "Будьте первым, кто оставит комментарий.",
  addTitle: isEn ? "Leave a comment" : "Оставить комментарий",
  name: isEn ? "Name" : "Имя",
  email: isEn ? "Email (optional, hidden)" : "Email (необязательно, скрыт)",
  message: isEn ? "Your comment" : "Ваш комментарий",
  submit: isEn ? "Send" : "Отправить",
  moderation: isEn
    ? "Comments are pre-moderated before publication."
    : "Комментарии проходят предварительную модерацию перед публикацией.",
  thanks: isEn
    ? "Thank you! Your comment was sent for moderation."
    : "Спасибо! Комментарий отправлен на модерацию.",
  error: isEn ? "Failed to send comment" : "Не удалось отправить комментарий",
  reply: isEn ? "Reply" : "Ответить",
  author: isEn ? "Author" : "Автор",
  cancel: isEn ? "Cancel" : "Отмена",
});

export default function BlogComments({ postId, isEn = false }: Props) {
  const labels = L(isEn);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("blog_comments")
        .select("id,post_id,parent_id,author_name,content,is_author_reply,created_at")
        .eq("post_id", postId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (!cancelled) {
        if (!error && data) setComments(data as Comment[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  const roots = comments.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => comments.filter((c) => c.parent_id === id);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = commentSchema.safeParse({ author_name: name, author_email: email, content });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message === "email"
        ? (isEn ? "Invalid email" : "Некорректный email")
        : (isEn ? "Please fill in name and comment" : "Заполните имя и текст"));
      return;
    }
    setSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;
    const { data: inserted, error } = await (supabase as any).from("blog_comments").insert({
      post_id: postId,
      parent_id: replyTo?.id ?? null,
      author_name: parsed.data.author_name,
      author_email: parsed.data.author_email || null,
      content: parsed.data.content,
      status: "pending",
      user_id: uid,
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error(labels.error);
      return;
    }
    if (inserted?.id) {
      supabase.functions
        .invoke("notify-blog-comment", { body: { kind: "new_pending", commentId: inserted.id } })
        .catch((err) => console.warn("notify-blog-comment failed", err));
    }
    toast.success(labels.thanks);
    setName(""); setEmail(""); setContent(""); setReplyTo(null);
  }

  const renderOne = (c: Comment, depth = 0) => (
    <div key={c.id} className={depth ? "ml-6 md:ml-10 border-l pl-4" : ""}>
      <Card className={c.is_author_reply ? "border-primary/40 bg-primary/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1.5 text-sm">
            <span className="font-semibold">{c.author_name}</span>
            {c.is_author_reply && (
              <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> {labels.author}</Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(c.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </span>
          </div>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{c.content}</div>
          {depth === 0 && (
            <Button
              size="sm" variant="ghost" className="mt-2 h-8 px-2 text-xs"
              onClick={() => {
                setReplyTo(c);
                document.getElementById("blog-comment-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              {labels.reply}
            </Button>
          )}
        </CardContent>
      </Card>
      {childrenOf(c.id).map((ch) => renderOne(ch, depth + 1))}
    </div>
  );

  return (
    <section className="mt-16 pt-10 border-t" id="comments">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6" /> {labels.title}
        {comments.length > 0 && <span className="text-base font-normal text-muted-foreground">({comments.length})</span>}
      </h2>

      <div className="space-y-3 mb-8">
        {loading ? (
          <div className="text-sm text-muted-foreground">…</div>
        ) : roots.length === 0 ? (
          <div className="text-sm text-muted-foreground">{labels.none}</div>
        ) : (
          roots.map((c) => renderOne(c))
        )}
      </div>

      <Card id="blog-comment-form">
        <CardContent className="p-5 md:p-6">
          <h3 className="font-semibold mb-4">
            {labels.addTitle}
            {replyTo && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                → {replyTo.author_name}{" "}
                <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                  ({labels.cancel})
                </button>
              </span>
            )}
          </h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder={labels.name} value={name} onChange={(e) => setName(e.target.value)}
                maxLength={100} required
              />
              <Input
                type="email" placeholder={labels.email} value={email}
                onChange={(e) => setEmail(e.target.value)} maxLength={255}
              />
            </div>
            <Textarea
              placeholder={labels.message} value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4} maxLength={4000} required
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">{labels.moderation}</p>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Send className="h-4 w-4" /> {labels.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
