import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { THEMES } from "@/lib/themes";
import { ESSAYS } from "@/lib/essays";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/archive", "/blog", "/training", "/about", ...THEMES.map((t) => `/archive/${t.slug}`), ...ESSAYS.map((e) => `/blog/${e.id}`)];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" }));
}
