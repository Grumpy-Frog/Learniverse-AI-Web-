import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { RemediationDetail, TopicStatus } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Zap, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, BookOpen, HelpCircle, ShieldCheck } from 'lucide-react';
import MarkdownContent from '../markdown/MarkdownContent';

type FocusedHelpState = {
  selectedWeakness: string | null;
  remediationSessionId: string | null;
  remediationDetail: RemediationDetail | null;
  recheckAnswer: string;
  loading: boolean;
  submitting: boolean;
  error: string | null;
};

interface RemediationPanelProps {
  topicId: string;
  topicTitle: string;
  language?: 'en' | 'bn';
  onRemediationCompleted?: () => void;
}

export default function RemediationPanel({
  topicId,
  topicTitle,
  language = 'en',
  onRemediationCompleted
}: RemediationPanelProps) {
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [state, setState] = useState<FocusedHelpState>({
    selectedWeakness: null,
    remediationSessionId: null,
    remediationDetail: null,
    recheckAnswer: '',
    loading: false,
    submitting: false,
    error: null,
  });

  useEffect(() => {
    fetchTopicStatus();
  }, [topicId]);

  const fetchTopicStatus = async () => {
    try {
      const status: TopicStatus = await api.getTopicStatus(topicId);
      setWeaknesses(status.weaknesses || []);
      if (status.weaknesses && status.weaknesses.length > 0 && !state.selectedWeakness) {
        setState(prev => ({ ...prev, selectedWeakness: status.weaknesses[0] }));
      }
    } catch (e) {
      console.warn("Could not load topic status for weaknesses:", e);
    }
  };

  const handleGenerateFocusedHelp = async () => {
    if (!state.selectedWeakness) return;
    
    setState(prev => ({ ...prev, loading: true, error: null, remediationDetail: null }));
    try {
      const cachedSessionId = sessionStorage.getItem(`learniverse_last_session_id_${topicId}`);
      if (!cachedSessionId) {
        throw new Error('Submit a Diagnostic Quiz first to unlock focused help.');
      }

      const sess = await api.generateRemediation(cachedSessionId, state.selectedWeakness, language);
      const detail: RemediationDetail = await api.getRemediationSession(sess.id);
      
      setState(prev => ({
        ...prev,
        remediationSessionId: sess.id,
        remediationDetail: detail,
        loading: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Error occurred while generating focused help.' }));
    }
  };

  const handleSubmitRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.recheckAnswer.trim() || !state.remediationSessionId) return;

    setState(prev => ({ ...prev, submitting: true, error: null }));
    try {
      await api.submitRemediationRecheck(state.remediationSessionId, state.recheckAnswer);
      const updated: RemediationDetail = await api.getRemediationSession(state.remediationSessionId);
      
      setState(prev => ({ ...prev, remediationDetail: updated, submitting: false }));

      if (updated.session.status === 'completed' && onRemediationCompleted) {
        onRemediationCompleted();
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, submitting: false, error: err.message || 'Error occurred while checking answer.' }));
    }
  };

  if (weaknesses.length === 0 && !state.remediationDetail) {
    return (
      <Card className="bg-slate-900 border border-white/10 p-12 rounded-[2rem] text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h4 className="text-xl font-black text-white mb-2">Great work!</h4>
        <p className="text-xs text-slate-400 font-medium">No focused help is needed right now for this topic.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-[2rem] space-y-8">
      <div className="flex items-center gap-3 pb-6 border-b border-white/5">
        <Zap className="h-6 w-6 text-amber-500" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Focused Help & Study</h3>
      </div>

      {/* Top Selection Area */}
      {!state.remediationDetail && (
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              We found a few areas to improve. Choose one weakness and get focused help.
            </p>
            <div className="flex flex-wrap gap-2">
               {weaknesses.map((weak, i) => (
                  <button
                    key={i}
                    onClick={() => setState(prev => ({ ...prev, selectedWeakness: weak }))}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border
                      ${state.selectedWeakness === weak 
                        ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/20'
                      }
                    `}
                  >
                    {weak.replace('_', ' ')}
                  </button>
               ))}
            </div>
          </div>
          
          <Button 
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs" 
            onClick={handleGenerateFocusedHelp} 
            isLoading={state.loading}
            disabled={!state.selectedWeakness}
          >
            <Sparkles className="h-4 w-4 mr-2" /> Get Focused Help
          </Button>
        </div>
      )}

      {state.loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Generating focused help...</p>
        </div>
      )}

      {state.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-bold uppercase tracking-wider">
          {state.error}
        </div>
      )}

      {/* Study Card Content */}
      {state.remediationDetail && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase text-amber-500 tracking-widest">
                  {state.remediationDetail.session.weakness_label.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                  ${state.remediationDetail.session.status === 'completed' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : state.remediationDetail.session.status === 'needs_retry'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }
                `}>
                   {state.remediationDetail.session.status.replace('_', ' ')}
                </span>
             </div>
          </div>

          <div className="space-y-12">
            
             {/* Micro lesson sections */}
             <div className="space-y-8">
                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">What went wrong</h4>
                   </div>
                   <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-sm font-black text-amber-200 leading-relaxed">
                        {state.remediationDetail.content.weakness_statement}
                      </p>
                   </div>
                </section>

                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Micro Lesson</h4>
                   </div>
                   <div className="text-slate-300 leading-relaxed text-[15px]">
                      <MarkdownContent content={state.remediationDetail.content.micro_lesson} />
                   </div>
                </section>

                <section className="space-y-4">
                   <div className="flex items-center gap-2 text-purple-500">
                      <Zap className="h-4 w-4" />
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Guided Example</h4>
                   </div>
                   <div className="p-6 rounded-3xl bg-slate-950 border border-white/5">
                      <MarkdownContent content={state.remediationDetail.content.guided_example} />
                   </div>
                </section>

                <section className="space-y-4">
                   <div className="flex items-center gap-2 text-indigo-500">
                      <Sparkles className="h-4 w-4" />
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Try This</h4>
                   </div>
                   <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                      <MarkdownContent content={state.remediationDetail.content.partially_solved_problem} />
                   </div>
                </section>
             </div>

             {/* Recheck Section */}
             <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center gap-2 text-emerald-500">
                   <HelpCircle className="h-5 w-5" />
                   <h4 className="text-sm font-black uppercase tracking-widest">Recheck Question</h4>
                </div>
                
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-slate-200 font-bold leading-relaxed">
                   {state.remediationDetail.content.recheck_question}
                </div>

                {state.remediationDetail.session.status !== 'completed' ? (
                   <form onSubmit={handleSubmitRecheck} className="space-y-4">
                      <textarea
                        value={state.recheckAnswer}
                        onChange={(e) => setState(prev => ({ ...prev, recheckAnswer: e.target.value }))}
                        placeholder="State your updated answer here..."
                        className="w-full min-h-[120px] p-4 text-sm rounded-3xl border border-white/10 bg-slate-950 text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/30"
                        required
                      />
                      <Button 
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs" 
                        type="submit" 
                        isLoading={state.submitting}
                      >
                         Submit Recheck
                      </Button>
                   </form>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-emerald-600 border border-emerald-500 text-white shadow-xl shadow-emerald-600/20">
                       <div className="flex items-center gap-3 mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <h5 className="font-black uppercase text-xs tracking-widest">Assessment Completed</h5>
                       </div>
                       <p className="text-sm font-bold opacity-90 leading-relaxed">
                         {state.remediationDetail.rechecks[state.remediationDetail.rechecks.length - 1]?.feedback || 'Great work! You have successfully mastered this area of the topic.'}
                       </p>
                    </div>
                    <Button variant="ghost" className="w-full text-slate-500" onClick={() => setState(prev => ({ ...prev, remediationDetail: null, remediationSessionId: null }))}>
                       Back to Weakness List
                    </Button>
                  </div>
                )}
             </div>

          </div>

        </div>
      )}
    </Card>
  );
}
