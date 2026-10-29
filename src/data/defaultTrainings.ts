import { TrainingSession } from '../types';

export const DEFAULT_TRAINING_SESSIONS: TrainingSession[] = [
  // 4 Confirmed Workshops (June, August, October, November)
  {
    id: 'training-june-2026',
    title: 'Strategic Leadership in Higher Ed (June)',
    description: 'A 3-day intensive workshop on transforming institutional culture, governance, and leadership frameworks.',
    date: '2026-06-15',
    time: '10:00 AM - 4:00 PM',
    capacity: 25,
    registeredCount: 8,
    meetLink: 'https://meet.google.com/abc-defg-hij',
    isPotential: false,
    status: 'confirmed',
    topicCategory: 'Executive Leadership & Institutional Governance'
  },
  {
    id: 'training-august-2026',
    title: 'Digital Pedagogy & AI Integration (August)',
    description: 'Hands-on training for faculty on incorporating generative AI and agentic tooling into curriculum design.',
    date: '2026-08-22',
    time: '1:00 PM - 5:00 PM',
    capacity: 40,
    registeredCount: 14,
    meetLink: 'https://meet.google.com/klm-nopq-rst',
    isPotential: false,
    status: 'confirmed',
    topicCategory: 'Generative AI & Modern Pedagogy'
  },
  {
    id: 'training-october-2026',
    title: 'Research Methodology & Grant Writing (October)',
    description: 'Master the art of securing international funding and designing high-impact research projects.',
    date: '2026-10-10',
    time: '9:00 AM - 1:00 PM',
    capacity: 30,
    registeredCount: 11,
    meetLink: 'https://meet.google.com/uvw-xyz1-234',
    isPotential: false,
    status: 'confirmed',
    topicCategory: 'Research Design & Grant Funding'
  },
  {
    id: 'training-november-2026',
    title: 'Institutional Effectiveness & Data Analytics (November)',
    description: 'Leveraging institutional analytics to drive evidence-based decisions and improve scholar outcomes.',
    date: '2026-11-05',
    time: '11:00 AM - 3:00 PM',
    capacity: 20,
    registeredCount: 6,
    meetLink: 'https://meet.google.com/567-890a-bcd',
    isPotential: false,
    status: 'confirmed',
    topicCategory: 'Institutional Data & Performance Metrics'
  },
  // Potential Future Trainings & Proposed Cohorts
  {
    id: 'training-cohort-open-science-2026',
    title: 'Open Science Framework & FAIR Scholarly Publishing (Proposed Cohort)',
    description: 'Advanced masterclass on institutional open access repositories, preprint ethics, data curation, and international citation impact.',
    date: '2026-12-14',
    time: '10:00 AM - 2:00 PM',
    capacity: 35,
    registeredCount: 5,
    meetLink: 'https://meet.google.com/osp-fair-2026',
    isPotential: true,
    status: 'potential',
    topicCategory: 'Open Science & Scholarly Communication'
  },
  {
    id: 'training-cohort-doctoral-2027',
    title: 'Doctoral Supervision & High-Impact Thesis Mentorship (Proposed Cohort)',
    description: 'Transforming postgraduate supervision methodologies, student completion rates, and co-authoring strategies for early-career supervisors.',
    date: '2027-01-22',
    time: '11:00 AM - 3:30 PM',
    capacity: 30,
    registeredCount: 9,
    meetLink: 'https://meet.google.com/doc-supv-2027',
    isPotential: true,
    status: 'potential',
    topicCategory: 'Doctoral Pedagogy & Mentorship'
  },
  {
    id: 'training-cohort-digital-equity-2027',
    title: 'Digital Equity & Rural University Infrastructure Transformation (Proposed Cohort)',
    description: 'Strategic frameworks addressing technological divides, resilient connectivity, and community-engaged digital literacy in peripheral institutions.',
    date: '2027-03-19',
    time: '1:00 PM - 5:00 PM',
    capacity: 40,
    registeredCount: 12,
    meetLink: 'https://meet.google.com/rur-eqty-2027',
    isPotential: true,
    status: 'potential',
    topicCategory: 'Digital Transformation & Rural Communities'
  }
];
