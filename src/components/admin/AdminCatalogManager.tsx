import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Grade, Subject, Chapter, Topic } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import { PlusCircle, Folder, Layers, BookOpen, Hammer, Sparkles, ChevronDown } from 'lucide-react';

export default function AdminCatalogManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Selection
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Creation States
  const [loader, setLoader] = useState({ list: false, create: false });
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forms Payload
  const [gradeForm, setGradeForm] = useState({ name: '', slug: '', displayOrder: 1 });
  const [subjectForm, setSubjectForm] = useState({ name: '', slug: '', description: '', displayOrder: 1 });
  const [chapterForm, setChapterForm] = useState({ title: '', slug: '', description: '', chapterNumber: 1 });
  const [topicForm, setTopicForm] = useState({ title: '', slug: '', description: '', learningObjective: '', displayOrder: 1 });

  // Load initial Grades
  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setLoader(prev => ({ ...prev, list: true }));
    try {
      const g = await api.getGrades();
      setGrades(g || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: `Failed to load catalog levels: ${e.message}` });
    } finally {
      setLoader(prev => ({ ...prev, list: false }));
    }
  };

  const handleSelectGrade = async (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSubjects([]);
    setChapters([]);
    setTopics([]);

    if (!gradeId) return;
    setLoader(prev => ({ ...prev, list: true }));
    try {
      const s = await api.getSubjects(gradeId);
      setSubjects(s || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: `Failed to fetch subjects: ${e.message}` });
    } finally {
      setLoader(prev => ({ ...prev, list: false }));
    }
  };

  const handleSelectSubject = async (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    setChapters([]);
    setTopics([]);

    if (!subjectId) return;
    setLoader(prev => ({ ...prev, list: true }));
    try {
      const c = await api.getChapters(subjectId);
      setChapters(c || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: `Failed to fetch chapters: ${e.message}` });
    } finally {
      setLoader(prev => ({ ...prev, list: false }));
    }
  };

  const handleSelectChapter = async (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setTopics([]);

    if (!chapterId) return;
    setLoader(prev => ({ ...prev, list: true }));
    try {
      const t = await api.getTopics(chapterId);
      setTopics(t || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: `Failed to fetch topics: ${e.message}` });
    } finally {
      setLoader(prev => ({ ...prev, list: false }));
    }
  };

  // Create handlers
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.name.trim() || !gradeForm.slug.trim()) return;

    setLoader(prev => ({ ...prev, create: true }));
    setFeedbackMsg(null);
    try {
      await api.createGrade(gradeForm.name, gradeForm.slug, gradeForm.displayOrder);
      setFeedbackMsg({ type: 'success', text: `Grade "${gradeForm.name}" created successfully!` });
      setGradeForm({ name: '', slug: '', displayOrder: 1 });
      fetchGrades();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error occurred while creating grade level.' });
    } finally {
      setLoader(prev => ({ ...prev, create: false }));
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradeId) {
      setFeedbackMsg({ type: 'error', text: 'Select a parent grade category first.' });
      return;
    }
    if (!subjectForm.name.trim() || !subjectForm.slug.trim()) return;

    setLoader(prev => ({ ...prev, create: true }));
    setFeedbackMsg(null);
    try {
      await api.createSubject(
        selectedGradeId,
        subjectForm.name,
        subjectForm.slug,
        subjectForm.description,
        subjectForm.displayOrder
      );
      setFeedbackMsg({ type: 'success', text: `Subject "${subjectForm.name}" successfully created!` });
      setSubjectForm({ name: '', slug: '', description: '', displayOrder: 1 });
      handleSelectGrade(selectedGradeId);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error creating Subject.' });
    } finally {
      setLoader(prev => ({ ...prev, create: false }));
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setFeedbackMsg({ type: 'error', text: 'Specify a parent Subject link first.' });
      return;
    }
    if (!chapterForm.title.trim() || !chapterForm.slug.trim()) return;

    setLoader(prev => ({ ...prev, create: true }));
    setFeedbackMsg(null);
    try {
      await api.createChapter(
        selectedSubjectId,
        chapterForm.chapterNumber,
        chapterForm.title,
        chapterForm.slug,
        chapterForm.description
      );
      setFeedbackMsg({ type: 'success', text: `Chapter "${chapterForm.title}" successfully loaded!` });
      setChapterForm({ title: '', slug: '', description: '', chapterNumber: 1 });
      handleSelectSubject(selectedSubjectId);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error uploading chapter.' });
    } finally {
      setLoader(prev => ({ ...prev, create: false }));
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) {
      setFeedbackMsg({ type: 'error', text: 'Choose a parent Chapter link first.' });
      return;
    }
    if (!topicForm.title.trim() || !topicForm.slug.trim()) return;

    setLoader(prev => ({ ...prev, create: true }));
    setFeedbackMsg(null);
    try {
      await api.createTopic(
        selectedChapterId,
        topicForm.title,
        topicForm.slug,
        topicForm.description,
        topicForm.learningObjective,
        topicForm.displayOrder
      );
      setFeedbackMsg({ type: 'success', text: `Topic "${topicForm.title}" successfully added!` });
      setTopicForm({ title: '', slug: '', description: '', learningObjective: '', displayOrder: 1 });
      handleSelectChapter(selectedChapterId);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error provisioning Topic.' });
    } finally {
      setLoader(prev => ({ ...prev, create: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-2 block">Administrative Control</span>
          <h1 className="text-4xl font-black tracking-tight text-white heading-font">
            Curriculum Core
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl font-medium leading-relaxed">
            Architect the learning hierarchy. Define classes, map subject domains, and structure modular chapters with granular study topics.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Database Sync Active</span>
           </div>
        </div>
      </div>

      {feedbackMsg && (
        <StatusMessage
          type={feedbackMsg.type === 'success' ? 'success' : 'error'}
          message={feedbackMsg.text}
        />
      )}

      {/* Main Grid: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left browser console */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-slate-500 block tracking-widest">Hierarchy Explorer</span>
                <span className="text-xs font-black uppercase text-white tracking-widest">Active Schema View</span>
              </div>
            </div>

            {loader.list && <LoadingState message="Indexing Catalog..." size="sm" />}

            {/* Selector boxes */}
            <div className="space-y-5">
              {/* Select Grade level */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-slate-600 block tracking-widest pl-1">Academic Level</label>
                <select
                  value={selectedGradeId}
                  onChange={(e) => handleSelectGrade(e.target.value)}
                  className="w-full text-xs font-bold p-3.5 rounded-xl border border-white/5 bg-slate-950 text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer"
                >
                  <option value="">-- Choose Grade Level --</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Subject link */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-slate-600 block tracking-widest pl-1">Subject Domain</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSelectSubject(e.target.value)}
                  disabled={!selectedGradeId}
                  className="w-full text-xs font-bold p-3.5 rounded-xl border border-white/5 bg-slate-950 text-white outline-none focus:border-indigo-500/30 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Chapter link */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-slate-600 block tracking-widest pl-1">Module / Chapter</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => handleSelectChapter(e.target.value)}
                  disabled={!selectedSubjectId}
                  className="w-full text-xs font-bold p-3.5 rounded-xl border border-white/5 bg-slate-950 text-white outline-none focus:border-indigo-500/30 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>Cap. {c.chapter_number}: {c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of currently associated topics preview */}
            {selectedChapterId && !loader.list && (
              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-black text-indigo-400 block tracking-[0.2em]">Mapped Topics ({topics.length})</span>
                </div>
                {topics.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No nodes mapped yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {topics.map(t => (
                      <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-white/5 text-[11px] font-bold flex justify-between items-center text-slate-300 group hover:border-indigo-500/20 transition-all">
                        <span className="truncate pr-2">{t.title}</span>
                        <span className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-slate-500">#{t.display_order}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </Card>
        </div>

        {/* Right Forms console */}
        <div className="lg:col-span-7 space-y-6">

          <Card className="p-8 bg-slate-900 border-white/5 flex flex-col gap-6 rounded-[2rem]">
            <details className="outline-hidden group" open={!selectedGradeId}>
              <summary className="font-black text-xs text-white cursor-pointer select-none flex justify-between items-center border-b border-white/5 pb-4 outline-hidden tracking-[0.2em]">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                     <PlusCircle className="h-4 w-4 text-indigo-500" />
                   </div>
                   <span>01 / ADD GRADE LEVEL</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-600 group-open:rotate-180 transition-transform" />
              </summary>
              
              <form onSubmit={handleCreateGrade} className="space-y-6 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Grade Name"
                    placeholder="e.g., Grade 10"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Slug Identifier"
                    placeholder="e.g., class-10"
                    value={gradeForm.slug}
                    onChange={(e) => setGradeForm({ ...gradeForm, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between p-6 bg-slate-950 rounded-2xl border border-white/5 gap-6">
                  <div className="w-full sm:w-[140px]">
                    <Input
                      label="Order"
                      type="number"
                      value={gradeForm.displayOrder}
                      onChange={(e) => setGradeForm({ ...gradeForm, displayOrder: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <Button type="submit" variant="primary" size="md" isLoading={loader.create} className="w-full sm:w-auto shadow-xl shadow-indigo-600/20">
                    <Sparkles className="h-4 w-4 mr-2" /> Create Level
                  </Button>
                </div>
              </form>
            </details>
          </Card>

          {/* Form 2: Add sibling subjects */}
          <Card className="p-8 bg-slate-900 border-white/5 flex flex-col gap-6 rounded-[2rem]">
            <details className="outline-hidden group" open={!!selectedGradeId && !selectedSubjectId}>
              <summary className="font-black text-xs text-white cursor-pointer select-none flex justify-between items-center border-b border-white/5 pb-4 outline-hidden tracking-[0.2em]">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                     <BookOpen className="h-4 w-4 text-blue-500" />
                   </div>
                   <span>02 / ADD SUBJECT ELEMENT</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-600 group-open:rotate-180 transition-transform" />
              </summary>

              <form onSubmit={handleCreateSubject} className="space-y-6 pt-8">
                {!selectedGradeId ? (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-black uppercase text-amber-500/70 tracking-widest text-center">
                    Locked: Select parent level in explorer
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Input
                        label="Subject Title"
                        placeholder="e.g., Physics"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Slug URL"
                        placeholder="e.g., physics"
                        value={subjectForm.slug}
                        onChange={(e) => setSubjectForm({ ...subjectForm, slug: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label="Summary description"
                      placeholder="e.g., Comprehensive physics core syllabus"
                      value={subjectForm.description}
                      onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between p-6 bg-slate-950 rounded-2xl border border-white/5 gap-6">
                      <div className="w-full sm:w-[140px]">
                        <Input
                          label="Order"
                          type="number"
                          value={subjectForm.displayOrder}
                          onChange={(e) => setSubjectForm({ ...subjectForm, displayOrder: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <Button type="submit" variant="primary" size="md" isLoading={loader.create} className="w-full sm:w-auto shadow-xl shadow-indigo-600/20">
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Subject
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </details>
          </Card>

          {/* Form 3: Add new Chapter details */}
          <Card className="p-8 bg-slate-900 border-white/5 flex flex-col gap-6 rounded-[2rem]">
            <details className="outline-hidden group" open={!!selectedSubjectId && !selectedChapterId}>
              <summary className="font-black text-xs text-white cursor-pointer select-none flex justify-between items-center border-b border-white/5 pb-4 outline-hidden tracking-[0.2em]">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                     <Folder className="h-4 w-4 text-emerald-500" />
                   </div>
                   <span>03 / ADD CHAPTER OR MODULE</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-600 group-open:rotate-180 transition-transform" />
              </summary>

              <form onSubmit={handleCreateChapter} className="space-y-6 pt-8">
                {!selectedSubjectId ? (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-black uppercase text-amber-500/70 tracking-widest text-center">
                    Locked: Select parent subject domain
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                      <div className="sm:col-span-3">
                        <Input
                          label="No."
                          type="number"
                          value={chapterForm.chapterNumber}
                          onChange={(e) => setChapterForm({ ...chapterForm, chapterNumber: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                      <div className="sm:col-span-9">
                        <Input
                          label="Chapter Title"
                          placeholder="e.g., Newton's Laws"
                          value={chapterForm.title}
                          onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Input
                      label="Slug"
                      placeholder="e.g., chapter-1-laws"
                      value={chapterForm.slug}
                      onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                      required
                    />
                    <Input
                      label="Description"
                      placeholder="Brief overview of module..."
                      value={chapterForm.description}
                      onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                    />
                    <div className="flex justify-end pt-4">
                      <Button type="submit" variant="primary" size="md" isLoading={loader.create} className="w-full sm:w-auto shadow-xl shadow-indigo-600/20">
                        <Sparkles className="h-4 w-4 mr-2" /> Push Module
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </details>
          </Card>

          {/* Form 4: Add exact Learning Topic details */}
          <Card className="p-8 bg-slate-900 border-white/5 flex flex-col gap-6 rounded-[2rem]">
            <details className="outline-hidden group" open={!!selectedChapterId}>
              <summary className="font-black text-xs text-white cursor-pointer select-none flex justify-between items-center border-b border-white/5 pb-4 outline-hidden tracking-[0.2em]">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                     <Hammer className="h-4 w-4 text-slate-300" />
                   </div>
                   <span>04 / ADD SPECIFIC STUDY TOPIC</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-600 group-open:rotate-180 transition-transform" />
              </summary>

              <form onSubmit={handleCreateTopic} className="space-y-6 pt-8">
                {!selectedChapterId ? (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-black uppercase text-amber-500/70 tracking-widest text-center">
                    Locked: Specify chapter context
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Input
                        label="Topic Title"
                        placeholder="e.g., Alkanes properties"
                        value={topicForm.title}
                        onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                        required
                      />
                      <Input
                        label="Slug"
                        placeholder="e.g., alkanes-props"
                        value={topicForm.slug}
                        onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label="Learning Objective"
                      placeholder="e.g., Describe process..."
                      value={topicForm.learningObjective}
                      onChange={(e) => setTopicForm({ ...topicForm, learningObjective: e.target.value })}
                      required
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 pl-1">
                        Topic Core Context
                      </label>
                      <textarea
                        value={topicForm.description}
                        onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                        placeholder="Academic briefing of this study node..."
                        className="w-full min-h-[120px] p-4 rounded-2xl border text-sm font-medium transition-all duration-200 outline-hidden bg-slate-950 text-white border-white/5 placeholder:text-slate-700 focus:border-indigo-500/30"
                        required
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between p-6 bg-slate-950 rounded-2xl border border-white/5 gap-6">
                      <div className="w-full sm:w-[140px]">
                        <Input
                          label="Order"
                          type="number"
                          value={topicForm.displayOrder}
                          onChange={(e) => setTopicForm({ ...topicForm, displayOrder: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <Button type="submit" variant="primary" size="md" isLoading={loader.create} className="w-full sm:w-auto shadow-xl shadow-indigo-600/20">
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Study Node
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </details>
          </Card>

        </div>

      </div>

    </div>
  );
}
