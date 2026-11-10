import { Glyph } from "./Medallion";

// Abstract cover art built from the theme icons. No photographs, no faces.
export function EssayCover({ theme, index = 0, className = "" }: { theme: string; index?: number; className?: string }) {
  const looks = [
    { bg: "bg-ink", glyph: "text-ochre", lines: "lines-arc opacity-20" },
    { bg: "bg-clay", glyph: "text-ink", lines: "lines-arc-ink opacity-20" },
    { bg: "bg-ink-3", glyph: "text-paper", lines: "lines-wave opacity-15" },
  ];
  const l = looks[index % looks.length];
  return (
    <div aria-hidden className={`relative overflow-hidden ${l.bg} ${className}`}>
      <div className={`absolute inset-0 ${l.lines}`} />
      <Glyph slug={theme} className={`absolute -bottom-[22%] -right-[10%] h-[125%] w-auto aspect-square ${l.glyph}`} />
    </div>
  );
}
