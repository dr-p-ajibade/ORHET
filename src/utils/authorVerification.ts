import { SearchResult, AuthorAttribution, User } from '../types';

export interface AuthorMatchResult {
  isMatch: boolean;
  matchType?: 'orcid' | 'author_id';
  matchedIdentifier?: string;
  matchedAuthorName?: string;
  institution?: string;
  authorPosition?: string;
}

/**
 * Normalizes an ORCID string to a bare 16-character identifier (e.g. "0000-0002-8608-8378")
 */
export function normalizeOrcid(orcid?: string | null): string | null {
  if (!orcid) return null;
  const cleaned = orcid
    .trim()
    .replace(/^https?:\/\/(www\.)?orcid\.org\//i, '')
    .replace(/\/+$/, '')
    .toUpperCase();
  
  // Standard ORCID format: 4 groups of 4 characters separated by hyphens
  const match = cleaned.match(/\d{4}-\d{4}-\d{4}-[\dX]{4}/);
  return match ? match[0] : (cleaned.length >= 16 ? cleaned : null);
}

/**
 * Normalizes an OpenAlex Author ID (e.g. "https://openalex.org/A5026362049" -> "A5026362049")
 */
export function normalizeAuthorId(authorId?: string | null): string | null {
  if (!authorId) return null;
  const cleaned = authorId
    .trim()
    .replace(/^https?:\/\/(www\.)?openalex\.org\/(authors\/)?/i, '')
    .replace(/\/+$/, '')
    .toUpperCase();
  return cleaned || null;
}

/**
 * Formats a valid public ORCID profile URL.
 */
export function getAuthorOrcidUrl(orcid?: string | null): string | null {
  const norm = normalizeOrcid(orcid);
  return norm ? `https://orcid.org/${norm}` : null;
}

/**
 * Formats a valid public OpenAlex author URL.
 */
export function getOpenAlexAuthorUrl(authorId?: string | null): string | null {
  const norm = normalizeAuthorId(authorId);
  return norm ? `https://openalex.org/${norm}` : null;
}

/**
 * Rigorously checks whether an article was authored by the logged-in scholar.
 * 
 * STRICT ACADEMIC INTEGRITY & ANTI-INCORRECT-ATTRIBUTION RULE:
 * Authorship is ONLY asserted if either:
 * 1. The article has an author whose OpenAlex `orcid` matches the user's verified profile ORCID.
 * 2. The article has an author whose OpenAlex `author_id` matches the user's verified profile author_id.
 * 
 * NEVER match by plain text author name (e.g. "P. Ajibade") or heuristic guessing.
 * If user profile has neither identifier configured, or neither matches, return isMatch: false.
 */
export function validateUserAuthorship(article: SearchResult, user: User | null): AuthorMatchResult {
  if (!user) {
    return { isMatch: false };
  }

  const userOrcid = normalizeOrcid(user.orcid);
  const userAuthorId = normalizeAuthorId(user.authorId);

  // If the user profile does not have an ORCID or OpenAlex Author ID set,
  // we strictly refuse to display any authorship association to prevent incorrect attributions.
  if (!userOrcid && !userAuthorId) {
    return { isMatch: false };
  }

  const authorDetails = article.authorDetails || [];

  for (const author of authorDetails) {
    // 1. Strict ORCID validation
    if (userOrcid && author.orcid) {
      const authorOrcidNorm = normalizeOrcid(author.orcid);
      if (authorOrcidNorm && authorOrcidNorm === userOrcid) {
        return {
          isMatch: true,
          matchType: 'orcid',
          matchedIdentifier: author.orcid,
          matchedAuthorName: author.name,
          institution: author.institution,
          authorPosition: author.authorPosition,
        };
      }
    }

    // 2. Strict OpenAlex author_id validation
    if (userAuthorId && author.id) {
      const authorIdNorm = normalizeAuthorId(author.id);
      if (authorIdNorm && authorIdNorm === userAuthorId) {
        return {
          isMatch: true,
          matchType: 'author_id',
          matchedIdentifier: author.id,
          matchedAuthorName: author.name,
          institution: author.institution,
          authorPosition: author.authorPosition,
        };
      }
    }
  }

  return { isMatch: false };
}
