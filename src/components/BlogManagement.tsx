import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogCategory } from "@/types/blog";
import { BLOG_CATEGORIES, blogCategoryLabel, postToZenText, postToZenHtml } from "@/types/blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, ExternalLink, Rss, ImageDown } from "lucide-react";
import { Link } from "react-router-dom";

const empty = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "specialists" as BlogCategory,
  keywords: "",
  cover_url: "",
  author: "Команда universum.",
  reading_minutes: 5,
  published: true,
};

function slugify(s: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(empty);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setPosts((data ?? []) as BlogPost[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpenDialog(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      keywords: p.keywords.join(", "),
      cover_url: p.cover_url ?? "",
      author: p.author,
      reading_minutes: p.reading_minutes,
      published: p.published,
    });
    setOpenDialog(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Введите заголовок", variant: "destructive" });
      return;
    }
    const payload = {
      slug: form.slug.trim() || slugify(form.title),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      category: form.category,
      keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      cover_url: form.cover_url.trim() || null,
      author: form.author.trim() || "Команда universum.",
      reading_minutes: Number(form.reading_minutes) || 5,
      published: form.published,
    };

    const { error } = editing
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);

    if (error) {
      toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Статья обновлена" : "Статья создана" });
    setOpenDialog(false);
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Статья удалена" });
      load();
    }
    setDeleteId(null);
  };

  const copyForZen = async (p: BlogPost) => {
    const html = postToZenHtml(p);
    const text = postToZenText(p);
    try {
      // Богатая вставка: Дзен.Редактор сохранит заголовки, абзацы, списки и картинку.
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast({
        title: "Скопировано для Яндекс Дзен",
        description:
          "Вставьте в Дзен.Редактор (Ctrl+V / ⌘+V) — заголовки, абзацы, списки и ссылки сохранятся. Обложку загрузите отдельно кнопкой 🖼️ ниже.",
      });
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Скопирован текст", description: "HTML недоступен — вставлен обычный текст." });
      } catch {
        toast({ title: "Не удалось скопировать", variant: "destructive" });
      }
    }
  };

  const downloadCover = async (p: BlogPost) => {
    if (!p.cover_url) {
      toast({ title: "Нет обложки", description: "Добавьте cover_url в статью.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(p.cover_url, { mode: "cors" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${p.slug}-cover.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Обложка скачана",
        description: "Перетащите файл в Дзен.Редактор в блок обложки или в тело статьи.",
      });
    } catch (e) {
      // CORS fallback — открываем в новой вкладке, пользователь сохранит вручную.
      window.open(p.cover_url, "_blank", "noopener");
      toast({
        title: "Открыта картинка в новой вкладке",
        description: "Скачайте её (ПКМ → «Сохранить изображение как…») и загрузите в Дзен.",
      });
    }
  };

  const copyRss = async () => {
    const url = `https://oxyjmeslnmhewlpgzlmf.supabase.co/functions/v1/blog-rss`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Ссылка на RSS скопирована", description: url });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Управление статьями блога</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Создание, редактирование, публикация. Копия для Яндекс Дзен — одной кнопкой.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyRss}>
              <Rss className="h-4 w-4 mr-2" /> RSS
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Новая статья
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет статей.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary">{blogCategoryLabel(p.category)}</Badge>
                      {!p.published && <Badge variant="outline">Черновик</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("ru-RU")}
                      </span>
                      <span className="text-xs text-muted-foreground">/{p.slug}</span>
                    </div>
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{p.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" asChild title="Открыть">
                      <Link to={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyForZen(p)} title="Копировать для Яндекс Дзен (HTML + текст со ссылками)">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadCover(p)} title="Скачать обложку для загрузки в Дзен">
                      <ImageDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)} title="Редактировать">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)} title="Удалить">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактирование статьи" : "Новая статья"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="slug">Слаг (URL)</Label>
                <Input
                  id="slug" value={form.slug} placeholder="сгенерируется автоматически"
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={form.category}
                  onValueChange={(v: BlogCategory) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Краткое описание (для SEO и превью)</Label>
              <Textarea
                id="excerpt" rows={2} value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Содержимое (HTML)</Label>
              <Textarea
                id="content" rows={14} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="font-mono text-xs"
                placeholder="<h2>Подзаголовок</h2><p>Текст…</p>"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="keywords">Ключевые слова (через запятую)</Label>
                <Input
                  id="keywords" value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cover">Обложка (URL, опционально)</Label>
                <Input
                  id="cover" value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor="author">Автор</Label>
                <Input
                  id="author" value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minutes">Время чтения (мин)</Label>
                <Input
                  id="minutes" type="number" min={1} value={form.reading_minutes}
                  onChange={(e) => setForm({ ...form, reading_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="published" checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                />
                <Label htmlFor="published">Опубликовать</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Отмена</Button>
            <Button onClick={save}>{editing ? "Сохранить" : "Создать"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статью?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Статья исчезнет из блога, RSS и sitemap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
