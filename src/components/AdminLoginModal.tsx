import { useState } from 'react';
import { X, Shield, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: (role: 'admin' | 'scholar') => Promise<void>;
  onSuccess?: () => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onSignInWithGoogle,
  onSuccess,
}: AdminLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdminSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSignInWithGoogle('admin');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Administrator authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
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
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10 text-slate-900"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-900 transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Admin Shield Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-orange-950 to-orange-700 flex items-center justify-center text-white shadow-lg shadow-orange-950/30 border border-orange-500/20 shrink-0">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3 text-orange-600" />
              Restricted Gateway
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrator Portal Log In
            </h2>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed">
          Access the executive editorial desk to write and upload scholarly blog articles, configure training workshop cohorts, and access administrative settings.
        </p>

        {/* Administrative Privileges Summary */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700 font-sans">
          <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-500">
            Authorized Editorial & Executive Privileges
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Scholarly Blog Publishing:</strong> Compose, upload drafts (.txt/.md), and publish articles as Dr P Ajibade (PhD).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Training Workshop Management:</strong> Schedule cohorts, set capacities, and assign Google Meet virtual rooms.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Platform Settings Wall:</strong> Access restricted system controls and heritage pattern configurations.</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleAdminSignIn}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              'Authenticating Administrator...'
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Sign In with Authorized Google Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 font-mono">
            Authorized admin: Dr P Ajibade (ajibadep.sa@gmail.com)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
