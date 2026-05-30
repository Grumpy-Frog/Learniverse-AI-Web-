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
import UserProfile from './components/profile/UserProfile';

// Admin Pages
import AdminCatalogManager from './components/admin/AdminCatalogManager';
import AdminSimulationManager from './components/admin/AdminSimulationManager';
import AdminDocumentsPage from './components/admin/AdminDocumentsPage';
import AdminBlogManager from './components/admin/AdminBlogManager';
import AdminBlogNew from './components/admin/AdminBlogNew';

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
    // Determine base path by stripping query parameters if present
    const basePath = currentPath.split('?')[0];
    const isTutorPage = basePath === '/tutor';

    // 1. Parse slugs inside blog routes if present
    if (basePath.startsWith('/blog/')) {
      const slug = basePath.substring(6); // Extract slug
      return <BlogWorkspace initialSlug={slug} onNavigate={navigateTo} />;
    }

    switch (basePath) {
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

      case '/profile':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <UserProfile onNavigate={navigateTo} />
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
              <AdminDocumentsPage />
            </AdminGate>
          </AuthGuard>
        );

      case '/admin/blog':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <AdminGate onRedirect={navigateTo}>
              <AdminBlogManager onNavigate={navigateTo} />
            </AdminGate>
          </AuthGuard>
        );

      case '/admin/blog/new':
        return (
          <AuthGuard onRedirect={navigateTo}>
            <AdminGate onRedirect={navigateTo}>
              <AdminBlogNew onNavigate={navigateTo} />
            </AdminGate>
          </AuthGuard>
        );

      default:
        // Graceful landing fallback
        return <LandingHero onNavigate={navigateTo} />;
    }
  };

  const isTutorPage = currentPath.split('?')[0] === '/tutor';

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 antialiased font-sans overflow-hidden">
      
      {/* Global Navbar */}
      <Navbar currentPath={currentPath} onNavigate={navigateTo} />

      {/* Main Pages Content with transition effects */}
      <main className={`flex-1 w-full min-h-0 ${isTutorPage ? '' : 'max-w-7xl mx-auto px-4 xl:px-8 py-6 pb-24 overflow-y-auto'}`}>
        {renderView()}
      </main>

      {/* Footer Area */}
      {!isTutorPage && (
        <footer className="shrink-0 bg-[var(--glass-bg)] border-t border-[var(--glass-border)] backdrop-blur-[20px] p-6 select-none relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
            <span>&copy; {new Date().getFullYear()} LEARNIVERSE AI &bull; BILINGUAL TUTOR SERVER</span>
            <div className="flex gap-4">
              <button onClick={() => navigateTo('/')} className="hover:text-[var(--accent-primary)] transition-colors">Home</button>
              <button onClick={() => navigateTo('/catalog')} className="hover:text-[var(--accent-primary)] transition-colors">Syllabus</button>
              <button onClick={() => navigateTo('/blog')} className="hover:text-[var(--accent-primary)] transition-colors">Journal</button>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
