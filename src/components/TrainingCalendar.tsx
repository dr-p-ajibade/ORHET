import { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, 
  Users, Video, Sparkles, CheckCircle2, ArrowRight, Filter,
  FileSpreadsheet, ExternalLink, Info
} from 'lucide-react';
import { TrainingSession, User as UserType } from '../types';

interface TrainingCalendarProps {
  sessions: TrainingSession[];
  user: UserType | null;
  onSelectSession: (session: TrainingSession) => void;
  onRequestCustomDate?: (dateStr: string) => void;
}

export default function TrainingCalendar({
  sessions,
  user,
  onSelectSession,
  onRequestCustomDate,
}: TrainingCalendarProps) {
  // Parse session dates to set an intelligent default viewing month (e.g. earliest scheduled workshop or current month)
  const defaultDate = useMemo(() => {
    if (sessions.length > 0) {
      // Find first future or upcoming session
      const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
      const firstDate = new Date(sorted[0].date + 'T00:00:00');
      if (!isNaN(firstDate.getTime())) return firstDate;
    }
    return new Date();
  }, [sessions]);

  const [currentDate, setCurrentDate] = useState<Date>(defaultDate);
  const [filterType, setFilterType] = useState<'all' | 'confirmed' | 'potential'>('all');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const jumpToMonth = (monthIndex: number, year = 2026) => {
    setCurrentDate(new Date(year, monthIndex, 1));
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const isPot = session.isPotential || session.status === 'potential';
      if (filterType === 'confirmed') return !isPot;
      if (filterType === 'potential') return isPot;
      return true;
    });
  }, [sessions, filterType]);

  // Map sessions by date string "YYYY-MM-DD"
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, TrainingSession[]>();
    for (const session of filteredSessions) {
      const existing = map.get(session.date) || [];
      existing.push(session);
      map.set(session.date, existing);
    }
    return map;
  }, [filteredSessions]);

  // Compute calendar days grid
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      date: Date;
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      sessions: TrainingSession[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateObj,
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        sessions: sessionsByDate.get(dateString) || []
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateObj,
        dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        sessions: sessionsByDate.get(dateString) || []
      });
    }

    // Next month padding to fill a complete 35 or 42 cell grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(currentYear, currentMonth + 1, d);
      const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateObj,
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        sessions: sessionsByDate.get(dateString) || []
      });
    }

    return days;
  }, [currentYear, currentMonth, sessionsByDate]);

  // Sessions in the current viewing month for summary
  const currentMonthSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      const sDate = new Date(s.date + 'T00:00:00');
      return sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSessions, currentYear, currentMonth]);

  return (
    <div className="space-y-6">
      {/* Calendar Controls & Month Quick Select */}
      <div className="glass-card p-6 bg-white border border-stone-200 rounded-3xl space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month / Year Title & Navigation */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-orange-600">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {currentMonthSessions.length} Training Cohort{currentMonthSessions.length === 1 ? '' : 's'} scheduled this month
              </p>
            </div>
          </div>

          {/* Quick Jump Buttons for User Requested Training Months */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => jumpToMonth(5, 2026)} // June
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentMonth === 5 && currentYear === 2026 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              June '26
            </button>
            <button
              onClick={() => jumpToMonth(7, 2026)} // August
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentMonth === 7 && currentYear === 2026 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              August '26
            </button>
            <button
              onClick={() => jumpToMonth(9, 2026)} // October
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentMonth === 9 && currentYear === 2026 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              October '26
            </button>
            <button
              onClick={() => jumpToMonth(10, 2026)} // November
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentMonth === 10 && currentYear === 2026 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              November '26
            </button>
            <button
              onClick={() => jumpToMonth(0, 2027)} // Potential 2027
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                currentYear === 2027
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-amber-900 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              2027 Cohorts
            </button>
          </div>

          {/* Month Step Arrows & Filters */}
          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('confirmed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'confirmed' ? 'bg-white text-orange-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilterType('potential')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'potential' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Proposed
              </button>
            </div>

            {/* Prev / Next Month */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={prevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-all font-mono"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-stone-200 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="font-medium">Confirmed Google Meet Cohort</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600 inline-block"></span>
            <span className="font-medium">Potential / Proposed Cohort (Register Interest)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-medium">You are Registered</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px] ml-auto hidden sm:block">
            Click any session or date to register with prefilled details
          </div>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="glass-card bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/80 text-center text-xs font-mono font-bold text-slate-500 py-3">
          {daysOfWeek.map((day) => (
            <div key={day} className="tracking-widest uppercase text-[11px]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-200">
          {calendarGrid.map((cell, idx) => {
            const hasSessions = cell.sessions.length > 0;

            return (
              <div
                key={idx}
                className={`min-h-[110px] md:min-h-[135px] p-2 flex flex-col justify-between transition-colors relative group ${
                  cell.isCurrentMonth ? 'bg-white hover:bg-stone-50/50' : 'bg-stone-50/40 text-slate-400'
                } ${cell.isToday ? 'ring-2 ring-inset ring-orange-500/30' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      cell.isToday
                        ? 'bg-orange-600 text-white font-black shadow-xs'
                        : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isCurrentMonth && (
                    <button
                      onClick={() => onRequestCustomDate && onRequestCustomDate(cell.dateString)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-orange-700 hover:underline px-1 py-0.5 rounded transition-opacity"
                      title="Propose a custom training date"
                    >
                      + Propose
                    </button>
                  )}
                </div>

                {/* Training Session Chips */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-start">
                  {cell.sessions.map((session) => {
                    const isPot = session.isPotential || session.status === 'potential';
                    const isReg = user?.registeredTrainings?.includes(session.id);
                    const isFull = !isPot && session.registeredCount >= session.capacity;

                    return (
                      <button
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className={`w-full text-left p-1.5 rounded-xl border text-xs transition-all relative overflow-hidden group/chip shadow-xs ${
                          isReg
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100/70'
                            : isPot
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950 hover:border-amber-500 hover:bg-amber-100/80'
                              : isFull
                                ? 'bg-red-50 border-red-200 text-red-900 opacity-80'
                                : 'bg-orange-50/90 border-orange-200 text-orange-950 hover:border-orange-400 hover:bg-orange-100/80'
                        }`}
                        title={`${session.title} (${session.time}) - Click to Register / Open Google Form`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            {isReg ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            ) : isPot ? (
                              <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            ) : (
                              <Video className="w-2.5 h-2.5 text-orange-600 shrink-0" />
                            )}
                            <span className="truncate">{session.time.split(' - ')[0] || session.time}</span>
                          </span>

                          <span className={`text-[8px] font-black uppercase tracking-widest px-1 rounded ${
                            isReg ? 'bg-emerald-200/60 text-emerald-800' :
                            isPot ? 'bg-amber-200/60 text-amber-800' :
                            'bg-orange-200/60 text-orange-800'
                          }`}>
                            {isReg ? 'Booked' : isPot ? 'Proposed' : 'Confirmed'}
                          </span>
                        </div>

                        <div className="font-bold text-[11px] line-clamp-2 leading-tight group-hover/chip:text-orange-900">
                          {session.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Month Sessions Agenda List */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Agenda & Cohorts for {monthNames[currentMonth]} {currentYear} ({currentMonthSessions.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Click any workshop to prefill registration form or launch Google Form
          </span>
        </div>

        {currentMonthSessions.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {currentMonthSessions.map((session) => {
              const isPot = session.isPotential || session.status === 'potential';
              const isReg = user?.registeredTrainings?.includes(session.id);
              const isFull = !isPot && session.registeredCount >= session.capacity;
              const remaining = Math.max(0, session.capacity - session.registeredCount);

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white group hover:shadow-md flex flex-col justify-between ${
                    isReg
                      ? 'border-emerald-300 hover:border-emerald-500'
                      : isPot
                        ? 'border-amber-300 hover:border-amber-500'
                        : 'border-stone-200 hover:border-orange-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                          isReg 
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPot 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-orange-100 text-orange-800'
                        }`}>
                          {isReg ? 'Registered' : isPot ? 'Proposed Cohort' : 'Confirmed Workshop'}
                        </span>
                        {session.topicCategory && (
                          <span className="text-[10px] text-slate-500 font-medium font-mono hidden sm:inline">
                            • {session.topicCategory}
                          </span>
                        )}
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-bold text-slate-900 block">{session.date}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{session.time}</span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                      {session.title}
                    </h4>

                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                      {session.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      {isPot ? (
                        <span className="flex items-center gap-1 text-amber-700 font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          Pre-register interest
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {isFull ? (
                            <span className="text-red-600 font-bold">Full</span>
                          ) : (
                            <span>{remaining} seats left</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="text-orange-700 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isReg ? 'View Details' : 'Register Prefilled Form'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-slate-600 text-sm">
              No public cohorts scheduled in {monthNames[currentMonth]} {currentYear} yet.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => jumpToMonth(5, 2026)}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-orange-700 font-bold rounded-xl text-xs border border-stone-300 transition-all"
              >
                Go to June 2026
              </button>
              <button
                onClick={() => jumpToMonth(7, 2026)}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-orange-700 font-bold rounded-xl text-xs border border-stone-300 transition-all"
              >
                Go to August 2026
              </button>
              <button
                onClick={() => jumpToMonth(9, 2026)}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-orange-700 font-bold rounded-xl text-xs border border-stone-300 transition-all"
              >
                Go to October 2026
              </button>
              <button
                onClick={() => jumpToMonth(10, 2026)}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-orange-700 font-bold rounded-xl text-xs border border-stone-300 transition-all"
              >
                Go to November 2026
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
