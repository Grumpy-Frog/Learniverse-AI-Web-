import React, { useState } from 'react';
import { api } from '../../../lib/api';
import Button from '../../ui/Button';
import { Layers, Sparkles, AlertCircle, Settings2, ArrowRight } from 'lucide-react';

interface RagChunkBuilderProps {
  documentId: string;
  topicId: string;
  onChunksBuilt: () => void;
}

export default function RagChunkBuilder({ documentId, topicId, onChunksBuilt }: RagChunkBuilderProps) {
  const [params, setParams] = useState({
    page_start: 1,
    page_end: 1,
    chunk_size_words: 220,
    overlap_words: 35
  });
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (params.page_end < params.page_start) {
      setError('Invalid page range: End page must be greater than start page.');
      return;
    }

    setBuilding(true);
    setError(null);
    setSuccessCount(null);

    try {
      const res = await api.buildRagChunks(documentId, {
        topic_id: topicId,
        ...params
      });
      setSuccessCount(res.chunks_count || 0);
      onChunksBuilt();
    } catch (err: any) {
      setError(err.message || 'Error occurred while building RAG chunks.');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-indigo-500/30 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
         <Layers className="h-32 w-32 text-indigo-500 -rotate-12" />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-indigo-500" />
        </div>
        <h4 className="text-sm font-black uppercase text-white tracking-[0.2em]">Chunk Generation Matrix</h4>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1">Page Start</label>
            <input
              type="number"
              min="1"
              value={params.page_start}
              onChange={(e) => setParams(prev => ({ ...prev, page_start: parseInt(e.target.value) }))}
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500/50"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1">Page End</label>
            <input
              type="number"
              min="1"
              value={params.page_end}
              onChange={(e) => setParams(prev => ({ ...prev, page_end: parseInt(e.target.value) }))}
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500/50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1">Chunk Size (Words)</label>
            <input
              type="number"
              min="50"
              value={params.chunk_size_words}
              onChange={(e) => setParams(prev => ({ ...prev, chunk_size_words: parseInt(e.target.value) }))}
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-slate-400 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1">Overlap (Words)</label>
            <input
              type="number"
              min="0"
              value={params.overlap_words}
              onChange={(e) => setParams(prev => ({ ...prev, overlap_words: parseInt(e.target.value) }))}
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-slate-400 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
          </div>
        )}

        {successCount !== null && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1 text-emerald-500">
            <div className="flex items-center gap-2">
               <Sparkles className="h-4 w-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">Build Sequence Complete</p>
            </div>
            <p className="text-xs font-bold font-mono opacity-80 pl-6">{successCount} fragments mapped & indexed.</p>
          </div>
        )}

        <Button 
          type="submit" 
          isLoading={building}
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/30 group"
        >
          {building ? 'Indexing Engine Active' : 'Build RAG Chunks'}
          {!building && <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </form>

      <div className="pt-4 border-t border-white/5">
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          Mapping this page range will create overlapping vector nodes attributed specifically to the selected topic. Word count and overlap control the granularity and context preservation during semantic retrieval.
        </p>
      </div>
    </div>
  );
}
