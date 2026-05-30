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
  FileText
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 h-full flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-1">Interactive Classroom</div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white heading-font">
          AI TUTOR STUDY LAB
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-semibold">
          Your topic-bound study companion. Ask clarifying questions, synthesize fun scenario stories, and trigger quick checks.
        </p>
      </div>

      {errorHeader && (
        <StatusMessage type="error" message={errorHeader} />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column / Setup & Inbox List */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Binder Info */}
          <Card className="p-4 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900">
            <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Active Workspace Binder</span>
            {selectedTopic ? (
              <div className="space-y-3 mt-1.5">
                <div className="border-l-2 border-indigo-500 pl-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedTopic.grade_name} &bull; {selectedTopic.subject_name}</h4>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 line-clamp-1 heading-font">{selectedTopic.topic_title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-450 uppercase text-[9px] font-black">Status:</span>
                  {topicStatus?.status === 'completed' ? (
                    <Badge variant="completed">Completed ✓</Badge>
                  ) : topicStatus?.status === 'needs_practice' ? (
                    <Badge variant="needs_practice">Needs Practice</Badge>
                  ) : (
                    <Badge variant="not_started">Not Started</Badge>
                  )}
                  {topicStatus && topicStatus.completion_percentage > 0 && (
                    <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-350">
                      {topicStatus.completion_percentage}%
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs italic text-slate-450">
                No syllabus topic selected. Go to learning catalog to load one.
              </div>
            )}
          </Card>

          {/* Configuration and settings Pane */}
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider block">TUTOR PREFERENCES</span>

            {/* Language Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize block">Dialect Language</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSettings(useRag, 'en')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    language === 'en' 
                      ? 'bg-blue-600 text-white border-transparent dark:bg-blue-400 dark:text-slate-950 shadow-xs' 
                      : 'bg-white dark:bg-slate-950 text-slate-705 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  English (en)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSettings(useRag, 'bn')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    language === 'bn' 
                      ? 'bg-blue-600 text-white border-transparent dark:bg-blue-400 dark:text-slate-950 shadow-xs' 
                      : 'bg-white dark:bg-slate-950 text-slate-705 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Bangla (bn)
                </button>
              </div>
            </div>

            {/* RAG Toggle */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => handleToggleSettings(e.target.checked, language)}
                  className="rounded-md border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500/20 shadow-xs h-4 w-4 shrink-0 transition"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-105 block">Use textbook/RAG sources</span>
                  <p className="text-[10px] text-slate-450 leading-relaxed">When enabled, the tutor uses approved source chunks for this topic.</p>
                </div>
              </label>
            </div>

            {/* Explanatory Story preference */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/85">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block">Learning Style preference</label>
              <textarea
                value={studentPreference}
                onChange={(e) => setStudentPreference(e.target.value)}
                placeholder="e.g., Explain through a bicycle story, a visual recipe, or step-by-step math solver proofs..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-hidden focus:border-indigo-500"
                rows={2}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateStoryLesson}
                isLoading={generatingStory}
                className="w-full justify-center text-[10px] font-black uppercase tracking-wider bg-slate-900 border-none text-white dark:bg-white dark:text-slate-950"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Synthesize Story Lesson
              </Button>
            </div>

            {/* Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/85 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateConversation}
                disabled={loadingConv}
                className="flex-1 justify-center border border-dashed border-slate-300 dark:border-indigo-950 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-blue-500" /> New Chat
              </Button>
            </div>
          </Card>

          {/* Conversations History List */}
          <Card className="p-4 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-3">
            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">LEARNING CHANNELS ({conversations.length})</span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {loadingConv ? (
                <LoadingState message="Loading channels..." size="sm" />
              ) : conversations.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No dialogues synthesized yet.</p>
              ) : (
                conversations.map(conv => {
                  const isActive = activeConversation?.id === conv.id;
                  const targetTopic = selectedTopic && selectedTopic.topic_id === conv.topic_id ? selectedTopic.topic_title : 'Chapter Concept Topic';
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition select-none flex justify-between items-start gap-2
                        ${isActive 
                          ? 'bg-slate-105 border-indigo-500 dark:bg-slate-905 dark:border-blue-400' 
                          : 'bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-800 border-slate-200 dark:border-slate-850'
                        }`}
                    >
                      <div className="space-y-0.5 truncate max-w-[190px]">
                        <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {conv.title || 'Learning Dialogue'}
                        </p>
                        <p className="text-[10px] text-slate-450 truncate">
                          Topic Focus: {conv.topic_id === selectedTopic?.topic_id ? selectedTopic.topic_title : 'Physics / Science Theme'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 font-mono text-[8px] opacity-70 shrink-0">
                        <Badge variant={conv.use_rag ? 'rag_on' : 'rag_off'}>
                          {conv.use_rag ? 'RAG' : 'Base'}
                        </Badge>
                        <span className="uppercase text-[8px] font-semibold text-slate-450">{conv.language}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

        </div>

        {/* Right Column / Conversations and diagnostics */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Chat Inbox Visual Area */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-[700px] overflow-hidden shadow-sm relative">
            
            {/* Header info */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-900 flex justify-between items-center gap-4 select-none rounded-t-2xl shrink-0">
              <div className="space-y-0.5 max-w-[70%]">
                <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">
                  Dialogue Channel
                </span>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-50 heading-font truncate">
                  {activeConversation ? activeConversation.title || 'Classroom Discussion' : 'Learniverse AI Tutoring desk'}
                </h3>
              </div>

              {/* Settings labels status items */}
              <div className="flex gap-1.5 text-[10px] font-semibold tracking-wider uppercase shrink-0">
                {useRag ? <Badge variant="rag_on">RAG: Grounded</Badge> : <Badge variant="not_started">Base Model</Badge>}
                <Badge variant="student">{language === 'bn' ? 'Bangla bn' : 'English en'}</Badge>
              </div>
            </div>

            {/* Bubble contents */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 pb-8">
              {loadingMsg ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingState message="Restoring discussion context parameters..." />
                </div>
              ) : (!selectedTopic && !activeConversation) ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 dark:text-slate-650 max-w-sm mx-auto space-y-3 select-none">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-350 shrink-0 border border-slate-100 dark:border-slate-805">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-205">Select a topic first</h4>
                  <p className="text-xs leading-relaxed font-normal">
                    Choose a grade, subject, chapter, and topic from the Catalog before starting the tutor.
                  </p>
                  <Button onClick={() => window.location.hash = '#/catalog'}>Open Catalog</Button>
                </div>
              ) : (selectedTopic && !activeConversation) ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 dark:text-slate-650 max-w-sm mx-auto space-y-4 select-none">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-blue-500 shrink-0 border border-slate-100 dark:border-slate-805">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-205">Ready to learn {selectedTopic.topic_title}</h4>
                  <p className="text-xs leading-relaxed font-normal">
                    Start a new tutor conversation, generate a story lesson, or ask a question about this topic.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={handleCreateConversation}>New Conversation</Button>
                    <Button variant="secondary" onClick={handleGenerateStoryLesson} disabled={generatingStory}>
                      {generatingStory ? 'Generating...' : 'Generate Story Lesson'}
                    </Button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 dark:text-slate-650 max-w-sm mx-auto space-y-3 select-none">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-350 shrink-0 border border-slate-100 dark:border-slate-805">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Conversation started</h4>
                  <p className="text-xs leading-relaxed font-normal">
                    No messages yet. Generate a story lesson or ask your first question.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  const isRefusal = msg.message_type === 'refusal' || msg.is_in_scope === false;
                  const isStory = msg.message_type === 'story';
                  return (
                    <div key={msg.id || i} className={`w-full max-w-4xl mx-auto flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {/* AI Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-1 mt-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}

                      {/* Msg bubble container layout styles */}
                      <div className={`text-[15px] leading-relaxed max-w-[85%] md:max-w-[75%]
                        ${isUser 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-5 py-3.5 rounded-3xl font-medium' 
                          : isRefusal 
                            ? 'bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-500 p-4 rounded-2xl' 
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {/* Custom label tags for story or refusals */}
                        {isStory && (
                          <div className="mb-3">
                            <span className="inline-flex items-center rounded-md bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20">Story Lesson</span>
                          </div>
                        )}
                        {isRefusal && (
                          <div className="mb-3">
                            <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 ring-1 ring-inset ring-amber-600/20">Outside selected topic</span>
                          </div>
                        )}

                        <MarkdownContent content={msg.content} />

                        {/* Citations/RAG Sources list underneath message if provided */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-5 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                              <FileText className="h-4 w-4 shrink-0" />
                              Sources
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                              {msg.sources.map((src, srcIdx) => (
                                <div key={srcIdx} className="w-[280px] shrink-0 snap-start p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-1.5 text-xs select-text pointer-events-auto leading-normal">
                                  <div className="flex justify-between items-start font-semibold text-slate-800 dark:text-slate-200">
                                    <span className="line-clamp-1 flex-1 pr-2">{src.title || 'Source text'}</span>
                                  </div>
                                  <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed italic">
                                    "{src.content_preview}"
                                  </p>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                                    Pages {src.page_start} - {src.page_end}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {sendingMsg && (
                <div className="w-full max-w-4xl mx-auto flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-1 mt-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 h-10">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce delay-200" />
                  </div>
                </div>
              )}
              {lastNote && !sendingMsg && (
                <div className="w-full max-w-4xl mx-auto flex gap-4 justify-start">
                   <div className="w-8 h-8 shrink-0"></div>
                   <div className="p-2.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl inline-block max-w-full">
                     <p className="text-[10px] text-slate-500 dark:text-slate-400 italic font-medium">{lastNote}</p>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input keyboard controls panels */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-b-2xl shrink-0 z-10 sticky bottom-0 border-t border-slate-100 dark:border-slate-800/50">
              <div className="max-w-4xl mx-auto relative rounded-3xl bg-slate-100 dark:bg-slate-800 p-2 border-none ring-1 ring-slate-200 dark:ring-slate-700/50 shadow-sm focus-within:ring-indigo-300 dark:focus-within:ring-indigo-700/50 transition-shadow">
                <textarea
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={selectedTopic ? `Ask about "${selectedTopic.topic_title}"...` : "Choose a learning context catalog topic or write here..."}
                  className="w-full min-h-[48px] max-h-[200px] p-3 text-base text-slate-850 dark:text-slate-50 bg-transparent placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:outline-none resize-none pr-12"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !typedMessage.trim()}
                  className="absolute right-3 bottom-3 h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="max-w-4xl mx-auto flex justify-center mt-3 select-none">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Tutor can make mistakes. Check important info.
                </p>
              </div>
            </form>

          </Card>

          {/* Interactive Diagnostic Probe Tabs Selector */}
          {selectedTopic && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 border-b border-slate-200 dark:border-slate-805 pb-2">
                <button
                  onClick={() => {
                    setActiveDiagnosticTab(activeDiagnosticTab === 'check' ? 'none' : 'check');
                    // Cache last topic sessionId to prompt remediation checks
                  }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition select-none cursor-pointer
                    ${activeDiagnosticTab === 'check' 
                      ? 'bg-blue-600 text-white font-black dark:bg-blue-400 dark:text-slate-955' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350'
                    }`}
                >
                  Quick Understanding check
                </button>
                <button
                  onClick={() => setActiveDiagnosticTab(activeDiagnosticTab === 'quiz' ? 'none' : 'quiz')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition select-none cursor-pointer
                    ${activeDiagnosticTab === 'quiz' 
                      ? 'bg-blue-600 text-white font-black dark:bg-blue-400 dark:text-slate-955' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350'
                    }`}
                >
                  Diagnostic Quiz
                </button>
                {/* Only toggle remedial when weaknesses are established */}
                <button
                  onClick={() => setActiveDiagnosticTab(activeDiagnosticTab === 'reremedy' || activeDiagnosticTab === 'remediation' ? 'none' : 'remediation')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition select-none cursor-pointer
                    ${activeDiagnosticTab === 'remediation' 
                      ? 'bg-amber-500 text-white font-black dark:bg-amber-400 dark:text-slate-955' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350'
                    }`}
                >
                  Focused help & Study
                </button>
              </div>

              {/* Toggle diagnostic areas */}
              {activeDiagnosticTab === 'check' && (
                <div className="transition-all duration-300">
                  <UnderstandingCheck
                    topicId={selectedTopic.topic_id}
                    topicTitle={selectedTopic.topic_title}
                    onWeaknessDetected={() => {
                      setActiveDiagnosticTab('quiz');
                      refreshWorkspace();
                    }}
                    onSuccessCheck={() => {
                      refreshWorkspace();
                    }}
                  />
                </div>
              )}

              {activeDiagnosticTab === 'quiz' && (
                <div className="transition-all duration-300">
                  <DiagnosticQuiz
                    topicId={selectedTopic.topic_id}
                    topicTitle={selectedTopic.topic_title}
                    onQuizCompleted={(res) => {
                      // Save the session ID to prompt remediation easily in the diagnostic tab
                      sessionStorage.setItem(`learniverse_last_session_id_${selectedTopic.topic_id}`, res.session_id);
                      if (res.weaknesses && res.weaknesses.length > 0) {
                        // Switch panel to focused remedial helper automatically!
                        setActiveDiagnosticTab('remediation');
                      }
                      refreshWorkspace();
                    }}
                  />
                </div>
              )}

              {activeDiagnosticTab === 'remediation' && (
                <div className="transition-all duration-300">
                  <RemediationPanel
                    topicId={selectedTopic.topic_id}
                    topicTitle={selectedTopic.topic_title}
                    onRemediationCompleted={() => {
                      refreshWorkspace();
                    }}
                  />
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
