export interface Author {
  name: string;
}

export interface AuthorAttribution {
  id?: string; // OpenAlex author id e.g. "https://openalex.org/A5026362049" or "A5026362049"
  name: string;
  orcid?: string | null; // ORCID e.g. "https://orcid.org/0000-0002-8608-8378" or "0000-0002-8608-8378"
  institution?: string;
  raw_affiliation_string?: string;
  authorPosition?: string; // 'first' | 'middle' | 'last'
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  authorDetails?: AuthorAttribution[];
  year: string;
  journal: string;
  doi: string;
  abstract: string;
  source: 'OpenAlex' | 'CrossRef' | 'CORE';
  url: string;
  category?: 'Education' | 'Technology' | 'Social Science' | string;
}

export interface OpenAlexWork {
  id: string;
  display_name: string;
  publication_year: number;
  authorships: { 
    author: { 
      id?: string;
      display_name: string;
      orcid?: string | null;
    };
    author_position?: string;
    institutions?: { id?: string; display_name?: string }[];
    raw_author_name?: string;
    raw_affiliation_strings?: string[];
    raw_orcid?: string | null;
  }[];
  primary_location?: { source?: { display_name: string } };
  doi: string;
  abstract_inverted_index?: Record<string, number[]>;
}

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: { family?: string; given?: string; ORCID?: string }[];
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
  authorId?: string; // OpenAlex author_id e.g. "A5026362049" or "https://openalex.org/A5026362049"
  orcid?: string; // Verified ORCID iD e.g. "0000-0002-8608-8378" or "https://orcid.org/0000-0002-8608-8378"
  createdAt?: any;
}
