import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { DocumentPage } from '../../../types';
import { FileText, Eye, ChevronDown, ChevronUp, AlertCircle, Search } from 'lucide-react';

interface DocumentPageReviewProps {
  documentId: string;
}

export default function DocumentPageReview({ documentId }: DocumentPageReviewProps) {
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPages();
  }, [documentId]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.getDocumentPages(documentId);
      setPages(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (pageId: string) => {
    const newSet = new Set(expandedPages);
    if (newSet.has(pageId)) newSet.delete(pageId);
    else newSet.add(pageId);
    setExpandedPages(newSet);
  };

  const filteredPages = pages.filter(p => 
    p.page_number.toString().includes(searchQuery) || 
    p.extracted_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 bg-slate-900/50 rounded-[3rem] border border-white/5">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Processing Knowledge Map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search within extracted text or page number..."
             className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-colors"
           />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-4 rounded-2xl bg-slate-900 border border-white/5">
           <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest whitespace-nowrap">Source Volume</span>
           <span className="text-xs font-black text-indigo-400">{pages.length} Pages</span>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="p-20 rounded-[3rem] bg-slate-900/30 border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
           <AlertCircle className="h-10 w-10 text-slate-700 mb-4" />
           <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Extraction Data</h5>
           <p className="text-[10px] font-bold text-slate-600 uppercase mt-2">The document may be still processing or text extraction was unsuccessful.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPages.map((page) => (
            <div 
              key={page.id} 
              className={`rounded-3xl border transition-all overflow-hidden
                ${page.has_text ? 'bg-slate-900 border-white/5' : 'bg-rose-500/5 border-rose-500/10'}
                ${expandedPages.has(page.id) ? 'ring-1 ring-indigo-500/30' : ''}
              `}
            >
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(page.id)}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black
                     ${page.has_text ? 'bg-slate-950 text-slate-500 border border-white/5' : 'bg-rose-500/20 text-rose-500 border border-rose-500/20'}
                   `}>
                     {page.page_number}
                   </div>
                   <div>
                      <h6 className="text-[10px] font-black uppercase text-white tracking-widest">Page {page.page_number}</h6>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className={`text-[8px] font-black uppercase tracking-tighter
                           ${page.has_text ? 'text-emerald-500' : 'text-rose-500'}
                         `}>
                           {page.has_text ? 'OCR SUCCESS' : 'OCR DATA EMPTY'}
                         </span>
                         {page.has_text && <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">&bull; {page.extracted_text.split(/\s+/).length} words mapped</span>}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   {page.has_text && (
                     <div className="hidden md:block max-w-[300px] truncate">
                        <p className="text-[10px] text-slate-500 italic font-medium">"{page.extracted_text.slice(0, 100)}..."</p>
                     </div>
                   )}
                   <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      {expandedPages.has(page.id) ? <ChevronUp className="h-4 w-4 text-white" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                   </button>
                </div>
              </div>

              {expandedPages.has(page.id) && (
                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                   <div className="p-6 rounded-2xl bg-slate-950 border border-white/5 relative group">
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black uppercase bg-white/10 text-white px-2 py-1 rounded">Raw Buffer</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed whitespace-pre-wrap font-mono selection:bg-indigo-500 selection:text-white">
                        {page.extracted_text || 'No text content extracted for this page. (Scanned image or blank sheet)'}
                      </p>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
