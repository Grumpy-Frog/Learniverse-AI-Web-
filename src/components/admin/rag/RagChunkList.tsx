import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { DocumentChunk } from '../../../types';
import { Layers, ChevronDown, ChevronUp, FileCode, CheckCircle2, SearchX } from 'lucide-react';

interface RagChunkListProps {
  documentId: string;
  topicId: string;
}

export default function RagChunkList({ documentId, topicId }: RagChunkListProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchChunks();
  }, [documentId, topicId]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const res = await api.getRagChunks(documentId, topicId);
      setChunks(res);
    } catch (e) {
      console.error(e);
      setChunks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedIndices(newSet);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Hydrating Chunk Metadata...</p>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="p-12 rounded-[2rem] bg-slate-900/20 border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
         <SearchX className="h-8 w-8 text-slate-800 mb-4" />
         <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">No Chunks Indexed</h5>
         <p className="text-[10px] font-bold text-slate-600 uppercase mt-2">Select a page range and launch the indexing sequence above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
           <Layers className="h-4 w-4 text-indigo-500" />
           <h3 className="text-xs font-black uppercase text-white tracking-[0.2em]">Generated Knowledge Fragments</h3>
         </div>
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-900 border border-white/5 px-3 py-1 rounded-full">
           {chunks.length} Total Nodes
         </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {chunks.map((chunk, i) => (
          <div key={chunk.id} className="rounded-3xl border border-white/5 bg-slate-900 overflow-hidden group">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => toggleExpand(i)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-[11px] font-black text-white border border-white/5">
                  #{chunk.chunk_index}
                </div>
                <div>
                   <h6 className="text-[10px] font-black uppercase text-white tracking-widest mb-0.5">Fragment Sequence {chunk.chunk_index}</h6>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 grayscale opacity-50">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Pages {chunk.page_start}-{chunk.page_end}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-indigo-400 tracking-tighter">{chunk.word_count} Words</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="hidden lg:block max-w-[400px] truncate">
                   <p className="text-[10px] font-medium text-slate-500 italic">"{chunk.content.slice(0, 100)}..."</p>
                 </div>
                 <div className={`p-2 rounded-xl transition-all ${expandedIndices.has(i) ? 'bg-indigo-500/10 text-indigo-500' : 'text-slate-600'}`}>
                    {expandedIndices.has(i) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                 </div>
              </div>
            </div>

            {expandedIndices.has(i) && (
              <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                 <div className="p-6 rounded-2xl bg-slate-950 border border-white/5 relative">
                   <div className="absolute top-4 right-4 flex items-center gap-2">
                      <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="h-2 w-2" />
                        Vector State Active
                      </div>
                   </div>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed font-mono selection:bg-indigo-500 selection:text-white">
                      {chunk.content}
                   </p>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
