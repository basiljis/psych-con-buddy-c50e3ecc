import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Users, MousePointerClick, TrendingUp, Globe, ExternalLink } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { BlogPost } from "@/types/blog";
import { blogCategoryLabel } from "@/types/blog";

type AnalyticsRow = {
  post_slug: string;
  total_views: number;
  unique_views: number;
  views_7d: number;
  views_30d: number;
  clicks_total: number;
  ctr: number;
};

type SourceRow = { source: string; views: number; unique_views: number };
type TsRow = { day: string; views: number; unique_views: number };
type LinkRow = { url: string; link_type: string; clicks: number };

const SOURCE_COLORS = [
  "hsl(var(--primary))",
  "hsl(24 90% 55%)",
  "hsl(200 85% 45%)",
  "hsl(150 60% 45%)",
  "hsl(280 60% 55%)",
  "hsl(340 70% 55%)",
  "hsl(45 90% 50%)",
  "hsl(220 15% 55%)",
];

const SOURCE_LABEL: Record<string, string> = {
  direct: "Прямые заходы",
  google: "Google",
  yandex: "Яндекс",
  dzen: "Дзен",
  telegram: "Telegram",
  vk: "ВКонтакте",
  mail: "Mail.ru",
  bing: "Bing",
  facebook: "Facebook",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  internal: "Внутренние",
  other: "Другие",
};
const sourceLabel = (s: string) => SOURCE_LABEL[s] ?? s;

export function BlogAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [timeseries, setTimeseries] = useState<TsRow[]>([]);
  const [topLinks, setTopLinks] = useState<LinkRow[]>([]);
  const [posts, setPosts] = useState<Pick<BlogPost, "slug" | "title" | "category">[]>([]);
  const [days, setDays] = useState<number>(30);
  const [slugFilter, setSlugFilter] = useState<string>("__all__");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: postsData }, { data: aData }] = await Promise.all([
        supabase.from("blog_posts").select("slug,title,category").order("published_at", { ascending: false }),
        supabase.rpc("get_blog_analytics"),
      ]);
      setPosts((postsData ?? []) as typeof posts);
      setAnalytics(((aData ?? []) as AnalyticsRow[]).sort((a, b) => b.total_views - a.total_views));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const slug = slugFilter === "__all__" ? null : slugFilter;
    (async () => {
      const [{ data: sData }, { data: tData }, { data: lData }] = await Promise.all([
        supabase.rpc("get_blog_sources", { _slug: slug }),
        supabase.rpc("get_blog_views_timeseries", { _days: days, _slug: slug }),
        supabase.rpc("get_blog_top_links", { _limit: 15, _slug: slug }),
      ]);
      setSources((sData ?? []) as SourceRow[]);
      setTimeseries((tData ?? []) as TsRow[]);
      setTopLinks((lData ?? []) as LinkRow[]);
    })();
  }, [days, slugFilter]);

  const titleBySlug = useMemo(() => {
    const m: Record<string, { title: string; category: string }> = {};
    for (const p of posts) m[p.slug] = { title: p.title, category: p.category };
    return m;
  }, [posts]);

  const totals = useMemo(() => {
    const t = analytics.reduce(
      (acc, r) => {
        acc.views += r.total_views;
        acc.unique += r.unique_views;
        acc.v7 += r.views_7d;
        acc.clicks += r.clicks_total;
        return acc;
      },
      { views: 0, unique: 0, v7: 0, clicks: 0 },
    );
    const ctr = t.views > 0 ? Math.round((t.clicks / t.views) * 10000) / 100 : 0;
    return { ...t, ctr };
  }, [analytics]);

  const filteredAnalytics = useMemo(() => {
    if (slugFilter === "__all__") return analytics;
    return analytics.filter((a) => a.post_slug === slugFilter);
  }, [analytics, slugFilter]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка аналитики…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={slugFilter} onValueChange={setSlugFilter}>
          <SelectTrigger className="w-full sm:w-[360px]"><SelectValue placeholder="Все статьи" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Все статьи</SelectItem>
            {posts.map((p) => (
              <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="30">30 дней</SelectItem>
            <SelectItem value="90">90 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Eye className="h-4 w-4" />} label="Всего просмотров" value={totals.views} />
        <KpiCard icon={<Users className="h-4 w-4" />} label="Уникальных читателей" value={totals.unique} />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Просмотров за 7 дней" value={totals.v7} />
        <KpiCard icon={<MousePointerClick className="h-4 w-4" />} label="Кликов · CTR"
          value={`${totals.clicks} · ${totals.ctr}%`} />
      </div>

      {/* Timeseries */}
      <Card>
        <CardHeader><CardTitle className="text-base">Просмотры по дням</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(d) => new Date(d as string).toLocaleDateString("ru-RU")} />
                <Line type="monotone" dataKey="views" name="Просмотры" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unique_views" name="Уникальные" stroke="hsl(24 90% 55%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sources + Top links */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Источники трафика</CardTitle>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных за выбранный период.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4 items-center">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sources} dataKey="views" nameKey="source" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {sources.map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, _n, p) => [`${v} просмотров`, sourceLabel(p.payload.source)]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {sources.slice(0, 8).map((s, i) => (
                    <li key={s.source} className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="flex-1 truncate">{sourceLabel(s.source)}</span>
                      <span className="tabular-nums text-muted-foreground">{s.views}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Самые кликаемые ссылки</CardTitle>
          </CardHeader>
          <CardContent>
            {topLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет зафиксированных кликов.</p>
            ) : (
              <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                {topLinks.map((l) => (
                  <li key={l.url} className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">{l.link_type}</Badge>
                    <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-primary hover:underline">
                      {l.url}
                    </a>
                    <span className="tabular-nums text-muted-foreground shrink-0">{l.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-post table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Эффективность статей</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr className="text-left">
                <th className="py-2 pr-4">Статья</th>
                <th className="py-2 px-2 text-right">Всего</th>
                <th className="py-2 px-2 text-right">Уник.</th>
                <th className="py-2 px-2 text-right">7 дн</th>
                <th className="py-2 px-2 text-right">30 дн</th>
                <th className="py-2 px-2 text-right">Клики</th>
                <th className="py-2 px-2 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnalytics.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Нет данных.</td></tr>
              )}
              {filteredAnalytics.map((r) => {
                const meta = titleBySlug[r.post_slug];
                return (
                  <tr key={r.post_slug} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-4 min-w-0 max-w-[380px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {meta && <Badge variant="secondary" className="shrink-0">{blogCategoryLabel(meta.category as BlogPost["category"])}</Badge>}
                        <a href={`/blog/${r.post_slug}`} target="_blank" rel="noreferrer" className="font-medium hover:text-primary truncate">
                          {meta?.title ?? r.post_slug}
                        </a>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.total_views}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.unique_views}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.views_7d}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.views_30d}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.clicks_total}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.ctr}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon}<span>{label}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
