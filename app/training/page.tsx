import type { Metadata } from "next";
import { COURSES } from "@/lib/courses";
import { themeBySlug } from "@/lib/themes";
import { SITE } from "@/lib/site";
import { fmtDate } from "@/lib/format";
import { Calendar } from "@/components/Calendar";
import { Medallion } from "@/components/Medallion";
import { PageHead } from "@/components/PageHead";

export const revalidate = 86400;
export const metadata: Metadata = { title: "Training", description: "Available courses and workshops from ORHET on open science, supervision, digital equity and higher education transformation." };

export default function Training() {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = COURSES.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const mail = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

  return (
    <>
      <PageHead label="Training and development" title={<>Available <em>courses.</em></>}>
        <p>Short, practical courses for academics, supervisors, librarians and university leaders. Delivered online, in small cohorts.</p>
      </PageHead>
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[24rem_1fr] md:py-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Calendar courses={upcoming} start={(upcoming[0]?.date || today).slice(0, 7)} />
          <p className="mt-4 text-sm text-muted">Dates marked in red have a course. Select one to jump to its details.</p>
        </div>
        <div>
          <h2 className="label text-muted">Agenda · {upcoming.length} {upcoming.length === 1 ? "course" : "courses"}</h2>
          {upcoming.length === 0 && (
            <div className="mt-6 rounded-3xl border border-ink/15 p-8">
              <p className="font-display text-2xl">New course dates are being set.</p>
              <p className="mt-2 text-ink/75">Tell us what you would like to learn and we will let you know when a cohort opens.</p>
            </div>
          )}
          <ul className="mt-6 space-y-6">
            {upcoming.map((c) => {
              const t = themeBySlug(c.theme);
              return (
                <li key={c.id} id={`course-${c.id}`} data-reveal className="scroll-mt-32 rounded-3xl border border-ink/15 bg-white/40 p-6 md:p-8">
                  <article className="grid gap-6 sm:grid-cols-[auto_1fr]">
                    <div className="flex items-center gap-4 sm:block sm:w-28 sm:text-center">
                      <p className="font-display text-6xl leading-none text-clay">{Number(c.date.slice(8))}</p>
                      <p className="label mt-1 text-muted">{fmtDate(c.date, { month: "short", year: "numeric" })}</p>
                      {t && <Medallion slug={t.slug} className="ml-auto w-14 sm:mx-auto sm:mt-4" />}
                    </div>
                    <div>
                      <p className="label flex flex-wrap gap-x-3 gap-y-1"><span className={c.status === "confirmed" ? "text-clay" : "text-muted"}>{c.status === "confirmed" ? "Confirmed" : "Proposed cohort"}</span><span className="text-muted">{c.track}</span></p>
                      <h3 className="mt-2 font-display text-2xl leading-tight md:text-3xl">{c.title}</h3>
                      <p className="mt-3 text-ink/75">{c.description}</p>
                      <p className="mt-3 text-sm"><span className="font-semibold">{fmtDate(c.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span> · {c.time} · Online</p>
                      <a href={mail(`${c.status === "confirmed" ? "Registration" : "Interest"}: ${c.title} (${c.date})`)} className="btn btn-clay mt-6">{c.status === "confirmed" ? "Register by email" : "Register your interest"}</a>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <div className="on-ink mt-10 rounded-3xl bg-ink p-8 text-paper">
            <h2 className="font-display text-2xl">Need a course for your department?</h2>
            <p className="mt-2 max-w-xl text-paper/75">ORHET can shape a workshop around any of the eight transformation themes.</p>
            <a href={mail("Custom training enquiry")} className="btn btn-line mt-5">{SITE.email}</a>
          </div>
        </div>
      </div>
    </>
  );
}
