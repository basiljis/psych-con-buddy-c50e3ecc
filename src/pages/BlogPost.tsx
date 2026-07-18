import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost as BlogPostType } from "@/types/blog";
import { blogCategoryLabel, stripHtml } from "@/types/blog";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Eye, Users } from "lucide-react";
import { useLogBlogView, useBlogViewStats } from "@/hooks/useBlogViews";

const BASE_URL = "https://unvrsm.ru";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      setPost((data as BlogPostType | null) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  const canonical = `${BASE_URL}/blog/${slug}`;
  const description = post
    ? (post.excerpt || stripHtml(post.content).slice(0, 160))
    : "";

  useSeoMeta({
    title: post ? `${post.title} — Блог universum.` : "Статья — Блог universum.",
    description,
    canonical,
    keywords: post?.keywords.join(", "),
    jsonLd: post
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: { "@type": "Organization", name: post.author || "universum." },
            publisher: {
              "@type": "Organization",
              name: "universum.",
              url: BASE_URL,
            },
            mainEntityOfPage: canonical,
            keywords: post.keywords.join(", "),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: "Блог", item: `${BASE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: canonical },
            ],
          },
        ]
      : undefined,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="blog" />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-10">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !post ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Статья не найдена</h1>
            <Button onClick={() => navigate("/blog")}>Вернуться в блог</Button>
          </div>
        ) : (
          <article>
            <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground">Главная</Link>
              <span className="mx-2">/</span>
              <Link to="/blog" className="hover:text-foreground">Блог</Link>
              <span className="mx-2">/</span>
              <span className="line-clamp-1 inline">{post.title}</span>
            </nav>

            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Все статьи
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{blogCategoryLabel(post.category)}</Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {post.reading_minutes} мин
              </span>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.published_at).toLocaleDateString("ru-RU", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>

            <div
              className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-p:leading-relaxed prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.keywords.length > 0 && (
              <div className="mt-10 pt-6 border-t flex flex-wrap gap-2">
                {post.keywords.map((k) => (
                  <Badge key={k} variant="outline">{k}</Badge>
                ))}
              </div>
            )}
          </article>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
