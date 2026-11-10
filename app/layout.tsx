import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import { BackToTop } from "@/components/BackToTop";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.full}`, template: `%s · ${SITE.name}` },
  description: "Open scholarship on transforming universities, in one search. Live records from OpenAlex, Crossref, CORE, Semantic Scholar, Europe PMC, DOAJ, arXiv and Unpaywall, organised by eight transformation themes.",
  openGraph: { title: `${SITE.name} · ${SITE.full}`, description: "Open scholarship on transforming universities, in one search.", type: "website", siteName: SITE.name },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#14110e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body id="top" className="min-h-screen bg-paper text-ink">
        <noscript><style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style></noscript>
        <Header />
        <main id="main" className="pt-[calc(4.5rem+9px)]">{children}</main>
        <Footer />
        <BackToTop />
        <Motion />
      </body>
    </html>
  );
}
