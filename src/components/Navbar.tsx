import { useState } from 'react';
import { 
  GraduationCap, Search, Newspaper, Calendar, 
  User as UserIcon, Shield, Settings, Menu, X, LogIn, LogOut, Lock
} from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: UserType | null;
  onOpenAuth: () => void;
  onOpenAdminLogin: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
}

export default function Navbar({
  currentPage,
  onNavigate,
  user,
  onOpenAuth,
  onOpenAdminLogin,
  onSignOut,
  onOpenSettings,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { id: 'archive', label: 'Research Archive', icon: Search },
    { id: 'training', label: 'Training', icon: Calendar },
    { id: 'blog', label: 'Scholarly Blog', icon: Newspaper },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto bg-white/90 backdrop-blur-xl border border-[#e8e2d8] px-5 md:px-8 py-3.5 rounded-3xl shadow-lg shadow-stone-900/5">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20 group-hover:scale-105 transition-all">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              ARHET
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
            </div>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest hidden sm:block">
              Higher Ed Transformation
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                currentPage === link.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
              }`}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* User Status / Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('account')}
                className={`flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 rounded-2xl border transition-all ${
                  currentPage === 'account'
                    ? 'bg-orange-50 border-orange-300 text-orange-950'
                    : 'bg-stone-100 border-stone-200 hover:bg-stone-200 text-slate-800'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-600 to-amber-700 flex items-center justify-center text-white text-xs font-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[9px] text-orange-600 font-mono uppercase tracking-wider">{user.role}</div>
                </div>
              </button>

              {isAdmin ? (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border transition-all text-xs font-bold uppercase tracking-wider ${
                    currentPage === 'admin'
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'
                  }`}
                  title="Admin Console"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Admin Desk</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-800 border border-stone-200 transition-all"
                  title="Admin Portal Log In"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onSignOut}
                className="p-2.5 rounded-2xl bg-stone-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-stone-200 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-stone-200 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Scholar Sign In</span>
              </button>

              {/* Explicit Admin Log In Button */}
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 flex items-center gap-1.5"
                title="Administrator & Editorial Log In"
              >
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Admin Log In</span>
              </button>
            </div>
          )}

          {/* Settings Button - Strictly behind Admin Wall (Admin Only) */}
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 hover:text-slate-900 border border-stone-200 transition-all"
              title="Platform Settings (Admin Only)"
            >
              <Settings className="w-4 h-4 text-orange-600" />
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 bg-white/95 backdrop-blur-2xl border border-stone-200 rounded-3xl p-4 space-y-2 pointer-events-auto shadow-2xl">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                currentPage === link.id
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </button>
          ))}

          {user && (
            <button
              onClick={() => {
                onNavigate('account');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                currentPage === 'account'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              My Account
            </button>
          )}

          {/* Admin Console & Settings - Admin Only in Mobile Menu */}
          {isAdmin ? (
            <>
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                  currentPage === 'admin'
                    ? 'bg-orange-600 text-white'
                    : 'text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <Shield className="w-4 h-4 text-orange-600" />
                Admin Console
              </button>

              <button
                onClick={() => {
                  onOpenSettings();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-slate-700 hover:text-slate-900 hover:bg-stone-100"
              >
                <Settings className="w-4 h-4 text-orange-600" />
                Site Settings (Admin Wall)
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onOpenAdminLogin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all bg-slate-900 text-white hover:bg-slate-800"
            >
              <Shield className="w-4 h-4 text-orange-400" />
              Administrator Log In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
