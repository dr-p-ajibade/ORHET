import { useState, useEffect, Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  SearchResult, BlogPost, TrainingSession, User as UserType 
} from './types';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';

import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ArchivePage from './components/ArchivePage';
import TrainingPage from './components/TrainingPage';
import BlogPage from './components/BlogPage';
import AccountPage from './components/AccountPage';
import AdminPanel from './components/AdminPanel';
import ResourceViewer from './components/ResourceViewer';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import AdminLoginModal from './components/AdminLoginModal';
import UploadBlogModal from './components/UploadBlogModal';
import { PERMANENT_BLOGS } from './data/permanentBlogs';
import { DEFAULT_TRAINING_SESSIONS } from './data/defaultTrainings';

// --- Error Handling & Diagnostics ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        if (parsed.error) errorMessage = `Firestore Error: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Application Notice</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-500 transition-colors text-xs uppercase tracking-wider shadow-lg shadow-orange-600/20"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App Root ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'archive' | 'training' | 'blog' | 'account' | 'admin'>('landing');
  const [user, setUser] = useState<UserType | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [viewingResource, setViewingResource] = useState<SearchResult | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showUploadBlogModal, setShowUploadBlogModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [coreApiKey, setCoreApiKey] = useState(() => localStorage.getItem('core_api_key') || '');
  const [googleFormUrl, setGoogleFormUrl] = useState(
    () => localStorage.getItem('arhet_google_form_url') || 'https://docs.google.com/forms/d/e/1FAIpQLScX9_arhet_academic_training/viewform'
  );
  const [patternMode, setPatternMode] = useState<'subtle' | 'rich' | 'muted' | 'off'>(
    () => (localStorage.getItem('arhet_pattern_mode') as any) || 'subtle'
  );

  // Firestore Data Collections
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(PERMANENT_BLOGS);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(DEFAULT_TRAINING_SESSIONS);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            // Admin auto-assignment for primary owner
            if (firebaseUser.email === 'ajibadep.sa@gmail.com' && userData.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
              userData.role = 'admin';
            }
            setUser(userData);
          } else {
            const newUser: UserType = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Scholar',
              role: firebaseUser.email === 'ajibadep.sa@gmail.com' ? 'admin' : 'scholar',
              registeredTrainings: [],
              bookmarks: [],
              affiliation: '',
              academicTitle: 'Scholar',
              department: '',
              bio: '',
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Subscriptions
  useEffect(() => {
    const blogUnsubscribe = onSnapshot(
      query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
          const existingIds = new Set(docs.map(d => d.id));
          const missingPermanent = PERMANENT_BLOGS.filter(p => !existingIds.has(p.id));
          setBlogPosts([...docs, ...missingPermanent]);
        } else {
          setBlogPosts(PERMANENT_BLOGS);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'blog_posts');
        setBlogPosts(PERMANENT_BLOGS);
      }
    );

    const trainingUnsubscribe = onSnapshot(
      query(collection(db, 'training_sessions'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession));
          const existingTitles = new Set(docs.map(d => (d.title || '').trim().toLowerCase()));
          const missingDefaults = DEFAULT_TRAINING_SESSIONS.filter(s => !existingTitles.has(s.title.trim().toLowerCase()));
          setTrainingSessions([...docs, ...missingDefaults]);
        } else {
          setTrainingSessions(DEFAULT_TRAINING_SESSIONS);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'training_sessions');
        setTrainingSessions(DEFAULT_TRAINING_SESSIONS);
      }
    );

    return () => {
      blogUnsubscribe();
      trainingUnsubscribe();
    };
  }, []);

  // 3. Initial Data Seeding by Admin (June, August, October, November workshops + Permanent Dr P Ajibade Blog posts)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const seedData = async () => {
      try {
        // Seed permanent blog posts by Dr P Ajibade (PhD) into Firestore if missing
        for (const post of PERMANENT_BLOGS) {
          try {
            const postRef = doc(db, 'blog_posts', post.id);
            const postDoc = await getDoc(postRef);
            if (!postDoc.exists()) {
              await setDoc(postRef, {
                ...post,
                createdAt: serverTimestamp()
              });
            }
          } catch (postErr) {
            console.warn('Post seed check:', postErr);
          }
        }

        const trainingSnap = await getDocs(collection(db, 'training_sessions'));
        const existingTitles = new Set(trainingSnap.docs.map(d => (d.data().title || '').trim().toLowerCase()));

        for (const training of DEFAULT_TRAINING_SESSIONS) {
          if (!existingTitles.has(training.title.trim().toLowerCase())) {
            const { id: _, ...sessionData } = training;
            await addDoc(collection(db, 'training_sessions'), {
              ...sessionData,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (e) {
        console.warn('Admin seed sync skipped or offline:', e);
      }
    };

    seedData();
  }, [user]);

  const handleSignInWithGoogle = async (selectedRole: 'scholar' | 'admin') => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    if (res.user) {
      const userDocRef = doc(db, 'users', res.user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        const newUser: UserType = {
          uid: res.user.uid,
          email: res.user.email || '',
          name: res.user.displayName || 'Scholar',
          role: res.user.email === 'ajibadep.sa@gmail.com' ? 'admin' : selectedRole,
          registeredTrainings: [],
          bookmarks: [],
          affiliation: '',
          academicTitle: 'Scholar',
          department: '',
          bio: '',
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUser);
        setUser(newUser);
      } else {
        const existingData = userSnap.data() as UserType;
        if (res.user.email === 'ajibadep.sa@gmail.com' && existingData.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
          existingData.role = 'admin';
        }
        setUser(existingData);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentPage('landing');
  };

  const handleSaveApiKey = (key: string) => {
    setCoreApiKey(key);
    localStorage.setItem('core_api_key', key);
  };

  const handleSaveGoogleFormUrl = (url: string) => {
    setGoogleFormUrl(url);
    localStorage.setItem('arhet_google_form_url', url);
  };

  const handleSavePatternMode = (mode: 'subtle' | 'rich' | 'muted' | 'off') => {
    setPatternMode(mode);
    localStorage.setItem('arhet_pattern_mode', mode);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 selection:bg-orange-500 selection:text-white relative font-sans">
      {/* Cultural Heritage Adire / Batik Linework Background */}
      {patternMode !== 'off' && (
        <div 
          className={`cultural-pattern-bg ${
            patternMode === 'rich' ? 'cultural-pattern-rich' :
            patternMode === 'muted' ? 'cultural-pattern-muted' : ''
          }`}
          aria-hidden="true"
        />
      )}

      {/* Dynamic Background Atmosphere */}
      <div className="atmosphere" />

      {/* Main Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page: string) => setCurrentPage(page as any)}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        onSignOut={handleSignOut}
        onOpenSettings={() => {
          if (user?.role === 'admin') {
            setShowSettings(true);
          }
        }}
      />

      {/* Main Page View Router */}
      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigateToArchive={() => setCurrentPage('archive')}
            onNavigateToTraining={() => setCurrentPage('training')}
            onNavigateToBlog={() => setCurrentPage('blog')}
          />
        )}

        {currentPage === 'archive' && (
          <ArchivePage
            user={user}
            coreApiKey={coreApiKey}
            onOpenResource={(res) => setViewingResource(res)}
            onOpenAuth={() => setShowAuthModal(true)}
            onUpdateUser={(updated) => setUser(updated)}
            onHandleFirestoreError={(err, op, p) => handleFirestoreError(err, op, p)}
          />
        )}

        {currentPage === 'training' && (
          <TrainingPage
            user={user}
            trainingSessions={trainingSessions}
            onOpenAuth={() => setShowAuthModal(true)}
            onUpdateUser={(updated) => setUser(updated)}
            onNavigateToAccount={() => setCurrentPage('account')}
            onHandleFirestoreError={(err, op, p) => handleFirestoreError(err, op, p)}
          />
        )}

        {currentPage === 'blog' && (
          <BlogPage
            blogPosts={blogPosts}
            user={user}
            onOpenUploadBlog={() => setShowUploadBlogModal(true)}
            onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          />
        )}

        {currentPage === 'account' && (
          <AccountPage
            user={user}
            trainingSessions={trainingSessions}
            onOpenResource={(res) => setViewingResource(res)}
            onNavigateToArchive={() => setCurrentPage('archive')}
            onNavigateToTraining={() => setCurrentPage('training')}
            onOpenAuth={() => setShowAuthModal(true)}
            onUpdateUser={(updated) => setUser(updated)}
            onHandleFirestoreError={(err, op, p) => handleFirestoreError(err, op, p)}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPanel
            user={user}
            blogPosts={blogPosts}
            trainingSessions={trainingSessions}
            onHandleFirestoreError={(err, op, p) => handleFirestoreError(err, op, p)}
            onOpenUploadBlog={() => setShowUploadBlogModal(true)}
            onOpenAdminLogin={() => setShowAdminLoginModal(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </main>

      {/* Global Modals */}
      <ResourceViewer
        resource={viewingResource}
        user={user}
        onClose={() => setViewingResource(null)}
        onOpenAuth={() => setShowAuthModal(true)}
        onUpdateUser={(updated) => setUser(updated)}
        onHandleFirestoreError={(err, op, p) => handleFirestoreError(err, op, p)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignInWithGoogle={handleSignInWithGoogle}
      />

      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSuccess={() => {
          setCurrentPage('admin');
        }}
      />

      <UploadBlogModal
        isOpen={showUploadBlogModal}
        onClose={() => setShowUploadBlogModal(false)}
        user={user}
        onHandleFirestoreError={(err, op, p) => handleFirestoreError(err, op, p)}
        onPostCreated={() => {
          setCurrentPage('blog');
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isAdmin={user?.role === 'admin'}
        coreApiKey={coreApiKey}
        onSaveApiKey={handleSaveApiKey}
        patternMode={patternMode}
        onSavePatternMode={handleSavePatternMode}
        googleFormUrl={googleFormUrl}
        onSaveGoogleFormUrl={handleSaveGoogleFormUrl}
      />

      {/* Footer */}
      <footer className="border-t border-[#e8e2d8] py-10 px-4 md:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div>
          © 2026 Academic Research & Higher Education Transformation (ARHET).
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentPage('archive')} className="hover:text-orange-600 transition-colors">Archive</button>
          <button onClick={() => setCurrentPage('training')} className="hover:text-orange-600 transition-colors">Training</button>
          <button onClick={() => setCurrentPage('blog')} className="hover:text-orange-600 transition-colors">Blog</button>
          {user && (
            <button onClick={() => setCurrentPage('account')} className="hover:text-orange-600 transition-colors">My Account</button>
          )}
        </div>
      </footer>
    </div>
  );
}
