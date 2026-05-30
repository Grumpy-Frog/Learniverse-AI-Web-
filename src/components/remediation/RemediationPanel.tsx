import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { RemediationSession } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import MarkdownContent from '../markdown/MarkdownContent';
import { ShieldCheck, HelpCircle, ArrowRight, Sparkles, AlertCircle, CheckSquare } from 'lucide-react';

interface RemediationPanelProps {
  topicId: string;
  topicTitle: string;
  onRemediationCompleted?: () => void;
}

export default function RemediationPanel({
  topicId,
  topicTitle,
  onRemediationCompleted
}: RemediationPanelProps) {
  const [remediation, setRemediation] = useState<RemediationSession | null>(null);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [studentAnswer, setStudentAnswer] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  useEffect(() => {
    fetchTopicRemediation();
  }, [topicId]);

  const fetchTopicRemediation = async () => {
    setLoading(true);
    setError(null);
    setRemediation(null);
    setWeaknesses([]);
    setStudentAnswer('');
    setStatusMsg(null);
    try {
      // 1. Fetch current topic status to extract weaknesses list
      const status = await api.getTopicStatus(topicId);
      if (status && status.weaknesses && status.weaknesses.length > 0) {
        setWeaknesses(status.weaknesses);
      } else {
        // Fallback: fetch directly from database if weaknesses already loaded
        try {
          const rem = await api.getRemediationByTopic(topicId);
          if (rem) {
            setRemediation(rem);
            setWeaknesses(rem.weaknesses || []);
          }
        } catch (e) {
          // No active remediation recorded yet
        }
      }
    } catch (err: any) {
      console.warn('Could not locate topic weaknesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRemediation = async () => {
    setLoading(true);
    setError(null);
    setStatusMsg(null);
    try {
      // Typically, remediation is booted from diagnostic session, but if we have topicId 
      // we can also load the diagnostic history of the topic to extract the latest diagnostic sessionId.
      // Let's create an elegant remediation session directly, or if they just generated a diagnostic quiz,
      // let's retrieve the diagnostic sessions from the backend context to pull the latest submitted quiz.
      // A highly robust pattern: let's invoke a prompt/generation mapping to get focused help!
      const status = await api.getTopicStatus(topicId);
      let session_id = '';
      
      // Let's search the user's sessions to locate the active quiz session
      // For absolute dependability, we can allow generating focused help from the actual quiz sessions context or boot a template diagnostic mapping.
      // Let's use GET /diagnostics/me/subjects/ and find any submitted session, or if they have weaknesses,
      // trigger the remediation generation. Let's use a creative approach: since we can generate remediation based on topic weakness status directly:
      // Let's invoke a mock session ID or let the backend authorize it using a session_id. Wait! Since we need diagnostic_session_id:
      // Let's save the last diagnostic session ID in sessionStorage and retrieve it here!
      const cachedSessionId = sessionStorage.getItem(`learniverse_last_session_id_${topicId}`);
      if (!cachedSessionId) {
        throw new Error('Please submit a Diagnostic Quiz first to compile weakness indicators.');
      }

      const rem: RemediationSession = await api.generateRemediation(cachedSessionId);
      setRemediation(rem);
      if (rem.weaknesses) {
        setWeaknesses(rem.weaknesses);
      }
    } catch (err: any) {
      setError(err.message || 'Complete the Diagnostic Quiz first to generate tailored remedial lessons.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswer.trim() || !remediation) return;

    setSubmitting(true);
    setError(null);
    setStatusMsg(null);
    try {
      // POST recheck answer
      const result = await api.submitRemediationRecheck(remediation.id, studentAnswer);
      
      // Reload details to get recheck_score and feedback
      const updated: RemediationSession = await api.getRemediationSession(remediation.id);
      setRemediation(updated);

      if (updated.status === 'completed') {
        setStatusMsg({
          type: 'success',
          text: updated.recheck_feedback || 'Success! Your recheck response successfully resolves this weakness indicator.'
        });
        if (onRemediationCompleted) onRemediationCompleted();
      } else {
        setStatusMsg({
          type: 'warn',
          text: updated.recheck_feedback || 'The solution needs minor correction. Check the micro-lesson hint details and submit again.'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while verifying recheck response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white/65 dark:bg-slate-900/40 p-5 md:p-6 rounded-2xl space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-[0.15em] block">
            Focused Study Companion
          </span>
          <h4 className="text-base font-black text-slate-800 dark:text-white heading-font">
            FOCUSED STUDY & REMEDIATION
          </h4>
        </div>
        {!remediation && weaknesses.length > 0 && (
          <Button size="sm" variant="success" onClick={handleGenerateRemediation} isLoading={loading}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Get Focused Help
          </Button>
        )}
      </div>

      {loading && <LoadingState message="Tailoring customized remediation script based on quiz performance..." />}

      {error && (
        <StatusMessage type="error" message={error} onRetry={fetchTopicRemediation} />
      )}

      {/* Weakness highlights before loading */}
      {!remediation && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Based on current assessment diagnostics, Learniverse AI has categorized these items for practice focus:
          </p>
          {weaknesses.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10">
              {weaknesses.map((weak, i) => (
                <span key={i} className="px-2.5 py-1 text-xs rounded-md bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
                  ⚠ {weak}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 text-center rounded-xl text-xs text-slate-450 italic bg-slate-50 dark:bg-transparent">
              No learning weakness targets identified yet. Submit a Diagnostic Quiz to explore.
            </div>
          )}
        </div>
      )}

      {/* Tailored Remediation lesson sheet */}
      {remediation && (
        <div className="space-y-4">
          <Card className="p-4 md:p-5 border-amber-200 dark:border-amber-900 bg-amber-500/5 dark:bg-amber-400/5 rounded-xl space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                Tailored Remedial Lesson
              </span>
              <Badge variant={remediation.status === 'completed' ? 'completed' : 'needs_practice'}>
                {remediation.status === 'completed' ? 'Completed' : 'Needs Retry'}
              </Badge>
            </div>

            <h5 className="text-base font-black text-slate-900 dark:text-white heading-font border-b border-amber-500/10 pb-2">
              {remediation.lesson_title || 'Active Remediation Class'}
            </h5>

            {/* Markdown Lesson Content */}
            <MarkdownContent 
              content={remediation.remediation_text || 'Preparing detailed visual guide...'} 
              className="prose-sm dark:prose-invert"
            />
          </Card>

          {/* Interactive Recheck Challenge */}
          {remediation.recheck_question && (
            <div className="p-4 rounded-xl border border-slate-250 dark:border-slate-800 bg-[#FCFDFE] dark:bg-slate-900/60 space-y-3">
              <div className="flex gap-1.5 items-start">
                <CheckSquare className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-indigo-500 dark:text-blue-400 block tracking-wider">Recheck Challenge Question</span>
                  <p className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                    {remediation.recheck_question}
                  </p>
                </div>
              </div>

              {/* Status Note */}
              {statusMsg && (
                <StatusMessage 
                  type={statusMsg.type === 'success' ? 'success' : 'warning'} 
                  message={statusMsg.text} 
                />
              )}

              {/* Input for answer */}
              {remediation.status !== 'completed' ? (
                <form onSubmit={handleSubmitRecheck} className="space-y-2.5 pt-1.5">
                  <textarea
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder="Provide your corrected response to this concept check..."
                    className="w-full min-h-[60px] p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-650 outline-hidden focus:border-indigo-500"
                    required
                  />
                  <div className="flex justify-end">
                    <Button size="sm" type="submit" isLoading={submitting}>
                      Submit Recheck Answer <ArrowRight className="h-3 ml-1" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-850 dark:text-emerald-400 font-medium">
                  ✓ Recheck passed! You have addressed all remedial flags for this segment. Close this panel or check other chapters.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
