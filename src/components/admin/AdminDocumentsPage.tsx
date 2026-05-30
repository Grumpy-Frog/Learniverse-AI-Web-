import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Grade, Subject, Chapter, Topic, TextbookDocument } from '../../types';
import Navigation from '../layout/Navbar';
import Button from '../ui/Button';
import CatalogSelector from './rag/CatalogSelector';
import DocumentUploadForm from './rag/DocumentUploadForm';
import DocumentList from './rag/DocumentList';
import DocumentPageReview from './rag/DocumentPageReview';
import DocumentApprovalPanel from './rag/DocumentApprovalPanel';
import RagChunkBuilder from './rag/RagChunkBuilder';
import RagChunkList from './rag/RagChunkList';
import RagSearchTester from './rag/RagSearchTester';
import { Database, ShieldAlert, ArrowLeft, Loader2, BookText, GraduationCap, LayoutGrid } from 'lucide-react';

export default function AdminDocumentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [selection, setSelection] = useState<{
    gradeId: string | null;
    subjectId: string | null;
    chapterId: string | null;
    topicId: string | null;
  }>({
    gradeId: null,
    subjectId: null,
    chapterId: null,
    topicId: null,
  });

  const [selectedDocument, setSelectedDocument] = useState<TextbookDocument | null>(null);
  const [documents, setDocuments] = useState<TextbookDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      setIsAdmin(me.role === 'admin');
    } catch (e) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (chapterId: string) => {
    setLoadingDocs(true);
    try {
      const docs = await api.getDocumentsByChapter(chapterId);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSelectionChange = (newSelection: any) => {
    setSelection(prev => {
      const changed = prev.chapterId !== newSelection.chapterId;
      if (changed) {
        setSelectedDocument(null);
        if (newSelection.chapterId) {
          fetchDocuments(newSelection.chapterId);
        } else {
          setDocuments([]);
        }
      }
      return newSelection;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Admin access required</h1>
        <p className="text-slate-400 max-w-md mb-8">Only administrators can upload documents and build RAG chunks. Please return to the dashboard.</p>
        <Button onClick={() => window.location.href = '/'}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      
      {/* Dynamic Workspace Header */}
      <div className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
               <Database className="h-6 w-6 text-indigo-500" />
             </div>
             <div>
               <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Textbook Content Workbench</h1>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">AI Textbooks & RAG Indexer</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             {selection.chapterId && (
               <div className="hidden lg:flex items-center gap-4 py-2 px-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex flex-col border-r border-white/5 pr-4">
                    <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">Chapter Context</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-[150px]">Active Session</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider">RAG Status</span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Ready for Indexing</span>
                  </div>
               </div>
             )}
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Admin Active</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
        
        {/* Intro */}
        <div className="mb-12">
           <h2 className="text-3xl font-black text-white tracking-tight mb-3">Manage Sources</h2>
           <p className="text-slate-400 max-w-2xl font-medium leading-relaxed">
             Upload textbook PDFs, review extracted texts, confirm sheets approval, map topic-specific overlapping chunks, and run semantic queries to ground AI responses.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - catalog and documents */}
          <div className="lg:col-span-4 space-y-8">
            
            <section className="space-y-4">
               <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">1. Catalog Context</h3>
               </div>
               <CatalogSelector 
                  selection={selection} 
                  onSelectionChange={handleSelectionChange} 
               />
            </section>

            {selection.chapterId && (
              <>
                <section className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 mb-4">
                     <LayoutGrid className="h-4 w-4 text-blue-500" />
                     <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">2. Source Repository</h3>
                  </div>
                  <DocumentUploadForm 
                    chapterId={selection.chapterId} 
                    onUploadSuccess={() => fetchDocuments(selection.chapterId!)} 
                  />
                  <DocumentList 
                    documents={documents} 
                    loading={loadingDocs}
                    selectedId={selectedDocument?.id || null}
                    onSelect={(doc) => setSelectedDocument(doc)}
                  />
                </section>
              </>
            )}
          </div>

          {/* Right Column - deep review and action */}
          <div className="lg:col-span-8 space-y-10">
            {selectedDocument ? (
              <div className="space-y-10">
                
                <section className="space-y-6">
                   <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <BookText className="h-5 w-5 text-amber-500" />
                        <h3 className="text-sm font-black uppercase text-white tracking-[0.15em]">Content Verification</h3>
                      </div>
                      <DocumentApprovalPanel 
                        document={selectedDocument} 
                        onApproved={(updated) => {
                          setSelectedDocument(updated);
                          fetchDocuments(selection.chapterId!);
                        }} 
                      />
                   </div>
                   
                   <DocumentPageReview documentId={selectedDocument.id} />
                </section>

                {selectedDocument.is_approved && selection.topicId && (
                  <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="pt-8 border-t border-white/10">
                       <h3 className="text-sm font-black uppercase text-indigo-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-indigo-500" />
                         RAG Intelligence Builder
                       </h3>
                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          <RagChunkBuilder 
                            documentId={selectedDocument.id}
                            topicId={selection.topicId}
                            onChunksBuilt={() => {}} // Optional: refresh list
                          />
                          <RagSearchTester topicId={selection.topicId} />
                       </div>
                    </div>
                    
                    <RagChunkList 
                      documentId={selectedDocument.id} 
                      topicId={selection.topicId} 
                    />
                  </section>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[600px] rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center p-12 text-center group bg-slate-900/10">
                 <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/5 flex items-center justify-center mb-8 group-hover:border-indigo-500/30 transition-all duration-500">
                    <BookText className="h-10 w-10 text-slate-700 group-hover:text-indigo-500/50 transition-all" />
                 </div>
                 <h4 className="text-xl font-black text-slate-300 mb-3 tracking-tight">Workbench Idle</h4>
                 <p className="text-sm text-slate-500 max-w-sm font-medium">Select a chapter & source document from the left repository to start extracting knowledge chunks.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
