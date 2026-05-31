import React, { useState, useEffect } from 'react';
import { getProfile, isAuthenticated, purgeSession, getCurrentUser } from '../../lib/auth';
import { getApiBaseUrl, setApiBaseUrlOverride } from '../../lib/api';
import ThemeToggle from '../ui/ThemeToggle';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { BookOpen, User, LogOut, Menu, X, Landmark, Cpu, Sparkles, Settings } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState('');

  useEffect(() => {
    // Check loading state dynamically on mount and whenever currentPath shifts
    checkAuth();
  }, [currentPath]);

  const checkAuth = async () => {
    const auth = isAuthenticated();
    setIsLogged(auth);
    if (auth) {
      setUserProfile(getProfile()); // Set initial from cache
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserProfile(user);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setUserProfile(null);
    }
  };

  const handleLogout = () => {
    purgeSession();
    setIsLogged(false);
    setUserProfile(null);
    setMobileOpen(false);
    // Force direct callback redirection
    onNavigate('/login');
  };

  const handleNavItemClick = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  const role = userProfile?.role || 'guest';

  return (
    <nav className="sticky top-0 z-40 bg-[var(--glass-bg)] backdrop-blur-[20px] border-b border-[var(--glass-border)] select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo element */}
          <div 
            onClick={() => handleNavItemClick(isLogged ? '/dashboard' : '/')}
            className="flex items-center gap-2 cursor-pointer grow-0 select-none group"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center font-bold text-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] transform group-hover:scale-105 transition-all">
              <Cpu className="h-5 w-5 animate-pulse" />
            </span>
            <div className="text-left font-black tracking-tight text-[var(--text-primary)] leading-none">
              <span className="text-lg heading-font">Learniverse AI</span>
              <span className="text-[var(--accent-secondary)] font-bold text-[9px] block">AI EDUCATION ENGINE</span>
            </div>
          </div>

          {/* Desktop Navigation Link Toggles */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center max-w-[60%]">
            
            {/* Standard Guest views */}
            {role === 'guest' && (
              <>
                <button
                  onClick={() => handleNavItemClick('/catalog')}
                  className={`px-3 py-2 text-[11px] font-bold uppercase transition rounded-lg ${currentPath === '/catalog' ? 'text-white bg-[var(--accent-primary)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  Syllabus Catalog
                </button>
                <button
                  onClick={() => handleNavItemClick('/blog')}
                  className={`px-3 py-2 text-[11px] font-bold uppercase transition rounded-lg ${currentPath === '/blog' ? 'text-white bg-[var(--accent-primary)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  Edu Blog
                </button>
              </>
            )}

            {/* Standard Student views */}
            {role === 'student' && (
              <>
                <button
                  onClick={() => handleNavItemClick('/dashboard')}
                  className={`px-3 py-2 text-[11px] font-bold uppercase transition rounded-lg ${currentPath === '/dashboard' ? 'text-white bg-[var(--accent-primary)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => handleNavItemClick('/catalog')}
                  className={`px-3 py-2 text-[11px] font-bold uppercase transition rounded-lg ${currentPath === '/catalog' ? 'text-white bg-[var(--accent-primary)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  Syllabus Catalog
                </button>
                
                {/* Prominent Glowing AI Tutor Button */}
                <button
                  onClick={() => handleNavItemClick('/tutor')}
                  className={`relative group px-4 py-2 text-[11px] font-black uppercase transition-all duration-500 rounded-xl flex items-center gap-2 overflow-hidden border ${
                    currentPath === '/tutor' 
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-[0_0_20px_rgba(108,99,255,0.4)]' 
                      : 'bg-[var(--glass-bg)] text-[var(--accent-secondary)] border-[var(--accent-secondary)]/30 hover:border-[var(--accent-secondary)] hover:shadow-[0_0_15px_rgba(0,210,255,0.25)]'
                  }`}
                >
                  <Sparkles className={`h-3.5 w-3.5 ${currentPath === '/tutor' ? 'text-white' : 'text-[var(--accent-secondary)]'} animate-pulse`} />
                  <span>AI Tutor</span>
                  {currentPath !== '/tutor' && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent-secondary)]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  )}
                  {currentPath !== '/tutor' && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-secondary)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-secondary)]"></span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavItemClick('/blog')}
                  className={`px-3 py-2 text-[11px] font-bold uppercase transition rounded-lg ${currentPath === '/blog' ? 'text-white bg-[var(--accent-primary)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  Educational Blog
                </button>
              </>
            )}

            {/* Standard Admin views */}
            {role === 'admin' && (
              <>
                <button
                  onClick={() => handleNavItemClick('/admin/catalog')}
                  className={`px-2.5 py-1.5 text-[10px] font-bold uppercase transition rounded-lg truncate ${currentPath === '/admin/catalog' ? 'text-white bg-[var(--accent-secondary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  Curriculum Builder
                </button>
                
                {/* Admin Quick access to AI Tutor */}
                <button
                  onClick={() => handleNavItemClick('/tutor')}
                  className={`px-2.5 py-1.5 text-[10px] font-bold uppercase transition rounded-lg flex items-center gap-1.5 border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 hover:shadow-[0_0_10px_rgba(108,99,255,0.2)] ${currentPath === '/tutor' ? 'text-white bg-[var(--accent-primary)] shadow-sm' : 'text-[var(--accent-primary)]'}`}
                >
                  <Sparkles className="h-3 w-3" />
                  AI Tutor
                </button>

                <button
                  onClick={() => handleNavItemClick('/admin/simulations')}
                  className={`px-2.5 py-1.5 text-[10px] font-bold uppercase transition rounded-lg truncate ${currentPath === '/admin/simulations' ? 'text-white bg-[var(--accent-secondary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  Simulation Registry
                </button>
                <button
                  onClick={() => handleNavItemClick('/admin/documents')}
                  className={`px-2.5 py-1.5 text-[10px] font-bold uppercase transition rounded-lg truncate ${currentPath === '/admin/documents' ? 'text-white bg-[var(--accent-secondary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  RAG Embedder
                </button>
                <button
                  onClick={() => handleNavItemClick('/admin/blog')}
                  className={`px-2.5 py-1.5 text-[10px] font-bold uppercase transition rounded-lg truncate ${currentPath === '/admin/blog' ? 'text-white bg-[var(--accent-secondary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}`}
                >
                  AI Blog Generator
                </button>
                {/* Visual student preview path */}
                <button
                  onClick={() => handleNavItemClick('/dashboard')}
                  className="px-2.5 py-1.5 text-[11px] font-bold uppercase text-[var(--accent-primary)] hover:underline shrink-0"
                >
                  Student Dashboard
                </button>
              </>
            )}

          </div>

          {/* Desktop Right items: Theme toggle, login/profile, logout */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => {
                setApiUrlInput(getApiBaseUrl());
                setShowApiModal(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
              title="Backend Server Configuration"
            >
              <Settings className="h-4 w-4" />
            </button>

            {isLogged ? (
              <div className="flex items-center gap-3 border-l border-[var(--glass-border)] pl-4">
                <div className="text-right cursor-pointer group" onClick={() => handleNavItemClick('/profile')}>
                  <p className="text-xs font-bold text-[var(--text-primary)] leading-none heading-font select-text group-hover:underline">
                    {userProfile?.fullname || userProfile?.name || userProfile?.email || 'User'}
                  </p>
                  <p className="text-[9px] font-mono lowercase opacity-70 text-[var(--text-secondary)] mt-0.5">
                    Role: <strong className="uppercase text-[var(--accent-secondary)] font-extrabold">{role}</strong>
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--glass-bg)] cursor-pointer transition border border-transparent hover:border-[var(--glass-border)]"
                  title="Logout Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-xs font-bold" onClick={() => handleNavItemClick('/login')}>
                  Login
                </Button>
                <Button size="sm" variant="primary" className="text-xs font-bold shadow-[0_4px_15px_rgba(0,0,0,0.1)]" onClick={() => handleNavItemClick('/register')}>
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile hamburger trigger */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => {
                setApiUrlInput(getApiBaseUrl());
                setShowApiModal(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
              title="Backend Server Configuration"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile expandable drawer panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950 p-4 space-y-3.5 select-none text-left">
          
          {role === 'guest' && (
            <>
              <button onClick={() => handleNavItemClick('/catalog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">Syllabus Catalog</button>
              <button onClick={() => handleNavItemClick('/blog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">Edu Blog</button>
              <div className="pt-2 border-t border-slate-105 flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1 justify-center" onClick={() => handleNavItemClick('/login')}>Login</Button>
                <Button size="sm" className="flex-1 justify-center" onClick={() => handleNavItemClick('/register')}>Register</Button>
              </div>
            </>
          )}

          {role === 'student' && (
            <>
              <button onClick={() => handleNavItemClick('/dashboard')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">My Dashboard</button>
              <button onClick={() => handleNavItemClick('/catalog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">Syllabus Catalog</button>
              <button 
                onClick={() => handleNavItemClick('/tutor')} 
                className={`block w-full text-left py-2.5 px-3 font-black text-xs uppercase rounded-lg border transition-all flex items-center gap-2 ${currentPath === '/tutor' ? 'bg-[var(--accent-primary)] text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                AI Tutor Workspace
              </button>
              <button onClick={() => handleNavItemClick('/blog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">Educational Blog</button>
              <div className="pt-2.5 border-t border-slate-105 select-text">
                <div className="mb-2 cursor-pointer" onClick={() => handleNavItemClick('/profile')}>
                  <p className="text-xs font-black text-[var(--text-primary)] hover:underline">{userProfile?.fullname || userProfile?.name || userProfile?.email || 'User'}</p>
                  <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-semibold">ROLE: student</p>
                </div>
                <Button size="sm" variant="danger" className="w-full justify-center" onClick={handleLogout}>Log Out</Button>
              </div>
            </>
          )}

          {role === 'admin' && (
            <>
              <button onClick={() => handleNavItemClick('/admin/catalog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700">Curriculum Builder</button>
              <button onClick={() => handleNavItemClick('/admin/simulations')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700">Simulation Registry</button>
              <button onClick={() => handleNavItemClick('/admin/documents')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700">RAG Embedder</button>
              <button onClick={() => handleNavItemClick('/admin/blog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700">AI Blog Generator</button>
              <button onClick={() => handleNavItemClick('/dashboard')} className="block w-full text-left py-2 font-extrabold text-xs text-blue-500">Student Dashboard View</button>
              <div className="pt-2.5 border-t border-slate-105 select-text">
                <div className="mb-2 cursor-pointer" onClick={() => handleNavItemClick('/profile')}>
                  <p className="text-xs font-black text-[var(--text-primary)] hover:underline">{userProfile?.fullname || userProfile?.name || userProfile?.email || 'User'}</p>
                  <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-semibold">ROLE: admin</p>
                </div>
                <Button size="sm" variant="danger" className="w-full justify-center" onClick={handleLogout}>Log Out</Button>
              </div>
            </>
          )}

        </div>
      )}

      {showApiModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-text">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-905 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-505 animate-spin" style={{ animationDuration: '6s' }} />
                Backend API Connection
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal mt-1">
                Configure your deployed Render backend API endpoint. The system runs locally or queries your live URL transparently.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">Backend Base URL</label>
              <input
                type="text"
                placeholder="https://YOUR-RENDER-BACKEND.onrender.com/api/v1"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[9px] text-slate-400 mt-1 leading-normal select-none">
                Default: <span className="font-mono text-slate-500 bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded">https://YOUR-RENDER-BACKEND.onrender.com/api/v1</span>
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2 select-none">
              <Button
                variant="ghost"
                onClick={() => {
                  setApiUrlInput('https://YOUR-RENDER-BACKEND.onrender.com/api/v1');
                }}
                className="text-[10px] font-black uppercase tracking-wider py-1.5"
              >
                Reset Default
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowApiModal(false)}
                className="text-[10px] font-black uppercase tracking-wider py-1.5"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const val = apiUrlInput.trim() || 'https://YOUR-RENDER-BACKEND.onrender.com/api/v1';
                  setApiBaseUrlOverride(val === 'https://YOUR-RENDER-BACKEND.onrender.com/api/v1' ? null : val);
                  setShowApiModal(false);
                  window.location.reload(); // Reload to apply new API configuration immediately across state
                }}
                className="text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-750 text-white rounded-lg py-1.5 px-3"
              >
                Apply & Refresh
              </Button>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
}
