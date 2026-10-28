import { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  coreApiKey: string;
  onSaveApiKey: (key: string) => void;
  patternMode: 'subtle' | 'rich' | 'muted' | 'off';
  onSavePatternMode: (mode: 'subtle' | 'rich' | 'muted' | 'off') => void;
  googleFormUrl?: string;
  onSaveGoogleFormUrl?: (url: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isAdmin,
  coreApiKey,
  onSaveApiKey,
  patternMode,
  onSavePatternMode,
  googleFormUrl = '',
  onSaveGoogleFormUrl,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(coreApiKey);
  const [currentPattern, setCurrentPattern] = useState(patternMode);
  const [formUrl, setFormUrl] = useState(googleFormUrl);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  if (!isAdmin) {
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-4 z-10 text-center"
        >
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Admin Wall • Restricted</h3>
          <p className="text-slate-600 text-sm">
            Platform settings and repository parameters are restricted to authenticated administrators only.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl font-bold uppercase tracking-wider text-xs"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(apiKey.trim());
    onSavePatternMode(currentPattern);
    if (onSaveGoogleFormUrl) {
      onSaveGoogleFormUrl(formUrl.trim());
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const patternOptions: { id: 'subtle' | 'rich' | 'muted' | 'off'; label: string; desc: string }[] = [
    { id: 'subtle', label: 'Balanced (Recommended)', desc: 'Clear indigo motif watermark with optimal text legibility' },
    { id: 'rich', label: 'Rich Linework', desc: 'Prominent Adire textile motif across page backdrops' },
    { id: 'muted', label: 'Minimal', desc: 'Gentle, whisper-light ambient linework' },
    { id: 'off', label: 'Pattern Off', desc: 'Warm ivory canvas without textile motif' },
  ];

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
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
          <Key className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Site & Heritage Settings</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Customize the Adire cultural linework visibility and configure academic research integrations.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Background Linework Customizer */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-orange-700 uppercase tracking-widest">
                Cultural Motif Intensity
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Batik / Adire Indigo Linework</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {patternOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setCurrentPattern(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentPattern === opt.id
                      ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-sm'
                      : 'bg-stone-50 border-stone-200 text-slate-600 hover:border-stone-300 hover:text-slate-900'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{opt.label}</span>
                    {currentPattern === opt.id && <Check className="w-3.5 h-3.5 text-orange-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Google Form Integration for Training Registrations */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest font-mono">
                Training Registration Google Form URL
              </label>
              <span className="text-[10px] text-emerald-700 font-bold">Auto-prefill Enabled</span>
            </div>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/e/.../viewform"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When trainees click any training session in the calendar, their name, institutional email, academic rank, training title, and training date are automatically prefilled in this Google Form.
            </p>
          </div>

          {/* CORE API Key */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
              CORE Open Access API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your CORE API key..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
            />
            <div className="flex items-center justify-between">
              <a
                href="https://core.ac.uk/services/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-orange-700 hover:text-orange-800 font-bold flex items-center gap-1.5 hover:underline"
              >
                <span>Get a free CORE API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-slate-400 font-mono">OpenAlex & CrossRef are free</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Preferences Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
