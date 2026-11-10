import Link from "next/link";
import { THEMES } from "@/lib/themes";
import { Medallion } from "./Medallion";

// The eight themes arranged as one slow turning cycle.
export function Wheel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 h-full w-full text-paper/25" fill="none" stroke="currentColor">
        {[98, 90, 62, 56, 50].map((r, i) => (
          <circle key={r} cx="100" cy="100" r={r} strokeWidth="0.35" strokeDasharray={i % 2 ? "0.8 2.6" : undefined} />
        ))}
      </svg>
      <ul className="wheel-spin absolute inset-0 m-0 list-none p-0">
        {THEMES.map((t, i) => {
          const a = (i / THEMES.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <li key={t.slug} className="absolute w-[21%]" style={{ left: `${50 + Math.cos(a) * 38}%`, top: `${50 + Math.sin(a) * 38}%`, transform: "translate(-50%,-50%)" }}>
              <Link href={`/archive/${t.slug}`} aria-label={t.title} title={t.title} className="wheel-counter block rounded-full">
                <Medallion slug={t.slug} tone="paper" className="w-full shadow-[0_0_0_1px_rgba(244,238,227,0.2)]" />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="absolute inset-[27%] grid place-items-center rounded-full text-center">{children}</div>
    </div>
  );
}
