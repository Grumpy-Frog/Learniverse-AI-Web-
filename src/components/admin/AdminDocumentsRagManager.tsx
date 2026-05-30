import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Grade, Subject, Chapter, Topic, TextbookDocument, DocumentPage, RAGChunk } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import { FileUp, FileText, CheckCircle, Search, HelpCircle, Layers, Clipboard, Cpu } from 'lucide-react';

export default function AdminDocumentsRagManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Selection
  const [selGrade, setSelGrade] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [selChapter, setSelChapter] = useState('');
  const [selTopic, setSelTopic] = useState('');

  // Loaded Items
  const [documents, setDocuments] = useState<TextbookDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<TextbookDocument | null>(null);
  const [extractedPages, setExtractedPages] = useState<DocumentPage[]>([]);
  const [ragChunks, setRagChunks] = useState<RAGChunk[]>([]);

  // Form Inputs
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLang, setUploadLang] = useState<'en' | 'bn'>('en');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Chunk Build Form
  const [chunkForm, setChunkForm] = useState({
    pageStart: 1,
    pageEnd: 1,
    chunkSize: 150,
    overlap: 20
  });

  // Search Test inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLang, setSearchLang] = useState<'en' | 'bn'>('en');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Loaders
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const g = await api.getGrades();
      setGrades(g || []);
    } catch (e: any) {
      setFeedback({ type: 'err', text: `Failed to fetch grade list: ${e.message}` });
    }
  };

  const handleGradeChange = async (gId: string) => {
    setSelGrade(gId);
    setSelSubject('');
    setSelChapter('');
    setSelTopic('');
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setDocuments([]);
  };

  const handleSubjectChange = async (sId: string) => {
    setSelSubject(sId);
    setSelChapter('');
    setSelTopic('');
    setChapters([]);
    setTopics([]);
    setDocuments([]);

    if (!sId) return;
    try {
      const c = await api.getChapters(sId);
      setChapters(c || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleChapterChange = async (cId: string) => {
    setSelChapter(cId);
    setSelTopic('');
    setTopics([]);
    setDocuments([]);

    if (!cId) return;
    setLoading(true);
    try {
      const t = await api.getTopics(cId);
      setTopics(t || []);

      // Pull document logs under this chapter
      const docs = await api.getDocumentsByChapter(cId);
      setDocuments(docs || []);
    } catch (e: any) {
      setFeedback({ type: 'err', text: `Failed to list textbook entries: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = (tId: string) => {
    setSelTopic(tId);
    if (activeDocument && tId) {
      fetchRagChunks(activeDocument.id, tId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selChapter) {
      setFeedback({ type: 'err', text: 'Please specify chapter target context first.' });
      return;
    }
    if (!uploadTitle.trim() || !uploadFile) {
      setFeedback({ type: 'err', text: 'Select a valid PDF textbook sheet and give it an editorial name.' });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      await api.uploadDocument(selChapter, uploadTitle, uploadLang, uploadFile);
      setFeedback({ type: 'success', text: `Textbook "${uploadTitle}" uploaded successfully! Triggering background extraction loops.` });
      
      setUploadTitle('');
      setUploadFile(null);
      
      // Reload documents lists
      const docs = await api.getDocumentsByChapter(selChapter);
      setDocuments(docs || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Error occurred while loading textbook pages.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectDocument = async (doc: TextbookDocument) => {
    setActiveDocument(doc);
    setLoading(true);
    setExtractedPages([]);
    setRagChunks([]);
    setFeedback(null);
    try {
      // Load pages
      const pages = await api.getDocumentPages(doc.id);
      setExtractedPages(pages || []);

      // Autofill chunk build form ranges
      setChunkForm(prev => ({
        ...prev,
        pageStart: 1,
        pageEnd: doc.page_count || pages.length || 1
      }));

      // If topic selected, pull existing chunks
      if (selTopic) {
        fetchRagChunks(doc.id, selTopic);
      }
    } catch (err: any) {
      setFeedback({ type: 'err', text: `Could not retrieve textbook worksheets: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchRagChunks = async (docId: string, topicId: string) => {
    try {
      const chunks = await api.getRagChunks(docId, topicId);
      setRagChunks(chunks || []);
    } catch (e) {
      setRagChunks([]);
    }
  };

  const handleApproveDocument = async () => {
    if (!activeDocument) return;

    setLoading(true);
    try {
      await api.approveDocument(activeDocument.id);
      setFeedback({ type: 'success', text: `Textbook "${activeDocument.title}" approved successfully.` });
      
      // Refresh documents
      if (selChapter) {
        const docs = await api.getDocumentsByChapter(selChapter);
        setDocuments(docs || []);
        const updated = docs.find((d: TextbookDocument) => d.id === activeDocument.id);
        if (updated) setActiveDocument(updated);
      }
    } catch (err: any) {
      setFeedback({ type: 'err', text: `Verification failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleBuildChunks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocument) return;
    if (!selTopic) {
      setFeedback({ type: 'err', text: 'Choose an active Topic study target to bind these embeddings.' });
      return;
    }

    setBuilding(true);
    setFeedback(null);
    try {
      const payload = {
        topic_id: selTopic,
        page_start: chunkForm.pageStart,
        page_end: chunkForm.pageEnd,
        chunk_size_words: chunkForm.chunkSize,
        overlap_words: chunkForm.overlap
      };

      await api.buildRagChunks(activeDocument.id, payload);
      setFeedback({ type: 'success', text: `RAG Chunks built successfully for the topic standard!` });
      fetchRagChunks(activeDocument.id, selTopic);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Error occurred while processing content embeddings.' });
    } finally {
      setBuilding(false);
    }
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await api.testRagSearch(searchQuery, searchLang, selTopic || undefined);
      setSearchResults(results || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: `Vector search test failed: ${err.message}` });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase mb-1">Textbook Content Workbench</span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white heading-font">
          AI TEXTBOOKS & RAG INDEXER
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-semibold">
          Upload textbook PDFs, review extracted texts, confirm sheets approval, map topic-specific overlapping chunks, and run semantic queries.
        </p>
      </div>

      {feedback && (
        <StatusMessage
          type={feedback.type === 'success' ? 'success' : 'error'}
          message={feedback.text}
        />
      )}

      {/* Selector box bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Grade */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-505">Level</label>
          <select
            value={selGrade}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-slate-200"
          >
            <option value="">-- Choose Grade Level --</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-505">Subject</label>
          <select
            value={selSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={!selGrade}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-805 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Chapter */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-505">Chapter</label>
          <select
            value={selChapter}
            onChange={(e) => handleChapterChange(e.target.value)}
            disabled={!selSubject}
            className="w-full text-xs p-2 rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-slate-205 disabled:opacity-50"
          >
            <option value="">-- Choose Chapter --</option>
            {chapters.map(c => <option key={c.id} value={c.id}>Chapter {c.chapter_number}: {c.title}</option>)}
          </select>
        </div>

        {/* Topic Context */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-505">Specific learning objective</label>
          <select
            value={selTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={!selChapter}
            className="w-full text-xs p-2 rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-805 dark:text-slate-205 disabled:opacity-50"
          >
            <option value="">-- Select Study Topic --</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </Card>

      {/* Main split: Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Uploads and indexing parameters */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Upload panel */}
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font border-b border-slate-100 dark:border-slate-800 pb-2">
              UPLOAD TEXTBOOK SHEETS (PDFS)
            </span>

            <form onSubmit={handleUploadDocument} className="space-y-3.5 text-xs">
              <Input
                label="Textbook Document Title"
                placeholder="e.g., Biology Chapter 3 Core Textbook pages"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-505 uppercase block">Worksheet Language Context</span>
                <select
                  value={uploadLang}
                  onChange={(e) => setUploadLang(e.target.value as 'en' | 'bn')}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="en">English (en)</option>
                  <option value="bn">Bangla (bn)</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select PDF File</span>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-205 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/30 transition cursor-pointer">
                  <FileUp className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {uploadFile ? uploadFile.name : 'Click to locate file (max 10MB)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required={!uploadFile}
                  />
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" isLoading={uploading} disabled={!uploadFile}>
                  Run Textbook Upload
                </Button>
              </div>
            </form>
          </Card>

          {/* Uploaded Documents List */}
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font border-b border-slate-100 dark:border-slate-800 pb-2">
              CHAPTER TEXTBOOKS ({documents.length})
            </span>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No textbooks uploaded in this chapter folder.</p>
            ) : (
              <div className="space-y-2.5">
                {documents.map(doc => {
                  const isActive = activeDocument?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition select-none flex justify-between items-center gap-4
                        ${isActive 
                          ? 'border-indigo-500 bg-slate-105 dark:border-blue-400 dark:bg-slate-950/40' 
                          : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 bg-white dark:bg-slate-955'
                        }`}
                    >
                      <div className="space-y-0.5 truncate">
                        <h5 className="font-bold text-slate-800 dark:text-white truncate leading-tight">{doc.title}</h5>
                        <p className="text-[10px] text-slate-405 leading-relaxed">Pages: {doc.page_count} &bull; Language: {doc.language}</p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {doc.is_approved ? <span className="text-[9px] uppercase font-bold text-emerald-500">Approved ✓</span> : <span className="text-[9px] uppercase font-bold text-amber-500">Draft</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Builder Form */}
          {activeDocument && (
            <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font border-b border-slate-100 dark:border-slate-800 pb-2">
                BUILD RAG EMBEDDINGS CHUNKS
              </span>

              <form onSubmit={handleBuildChunks} className="space-y-3.5 text-xs">
                {!selTopic ? (
                  <p className="text-xs text-amber-500 italic pb-1">Please select a Topic context above to map specific chunk vector targets.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Page start index"
                        type="number"
                        value={chunkForm.pageStart}
                        onChange={(e) => setFormVal('pageStart', parseInt(e.target.value) || 1)}
                      />
                      <Input
                        label="Page end index"
                        type="number"
                        value={chunkForm.pageEnd}
                        onChange={(e) => setFormVal('pageEnd', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Chunk Size (words)"
                        type="number"
                        value={chunkForm.chunkSize}
                        onChange={(e) => setFormVal('chunkSize', parseInt(e.target.value) || 150)}
                      />
                      <Input
                        label="Overlap (words)"
                        type="number"
                        value={chunkForm.overlap}
                        onChange={(e) => setFormVal('overlap', parseInt(e.target.value) || 20)}
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button type="submit" size="sm" isLoading={building}>
                        Build Topic Vector Chunks
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Card>
          )}

        </div>

        {/* Right column: Document Page extractions, Chunks preview context, Search testing sandbox */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active document review */}
          {activeDocument ? (
            <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-black text-[#94A3B8]">Review extracted sheets text</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white heading-font line-clamp-1">{activeDocument.title}</h4>
                </div>

                {!activeDocument.is_approved && (
                  <Button size="sm" variant="success" onClick={handleApproveDocument}>
                    Approve Scans
                  </Button>
                )}
              </div>

              {/* Extract page browse scroll list */}
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto border border-slate-150 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-transparent">
                {extractedPages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Parsing PDF sheets pages text context...</p>
                ) : (
                  extractedPages.map(p => (
                    <div key={p.id} className="space-y-1 pb-3.5 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase select-none">
                        <span>Page {p.page_number}</span>
                        {p.has_text ? <span className="text-emerald-500">Has Text</span> : <span className="text-amber-500">Image Scan Only</span>}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed max-h-[80px] overflow-y-auto font-normal break-words whitespace-pre-wrap select-text selection:bg-indigo-300">
                        {p.text_content || '(No text extracted from page scope.)'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 border-slate-205 border-dashed border-2 dark:border-slate-800/40 text-center py-16">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active textbook workbook selected.</p>
              <p className="text-[11px] text-slate-405 mt-0.5">Choose an indexed document on the Left panel to audit pages.</p>
            </Card>
          )}

          {/* Active vector chunks reviews */}
          {activeDocument && selTopic && (
            <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font border-b border-slate-100 dark:border-slate-800 pb-2">
                ACTIVE SEMANTIC CHUNKS CODES ({ragChunks.length})
              </span>

              {ragChunks.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No vector overlapping chunks established yet. Click Build Chunks on the left.</p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {ragChunks.map((ch, idx) => (
                    <div key={ch.id || idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-650 leading-relaxed font-normal">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase select-none mb-1 border-b border-slate-100 dark:border-slate-850 pb-1">
                        <span>Chunk index #{idx + 1}</span>
                        <span>Page {ch.page_number} &bull; Words: {ch.word_count}</span>
                      </div>
                      <p className="font-mono text-[10px] leading-relaxed text-slate-600 dark:text-slate-350 italic select-text">
                        "{ch.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Semantic Search Grounding testbed */}
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font border-b border-slate-100 dark:border-slate-805 pb-2">
              RAG SEMANTIC SEARCH GROUNDINGS SIMULATOR
            </span>

            <form onSubmit={handleTestSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-8">
                  <Input
                    label="Semantic Query Input"
                    placeholder="e.g., cell cytoplasm organelles, Newton force acceleration"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Lang</span>
                  <select
                    value={searchLang}
                    onChange={(e) => setSearchLang(e.target.value as 'en' | 'bn')}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="en">en</option>
                    <option value="bn">bn</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <Button type="submit" size="sm" className="h-[43px] w-full" isLoading={searching}>
                    <Search className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </form>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">SIMULATION SEARCH RESULTS</span>
                <div className="space-y-2.5">
                  {searchResults.map((res, i) => (
                    <div key={i} className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 text-xs leading-relaxed">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                        <span>Doc Match #{i+1} &bull; Page {res.page_number}</span>
                        <span className="text-emerald-500">Vector Score: {(res.similarity || res.score || 0.85).toFixed(3)}</span>
                      </div>
                      <p className="italic text-slate-650 dark:text-slate-350 select-text">
                        "{res.content}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

        </div>

      </div>

    </div>
  );

  function setFormVal(key: string, val: any) {
    setChunkForm(prev => ({
      ...prev,
      [key]: val
    }));
  }
}
