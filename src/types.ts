export interface Author {
  name: string;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  year: string;
  journal: string;
  doi: string;
  abstract: string;
  source: 'OpenAlex' | 'CrossRef' | 'CORE';
  url: string;
}

export interface OpenAlexWork {
  id: string;
  display_name: string;
  publication_year: number;
  authorships: { author: { display_name: string } }[];
  primary_location?: { source?: { display_name: string } };
  doi: string;
  abstract_inverted_index?: Record<string, number[]>;
}

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: { family: string; given?: string }[];
  created: { 'date-parts': number[][] };
  'container-title'?: string[];
  URL: string;
}

export interface COREWork {
  id: string;
  title: string;
  authors: { name: string }[];
  yearPublished: number;
  publisher: string;
  doi: string;
  abstract: string;
  downloadUrl: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  status: 'draft' | 'published';
  createdAt?: any;
}

export interface TrainingSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  registeredCount: number;
  meetLink?: string;
  isPotential?: boolean;
  status?: 'confirmed' | 'potential';
  topicCategory?: string;
  googleFormUrl?: string;
  createdAt?: any;
}

export interface TraineeRegistrationData {
  trainingId: string;
  trainingTitle: string;
  trainingDate: string;
  trainingTime: string;
  traineeName: string;
  traineeEmail: string;
  institution: string;
  academicRank?: string;
  department?: string;
  notes?: string;
  isPotentialInterest?: boolean;
  registeredAt?: string;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'scholar';
  registeredTrainings: string[];
  bookmarks?: SearchResult[];
  affiliation?: string;
  academicTitle?: string;
  department?: string;
  bio?: string;
  createdAt?: any;
}
