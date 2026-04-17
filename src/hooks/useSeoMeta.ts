import { useEffect } from "react";

interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: object | object[];
}

const BASE_URL = "https://unvrsm.ru";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export function useSeoMeta({
  title,
  description,
  canonical,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  jsonLd,
}: SeoMeta) {
  useEffect(() => {
    // Title
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    if (keywords) setMeta("name", "keywords", keywords);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Resolve canonical URL: support absolute URLs in `canonical` arg
    const resolvedUrl = canonical
      ? (canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`)
      : window.location.href;
    const resolvedOgImage = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", resolvedOgImage);
    setMeta("property", "og:image:alt", title);
    setMeta("property", "og:url", resolvedUrl);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "Universum");
    setMeta("property", "og:locale", "ru_RU");

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", resolvedOgImage);

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", resolvedUrl);

    // JSON-LD — remove all previous
    document.querySelectorAll('[id^="seo-json-ld"]').forEach(el => el.remove());

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, idx) => {
        const script = document.createElement("script");
        script.id = `seo-json-ld-${idx}`;
        script.type = "application/ld+json";
        try {
          script.textContent = JSON.stringify(item);
        } catch {
          return;
        }
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll('[id^="seo-json-ld"]').forEach(el => el.remove());
    };
  }, [title, description, canonical, keywords, ogImage, noIndex, jsonLd]);
}
