import React, { useState } from 'react';
import { api } from '../../../lib/api';
import { RagSearchResponse } from '../../../types';
import Button from '../../ui/Button';
import { Search, Sparkles, AlertCircle, Quote, Compass, Share2 } from 'lucide-react';

interface RagSearchTesterProps {
  topicId: string;
}

export default function RagSearchTester({ topicId }: RagSearchTesterProps) {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [limit, setLimit] = useState(3);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<RagSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    try {
      const res = await api.testRagSearch(query, language, topicId, limit);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'RAG Search query failed.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-8 rounded-[2.5rem] bg-indigo-900/10 border border-indigo-500/20 space-y-8 h-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
          <Compass className="h-5 w-5 text-indigo-400" />
        </div>
        <h4 className="text-sm font-black uppercase text-white tracking-[0.2em]">Semantic Retrieval Tester</h4>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1">Natural Query</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about this topic..."
              className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
              {(['en', 'bn'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                    ${language === l ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-400'}
                  `}
                >
                  {l}
                </button>
              ))}
           </div>
           <div className="flex items-center gap-3 bg-slate-950 border border-white/5 rounded-xl px-4">
             <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Limit</span>
             <input 
               type="number" 
               min="1" 
               max="10" 
               value={limit}
               onChange={(e) => setLimit(parseInt(e.target.value))}
               className="bg-transparent text-xs font-black text-white w-full outline-none text-right"
             />
           </div>
        </div>

        <Button 
          type="submit" 
          isLoading={searching}
          className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] group transition-all"
        >
          {searching ? 'Querying Latent Space' : 'Execute Test Query'}
          {!searching && <Sparkles className="h-4 w-4 ml-2 text-indigo-400 group-hover:scale-110 transition-transform" />}
        </Button>
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500">
           <AlertCircle className="h-4 w-4 shrink-0" />
           <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Matches Found: {result.results.length}</span>
             <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">via {result.retrieval_method}</span>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
             {result.results.length === 0 ? (
               <div className="py-12 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No matching vectors found.</p>
               </div>
             ) : (
               result.results.map((hit, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3 group/hit">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Quote className="h-3 w-3 text-indigo-500 opacity-50" />
                           <span className="text-[9px] font-black uppercase text-slate-400">Score {Math.round(hit.score * 100)}%</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded uppercase">Fragment {hit.chunk_index}</span>
                     </div>
                     <p className="text-[11px] font-medium text-slate-400 leading-relaxed group-hover/hit:text-slate-200 transition-colors">
                        {hit.content.slice(0, 300)}...
                     </p>
                     <div className="pt-2 flex items-center justify-between border-t border-white/5">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Pages {hit.page_start} - {hit.page_end}</span>
                        <Share2 className="h-3 w-3 text-slate-800" />
                     </div>
                  </div>
               ))
             )}
          </div>
        </div>
      )}
    </div>
  );
}
