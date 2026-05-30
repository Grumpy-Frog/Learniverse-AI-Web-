import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Grade, Subject, Chapter, Topic } from '../../../types';
import { ChevronRight, Bookmark, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface CatalogSelectorProps {
  selection: {
    gradeId: string | null;
    subjectId: string | null;
    chapterId: string | null;
    topicId: string | null;
  };
  onSelectionChange: (selection: any) => void;
}

export default function CatalogSelector({ selection, onSelectionChange }: CatalogSelectorProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (selection.gradeId) fetchSubjects(selection.gradeId);
    else { setSubjects([]); setChapters([]); setTopics([]); }
  }, [selection.gradeId]);

  useEffect(() => {
    if (selection.subjectId) fetchChapters(selection.subjectId);
    else { setChapters([]); setTopics([]); }
  }, [selection.subjectId]);

  useEffect(() => {
    if (selection.chapterId) fetchTopics(selection.chapterId);
    else { setTopics([]); }
  }, [selection.chapterId]);

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try { const res = await api.getGrades(); setGrades(res); } finally { setLoadingGrades(false); }
  };

  const fetchSubjects = async (gradeId: string) => {
    setLoadingSubjects(true);
    try { const res = await api.getSubjects(gradeId); setSubjects(res); } finally { setLoadingSubjects(false); }
  };

  const fetchChapters = async (subjectId: string) => {
    setLoadingChapters(true);
    try { const res = await api.getChapters(subjectId); setChapters(res); } finally { setLoadingChapters(false); }
  };

  const fetchTopics = async (chapterId: string) => {
    setLoadingTopics(true);
    try { const res = await api.getTopics(chapterId); setTopics(res); } finally { setLoadingTopics(false); }
  };

  return (
    <div className="space-y-4">
      {/* Grade Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest pl-1">Grade</label>
        <select 
          value={selection.gradeId || ''} 
          onChange={(e) => onSelectionChange({ ...selection, gradeId: e.target.value, subjectId: null, chapterId: null, topicId: null })}
          className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-colors"
        >
          <option value="">Select Grade</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Subject Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest pl-1">Subject</label>
        <select 
          value={selection.subjectId || ''} 
          disabled={!selection.gradeId}
          onChange={(e) => onSelectionChange({ ...selection, subjectId: e.target.value, chapterId: null, topicId: null })}
          className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none disabled:opacity-30 focus:border-indigo-500/50 transition-colors"
        >
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Chapter Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest pl-1">Chapter</label>
        <select 
          value={selection.chapterId || ''} 
          disabled={!selection.subjectId}
          onChange={(e) => onSelectionChange({ ...selection, chapterId: e.target.value, topicId: null })}
          className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none disabled:opacity-30 focus:border-indigo-500/50 transition-colors"
        >
          <option value="">Select Chapter</option>
          {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* Topic Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest pl-1">Target Topic</label>
        <select 
          value={selection.topicId || ''} 
          disabled={!selection.chapterId}
          onChange={(e) => onSelectionChange({ ...selection, topicId: e.target.value })}
          className="w-full bg-indigo-600/10 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm font-black text-indigo-400 outline-none disabled:opacity-30 focus:border-indigo-500 transition-colors"
        >
          <option value="">Select Topic</option>
          {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {/* Visual Context Breadcrumbs if all selected */}
      {selection.topicId && (
        <div className="pt-4 animate-in fade-in slide-in-from-top-1">
           <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Active Indexing Scope</span>
              </div>
              <p className="text-[11px] font-bold text-slate-300 leading-tight">
                Current topic is locked for RAG chunk mapping. All indexed fragments will be grounded to this topic node.
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
