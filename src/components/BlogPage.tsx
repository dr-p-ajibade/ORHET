import { useState, useMemo } from 'react';
import { BlogPost, User as UserType } from '../types';
import { 
  Newspaper, ArrowRight, Calendar, User as UserIcon, 
  Clock, X, Share2, BookOpen, Check, Quote, GraduationCap,
  Sparkles, ExternalLink, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlogPageProps {
  blogPosts: BlogPost[];
  user: UserType | null;
  onOpenUploadBlog?: () => void;
  onOpenAdminLogin?: () => void;
}

export default function BlogPage({ 
  blogPosts, 
  user,
  onOpenUploadBlog,
  onOpenAdminLogin,
}: BlogPageProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  const isAdmin = user?.role === 'admin';

  const displayPosts = useMemo(() => {
    if (user?.role === 'admin') return blogPosts;
    return blogPosts.filter(post => post.status === 'published');
  }, [blogPosts, user]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCitation = (post: BlogPost) => {
    const citation = `Ajibade, P. (${post.date.includes('2026') ? '2026' : '2026'}). ${post.title}. ARHET Research & Higher Education Transformation. Retrieved from https://arhet.org/blog/${post.id}`;
    navigator.clipboard?.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(3, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-mono uppercase tracking-widest font-bold shadow-sm">
          <GraduationCap className="w-4 h-4 text-orange-600" />
          Academic Perspectives & Thought Leadership
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Scholarly Blog & Essays
        </h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed">
          Critical research essays, systemic policy analyses, and open scholarship commentary authored by <strong className="text-slate-900 font-bold">Dr P Ajibade (PhD)</strong> to drive transformation in global higher education.
        </p>
      </div>

      {/* Featured Author Profile Banner & Editorial Controls */}
      <div className="glass-card p-6 md:p-8 bg-white border border-stone-200 shadow-sm rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
            PA
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Dr P Ajibade (PhD)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                Senior Scholar & Research Lead
              </span>
            </div>
            <p className="text-slate-600 text-xs md:text-sm max-w-xl leading-relaxed">
              Specialist in Information Systems, Epistemic Justice, Open Science Frameworks, and Contextual Digital Pedagogy in Higher Education.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isAdmin ? (
            <button
              onClick={onOpenUploadBlog}
              className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-600/20 transition-all flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4" />
              Upload New Article
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
              title="Editorial Log In for Dr P Ajibade"
            >
              <GraduationCap className="w-4 h-4 text-orange-400" />
              Admin: Log In to Upload
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <div className="text-center px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200">
              <span className="block text-sm font-bold text-slate-900">{displayPosts.length}</span>
              <span className="text-[10px]">Essays</span>
            </div>
            <div className="text-center px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200">
              <span className="block text-sm font-bold text-orange-600">Open Access</span>
              <span className="text-[10px]">Framework</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Cards Grid */}
      <div className="grid gap-8">
        {displayPosts.length > 0 ? (
          displayPosts.map((post) => (
            <article 
              key={post.id} 
              className="glass-card p-6 md:p-8 grid md:grid-cols-12 gap-8 items-center group hover:border-orange-500/50 transition-all cursor-pointer bg-white shadow-sm hover:shadow-xl rounded-3xl"
              onClick={() => setSelectedPost(post)}
            >
              <div className="md:col-span-5 aspect-[16/10] rounded-2xl overflow-hidden border border-stone-200 relative bg-stone-100 shadow-inner">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                {post.status === 'draft' && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md font-mono">
                    Draft Preview
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-mono font-bold rounded-lg border border-stone-200">
                  {calculateReadTime(post.content)}
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-orange-700">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <UserIcon className="w-3.5 h-3.5 text-orange-600" />
                    {post.author}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">
                  {post.title}
                </h2>

                <p className="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                  <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold group/btn text-xs md:text-sm uppercase tracking-wider">
                    Read Complete Scholarly Essay
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                  </button>
                  <span className="text-xs text-slate-400 font-mono">Peer-Reviewed Perspective</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="glass-card cultural-watermark-card p-16 text-center text-slate-500 space-y-3 bg-white">
            <Newspaper className="w-10 h-10 mx-auto text-orange-600" />
            <h3 className="text-xl font-bold text-slate-900">No Blog Posts Published Yet</h3>
            <p className="text-sm text-slate-600">Check back soon for new research essays and transformational commentary.</p>
          </div>
        )}
      </div>

      {/* Full Article Reader Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#faf8f5] border border-stone-200 rounded-3xl p-6 md:p-12 shadow-2xl space-y-8 z-10 text-slate-900"
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-slate-500 hover:text-slate-900 transition-all shadow-sm"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Article Header */}
              <div className="space-y-4 pr-12">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-orange-700 uppercase tracking-widest font-mono">
                  <span>{selectedPost.date}</span>
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                  <span>Author: {selectedPost.author}</span>
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                  <span className="text-slate-500">{calculateReadTime(selectedPost.content)}</span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                  {selectedPost.title}
                </h1>

                {/* Author Metadata Chip */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    PA
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Authored by {selectedPost.author}</div>
                    <div className="text-xs text-slate-500">Research & Higher Education Transformation Scholar</div>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Academic Excerpt Callout */}
              <div className="bg-white p-6 rounded-2xl border-l-4 border-orange-600 shadow-sm space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-orange-700 font-bold flex items-center gap-1.5">
                  <Quote className="w-4 h-4" />
                  Executive Summary / Abstract
                </div>
                <p className="text-slate-800 text-base md:text-lg leading-relaxed italic">
                  "{selectedPost.excerpt}"
                </p>
              </div>

              {/* Article Structured Body */}
              <div className="bg-white p-8 md:p-10 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-slate-800 text-base md:text-lg leading-loose font-serif">
                {selectedPost.content.split('\n\n').map((paragraph, index) => {
                  const trimmed = paragraph.trim();
                  // Check if this looks like a section header (e.g. Abstract, 1. ..., References)
                  if (/^(Abstract|[0-9]+\.\s+|Conclusion|References)/.test(trimmed)) {
                    return (
                      <div key={index} className="pt-4 pb-1">
                        <h3 className="font-sans font-black text-2xl text-slate-900 border-b border-stone-200 pb-2">
                          {trimmed}
                        </h3>
                      </div>
                    );
                  }
                  // Check if bullet items
                  if (trimmed.startsWith('- ') || trimmed.startsWith('a) ') || trimmed.startsWith('b) ') || trimmed.startsWith('c) ') || trimmed.startsWith('d) ')) {
                    return (
                      <div key={index} className="pl-4 border-l-2 border-orange-200 font-sans text-base text-slate-700 leading-relaxed py-1">
                        {trimmed}
                      </div>
                    );
                  }
                  return (
                    <p key={index} className="leading-relaxed text-slate-700 font-sans">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* Citation & Action Footer */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Academic Citation Reference (APA 7th)
                    </span>
                    <p className="text-xs font-mono text-slate-700 bg-stone-50 p-3 rounded-xl border border-stone-200 select-all">
                      Ajibade, P. (2026). {selectedPost.title}. <em>ARHET Academic Repository & Higher Education Transformation</em>.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyCitation(selectedPost)}
                    className="shrink-0 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    {copiedCitation ? <Check className="w-4 h-4 text-emerald-600" /> : <Quote className="w-4 h-4 text-orange-600" />}
                    {copiedCitation ? 'Citation Copied!' : 'Copy APA Citation'}
                  </button>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono">
                    Permanent Academic Artifact • Published by Dr P Ajibade (PhD)
                  </div>
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-stone-200 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-orange-600" />}
                    {copiedLink ? 'Link Copied!' : 'Share Article'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
