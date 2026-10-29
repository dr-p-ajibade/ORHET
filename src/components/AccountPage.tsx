import { useState } from 'react';
import { 
  User as UserIcon, Calendar, Bookmark, Mail, MapPin, 
  ExternalLink, Trash2, Edit3, CheckCircle2, 
  Globe, BookOpen, Clock, Building, Award, 
  X, Check, AlertCircle, Video, FileDown, Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, TrainingSession, SearchResult } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { exportArticleToPDF, exportArticleListToPDF } from '../utils/pdfExport';

interface AccountPageProps {
  user: UserType | null;
  trainingSessions: TrainingSession[];
  onOpenResource: (resource: SearchResult) => void;
  onNavigateToArchive: () => void;
  onNavigateToTraining: () => void;
  onOpenAuth: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
  onHandleFirestoreError: (error: unknown, op: any, path: string) => void;
}

export default function AccountPage({
  user,
  trainingSessions,
  onOpenResource,
  onNavigateToArchive,
  onNavigateToTraining,
  onOpenAuth,
  onUpdateUser,
  onHandleFirestoreError,
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<'trainings' | 'bookmarks' | 'profile'>('trainings');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editTitle, setEditTitle] = useState(user?.academicTitle || '');
  const [editAffiliation, setEditAffiliation] = useState(user?.affiliation || '');
  const [editDepartment, setEditDepartment] = useState(user?.department || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cancelModalSession, setCancelModalSession] = useState<TrainingSession | null>(null);
  const [removeBookmarkItem, setRemoveBookmarkItem] = useState<SearchResult | null>(null);

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 bg-orange-50 border border-orange-200 rounded-3xl flex items-center justify-center mx-auto text-orange-600 shadow-md">
          <UserIcon className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Scholar Account</h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Please sign in to access your registered training workshops, bookmarked research publications, and personal scholar profile.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold transition-all shadow-md shadow-orange-600/20 uppercase tracking-widest text-xs"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // Filter registered trainings
  const registeredSessions = trainingSessions.filter(session => 
    user.registeredTrainings?.includes(session.id)
  );

  const bookmarksList = user.bookmarks || [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    try {
      const updatedData: Partial<UserType> = {
        name: editName.trim() || user.name,
        academicTitle: editTitle.trim(),
        affiliation: editAffiliation.trim(),
        department: editDepartment.trim(),
        bio: editBio.trim()
      };

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      
      const newUserData = { ...user, ...updatedData };
      onUpdateUser(newUserData);
      setSavingProfile(false);
      setIsEditingProfile(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSavingProfile(false);
      onHandleFirestoreError(err, 'update', `users/${user.uid}`);
    }
  };

  const handleCancelRegistration = async (sessionId: string) => {
    if (!user) return;
    try {
      const session = trainingSessions.find(s => s.id === sessionId);
      const newRegisteredCount = Math.max(0, (session?.registeredCount || 1) - 1);
      
      await updateDoc(doc(db, 'training_sessions', sessionId), {
        registeredCount: newRegisteredCount
      });

      const updatedTrainings = user.registeredTrainings.filter(id => id !== sessionId);
      await updateDoc(doc(db, 'users', user.uid), {
        registeredTrainings: updatedTrainings
      });

      onUpdateUser({ ...user, registeredTrainings: updatedTrainings });
      setCancelModalSession(null);
    } catch (err) {
      onHandleFirestoreError(err, 'update', `training_sessions/${sessionId}`);
    }
  };

  const handleRemoveBookmark = async (articleId: string) => {
    if (!user) return;
    try {
      const updatedBookmarks = (user.bookmarks || []).filter(b => b.id !== articleId);
      await updateDoc(doc(db, 'users', user.uid), {
        bookmarks: updatedBookmarks
      });
      onUpdateUser({ ...user, bookmarks: updatedBookmarks });
      setRemoveBookmarkItem(null);
    } catch (err) {
      onHandleFirestoreError(err, 'update', `users/${user.uid}`);
    }
  };

  return (
    <div className="py-8 space-y-10 max-w-6xl mx-auto">
      {/* Profile Overview Card */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-orange-600 to-amber-700 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white shadow-sm border border-white">
                {user.role}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {user.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-600" />
                  {user.email}
                </span>
                {user.academicTitle && (
                  <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    {user.academicTitle}
                  </span>
                )}
                {user.affiliation && (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-orange-600" />
                    {user.affiliation} {user.department ? `• ${user.department}` : ''}
                  </span>
                )}
              </div>

              {user.bio && (
                <p className="text-slate-600 text-sm max-w-2xl leading-relaxed pt-1">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setEditName(user.name);
                setEditTitle(user.academicTitle || '');
                setEditAffiliation(user.affiliation || '');
                setEditDepartment(user.department || '');
                setEditBio(user.bio || '');
                setIsEditingProfile(true);
              }}
              className="px-5 py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-slate-800 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm"
            >
              <Edit3 className="w-4 h-4 text-orange-600" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-stone-200">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Trainings Booked
            </div>
            <div className="text-2xl font-black text-slate-900">{registeredSessions.length}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-bold">
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              Bookmarked Articles
            </div>
            <div className="text-2xl font-black text-slate-900">{bookmarksList.length}</div>
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-bold">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Scholar Status
            </div>
            <div className="text-sm font-bold text-emerald-700">Active Member</div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('trainings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'trainings'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Registered Trainings
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-white/20 font-mono">
            {registeredSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Bookmarked Articles
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-white/20 font-mono">
            {bookmarksList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'profile'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Personal Details
        </button>
      </div>

      {/* Tab 1: Registered Trainings */}
      {activeTab === 'trainings' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Training Sessions</h2>
              <p className="text-slate-600 text-sm">Direct access to your scheduled workshops and Google Meet virtual classrooms.</p>
            </div>
            <button
              onClick={onNavigateToTraining}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-orange-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Browse All Trainings
            </button>
          </div>

          {registeredSessions.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {registeredSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="glass-card p-6 md:p-8 flex flex-col justify-between space-y-6 relative group hover:border-orange-500/40 transition-all bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-orange-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-1">
                          Confirmed Seat
                        </span>
                        <div className="text-slate-900 font-bold text-sm">{session.date}</div>
                        <div className="text-slate-500 text-xs">{session.time}</div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                      {session.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed">
                      {session.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-200">
                    {session.meetLink ? (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        <Video className="w-4 h-4" />
                        Join Google Meet Room
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    ) : (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-slate-500">
                        Meeting link will be shared closer to the workshop date
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Capacity: {session.registeredCount} / {session.capacity} enrolled
                      </span>
                      <button
                        onClick={() => setCancelModalSession(session)}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline font-bold transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card cultural-watermark-card p-12 text-center space-y-4 max-w-xl mx-auto border border-stone-200 bg-white">
              <div className="w-16 h-16 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Registered Training Sessions</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                You have not enrolled in any professional development workshops yet. Explore upcoming training sessions for June, August, October, and November.
              </p>
              <button
                onClick={onNavigateToTraining}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-orange-600/20"
              >
                Browse & Book Workshops
              </button>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Bookmarked Research Articles */}
      {activeTab === 'bookmarks' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bookmarked Research Articles</h2>
              <p className="text-slate-600 text-sm">Saved publications from OpenAlex, CrossRef, and CORE in your scholar library.</p>
            </div>
            <div className="flex items-center gap-2">
              {bookmarksList.length > 0 && (
                <button
                  onClick={() => exportArticleListToPDF(bookmarksList, `${user.name || 'Scholar'} - Saved Research Library`, 'Personal Bookmarks')}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
                  title="Export all saved bookmarks to PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Library as PDF ({bookmarksList.length})</span>
                </button>
              )}
              <button
                onClick={onNavigateToArchive}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-orange-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Search Research Archive
              </button>
            </div>
          </div>

          {bookmarksList.length > 0 ? (
            <div className="space-y-4">
              {bookmarksList.map((article) => (
                <div
                  key={article.id}
                  className="glass-card p-6 hover:border-orange-500/40 transition-all space-y-4 group bg-white shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                          article.source === 'OpenAlex' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          article.source === 'CrossRef' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {article.source}
                        </span>
                        <span className="text-slate-500 text-xs font-bold">{article.year}</span>
                        {article.journal && (
                          <span className="text-slate-500 text-xs">• {article.journal}</span>
                        )}
                      </div>

                      <h3 
                        onClick={() => onOpenResource(article)}
                        className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors cursor-pointer leading-snug"
                      >
                        {article.title}
                      </h3>

                      <p className="text-slate-500 text-xs font-medium">
                        {article.authors?.join(', ') || 'Unknown Authors'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => exportArticleToPDF(article)}
                        className="p-2.5 bg-stone-100 hover:bg-orange-50 text-slate-600 hover:text-orange-900 border border-stone-200 hover:border-orange-300 rounded-xl transition-all"
                        title="Download as PDF Brief"
                      >
                        <FileDown className="w-4 h-4 text-orange-600" />
                      </button>

                      <button
                        onClick={() => onOpenResource(article)}
                        className="px-4 py-2 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Read Article
                      </button>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-slate-900 border border-stone-200 rounded-xl transition-all"
                        title="Open Source Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => setRemoveBookmarkItem(article)}
                        className="p-2.5 bg-stone-100 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-stone-200 rounded-xl transition-all"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {article.abstract && (
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                      {article.abstract}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card cultural-watermark-card p-12 text-center space-y-4 max-w-xl mx-auto border border-stone-200 bg-white">
              <div className="w-16 h-16 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Bookmarked Articles Yet</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                As you explore research databases like OpenAlex, CrossRef, and CORE in the Research Archive, click the bookmark icon on any paper to save it to your library.
              </p>
              <button
                onClick={onNavigateToArchive}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-orange-600/20"
              >
                Search Research Archive
              </button>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Personal Details */}
      {activeTab === 'profile' && (
        <section className="glass-panel p-8 md:p-10 space-y-8 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Personal Details & Affiliation</h2>
              <p className="text-slate-600 text-sm">Manage your academic identity, institution information, and research bio.</p>
            </div>
            {!isEditingProfile && (
              <button
                onClick={() => {
                  setEditName(user.name);
                  setEditTitle(user.academicTitle || '');
                  setEditAffiliation(user.affiliation || '');
                  setEditDepartment(user.department || '');
                  setEditBio(user.bio || '');
                  setIsEditingProfile(true);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-orange-600/20"
              >
                Edit Information
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Academic Title / Designation
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Associate Professor, Ph.D. Candidate"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Institution / University
                  </label>
                  <input
                    type="text"
                    value={editAffiliation}
                    onChange={(e) => setEditAffiliation(e.target.value)}
                    placeholder="e.g. Oxford University"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Department / Faculty
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="e.g. Faculty of Education"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Academic Bio & Research Interests
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  placeholder="Share a brief overview of your academic background and current research interests..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-md shadow-orange-600/20"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border border-stone-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-bold">Full Name</div>
                  <div className="text-lg font-bold text-slate-900">{user.name}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-bold">Account Email</div>
                  <div className="text-base text-slate-700 font-medium">{user.email}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-bold">Academic Role</div>
                  <div className="inline-block px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-bold">Academic Title</div>
                  <div className="text-base text-slate-900">{user.academicTitle || <span className="text-slate-400 italic">Not set</span>}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-bold">Affiliation & Department</div>
                  <div className="text-base text-slate-900">
                    {user.affiliation ? `${user.affiliation}${user.department ? ` (${user.department})` : ''}` : <span className="text-slate-400 italic">Not set</span>}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 font-bold">Bio / Research Interests</div>
                  <div className="text-sm text-slate-600 leading-relaxed">
                    {user.bio || <span className="text-slate-400 italic">No bio provided yet. Click "Edit Information" to introduce your research focus.</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Confirmation Modal: Cancel Training */}
      <AnimatePresence>
        {cancelModalSession && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelModalSession(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-200 text-red-600">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Cancel Registration?</h3>
                <p className="text-slate-600 text-sm">
                  Are you sure you want to cancel your seat for <strong className="text-slate-900">{cancelModalSession.title}</strong>? Your place will be released for other scholars.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCancelModalSession(null)}
                  className="py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl font-bold transition-all border border-stone-200 text-xs uppercase tracking-wider"
                >
                  Keep Seat
                </button>
                <button
                  onClick={() => handleCancelRegistration(cancelModalSession.id)}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-md shadow-red-600/20 text-xs uppercase tracking-wider"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal: Remove Bookmark */}
      <AnimatePresence>
        {removeBookmarkItem && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRemoveBookmarkItem(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10"
            >
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 text-amber-600">
                <Bookmark className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Remove Bookmark</h3>
                <p className="text-slate-600 text-sm">
                  Remove <strong className="text-slate-900 line-clamp-1">{removeBookmarkItem.title}</strong> from your bookmarked research library?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRemoveBookmarkItem(null)}
                  className="py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl font-bold transition-all border border-stone-200 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveBookmark(removeBookmarkItem.id)}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-md shadow-red-600/20 text-xs uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-emerald-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            Profile details updated successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
