import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
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
      
      {/* Upper header */}
      <div className="border-b border-black dark:border-white pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.25em] font-black text-rose-500 uppercase block">
            INDIVIDUALIZED CLASSROOM GRAPH
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-905 dark:text-white mt-1">
            Student Dashboard
          </h1>
        </div>
        
        {/* Grade Swapper selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono font-black uppercase text-slate-400">Class Grade:</label>
          <select
            value={selectedGradeId}
            onChange={handleGradeChange}
            className="text-xs p-2.5 rounded border bg-white dark:bg-slate-900 border-slate-205 text-slate-900 dark:text-white font-extrabold uppercase"
          >
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {errorMsg && <StatusMessage type="error" message={errorMsg} />}

      {/* Aggregate Stats Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <Card className="p-5 border-2 border-black dark:border-white relative overflow-hidden flex flex-col justify-between min-h-[110px] bg-white">
          <div>
            <p className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">OVERALL PROGRESS COMPLETED</p>
            <p className="text-3xl font-black mt-1.5">{stats.overallCompletionRate}%</p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${stats.overallCompletionRate}%` }}></div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-neutral-802 relative flex flex-col justify-between bg-[#fbfbfc]">
          <div>
            <p className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Completed Topics</p>
            <p className="text-3xl font-black mt-1.5 text-slate-900">{stats.completedTopics}</p>
          </div>
          <span className="text-[10px] text-slate-450 flex items-center gap-1 mt-2 font-mono">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-550" /> Completed diagnostic verify loops
          </span>
        </Card>

        <Card className="p-5 border border-slate-202 dark:border-neutral-802 relative flex flex-col justify-between bg-white">
          <div>
            <p className="text-[9.5px] font-mono uppercase tracking-wider text-emerald-600 font-extrabold">ACADEMIC STRENGTHS</p>
            <p className="text-3xl font-black mt-1.5 text-emerald-600">{stats.strengthsCount}</p>
          </div>
          <span className="text-[10px] text-slate-450 mt-2 font-mono flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-emerald-500" /> High conceptual mastery levels
          </span>
        </Card>

        <Card className="p-5 border border-slate-202 dark:border-neutral-802 relative flex flex-col justify-between bg-[#fbfbfc]">
          <div>
            <p className="text-[9.5px] font-mono uppercase tracking-wider text-rose-505 font-extrabold">REMEDIAL WEAKNESSES</p>
            <p className="text-3xl font-black mt-1.5 text-rose-505">{stats.weaknessesCount}</p>
          </div>
          <span className="text-[10px] text-slate-450 mt-2 font-mono flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Areas triggering remedy pathways
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
