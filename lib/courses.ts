// Courses carried over from the earlier build. All three are PROPOSED cohorts:
// confirm dates, times and facilitators before promoting them.
export type Course = { id: string; title: string; description: string; date: string; time: string; track: string; theme: string; status: "confirmed" | "proposed" };

export const COURSES: Course[] = [
  { id: "open-science-fair-publishing", title: "Open Science Framework and FAIR Scholarly Publishing",
    description: "Masterclass on institutional open access repositories, preprint ethics, data curation and international citation impact.",
    date: "2026-12-14", time: "10:00 to 14:00 SAST", track: "Open science and scholarly communication", theme: "research-and-postgraduate", status: "proposed" },
  { id: "doctoral-supervision", title: "Doctoral Supervision and Thesis Mentorship",
    description: "Supervision methods, student completion rates and joint authoring strategies for early career supervisors.",
    date: "2027-01-22", time: "11:00 to 15:30 SAST", track: "Doctoral pedagogy and mentorship", theme: "research-and-postgraduate", status: "proposed" },
  { id: "digital-equity-rural-universities", title: "Digital Equity and Rural University Infrastructure",
    description: "Frameworks for addressing technological divides, resilient connectivity and community engaged digital literacy in peripheral institutions.",
    date: "2027-03-19", time: "13:00 to 17:00 SAST", track: "Digital transformation and rural communities", theme: "equity-and-redress", status: "proposed" },
];
