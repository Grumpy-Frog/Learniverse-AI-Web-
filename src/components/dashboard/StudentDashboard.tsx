import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { getProfile, getCurrentUser } from '../../lib/auth';
import { Grade, Subject, SubjectSummary, Topic, Chapter, User } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import StatusMessage from '../ui/StatusMessage';
import { 
   Award, 
   BookOpen, 
   Compass, 
   Flame, 
   CheckCircle, 
   ShieldAlert, 
   CheckCircle2, 
   ChevronRight, 
   LayoutDashboard,
   Settings,
   Database,
   Newspaper,
   Zap,
   Target,
   Info,
   RotateCcw
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
}

interface SubjectWithSummary {
  subject: Subject;
  summary: SubjectSummary | null;
}

interface DashboardTopic {
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_title: string;
  topic_id: string;
  topic_title: string;
  completion_status: "not_started" | "needs_practice" | "completed";
  latest_score: number | null;
  best_score: number | null;
  strength_labels: string[];
  weakness_labels: string[];
  show_checkmark: boolean;
  topic_description: string;
  learning_objective: string;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [subjectsWithSummary, setSubjectsWithSummary] = useState<SubjectWithSummary[]>([]);
  const [allDashboardTopics, setAllDashboardTopics] = useState<DashboardTopic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // States for Tooltip
  const [hoveredTopic, setHoveredTopic] = useState<DashboardTopic | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Load Profile
      try {
        const me = await api.getMe();
        setUserProfile(me);
      } catch (err) {
        console.warn('Silent profile fetch failed', err);
        const local = getProfile();
        if (local) setUserProfile(local as any);
      }

      // 2. Load Grades
      const gList = await api.getGrades();
      setGrades(gList);
      
      if (gList.length > 0) {
        const defaultGradeId = gList[0].id;
        setSelectedGradeId(defaultGradeId);
        await refreshDashboardData(defaultGradeId);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connecting to classroom diagnostics module failed.');
      setIsLoading(false);
    }
  };

  const refreshDashboardData = async (gradeId: string) => {
    setIsLoading(true);
    try {
      const selectedGrade = grades.find(g => g.id === gradeId);
      const gradeName = selectedGrade?.name || 'Class';

      // 3. Load Subjects
      const subjects = await api.getSubjects(gradeId);
      
      const subWithSummary: SubjectWithSummary[] = [];
      const dashTopics: DashboardTopic[] = [];

      // 4. Traverse Catalog and Diagnostics in parallel
      const subjectPromises = subjects.map(async (sub) => {
        // Get summary, chapters in parallel
        const [summary, chapters] = await Promise.all([
          api.getSubjectSummary(sub.id).catch(() => null),
          api.getChapters(sub.id).catch(() => [])
        ]);

        // Process all chapters in parallel
        await Promise.all(chapters.map(async (chap: Chapter) => {
          const topics = await api.getTopics(chap.id).catch(() => []);

          // Process all topics in parallel
          await Promise.all(topics.map(async (top: Topic) => {
            try {
              const status = await api.getTopicStatus(top.id);
              dashTopics.push({
                grade_id: gradeId,
                grade_name: gradeName,
                subject_id: sub.id,
                subject_name: sub.name,
                chapter_id: chap.id,
                chapter_title: chap.title,
                topic_id: top.id,
                topic_title: top.title,
                completion_status: status.status || 'not_started',
                latest_score: status.last_test_score ?? null,
                best_score: status.last_test_score ?? null,
                strength_labels: status.strengths || [],
                weakness_labels: status.weaknesses || [],
                show_checkmark: status.status === 'completed',
                topic_description: top.description,
                learning_objective: top.learning_objective
              });
            } catch (e) {
              dashTopics.push({
                grade_id: gradeId,
                grade_name: gradeName,
                subject_id: sub.id,
                subject_name: sub.name,
                chapter_id: chap.id,
                chapter_title: chap.title,
                topic_id: top.id,
                topic_title: top.title,
                completion_status: 'not_started',
                latest_score: null,
                best_score: null,
                strength_labels: [],
                weakness_labels: [],
                show_checkmark: false,
                topic_description: top.description,
                learning_objective: top.learning_objective
              });
            }
          }));
        }));

        return { subject: sub, summary };
      });

      const results = await Promise.all(subjectPromises);
      setSubjectsWithSummary(results);
      setAllDashboardTopics(dashTopics);

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed generating grade detail summaries.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedGradeId(id);
    if (id) {
      await refreshDashboardData(id);
    }
  };

  // Derived Stats Helper
  const stats = useMemo(() => {
    const completedTopics = allDashboardTopics.filter(t => t.completion_status === 'completed').length;
    const totalTopics = allDashboardTopics.length;
    const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    // Unique strengths/weaknesses from all topics
    const strengthsSet = new Set<string>();
    const weaknessesSet = new Set<string>();
    allDashboardTopics.forEach(t => {
      t.strength_labels.forEach(s => strengthsSet.add(s));
      t.weakness_labels.forEach(w => weaknessesSet.add(w));
    });

    const strengthCount = strengthsSet.size;
    const weaknessCount = weaknessesSet.size;

    const xp = (completedTopics * 250) + (strengthCount * 40);
    
    // Level logic
    let level = 1;
    let requiredForNext = 500;
    let nextLevel = 2;

    if (xp >= 3000) { level = 5; requiredForNext = 5000; nextLevel = 6; }
    else if (xp >= 1800) { level = 4; requiredForNext = 3000; nextLevel = 5; }
    else if (xp >= 1000) { level = 3; requiredForNext = 1800; nextLevel = 4; }
    else if (xp >= 500) { level = 2; requiredForNext = 1000; nextLevel = 3; }

    const xpToNext = requiredForNext - xp;
    const levelProgress = Math.min(100, Math.round((xp / requiredForNext) * 100));

    // Streak prototype
    const hasActivity = completedTopics > 0;
    const streakDays = hasActivity ? 1 : 0;

    return {
      completedTopics,
      totalTopics,
      overallPercent,
      strengthCount,
      weaknessCount,
      strengths: Array.from(strengthsSet),
      weaknesses: Array.from(weaknessesSet),
      xp,
      level,
      nextLevel,
      xpToNext,
      levelProgress,
      streakDays
    };
  }, [allDashboardTopics]);

  // Heatmap helper
  const getTileColor = (topic: DashboardTopic) => {
    if (topic.completion_status === 'completed') {
      return (topic.best_score || 0) >= 85 ? 'bg-[var(--success)] shadow-lg shadow-[var(--success)]/20' : 'bg-cyan-500 shadow-lg shadow-cyan-500/20';
    }
    if (topic.completion_status === 'needs_practice') return 'bg-[var(--warning)] shadow-lg shadow-[var(--warning)]/20';
    if (topic.latest_score !== null && topic.latest_score < 40) return 'bg-[var(--danger)] shadow-lg shadow-[var(--danger)]/20';
    return 'bg-[var(--glass-bg)] border border-[var(--glass-border)] opacity-40';
  };

  const handleContinueTopic = (topic: DashboardTopic) => {
    const context = {
      grade_id: topic.grade_id,
      grade_name: topic.grade_name,
      subject_id: topic.subject_id,
      subject_name: topic.subject_name,
      chapter_id: topic.chapter_id,
      chapter_title: topic.chapter_title,
      topic_id: topic.topic_id,
      topic_title: topic.topic_title,
      topic_description: topic.topic_description,
      learning_objective: topic.learning_objective
    };
    sessionStorage.setItem('learniverse_selected_topic', JSON.stringify(context));
    onNavigate('/tutor');
  };

  const continueLearningTopic = useMemo(() => {
    // 1. Needs practice
    const needsPractice = allDashboardTopics.find(t => t.completion_status === 'needs_practice');
    if (needsPractice) return needsPractice;
    
    // 2. Not started
    const notStarted = allDashboardTopics.find(t => t.completion_status === 'not_started');
    if (notStarted) return notStarted;
    
    // 3. Review first completed
    return allDashboardTopics.find(t => t.completion_status === 'completed');
  }, [allDashboardTopics]);

  if (isLoading) {
    return <LoadingState message="Calculating student progress charts..." size="lg" />;
  }

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="space-y-8 select-none">
      
      {/* Gamified Header Layer */}
      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[24px] p-6 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between z-10 relative gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-500 flex items-center gap-1.5 mb-1 bg-blue-500/10 w-fit px-2 py-0.5 rounded">
               <Award className="h-3 w-3" /> LEVEL {stats.level} SCHOLAR
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-1 text-[var(--text-primary)]">
              Welcome back, {userProfile?.fullname || userProfile?.email || 'Student'}!
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-2">
                <Badge variant="source_grounded">{userProfile?.role?.toUpperCase() || 'LEARNER'}</Badge>
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">{userProfile?.email}</span>
              </div>
              <button 
                onClick={() => selectedGradeId && refreshDashboardData(selectedGradeId)} 
                className="p-1 px-2 hover:bg-blue-500/10 rounded-lg text-blue-500 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Refresh Stats</span>
              </button>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-xl transition-all ${stats.streakDays > 0 ? 'bg-gradient-to-br from-orange-500 to-rose-600 scale-105' : 'bg-[var(--glass-bg)] border border-[var(--glass-border)]'}`}>
            <Flame className={`w-5 h-5 ${stats.streakDays > 0 ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className={`text-sm font-black tracking-tight ${stats.streakDays > 0 ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
              {stats.streakDays > 0 ? `${stats.streakDays} Day Streak` : 'Start Streak'}
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-8 z-10 relative max-w-2xl">
          <div className="flex justify-between items-end mb-2.5">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-[var(--text-primary)]">{stats.xp.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total XP acquired</span>
            </div>
            <span className="text-[10px] font-black uppercase text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded tracking-tighter">
              {stats.xpToNext} To Level {stats.nextLevel}
            </span>
          </div>
          <div className="w-full h-[12px] rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--glass-border)] shadow-inner relative">
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-1000 ease-in-out" 
              style={{ width: `${stats.levelProgress}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[100%] animate-[shimmer_3s_infinite]"></div>
          </div>
        </div>

        {/* Floating Orb Background */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[var(--accent-primary)]/10 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
      </div>

      {errorMsg && <StatusMessage type="error" message={errorMsg} />}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Heatmap and Aggregates */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Mastery Heatmap */}
          <Card className="p-6 relative overflow-visible">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[var(--text-secondary)] mb-0.5">Focus Heatmap</p>
                <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Topic Mastery Matrix</h3>
              </div>
              <Badge variant={stats.overallPercent >= 85 ? 'completed' : stats.overallPercent >= 60 ? 'needs_practice' : 'not_started'}>
                {stats.overallPercent >= 85 ? 'Top 15% Class' : stats.overallPercent >= 60 ? 'On Track' : 'Keep Practicing'}
              </Badge>
            </div>

            {allDashboardTopics.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5">
                {allDashboardTopics.map((topic, idx) => (
                  <div 
                    key={topic.topic_id} 
                    className={`h-9 rounded-lg ${getTileColor(topic)} cursor-pointer transition-all hover:scale-110 hover:z-20 group relative`}
                    onClick={() => handleContinueTopic(topic)}
                    onMouseEnter={() => setHoveredTopic(topic)}
                    onMouseLeave={() => setHoveredTopic(null)}
                  >
                    {/* Tooltip implementation */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] uppercase mb-1">{topic.subject_name}</p>
                      <h4 className="text-[11px] font-black text-[var(--text-primary)] leading-tight mb-2">{topic.topic_title}</h4>
                      <div className="flex justify-between items-center text-[10px] border-t border-[var(--glass-border)] pt-2">
                         <span className="font-bold text-[var(--text-secondary)]">STATUS</span>
                         <span className="font-black uppercase text-blue-500">{topic.completion_status.replace('_', ' ')}</span>
                      </div>
                      {topic.latest_score !== null && (
                         <div className="flex justify-between items-center text-[10px] mt-1">
                          <span className="font-bold text-[var(--text-secondary)]">LAST SCORE</span>
                          <span className="font-black">{topic.latest_score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-[var(--glass-border)] rounded-xl">
                 <p className="text-xs text-[var(--text-secondary)] font-medium">No topics discovered in your curriculum yet.</p>
              </div>
            )}
            
            <div className="flex justify-between mt-5 pt-4 border-t border-[var(--glass-border)] text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--danger)]"></div> Weak</div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--warning)]"></div> Practice</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></div> Improving</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--success)]"></div> Mastered</div>
              </div>
            </div>
          </Card>

          {/* Subject Pathways List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-[0.25em] text-blue-500 uppercase">Interactive Catalog</span>
                <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)] mt-0.5 flex items-center gap-2">
                  <Compass className="h-5 w-5" /> Subject Pathways
                </h2>
              </div>
              <select 
                value={selectedGradeId} 
                onChange={handleGradeChange}
                className="text-[11px] font-black uppercase bg-[var(--bg-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-1.5 focus:ring-1 ring-blue-500 outline-none"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectsWithSummary.map(({ subject, summary }) => {
                const completed = summary?.completed_topics ?? 0;
                const total = summary?.total_topics ?? 0;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Card key={subject.id} className="p-5 hover:border-[var(--accent-primary)] transition-all group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {subject.name}
                          </h3>
                          <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5 italic">{subject.description || 'Core syllabus subject'}</p>
                        </div>
                        <Badge variant={progress === 100 ? 'completed' : progress > 0 ? 'needs_practice' : 'not_started'}>
                          {progress === 100 ? 'MASTERED' : progress > 0 ? `${progress}% DONE` : 'START'}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-black text-[var(--text-secondary)] uppercase">
                          <span>Mastery rate</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-[var(--bg-surface)] h-1.5 rounded-full overflow-hidden border border-[var(--glass-border)]">
                          <div className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-[var(--success)]' : 'bg-[var(--accent-primary)]'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      {(summary?.strengths?.length || 0) > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {summary?.strengths.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase truncate">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => onNavigate(`/catalog?subject=${subject.id}`)}
                      variant="secondary"
                      className="w-full mt-5 py-2 text-[10px] uppercase font-black"
                    >
                      Continue Path
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Stats and Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Circle & Aggregate Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            
            <Card className="p-6 flex flex-col items-center text-center justify-center">
              <p className="text-[10px] uppercase tracking-[.2em] font-black text-[var(--text-secondary)] mb-5">Curriculum Done</p>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute top-0 left-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--bg-surface)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="44" 
                    fill="none" 
                    stroke="var(--accent-primary)" 
                    strokeWidth="8" 
                    strokeDasharray="276" 
                    strokeDashoffset={276 - (276 * stats.overallPercent) / 100} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-[var(--text-primary)]">{stats.overallPercent}%</span>
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Completed</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-5 uppercase tracking-wide">
                {stats.completedTopics} OF {stats.totalTopics} TOPICS FINISHED
              </p>
            </Card>

            <Card className="p-6 bg-emerald-500/5 border-emerald-500/20">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Strengths</p>
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="text-3xl font-black text-emerald-500 mb-1">{stats.strengthCount}</h4>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] mb-4">Unique competencies observed</p>
              
              <div className="flex flex-wrap gap-2">
                {stats.strengths.length > 0 ? (
                  stats.strengths.slice(0, 6).map((s, idx) => (
                    <span key={idx} className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-tighter">
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <p className="text-[10px] text-[var(--text-secondary)] italic">Complete checks to trigger strengths.</p>
                )}
              </div>
            </Card>

            {/* Weaknesses Card - Moved up for cognitive grouping */}
            <Card className="p-6 bg-rose-500/5 border-rose-500/20">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-rose-500">Needs Attention</p>
                <ShieldAlert className="h-5 w-5 text-rose-500" />
              </div>
              <h4 className="text-3xl font-black text-rose-500 mb-1">{stats.weaknessCount}</h4>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] mb-4">Concepts with lower mastery scores</p>
              
              <div className="flex flex-wrap gap-2">
                {stats.weaknesses.length > 0 ? (
                  stats.weaknesses.slice(0, 6).map((w, idx) => (
                    <span key={idx} className="text-[10px] font-black bg-rose-500/10 text-rose-600 px-2 py-1 rounded-lg border border-rose-500/20 uppercase tracking-tighter">
                      {w.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <p className="text-[10px] text-[var(--text-secondary)] italic">No critical conceptual gaps identified yet.</p>
                )}
              </div>
              
              {stats.weaknesses.length > 0 && (
                <Button 
                  variant="secondary" 
                  className="w-full mt-5 text-[10px] uppercase font-black"
                  onClick={() => {
                    const firstWeak = allDashboardTopics.find(t => t.completion_status === 'needs_practice');
                    if (firstWeak) handleContinueTopic(firstWeak);
                  }}
                >
                  Practice Weaknesses
                </Button>
              )}
            </Card>

          </div>

          {/* Continue Learning Action Panel */}
          {continueLearningTopic && (
            <Card className="p-6 border-2 border-blue-500/50 bg-blue-500/5 shadow-2xl shadow-blue-500/10 scale-[1.02]">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-blue-500 fill-blue-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Next Recommended Action</span>
              </div>
              
              <div className="mb-6">
                <p className="text-[9px] font-mono text-[var(--text-secondary)] uppercase mb-1">{continueLearningTopic.subject_name} &bull; {continueLearningTopic.chapter_title}</p>
                <h4 className="text-xl font-black text-[var(--text-primary)] leading-tight">{continueLearningTopic.topic_title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={continueLearningTopic.completion_status === 'needs_practice' ? 'needs_practice' : 'not_started'}>
                    {continueLearningTopic.completion_status === 'needs_practice' ? 'NEEDS PRACTICE' : 'NEXT STEP'}
                  </Badge>
                  {continueLearningTopic.latest_score !== null && (
                    <span className="text-[11px] font-mono font-black text-slate-500">SCORE: {continueLearningTopic.latest_score}%</span>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => handleContinueTopic(continueLearningTopic)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest py-3.5 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {continueLearningTopic.completion_status === 'needs_practice' ? 'Practice Weakness' : 'Continue Learning'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Card>
          )}

          {/* Admin Quick Actions */}
          {isAdmin && (
            <Card className="p-6 border-slate-900 bg-slate-900 text-white space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Admin Console</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button 
                  onClick={() => onNavigate('/admin/catalog')}
                  className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 text-blue-400" />
                    Manage Catalog
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => onNavigate('/admin/simulations')}
                  className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    Manage Simulations
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => onNavigate('/admin/documents')}
                  className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-purple-400" />
                    RAG Embedder
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => onNavigate('/admin/blog')}
                  className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group"
                >
                  <div className="flex items-center gap-3">
                    <Newspaper className="h-4 w-4 text-rose-400" />
                    AI Blog Manager
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </Card>
          )}


        </div>
      </div>

    </div>
  );
}
