"use client";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 900);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <a href="#top" aria-label="Back to top" className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-clay text-paper shadow-lg hover:bg-clay-deep">
      <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" /></svg>
    </a>
  );
}
