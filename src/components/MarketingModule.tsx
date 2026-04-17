import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Send, Copy, Trash2, Plus, FileText } from "lucide-react";

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  target_channels: string[];
  status: string;
  published_at: string | null;
  created_at: string;
}

const CHANNELS = [
  { id: "telegram", label: "Telegram", color: "bg-sky-500" },
  { id: "vk", label: "ВКонтакте", color: "bg-blue-600" },
  { id: "ok", label: "Одноклассники", color: "bg-orange-500" },
  { id: "dzen", label: "Яндекс.Дзен", color: "bg-yellow-500" },
];

export const MarketingModule = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [channels, setChannels] = useState<string[]>(["telegram"]);
  const [tgChatId, setTgChatId] = useState("");

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_posts")
      .select("id, title, content, target_channels, status, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createDraft = async () => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      toast({ title: "Заполните поля", description: "Заголовок и текст обязательны", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase.from("marketing_posts").insert({
      title: title.trim(),
      content: content.trim(),
      target_channels: channels,
      created_by: user.id,
      status: "draft",
    } as any);

    setCreating(false);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    setTitle("");
    setContent("");
    toast({ title: "Черновик сохранён" });
    await loadPosts();
  };

  const publishToTelegram = async (postId: string) => {
    if (!tgChatId.trim()) {
      toast({
        title: "Укажите Telegram-канал",
        description: "Введите chat_id канала или @username (например, @universum_news)",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase.functions.invoke("telegram-broadcast", {
      body: { post_id: postId, target_chat_id: tgChatId.trim() },
    });

    if (error || !data?.ok) {
      toast({
        title: "Не удалось опубликовать",
        description: error?.message || JSON.stringify(data?.error || data),
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Опубликовано в Telegram", description: `Message ID: ${data.message_id}` });
    await loadPosts();
  };

  const copyToClipboard = (post: MarketingPost) => {
    const text = `${post.title}\n\n${post.content}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Скопировано", description: "Текст готов для ручной публикации" });
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("marketing_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    await loadPosts();
  };

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Маркетинг и публикации</h2>
          <p className="text-sm text-muted-foreground">
            Создавайте новости и публикуйте их в Telegram, VK, OK и Дзен
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Новый пост
          </CardTitle>
          <CardDescription>Черновик можно опубликовать в Telegram сразу или скопировать для ручной публикации</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">Заголовок</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="Например: Новый курс по диагностике"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-content">Текст поста</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 4000))}
              placeholder="Расскажите о новости, обновлении или событии..."
              rows={6}
              maxLength={4000}
            />
            <p className="text-xs text-muted-foreground text-right">{content.length} / 4000</p>
          </div>
          <div className="space-y-2">
            <Label>Каналы публикации</Label>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((ch) => (
                <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={channels.includes(ch.id)}
                    onCheckedChange={() => toggleChannel(ch.id)}
                  />
                  <span className="text-sm">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={createDraft} disabled={creating} className="w-full sm:w-auto">
            <FileText className="h-4 w-4 mr-2" />
            {creating ? "Сохранение..." : "Сохранить черновик"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Целевой Telegram-канал</CardTitle>
          <CardDescription>
            Укажите @username канала или его chat_id (бот должен быть админом канала)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={tgChatId}
            onChange={(e) => setTgChatId(e.target.value)}
            placeholder="@universum_news или -1001234567890"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Черновики и публикации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Постов пока нет</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status === "published" ? "Опубликован" : post.status === "failed" ? "Ошибка" : "Черновик"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.target_channels.map((ch) => {
                    const cfg = CHANNELS.find((c) => c.id === ch);
                    return cfg ? (
                      <Badge key={ch} variant="outline" className="text-xs">
                        {cfg.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.target_channels.includes("telegram") && post.status !== "published" && (
                    <Button size="sm" onClick={() => publishToTelegram(post.id)}>
                      <Send className="h-3 w-3 mr-1" />
                      Опубликовать в Telegram
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(post)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Скопировать текст
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePost(post.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
