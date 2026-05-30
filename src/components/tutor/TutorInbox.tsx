import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { getSelectedTopic } from '../../lib/auth';
import { Conversation, ChatMessage, TopicStatus } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import MarkdownContent from '../markdown/MarkdownContent';
import UnderstandingCheck from '../diagnostics/UnderstandingCheck';
import DiagnosticQuiz from '../diagnostics/DiagnosticQuiz';
import RemediationPanel from '../remediation/RemediationPanel';
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  Send,
  PlusCircle,
  HelpCircle,
  PlayCircle,
  Settings,
  ChevronDown,
  RotateCcw,
  Book,
  FileText,
  SearchCheck,
  FileQuestion,
  Zap
} from 'lucide-react';

export default function TutorInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [topicStatus, setTopicStatus] = useState<TopicStatus | null>(null);

  // Settings
  const [useRag, setUseRag] = useState(true);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [studentPreference, setStudentPreference] = useState('');
  
  // UI inputs
  const [typedMessage, setTypedMessage] = useState('');
  
  // Loaders
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  
  // Error states
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [activeDiagnosticTab, setActiveDiagnosticTab] = useState<'none' | 'check' | 'quiz' | 'remediation'>('none');
  const [lastNote, setLastNote] = useState<string | null>(null);

  // Selected Topic context
  const [selectedTopic, setSelectedTopicState] = useState<any | null>(getSelectedTopic());

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const qs = hash.split('?')[1];
      const params = new URLSearchParams(qs);
      const topicId = params.get('topicId');
      if (topicId && (!selectedTopic || selectedTopic.topic_id !== topicId)) {
        // Fetch topic details
        api.getTopicDetail(topicId).then((data) => {
          // It would be nice to have the full context but at least we have the topic details
          const simulatedContext = {
            grade_id: 'unknown',
            grade_name: 'Grade',
            subject_id: 'unknown',
            subject_name: 'Subject',
            chapter_id: data.chapter_id,
            chapter_title: 'Chapter',
            topic_id: data.id,
            topic_title: data.title,
            topic_description: data.description,
            learning_objective: data.learning_objective
          };
          setSelectedTopicState(simulatedContext);
        }).catch(err => {
          console.error("Could not fetch topic from url parameter:", err);
        });
      }
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendingMsg]);

  // Initial catalog load
  useEffect(() => {
    fetchConversations();
    if (selectedTopic?.topic_id) {
      fetchTopicStatus();
    }
  }, [selectedTopic?.topic_id]);

  const fetchTopicStatus = async () => {
    if (!selectedTopic?.topic_id) return;
    try {
      const status = await api.getTopicStatus(selectedTopic.topic_id);
      setTopicStatus(status);
    } catch (e) {
      // Not started yet
      setTopicStatus({
        topic_id: selectedTopic.topic_id,
        status: 'not_started',
        completion_percentage: 0,
        strengths: [],
        weaknesses: []
      });
    }
  };

  const fetchConversations = async () => {
    setLoadingConv(true);
    setErrorHeader(null);
    try {
      const list = await api.getConversations();
      setConversations(list || []);

      // If a topic is selected, let's filter conversations for this topic, or auto select the last one
      if (selectedTopic?.topic_id) {
        const topicConvs = list.filter((c: Conversation) => c.topic_id === selectedTopic.topic_id);
        if (topicConvs.length > 0) {
          handleSelectConversation(topicConvs[0]);
        } else {
          // Empty, force creating one if they decide to chat
        }
      } else if (list.length > 0) {
        handleSelectConversation(list[0]);
      }
    } catch (err: any) {
      setErrorHeader(err.message || 'Error occurred while loading learning channels.');
    } finally {
      setLoadingConv(false);
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    setUseRag(conv.use_rag);
    setLanguage(conv.language);
    setLoadingMsg(true);
    setMessages([]);
    setLastNote(null);
    try {
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs || []);
    } catch (err: any) {
      setErrorHeader(`Error loading messages: ${err.message}`);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedTopic?.topic_id) {
      setErrorHeader('Please select an active syllabus topic from the Learning Catalog page first.');
      return;
    }
    setLoadingMsg(true);
    setErrorHeader(null);
    try {
      const newConv = await api.createConversation(selectedTopic.topic_id, language, useRag);
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
      setLastNote(null);
    } catch (err: any) {
      setErrorHeader(`Failed to initialize learning conversation: ${err.message}`);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleToggleSettings = async (newRag: boolean, newLang: 'en' | 'bn') => {
    setUseRag(newRag);
    setLanguage(newLang);
    if (activeConversation) {
      try {
        await api.updateConversationSettings(activeConversation.id, newRag, newLang);
        // Refresh conversations to update badges
        const list = await api.getConversations();
        setConversations(list || []);
      } catch (e: any) {
        setErrorHeader(`Could not save settings on active conversation: ${e.message}`);
      }
    }
  };

  const processTurnResponse = (response: any) => {
    if (response) {
      if (response.reply) {
        if (response.sources) {
          response.reply.sources = response.sources;
        }
        setMessages(prev => [...prev, response.reply]);
      }
      if (response.note) {
        setLastNote(response.note);
      }
      if (response.conversation) {
        setActiveConversation(response.conversation);
      }
    }
  };

  const handleGenerateStoryLesson = async () => {
    if (!activeConversation) {
      if (!selectedTopic) {
        setErrorHeader('Please browse the course catalog and highlight a topic first.');
        return;
      }
      // Auto create conversation
      setGeneratingStory(true);
      setErrorHeader(null);
      setLastNote(null);
      try {
        const newConv = await api.createConversation(selectedTopic.topic_id, language, useRag);
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(newConv);
        
        const response = await api.generateStoryLesson(newConv.id, studentPreference || 'Explain cleanly through interactive science examples.');
        processTurnResponse(response);
        setStudentPreference('');
      } catch (err: any) {
        setErrorHeader(err.message || 'Error occurred while synthesizing story-guided lesson.');
      } finally {
        setGeneratingStory(false);
      }
      return;
    }

    setGeneratingStory(true);
    setErrorHeader(null);
    setLastNote(null);
    try {
      const response = await api.generateStoryLesson(activeConversation.id, studentPreference || 'Explain cleanly through interactive science examples.');
      processTurnResponse(response);
      setStudentPreference('');
    } catch (err: any) {
      setErrorHeader(err.message || 'Error compiling lesson narrative.');
    } finally {
      setGeneratingStory(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim()) return;

    let targetConv = activeConversation;
    setErrorHeader(null);
    setLastNote(null);

    setSendingMsg(true);
    try {
      // 1. Double check / auto initialize conversation if none selected
      if (!targetConv) {
        if (!selectedTopic) {
          throw new Error('Please highlight an active syllabus topic from the Learning Catalog first.');
        }
        targetConv = await api.createConversation(selectedTopic.topic_id, language, useRag);
        setConversations(prev => [targetConv!, ...prev]);
        setActiveConversation(targetConv);
      }

      const msgContent = typedMessage;
      setTypedMessage('');

      // Optimistically append user message
      const tempUserMsg: ChatMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: targetConv.id,
        role: 'user',
        message_type: 'chat',
        content: msgContent,
        is_in_scope: true,
        is_source_grounded: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      // Send
      const response = await api.sendMessage(targetConv.id, msgContent);
      processTurnResponse(response);
      
    } catch (err: any) {
      setErrorHeader(err.message || 'Could not send message.');
      // Keep the user message so they can see what failed, arguably, or remove it. We'll leave it since it's temp, we can see the sent message.
    } finally {
      setSendingMsg(false);
    }
  };

  // Helper inside quiz success / remediation complete triggers
  const refreshWorkspace = () => {
    fetchTopicStatus();
  };

  return (
    <div className="w-full h-full flex overflow-hidden bg-slate-950 isolate">
      
      {/* Left Sidebar - Compact Setup & Inbox */}
      <aside className="w-[320px] shrink-0 border-r border-slate-800/60 bg-slate-900/40 flex flex-col min-h-0">
        
        {/* Fixed Header */}
        <div className="p-4 flex items-center gap-2 border-b border-white/5">
          <Book className="h-5 w-5 text-blue-500" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Study Workspace</h2>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* Active Binder Info */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Loaded Topic</span>
            {selectedTopic ? (
            <div className="space-y-4 mt-2">
              <div className="border-l-2 border-indigo-500 pl-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedTopic.grade_name} &bull; {selectedTopic.subject_name}</h4>
                <h3 className="text-sm font-black text-white leading-tight mt-0.5">{selectedTopic.topic_title}</h3>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {topicStatus?.status === 'completed' ? (
                    <Badge variant="completed">Completed ✓</Badge>
                  ) : topicStatus?.status === 'needs_practice' ? (
                    <Badge variant="needs_practice">Needs Practice</Badge>
                  ) : (
                    <Badge variant="not_started">Not Started</Badge>
                  )}
                </div>
                {topicStatus && topicStatus.completion_percentage > 0 && (
                  <span className="text-xs font-mono font-black text-blue-400">
                    {topicStatus.completion_percentage}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs italic text-slate-500">
              Select a concept from catalog.
            </div>
          )}
        </div>

        {/* Configuration Toggle Panels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Dialect & Mode</span>
            <Settings className="h-3 w-3 text-slate-600" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleToggleSettings(useRag, 'en')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                language === 'en' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleToggleSettings(useRag, 'bn')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                language === 'bn' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              Bangla
            </button>
          </div>

          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => handleToggleSettings(e.target.checked, language)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-200">Grounded Search</span>
              <span className="text-[9px] text-slate-500 font-medium tracking-tight">AI utilizes textbook sources</span>
            </div>
          </label>
        </div>

        {/* AI Story Synthesizer */}
        <div className="space-y-2 pt-2">
           <textarea
            value={studentPreference}
            onChange={(e) => setStudentPreference(e.target.value)}
            placeholder="Customize story theme (e.g., Space Explorer, Detective)..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none resize-none"
            rows={2}
          />
          <button
            onClick={handleGenerateStoryLesson}
            disabled={generatingStory}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[0.98] transition-transform active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> 
            {generatingStory ? 'Synthesizing...' : 'Synthesize Story'}
          </button>
        </div>

        {/* History List Section (Takes remaining space but stays within sidebar scroll) */}
        <div className="p-4 pt-0 flex flex-col space-y-3 min-h-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Learning Channels</span>
            <button onClick={handleCreateConversation} className="p-1 hover:bg-white/5 rounded-full text-blue-400 transition-colors">
              <PlusCircle className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {loadingConv ? (
              <div className="py-10 flex justify-center"><div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : conversations.map(conv => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    isActive 
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5' 
                      : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                  }`}
                >
                  <p className={`text-xs font-black truncate mb-1 ${isActive ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'}`}>
                    {conv.title || 'Untitled Dialogue'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">
                      {conv.language.toUpperCase()} &bull; {conv.use_rag ? 'Grounded' : 'Base'}
                    </span>
                    <span className="text-[8px] font-mono text-slate-700">{new Date(conv.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </aside>

      {/* Right Column - Chat Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-slate-950">
        
        {/* Chat Header and Diagnostic Bar */}
        <div className="shrink-0 z-30">
          {/* Main Title Header */}
          <div className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  {activeConversation?.title || 'Dialogue Channel'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Tutoring Desk</span>
                </div>
              </div>
            </div>

            {activeConversation && (
              <div className="flex items-center gap-3">
                 <Badge variant={useRag ? 'rag_on' : 'not_started'}>{useRag ? 'RAG: Grounded' : 'Base Model'}</Badge>
                 <Badge variant="student">{language === 'bn' ? 'Bangla bn' : 'English en'}</Badge>
              </div>
            )}
          </div>

          {/* Diagnostic Prominent Buttons Bar */}
          {selectedTopic && (
            <div className="bg-slate-900/40 backdrop-blur-md border-b border-white/5 py-3 px-6 flex items-center justify-center gap-4">
               <button
                  onClick={() => setActiveDiagnosticTab(activeDiagnosticTab === 'check' ? 'none' : 'check')}
                  className={`flex-1 max-w-[280px] h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]
                    ${activeDiagnosticTab === 'check' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-500/50' 
                      : 'bg-slate-900/80 border-blue-500/20 text-blue-400 hover:bg-blue-500/10'
                    }`}
                >
                  <SearchCheck className="h-4 w-4" /> Understanding Check
                </button>
                <button
                  onClick={() => setActiveDiagnosticTab(activeDiagnosticTab === 'quiz' ? 'none' : 'quiz')}
                  className={`flex-1 max-w-[280px] h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]
                    ${activeDiagnosticTab === 'quiz' 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50' 
                      : 'bg-slate-900/80 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                >
                  <FileQuestion className="h-4 w-4" /> Diagnostic Quiz
                </button>
                <button
                  onClick={() => setActiveDiagnosticTab(activeDiagnosticTab === 'remediation' ? 'none' : 'remediation')}
                  className={`flex-1 max-w-[280px] h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]
                    ${activeDiagnosticTab === 'remediation' 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-amber-600/30 ring-2 ring-amber-500/50' 
                      : 'bg-slate-900/80 border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                    }`}
                >
                  <Zap className="h-4 w-4" /> Focused help & Study
                </button>
            </div>
          )}
        </div>

        {/* Message View Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
           
           <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-12 pb-32">
             
             {/* Diagnostic Overlays */}
             {selectedTopic && activeDiagnosticTab !== 'none' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-1 overflow-hidden">
                   {activeDiagnosticTab === 'check' && (
                      <UnderstandingCheck
                        topicId={selectedTopic.topic_id}
                        topicTitle={selectedTopic.topic_title}
                        onWeaknessDetected={() => { setActiveDiagnosticTab('quiz'); refreshWorkspace(); }}
                        onSuccessCheck={() => { refreshWorkspace(); }}
                      />
                   )}
                   {activeDiagnosticTab === 'quiz' && (
                      <DiagnosticQuiz
                        topicId={selectedTopic.topic_id}
                        topicTitle={selectedTopic.topic_title}
                        onQuizCompleted={(res) => {
                          sessionStorage.setItem(`learniverse_last_session_id_${selectedTopic.topic_id}`, res.session_id);
                          if (res.weaknesses && res.weaknesses.length > 0) setActiveDiagnosticTab('remediation');
                          refreshWorkspace();
                        }}
                      />
                   )}
                   {activeDiagnosticTab === 'remediation' && (
                      <RemediationPanel
                        topicId={selectedTopic.topic_id}
                        topicTitle={selectedTopic.topic_title}
                        onRemediationCompleted={() => { refreshWorkspace(); }}
                      />
                   )}
                </div>
             )}

             {loadingMsg ? (
               <div className="flex min-h-[400px] items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Restoring session...</p>
                 </div>
               </div>
             ) : (!selectedTopic && !activeConversation) ? (
               <div className="min-h-[400px] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 mb-6">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">Topic Required</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-8 font-medium">Please select a specific concept from the curriculm catalog to unlock the AI tutor's workspace.</p>
                  <Button className="w-full" onClick={() => window.location.hash = '#/catalog'}>Browse Catalog</Button>
               </div>
             ) : messages.length === 0 ? (
               <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
                     <Sparkles className="h-10 w-10" />
                   </div>
                   <h4 className="text-2xl font-black text-white mb-2">Hello! I'm your AI Tutor.</h4>
                   <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-10 font-medium">I'm ready to help you master <strong>{selectedTopic?.topic_title}</strong>. Ask me anything or start a story-guided lesson above.</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                      <button onClick={handleCreateConversation} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all text-left">
                        <MessageSquare className="h-5 w-5 text-blue-500 mb-3" />
                        <h5 className="text-xs font-black text-white uppercase tracking-wider mb-1">Interactive Chat</h5>
                        <p className="text-[10px] text-slate-500 leading-normal">Ask any question or clear your doubts instantly.</p>
                      </button>
                      <button onClick={handleGenerateStoryLesson} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-all text-left">
                        <Sparkles className="h-5 w-5 text-purple-500 mb-3" />
                        <h5 className="text-xs font-black text-white uppercase tracking-wider mb-1">Synthesize Lesson</h5>
                        <p className="text-[10px] text-slate-500 leading-normal">Let me build a personalized narrative lesson for you.</p>
                      </button>
                   </div>
               </div>
             ) : (
                <div className="space-y-12">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    const isRefusal = msg.message_type === 'refusal' || msg.is_in_scope === false;
                    const isStory = msg.message_type === 'story';
                    return (
                      <div key={msg.id || i} className={`flex gap-8 group animate-in fade-in slide-in-from-bottom-4 duration-500 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar Cell */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isUser 
                            ? 'bg-slate-800 border-slate-700 text-slate-300' 
                            : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {isUser ? <div className="text-[10px] font-black uppercase tracking-tighter">ME</div> : <Sparkles className="w-6 h-6" />}
                        </div>

                        {/* Content Cell */}
                        <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                           {/* Context labels */}
                           {!isUser && (isStory || isRefusal) && (
                              <div className="mb-2 flex gap-2">
                                 {isStory && <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest">Story Narrative</span>}
                                 {isRefusal && <span className="text-[9px] font-black bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20 uppercase tracking-widest">Off-Topic</span>}
                              </div>
                           )}

                           <div className={`text-[15px] leading-[1.7] w-full ${isUser ? 'text-right' : 'text-left'}`}>
                              <div className={isUser ? 'bg-slate-900/80 border border-white/5 rounded-3xl px-6 py-4 shadow-xl' : ''}>
                                <MarkdownContent content={msg.content} />
                              </div>

                              {/* Sources Block */}
                              {!isUser && msg.sources && msg.sources.length > 0 && (
                                <div className="mt-8">
                                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                                      <FileText className="h-3.5 w-3.5" /> Reference Material
                                   </div>
                                   <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-2 px-2">
                                      {msg.sources.map((src, sIdx) => (
                                        <div key={sIdx} className="w-[300px] shrink-0 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                           <h6 className="text-[11px] font-bold text-white line-clamp-1 mb-2">{src.title}</h6>
                                           <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed mb-3 italic">"{src.content_preview}"</p>
                                           <span className="text-[9px] font-mono text-blue-500">PAGES {src.page_start}-{src.page_end}</span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {sendingMsg && (
                    <div className="flex gap-8 animate-pulse">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-6 h-6 animate-spin-slow" />
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                         <div className="h-2 w-2 rounded-full bg-blue-500" />
                         <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                         <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  {lastNote && !sendingMsg && (
                    <div className="flex gap-8 opacity-60">
                      <div className="w-10 h-10 shrink-0" />
                      <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-medium italic">{lastNote}</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
             )}
           </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none z-40">
           <form 
            onSubmit={handleSendMessage} 
            className="max-w-[900px] mx-auto relative pointer-events-auto group pb-4"
          >
             <div className="relative rounded-[2rem] bg-slate-900/90 border border-white/10 shadow-2xl focus-within:ring-2 focus-within:ring-blue-500 p-2 backdrop-blur-3xl transition-all duration-300">
                <textarea
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={selectedTopic ? `Message your AI tutor about "${selectedTopic.topic_title}"...` : "Choose a concept to start learning..."}
                  className="w-full min-h-[56px] max-h-[300px] py-4 px-6 text-sm text-white bg-transparent placeholder:text-slate-500 outline-none resize-none pr-16 custom-scrollbar"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !typedMessage.trim()}
                  className={`absolute right-3 bottom-3 h-12 w-12 flex items-center justify-center rounded-2xl transition-all
                    ${typedMessage.trim() ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                  `}
                >
                  <Send className="h-5 w-5" />
                </button>
             </div>
             <p className="text-center text-[9px] font-black uppercase text-slate-600 mt-4 tracking-widest select-none">
               Learniverse AI Tutor &bull; Precision Grounded Engine &bull; Verify Output
             </p>
           </form>
        </div>

      </div>
    </div>
  );
}
