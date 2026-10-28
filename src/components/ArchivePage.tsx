import { useState, FormEvent, useMemo } from 'react';
import { 
  Search, Loader2, ExternalLink, ChevronRight, Bookmark, 
  BookOpen, Check, AlertCircle, Filter, Sparkles, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResult, OpenAlexWork, CrossRefWork, COREWork, User as UserType } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const SOURCES = [
  { id: 'all', label: 'All Sources' },
  { id: 'openalex', label: 'OpenAlex' },
  { id: 'crossref', label: 'CrossRef' },
  { id: 'core', label: 'CORE' },
];

const EXTERNAL_SOURCES = [
  { name: 'The Lens', url: 'https://www.lens.org/lens/search/scholar/list?q=' },
  { name: 'Dimensions', url: 'https://app.dimensions.ai/discover/publication?search_text=' },
  { name: 'Google Scholar', url: 'https://scholar.google.com/scholar?q=' },
  { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=' },
];

interface ArchivePageProps {
  user: UserType | null;
  coreApiKey: string;
  onOpenResource: (resource: SearchResult) => void;
  onOpenAuth: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
  onHandleFirestoreError: (error: unknown, op: any, path: string) => void;
}

export default function ArchivePage({
  user,
  coreApiKey,
  onOpenResource,
  onOpenAuth,
  onUpdateUser,
  onHandleFirestoreError,
}: ArchivePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  const decodeOpenAlexAbstract = (index?: Record<string, number[]>) => {
    if (!index) return 'No abstract available.';
    const words: string[] = [];
    Object.entries(index).forEach(([word, positions]) => {
      positions.forEach(pos => {
        words[pos] = word;
      });
    });
    return words.join(' ').slice(0, 300) + '...';
  };

  const fetchOpenAlex = async (q: string): Promise<SearchResult[]> => {
    try {
      const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=10`);
      const data = await res.json();
      return (data.results || []).map((work: OpenAlexWork) => ({
        id: work.id,
        title: work.display_name,
        authors: work.authorships?.map(a => a.author.display_name) || [],
        year: work.publication_year ? work.publication_year.toString() : 'N/A',
        journal: work.primary_location?.source?.display_name || 'Academic Source',
        doi: work.doi || '',
        abstract: decodeOpenAlexAbstract(work.abstract_inverted_index),
        source: 'OpenAlex' as const,
        url: work.doi || `https://openalex.org/${work.id.split('/').pop()}`,
      }));
    } catch (e) {
      console.error('OpenAlex fetch failed', e);
      return [];
    }
  };

  const fetchCrossRef = async (q: string): Promise<SearchResult[]> => {
    try {
      const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=10`);
      const data = await res.json();
      return (data.message?.items || []).map((work: CrossRefWork) => ({
        id: work.DOI || `crossref-${Math.random()}`,
        title: work.title?.[0] || 'Untitled Publication',
        authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean) || [],
        year: work.created?.['date-parts']?.[0]?.[0]?.toString() || 'N/A',
        journal: work['container-title']?.[0] || 'Unknown Publication Container',
        doi: work.DOI || '',
        abstract: 'Comprehensive metadata indexed via CrossRef Academic Registry.',
        source: 'CrossRef' as const,
        url: work.URL || `https://doi.org/${work.DOI}`,
      }));
    } catch (e) {
      console.error('CrossRef fetch failed', e);
      return [];
    }
  };

  const fetchCORE = async (q: string): Promise<SearchResult[]> => {
    if (!coreApiKey) return [];
    try {
      const res = await fetch(`/api/core-proxy/search/works?q=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${coreApiKey}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `CORE API request failed with status ${res.status}`);
      }
      const data = await res.json();
      return (data.results || []).map((work: COREWork) => ({
        id: work.id?.toString() || `core-${Math.random()}`,
        title: work.title || 'Untitled Work',
        authors: work.authors?.map(a => a.name) || [],
        year: work.yearPublished?.toString() || 'N/A',
        journal: work.publisher || 'CORE Open Access Repository',
        doi: work.doi || '',
        abstract: work.abstract ? (work.abstract.slice(0, 300) + '...') : 'Open access record provided by CORE repository network.',
        source: 'CORE' as const,
        url: work.downloadUrl || `https://core.ac.uk/works/${work.id}`,
      }));
    } catch (e) {
      console.error('CORE fetch failed', e);
      return [];
    }
  };

  const triggerSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setSearchQuery(queryStr);
    setLoading(true);
    setError(null);
    setResults([]);

    const promises = [];
    if (activeTab === 'all' || activeTab === 'openalex') promises.push(fetchOpenAlex(queryStr));
    if (activeTab === 'all' || activeTab === 'crossref') promises.push(fetchCrossRef(queryStr));
    if (activeTab === 'all' || activeTab === 'core') {
      if (coreApiKey) {
        promises.push(fetchCORE(queryStr));
      } else if (activeTab === 'core') {
        setError('CORE API key required for full search. Please configure your API key in Settings.');
      }
    }

    try {
      const allResults = await Promise.all(promises);
      const flattened = allResults.flat().sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
      });
      setResults(flattened);
    } catch (err) {
      setError('An error occurred during database search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    await triggerSearch(searchQuery);
  };

  const isBookmarked = (articleId: string) => {
    return !!user?.bookmarks?.some(b => b.id === articleId);
  };

  const handleToggleBookmark = async (article: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }

    const currentBookmarks = user.bookmarks || [];
    const exists = currentBookmarks.some(b => b.id === article.id);

    let updatedBookmarks: SearchResult[];
    if (exists) {
      updatedBookmarks = currentBookmarks.filter(b => b.id !== article.id);
      setBookmarkToast('Removed from Bookmarks');
    } else {
      updatedBookmarks = [article, ...currentBookmarks];
      setBookmarkToast('Article saved to your Account Library!');
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bookmarks: updatedBookmarks
      });
      onUpdateUser({ ...user, bookmarks: updatedBookmarks });
      setTimeout(() => setBookmarkToast(null), 3000);
    } catch (err) {
      onHandleFirestoreError(err, 'update', `users/${user.uid}`);
    }
  };

  return (
    <div className="space-y-10 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-mono uppercase tracking-widest font-bold">
          <Database className="w-3.5 h-3.5" />
          Global Academic Aggregator
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Research Archive
        </h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed">
          Search millions of peer-reviewed open access publications across OpenAlex, CrossRef, and CORE databases in a unified scholarly interface.
        </p>
      </div>

      {/* Main Search Bar (Focus is preserved on state updates) */}
      <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-stone-400 group-focus-within:text-orange-600 transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by topic, paper title, author, or DOI..."
          className="w-full bg-white border border-stone-300 rounded-2xl py-4 pl-14 pr-32 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-stone-400 text-slate-900 shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 text-xs uppercase tracking-wider"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Database Source Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SOURCES.map((source) => (
          <button
            key={source.id}
            onClick={() => {
              setActiveTab(source.id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
              activeTab === source.id
                ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'bg-white border-stone-200 text-slate-600 hover:border-orange-500/50 hover:text-slate-900 shadow-sm'
            }`}
          >
            {source.label}
          </button>
        ))}

        <div className="w-px h-5 bg-stone-300 mx-2 hidden sm:block" />

        {EXTERNAL_SOURCES.map((source) => (
          <a
            key={source.name}
            href={`${source.url}${encodeURIComponent(searchQuery || 'higher education')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-white border border-stone-200 text-slate-600 hover:border-orange-500/50 hover:text-orange-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            {source.name}
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>

      {/* Error / Alert Message */}
      {error && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl max-w-2xl mx-auto flex items-center gap-3 text-orange-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-orange-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {loading && (
          <div className="py-20 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">
              Searching academic databases...
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono uppercase tracking-widest px-2">
              <span>{results.length} Publications Discovered</span>
              <span>Sorted by publication year</span>
            </div>

            {results.map((result, idx) => {
              const bookmarked = isBookmarked(result.id);

              return (
                <motion.div
                  key={`${result.source}-${result.id}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  className="glass-card p-6 md:p-7 hover:border-orange-500/40 hover:shadow-xl transition-all group space-y-4 cursor-pointer bg-white"
                  onClick={() => onOpenResource(result)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        result.source === 'OpenAlex' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        result.source === 'CrossRef' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {result.source}
                      </span>
                      <span className="text-slate-600 text-xs font-bold">{result.year}</span>
                      {result.journal && (
                        <span className="text-slate-500 text-xs truncate max-w-xs md:max-w-md">
                          • {result.journal}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleBookmark(result, e)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          bookmarked
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-slate-900 hover:border-stone-300'
                        }`}
                        title={bookmarked ? 'Remove Bookmark' : 'Save Bookmark to Account'}
                      >
                        <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>

                      <div className="p-2 bg-stone-100 rounded-xl opacity-60 group-hover:opacity-100 group-hover:text-orange-600 transition-all text-slate-500">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors">
                    {result.title}
                  </h3>

                  <p className="text-slate-500 text-xs md:text-sm font-medium">
                    {result.authors.slice(0, 4).join(', ')}
                    {result.authors.length > 4 && ' et al.'}
                  </p>

                  <p className="text-slate-600 text-xs md:text-sm line-clamp-2 leading-relaxed">
                    {result.abstract}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-orange-700 font-bold flex items-center gap-1.5 group/btn">
                      <BookOpen className="w-3.5 h-3.5" />
                      Read Publication
                    </span>
                    {result.doi && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        DOI: {result.doi.replace('https://doi.org/', '')}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && results.length === 0 && searchQuery && (
          <div className="glass-card cultural-watermark-card p-12 text-center space-y-3 max-w-lg mx-auto border border-stone-200 bg-white">
            <Search className="w-8 h-8 text-orange-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No publications found</h3>
            <p className="text-slate-500 text-sm">
              Try modifying your search query or switching to "All Sources" tab.
            </p>
          </div>
        )}

        {!loading && results.length === 0 && !searchQuery && (
          <div className="glass-card cultural-watermark-card p-8 md:p-12 text-center space-y-6 max-w-2xl mx-auto border border-orange-200/80 shadow-lg bg-white/95">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">
                Explore Research Repositories
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                Search open scholarly databases or choose from foundational higher education research themes below:
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                'Higher Education Transformation',
                'Curriculum Decolonisation',
                'African Epistemologies',
                'Digital Pedagogy in Africa',
                'STEM Research Capacity',
                'Doctoral Education Quality'
              ].map((topic) => (
                <button
                  key={topic}
                  onClick={() => triggerSearch(topic)}
                  className="px-4 py-2 bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-900 transition-all text-left shadow-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bookmark Toast */}
      <AnimatePresence>
        {bookmarkToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 right-8 bg-slate-900 border border-stone-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 font-bold text-sm"
          >
            <Bookmark className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>{bookmarkToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
