import { useState, FormEvent, ChangeEvent } from 'react';
import { 
  X, Newspaper, Upload, FileText, Image as ImageIcon, 
  Sparkles, Clock, Check, Quote, AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User as UserType } from '../types';

interface UploadBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onHandleFirestoreError: (error: unknown, op: any, path: string) => void;
  onPostCreated?: () => void;
}

const PRESET_IMAGES = [
  { label: 'Academic Library', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Higher Ed Research', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Digital Classroom', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Scholarly Architecture', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80' },
];

export default function UploadBlogModal({
  isOpen,
  onClose,
  user,
  onHandleFirestoreError,
  onPostCreated,
}: UploadBlogModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(user?.name ? `${user.name} (PhD)` : 'Dr P Ajibade (PhD)');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  if (!isOpen) return null;

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${words} words • ~${minutes} min read`;
  };

  const handleImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        setError('Image file is too large (max 800KB). Please use a preset or direct image URL.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDraftFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        const lines = text.split('\n');
        const firstLine = lines[0]?.replace(/^#+\s*/, '').trim() || '';
        const remaining = lines.slice(1).join('\n').trim();
        
        if (firstLine) setTitle(firstLine);
        if (remaining) {
          setContent(remaining);
          if (!excerpt) {
            setExcerpt(remaining.slice(0, 220).replace(/\n/g, ' ') + '...');
          }
        }
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      setError('Please provide a title, abstract/excerpt, and full article content.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      await addDoc(collection(db, 'blog_posts'), {
        title: title.trim(),
        author: author.trim() || 'Dr P Ajibade (PhD)',
        excerpt: excerpt.trim(),
        content: content.trim(),
        image: image.trim() || PRESET_IMAGES[0].url,
        status,
        date: dateString,
        createdAt: serverTimestamp(),
      });

      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      onHandleFirestoreError(err, 'create', 'blog_posts');
      setError('Failed to upload article to database. Please verify administrator permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 z-10 text-slate-900"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Upload Scholarly Article
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Admin Editorial Suite • Authored by {author}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-900 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Draft Import Banner */}
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Import from Manuscript / Notes</div>
                <div className="text-[11px] text-slate-600">Upload a .txt or .md file to automatically populate title & content.</div>
              </div>
            </div>
            <label className="relative shrink-0 cursor-pointer">
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleDraftFile}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <span className="px-3.5 py-2 bg-white hover:bg-orange-100 text-orange-700 border border-orange-300 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                Select File
              </span>
            </label>
          </div>

          {/* Title & Status */}
          <div className="grid sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-bold">
                Article Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Epistemic Justice in Global Higher Education"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-bold">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
              >
                <option value="published">Published (Public)</option>
                <option value="draft">Draft (Admin Only)</option>
              </select>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-bold">
              Scholarly Author Signature *
            </label>
            <input
              required
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
            />
          </div>

          {/* Executive Summary / Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-bold">
                Executive Abstract / Excerpt *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">1-2 sentences for reader preview</span>
            </div>
            <textarea
              required
              rows={2}
              placeholder="Concise overview of the article's core arguments and transformative findings..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none leading-relaxed"
            />
          </div>

          {/* Full Article Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-bold">
                Full Article Content *
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {calculateReadTime(content)}
              </span>
            </div>
            <textarea
              required
              rows={8}
              placeholder="Write or paste your comprehensive scholarly essay, research synthesis, or policy framework here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none leading-relaxed font-sans"
            />
          </div>

          {/* Cover Image Selector */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-bold">
                Cover Header Image
              </label>
              <label className="text-xs text-orange-700 hover:text-orange-800 font-bold flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload Custom Image
                <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImage(preset.url)}
                  className={`relative rounded-xl overflow-hidden aspect-[16/10] border-2 transition-all group ${
                    image === preset.url ? 'border-orange-600 ring-2 ring-orange-500/30' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 text-[9px] text-white py-0.5 px-1 truncate text-center">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or enter image URL (https://...)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-slate-700 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none mt-2"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-stone-200 text-slate-600 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-600/20 transition-all flex items-center gap-2"
            >
              {submitting ? 'Uploading to Repository...' : status === 'published' ? 'Publish Article Now' : 'Save Draft'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
