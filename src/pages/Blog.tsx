import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogCategory } from "@/types/blog";
import { BLOG_CATEGORIES, blogCategoryLabel } from "@/types/blog";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const PAGE_SIZE = 6;
const BASE_URL = "https://unvrsm.ru";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<BlogCategory | "all">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      setPosts((data ?? []) as BlogPost[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!term) return true;
      const hay = [p.title, p.excerpt, p.keywords.join(" ")].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [posts, q, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useSeoMeta({
    title: "Блог universum. — статьи для психологов, логопедов и родителей",
    description:
      "Практические материалы о работе службы психолого-педагогического сопровождения, ППк и ПМПК, речевом развитии и коррекционной педагогике.",
    canonical: `${BASE_URL}/blog`,
    keywords: "блог, психолог, логопед, дефектолог, ППк, ПМПК, школа, родители",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Блог universum.",
      url: `${BASE_URL}/blog`,
      description:
        "Статьи для педагогов-психологов, логопедов, дефектологов и родителей.",
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="blog" />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground">Главная</Link>
            <span className="mx-2">/</span>
            <span>Блог</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Блог</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Практика ППк и ПМПК, документы, речевое развитие, работа с семьёй.
              </p>
            </div>
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              aria-label="RSS-лента блога"
            >
              <Rss className="h-4 w-4" /> RSS
            </a>
          </div>
        </header>

        <div className="mb-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Поиск по заголовкам, описаниям и ключевым словам"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => { setCategory("all"); setPage(1); }}
            >
              Все
            </Button>
            {BLOG_CATEGORIES.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "outline"}
                size="sm"
                onClick={() => { setCategory(c.value); setPage(1); }}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Статьи не найдены.</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{blogCategoryLabel(p.category)}</Badge>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {p.reading_minutes} мин
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">{p.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("ru-RU", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
