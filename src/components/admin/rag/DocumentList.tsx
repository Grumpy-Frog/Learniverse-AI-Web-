import React from 'react';
import { TextbookDocument } from '../../../types';
import { FileText, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';

interface DocumentListProps {
  documents: TextbookDocument[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (doc: TextbookDocument) => void;
}

export default function DocumentList({ documents, loading, selectedId, onSelect }: DocumentListProps) {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Querying Sources...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
        <FileText className="h-8 w-8 text-slate-800 mb-3" />
        <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest leading-relaxed">No sources mapped to this chapter context.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc)}
          className={`w-full text-left p-4 rounded-2xl border transition-all relative group overflow-hidden
            ${selectedId === doc.id 
              ? 'bg-white/10 border-indigo-500 shadow-xl shadow-indigo-500/10' 
              : 'bg-slate-900 border-white/5 hover:border-white/10'
            }
          `}
        >
          {/* Active Background Glow */}
          {selectedId === doc.id && (
            <div className="absolute top-0 right-0 p-2 bg-indigo-500 text-slate-950 font-black text-[8px] uppercase tracking-tighter rounded-bl-xl shadow-lg">
              Active Source
            </div>
          )}

          <div className="flex gap-4 relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
              ${selectedId === doc.id ? 'bg-indigo-500 text-white' : 'bg-slate-950 text-slate-500 group-hover:text-slate-300'}
            `}>
              <FileText className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <h5 className="text-xs font-black text-white truncate uppercase tracking-tight mb-1">{doc.title}</h5>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {doc.language}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {doc.page_count} Pages
                </span>
                
                {/* Status Badge */}
                <div className="ml-auto flex items-center gap-1.5">
                   {doc.processing_status === 'processed' ? (
                     <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                   ) : doc.processing_status === 'failed' ? (
                     <AlertCircle className="h-3 w-3 text-rose-500" />
                   ) : (
                     <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                   )}
                   <span className={`text-[8px] font-black uppercase tracking-widest
                     ${doc.processing_status === 'processed' ? 'text-emerald-500' :
                       doc.processing_status === 'failed' ? 'text-rose-500' : 'text-amber-500'}
                   `}>
                     {doc.processing_status}
                   </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${doc.is_approved ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-700'}`} />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{doc.is_approved ? 'Approved Source' : 'Awaiting Audit'}</span>
             </div>
             <ChevronRight className={`h-4 w-4 transition-transform ${selectedId === doc.id ? 'translate-x-1 text-indigo-500' : 'text-slate-700'}`} />
          </div>
        </button>
      ))}
    </div>
  );
}
