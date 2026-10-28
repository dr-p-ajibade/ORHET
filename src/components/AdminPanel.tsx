import { useState, FormEvent } from 'react';
import { 
  Plus, Trash2, Newspaper, GraduationCap, Upload, 
  FileText, Image as ImageIcon, Video, Calendar, AlertCircle, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BlogPost, TrainingSession, User as UserType } from '../types';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface AdminPanelProps {
  user: UserType | null;
  blogPosts: BlogPost[];
  trainingSessions: TrainingSession[];
  onHandleFirestoreError: (error: unknown, op: any, path: string) => void;
  onOpenUploadBlog?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenSettings?: () => void;
}

export default function AdminPanel({
  user,
  blogPosts,
  trainingSessions,
  onHandleFirestoreError,
  onOpenUploadBlog,
  onOpenAdminLogin,
  onOpenSettings,
}: AdminPanelProps) {
  const [showAddBlog, setShowAddBlog] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'blog' | 'training' } | null>(null);

  const [newBlog, setNewBlog] = useState<{
    title: string;
    excerpt: string;
    content: string;
    author: string;
    image: string;
    status: 'draft' | 'published';
  }>({
    title: '',
    excerpt: '',
    content: '',
    author: user?.name || 'Dr P Ajibade (PhD)',
    image: 'https://picsum.photos/seed/highered/800/400',
    status: 'published',
  });

  const [newTraining, setNewTraining] = useState<{
    title: string;
    description: string;
    date: string;
    time: string;
    capacity: number;
    meetLink: string;
    isPotential: boolean;
    topicCategory: string;
    googleFormUrl: string;
  }>({
    title: '',
    description: '',
    date: '',
    time: '',
    capacity: 25,
    meetLink: 'https://meet.google.com/new',
    isPotential: false,
    topicCategory: 'Institutional Leadership & Digital Transformation',
    googleFormUrl: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert('Image size exceeds 800KB. Please select a smaller image or use an image URL.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBlog(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDraftUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const title = lines[0]?.trim() || '';
        const content = lines.slice(1).join('\n').trim();
        setNewBlog(prev => ({ 
          ...prev, 
          title: title || prev.title, 
          content: content || prev.content,
          excerpt: content.slice(0, 160) + '...'
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleAddBlog = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'blog_posts'), {
        ...newBlog,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        createdAt: serverTimestamp()
      });
      setNewBlog({
        title: '',
        excerpt: '',
        content: '',
        author: user?.name || 'Dr P Ajibade (PhD)',
        image: 'https://picsum.photos/seed/highered/800/400',
        status: 'published',
      });
      setShowAddBlog(false);
    } catch (err) {
      onHandleFirestoreError(err, 'create', 'blog_posts');
    }
  };

  const handleAddTraining = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'training_sessions'), {
        ...newTraining,
        status: newTraining.isPotential ? 'potential' : 'confirmed',
        registeredCount: 0,
        createdAt: serverTimestamp()
      });
      setNewTraining({
        title: '',
        description: '',
        date: '',
        time: '',
        capacity: 25,
        meetLink: 'https://meet.google.com/new',
        isPotential: false,
        topicCategory: 'Institutional Leadership & Digital Transformation',
        googleFormUrl: '',
      });
      setShowAddTraining(false);
    } catch (err) {
      onHandleFirestoreError(err, 'create', 'training_sessions');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
      setDeleteConfirm(null);
    } catch (err) {
      onHandleFirestoreError(err, 'delete', `blog_posts/${id}`);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'training_sessions', id));
      setDeleteConfirm(null);
    } catch (err) {
      onHandleFirestoreError(err, 'delete', `training_sessions/${id}`);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-20 text-center space-y-5 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border border-red-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Administrator Access Required</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            This area is restricted to editorial leaders and platform administrators. Please sign in with your authorized administrative credentials to manage platform articles and workshops.
          </p>
        </div>
        {onOpenAdminLogin && (
          <button
            onClick={onOpenAdminLogin}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all"
          >
            Log In as Administrator
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Administration Console
          </h1>
          <p className="text-slate-600 text-sm">
            Publish academic essays, schedule training cohorts, and configure Google Meet virtual rooms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => onOpenUploadBlog ? onOpenUploadBlog() : setShowAddBlog(true)}
            className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-orange-600/20 text-xs uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" /> Upload Article
          </button>
          <button 
            onClick={() => setShowAddTraining(true)}
            className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 rounded-xl font-bold flex items-center gap-2 text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Training
          </button>
          {onOpenSettings && (
            <button 
              onClick={onOpenSettings}
              className="px-4 py-3 bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 rounded-xl font-bold flex items-center gap-2 text-xs uppercase tracking-wider transition-all shadow-sm"
              title="Platform Settings"
            >
              Site Settings
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Blog Post Management */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-orange-600" />
              Manage Blog Posts ({blogPosts.length})
            </h2>
          </div>

          <div className="space-y-3">
            {blogPosts.map((post) => (
              <div 
                key={post.id} 
                className="glass-card p-4 flex items-center justify-between gap-4 hover:border-orange-500/30 transition-all bg-white"
              >
                <div className="truncate pr-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold text-sm truncate">{post.title}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                      post.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs font-mono">{post.date} • {post.author}</div>
                </div>

                <button 
                  onClick={() => setDeleteConfirm({ id: post.id, type: 'blog' })} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Training Session Management */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-600" />
              Manage Training Sessions ({trainingSessions.length})
            </h2>
          </div>

          <div className="space-y-3">
            {trainingSessions.map((session) => {
              const isPot = session.isPotential || session.status === 'potential';
              return (
                <div 
                  key={session.id} 
                  className="glass-card p-4 flex items-center justify-between gap-4 hover:border-orange-500/30 transition-all bg-white"
                >
                  <div className="truncate pr-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-bold text-sm truncate">{session.title}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                        isPot 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isPot ? 'Proposed Future' : 'Confirmed'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs font-mono flex flex-wrap items-center gap-2">
                      <span>{session.date} • {session.time}</span>
                      <span>• {session.registeredCount}/{session.capacity} enrolled</span>
                      {session.googleFormUrl && (
                        <span className="text-emerald-700 font-bold">• Google Form Linked</span>
                      )}
                    </div>
                    {session.meetLink && (
                      <div className="text-orange-700 text-[11px] truncate flex items-center gap-1 font-mono">
                        <Video className="w-3 h-3" />
                        {session.meetLink}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setDeleteConfirm({ id: session.id, type: 'training' })} 
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Delete Training Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Blog Post Modal */}
      <AnimatePresence>
        {showAddBlog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddBlog(false)} 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Blog Post</h3>
                <button onClick={() => setShowAddBlog(false)} className="p-2 text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBlog} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-grow">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Title *</label>
                    <input 
                      required 
                      placeholder="Blog Post Title" 
                      value={newBlog.title} 
                      onChange={e => setNewBlog({...newBlog, title: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Status</label>
                    <select 
                      value={newBlog.status} 
                      onChange={e => setNewBlog({...newBlog, status: e.target.value as 'draft' | 'published'})}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Author</label>
                    <input 
                      required 
                      placeholder="Author Name" 
                      value={newBlog.author} 
                      onChange={e => setNewBlog({...newBlog, author: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Import Draft (.txt/.md)</label>
                    <div className="relative">
                      <input type="file" accept=".txt,.md" onChange={handleDraftUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-600 flex items-center justify-center gap-2 text-xs font-bold hover:bg-stone-100">
                        <FileText className="w-4 h-4 text-orange-600" /> Choose File
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Cover Image URL</label>
                  <input 
                    placeholder="https://picsum.photos/..." 
                    value={newBlog.image} 
                    onChange={e => setNewBlog({...newBlog, image: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Excerpt *</label>
                  <textarea 
                    required 
                    placeholder="Brief summary of the article..." 
                    value={newBlog.excerpt} 
                    onChange={e => setNewBlog({...newBlog, excerpt: e.target.value})} 
                    rows={2}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Article Content *</label>
                  <textarea 
                    required 
                    placeholder="Write the full scholarly essay or research findings..." 
                    value={newBlog.content} 
                    onChange={e => setNewBlog({...newBlog, content: e.target.value})} 
                    rows={6}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-md shadow-orange-600/20 transition-all"
                >
                  {newBlog.status === 'published' ? 'Publish Article' : 'Save as Draft'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Training Modal */}
      <AnimatePresence>
        {showAddTraining && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddTraining(false)} 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Training Session</h3>
                <button onClick={() => setShowAddTraining(false)} className="p-2 text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTraining} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Title *</label>
                  <input 
                    required 
                    placeholder="e.g. Higher Ed Transformation Workshop" 
                    value={newTraining.title} 
                    onChange={e => setNewTraining({...newTraining, title: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Description *</label>
                  <textarea 
                    required 
                    placeholder="Workshop objectives and key focus areas..." 
                    value={newTraining.description} 
                    onChange={e => setNewTraining({...newTraining, description: e.target.value})} 
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Date (YYYY-MM-DD) *</label>
                    <input 
                      required 
                      type="date" 
                      value={newTraining.date} 
                      onChange={e => setNewTraining({...newTraining, date: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Time Range *</label>
                    <input 
                      required 
                      placeholder="e.g. 10:00 AM - 3:00 PM" 
                      value={newTraining.time} 
                      onChange={e => setNewTraining({...newTraining, time: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Participant Capacity *</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      placeholder="Capacity" 
                      value={newTraining.capacity} 
                      onChange={e => setNewTraining({...newTraining, capacity: parseInt(e.target.value) || 20})} 
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Google Meet Link</label>
                    <input 
                      placeholder="https://meet.google.com/..." 
                      value={newTraining.meetLink} 
                      onChange={e => setNewTraining({...newTraining, meetLink: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm" 
                    />
                  </div>
                </div>

                {/* Potential Future Training Toggle & Topic Category */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPotentialCheckbox"
                      checked={newTraining.isPotential}
                      onChange={e => setNewTraining({...newTraining, isPotential: e.target.checked})}
                      className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                    />
                    <label htmlFor="isPotentialCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Mark as Potential Future Training / Proposed Cohort (Tentative Date)
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-bold">
                      Topic Category
                    </label>
                    <input
                      placeholder="e.g. Open Science, AI Integration, Leadership"
                      value={newTraining.topicCategory}
                      onChange={e => setNewTraining({...newTraining, topicCategory: e.target.value})}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-bold">
                      Custom Google Form URL (Optional)
                    </label>
                    <input
                      placeholder="https://docs.google.com/forms/d/e/.../viewform"
                      value={newTraining.googleFormUrl}
                      onChange={e => setNewTraining({...newTraining, googleFormUrl: e.target.value})}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      If provided, trainee info and training title/date will prefill into this form.
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-md shadow-orange-600/20 transition-all"
                >
                  Create Workshop Session
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeleteConfirm(null)} 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-8 text-center shadow-2xl space-y-6 z-10"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-200 text-red-600">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-slate-600 text-sm">
                  Are you sure you want to permanently delete this {deleteConfirm.type === 'blog' ? 'blog post' : 'training session'}?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl font-bold transition-all border border-stone-200 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteConfirm.type === 'blog' ? handleDeleteBlog(deleteConfirm.id) : handleDeleteTraining(deleteConfirm.id)} 
                  className="py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-md shadow-red-600/20 text-xs uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
