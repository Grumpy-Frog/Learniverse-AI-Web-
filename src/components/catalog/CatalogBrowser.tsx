import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Grade, Subject, Chapter, Topic, TopicStatus, SelectedTopicContext } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import StatusMessage from '../ui/StatusMessage';
import { BookOpen, HelpCircle, GraduationCap, Compass, Layers, CheckCircle, ChevronRight, Play, MessageSquare, AlertCircle } from 'lucide-react';

interface CatalogBrowserProps {
  onNavigate: (path: string, topicContext?: SelectedTopicContext) => void;
}

export default function CatalogBrowser({ onNavigate }: CatalogBrowserProps) {
  // Catalog selections
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Selected IDs
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Loaded Details
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeTopicStatus, setActiveTopicStatus] = useState<TopicStatus | null>(null);

  // States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial grades
  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getGrades();
      // Filter out inactive if set
      const activeGrades = data.filter((g: Grade) => g.is_active !== false);
      setGrades(activeGrades);
      
      if (activeGrades.length > 0) {
        // Auto select first grade
        setSelectedGradeId(activeGrades[0].id);
        fetchSubjects(activeGrades[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load curriculum grades.');
      setIsLoading(false);
    }
  };

  const fetchSubjects = async (gradeId: string) => {
    setIsLoadingSubjects(true);
    setErrorMsg(null);
    // Reset subordinate selections
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedTopicId('');
    setActiveTopic(null);
    setActiveTopicStatus(null);

    try {
      const data = await api.getSubjects(gradeId);
      const activeSubjects = data.filter((s: Subject) => s.is_active !== false);
      setSubjects(activeSubjects);
      
      if (activeSubjects.length > 0) {
        // Auto select first subject
        setSelectedSubjectId(activeSubjects[0].id);
        fetchChapters(activeSubjects[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load subjects for the selected grade.');
    } finally {
      setIsLoading(false);
      setIsLoadingSubjects(false);
    }
  };

  const fetchChapters = async (subjectId: string) => {
    setIsLoadingChapters(true);
    // Reset subordinates
    setChapters([]);
    setTopics([]);
    setSelectedChapterId('');
    setSelectedTopicId('');
    setActiveTopic(null);
    setActiveTopicStatus(null);

    try {
      const data = await api.getChapters(subjectId);
      const activeChapters = data.filter((c: Chapter) => c.is_active !== false);
      setChapters(activeChapters);

      if (activeChapters.length > 0) {
        setSelectedChapterId(activeChapters[0].id);
        fetchTopics(activeChapters[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load chapters.');
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const fetchTopics = async (chapterId: string) => {
    setIsLoadingTopics(true);
    setTopics([]);
    setSelectedTopicId('');
    setActiveTopic(null);
    setActiveTopicStatus(null);

    try {
      const data = await api.getTopics(chapterId);
      const activeTopics = data.filter((t: Topic) => t.is_active !== false);
      setTopics(activeTopics);

      if (activeTopics.length > 0) {
        setSelectedTopicId(activeTopics[0].id);
        fetchTopicDetail(activeTopics[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load topics for selected chapter.');
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const fetchTopicDetail = async (topicId: string) => {
    setIsLoadingDetail(true);
    setActiveTopic(null);
    setActiveTopicStatus(null);

    try {
      const [topicData, statusData] = await Promise.all([
        api.getTopicDetail(topicId),
        api.getTopicStatus(topicId).catch(() => null), // fail gracefully
      ]);

      setActiveTopic(topicData);
      
      if (statusData) {
        setActiveTopicStatus(statusData);
      } else {
        // Simulated start
        setActiveTopicStatus({
          topic_id: topicId,
          status: 'not_started',
          completion_percentage: 0,
          strengths: [],
          weaknesses: []
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not retrieve topic parameters.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSelectGrade = (id: string) => {
    setSelectedGradeId(id);
    fetchSubjects(id);
  };

  const handleSelectSubject = (id: string) => {
    setSelectedSubjectId(id);
    fetchChapters(id);
  };

  const handleSelectChapter = (id: string) => {
    setSelectedChapterId(id);
    fetchTopics(id);
  };

  const handleSelectTopic = (id: string) => {
    setSelectedTopicId(id);
    fetchTopicDetail(id);
  };

  // Build current selection context to store
  const getSelectedContext = (): SelectedTopicContext | null => {
    if (!activeTopic) return null;
    const grade = grades.find(g => g.id === selectedGradeId);
    const subject = subjects.find(s => s.id === selectedSubjectId);
    const chapter = chapters.find(c => c.id === selectedChapterId);

    return {
      grade_id: selectedGradeId,
      grade_name: grade?.name || 'Classroom',
      subject_id: selectedSubjectId,
      subject_name: subject?.name || 'Science',
      chapter_id: selectedChapterId,
      chapter_title: chapter?.title || 'General Chapter',
      topic_id: activeTopic.id,
      topic_title: activeTopic.title,
      topic_description: activeTopic.description,
      learning_objective: activeTopic.learning_objective || 'General science instruction'
    };
  };

  const handleOpenTutor = () => {
    const context = getSelectedContext();
    if (!context) return;
    
    // Save in sessionStorage
    sessionStorage.setItem('learniverse_selected_topic', JSON.stringify(context));
    // Route to tutor using callback
    onNavigate('/tutor', context);
  };

  // Render dynamic labels
  const getStatusBadge = (status?: 'not_started' | 'needs_practice' | 'completed') => {
    if (!status || status === 'not_started') return <Badge variant="not_started">Not Started</Badge>;
    if (status === 'needs_practice') return <Badge variant="needs_practice">Needs Practice</Badge>;
    if (status === 'completed') return <Badge variant="completed">✓ Completed</Badge>;
    return <Badge variant="not_started">Not Started</Badge>;
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Connecting to curriculum registries..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* Platform Title tracking in Swiss minimalism */}
      <div className="border-b border-black dark:border-white pb-3 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-mono font-black tracking-[0.25em] text-red-500 uppercase">
            Platform Curriculum Browser
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
            Browse Learning Paths
          </h1>
        </div>
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:block">
          Explore Grades • Chapters • Simulations
        </div>
      </div>

      {errorMsg && (
        <StatusMessage
          type="error"
          title="Curriculum Sync Failure"
          message={errorMsg}
          onRetry={fetchGrades}
        />
      )}

      {/* Grid structure indicating the "Artistic Flair" strict horizontal / vertical rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left browser columns (10/12 width or split) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main selection panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Grades Box */}
            <Card className="rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <GraduationCap className="h-4 w-4 text-rose-500 shrink-0" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">1. Target Grades</h3>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {grades.map(grade => (
                  <button
                    key={grade.id}
                    onClick={() => handleSelectGrade(grade.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-between border ${
                      selectedGradeId === grade.id
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                        : 'bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-neutral-850'
                    }`}
                  >
                    <span>{grade.name}</span>
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </button>
                ))}
                {grades.length === 0 && (
                  <p className="text-xs text-slate-400 p-2 italic">No active grades registered.</p>
                )}
              </div>
            </Card>

            {/* Subjects Box */}
            <Card className="rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Compass className="h-4 w-4 text-emerald-500 shrink-0" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">2. Science Majors</h3>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {isLoadingSubjects ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading disciplines...</div>
                ) : (
                  subjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => handleSelectSubject(subject.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-between border ${
                        selectedSubjectId === subject.id
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <span className="truncate">{subject.name}</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </button>
                  ))
                )}
                {!isLoadingSubjects && subjects.length === 0 && (
                  <p className="text-xs text-slate-400 p-2 italic">Select a grade first.</p>
                )}
              </div>
            </Card>

            {/* Chapters Box */}
            <Card className="rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Layers className="h-4 w-4 text-blue-500 shrink-0" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">3. Interactive Units</h3>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {isLoadingChapters ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading modules...</div>
                ) : (
                  chapters.map(chap => (
                    <button
                      key={chap.id}
                      onClick={() => handleSelectChapter(chap.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-between border ${
                        selectedChapterId === chap.id
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <span className="truncate">Ch {chap.chapter_number}: {chap.title}</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </button>
                  ))
                )}
                {!isLoadingChapters && chapters.length === 0 && (
                  <p className="text-xs text-slate-400 p-2 italic">Select a subject first.</p>
                )}
              </div>
            </Card>

          </div>

          {/* Topics Row list: Compact operational look */}
          <Card className="rounded-xl border border-slate-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  Available Topics to Practice
                </h3>
              </div>
              <span className="text-[10px] font-mono opacity-50 uppercase">
                {topics.length} topics identified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {isLoadingTopics ? (
                <div className="col-span-2 py-8"><LoadingState message="Discovering topics..." size="sm" /></div>
              ) : (
                topics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className={`flex flex-col p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none relative ${
                      selectedTopicId === topic.id
                        ? 'border-black dark:border-white bg-slate-50/50 dark:bg-slate-900/45 scale-[1.01] shadow-xs'
                        : 'border-slate-250 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-950/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        {topic.title}
                      </h4>
                      {selectedTopicId === topic.id && (
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate-3-lines leading-snug">
                      {topic.description || 'Practice AI stories, formulas, textbook search grounded definitions, and mock quiz sets.'}
                    </p>
                  </div>
                ))
              )}
              {!isLoadingTopics && topics.length === 0 && (
                <div className="col-span-2 py-8 text-center text-xs text-slate-450 dark:text-slate-500 italic">
                  Select a chapter to review specific core topics.
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* Selected Topic details viewport - strict vertical layout (Artistic Swiss layout) */}
        <div className="lg:col-span-4">
          <Card className="rounded-xl border-2 border-black dark:border-white p-6 bg-slate-50/60 dark:bg-neutral-900/10 sticky top-24">
            
            <div className="space-y-1 mb-5">
              <div className="text-[9px] font-mono font-black tracking-[0.2em] text-red-500 uppercase">
                Active Context Parameter
              </div>
              <div className="w-8 h-0.5 bg-black dark:bg-white mb-2"></div>
            </div>

            {isLoadingDetail ? (
              <div className="py-12"><LoadingState message="Extracting detail summaries..." size="sm" /></div>
            ) : activeTopic ? (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
                      Topic detail
                    </span>
                    {getStatusBadge(activeTopicStatus?.status)}
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-950 dark:text-white leading-tight">
                    {activeTopic.title}
                  </h2>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-extrabold block">
                    Goal & Learning Objective
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-250 dark:border-slate-800">
                    {activeTopic.learning_objective || 'Build intuitive and physical conceptual grasp via story guides, textbook content & numerical tests.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-extrabold block">
                    Topic Synopsis
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {activeTopic.description || 'No detailed abstract recorded for this curriculum point.'}
                  </p>
                </div>

                {activeTopicStatus && activeTopicStatus.completion_percentage > 0 && (
                  <div className="space-y-1 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span>Interactive Completion</span>
                      <span>{activeTopicStatus.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${activeTopicStatus.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Primary launcher call to action */}
                <div className="pt-2">
                  <Button
                    onClick={handleOpenTutor}
                    variant="primary"
                    className="w-full uppercase py-3.5 tracking-widest font-black text-xs inline-flex items-center gap-2 justify-center"
                  >
                    <MessageSquare className="h-4 w-4" /> Open In Tutor Space
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Select any curriculum point on the left to review descriptions, learn goals, and initialize interactive simulations or bot conversations.
                </p>
              </div>
            )}

          </Card>
        </div>

      </div>

    </div>
  );
}
