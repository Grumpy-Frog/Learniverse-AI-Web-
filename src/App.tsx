import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import AuthGuard from './components/layout/AuthGuard';
import AdminGate from './components/layout/AdminGate';

// Pages
import LandingHero from './components/home/LandingHero';
import CatalogBrowser from './components/catalog/CatalogBrowser';
import TutorInbox from './components/tutor/TutorInbox';
import BlogWorkspace from './components/blog/BlogWorkspace';
import LoginBlock from './components/auth/LoginBlock';
import RegisterBlock from './components/auth/RegisterBlock';
import StudentDashboard from './components/dashboard/StudentDashboard';

// Admin Pages
import AdminCatalogManager from './components/admin/AdminCatalogManager';
import AdminSimulationManager from './components/admin/AdminSimulationManager';
import AdminDocumentsRagManager from './components/admin/AdminDocumentsRagManager';
import AdminBlogManager from './components/admin/AdminBlogManager';

export default function App() {
  const [currentPath, setCurrentPath] = useState(getHashPath());

  useEffect(() => {
    // Listen to hash shifts
    const handleHashChange = () => {
      setCurrentPath(getHashPath());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function getHashPath(): string {
    const hash = window.location.hash; // e.g. "#/tutor"
    if (!hash || hash === '#/') return '/';
    return hash.replace(/^#/, ''); // e.g. "/tutor"
  }

  const navigateTo = (path: string) => {
    window.location.hash = `#${path}`;
    setCurrentPath(path);
  };

  // Render proper views base on hash route path
  const renderView = () => {
    // 1. Parse slugs inside blog routes if present
    if (currentPath.startsWith('/blog/')) {
      const slug = currentPath.substring(6); // Extract slug
      return <BlogWorkspace initialSlug={slug} onNavigate={navigateTo} />;
    }

    switch (currentPath) {
      case '/':
        return <LandingHero onNavigate={navigateTo} />;
      
      case '/catalog':
        return <CatalogBrowser onNavigate={navigateTo} />;
      
      case '/blog':
        return <BlogWorkspace onNavigate={navigateTo} />;

      case '/login':
        return <LoginBlock onNavigate={navigateTo} />;

      case '/register':
        return <RegisterBlock onNavigate={navigateTo} />;

      case '/dashboard':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <StudentDashboard onNavigate={navigateTo} />
          </AuthGuard>
        );

      case '/tutor':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <TutorInbox />
          </AuthGuard>
        );

      // Admin Channels
      case '/admin/catalog':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <AdminGate onRedirect={navigateTo}>
              <AdminCatalogManager />
            </AdminGate>
          </AuthGuard>
        );

      case '/admin/simulations':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <AdminGate onRedirect={navigateTo}>
              <AdminSimulationManager />
            </AdminGate>
          </AuthGuard>
        );

      case '/admin/documents':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <AdminGate onRedirect={navigateTo}>
              <AdminDocumentsRagManager />
            </AdminGate>
          </AuthGuard>
        );

      case '/admin/blog':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <AdminGate onRedirect={navigateTo}>
              <AdminBlogManager />
            </AdminGate>
          </AuthGuard>
        );

      default:
        // Graceful landing fallback
        return <LandingHero onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFE] text-slate-800 dark:bg-[#090A0F] dark:text-slate-100 transition-colors duration-300 antialiased font-sans">
      
      {/* Global Navbar */}
      <Navbar currentPath={currentPath} onNavigate={navigateTo} />

      {/* Main Pages Content with transition effects */}
      <main className="flex-1 transition-all">
        {renderView()}
      </main>

      {/* Footer Area */}
      <footer className="shrink-0 bg-white border-t border-slate-150 dark:bg-slate-950 dark:border-slate-850 p-6 select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
          <span>&copy; {new Date().getFullYear()} LEARNIVERSE AI SYSTEMS &bull; SECURE ACADEMIC LABS</span>
          <div className="flex gap-4">
            <button onClick={() => navigateTo('/')} className="hover:text-blue-500">Home</button>
            <button onClick={() => navigateTo('/catalog')} className="hover:text-blue-500">Catalog</button>
            <button onClick={() => navigateTo('/blog')} className="hover:text-blue-500">Dictionary Info</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
