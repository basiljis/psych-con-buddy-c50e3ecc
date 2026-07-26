import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://unvrsm.ru";
const FROM = "universum. <noreply@unvrsm.ru>";

interface Body {
  kind: "new_pending" | "author_reply";
  commentId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kind, commentId } = (await req.json()) as Body;
    if (!commentId || !kind) {
      return new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: comment, error: cErr } = await supabase
      .from("blog_comments")
      .select("id, post_id, parent_id, author_name, author_email, content, is_author_reply")
      .eq("id", commentId)
      .maybeSingle();

    if (cErr || !comment) {
      return new Response(JSON.stringify({ error: "comment_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: post } = await supabase
      .from("blog_posts")
      .select("slug, title")
      .eq("id", comment.post_id)
      .maybeSingle();

    const postUrl = post ? `${SITE}/blog/${post.slug}#comments` : `${SITE}/blog`;
    const adminUrl = `${SITE}/?tab=administration-blog`;

    if (kind === "new_pending") {
      // Notify all admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const ids = (admins ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        return new Response(JSON.stringify({ ok: true, sent: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .in("id", ids);
      const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[];
      if (emails.length === 0) {
        return new Response(JSON.stringify({ ok: true, sent: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f172a;">Новый комментарий на модерации</h2>
          <p><b>Статья:</b> ${post?.title ?? "—"}</p>
          <p><b>Автор:</b> ${comment.author_name}${comment.author_email ? ` &lt;${comment.author_email}&gt;` : ""}</p>
          <div style="background:#f8fafc;border-left:4px solid #0ea5e9;padding:12px;margin:16px 0;white-space:pre-wrap;">
            ${escapeHtml(comment.content)}
          </div>
          <p>
            <a href="${adminUrl}" style="background:#0ea5e9;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
              Перейти к модерации
            </a>
            &nbsp;
            <a href="${postUrl}">Открыть статью</a>
          </p>
        </div>
      `;

      const res = await resend.emails.send({
        from: FROM,
        to: emails,
        subject: `Новый комментарий на модерации: ${post?.title ?? "блог"}`,
        html,
      });
      return new Response(JSON.stringify({ ok: true, sent: emails.length, res }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (kind === "author_reply") {
      // Notify the parent comment's author if email is set
      if (!comment.parent_id) {
        return new Response(JSON.stringify({ ok: true, skipped: "no_parent" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: parent } = await supabase
        .from("blog_comments")
        .select("author_name, author_email, content")
        .eq("id", comment.parent_id)
        .maybeSingle();
      if (!parent?.author_email) {
        return new Response(JSON.stringify({ ok: true, skipped: "no_email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f172a;">Редакция universum. ответила на ваш комментарий</h2>
          <p><b>Статья:</b> ${post?.title ?? "—"}</p>
          <p style="color:#64748b;">Ваш комментарий:</p>
          <div style="background:#f1f5f9;border-left:4px solid #94a3b8;padding:10px;margin:8px 0;white-space:pre-wrap;">
            ${escapeHtml(parent.content)}
          </div>
          <p style="color:#0f172a;"><b>Ответ:</b></p>
          <div style="background:#ecfeff;border-left:4px solid #0ea5e9;padding:12px;margin:8px 0;white-space:pre-wrap;">
            ${escapeHtml(comment.content)}
          </div>
          <p>
            <a href="${postUrl}" style="background:#0ea5e9;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
              Открыть обсуждение
            </a>
          </p>
        </div>
      `;

      const res = await resend.emails.send({
        from: FROM,
        to: [parent.author_email],
        subject: `Ответ редакции на ваш комментарий: ${post?.title ?? "блог"}`,
        html,
      });
      return new Response(JSON.stringify({ ok: true, sent: 1, res }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown_kind" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-blog-comment error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
