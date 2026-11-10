"use client";
import { useState } from "react";

export function Share({ title, path }: { title: string; path?: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => (path ? new URL(path, window.location.origin).toString() : window.location.href);
  const open = (base: string) => window.open(base, "_blank", "noopener,noreferrer");
  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const b = "rounded-full border border-current/25 px-3 py-1.5 text-sm hover:border-clay hover:text-clay";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label opacity-60">Share</span>
      <button type="button" className={b} onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}>LinkedIn</button>
      <button type="button" className={b} onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`)}>X</button>
      <button type="button" className={b} onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`)}>WhatsApp</button>
      <a className={b} href={`mailto:?subject=${encodeURIComponent(title)}`} onClick={(e) => { e.currentTarget.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url())}`; }}>Email</a>
      <button type="button" className={b} onClick={copy} aria-live="polite">{copied ? "Link copied" : "Copy link"}</button>
    </div>
  );
}
