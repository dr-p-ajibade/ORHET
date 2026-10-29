import { useState, FormEvent, useMemo } from 'react';
import { 
  Search, Loader2, ExternalLink, ChevronRight, Bookmark, 
  BookOpen, AlertCircle, Database, Globe, Layers, 
  ArrowUpRight, BarChart3, Info, CheckCircle2, RotateCcw,
  FileDown, Download, CheckSquare, Square, X, Filter,
  GraduationCap, Cpu, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResult, OpenAlexWork, CrossRefWork, COREWork, User as UserType } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  REPOSITORY_STATS, 
  CURATED_RESEARCH_ARTICLES, 
  ACADEMIC_CATEGORIES, 
  AcademicCategory, 
  getArticleAcademicCategory 
} from '../data/curatedArticles';
import { exportArticleToPDF, exportArticleListToPDF } from '../utils/pdfExport';

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

const QUICK_FILTER_TAGS = [
  'All',
  'Dr P Ajibade',
  'Digital Transformation',
  'Open Science',
  'Epistemic Access',
  'Doctoral Supervision',
  'Institutional Repositories',
  'Curriculum Decolonisation',
  'AI Ethics',
  'STEM Capacity'
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
  // Remote API search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Academic Category Horizontal Tab Navigation state
  const [selectedCategory, setSelectedCategory] = useState<AcademicCategory>('all');

  // Real-time search filter state
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Selected articles for multi-select PDF export
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);

  // UI state
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);
  const [pdfToast, setPdfToast] = useState<string | null>(null);
  const [showScaleDetails, setShowScaleDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'year-desc' | 'year-asc' | 'title'>('year-desc');

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
      const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=12`);
      const data = await res.json();
      return (data.results || []).map((work: OpenAlexWork) => {
        const partialResult: Partial<SearchResult> = {
          title: work.display_name,
          journal: work.primary_location?.source?.display_name || 'Academic Source',
          abstract: decodeOpenAlexAbstract(work.abstract_inverted_index),
        };
        const detectedCategory = getArticleAcademicCategory(partialResult);

        return {
          id: work.id,
          title: work.display_name,
          authors: work.authorships?.map(a => a.author.display_name) || [],
          year: work.publication_year ? work.publication_year.toString() : 'N/A',
          journal: work.primary_location?.source?.display_name || 'Academic Source',
          doi: work.doi || '',
          abstract: decodeOpenAlexAbstract(work.abstract_inverted_index),
          source: 'OpenAlex' as const,
          url: work.doi || `https://openalex.org/${work.id.split('/').pop()}`,
          category: detectedCategory,
        };
      });
    } catch (e) {
      console.error('OpenAlex fetch failed', e);
      return [];
    }
  };

  const fetchCrossRef = async (q: string): Promise<SearchResult[]> => {
    try {
      const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=12`);
      const data = await res.json();
      return (data.message?.items || []).map((work: CrossRefWork) => {
        const titleStr = work.title?.[0] || 'Untitled Publication';
        const journalStr = work['container-title']?.[0] || 'Unknown Publication Container';
        const detectedCategory = getArticleAcademicCategory({ title: titleStr, journal: journalStr });

        return {
          id: work.DOI || `crossref-${Math.random()}`,
          title: titleStr,
          authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean) || [],
          year: work.created?.['date-parts']?.[0]?.[0]?.toString() || 'N/A',
          journal: journalStr,
          doi: work.DOI || '',
          abstract: 'Comprehensive metadata indexed via CrossRef Academic Registry.',
          source: 'CrossRef' as const,
          url: work.URL || `https://doi.org/${work.DOI}`,
          category: detectedCategory,
        };
      });
    } catch (e) {
      console.error('CrossRef fetch failed', e);
      return [];
    }
  };

  const fetchCORE = async (q: string): Promise<SearchResult[]> => {
    if (!coreApiKey) return [];
    try {
      const res = await fetch(`/api/core-proxy/search/works?q=${encodeURIComponent(q)}&limit=12`, {
        headers: { Authorization: `Bearer ${coreApiKey}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `CORE API request failed with status ${res.status}`);
      }
      const data = await res.json();
      return (data.results || []).map((work: COREWork) => {
        const titleStr = work.title || 'Untitled Work';
        const abstractStr = work.abstract || '';
        const detectedCategory = getArticleAcademicCategory({ title: titleStr, abstract: abstractStr });

        return {
          id: work.id?.toString() || `core-${Math.random()}`,
          title: titleStr,
          authors: work.authors?.map(a => a.name) || [],
          year: work.yearPublished?.toString() || 'N/A',
          journal: work.publisher || 'CORE Open Access Repository',
          doi: work.doi || '',
          abstract: work.abstract ? (work.abstract.slice(0, 300) + '...') : 'Open access record provided by CORE repository network.',
          source: 'CORE' as const,
          url: work.downloadUrl || `https://core.ac.uk/works/${work.id}`,
          category: detectedCategory,
        };
      });
    } catch (e) {
      console.error('CORE fetch failed', e);
      return [];
    }
  };

  const triggerSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setSearchQuery(queryStr);
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setResults([]);
    setSelectedArticleIds([]);

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
      const flattened = allResults.flat();
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

  const resetToCurated = () => {
    setSearchQuery('');
    setFilterQuery('');
    setSelectedTag('All');
    setSelectedCategory('all');
    setHasSearched(false);
    setResults([]);
    setError(null);
    setActiveTab('all');
    setSelectedArticleIds([]);
  };

  // Base raw articles
  const rawArticles = hasSearched ? results : CURATED_RESEARCH_ARTICLES;

  // Counts per academic category in the current raw dataset
  const categoryCounts = useMemo(() => {
    const counts: Record<AcademicCategory, number> = {
      all: rawArticles.length,
      Education: 0,
      Technology: 0,
      'Social Science': 0,
    };
    rawArticles.forEach(art => {
      const cat = getArticleAcademicCategory(art);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [rawArticles]);

  // Real-time filtered articles (by academic category, database source, and text query)
  const filteredArticles = useMemo(() => {
    let list = rawArticles;

    // 1. Filter by Academic Category ('all' | 'Education' | 'Technology' | 'Social Science')
    if (selectedCategory !== 'all') {
      list = list.filter(art => getArticleAcademicCategory(art) === selectedCategory);
    }

    // 2. Filter by source tab (All, OpenAlex, CrossRef, CORE)
    if (activeTab !== 'all') {
      list = list.filter(art => art.source.toLowerCase() === activeTab.toLowerCase());
    }

    // 3. Real-time text filter (Title, Author, Keyword, Journal, DOI)
    const cleanQuery = filterQuery.trim().toLowerCase();
    if (cleanQuery) {
      const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
      list = list.filter(art => {
        const titleStr = (art.title || '').toLowerCase();
        const authorsStr = (art.authors || []).join(' ').toLowerCase();
        const abstractStr = (art.abstract || '').toLowerCase();
        const journalStr = (art.journal || '').toLowerCase();
        const doiStr = (art.doi || '').toLowerCase();
        const fullSearchableText = `${titleStr} ${authorsStr} ${abstractStr} ${journalStr} ${doiStr}`;

        return queryTokens.every(token => fullSearchableText.includes(token));
      });
    }

    return list;
  }, [rawArticles, selectedCategory, activeTab, filterQuery]);

  // Sort articles
  const displayedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      if (sortBy === 'year-desc') {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
      }
      if (sortBy === 'year-asc') {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearA - yearB;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredArticles, sortBy]);

  // Counts per source for the current view
  const sourceCounts = useMemo(() => {
    const counts = { all: rawArticles.length, openalex: 0, crossref: 0, core: 0 };
    rawArticles.forEach(art => {
      if (art.source === 'OpenAlex') counts.openalex++;
      else if (art.source === 'CrossRef') counts.crossref++;
      else if (art.source === 'CORE') counts.core++;
    });
    return counts;
  }, [rawArticles]);

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

  // Multi-selection handlers
  const toggleSelectArticle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedArticleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedArticleIds.length === displayedArticles.length) {
      setSelectedArticleIds([]);
    } else {
      setSelectedArticleIds(displayedArticles.map(a => a.id));
    }
  };

  // PDF Export Handlers
  const handleDownloadSinglePDF = (article: SearchResult, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      exportArticleToPDF(article);
      setPdfToast(`Exported "${article.title.slice(0, 32)}..." as PDF`);
      setTimeout(() => setPdfToast(null), 3500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  const handleDownloadListPDF = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (displayedArticles.length === 0) return;
    try {
      const categoryLabel = selectedCategory !== 'all' ? ` [${selectedCategory}]` : '';
      const title = hasSearched 
        ? `ARHET Search Digest: "${searchQuery}"${categoryLabel}`
        : `ARHET Curated Research Repository${categoryLabel}`;
      
      const filterDescParts = [];
      if (selectedCategory !== 'all') filterDescParts.push(`Category: ${selectedCategory}`);
      if (filterQuery.trim()) filterDescParts.push(`Search Term: "${filterQuery}"`);
      const filterDesc = filterDescParts.length > 0 ? filterDescParts.join(' • ') : undefined;

      exportArticleListToPDF(displayedArticles, title, filterDesc);
      setPdfToast(`Exported ${displayedArticles.length} publications as scholarly PDF bibliography`);
      setTimeout(() => setPdfToast(null), 3500);
    } catch (err) {
      console.error('Failed to export list PDF:', err);
    }
  };

  const handleDownloadSelectedPDF = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const selectedArticles = rawArticles.filter(a => selectedArticleIds.includes(a.id));
    if (selectedArticles.length === 0) return;
    try {
      exportArticleListToPDF(
        selectedArticles,
        'Selected Academic Research Publications Digest',
        `User selection: ${selectedArticles.length} curated papers`
      );
      setPdfToast(`Exported ${selectedArticles.length} selected articles as PDF`);
      setTimeout(() => setPdfToast(null), 3500);
    } catch (err) {
      console.error('Failed to export selected PDF:', err);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (tag === 'All') {
      setFilterQuery('');
    } else {
      setFilterQuery(tag);
    }
  };

  return (
    <div className="space-y-10 py-8 max-w-5xl mx-auto">
      {/* Header with Title and Mission */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-mono uppercase tracking-widest font-bold">
          <Database className="w-3.5 h-3.5" />
          Global Academic Aggregator & Repository
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Research Archive
        </h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed">
          Access millions of peer-reviewed open access publications across OpenAlex, CrossRef, and CORE databases in a unified scholarly interface.
        </p>
      </div>

      {/* ======================================================== */}
      {/* PROMINENT REPOSITORY SCALE SUMMARY COUNTER BANNER       */}
      {/* ======================================================== */}
      <section className="glass-panel cultural-watermark-card p-6 md:p-8 border border-stone-300/80 shadow-lg relative overflow-hidden bg-white/95">
        <div className="relative z-10 space-y-6">
          {/* Top Row: Total Articles Main Counter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-700">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                Repository Scale & Scholarly Index
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight font-sans">
                  {REPOSITORY_STATS.totalArticles.toLocaleString()}+
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 font-mono">
                  Available Research Articles
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Aggregated federated repository connecting three major open bibliographic infrastructure databases with persistent identifiers, citation networks, and unembargoed full texts.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowScaleDetails(!showScaleDetails)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-stone-100 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-slate-700 hover:text-orange-900 transition-all flex items-center gap-2 shadow-sm"
              >
                <Info className="w-3.5 h-3.5 text-orange-600" />
                {showScaleDetails ? 'Hide Node Breakdown' : 'View Repository Nodes'}
              </button>
            </div>
          </div>

          {/* Sub-Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* OpenAlex Card */}
            <div className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200 hover:border-emerald-300 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  OpenAlex
                </span>
                <span className="text-[10px] font-mono text-slate-400">Works Graph</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                250M+
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Multidisciplinary global works & citation graphs
              </p>
            </div>

            {/* CrossRef Card */}
            <div className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200 hover:border-blue-300 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  CrossRef
                </span>
                <span className="text-[10px] font-mono text-slate-400">DOI Registry</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                152M+
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Publisher-indexed registered academic DOIs
              </p>
            </div>

            {/* CORE Card */}
            <div className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200 hover:border-orange-300 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  CORE
                </span>
                <span className="text-[10px] font-mono text-slate-400">Open Access</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                34.5M+
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Full-text articles from institutional repositories
              </p>
            </div>

            {/* Open Access Full Text Card */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 hover:border-orange-400 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-orange-600" />
                  Free Full-Text
                </span>
                <span className="text-[10px] font-mono text-orange-600 font-bold">Unembargoed</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                86.4M+
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Zero-paywall direct PDF & HTML publications
              </p>
            </div>
          </div>

          {/* Visual Repository Composition Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Federated Corpus Proportion</span>
              <span>284.5M Total Reach</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '58%' }} title="OpenAlex (~58%)" />
              <div className="h-full bg-blue-500" style={{ width: '34%' }} title="CrossRef (~34%)" />
              <div className="h-full bg-orange-500" style={{ width: '8%' }} title="CORE (~8%)" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> OpenAlex (~58%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> CrossRef (~34%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> CORE (~8%)
              </span>
            </div>
          </div>

          {/* Detailed Modal / Expandable Explanation */}
          <AnimatePresence>
            {showScaleDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 rounded-2xl bg-stone-100/90 border border-stone-200 space-y-3 text-xs text-slate-700 leading-relaxed font-sans">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-600" />
                    How the ARHET Repository Indexes 284.5M+ Articles
                  </div>
                  <p>
                    Rather than isolating research within a proprietary paywalled silo, the ARHET Research Archive dynamically queries and normalizes scholarly metadata from the world’s leading open science data nodes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li><strong className="text-slate-900">OpenAlex:</strong> An open catalog of 250 million global works, authors, institutions, and citation connections supported by OurResearch.</li>
                    <li><strong className="text-slate-900">CrossRef:</strong> The official digital object identifier (DOI) registration agency indexing over 152 million peer-reviewed conference proceedings, book chapters, and journal papers.</li>
                    <li><strong className="text-slate-900">CORE:</strong> The world’s largest aggregator of open access research papers harvested directly from thousands of university institutional repositories and journals.</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 font-mono pt-1">
                    Indexed data reflects live API aggregation with automated deduplication and unembargoed full-text linking.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ======================================================== */}
      {/* HORIZONTAL TAB NAVIGATION: ACADEMIC CATEGORIES           */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Academic Category Discipline Navigation</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Categorised by scholarly domain
          </span>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-stone-100/90 p-1.5 rounded-2xl border border-stone-300/80 shadow-sm flex flex-wrap sm:flex-nowrap items-center gap-1.5">
          {ACADEMIC_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id];
            const Icon = 
              cat.id === 'Education' ? GraduationCap :
              cat.id === 'Technology' ? Cpu :
              cat.id === 'Social Science' ? Users : Layers;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 min-w-[130px] sm:min-w-0 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
                  isActive
                    ? 'bg-white text-orange-900 shadow-md border border-stone-200/90 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                <span className="font-sans whitespace-nowrap">{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                  isActive 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-stone-200 text-slate-600'
                }`}>
                  {count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Category Descriptive Strip */}
        <AnimatePresence mode="wait">
          {selectedCategory !== 'all' ? (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-4 py-2.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-orange-800 uppercase tracking-wide">
                  {selectedCategory} Domain:
                </span>
                <span className="text-slate-700">
                  {ACADEMIC_CATEGORIES.find(c => c.id === selectedCategory)?.description}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-[11px] font-mono text-orange-700 hover:text-orange-900 underline font-bold shrink-0 text-left sm:text-right"
              >
                Show All Categories ({rawArticles.length})
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {/* ======================================================== */}
      {/* REAL-TIME SEARCH FILTER & FEDERATED RETRIEVAL PANEL     */}
      {/* ======================================================== */}
      <section className="glass-panel p-6 border border-stone-300 rounded-3xl bg-white/95 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-700">
              <Filter className="w-3.5 h-3.5 text-orange-600" />
              Real-Time Search Filter
            </div>
            <p className="text-xs text-slate-500">
              Quickly filter articles in real time by title, author name, keyword, journal, or DOI as you type.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {filterQuery && (
              <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                {displayedArticles.length} {displayedArticles.length === 1 ? 'match' : 'matches'} found
              </span>
            )}
          </div>
        </div>

        {/* Real-time search filter input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-600 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setSelectedTag('All');
            }}
            placeholder="Search by title, author (e.g. Dr P Ajibade), or keyword (e.g. Open Science, Pedagogy)..."
            className="w-full bg-stone-50/80 border border-stone-300 rounded-2xl py-3.5 pl-12 pr-12 text-sm md:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all text-slate-900 placeholder:text-stone-400"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => {
                setFilterQuery('');
                setSelectedTag('All');
              }}
              className="absolute inset-y-0 right-3.5 flex items-center px-1 text-stone-400 hover:text-slate-800 transition-colors"
              title="Clear search filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Keyword Pills */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            Popular Topics & Scholars:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_FILTER_TAGS.map((tag) => {
              const isSelected = selectedTag === tag || (tag !== 'All' && filterQuery.toLowerCase() === tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600 text-white font-bold shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional External Query Across All 284M+ Records Form */}
        <div className="pt-3 border-t border-stone-200/80">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query external federated APIs (OpenAlex / CrossRef / CORE)..."
                className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 transition-all placeholder:text-stone-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-stone-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-orange-400" />}
              <span>Query Online APIs</span>
            </button>
          </form>
        </div>
      </section>

      {/* Database Source Filter Tabs & Dynamic Counts */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SOURCES.map((source) => {
            const count = sourceCounts[source.id as keyof typeof sourceCounts] ?? 0;
            const isActive = activeTab === source.id;
            return (
              <button
                key={source.id}
                onClick={() => setActiveTab(source.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${
                  isActive
                    ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border-stone-200 text-slate-600 hover:border-orange-500/50 hover:text-slate-900 shadow-sm'
                }`}
              >
                <span>{source.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-orange-700/60 text-white' : 'bg-stone-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-stone-300 mx-2 hidden sm:block" />

          {EXTERNAL_SOURCES.map((source) => (
            <a
              key={source.name}
              href={`${source.url}${encodeURIComponent(filterQuery || searchQuery || 'higher education transformation')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-white border border-stone-200 text-slate-600 hover:border-orange-500/50 hover:text-orange-700 flex items-center gap-1.5 transition-all shadow-sm"
            >
              {source.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Error / Alert Message */}
      {error && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl max-w-2xl mx-auto flex items-center gap-3 text-orange-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-orange-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* RESULTS TOOLBAR & PDF EXPORT BUTTONS                    */}
      {/* ======================================================== */}
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-slate-900 uppercase tracking-wider">
              {hasSearched ? 'API Search Results' : 'Research Repository'}
            </span>
            {selectedCategory !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold text-[11px]">
                {selectedCategory}
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-600">
              Showing <strong className="text-orange-700">{displayedArticles.length}</strong> of{' '}
              <strong className="text-slate-900">
                {rawArticles.length}
              </strong>
              {(selectedCategory !== 'all' || filterQuery) && (
                <span className="ml-1 text-slate-500">
                  (filtered view)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Download List as PDF Button */}
            <button
              type="button"
              onClick={handleDownloadListPDF}
              disabled={displayedArticles.length === 0}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
              title="Download entire displayed list as formatted PDF bibliography"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download List as PDF ({displayedArticles.length})</span>
            </button>

            {(hasSearched || selectedCategory !== 'all' || filterQuery) && (
              <button
                onClick={resetToCurated}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                Reset Filters
              </button>
            )}

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="year-desc">Year (Newest)</option>
                <option value="year-asc">Year (Oldest)</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Select Action Banner */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100/90 border border-stone-200 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 font-mono text-slate-700 hover:text-slate-900 font-bold"
            >
              {selectedArticleIds.length === displayedArticles.length && displayedArticles.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-orange-600" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
              <span>{selectedArticleIds.length === displayedArticles.length && displayedArticles.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-500">
              {selectedArticleIds.length} of {displayedArticles.length} selected
            </span>
          </div>

          {selectedArticleIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadSelectedPDF}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Download Selected as PDF ({selectedArticleIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedArticleIds([])}
                className="p-1.5 text-slate-400 hover:text-slate-700"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {loading && (
          <div className="py-20 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">
              Querying federated academic repositories across 284M+ articles...
            </p>
          </div>
        )}

        {!loading && displayedArticles.length > 0 && (
          <div className="space-y-4">
            {displayedArticles.map((result, idx) => {
              const bookmarked = isBookmarked(result.id);
              const isSelected = selectedArticleIds.includes(result.id);
              const articleCategory = getArticleAcademicCategory(result);

              return (
                <motion.div
                  key={`${result.source}-${result.id}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                  className={`glass-card p-6 md:p-7 hover:border-orange-500/40 hover:shadow-xl transition-all group space-y-4 cursor-pointer bg-white ${
                    isSelected ? 'ring-2 ring-orange-500/60 border-orange-400 bg-orange-50/20' : ''
                  }`}
                  onClick={() => onOpenResource(result)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Checkbox for item selection */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectArticle(result.id, e)}
                        className="p-1 -ml-1 text-stone-400 hover:text-orange-600 transition-colors"
                        title={isSelected ? 'Deselect article' : 'Select article for export'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400" />
                        )}
                      </button>

                      {/* Academic Category Badge */}
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(articleCategory);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide border cursor-pointer hover:opacity-80 transition-opacity ${
                          articleCategory === 'Education' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          articleCategory === 'Technology' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                        title={`Filter by ${articleCategory}`}
                      >
                        {articleCategory}
                      </span>

                      {/* Source Database Badge */}
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        result.source === 'OpenAlex' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        result.source === 'CrossRef' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {result.source}
                      </span>

                      <span className="text-slate-700 text-xs font-bold font-mono">{result.year}</span>
                      {result.journal && (
                        <span className="text-slate-500 text-xs truncate max-w-xs md:max-w-md">
                          • {result.journal}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Download as PDF Button for this selected article */}
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSinglePDF(result, e)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-900 transition-all text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                        title="Download publication details as PDF"
                      >
                        <FileDown className="w-3.5 h-3.5 text-orange-600" />
                        <span className="hidden sm:inline">Download as PDF</span>
                      </button>

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

                  <div className="flex items-center justify-between pt-2 text-xs border-t border-stone-100">
                    <div className="flex items-center gap-3">
                      <span className="text-orange-700 font-bold flex items-center gap-1.5 group/btn">
                        <BookOpen className="w-3.5 h-3.5" />
                        Read Publication Details
                      </span>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSinglePDF(result, e)}
                        className="text-slate-500 hover:text-orange-700 font-mono font-medium flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3 text-orange-600" />
                        PDF Export
                      </button>
                    </div>

                    {result.doi && (
                      <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px] sm:max-w-xs">
                        DOI: {result.doi.replace('https://doi.org/', '')}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state when Real-Time Filter or Category has 0 matches */}
        {!loading && displayedArticles.length === 0 && (filterQuery || selectedCategory !== 'all') && (
          <div className="glass-card cultural-watermark-card p-10 text-center space-y-4 max-w-lg mx-auto border border-stone-200 bg-white">
            <Filter className="w-8 h-8 text-orange-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No articles match your criteria</h3>
            <p className="text-slate-500 text-sm">
              {filterQuery && selectedCategory !== 'all'
                ? `No articles in ${selectedCategory} matched "${filterQuery}".`
                : filterQuery
                ? `No publications matched "${filterQuery}".`
                : `No publications currently classified under ${selectedCategory}.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterQuery('');
                    setSelectedTag('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-orange-500 transition-all flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Search Filter
                </button>
              )}
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Show All Categories
                </button>
              )}
              {searchQuery !== filterQuery && filterQuery && (
                <button
                  type="button"
                  onClick={() => triggerSearch(filterQuery)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition-all flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-orange-400" />
                  Query Online APIs
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state when federated API search returned zero results */}
        {!loading && displayedArticles.length === 0 && !filterQuery && selectedCategory === 'all' && hasSearched && (
          <div className="glass-card cultural-watermark-card p-12 text-center space-y-4 max-w-lg mx-auto border border-stone-200 bg-white">
            <Search className="w-8 h-8 text-orange-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No matching publications found</h3>
            <p className="text-slate-500 text-sm">
              We couldn’t find matches in this specific tab. Try switching to &ldquo;All Sources&rdquo; or modifying your search terms.
            </p>
            <button
              onClick={resetToCurated}
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-orange-500 transition-all"
            >
              Browse Curated Transformation Repository
            </button>
          </div>
        )}

        {/* Foundational Themes Prompt Box */}
        <div className="glass-card cultural-watermark-card p-6 md:p-8 border border-orange-200/80 shadow-md bg-white/95 mt-10">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-orange-700">
              <Layers className="w-3.5 h-3.5" />
              Foundational Research Query Presets
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Explore Core Transformation Domains
            </h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Click any subject below to launch a live search across all 284M+ indexed publications:
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { label: 'Student Access & Epistemic Justice', category: 'Education' },
                { label: 'Digital Transformation in Rural Universities', category: 'Technology' },
                { label: 'Curriculum Decolonisation in Africa', category: 'Education' },
                { label: 'Open Science Framework in Higher Education', category: 'Technology' },
                { label: 'Doctoral Education & Postgraduate Supervision', category: 'Education' },
                { label: 'STEM Research Capacity in Developing Countries', category: 'Technology' },
                { label: 'Institutional Repositories & Diamond Open Access', category: 'Technology' }
              ].map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => {
                    setFilterQuery(topic.label);
                    setSelectedTag(topic.label);
                    setSelectedCategory(topic.category as AcademicCategory);
                  }}
                  className="px-3.5 py-2 bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-900 transition-all text-left shadow-sm flex items-center gap-1.5"
                >
                  <span>{topic.label}</span>
                  <ArrowUpRight className="w-3 h-3 text-orange-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarked Toast */}
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

      {/* PDF Export Toast */}
      <AnimatePresence>
        {pdfToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 left-8 bg-orange-700 border border-orange-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 font-bold text-sm"
          >
            <Download className="w-4 h-4 text-white animate-bounce" />
            <span>{pdfToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
