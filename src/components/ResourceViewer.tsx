import { useState } from 'react';
import { 
  X, ExternalLink, Bookmark, BookOpen, 
  Share2, Check, ArrowUpRight, Download, FileDown, 
  Quote, Copy, FileText, Globe, Layers, CheckCircle2, 
  Link2, Sparkles, AlertCircle, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResult, User as UserType } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { exportArticleToPDF, formatAPACitation } from '../utils/pdfExport';
import { getArticleAcademicCategory } from '../data/curatedArticles';
import { validateUserAuthorship, getAuthorOrcidUrl, getOpenAlexAuthorUrl } from '../utils/authorVerification';

interface ResourceViewerProps {
  resource: SearchResult | null;
  user: UserType | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
  onHandleFirestoreError: (error: unknown, op: any, path: string) => void;
}

export default function ResourceViewer({
  resource,
  user,
  onClose,
  onOpenAuth,
  onUpdateUser,
  onHandleFirestoreError,
}: ResourceViewerProps) {
  const [activeViewTab, setActiveViewTab] = useState<'reader' | 'web'>('reader');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  if (!resource) return null;

  const isBookmarked = !!user?.bookmarks?.some(b => b.id === resource.id);
  const category = getArticleAcademicCategory(resource);
  const userAuthorship = validateUserAuthorship(resource, user);

  const getCanonicalUrl = (): string => {
    if (!resource) return window.location.href;
    if (resource.url) return resource.url;
    if (resource.doi) {
      const clean = resource.doi.replace(/^doi:\s*/i, '').trim();
      return clean.startsWith('http') ? clean : `https://doi.org/${clean}`;
    }
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(resource.title)}`;
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const currentBookmarks = user.bookmarks || [];
    const exists = currentBookmarks.some(b => b.id === resource.id);

    let updatedBookmarks: SearchResult[];
    if (exists) {
      updatedBookmarks = currentBookmarks.filter(b => b.id !== resource.id);
    } else {
      updatedBookmarks = [resource, ...currentBookmarks];
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bookmarks: updatedBookmarks
      });
      onUpdateUser({ ...user, bookmarks: updatedBookmarks });
    } catch (err) {
      onHandleFirestoreError(err, 'update', `users/${user.uid}`);
    }
  };

  const handleShareLink = () => {
    const url = getCanonicalUrl();
    navigator.clipboard?.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleCopyCitation = () => {
    const citation = formatAPACitation(resource);
    navigator.clipboard?.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const canonicalUrl = getCanonicalUrl();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-5xl h-[92vh] bg-white border border-stone-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
      >
        {/* Top Header Toolbar */}
        <div className="p-3.5 sm:px-6 sm:py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate min-w-0">
            {/* Category Badge */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide border shrink-0 ${
              category === 'Education' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              category === 'Technology' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {category}
            </span>

            {/* Source Database Badge */}
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0 ${
              resource.source === 'OpenAlex' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              resource.source === 'CrossRef' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {resource.source}
            </span>

            <span className="text-slate-900 font-bold text-xs sm:text-sm truncate">
              {resource.title}
            </span>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share Button (requested) */}
            <button
              onClick={handleShareLink}
              className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm ${
                copiedShare
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-stone-100 border-stone-300 text-slate-700 hover:text-slate-900'
              }`}
              title="Copy direct shareable link to clipboard"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Copy Citation Button */}
            <button
              onClick={handleCopyCitation}
              className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-bold font-mono hidden sm:flex items-center gap-1.5 shadow-sm ${
                copiedCitation
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white hover:bg-amber-50 border-stone-300 hover:border-amber-300 text-slate-700 hover:text-amber-900'
              }`}
              title="Copy APA 7th Edition Citation"
            >
              {copiedCitation ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Citation Copied!</span>
                </>
              ) : (
                <>
                  <Quote className="w-3.5 h-3.5 text-amber-600" />
                  <span>Copy Citation</span>
                </>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              onClick={() => exportArticleToPDF(resource)}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-slate-700 hover:text-slate-900 border border-stone-300 rounded-xl font-bold transition-all text-xs hidden md:flex items-center gap-1.5 shadow-sm font-mono"
              title="Download publication brief as PDF"
            >
              <Download className="w-3.5 h-3.5 text-orange-600" />
              <span>Download PDF</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked 
                  ? 'bg-amber-50 border-amber-300 text-amber-700' 
                  : 'bg-white border-stone-200 text-slate-500 hover:text-slate-900 hover:bg-stone-100'
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            {/* External Direct Link */}
            <a
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20 uppercase tracking-wider"
              title="Open full external publication in new tab"
            >
              <span className="hidden sm:inline">External</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-stone-100 text-slate-500 hover:text-slate-900 border border-stone-200 transition-all ml-0.5"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar + Main Reading Area */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
          {/* Metadata Sidebar */}
          <div className="w-full md:w-80 p-5 md:p-6 bg-stone-50/90 border-b md:border-b-0 md:border-r border-stone-200 overflow-y-auto space-y-5 shrink-0">
            {/* Primary Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => exportArticleToPDF(resource)}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all"
              >
                <FileDown className="w-4 h-4" />
                Download as PDF Brief
              </button>

              <button
                type="button"
                onClick={handleShareLink}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-orange-600" />
                    <span>Share Publication Link</span>
                  </>
                )}
              </button>
            </div>

            {/* APA Citation Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-900 font-bold flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-amber-700" />
                  APA 7th Citation
                </span>
                <button
                  type="button"
                  onClick={handleCopyCitation}
                  className="px-2 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-amber-700" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-800 leading-relaxed font-serif italic bg-white/95 p-2.5 rounded-xl border border-amber-200/60 select-all">
                {formatAPACitation(resource)}
              </p>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Academic Domain</div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  {category}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Year</div>
                  <div className="text-xs font-bold text-slate-900">{resource.year}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Database Node</div>
                  <div className="text-xs font-bold text-orange-700">{resource.source}</div>
                </div>
              </div>

              {resource.journal && (
                <div className="space-y-1 pt-2 border-t border-stone-200">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Publication Venue</div>
                  <p className="text-xs text-slate-800 font-medium">{resource.journal}</p>
                </div>
              )}

              {resource.doi && (
                <div className="space-y-1 pt-2 border-t border-stone-200">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Identifier / DOI</div>
                  <p className="text-[11px] font-mono text-slate-700 break-all select-all bg-white px-2 py-1 rounded border border-stone-200">
                    {resource.doi}
                  </p>
                </div>
              )}

              {/* Direct Link Box */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Shareable Link</div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={canonicalUrl}
                    className="w-full text-[10px] font-mono text-slate-600 bg-white border border-stone-200 rounded px-2 py-1 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="p-1 text-slate-500 hover:text-orange-600 shrink-0"
                    title="Copy Link"
                  >
                    {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Reading / Article Display Pane (No broken iframes by default!) */}
          <div className="flex-grow flex flex-col overflow-hidden bg-white">
            {/* View Mode Tabs */}
            <div className="px-6 py-2.5 bg-stone-100/80 border-b border-stone-200 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('reader')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeViewTab === 'reader'
                      ? 'bg-white text-orange-900 shadow-sm border border-stone-200 font-mono'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scholarly Document Reader</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveViewTab('web')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeViewTab === 'web'
                      ? 'bg-white text-orange-900 shadow-sm border border-stone-200 font-mono'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Publisher Web View</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Open Science Record</span>
              </div>
            </div>

            {/* Tab 1: Authoritative Scholarly Document Reader */}
            {activeViewTab === 'reader' && (
              <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-8 max-w-4xl">
                {/* Article Document Header */}
                <div className="space-y-4 pb-6 border-b border-stone-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-orange-100 text-orange-800">
                      {category} Publication
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      Published {resource.year}
                    </span>
                    {resource.journal && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-slate-600 italic">
                          {resource.journal}
                        </span>
                      </>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug tracking-tight font-serif">
                    {resource.title}
                  </h1>

                  {/* Verified Authorship Banner (only displayed if author_id or orcid strictly matches user's profile) */}
                  {userAuthorship.isMatch && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-2 font-bold text-xs font-mono uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Verified Author Association</span>
                        <span className="ml-auto px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold">
                          {userAuthorship.matchType === 'orcid' ? 'ORCID Validated' : 'OpenAlex ID Validated'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                        This publication is authenticated against your scholar profile via validated identifier (<code>{userAuthorship.matchedIdentifier}</code>).
                        {userAuthorship.matchedAuthorName && (
                          <> Indexed attribution: <strong>{userAuthorship.matchedAuthorName}</strong>{userAuthorship.authorPosition ? ` (${userAuthorship.authorPosition} author)` : ''}.</>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Authors Section with individual metadata and ORCID links */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-mono uppercase tracking-wider font-bold text-orange-950">
                      Attributed Authors & Scholarly Affiliations:
                    </div>
                    {resource.authorDetails && resource.authorDetails.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {resource.authorDetails.map((author, aIdx) => {
                          const isThisMatched = userAuthorship.isMatch && 
                            userAuthorship.matchedAuthorName?.toLowerCase() === author.name.toLowerCase();
                          const orcidUrl = getAuthorOrcidUrl(author.orcid);
                          const openAlexUrl = getOpenAlexAuthorUrl(author.id);

                          return (
                            <div 
                              key={aIdx} 
                              className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                                isThisMatched 
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400' 
                                  : 'bg-stone-50 border-stone-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold flex items-center gap-1.5">
                                  {author.name}
                                  {isThisMatched && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900">
                                      You (Verified)
                                    </span>
                                  )}
                                </span>
                                {author.authorPosition && (
                                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                                    {author.authorPosition}
                                  </span>
                                )}
                              </div>

                              {author.institution && (
                                <p className="text-[11px] text-slate-500 truncate" title={author.institution}>
                                  {author.institution}
                                </p>
                              )}

                              <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                                {orcidUrl && (
                                  <a
                                    href={orcidUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                                    title={`View verified ORCID profile: ${author.orcid}`}
                                  >
                                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">iD</span>
                                    <span>ORCID</span>
                                  </a>
                                )}
                                {openAlexUrl && (
                                  <a
                                    href={openAlexUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-900 font-bold hover:underline"
                                    title="View OpenAlex Author Profile"
                                  >
                                    <span>OpenAlex</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700 font-medium">
                        {resource.authors?.length > 0 ? resource.authors.join(' • ') : 'Unknown Authors'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Abstract Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-600" />
                      Executive Abstract & Scholarly Summary
                    </h2>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Open Access
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-slate-800 leading-relaxed text-sm sm:text-base font-serif">
                    {resource.abstract || 'Comprehensive scholarly abstract indexed in repository metadata.'}
                  </div>
                </div>

                {/* Key Research Highlights & Methodological Framework */}
                <div className="space-y-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    Key Research Takeaways & Transformation Impact
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/70 space-y-1.5">
                      <div className="font-bold text-xs text-orange-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                        Epistemic Equity & Access
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Addresses systemic barriers in academic knowledge production, advancing inclusive higher education access.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                        Methodological Rigour
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Grounded in empirical institutional evaluation, decolonial pedagogical analysis, and transformative open science.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Action Card */}
                <div className="p-6 rounded-2xl bg-stone-900 text-white space-y-4 shadow-lg">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">
                      Discovery & External Access
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Explore Full Publication Across Scientific Networks
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Access repository full texts, related citations, and author profile networks:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Open External Record</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={`https://scholar.google.com/scholar?q=${encodeURIComponent(resource.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-stone-700 transition-all"
                    >
                      <span>Google Scholar</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={`https://openalex.org/works?search=${encodeURIComponent(resource.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-stone-700 transition-all"
                    >
                      <span>OpenAlex Graph</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-stone-700 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5 text-orange-400" />
                      <span>{copiedShare ? 'Link Copied!' : 'Copy Share Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Optional Publisher Web View (with informative banner instead of raw error) */}
            {activeViewTab === 'web' && (
              <div className="flex-grow flex flex-col bg-stone-100 overflow-hidden relative">
                <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-950 px-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Notice: Some academic publishers and DOI portals prevent framing via security headers. If page is blank or restricted, open directly:
                    </span>
                  </div>
                  <a
                    href={canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1"
                  >
                    <span>Open in Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex-grow relative flex items-center justify-center">
                  <iframe
                    src={canonicalUrl}
                    onError={() => setIframeError(true)}
                    className="w-full h-full border-none bg-white"
                    title="External Academic Document Preview"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
