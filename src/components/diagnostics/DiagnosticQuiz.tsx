import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Question, DiagnosticSession, DiagnosticResult } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import { Trophy, HelpCircle, CheckCircle, XCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface DiagnosticQuizProps {
  topicId: string;
  topicTitle: string;
  onQuizCompleted?: (result: DiagnosticResult) => void;
}

export default function DiagnosticQuiz({
  topicId,
  topicTitle,
  onQuizCompleted
}: DiagnosticQuizProps) {
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { question_id: option_or_text }
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  // Clear state on topic change
  useEffect(() => {
    setSession(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError(null);
  }, [topicId]);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    try {
      // 1. POST generate
      const sess: DiagnosticSession = await api.generateDiagnosticQuiz(topicId);
      setSession(sess);

      // 2. GET questions
      const qList: Question[] = await api.getSessionQuestions(sess.id);
      setQuestions(qList || []);
    } catch (err: any) {
      setError(err.message || 'Error occurred while generating diagnostic quiz framework.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleChangeShortAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || questions.length === 0) return;

    // Check if everything is answered
    const unansweredCount = questions.filter(q => !answers[q.id]?.trim()).length;
    if (unansweredCount > 0) {
      setError(`Please complete all ${questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        answers: questions.map(q => ({
          question_id: q.id,
          student_answer: answers[q.id] || ''
        }))
      };

      // POST submit answers
      await api.submitSessionAnswers(session.id, payload);

      // GET result
      const res: DiagnosticResult = await api.getSessionResult(session.id);
      setResult(res);

      if (onQuizCompleted) {
        onQuizCompleted(res);
      }
    } catch (err: any) {
      setError(err.message || 'Quiz submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 md:p-6 rounded-2xl space-y-5">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400">
            DIAGNOSTIC TEST ENGAGEMENT
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white heading-font">
            DIAGNOSTIC QUIZ WORKSPACE
          </h4>
        </div>
        {!session && (
          <Button size="sm" onClick={handleGenerateQuiz} isLoading={loading}>
            Generate Diagnostic Quiz
          </Button>
        )}
      </div>

      {loading && <LoadingState message="Synthesizing rigorous subject testing parameters..." />}

      {error && (
        <StatusMessage type="error" message={error} onRetry={handleGenerateQuiz} />
      )}

      {/* Active questionnaire form */}
      {session && questions.length > 0 && !result && (
        <form onSubmit={handleSubmitQuiz} className="space-y-6">
          <div className="space-y-5">
            {questions.map((q, idx) => {
              const selectedValue = answers[q.id] || '';
              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3.5">
                  <div className="flex gap-2 items-start">
                    <span className="p-1 px-2 rounded-md bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed md:pt-0.5">
                      {q.question_text}
                    </p>
                  </div>

                  {/* Multiple Choice Options */}
                  {q.question_type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-7">
                      {(Object.keys(q.options) as Array<'A' | 'B' | 'C' | 'D'>).map(key => {
                        const optValue = q.options![key];
                        const isChosen = selectedValue === key;
                        return (
                          <div
                            key={key}
                            onClick={() => handleSelectOption(q.id, key)}
                            className={`px-4 py-3 rounded-xl border text-xs cursor-pointer select-none transition flex items-center gap-2.5 font-medium
                              ${isChosen 
                                ? 'bg-indigo-600 text-white border-transparent dark:bg-blue-400 dark:text-slate-950 font-bold' 
                                : 'bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                              }`}
                          >
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-xs border font-bold ${
                              isChosen ? 'bg-white/20 border-white/40' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-705 text-slate-500'
                            }`}>
                              {key}
                            </span>
                            <span className="flex-1">{optValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer option */}
                  {q.question_type === 'short_answer' && (
                    <div className="pl-7">
                      <textarea
                        value={selectedValue}
                        onChange={(e) => handleChangeShortAnswer(q.id, e.target.value)}
                        placeholder="Draft your diagnostic proof, calculation details, or physical definitions..."
                        className="w-full min-h-[70px] p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-650 outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-450 font-mono font-medium">
              Progress: {Object.keys(answers).length} / {questions.length} answered
            </span>
            <Button size="md" type="submit" isLoading={submitting}>
              Submit All Diagnostic Answers <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Result review section */}
      {result && (
        <div className="space-y-5">
          {/* Summary diagnostic report card */}
          <Card className="p-5 md:p-6 border-indigo-250 dark:border-indigo-905 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-2xl relative overflow-hidden space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block">REPORT CONTEXT</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white heading-font">Diagnostic Report</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{topicTitle}</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                <Trophy className="h-6 w-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-b border-indigo-500/10 py-4 my-2">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Score</span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">{result.score} / {result.max_score}</p>
              </div>
              <div className="space-y-0.5 border-l border-indigo-500/10">
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Performance</span>
                <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{result.percentage}%</p>
              </div>
              <div className="space-y-0.5 border-l border-indigo-500/10">
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Decision</span>
                <p className="text-xs font-black uppercase truncate text-indigo-600 dark:text-indigo-400 pt-1.5">{result.outcome || 'Approved'}</p>
              </div>
              <div className="space-y-0.5 border-l border-indigo-500/10">
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Completion Checkmark</span>
                <p className="text-xs pt-1">{result.show_checkmark ? <Badge variant="completed">Earned ✓</Badge> : <Badge variant="not_started">Ongoing</Badge>}</p>
              </div>
            </div>

            {/* Strengths & Weaknesses chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Strengths Detected</span>
                {result.strengths && result.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.strengths.map((str, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                        ✓ {str}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No specific strength targets mapped on this run.</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Remediation Flags</span>
                {result.weaknesses && result.weaknesses.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.weaknesses.map((weak, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-450 font-bold">
                        ⚠ {weak}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-emerald-500 font-semibold">Perfect! No learning weaknesses flagged.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Per question review panel list */}
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
              DETAILED ITEM AUDIT
            </h5>
            {result.details && result.details.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-2">
                    <span className="font-bold text-xs text-slate-450">Q{idx + 1}.</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-205">{item.question_text}</p>
                  </div>
                  <div>
                    {item.is_correct ? (
                      <Badge variant="completed">Correct</Badge>
                    ) : (
                      <Badge variant="refusal">Incorrect</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-450 font-semibold block mb-0.5">Your Choice / Explanation</span>
                    <p className={`font-medium ${item.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {item.student_answer || '(Empty answer submitted)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-450 font-semibold block mb-0.5">Correct Answer Key</span>
                    <p className="text-emerald-600 dark:text-emerald-450 font-mono font-bold">
                      {item.correct_answer}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pl-1">
                  <span className="text-[10px] uppercase font-bold text-blue-500 block">AI Logic & Explanation</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">{item.feedback}</p>
                  {item.explanation && (
                    <p className="text-xs text-slate-400 dark:text-slate-550 leading-normal italic mt-1 bg-slate-100/30 dark:bg-slate-800/20 p-2 rounded-lg">
                      <strong>Deep dive:</strong> {item.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Practice/recheck triggers */}
          <div className="flex justify-center pt-3 gap-3">
            <Button size="sm" variant="secondary" onClick={handleGenerateQuiz}>
              <RefreshCw className="h-3 w-3 mr-1" /> Re-trigger Diagnostic Quiz
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
