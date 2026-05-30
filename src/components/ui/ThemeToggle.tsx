import React, { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';

const THEMES = [
  { id: 'default', label: 'Cosmic Dark', color: '#0A0E27' },
  { id: 'theme-light', label: 'Clean Light', color: '#F0F2F8' },
  { id: 'theme-ocean', label: 'Ocean Blue', color: '#0C1929' },
  { id: 'theme-warm', label: 'Warm Sunset', color: '#1A1410' },
  { id: 'theme-purple', label: 'Purple Dream', color: '#120B1A' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState('default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read on load
    const savedTheme = localStorage.getItem('phymentor_theme') || 'default';
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('phymentor_theme', newTheme);
    
    // Clear all existing theme classes
    THEMES.forEach(t => {
      if (t.id !== 'default') document.documentElement.classList.remove(t.id);
    });
    
    // Apply new theme class if not default
    if (newTheme !== 'default') {
      document.documentElement.classList.add(newTheme);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] backdrop-blur-md transition-all duration-200 cursor-pointer focus:outline-hidden"
        aria-label="Toggle theme"
        title="Switch Theme"
      >
        <Settings2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--bg-primary)] border border-[var(--glass-border)] shadow-xl overflow-hidden z-50">
          <div className="p-2 flex flex-col gap-1 backdrop-blur-3xl bg-[var(--glass-bg)]">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  applyTheme(t.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-surface)] ${theme === t.id ? 'bg-[var(--glass-bg)] font-bold border border-[var(--glass-border)]' : 'font-medium border border-transparent'}`}
              >
                <div 
                  className="w-4 h-4 rounded-full border border-white/20" 
                  style={{ backgroundColor: t.color }}
                />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem('phymentor_theme') || 'default';
  if (savedTheme !== 'default') {
    document.documentElement.classList.add(savedTheme);
  }
}
