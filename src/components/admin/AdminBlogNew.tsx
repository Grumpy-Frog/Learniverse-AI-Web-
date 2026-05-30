import React, { useState } from 'react';
import { api } from '../../lib/api';
import { BlogPost } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import MarkdownContent from '../markdown/MarkdownContent';
import { Newspaper, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface AdminBlogNewProps {
  onNavigate: (path: string) => void;
}

export default function AdminBlogNew({ onNavigate }: AdminBlogNewProps) {
  const [topic, setTopic] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  // Load drafted blog post result
  const [generatedDraft, setGeneratedDraft] = useState<BlogPost | null>(null);
  const [validationReason, setValidationReason] = useState<string | null>(null);
  const [generationNote, setGenerationNote] = useState<string | null>(null);

  // States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Educational topic keyword parameter is required.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeneratedDraft(null);

    try {
      const response = await api.generateBlogDraft(topic, description, language);
      setGeneratedDraft(response.post);
      setValidationReason(response.validation_reason);
      setGenerationNote(response.note);
      setSuccessMsg(`Blog draft '${response.post.title}' generated successfully!`);
      
      // Clear forms
      setTopic('');
      setDescription('');
    } catch (err: any) {
      // Show warning box if backend rejects topic or description values
      console.error(err);
      setErrorMsg(err.message || 'Educational AI content generating rejected. Suggest matching more appropriate science topic definitions.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Structural Header */}
      <div className="border-b border-black dark:border-white pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('/admin/blog')}
            className="p-1 px-2 border hover:bg-slate-50 text-xs rounded uppercase font-mono mr-2 cursor-pointer inline-flex items-center gap-1 text-slate-500"
          >
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] font-black text-blue-500 uppercase">
              AI Generated Blog
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] mt-1">
              Create AI Blog Draft
            </h1>
          </div>
        </div>
      </div>

      {successMsg && <StatusMessage type="success" message={successMsg} />}
      {errorMsg && <StatusMessage type="warning" title="Draft Generation Reject" message={errorMsg} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Creator Parameters Form */}
        <div className="lg:col-span-5">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] block flex items-center gap-1.5 border-b border-[var(--glass-border)] pb-2 mb-3">
              <Sparkles className="h-4.5 w-4.5 text-rose-500" /> GENERATE DRAFT LESSON
            </h3>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <Input
                label="Target Educational Topic"
                placeholder="e.g. Gravity and pendulum friction loss"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                required
                disabled={isGenerating}
                helperText="Science or math core concept identifiers"
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Concept Description Constraints <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Focus on physical vector equations, make it suitable for high-school mechanics curriculum..."
                  className="w-full text-xs p-3 border border-[var(--glass-border)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-hidden"
                  rows={4}
                  required
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Target Language Output</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  disabled={isGenerating}
                >
                  <option value="en">English (EN)</option>
                  <option value="bn">Bangla (BN)</option>
                </select>
              </div>

              <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isGenerating || !topic.trim() || !description.trim()}
                    isLoading={isGenerating}
                    variant="primary"
                    className="w-full uppercase text-xs font-black tracking-widest py-3"
                  >
                    ✨ AI Auto-Generate Blog Draft
                  </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Preview Output Viewport */}
        <div className="lg:col-span-7">
          {isGenerating ? (
            <Card className="p-12 text-center min-h-[420px] flex items-center justify-center">
              <LoadingState message="Generating blog draft..." size="lg" />
            </Card>
          ) : generatedDraft ? (
            <Card className="p-6 space-y-4 max-h-[640px] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-[var(--accent-primary)] text-white px-2 py-0.5 rounded font-bold">{generatedDraft.category}</span>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] ml-2 font-black">{generatedDraft.language.toUpperCase()} DOCUMENT</span>
                </div>
                <div className="text-[var(--success)] font-mono text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> DRAFT SAVED IN DATABASE
                </div>
              </div>

              <h2 className="text-lg font-black uppercase text-[var(--text-primary)]">{generatedDraft.title}</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-normal italic font-medium">Excerpt Abstract: {generatedDraft.excerpt}</p>
              
              {validationReason && (
                <div className="bg-indigo-500/5 p-3 rounded-lg border border-[var(--glass-border)]">
                  <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-tight mb-1">Validation Intelligence</p>
                  <p className="text-[11px] text-[var(--text-primary)] leading-relaxed opacity-90">{validationReason}</p>
                </div>
              )}

              <div className="border-t border-[var(--glass-border)] pt-4 space-y-2">
                <p className="text-[9px] font-mono uppercase text-[var(--text-secondary)] font-black block">Drafted Markdown content preview</p>
                <div className="bg-[var(--bg-primary)] p-4 rounded border border-[var(--glass-border)] font-sans text-xs text-[var(--text-primary)] leading-relaxed max-w-none prose dark:prose-invert">
                  <MarkdownContent content={generatedDraft.content_markdown} />
                </div>
              </div>

              {generationNote && (
                <p className="text-[10px] text-[var(--text-secondary)] italic mt-2">{generationNote}</p>
              )}

              <Button
                onClick={() => onNavigate('/admin/blog')}
                variant="secondary"
                className="w-full uppercase text-[10px] tracking-widest font-black py-2.5"
              >
                Go to Blog publisher list
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/20 min-h-[420px]">
              <Newspaper className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-xs text-slate-500 max-w-sm">
                Enter details on the left form and hit generate. We will construct a beautifully structured markdown blog draft including headers, descriptions, math formula representations, and outlines.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
