import { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Video, User as UserIcon, Mail, Building, 
  ExternalLink, CheckCircle2, ArrowRight, ShieldCheck, 
  Sparkles, Send, Copy, Check, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingSession, User as UserType, TraineeRegistrationData } from '../types';

interface TrainingRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TrainingSession | null;
  user: UserType | null;
  onOpenAuth: () => void;
  onConfirmBooking: (session: TrainingSession, registrationData: TraineeRegistrationData) => Promise<void>;
  defaultGoogleFormUrl?: string;
}

export default function TrainingRegistrationModal({
  isOpen,
  onClose,
  session,
  user,
  onOpenAuth,
  onConfirmBooking,
  defaultGoogleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScX9_arhet_academic_training/viewform',
}: TrainingRegistrationModalProps) {
  const [traineeName, setTraineeName] = useState('');
  const [traineeEmail, setTraineeEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [academicRank, setAcademicRank] = useState('Senior Lecturer / Faculty');
  const [department, setDepartment] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync trainee information when session or user changes
  useEffect(() => {
    if (user) {
      setTraineeName(user.name || '');
      setTraineeEmail(user.email || '');
      setInstitution(user.affiliation || '');
      setAcademicRank(user.academicTitle || 'Senior Lecturer / Faculty');
      setDepartment(user.department || '');
    } else {
      setTraineeName('');
      setTraineeEmail('');
      setInstitution('');
      setAcademicRank('Senior Lecturer / Faculty');
      setDepartment('');
    }
    setLearningGoals('');
    setSubmissionSuccess(false);
  }, [user, session, isOpen]);

  if (!isOpen || !session) return null;

  const isPotential = session.isPotential || session.status === 'potential';
  const isRegistered = user?.registeredTrainings?.includes(session.id);
  const isFull = !isPotential && session.registeredCount >= session.capacity;
  const availableSeats = Math.max(0, session.capacity - session.registeredCount);

  // Generate Google Form Prefilled URL with URL-encoded parameters
  const generateGoogleFormPrefillUrl = () => {
    const baseUrl = session.googleFormUrl || defaultGoogleFormUrl;
    const url = new URL(baseUrl);
    
    // Standard Google Form prefill query parameters or URL params
    url.searchParams.set('usp', 'pp_url');
    // Using descriptive semantic keys as fallback or standard form ingestion keys
    url.searchParams.set('entry.training_title', session.title);
    url.searchParams.set('entry.training_date', session.date);
    url.searchParams.set('entry.trainee_name', traineeName.trim() || (user?.name ?? ''));
    url.searchParams.set('entry.trainee_email', traineeEmail.trim() || (user?.email ?? ''));
    url.searchParams.set('entry.institution', institution.trim() || (user?.affiliation ?? ''));
    url.searchParams.set('entry.academic_rank', academicRank);
    url.searchParams.set('entry.topic_category', session.topicCategory || 'Higher Education Transformation');

    return url.toString();
  };

  const handleCopyGoogleFormLink = () => {
    const formUrl = generateGoogleFormPrefillUrl();
    navigator.clipboard.writeText(formUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLaunchGoogleForm = () => {
    const formUrl = generateGoogleFormPrefillUrl();
    window.open(formUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    try {
      const regData: TraineeRegistrationData = {
        trainingId: session.id,
        trainingTitle: session.title,
        trainingDate: session.date,
        trainingTime: session.time,
        traineeName: traineeName.trim() || user.name,
        traineeEmail: traineeEmail.trim() || user.email,
        institution: institution.trim() || user.affiliation || 'Higher Education Institution',
        academicRank,
        department: department.trim() || user.department,
        notes: learningGoals.trim(),
        isPotentialInterest: isPotential,
        registeredAt: new Date().toISOString()
      };

      await onConfirmBooking(session, regData);
      setSubmissionSuccess(true);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const academicRanks = [
    'Professor / Department Chair',
    'Associate Professor',
    'Senior Lecturer / Assistant Professor',
    'Postdoctoral Research Fellow',
    'Doctoral Candidate / PhD Scholar',
    'Dean / University Executive',
    'Institutional Researcher / Data Officer',
    'Higher Education Consultant / Scholar'
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-stone-50 via-white to-orange-50/40 border-b border-stone-200 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-900 transition-all"
            title="Close Form"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
              isPotential
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-orange-100 text-orange-800 border border-orange-300'
            }`}>
              {isPotential ? '✦ Proposed Future Cohort' : '● Confirmed Academic Workshop'}
            </span>
            <span className="text-slate-400 text-xs font-mono">• Lead: Dr P Ajibade (PhD)</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {isPotential ? 'Expression of Interest & Registration' : 'Workshop Seat Registration'}
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            {isPotential
              ? 'Register your interest for this potential future cohort. Your trainee details and preferred date will be recorded and prefilled.'
              : 'Complete your registration to secure an interactive seat with Google Meet virtual classroom access.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {submissionSuccess ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {isPotential ? 'Expression of Interest Received!' : 'Registration Confirmed!'}
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-slate-900">{traineeName || 'Scholar'}</strong>. Your record for{' '}
                  <strong className="text-slate-900">{session.title}</strong> has been confirmed.
                </p>
              </div>

              {/* Session Summary Card */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-3 text-xs max-w-md mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                  <span className="text-slate-500 font-mono uppercase tracking-wider">Session</span>
                  <span className="text-slate-900 font-bold text-right line-clamp-1">{session.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-mono uppercase tracking-wider">Scheduled Date</span>
                  <span className="text-slate-900 font-bold">{session.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-mono uppercase tracking-wider">Time</span>
                  <span className="text-slate-900 font-bold">{session.time}</span>
                </div>
                {session.meetLink && (
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Google Meet
                    </span>
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-700 font-bold hover:underline flex items-center gap-1"
                    >
                      Join Classroom <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all"
                >
                  Done
                </button>
                <button
                  onClick={handleLaunchGoogleForm}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl font-bold uppercase tracking-wider text-xs border border-stone-300 transition-all flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  View Prefilled Google Form
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Highlighted Prefilled Training Info Card */}
              <div className="p-4 bg-orange-50/70 border border-orange-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black text-orange-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Prefilled Training Details
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-orange-200 text-orange-800 font-mono text-[10px]">
                    Auto-selected
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-orange-200/60 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                      Training Title (Prefilled)
                    </div>
                    <div className="font-bold text-slate-900 line-clamp-2">{session.title}</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-orange-200/60 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                      Scheduled Date & Time (Prefilled)
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{session.date}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-normal">{session.time}</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Format: Live Interactive Google Meet Virtual Cohort</span>
                  </div>
                  {!isPotential && (
                    <span className="font-mono text-slate-500 text-[10px]">
                      Availability: {availableSeats} of {session.capacity} seats remaining
                    </span>
                  )}
                </div>
              </div>

              {/* Trainee Information Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-orange-600" />
                    Trainee / Scholar Information
                  </h3>
                  {!user && (
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="text-[11px] text-orange-700 hover:text-orange-800 font-bold hover:underline"
                    >
                      Sign In to Auto-Fill
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={traineeName}
                      onChange={(e) => setTraineeName(e.target.value)}
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                      Institutional Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={traineeEmail}
                      onChange={(e) => setTraineeEmail(e.target.value)}
                      placeholder="e.g. j.doe@university.ac.za"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                      Institutional Affiliation / University *
                    </label>
                    <input
                      type="text"
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. University of Johannesburg"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                      Academic Designation / Rank
                    </label>
                    <select
                      value={academicRank}
                      onChange={(e) => setAcademicRank(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                    >
                      {academicRanks.map((rank) => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                    Department / Academic Faculty (Optional)
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Information Systems / Higher Education Studies"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                    Learning Goals or Specific Questions for Dr P Ajibade
                  </label>
                  <textarea
                    rows={2}
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    placeholder="What specific institutional or scholarly outcomes do you hope to achieve from this training?"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Google Form Prefill Option Banner */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    Prefer Google Form Registration?
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    The training title (<strong className="font-semibold">{session.title}</strong>) and date (<strong className="font-semibold">{session.date}</strong>) are prefilled for you.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleLaunchGoogleForm}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-[11px] shadow-sm transition-all"
                  >
                    Open Google Form <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyGoogleFormLink}
                    className="p-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition-all"
                    title="Copy Prefilled Google Form URL"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || (isRegistered && !isPotential) || isFull}
                  className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    isRegistered && !isPotential
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                      : isFull
                        ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20'
                  }`}
                >
                  {isRegistered && !isPotential ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Already Registered
                    </>
                  ) : isFull ? (
                    'Session Reached Capacity'
                  ) : isSubmitting ? (
                    'Confirming Seat...'
                  ) : isPotential ? (
                    <>
                      Submit Expression of Interest
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Confirm Workshop Seat
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider border border-stone-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
