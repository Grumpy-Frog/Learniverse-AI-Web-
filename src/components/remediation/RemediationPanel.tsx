import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { RemediationDetail, TopicStatus, DiagnosticResult } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Zap, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, BookOpen, HelpCircle, ShieldCheck } from 'lucide-react';
import MarkdownContent from '../markdown/MarkdownContent';

type FocusedHelpState = {
  diagnosticResult: DiagnosticResult | null;
  selectedWeakness: string | null;
  remediationSessionId: string | null;
  remediationDetail: RemediationDetail | null;
  recheckAnswer: string;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  initialLoading: boolean;
};

interface RemediationPanelProps {
  topicId: string;
  topicTitle: string;
  language?: 'en' | 'bn';
  onRemediationCompleted?: () => void;
}

function isValidUUID(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function getFocusedHelpWeaknesses(result: DiagnosticResult | null): string[] {
  if (!result) return [];
  const directWeaknesses = result.weaknesses ?? [];
  const detectedWeaknesses = (result.answers ?? [])
    .map((answer) => answer.detected_weakness)
    .filter(Boolean) as string[];
  const wrongSkillLabels = (result.answers ?? [])
    .filter((answer) => !answer.is_correct)
    .map((answer) => answer.skill_label)
    .filter(Boolean);
  return Array.from(
    new Set([
      ...directWeaknesses,
      ...detectedWeaknesses,
      ...wrongSkillLabels,
    ])
  );
}

function shouldShowFocusedHelp(result: DiagnosticResult | null): boolean {
  if (!result) return false;
  const weaknesses = getFocusedHelpWeaknesses(result);
  const percentage = result.session?.percentage ?? null;
  const completionStatus = result.completion_status ?? null;
  const outcome = result.session?.outcome ?? null;

  return (
    weaknesses.length > 0 ||
    (percentage !== null && percentage < 70) ||
    completionStatus === "needs_practice" ||
    outcome === "needs_practice"
  );
}

export default function RemediationPanel({
  topicId,
  topicTitle,
  language = 'en',
  onRemediationCompleted
}: RemediationPanelProps) {
  const [state, setState] = useState<FocusedHelpState>({
    diagnosticResult: null,
    selectedWeakness: null,
    remediationSessionId: null,
    remediationDetail: null,
    recheckAnswer: '',
    loading: false,
    submitting: false,
    error: null,
    initialLoading: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, [topicId]);

  const fetchInitialData = async () => {
    setState(prev => ({ ...prev, initialLoading: true, error: null }));
    try {
      const cachedSessionId = sessionStorage.getItem(`learniverse_last_session_id_${topicId}`);
      if (cachedSessionId && isValidUUID(cachedSessionId)) {
        const result = await api.getSessionResult(cachedSessionId);
        const weaknesses = getFocusedHelpWeaknesses(result);
        
        let initialWeakness: string | null = null;
        if (weaknesses.length > 0) {
          initialWeakness = weaknesses[0];
        } else {
          const percentage = result.session?.percentage ?? null;
          const outcome = result.session?.outcome ?? "";
          const completionStatus = result.completion_status ?? "";
          if ((percentage !== null && percentage < 70) || outcome === "needs_practice" || completionStatus === "needs_practice") {
            initialWeakness = "concept_understanding";
          }
        }

        setState(prev => ({ 
          ...prev, 
          diagnosticResult: result, 
          selectedWeakness: initialWeakness,
          initialLoading: false 
        }));
      } else {
        setState(prev => ({ ...prev, initialLoading: false }));
      }
    } catch (e) {
      console.warn("Could not load diagnostic result:", e);
      setState(prev => ({ ...prev, initialLoading: false }));
    }
  };

  const handleGenerateFocusedHelp = async () => {
    const diagnosticSessionId = state.diagnosticResult?.session?.id;
    if (!isValidUUID(diagnosticSessionId)) {
      setState(prev => ({ ...prev, error: "Diagnostic session ID is missing. Submit a diagnostic quiz first." }));
      return;
    }

    if (!state.selectedWeakness) {
      setState(prev => ({ ...prev, error: "Please select an explicit weakness first." }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null, remediationDetail: null }));
    try {
      const response = await api.generateRemediation(diagnosticSessionId, state.selectedWeakness, language);
      
      const remediationSessionId = response?.session?.id;
      if (!isValidUUID(remediationSessionId)) {
        throw new Error("Focused Help could not start because the remediation session ID was missing. Please generate focused help again.");
      }

      setState(prev => ({
        ...prev,
        remediationSessionId: remediationSessionId,
        remediationDetail: response,
        loading: false
      }));
    } catch (err: any) {
      let customMsg = err.message || 'Error occurred while generating focused help.';
      if (customMsg.includes('path.remediation_session_id')) {
        customMsg = "Focused Help could not start because the remediation session ID was missing. Please generate focused help again.";
      }
      setState(prev => ({ ...prev, loading: false, error: customMsg }));
    }
  };

  const handleSubmitRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const remediationSessionId = state.remediationDetail?.session?.id;
    if (!isValidUUID(remediationSessionId)) {
      setState(prev => ({ ...prev, error: "Remediation session ID is missing. Generate focused help first." }));
      return;
    }

    if (!state.recheckAnswer.trim()) return;

    setState(prev => ({ ...prev, submitting: true, error: null }));
    try {
      await api.submitRemediationRecheck(remediationSessionId, state.recheckAnswer);
      const updated: RemediationDetail = await api.getRemediationSession(remediationSessionId);
      
      setState(prev => ({ ...prev, remediationDetail: updated, submitting: false }));

      if (updated.session.status === 'completed' && onRemediationCompleted) {
        onRemediationCompleted();
      }
    } catch (err: any) {
      let customMsg = err.message || 'Error occurred while checking answer.';
      if (customMsg.includes('path.remediation_session_id')) {
        customMsg = "Focused Help could not start because the remediation session ID was missing. Please generate focused help again.";
      }
      setState(prev => ({ ...prev, submitting: false, error: customMsg }));
    }
  };

  if (state.initialLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Scanning for gaps...</p>
      </div>
    );
  }

  if (!state.remediationDetail && !state.diagnosticResult) {
    return (
      <Card className="bg-slate-900 border border-white/10 p-12 rounded-[2rem] text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-6">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h4 className="text-xl font-black text-white mb-2">No Data Available</h4>
        <p className="text-xs text-slate-400 font-medium">Complete a diagnostic quiz to unlock focused help.</p>
      </Card>
    );
  }

  const showFocusedHelp = shouldShowFocusedHelp(state.diagnosticResult);
  const helpWeaknesses = getFocusedHelpWeaknesses(state.diagnosticResult);
  if (helpWeaknesses.length === 0 && state.diagnosticResult) {
    const percentage = state.diagnosticResult.session?.percentage ?? null;
    const outcome = state.diagnosticResult.session?.outcome ?? "";
    const completionStatus = state.diagnosticResult.completion_status ?? "";
    if ((percentage !== null && percentage < 70) || outcome === "needs_practice" || completionStatus === "needs_practice") {
      helpWeaknesses.push("concept_understanding");
    }
  }

  if (!showFocusedHelp && !state.remediationDetail) {
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
               {helpWeaknesses.map((weak, i) => (
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
                    {weak.replace(/_/g, ' ')}
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
