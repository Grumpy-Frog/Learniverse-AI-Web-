import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { getProfile } from '../../lib/auth';
import { 
  Grade, 
  User, 
  DashboardProgressModel, 
  DashboardTopic 
} from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import StatusMessage from '../ui/StatusMessage';
import TopicMasteryMatrix from './TopicMasteryMatrix';
import StrengthsCard from './StrengthsCard';
import NeedsAttentionCard from './NeedsAttentionCard';
import { loadDashboardProgress } from '../../lib/dashboardLoader';
import { 
   Award, 
   Flame, 
   CheckCircle, 
   ChevronRight, 
   LayoutDashboard,
   Settings,
   Database,
   Newspaper,
   Zap,
   Compass
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardProgressModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);

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

      // 2. Load Dashboard Data
      const progress = await loadDashboardProgress();
      setDashboardData(progress);

      // 3. Extract Grades from data
      const uniqueGrades: Grade[] = [];
      const gradeIdsSeen = new Set<string>();
      
      progress.topics.forEach(t => {
        if (!gradeIdsSeen.has(t.grade_id)) {
          gradeIdsSeen.add(t.grade_id);
          uniqueGrades.push({
            id: t.grade_id,
            name: t.grade_name,
            slug: '',
            display_order: 0
          });
        }
      });
      setGrades(uniqueGrades);
      
      if (uniqueGrades.length > 0) {
        setSelectedGradeId(uniqueGrades[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load learning progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInitialData();
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGradeId(e.target.value);
  };

  // Filtered topics based on selected grade
  const filteredTopics = useMemo(() => {
    if (!dashboardData) return [];
    if (!selectedGradeId) return dashboardData.topics;
    return dashboardData.topics.filter(t => t.grade_id === selectedGradeId);
  }, [dashboardData, selectedGradeId]);

  // Subject pathways for selected grade
  const subjectPathways = useMemo(() => {
    if (!dashboardData || !selectedGradeId) return [];
    const subjectsInGrade = new Set<string>();
    filteredTopics.forEach(t => subjectsInGrade.add(t.subject_id));
    
    return dashboardData.subjectSummaries.filter(s => subjectsInGrade.has(s.subject_id));
  }, [dashboardData, filteredTopics, selectedGradeId]);

  // Gamification stats
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const completedTopics = dashboardData.completedTopics;
    const strengthCount = dashboardData.strengths.length;
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
    const streakDays = completedTopics > 0 ? 1 : 0;

    return {
      xp,
      level,
      nextLevel,
      xpToNext,
      levelProgress,
      streakDays
    };
  }, [dashboardData]);

  const handleTopicAction = (topic: DashboardTopic) => {
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

  const nextRecommendedTopic = useMemo(() => {
    if (!filteredTopics.length) return null;
    // 1. Needs practice
    const needsPractice = filteredTopics.find(t => t.completion_status === 'needs_practice');
    if (needsPractice) return needsPractice;
    
    // 2. Not started
    const notStarted = filteredTopics.find(t => t.completion_status === 'not_started');
    if (notStarted) return notStarted;
    
    // 3. Review first completed
    return filteredTopics.find(t => t.completion_status === 'completed');
  }, [filteredTopics]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingState message="Loading your learning progress..." size="lg" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-6">
        <StatusMessage type="error" message={errorMsg} />
        <Button onClick={handleRefresh} className="mx-auto block">Retry</Button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="space-y-8 select-none">
      
      {/* Gamified Header Layer */}
      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[24px] p-6 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between z-10 relative gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-500 flex items-center gap-1.5 mb-1 bg-blue-500/10 w-fit px-2 py-0.5 rounded">
               <Award className="h-3 w-3" /> LEVEL {stats?.level} SCHOLAR
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-1 text-[var(--text-primary)]">
              Welcome back, {userProfile?.fullname || userProfile?.email || 'Student'}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="source_grounded">{userProfile?.role?.toUpperCase() || 'LEARNER'}</Badge>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">{userProfile?.email}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-xl transition-all ${stats?.streakDays || 0 > 0 ? 'bg-gradient-to-br from-orange-500 to-rose-600 scale-105' : 'bg-[var(--glass-bg)] border border-[var(--glass-border)]'}`}>
            <Flame className={`w-5 h-5 ${stats?.streakDays || 0 > 0 ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            <span className={`text-sm font-black tracking-tight ${stats?.streakDays || 0 > 0 ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
              {stats?.streakDays || 0 > 0 ? `${stats?.streakDays} Day Streak` : 'Start Streak'}
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-8 z-10 relative max-w-2xl">
          <div className="flex justify-between items-end mb-2.5">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-[var(--text-primary)]">{stats?.xp.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total XP acquired</span>
            </div>
            <span className="text-[10px] font-black uppercase text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded tracking-tighter">
              {stats?.xpToNext} To Level {stats?.nextLevel}
            </span>
          </div>
          <div className="w-full h-[12px] rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--glass-border)] shadow-inner relative">
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-1000 ease-in-out" 
              style={{ width: `${stats?.levelProgress}%` }}
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
          
          <TopicMasteryMatrix 
            topics={filteredTopics} 
            onTopicClick={handleTopicAction} 
          />

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
              {subjectPathways.map((summary) => {
                const progress = summary.total_topics > 0 ? Math.round((summary.completed_topics / summary.total_topics) * 100) : 0;
                const subjectName = dashboardData.topics.find(t => t.subject_id === summary.subject_id)?.subject_name || "Unknown Subject";

                return (
                  <Card key={summary.subject_id} className="p-5 hover:border-[var(--accent-primary)] transition-all group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {subjectName}
                          </h3>
                          <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5 italic">Core syllabus subject</p>
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

                      {summary.strength_labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {summary.strength_labels.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase truncate">
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => onNavigate(`/catalog?subject=${summary.subject_id}`)}
                      variant="secondary"
                      className="w-full mt-5 py-2 text-[10px] uppercase font-black"
                    >
                      Continue Path
                    </Button>
                  </Card>
                );
              })}
            </div>
            {subjectPathways.length === 0 && (
               <div className="text-center py-10 border-2 border-dashed border-[var(--glass-border)] rounded-xl">
                 <p className="text-xs text-[var(--text-secondary)] font-medium">No pathways available for this grade.</p>
              </div>
            )}
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
                    strokeDashoffset={276 - (276 * (dashboardData.totalTopics > 0 ? Math.round((dashboardData.completedTopics / dashboardData.totalTopics) * 100) : 0)) / 100} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-[var(--text-primary)]">
                    {dashboardData.totalTopics > 0 ? Math.round((dashboardData.completedTopics / dashboardData.totalTopics) * 100) : 0}%
                  </span>
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Completed</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-5 uppercase tracking-wide">
                {dashboardData.completedTopics} OF {dashboardData.totalTopics} TOPICS FINISHED
              </p>
            </Card>

            <StrengthsCard strengths={dashboardData.strengths} />

            <NeedsAttentionCard 
              weaknesses={dashboardData.weaknesses} 
              needsPracticeTopics={dashboardData.needsPracticeTopics}
              onPracticeTopic={handleTopicAction}
            />

          </div>

          {/* Continue Learning Action Panel */}
          {nextRecommendedTopic && (
            <Card className="p-6 border-2 border-blue-500/50 bg-blue-500/5 shadow-2xl shadow-blue-500/10 scale-[1.02]">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-blue-500 fill-blue-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Next Recommended Action</span>
              </div>
              
              <div className="mb-6">
                <p className="text-[9px] font-mono text-[var(--text-secondary)] uppercase mb-1">{nextRecommendedTopic.subject_name} &bull; {nextRecommendedTopic.chapter_title}</p>
                <h4 className="text-xl font-black text-[var(--text-primary)] leading-tight">{nextRecommendedTopic.topic_title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={nextRecommendedTopic.completion_status === 'needs_practice' ? 'needs_practice' : 'not_started'}>
                    {nextRecommendedTopic.completion_status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  {nextRecommendedTopic.latest_score !== null && (
                    <span className="text-[11px] font-mono font-black text-slate-500">SCORE: {nextRecommendedTopic.latest_score}%</span>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => handleTopicAction(nextRecommendedTopic)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest py-3.5 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {nextRecommendedTopic.completion_status === 'needs_practice' ? 'Practice Weakness' : 'Continue Learning'}
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
                <button onClick={() => onNavigate('/admin/catalog')} className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group">
                  <div className="flex items-center gap-3"><LayoutDashboard className="h-4 w-4 text-blue-400" />Manage Catalog</div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => onNavigate('/admin/simulations')} className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group">
                  <div className="flex items-center gap-3"><Zap className="h-4 w-4 text-emerald-400" />Manage Simulations</div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => onNavigate('/admin/documents')} className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group">
                  <div className="flex items-center gap-3"><Database className="h-4 w-4 text-purple-400" />RAG Embedder</div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => onNavigate('/admin/blog')} className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-xs uppercase text-slate-200 group">
                  <div className="flex items-center gap-3"><Newspaper className="h-4 w-4 text-rose-400" />AI Blog Manager</div>
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
