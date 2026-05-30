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
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
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
          <Card className="p-5 border-2 border-black dark:border-white rounded-xl bg-white space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-905 block flex items-center gap-1.5 border-b pb-2 mb-3">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Concept Description Constraints <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Focus on physical vector equations, make it suitable for high-school mechanics curriculum..."
                  className="w-full text-xs p-3 border rounded bg-slate-50/50 dark:bg-slate-950/20 text-slate-910 placeholder:text-slate-400 focus:outline-hidden"
                  rows={4}
                  required
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Language Output</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded border bg-white dark:bg-slate-900 text-slate-900"
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
            <Card className="p-12 border border-slate-200 dark:border-neutral-800 text-center rounded-xl min-h-[420px] flex items-center justify-center bg-white">
              <LoadingState message="Generating blog draft..." size="lg" />
            </Card>
          ) : generatedDraft ? (
            <Card className="p-6 border-2 border-slate-900 dark:border-white rounded-xl bg-[#fbfbfc] space-y-4 max-h-[640px] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-indigo-500 text-white px-2 py-0.5 rounded font-bold">{generatedDraft.category}</span>
                  <span className="text-[10px] font-mono uppercase text-slate-400 ml-2 font-black">{generatedDraft.language.toUpperCase()} DOCUMENT</span>
                </div>
                <div className="text-emerald-600 font-mono text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> DRAFT SAVED IN DATABASE
                </div>
              </div>

              <h2 className="text-lg font-black uppercase text-slate-950">{generatedDraft.title}</h2>
              <p className="text-xs text-slate-500 leading-normal italic font-medium">Excerpt Abstract: {generatedDraft.excerpt}</p>
              
              {validationReason && (
                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight mb-1">Validation Intelligence</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">{validationReason}</p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <p className="text-[9px] font-mono uppercase text-slate-400 font-black block">Drafted Markdown content preview</p>
                <div className="bg-white p-4 rounded border font-sans text-xs text-slate-750 leading-relaxed max-w-none prose dark:prose-invert">
                  <MarkdownContent content={generatedDraft.content_markdown} />
                </div>
              </div>

              {generationNote && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2">{generationNote}</p>
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
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-205 rounded-xl bg-slate-50/20 min-h-[420px]">
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
