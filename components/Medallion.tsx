// A theme's carved circle icon, set inside a ring of fine lines.
export function Glyph({ slug, className = "" }: { slug: string; className?: string }) {
  return <span aria-hidden className={`glyph ${className}`} style={{ ["--g" as string]: `url(/icons/${slug}.svg)` }} />;
}

export function Medallion({ slug, className = "", tone = "ink" }: { slug: string; className?: string; tone?: "ink" | "paper" | "clay" }) {
  const tones = { ink: "bg-ink text-paper", paper: "bg-paper text-ink", clay: "bg-clay text-paper" };
  return (
    <span className={`medallion ${tones[tone]} ${className}`}>
      <svg aria-hidden className="ring" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="47.5" strokeWidth="0.6" opacity="0.55" />
        <circle cx="50" cy="50" r="44.5" strokeWidth="0.6" strokeDasharray="1.2 3.4" opacity="0.8" />
      </svg>
      <Glyph slug={slug} />
    </span>
  );
}
