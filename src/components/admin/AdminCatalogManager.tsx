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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase mb-1">Administrative Workspace</span>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] heading-font">
          CURRICULUM BUILDER & CATALOG
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl font-semibold">
          Manage, browse, and structure grades, courses, modules, chapters, and individual topic learning criteria.
        </p>
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
            <div className="flex items-center gap-1.5 border-b border-[var(--glass-border)] pb-2.5">
              <span className="p-1.5 bg-[var(--bg-surface)] rounded-lg text-[var(--accent-primary)] shrink-0">
                <Hammer className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] block">Hierarchy Browser</span>
                <span className="text-xs font-black uppercase text-[var(--text-primary)] heading-font">Active Course Structure</span>
              </div>
            </div>

            {loader.list && <LoadingState message="Connecting to dictionary catalog database servers..." size="sm" />}

            {/* Selector boxes */}
            <div className="space-y-4">
              {/* Select Grade level */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Class / Grade level</label>
                <select
                  value={selectedGradeId}
                  onChange={(e) => handleSelectGrade(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  <option value="">-- Choose Grade Level --</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.slug})</option>
                  ))}
                </select>
              </div>

              {/* Select Subject link */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Subject Context</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSelectSubject(e.target.value)}
                  disabled={!selectedGradeId}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-50"
                >
                  <option value="">-- Choose Subject Context --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>
                  ))}
                </select>
              </div>

              {/* Select Chapter link */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Chapter Context</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => handleSelectChapter(e.target.value)}
                  disabled={!selectedSubjectId}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-50"
                >
                  <option value="">-- Choose Chapter Context --</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>Chapter {c.chapter_number}: {c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of currently associated topics preview */}
            {selectedChapterId && !loader.list && (
              <div className="pt-4 border-t border-[var(--glass-border)] space-y-2">
                <span className="text-[9px] uppercase font-bold text-[var(--accent-primary)] block tracking-wider">Topics Linked in Chapter ({topics.length})</span>
                {topics.length === 0 ? (
                  <p className="text-[11px] text-[var(--text-secondary)] italic">No topics under this chapter yet. Creating the first one on the right!</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {topics.map(t => (
                      <div key={t.id} className="p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--glass-border)] text-xs font-medium flex justify-between items-center text-[var(--text-primary)]">
                        <span className="truncate">{t.title}</span>
                        <span className="text-[8px] uppercase tracking-wide px-1 rounded bg-[var(--glass-bg)] text-[var(--text-secondary)] shrink-0 font-mono border border-[var(--glass-border)]">Order {t.display_order}</span>
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

          {/* Form 1: Add new grade level */}
          <Card className="p-5 flex flex-col gap-4">
            <details className="outline-hidden" open={!selectedGradeId}>
              <summary className="font-bold text-[14px] text-[var(--text-primary)] cursor-pointer select-none flex justify-between items-center border-b border-[var(--glass-border)] pb-2.5 outline-hidden heading-font">
                <span>01 / ADD GRADE LEVEL</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
              </summary>
              
              <form onSubmit={handleCreateGrade} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Grade Name"
                    placeholder="e.g., Grade 10, Higher Secondary, O-Levels"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Slug (letters, numbers, dash)"
                    placeholder="e.g., class-10, o-level"
                    value={gradeForm.slug}
                    onChange={(e) => setGradeForm({ ...gradeForm, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-between items-center bg-[var(--bg-surface)] border border-[var(--glass-border)] p-3 rounded-lg gap-4">
                  <Input
                    label="Display order number"
                    type="number"
                    value={gradeForm.displayOrder}
                    onChange={(e) => setGradeForm({ ...gradeForm, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-[120px]"
                  />
                  <Button type="submit" size="sm" isLoading={loader.create}>
                    Create Grade Level
                  </Button>
                </div>
              </form>
            </details>
          </Card>

          {/* Form 2: Add sibling subjects */}
          <Card className="p-5 flex flex-col gap-4">
            <details className="outline-hidden" open={!!selectedGradeId && !selectedSubjectId}>
              <summary className="font-bold text-[14px] text-[var(--text-primary)] cursor-pointer select-none flex justify-between items-center border-b border-[var(--glass-border)] pb-2.5 outline-hidden heading-font">
                <span>02 / ADD SUBJECT ELEMENT</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
              </summary>

              <form onSubmit={handleCreateSubject} className="space-y-4 pt-4">
                {!selectedGradeId ? (
                  <p className="text-xs text-[var(--warning)] italic">Please select a Class / Grade Level on the Left to activate this builder Form.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Subject Name"
                        placeholder="e.g., Chemistry, Physics, Advanced Math"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Slug URL marker"
                        placeholder="e.g., chemistry, physics-advanced"
                        value={subjectForm.slug}
                        onChange={(e) => setSubjectForm({ ...subjectForm, slug: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label="Course Description Summary"
                      placeholder="e.g., Comprehensive organic chemistry syllabus, molecular physics models."
                      value={subjectForm.description}
                      onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    />
                    <div className="flex justify-between items-center bg-[var(--bg-surface)] border border-[var(--glass-border)] p-3 rounded-lg gap-4">
                      <Input
                        label="Display order"
                        type="number"
                        value={subjectForm.displayOrder}
                        onChange={(e) => setSubjectForm({ ...subjectForm, displayOrder: parseInt(e.target.value) || 1 })}
                        className="w-[120px]"
                      />
                      <Button type="submit" size="sm" isLoading={loader.create}>
                        Add Subject Context
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </details>
          </Card>

          {/* Form 3: Add new Chapter details */}
          <Card className="p-5 flex flex-col gap-4">
            <details className="outline-hidden" open={!!selectedSubjectId && !selectedChapterId}>
              <summary className="font-bold text-[14px] text-[var(--text-primary)] cursor-pointer select-none flex justify-between items-center border-b border-[var(--glass-border)] pb-2.5 outline-hidden heading-font">
                <span>03 / ADD CHAPTER OR MODULE</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
              </summary>

              <form onSubmit={handleCreateChapter} className="space-y-4 pt-4">
                {!selectedSubjectId ? (
                  <p className="text-xs text-[var(--warning)] italic">Select a Grade Level & Subject on the Left Browser to unlock Chapter inputs.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-3">
                        <Input
                          label="Chapter No"
                          type="number"
                          value={chapterForm.chapterNumber}
                          onChange={(e) => setChapterForm({ ...chapterForm, chapterNumber: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                      <div className="sm:col-span-9">
                        <Input
                          label="Title of Chapter"
                          placeholder="e.g., Organic Compounds, Newton's Laws"
                          value={chapterForm.title}
                          onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Input
                      label="Chapter Slug URL"
                      placeholder="e.g., chapter-1-organic-acids"
                      value={chapterForm.slug}
                      onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                      required
                    />
                    <Input
                      label="Explanation summary"
                      placeholder="Brief overview of lessons contained in this file module."
                      value={chapterForm.description}
                      onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                    />
                    <div className="flex justify-end p-2">
                      <Button type="submit" size="sm" isLoading={loader.create}>
                        Add Chapter details
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </details>
          </Card>

          {/* Form 4: Add exact Learning Topic details */}
          <Card className="p-5 flex flex-col gap-4">
            <details className="outline-hidden" open={!!selectedChapterId}>
              <summary className="font-bold text-[14px] text-[var(--text-primary)] cursor-pointer select-none flex justify-between items-center border-b border-[var(--glass-border)] pb-2.5 outline-hidden heading-font">
                <span>04 / ADD SPECIFIC STUDY TOPIC</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
              </summary>

              <form onSubmit={handleCreateTopic} className="space-y-4 pt-4">
                {!selectedChapterId ? (
                  <p className="text-xs text-[var(--warning)] italic">Select a Class & Subject & Chapter on the Left Browser to unlock detailed Topic entries.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Topic Title"
                        placeholder="e.g., Alkanes properties, Force Vector Sums"
                        value={topicForm.title}
                        onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                        required
                      />
                      <Input
                        label="Topic Slug"
                        placeholder="e.g., alkanes-properties"
                        value={topicForm.slug}
                        onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label="Syllabus Learning Objectives (Exposed to AI & Student)"
                      placeholder="e.g., Describe chemical processes inside covalent bonds of alkenes."
                      value={topicForm.learningObjective}
                      onChange={(e) => setTopicForm({ ...topicForm, learningObjective: e.target.value })}
                      required
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                        General Brief / Explanatory Description
                      </label>
                      <textarea
                        value={topicForm.description}
                        onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                        placeholder="Detailed academic summary of this topic..."
                        className="w-full min-h-[90px] p-2.5 rounded-[12px] border text-sm transition-all duration-200 outline-hidden bg-[var(--bg-surface)] backdrop-blur-sm text-[var(--text-primary)] border-[var(--glass-border)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)]"
                        required
                      />
                    </div>
                    <div className="flex justify-between items-center bg-[var(--bg-surface)] border border-[var(--glass-border)] p-3 rounded-lg gap-4">
                      <Input
                        label="Display order"
                        type="number"
                        value={topicForm.displayOrder}
                        onChange={(e) => setTopicForm({ ...topicForm, displayOrder: parseInt(e.target.value) || 1 })}
                        className="w-[120px]"
                      />
                      <Button type="submit" size="sm" isLoading={loader.create}>
                        Add Study Topic
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
