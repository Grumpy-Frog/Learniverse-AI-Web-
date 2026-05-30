import React, { useState, useRef } from 'react';
import { api } from '../../../lib/api';
import Button from '../../ui/Button';
import { Upload, FileUp, Sparkles, X, FileCheck } from 'lucide-react';

interface DocumentUploadFormProps {
  chapterId: string;
  onUploadSuccess: () => void;
}

export default function DocumentUploadForm({ chapterId, onUploadSuccess }: DocumentUploadFormProps) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setError(null);

    try {
      await api.uploadDocument(chapterId, title, language, file);
      setTitle('');
      setFile(null);
      setShowForm(false);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        variant="secondary" 
        className="w-full h-14 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/5 hover:bg-indigo-500/5 group rounded-2xl"
        onClick={() => setShowForm(true)}
      >
        <Upload className="h-4 w-4 mr-2 text-slate-500 group-hover:text-indigo-500 transition-colors" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400 transition-colors">Import PDF Source</span>
      </Button>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-6 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <FileUp className="h-4 w-4 text-indigo-500" />
           <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Source PDF Ingression</h4>
        </div>
        <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Document Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Physics Textbook Part 1"
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Language</label>
          <div className="flex gap-2">
            {(['en', 'bn'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all
                  ${language === lang 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/10'
                  }
                `}
              >
                {lang === 'en' ? 'English (Global)' : 'Bengali (Local)'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">PDF Payload</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3
              ${file 
                ? 'bg-emerald-500/5 border-emerald-500/30' 
                : 'bg-slate-950 border-white/5 hover:border-indigo-500/30 hover:bg-white/5'
              }
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf"
              className="hidden"
            />
            {file ? (
              <>
                <FileCheck className="h-8 w-8 text-emerald-500" />
                <div className="text-center">
                  <p className="text-xs font-black text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[9px] font-bold text-emerald-500/60 uppercase mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Loaded</p>
                </div>
              </>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-slate-700" />
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Click to select PDF file</p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-500 font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20"
          isLoading={uploading}
          disabled={!file || !title}
        >
          <Sparkles className="h-4 w-4 mr-2" /> Start Extraction
        </Button>
      </form>
    </div>
  );
}
