import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DiagnosticQuestion, DiagnosticResult } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { SearchCheck, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

type UnderstandingCheckState = {
  sessionId: string | null;
  questionId: string | null;
  questionText: string;
  studentAnswer: string;
  result: DiagnosticResult | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
};

interface UnderstandingCheckProps {
  topicId: string;
  topicTitle: string;
  language?: 'en' | 'bn';
  conversationId?: string | null;
  onWeaknessDetected?: () => void;
  onSuccessCheck?: () => void;
}

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export default function UnderstandingCheck({
  topicId,
  topicTitle,
  language = 'en',
  conversationId = null,
  onWeaknessDetected,
  onSuccessCheck
}: UnderstandingCheckProps) {
  const [state, setState] = useState<UnderstandingCheckState>({
    sessionId: null,
    questionId: null,
    questionText: '',
    studentAnswer: '',
    result: null,
    loading: false,
    submitting: false,
    error: null,
  });

  // Reset states on topic change
  useEffect(() => {
    setState({
      sessionId: null,
      questionId: null,
      questionText: '',
      studentAnswer: '',
      result: null,
      loading: false,
      submitting: false,
      error: null,
    });
  }, [topicId]);

  const handleGenerate = async () => {
    setState(prev => ({ ...prev, loading: true, error: null, result: null, studentAnswer: '' }));
    try {
      const response = await api.generateUnderstandingCheck(topicId, language, conversationId);
      
      const sessionId = response.session?.id;
      let questions: DiagnosticQuestion[] = response.questions || [];

      if (sessionId && isUuid(sessionId)) {
        if (questions.length === 0) {
          questions = await api.getSessionQuestions(sessionId);
        }

        if (questions && questions.length > 0) {
          setState(prev => ({
            ...prev,
            sessionId: sessionId,
            questionId: questions[0].id,
            questionText: questions[0].question_text,
            loading: false
          }));
        } else {
          throw new Error('No assessment questions generated.');
        }
      } else {
        throw new Error('Diagnostic session was not created correctly. Please try again.');
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to generate understanding check.' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.studentAnswer.trim() || !state.sessionId || !state.questionId) return;
    if (!isUuid(state.sessionId)) {
      setState(prev => ({ ...prev, error: 'Invalid session identifier. Please restart the check.' }));
      return;
    }

    setState(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const payload = {
        answers: [{
          question_id: state.questionId,
          student_answer: state.studentAnswer
        }]
      };
      
      await api.submitSessionAnswers(state.sessionId, payload);
      const res: DiagnosticResult = await api.getSessionResult(state.sessionId);
      
      sessionStorage.setItem(`learniverse_last_session_id_${topicId}`, state.sessionId);
      
      setState(prev => ({ ...prev, result: res, submitting: false }));

      // Refresh topic status in parent if needed
      if (onSuccessCheck) onSuccessCheck();
      
    } catch (err: any) {
      setState(prev => ({ ...prev, submitting: false, error: err.message || 'Could not submit answer.' }));
    }
  };

  const percentage = state.result ? (state.result.session.score / state.result.session.max_score) * 100 : 0;
  const isWeak = state.result && percentage < 70;

  return (
    <Card className="bg-slate-900 border border-white/10 p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
        <SearchCheck className="h-5 w-5 text-blue-500" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Quick Understanding Check</h3>
      </div>

      {!state.sessionId && !state.result && (
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-400">Answer one quick question to check your understanding.</p>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handleGenerate} 
            isLoading={state.loading}
          >
            <Sparkles className="h-4 w-4 mr-2" /> Generate Check
          </Button>
        </div>
      )}

      {state.loading && (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Generating understanding check...</p>
        </div>
      )}

      {state.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-500 font-bold uppercase tracking-wider">
          {state.error}
        </div>
      )}

      {state.sessionId && state.questionText && !state.result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm font-semibold text-slate-200 leading-relaxed">
              {state.questionText}
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              value={state.studentAnswer}
              onChange={(e) => setState(prev => ({ ...prev, studentAnswer: e.target.value }))}
              placeholder="Write a short answer based on what you understood..."
              className="w-full min-h-[100px] p-4 text-sm rounded-xl border border-white/10 bg-slate-950 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50"
              required
            />
            <p className="text-[9px] text-slate-500 font-bold uppercase">Write a short answer based on what you understood.</p>
          </div>

          <Button 
            className="w-full" 
            type="submit" 
            isLoading={state.submitting} 
            disabled={!state.studentAnswer.trim()}
          >
            Submit Answer
          </Button>
        </form>
      )}

      {state.result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {state.result.answers.map((ans, i) => (
            <div key={i} className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                ans.is_correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {ans.is_correct ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                )}
                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Outcome</div>
                  <div className={`text-sm font-black ${ans.is_correct ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {percentage >= 70 ? 'Excellent Understanding' : 'Needs More Focus'} &bull; {Math.round(percentage)}%
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-white/5 border border-white/5 p-4 rounded-xl">
                 <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Feedback</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{ans.feedback}</p>
                 </div>
                 <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Explanation</span>
                    <p className="text-xs text-slate-400 leading-relaxed italic">{ans.explanation}</p>
                 </div>
              </div>

              {isWeak && (
                <div className="pt-2">
                  <Button 
                    variant="secondary" 
                    className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    onClick={onWeaknessDetected}
                  >
                    Start Diagnostic Quiz <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            className="w-full text-slate-500" 
            onClick={() => setState(prev => ({ ...prev, result: null, sessionId: null }))}
          >
            Check Another Question
          </Button>
        </div>
      )}
    </Card>
  );
}
