import { useState } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, Globe, Users, Clock, 
  Video, ExternalLink, ArrowRight, ShieldCheck, Sparkles, 
  LayoutGrid, CalendarDays, FileSpreadsheet, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingSession, User as UserType, TraineeRegistrationData } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import TrainingCalendar from './TrainingCalendar';
import TrainingRegistrationModal from './TrainingRegistrationModal';

interface TrainingPageProps {
  user: UserType | null;
  trainingSessions: TrainingSession[];
  onOpenAuth: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
  onNavigateToAccount: () => void;
  onHandleFirestoreError: (error: unknown, op: any, path: string) => void;
}

export default function TrainingPage({
  user,
  trainingSessions,
  onOpenAuth,
  onUpdateUser,
  onNavigateToAccount,
  onHandleFirestoreError,
}: TrainingPageProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<TrainingSession | null>(null);
  const [bookingSuccessSession, setBookingSuccessSession] = useState<TrainingSession | null>(null);

  // Confirmed vs Potential Future Sessions
  const confirmedSessions = trainingSessions.filter(s => !s.isPotential && s.status !== 'potential');
  const potentialFutureSessions = trainingSessions.filter(s => s.isPotential || s.status === 'potential');

  const handleOpenRegistrationModal = (session: TrainingSession) => {
    setSelectedSessionForModal(session);
  };

  const handleConfirmBooking = async (training: TrainingSession, registrationData: TraineeRegistrationData) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const isPotential = training.isPotential || training.status === 'potential';

    try {
      // If confirmed session, increment enrolled seat count
      if (!isPotential) {
        await updateDoc(doc(db, 'training_sessions', training.id), {
          registeredCount: (training.registeredCount || 0) + 1
        });
      }

      // Add to user's registered list
      await updateDoc(doc(db, 'users', user.uid), {
        registeredTrainings: arrayUnion(training.id)
      });

      const updatedUser = {
        ...user,
        registeredTrainings: [...(user.registeredTrainings || []), training.id]
      };
      onUpdateUser(updatedUser);
      setBookingSuccessSession(training);
    } catch (err) {
      onHandleFirestoreError(err, 'update', `training_sessions/${training.id}`);
    }
  };

  const handleProposeCustomDate = (dateStr: string) => {
    // Create a temporary potential session to prefill the registration form
    const customSession: TrainingSession = {
      id: `custom-request-${Date.now()}`,
      title: 'Custom Academic Workshop Request',
      description: 'Request a specialized workshop cohort on research methods, scholarly publication, or institutional leadership.',
      date: dateStr,
      time: '10:00 AM - 3:00 PM (Flexible)',
      capacity: 30,
      registeredCount: 0,
      isPotential: true,
      status: 'potential',
      topicCategory: 'Custom Institutional Training'
    };
    setSelectedSessionForModal(customSession);
  };

  return (
    <div className="space-y-10 py-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-mono uppercase tracking-widest font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Executive Academic Development • Lead: Dr P Ajibade (PhD)
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Higher Education Training & Workshops
        </h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed">
          Interactive capacity-building cohorts, scholarly methodology masterclasses, and digital pedagogy training with live Google Meet virtual classrooms.
        </p>
      </div>

      {/* View Switcher: Interactive Calendar vs Cards Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-orange-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-orange-600" />
            Training Calendar Schedule
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-orange-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-orange-600" />
            Curriculum & Workshop Cards
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>4 Confirmed Workshops (June, Aug, Oct, Nov) + Future Cohorts</span>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <TrainingCalendar
          sessions={trainingSessions}
          user={user}
          onSelectSession={handleOpenRegistrationModal}
          onRequestCustomDate={handleProposeCustomDate}
        />
      )}

      {/* WORKSHOP CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="space-y-12">
          {/* Confirmed Workshops Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-orange-600" />
                  Confirmed Workshop Schedule
                </h2>
                <p className="text-slate-600 text-xs">
                  Official 2026 cohorts for June, August, October, and November with Google Meet access.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {confirmedSessions.map((training) => {
                const isRegistered = user?.registeredTrainings?.includes(training.id);
                const isFull = training.registeredCount >= training.capacity;
                const availableSeats = Math.max(0, training.capacity - training.registeredCount);
                const percentFilled = Math.min(100, (training.registeredCount / training.capacity) * 100);

                return (
                  <div 
                    key={training.id} 
                    className="glass-card p-8 flex flex-col justify-between group hover:border-orange-500/40 transition-all relative overflow-hidden bg-white shadow-sm"
                  >
                    <div className="space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-orange-600 shadow-xs">
                          <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-slate-900 font-bold text-base">{training.date}</div>
                          <div className="text-slate-500 text-xs font-medium flex items-center justify-end gap-1 mt-0.5 font-mono">
                            <Clock className="w-3 h-3 text-orange-600" />
                            {training.time}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                          {training.title}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {training.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-6 border-t border-stone-200">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest font-mono">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Capacity
                        </span>
                        <span className={isFull ? "text-red-600" : availableSeats <= 5 ? "text-amber-700" : "text-emerald-700"}>
                          {isFull ? "Session Full" : `${availableSeats} of ${training.capacity} seats remaining`}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            isFull ? 'bg-red-500' : 'bg-gradient-to-r from-orange-600 to-amber-500'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>

                      <div className="pt-2 space-y-3">
                        <button
                          disabled={isRegistered || isFull}
                          onClick={() => handleOpenRegistrationModal(training)}
                          className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 ${
                            isRegistered 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default" 
                              : isFull 
                                ? "bg-red-50 text-red-600 border border-red-200 cursor-not-allowed"
                                : "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20"
                          }`}
                        >
                          {isRegistered ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Registered & Confirmed
                            </>
                          ) : isFull ? (
                            'Session Full'
                          ) : (
                            <>
                              Register with Prefilled Form
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Google Meet Info Box */}
                        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <Video className="w-3.5 h-3.5 text-emerald-600" />
                            Google Meet Virtual Room
                          </span>
                          {isRegistered ? (
                            <a 
                              href={training.meetLink}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-700 font-bold flex items-center gap-1 hover:underline text-[11px]"
                            >
                              Join Classroom <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Access provided upon registration</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Potential Future Trainings Section */}
          {potentialFutureSessions.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-600" />
                    Potential Future Trainings & Proposed Cohorts
                  </h2>
                  <p className="text-slate-600 text-xs">
                    Upcoming academic themes open for pre-registration and institutional interest. Dates and participant details are prefilled.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {potentialFutureSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-6 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 border border-amber-200 rounded-3xl space-y-4 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                          Proposed Cohort
                        </span>
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          Tentative: {session.date}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 hover:text-amber-700 transition-colors">
                        {session.title}
                      </h3>

                      <p className="text-slate-600 text-xs leading-relaxed">
                        {session.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-amber-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-amber-900 font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {session.time}
                      </span>
                      <button
                        onClick={() => handleOpenRegistrationModal(session)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
                      >
                        Register Interest
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Registration & Prefilled Google Form Modal */}
      <TrainingRegistrationModal
        isOpen={!!selectedSessionForModal}
        onClose={() => setSelectedSessionForModal(null)}
        session={selectedSessionForModal}
        user={user}
        onOpenAuth={onOpenAuth}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Booking Confirmation Dialog */}
      <AnimatePresence>
        {bookingSuccessSession && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingSuccessSession(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl space-y-6 text-center z-10"
            >
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Seat Confirmed!</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  You are registered for <span className="text-slate-900 font-bold">{bookingSuccessSession.title}</span>.
                </p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono uppercase tracking-wider">Date</span>
                  <span className="text-slate-900 font-bold">{bookingSuccessSession.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono uppercase tracking-wider">Time</span>
                  <span className="text-slate-900 font-bold">{bookingSuccessSession.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono uppercase tracking-wider">Platform</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Google Meet Virtual Classroom
                  </span>
                </div>
              </div>

              {bookingSuccessSession.meetLink && (
                <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl flex items-center justify-between text-xs text-orange-950">
                  <div className="text-left">
                    <div className="font-bold">Google Meet Link:</div>
                    <div className="text-[11px] text-orange-800 font-mono truncate max-w-[200px]">
                      {bookingSuccessSession.meetLink}
                    </div>
                  </div>
                  <a
                    href={bookingSuccessSession.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1 text-[11px] hover:bg-orange-500"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setBookingSuccessSession(null);
                    onNavigateToAccount();
                  }}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                >
                  View in My Account
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setBookingSuccessSession(null)}
                  className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200 rounded-xl font-bold text-xs transition-all uppercase tracking-wider"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
