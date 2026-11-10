export type Topic = { label: string; q: string };
export type Theme = { letter: string; slug: string; title: string; short: string; blurb: string; q: string; topics: Topic[] };

export const THEMES: Theme[] = [
  { letter: "a", slug: "institutional-culture", title: "Institutional culture", short: "Culture",
    blurb: "How universities are governed, who belongs in them, and what their languages and symbols say.",
    q: "institutional culture university transformation",
    topics: [
      { label: "Governance and management", q: "university governance transformation" },
      { label: "Professionalisation of transformation work", q: "professionalisation transformation work higher education" },
      { label: "Social structure of the academy", q: "social structure of the academy" },
      { label: "Social inclusion and cohesion", q: "social cohesion higher education" },
      { label: "Language and symbols", q: "language policy symbols university transformation" },
    ] },
  { letter: "b", slug: "equity-and-redress", title: "Equity and redress", short: "Equity",
    blurb: "Access, success and opportunity for staff and students across race, gender and disability.",
    q: "equity redress higher education",
    topics: [
      { label: "Access and success (staff)", q: "staff equity university South Africa" },
      { label: "Race, gender, disability", q: "race gender disability higher education" },
      { label: "Support and opportunity", q: "student support opportunity higher education equity" },
      { label: "Diversity and inclusivity", q: "diversity inclusivity higher education" },
    ] },
  { letter: "c", slug: "research-and-postgraduate", title: "Research, scholarship and post-graduate studies", short: "Research",
    blurb: "Whose knowledge counts, what gets researched, and how the next generation of scholars is supervised.",
    q: "research scholarship postgraduate transformation university",
    topics: [
      { label: "Knowledge transformations", q: "knowledge transformation research universities" },
      { label: "Research on race, gender, disability and social justice", q: "social justice research higher education" },
      { label: "Postgraduate supervision", q: "postgraduate supervision transformation" },
    ] },
  { letter: "d", slug: "leadership-and-engagement", title: "Leadership, relations with external stakeholders, and community engagement", short: "Leadership",
    blurb: "Leadership that changes institutions, and the university's obligations to the communities around it.",
    q: "leadership community engagement university transformation",
    topics: [
      { label: "Transformational leadership", q: "transformational leadership higher education" },
      { label: "Community engagement", q: "community engagement university socially just" },
      { label: "Diversity training and professional growth", q: "diversity training staff development university" },
      { label: "Student leadership", q: "student leadership university activism" },
    ] },
  { letter: "e", slug: "teaching-and-learning", title: "Teaching and learning", short: "Teaching",
    blurb: "Enrolment, access and success for students, and pedagogies that take difference seriously.",
    q: "teaching and learning transformation higher education",
    topics: [
      { label: "Inclusive enrolment planning", q: "inclusive enrolment planning higher education" },
      { label: "Access and success (students)", q: "student access and success higher education" },
      { label: "Critical pedagogies", q: "critical pedagogy higher education" },
      { label: "Diversity competencies", q: "diversity competencies teaching university" },
    ] },
  { letter: "f", slug: "decolonisation", title: "Africanisation and decolonisation of the university", short: "Decolonisation",
    blurb: "Epistemic freedom, African knowledges and the work of decolonising the curriculum.",
    q: "decolonisation Africanisation university",
    topics: [
      { label: "Knowledge and epistemic freedom", q: "epistemic freedom decolonisation university" },
      { label: "Decolonising the curriculum", q: "decolonising the curriculum" },
    ] },
  { letter: "g", slug: "covid-19", title: "C19 and the higher education transformation project", short: "C19",
    blurb: "What the pandemic exposed and changed about justice, access and teaching in universities.",
    q: "COVID-19 higher education transformation",
    topics: [
      { label: "Pandemic and social justice in universities", q: "COVID-19 higher education social justice" },
      { label: "Emergency remote teaching", q: "emergency remote teaching COVID-19 South Africa" },
    ] },
  { letter: "h", slug: "gender-equity", title: "Gender equity and equality, and gender transformation strategies", short: "Gender",
    blurb: "Strategies for gender transformation, and research on gender based violence on campus.",
    q: "gender equity transformation university",
    topics: [
      { label: "Gender transformation strategies", q: "gender transformation strategies university" },
      { label: "Gender based violence in universities", q: "gender-based violence university" },
    ] },
];

export const themeBySlug = (slug: string) => THEMES.find((t) => t.slug === slug);
