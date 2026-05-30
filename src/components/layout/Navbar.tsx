import React, { useState, useEffect } from 'react';
import { getProfile, isAuthenticated, purgeSession } from '../../lib/auth';
import ThemeToggle from '../ui/ThemeToggle';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { BookOpen, User, LogOut, Menu, X, Landmark, Cpu, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check loading state dynamically on mount and whenever currentPath shifts
    checkAuth();
  }, [currentPath]);

  const checkAuth = () => {
    const auth = isAuthenticated();
    setIsLogged(auth);
    if (auth) {
      setUserProfile(getProfile());
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
    <nav className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-150 dark:border-slate-850 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo element */}
          <div 
            onClick={() => handleNavItemClick(isLogged ? '/dashboard' : '/')}
            className="flex items-center gap-2 cursor-pointer grow-0 select-none group"
          >
            <span className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white dark:bg-white dark:border-transparent dark:text-slate-950 shadow-md transform group-hover:scale-105 transition-all">
              <Cpu className="h-5 w-5 animate-pulse" />
            </span>
            <div className="text-left font-black tracking-tight text-slate-900 dark:text-white leading-none">
              <span className="text-lg heading-font">Learniverse</span>
              <span className="text-blue-500 font-mono text-[9px] block">AI EDUCATION ENGINE</span>
            </div>
          </div>

          {/* Desktop Navigation Link Toggles */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center max-w-[60%]">
            
            {/* Standard Guest views */}
            {role === 'guest' && (
              <>
                <button
                  onClick={() => handleNavItemClick('/catalog')}
                  className={`px-3 py-2 text-xs font-bold uppercase transition rounded-lg ${currentPath === '/catalog' ? 'text-blue-500 bg-slate-50 dark:bg-slate-900/60' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/40'}`}
                >
                  Syllabus Catalog
                </button>
                <button
                  onClick={() => handleNavItemClick('/blog')}
                  className={`px-3 py-2 text-xs font-bold uppercase transition rounded-lg ${currentPath === '/blog' ? 'text-blue-500 bg-slate-50 dark:bg-slate-900/60' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/40'}`}
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
                  className={`px-3 py-2 text-xs font-bold uppercase transition rounded-lg ${currentPath === '/dashboard' ? 'text-blue-520 bg-slate-50 dark:bg-slate-900/60 font-black' : 'text-slate-700 dark:text-slate-205 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-905'}`}
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => handleNavItemClick('/catalog')}
                  className={`px-3 py-2 text-xs font-bold uppercase transition rounded-lg ${currentPath === '/catalog' ? 'text-blue-520 bg-slate-50 dark:bg-slate-900/60 font-black' : 'text-slate-700 dark:text-slate-205 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-905'}`}
                >
                  Syllabus Catalog
                </button>
                <button
                  onClick={() => handleNavItemClick('/tutor')}
                  className={`px-3 py-2 text-xs font-bold uppercase transition rounded-lg ${currentPath === '/tutor' ? 'text-blue-520 bg-slate-50 dark:bg-slate-900/60 font-black' : 'text-slate-700 dark:text-slate-205 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-905'}`}
                >
                  AI Tutor Workspace
                </button>
                <button
                  onClick={() => handleNavItemClick('/blog')}
                  className={`px-3 py-2 text-xs font-bold uppercase transition rounded-lg ${currentPath === '/blog' ? 'text-blue-520 bg-slate-50 dark:bg-slate-900/60 font-black' : 'text-slate-700 dark:text-slate-205 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-905'}`}
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
                  className={`px-2.5 py-1.5 text-xs font-black uppercase transition rounded-lg truncate ${currentPath === '/admin/catalog' ? 'text-indigo-500 bg-slate-50 dark:bg-slate-900/60' : 'text-slate-650 dark:text-slate-300 hover:text-indigo-400'}`}
                >
                  Curriculum Builder
                </button>
                <button
                  onClick={() => handleNavItemClick('/admin/simulations')}
                  className={`px-2.5 py-1.5 text-xs font-black uppercase transition rounded-lg truncate ${currentPath === '/admin/simulations' ? 'text-indigo-500 bg-slate-50 dark:bg-slate-900/60' : 'text-slate-650 dark:text-slate-300 hover:text-indigo-400'}`}
                >
                  Simulation Registry
                </button>
                <button
                  onClick={() => handleNavItemClick('/admin/documents')}
                  className={`px-2.5 py-1.5 text-xs font-black uppercase transition rounded-lg truncate ${currentPath === '/admin/documents' ? 'text-indigo-500 bg-slate-50 dark:bg-slate-900/60' : 'text-slate-650 dark:text-slate-300 hover:text-indigo-400'}`}
                >
                  RAG Embedder
                </button>
                <button
                  onClick={() => handleNavItemClick('/admin/blog')}
                  className={`px-2.5 py-1.5 text-xs font-black uppercase transition rounded-lg truncate ${currentPath === '/admin/blog' ? 'text-indigo-500 bg-slate-50 dark:bg-slate-900/60' : 'text-slate-650 dark:text-slate-300 hover:text-indigo-400'}`}
                >
                  Edu Publisher
                </button>
                {/* Visual student preview path */}
                <button
                  onClick={() => handleNavItemClick('/dashboard')}
                  className="px-2.5 py-1.5 text-xs font-black uppercase text-blue-500 hover:underline shrink-0"
                >
                  Student Dashboard
                </button>
              </>
            )}

          </div>

          {/* Desktop Right items: Theme toggle, login/profile, logout */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <ThemeToggle />

            {isLogged ? (
              <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
                <div className="text-right">
                  <p className="text-xs font-black text-slate-850 dark:text-white leading-none heading-font select-text">
                    {userProfile?.name || 'Educator User'}
                  </p>
                  <p className="text-[9px] font-mono lowercase opacity-70 text-slate-450 mt-0.5">
                    Role: <strong className="uppercase text-blue-500 font-extrabold">{role}</strong>
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-neutral-802 cursor-pointer transition"
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
                <Button size="sm" className="text-xs font-bold" onClick={() => handleNavItemClick('/register')}>
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile hamburger trigger */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
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
              <button onClick={() => handleNavItemClick('/tutor')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">AI Tutor Workspace</button>
              <button onClick={() => handleNavItemClick('/blog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700 hover:text-blue-500">Educational Blog</button>
              <div className="pt-2.5 border-t border-slate-105 select-text">
                <div className="mb-2">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-205">{userProfile?.name}</p>
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
              <button onClick={() => handleNavItemClick('/admin/blog')} className="block w-full text-left py-2 font-bold text-xs uppercase text-slate-700">Edu Publisher</button>
              <button onClick={() => handleNavItemClick('/dashboard')} className="block w-full text-left py-2 font-extrabold text-xs text-blue-500">Student Dashboard View</button>
              <div className="pt-2.5 border-t border-slate-105 select-text">
                <div className="mb-2">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-205">{userProfile?.name}</p>
                  <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-semibold">ROLE: admin</p>
                </div>
                <Button size="sm" variant="danger" className="w-full justify-center" onClick={handleLogout}>Log Out</Button>
              </div>
            </>
          )}

        </div>
      )}

    </nav>
  );
}
