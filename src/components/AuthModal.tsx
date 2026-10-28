import { useState } from 'react';
import { X, LogIn, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: (role: 'admin' | 'scholar') => Promise<void>;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSignInWithGoogle,
}: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<'scholar' | 'admin'>('scholar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSignInWithGoogle(selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 text-center z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-600 rounded-3xl flex items-center justify-center mx-auto text-white shadow-md shadow-orange-600/20">
          <LogIn className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Scholar Portal Access</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Sign in to book development workshops, save research publications, and manage your academic profile.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-left">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-bold">
            Select Academic Access Tier
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('scholar')}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedRole === 'scholar'
                  ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-sm'
                  : 'bg-stone-50 border-stone-200 text-slate-600 hover:border-stone-300 hover:text-slate-900'
              }`}
            >
              <div className="text-xs font-bold">Scholar</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Attendee / Researcher</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedRole === 'admin'
                  ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-sm'
                  : 'bg-stone-50 border-stone-200 text-slate-600 hover:border-stone-300 hover:text-slate-900'
              }`}
            >
              <div className="text-xs font-bold">Admin</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Management / Editor</div>
            </button>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <p className="text-[11px] text-slate-400 font-mono">
          Secure authentication provided by Firebase Auth
        </p>
      </motion.div>
    </div>
  );
}
