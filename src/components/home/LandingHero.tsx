import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Sparkles, PlayCircle, BookOpen, Atom, Library, ShieldCheck } from 'lucide-react';

interface LandingHeroProps {
  onNavigate: (route: string) => void;
}

export default function LandingHero({ onNavigate }: LandingHeroProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center space-y-16 select-none">
      
      {/* Hero Headline visual cards */}
      <div className="space-y-6 max-w-3xl mx-auto py-6">
        
        <div className="flex justify-center items-center gap-1.5 mb-1.5 animate-bounce">
          <Badge variant="source_grounded">PHYSICS &bull; CHEMISTRY &bull; BIOLOGY &bull; MATHEMATICS</Badge>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white heading-font leading-[1.1]">
          Learniverse <span className="text-[#38BDF8]">AI Classroom</span>
        </h1>
        
        <p className="text-sm md:text-lg text-slate-600 dark:text-slate-350 leading-relaxed font-semibold max-w-2xl mx-auto">
          Tailored diagnostic quizzes, interactable labs, and vector grounded textbook studies compiled seamlessly to address individual academic weaknesses.
        </p>

        {/* Buttons flow controls */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button size="lg" className="px-6 rounded-xl font-black uppercase text-xs tracking-wider" onClick={() => onNavigate('/catalog')}>
            Browse Curriculum Catalog
          </Button>
          <Button size="lg" variant="secondary" className="px-6 rounded-xl font-bold uppercase text-xs tracking-wider bg-slate-905 border-slate-700 text-white dark:bg-white dark:text-slate-950" onClick={() => onNavigate('/register')}>
            Create Student Account
          </Button>
        </div>
      </div>

      {/* Visual Bento Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="p-6 md:p-8 text-left border-neutral-150 bg-white/60 dark:bg-slate-900/50 flex flex-col justify-between h-full space-y-4">
          <span className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl w-fit block border border-blue-500/10 shrink-0">
            <Atom className="h-5 w-5 animate-spin-slow" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-901 dark:text-white heading-font uppercase">
              INTERACTABLE LABS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Explore HTML5 simulations, PhET interactive physical formulas, and molecular dynamics visually mapped with specific chapters.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('/catalog')}
            className="text-[11px] font-bold text-blue-500 uppercase tracking-wider hover:underline flex items-center justify-start gap-1"
          >
            Open Lab Simulations &rarr;
          </button>
        </Card>

        <Card className="p-6 md:p-8 text-left border-neutral-150 bg-white/60 dark:bg-slate-900/50 flex flex-col justify-between h-full space-y-4">
          <span className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit block border border-indigo-505/10 shrink-0">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-901 dark:text-white heading-font uppercase">
              AI CHAT DIALOGUES
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Synthesize scenario narrations, ask clarifying questions, and chat dialectically in English or Bangla using verified textbook references.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('/login')}
            className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider hover:underline flex items-center justify-start gap-1"
          >
            Launch AI Study Desk &rarr;
          </button>
        </Card>

        <Card className="p-6 md:p-8 text-left border-neutral-150 bg-white/60 dark:bg-slate-900/50 flex flex-col justify-between h-full space-y-4">
          <span className="p-2.5 bg-emerald-500/10 text-emerald-505 rounded-xl w-fit block border border-emerald-500/10 shrink-0">
            <Library className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-901 dark:text-white heading-font uppercase">
              DIAGNOSTICS & REMEDIALS
            </h3>
            <p className="text-xs text-slate-505 dark:text-slate-450 font-semibold leading-relaxed">
              Trigger quick short-answer checks, generate full MCQ quizzes, and resolve concept weakness flags with tailored remediation lessons.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('/catalog')}
            className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider hover:underline flex items-center justify-start gap-1"
          >
            Test Learning Diagnostics &rarr;
          </button>
        </Card>

      </div>

      {/* Trust section */}
      <div className="max-w-2xl mx-auto border-t border-slate-105 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-emerald-505" /> Fully secure textbook chunking and vector indices database.
        </span>
        <span>
          Base URL Grounded securely on Render API
        </span>
      </div>

    </div>
  );
}
