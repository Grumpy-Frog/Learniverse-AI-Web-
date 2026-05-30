import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getProfile, getCurrentUser } from '../../lib/auth';
import { Grade, Subject, SubjectSummary } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import StatusMessage from '../ui/StatusMessage';
import { Award, BookOpen, Compass, Flame, CheckCircle, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
}

interface SubjectWithSummary {
  subject: Subject;
  summary: SubjectSummary | null;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [subjectsWithSummary, setSubjectsWithSummary] = useState<SubjectWithSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Aggregated Stats
  const [stats, setStats] = useState({
    completedTopics: 0,
    overallCompletionRate: 0,
    strengthsCount: 0,
    weaknessesCount: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let profile = getProfile();
      setUserProfile(profile);
      getCurrentUser().then(user => {
        if (user) setUserProfile(user);
      }).catch(console.error);

      const gList = await api.getGrades();
      setGrades(gList);
      if (gList.length > 0) {
        setSelectedGradeId(gList[0].id);
        await fetchGradeSummaries(gList[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connecting to classroom diagnostics module failed.');
      setIsLoading(false);
    }
  };

  const fetchGradeSummaries = async (gradeId: string) => {
    setIsLoading(true);
    try {
      const subjects = await api.getSubjects(gradeId);
      const withSummary: SubjectWithSummary[] = [];

      let totalCompleted = 0;
      let totalTopics = 0;
      let totalStrengths = 0;
      let totalWeaknesses = 0;

      for (const sub of subjects) {
        let summary: any = null;
        try {
          summary = await api.getSubjectSummary(sub.id);
          if (summary) {
            const completed = summary.completed_topics ?? summary.completed_topics_count ?? 0;
            const total = summary.total_topics ?? summary.total_topics_count ?? 0;
            const strengths = summary.strengths?.length ?? summary.strengths_count ?? 0;
            const weaknesses = summary.weaknesses?.length ?? summary.weaknesses_count ?? 0;

            totalCompleted += completed;
            totalTopics += total;
            totalStrengths += strengths;
            totalWeaknesses += weaknesses;
          }
        } catch (e) {
          console.warn(`Could not load summary details for subject ${sub.id}`, e);
        }
        withSummary.push({ subject: sub, summary });
      }

      setSubjectsWithSummary(withSummary);

      // Save aggregated stats
      const completionRate = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
      setStats({
        completedTopics: totalCompleted,
        overallCompletionRate: completionRate,
        strengthsCount: totalStrengths,
        weaknessesCount: totalWeaknesses,
      });

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
      await fetchGradeSummaries(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Calculating student progress charts..." size="lg" />;
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* Gamified Header Layer */}
      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[24px] p-5 relative overflow-hidden backdrop-blur-md">
        <div className="flex items-start justify-between z-10 relative">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent-secondary)] flex items-center gap-1">
               Level 4 Scholar
            </span>
            <h1 className="text-2xl font-black mt-1">
              Welcome back, {userProfile?.fullname || userProfile?.name || 'Student'}!
            </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-gradient-to-br from-[#FF9800] to-[#F57C00] px-3 py-1.5 rounded-full shadow-lg">
            <Flame className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold tracking-wide">12 Day Streak</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-6 z-10 relative">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">2,450 XP</span>
            <span className="text-[10px] font-bold uppercase text-[var(--accent-primary)]">550 To Level 5</span>
          </div>
          <div className="w-full h-[10px] rounded-full overflow-hidden bg-white/10 shadow-inner relative">
            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" style={{ width: '82%' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>

        {/* Floating Orb Background */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/20 rounded-full blur-[40px] pointer-events-none"></div>
      </div>

      {errorMsg && <StatusMessage type="error" message={errorMsg} />}

      {/* Aggregate Stats Gamification Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Mastery Heatmap 5x2 */}
        <Card className="col-span-2 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">Topic Mastery Heatmap</p>
            <span className="text-xs font-bold text-[var(--success)]">Top 15% Class</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cell) => {
              let colorClass = "bg-[var(--glass-bg)] border border-[var(--glass-border)]";
              if (cell === 1 || cell === 4 || cell === 6) colorClass = "bg-[var(--success)] opacity-90"; // strong
              else if (cell === 2 || cell === 8) colorClass = "bg-[var(--accent-secondary)] opacity-80"; // improving
              else if (cell === 3 || cell === 9) colorClass = "bg-[var(--warning)] opacity-80"; // moderate
              else if (cell === 5) colorClass = "bg-[var(--danger)] opacity-80"; // weak
              return (
                <div key={cell} className={`h-8 rounded-lg ${colorClass} transition-opacity duration-300 hover:opacity-100`}></div>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 text-[9px] font-semibold text-[var(--text-secondary)] uppercase">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[var(--danger)]/80"></div>Weak</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[var(--success)]/90"></div>Strong</div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center justify-center relative">
          <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-3">Overall Progress</p>
          <div className="relative w-[80px] h-[80px] flex items-center justify-center">
            {/* SVG Skill Ring */}
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="25" fill="none" stroke="var(--glass-bg)" strokeWidth="6" />
              <circle cx="30" cy="30" r="25" fill="none" stroke="var(--accent-primary)" strokeWidth="6" strokeDasharray="157" strokeDashoffset={157 - (157 * stats.overallCompletionRate) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <span className="text-xl font-black">{stats.overallCompletionRate}%</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between bg-gradient-to-br from-[var(--glass-bg)] to-transparent">
          <p className="text-[10px] uppercase font-bold text-[var(--success)] mb-2">Strengths Assessed</p>
          <p className="text-3xl font-black text-[var(--success)]">{stats.strengthsCount}</p>
          <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 font-medium mt-1">
            <Award className="h-3 w-3 text-[var(--success)]" /> Mastery level
          </span>
        </Card>
      </div>

      {/* Subjects Progress list Cards */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest font-black uppercase text-rose-500">
            Registered Class Syllabus
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-905 mt-1 dark:text-slate-100">
            Subject Pathways
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjectsWithSummary.map(({ subject, summary }, i) => {
            const completed = summary ? (summary.completed_topics ?? summary.completed_topics_count ?? 0) : 0;
            const total = summary ? (summary.total_topics ?? summary.total_topics_count ?? 0) : 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={subject.id}>
                <Card
                  className="p-5 border border-slate-200 dark:border-neutral-810 rounded-xl bg-white space-y-4 hover:border-black transition-all flex flex-col justify-between"
                >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-slate-950 dark:text-white">
                        {subject.name}
                      </h3>
                      {subject.description && (
                        <p className="text-xs text-slate-500 leading-snug mt-1">{subject.description}</p>
                      )}
                    </div>
                    <Badge variant={progress === 100 ? 'completed' : progress > 0 ? 'needs_practice' : 'not_started'}>
                      {progress === 100 ? 'Mastered' : progress > 0 ? `${progress}% done` : 'Start'}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                      <span>COMPLETE RATE</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  {/* Chapters breakdown mapping list */}
                  {summary && summary.chapters && summary.chapters.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-slate-400 block pb-1 border-b border-dashed">
                        Chapters mastery summary
                      </p>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                        {summary.chapters.map((chap, idx) => {
                          const chapPerc = chap.topic_count > 0 ? Math.round((chap.completed_count / chap.topic_count) * 100) : 0;
                          return (
                            <div key={idx} className="text-xs font-semibold flex justify-between items-center py-1">
                              <span className="truncate text-slate-700 max-w-[200px]">Chapter {chap.chapter_number}: {chap.title}</span>
                              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded font-black">{chap.completed_count}/{chap.topic_count} Topics done</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses quick summary lists */}
                  {summary && (
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                      
                      {/* Strengths block */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] font-mono font-extrabold uppercase text-emerald-600 block">Stiff Strengths</span>
                        {summary.strengths && summary.strengths.length > 0 ? (
                          <ul className="space-y-0.5 max-h-[80px] overflow-y-auto">
                            {summary.strengths.slice(0, 3).map((str, sIdx) => (
                              <li key={sIdx} className="text-[10px] text-slate-655 font-medium truncate flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> {str}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 italic">Complete quiz checks to trigger strengths.</span>
                        )}
                      </div>

                      {/* Weaknesses block */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] font-mono font-extrabold uppercase text-rose-500 block">Remedy Weaknesses</span>
                        {summary.weaknesses && summary.weaknesses.length > 0 ? (
                          <ul className="space-y-0.5 max-h-[80px] overflow-y-auto">
                            {summary.weaknesses.slice(0, 3).map((weak, wIdx) => (
                              <li key={wIdx} className="text-[10px] text-slate-655 font-medium truncate flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3 text-rose-500 shrink-0" /> {weak}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 italic">No conceptual cracks registered! Excellent.</span>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <Button
                    onClick={() => onNavigate(`/catalog?subject=${subject.id}`)}
                    variant="secondary"
                    className="w-full text-[10px] uppercase font-black tracking-widest py-2.5 flex items-center justify-center gap-1.5"
                  >
                    Enter Subject Study Path <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </div>
            );
          })}
          {subjectsWithSummary.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center col-span-2 py-8 bg-slate-50 border rounded-lg">
              No subjects registered or mapped to the current selected Classroom Grade level.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
