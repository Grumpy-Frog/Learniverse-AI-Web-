import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DiagnosticQuestion, DiagnosticResult } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { FileQuestion, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, Trophy, ShieldCheck } from 'lucide-react';

type DiagnosticQuizState = {
  sessionId: string | null;
  questions: DiagnosticQuestion[];
  answers: Record<string, string>;
  result: DiagnosticResult | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
};

interface DiagnosticQuizProps {
  topicId: string;
  topicTitle: string;
  language?: 'en' | 'bn';
  conversationId?: string | null;
  onQuizCompleted?: (result: DiagnosticResult) => void;
}

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function getResultPercentage(result: DiagnosticResult): number {
  return Math.round(result.session?.percentage ?? 0);
}

function getEarnedScore(result: DiagnosticResult): number {
  return result.session?.score ?? result.answers.filter(a => a.is_correct).length;
}

function getTotalScore(result: DiagnosticResult): number {
  return result.session?.question_count || result.answers.length || 0;
}

function getOutcome(result: DiagnosticResult): string {
  return result.session?.outcome || result.completion_status || "pending";
}

export default function DiagnosticQuiz({
  topicId,
  topicTitle,
  language = 'en',
  conversationId = null,
  onQuizCompleted
}: DiagnosticQuizProps) {
  const [state, setState] = useState<DiagnosticQuizState>({
    sessionId: null,
    questions: [],
    answers: {},
    result: null,
    loading: false,
    submitting: false,
    error: null,
  });

  useEffect(() => {
    setState({
      sessionId: null,
      questions: [],
      answers: {},
      result: null,
      loading: false,
      submitting: false,
      error: null,
    });
  }, [topicId]);

  const handleGenerate = async () => {
    setState(prev => ({ ...prev, loading: true, error: null, result: null, answers: {} }));
    try {
      const response = await api.generateDiagnosticQuiz(topicId, language, conversationId);
      const sessionId = response.session?.id;
      let qList: DiagnosticQuestion[] = response.questions || [];
      
      if (sessionId && isUuid(sessionId)) {
        if (qList.length === 0) {
          qList = await api.getSessionQuestions(sessionId);
        }

        setState(prev => ({
          ...prev,
          sessionId: sessionId,
          questions: qList || [],
          loading: false
        }));
      } else {
        throw new Error('Diagnostic session was not created correctly. Please try again.');
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Error occurred while generating diagnostic quiz.' }));
    }
  };

  const handleOptionChange = (questionId: string, optionKey: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionKey }
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.sessionId || state.questions.length === 0) return;
    if (!isUuid(state.sessionId)) {
      setState(prev => ({ ...prev, error: 'Invalid session identifier. Please restart the quiz.' }));
      return;
    }

    setState(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const payload = {
        answers: state.questions.map(q => ({
          question_id: q.id,
          student_answer: state.answers[q.id] || ''
        }))
      };

      const res: DiagnosticResult = await api.submitSessionAnswers(state.sessionId, payload);
      
      // Verification: if result doesn't have answers or session data, fallback to detailed fetch
      let fullRes = res;
      if (!res.answers || res.answers.length === 0 || !res.session) {
        fullRes = await api.getSessionResult(state.sessionId);
      }
      
      setState(prev => ({ ...prev, result: fullRes, submitting: false }));

      // Refresh topic status in background
      api.getTopicStatus(topicId).catch(() => null);

      if (onQuizCompleted) {
        onQuizCompleted(fullRes);
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, submitting: false, error: err.message || 'Quiz submission failed.' }));
    }
  };

  const allAnswered = state.questions.length > 0 && 
    state.questions.every(q => state.answers[q.id] && state.answers[q.id].trim().length > 0);

  return (
    <Card className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-white/5">
        <FileQuestion className="h-5 w-5 text-emerald-500" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Diagnostic Quiz</h3>
      </div>

      {!state.sessionId && !state.result && (
        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm text-slate-300 font-medium">Take a short 5-question quiz to find your strengths and weak points.</p>
            <p className="text-xs text-slate-500 mt-1 italic">This assessment updates your topic completion status.</p>
          </div>
          <Button 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl" 
            onClick={handleGenerate} 
            isLoading={state.loading}
          >
            <Sparkles className="h-4 w-4 mr-2" /> Generate Diagnostic Quiz
          </Button>
        </div>
      )}

      {state.loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Generating diagnostic quiz...</p>
        </div>
      )}

      {state.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-bold uppercase tracking-wider">
          {state.error}
        </div>
      )}

      {state.sessionId && state.questions.length > 0 && !state.result && (
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {state.questions.map((q, idx) => (
            <div key={q.id} className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/10 group focus-within:border-emerald-500/30 transition-colors">
              <div className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-lg bg-emerald-600/20 text-emerald-500 text-[10px] font-black flex items-center justify-center border border-emerald-500/20">
                  {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-200 leading-relaxed">{q.question_text}</h4>
              </div>

              {q.question_type === 'mcq' && q.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                  {Object.entries(q.options).map(([key, opt]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleOptionChange(q.id, key)}
                      className={`p-4 text-xs font-medium text-left rounded-xl border transition-all flex items-center gap-3
                        ${state.answers[q.id] === key 
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/20'
                        }
                      `}
                    >
                      <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center font-bold text-[10px]
                        ${state.answers[q.id] === key ? 'bg-white/20 border-white/40' : 'bg-slate-900 border-white/10'}
                      `}>
                        {key}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="pl-9">
                  <textarea
                    value={state.answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full min-h-[100px] p-4 text-xs rounded-xl border border-white/5 bg-slate-950 text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/30"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="sticky bottom-0 bg-slate-900 pt-4 pb-2">
            <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl" 
                type="submit" 
                isLoading={state.submitting} 
                disabled={!allAnswered}
              >
                Submit Quiz
              </Button>
              <p className="text-center text-[9px] font-black uppercase text-slate-600 mt-4 tracking-widest">
                {allAnswered ? 'All questions answered' : 'Answer all 5 questions to submit'}
              </p>
          </div>
        </form>
      )}

      {state.result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Result Summary Header */}
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-600 text-white space-y-6 relative overflow-hidden">
            <Trophy className="absolute top-4 right-4 h-24 w-24 text-white/10 -rotate-12" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Outcome Report</span>
                <h4 className="text-3xl font-black">{getResultPercentage(state.result)}%</h4>
                <div className="flex items-center gap-2">
                   <div className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 border border-white/20 uppercase tracking-widest">
                     {getOutcome(state.result)}
                   </div>
                   {state.result.show_checkmark && <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-400 text-slate-950 border border-emerald-300 uppercase tracking-widest flex items-center gap-1">Checkmark Earned <ShieldCheck className="h-3 w-3" /></div>}
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Total Score</div>
                  <div className="text-xl font-bold">
                    {getEarnedScore(state.result)}/{getTotalScore(state.result)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
               <div>
                 <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest block mb-3">Strengths Detected</span>
                 <div className="flex flex-wrap gap-2">
                    {state.result.strengths.length > 0 ? state.result.strengths.map((str, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-black uppercase tracking-tight">✓ {str}</span>
                    )) : <span className="text-[10px] text-white/50 italic font-bold">No categorical strengths detected.</span>}
                 </div>
               </div>
               <div>
                  <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest block mb-3">Remediation Flags</span>
                  <div className="flex flex-wrap gap-2">
                    {state.result.weaknesses.length > 0 ? state.result.weaknesses.map((weak, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-[10px] font-black uppercase tracking-tight">⚠ {weak}</span>
                    )) : <span className="text-[10px] text-white/50 italic font-bold">Excellent! No weaknesses detected.</span>}
                 </div>
               </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-2">Detailed Response Audit</h4>
             {state.result.answers.map((ans, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                       <span className="w-5 h-5 rounded-lg bg-slate-800 text-[10px] font-black text-slate-400 flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                       <p className="text-sm font-bold text-white leading-relaxed">{ans.question_text}</p>
                    </div>
                    <div className={ans.is_correct ? 'text-emerald-500' : 'text-rose-500'}>
                       {ans.is_correct ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-white/5">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Your Answer</span>
                       <div className={`text-xs font-bold ${ans.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>{ans.student_answer || '(Empty)'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Correct Solution</span>
                       <div className="text-xs font-bold text-emerald-400">{ans.correct_answer}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                     <div>
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Feedback & Logic</span>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{ans.feedback}</p>
                     </div>
                     <div className="flex gap-2 items-center">
                        <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Skill Area:</span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase text-blue-400">{ans.skill_label}</span>
                     </div>
                     <div>
                        <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest block mb-1">Explanation</span>
                        <p className="text-xs text-slate-500 leading-relaxed italic">{ans.explanation}</p>
                     </div>
                     {ans.detected_weakness && (
                        <div className="pt-2">
                           <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block mb-1">Detected Weakness</span>
                           <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-500">{ans.detected_weakness}</span>
                        </div>
                     )}
                  </div>
                </div>
             ))}
          </div>

          <div className="flex flex-col gap-3 py-6 items-center">
             <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={() => setState(prev => ({ ...prev, result: null, sessionId: null }))}>
                Retry Diagnostic Quiz
             </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
