import { SearchResult } from '../types';

export interface RepositoryStats {
  totalArticles: number;
  openAccessFullText: number;
  openAlexCount: number;
  crossRefCount: number;
  coreCount: number;
  lastUpdated: string;
}

export const REPOSITORY_STATS: RepositoryStats = {
  totalArticles: 284520000,
  openAccessFullText: 86400000,
  openAlexCount: 250000000,
  crossRefCount: 152000000,
  coreCount: 34500000,
  lastUpdated: 'October 2026',
};

export const DEFAULT_INITIAL_QUERY = 'higher education transformation';

export const ACADEMIC_CATEGORIES = [
  { id: 'all', label: 'All', description: 'Comprehensive research repository across all scholarly fields' },
  { id: 'Education', label: 'Education', description: 'Pedagogy, epistemic access, curriculum reform, doctoral supervision & university teaching' },
  { id: 'Technology', label: 'Technology', description: 'Digital transformation, AI ethics, open science repositories, STEM & information systems' },
  { id: 'Social Science', label: 'Social Science', description: 'Societal transformation, epistemic justice, institutional governance, gender equity & community engagement' },
] as const;

export type AcademicCategory = 'all' | 'Education' | 'Technology' | 'Social Science';

/**
 * Intelligent domain classification for verified publications
 */
export function getArticleAcademicCategory(article: Partial<SearchResult>): 'Education' | 'Technology' | 'Social Science' {
  if (article.category === 'Education' || article.category === 'Technology' || article.category === 'Social Science') {
    return article.category;
  }

  const text = `${article.title || ''} ${article.journal || ''} ${article.abstract || ''}`.toLowerCase();

  // Technology keywords
  if (
    text.includes('digital') ||
    text.includes('technology') ||
    text.includes('technolog') ||
    text.includes('system') ||
    text.includes('open science') ||
    text.includes('stem') ||
    text.includes('repository') ||
    text.includes('repositories') ||
    text.includes('ai ') ||
    text.includes('artificial intelligence') ||
    text.includes('computing') ||
    text.includes('hardware') ||
    text.includes('data ') ||
    text.includes('network') ||
    text.includes('interoperability') ||
    text.includes('software') ||
    text.includes('oai-pmh') ||
    text.includes('algorithm') ||
    text.includes('information communication') ||
    text.includes('ict')
  ) {
    return 'Technology';
  }

  // Social Science keywords
  if (
    text.includes('societ') ||
    text.includes('social') ||
    text.includes('governance') ||
    text.includes('policy') ||
    text.includes('gender') ||
    text.includes('equity') ||
    text.includes('justice') ||
    text.includes('community') ||
    text.includes('colonial') ||
    text.includes('poverty') ||
    text.includes('librarianship') ||
    text.includes('epistemic disobedience') ||
    text.includes('sovereignty') ||
    text.includes('development') ||
    text.includes('political') ||
    text.includes('economy')
  ) {
    return 'Social Science';
  }

  // Education default
  return 'Education';
}

/**
 * Empty static list: The repository now strictly queries live, verified open access records
 * from OpenAlex, CrossRef, and CORE with authentic author credentials.
 */
export const CURATED_RESEARCH_ARTICLES: SearchResult[] = [];
