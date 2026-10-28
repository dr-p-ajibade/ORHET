import { useState } from 'react';
import { 
  X, ExternalLink, Bookmark, ShieldAlert, BookOpen, 
  Share2, Check, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResult, User as UserType } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
  const [iframeError, setIframeError] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!resource) return null;

  const isBookmarked = !!user?.bookmarks?.some(b => b.id === resource.id);

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

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl h-[92vh] bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
      >
        {/* Top Header */}
        <div className="p-4 md:px-6 md:py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 truncate min-w-0">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0 ${
              resource.source === 'OpenAlex' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              resource.source === 'CrossRef' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {resource.source}
            </span>
            <span className="text-slate-900 font-bold text-sm truncate">{resource.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleBookmark}
              className={`p-2.5 rounded-xl border transition-all ${
                isBookmarked 
                  ? 'bg-amber-50 border-amber-300 text-amber-700' 
                  : 'bg-white border-stone-200 text-slate-500 hover:text-slate-900 hover:bg-stone-100'
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-white hover:bg-stone-100 text-slate-500 hover:text-slate-900 border border-stone-200 transition-all"
              title="Copy Publication URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20 uppercase tracking-wider"
            >
              <span>External</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white hover:bg-stone-100 text-slate-500 hover:text-slate-900 border border-stone-200 transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
          {/* Metadata Sidebar */}
          <div className="w-full md:w-80 p-6 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 overflow-y-auto space-y-6 shrink-0">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Publication Title</div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">{resource.title}</h2>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Authors</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {resource.authors?.length > 0 ? resource.authors.join(', ') : 'Unspecified Authors'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Year</div>
                <div className="text-xs font-bold text-slate-900">{resource.year}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Database</div>
                <div className="text-xs font-bold text-orange-700">{resource.source}</div>
              </div>
            </div>

            {resource.journal && (
              <div className="space-y-1 pt-2 border-t border-stone-200">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Journal / Publisher</div>
                <p className="text-xs text-slate-700">{resource.journal}</p>
              </div>
            )}

            {resource.doi && (
              <div className="space-y-1 pt-2 border-t border-stone-200">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">DOI</div>
                <p className="text-[11px] font-mono text-slate-600 break-all">{resource.doi}</p>
              </div>
            )}

            {resource.abstract && (
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Abstract / Summary</div>
                <p className="text-xs text-slate-600 leading-relaxed max-h-60 overflow-y-auto pr-1">
                  {resource.abstract}
                </p>
              </div>
            )}
          </div>

          {/* Iframe Preview or Fallback */}
          <div className="flex-grow bg-stone-100 relative flex items-center justify-center overflow-hidden">
            {iframeError ? (
              <div className="p-8 text-center max-w-md space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Direct Preview Restricted</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Academic publishers often restrict in-browser iframe embedding via security headers (X-Frame-Options / CSP).
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-600/20"
                >
                  <BookOpen className="w-4 h-4" />
                  Open in New Tab
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <iframe
                src={resource.url}
                onError={() => setIframeError(true)}
                className="w-full h-full border-none bg-white"
                title="Academic Document Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
