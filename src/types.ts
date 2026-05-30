/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  fullname: string;
  role: 'admin' | 'student' | string;
  language: 'en' | 'bn';
}

export interface Grade {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active?: boolean;
}

export interface Subject {
  id: string;
  grade_id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active?: boolean;
}

export interface Chapter {
  id: string;
  subject_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  description: string;
  is_active?: boolean;
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  slug: string;
  description: string;
  learning_objective: string;
  display_order: number;
  is_active?: boolean;
}

export interface SelectedTopicContext {
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_title: string;
  topic_id: string;
  topic_title: string;
  topic_description: string;
  learning_objective: string;
}

export interface Simulation {
  id: string;
  chapter_id: string;
  topic_id?: string;
  title: string;
  slug: string;
  description: string;
  language: 'en' | 'bn';
  simulation_url: string;
  thumbnail_url?: string;
  display_order: number;
  is_active: boolean;
}

export interface TextbookDocument {
  id: string;
  chapter_id: string;
  title: string;
  language: 'en' | 'bn';
  source_type: string;
  original_filename: string;
  storage_path: string;
  file_hash: string;
  file_size_bytes: number;
  page_count: number;
  processing_status: string;
  is_approved: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number;
  extracted_text: string;
  has_text: boolean;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chapter_id: string;
  topic_id: string;
  language: "en" | "bn";
  chunk_index: number;
  content: string;
  page_start: number;
  page_end: number;
  word_count: number;
  is_active: boolean;
  created_at: string;
}

export interface RagSearchResult extends DocumentChunk {
  score: number;
}

export interface RagSearchResponse {
  query: string;
  retrieval_method: string;
  results: RagSearchResult[];
}

export interface Conversation {
  id: string;
  student_id: string;
  topic_id: string;
  title: string;
  language: 'en' | 'bn';
  use_rag: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  message_type: 'story' | 'chat' | 'refusal';
  content: string;
  is_in_scope: boolean;
  is_source_grounded: boolean;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  finish_reason?: string | null;
  sources?: {
    document_id: string;
    page_start: number;
    page_end: number;
    content_preview: string;
    title?: string;
  }[];
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'short_answer';
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  weight?: number;
}

export interface DiagnosticSession {
  id: string;
  topic_id: string;
  session_type: 'understanding_check' | 'quiz';
  status: 'active' | 'submitted';
  score?: number;
  max_score?: number;
  percentage?: number;
  outcome?: string;
  created_at: string;
}

export interface QuizSubmissionPayload {
  answers: {
    question_id: string;
    student_answer: string;
  }[];
}

export interface QuestionDetailFeedback {
  question_id: string;
  question_text: string;
  question_type: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  feedback: string;
  explanation: string;
}

export interface DiagnosticQuestion {
  id: string;
  session_id: string;
  question_type: "mcq" | "short_answer";
  question_text: string;
  options: Record<string, string> | null;
  skill_label: string;
  display_order: number;
  max_score: number;
}

export interface DiagnosticGenerationResponse {
  session: DiagnosticSession;
  questions: DiagnosticQuestion[];
  note?: string;
}

export interface DiagnosticResult {
  session: any;
  answers: {
    question_id: string;
    question_type: string;
    question_text: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    score: number;
    feedback: string;
    skill_label: string;
    detected_weakness: string | null;
    confidence: string | null;
    explanation: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  completion_status: string | null;
  show_checkmark: boolean;
}

export interface RemediationDetail {
  session: {
    id: string;
    user_id: string;
    topic_id: string;
    diagnostic_session_id: string;
    weakness_label: string;
    language: "en" | "bn";
    status: "generated" | "completed" | "needs_retry";
    is_source_grounded: boolean;
    created_at: string;
    updated_at: string;
  };
  content: {
    id: string;
    remediation_session_id: string;
    weakness_statement: string;
    micro_lesson: string;
    guided_example: string;
    partially_solved_problem: string;
    recheck_question: string;
    expected_answer: string;
    next_action: string;
    created_at: string;
  };
  rechecks: {
    id: string;
    remediation_session_id: string;
    student_answer: string;
    is_correct: boolean;
    score: number;
    feedback: string;
    next_action: string;
    created_at: string;
  }[];
}

export interface TopicStatus {
  topic_id: string;
  status?: 'not_started' | 'needs_practice' | 'completed';
  completion_percentage?: number;
  last_test_score?: number;
  strengths?: string[];
  weaknesses?: string[];

  // New backend fields
  completion_status?: 'not_started' | 'needs_practice' | 'completed';
  latest_score?: number | null;
  best_score?: number | null;
  strength_labels?: string[];
  weakness_labels?: string[];
  show_checkmark?: boolean;
  completed_at?: string | null;
}

export interface DashboardTopic {
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_title: string;
  topic_id: string;
  topic_title: string;
  topic_description?: string;
  learning_objective?: string;
  completion_status: "not_started" | "needs_practice" | "completed";
  latest_score: number | null;
  best_score: number | null;
  strength_labels: string[];
  weakness_labels: string[];
  show_checkmark: boolean;
}

export interface DashboardSubjectSummary {
  subject_id: string;
  total_topics: number;
  completed_topics: number;
  is_completed: boolean;
  strength_labels: string[];
  weakness_labels: string[];
}

export interface DashboardProgressModel {
  topics: DashboardTopic[];
  subjectSummaries: DashboardSubjectSummary[];
  totalTopics: number;
  completedTopics: number;
  needsPracticeTopics: DashboardTopic[];
  notStartedTopics: DashboardTopic[];
  masteredTopics: DashboardTopic[];
  improvingTopics: DashboardTopic[];
  practiceTopics: DashboardTopic[];
  weakTopics: DashboardTopic[];
  strengths: string[];
  weaknesses: string[];
}

export interface SelectedTopic {
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_title: string;
  topic_id: string;
  topic_title: string;
  topic_description?: string;
  learning_objective?: string;
}

export interface SubjectSummary {
  subject_id: string;
  subject_name?: string;
  total_topics: number;
  completed_topics: number;
  completion_percentage?: number;
  strengths?: string[];
  weaknesses?: string[];

  // New backend fields
  is_completed?: boolean;
  strength_labels?: string[];
  weakness_labels?: string[];
}

export interface RemediationSession {
  id: string;
  diagnostic_session_id: string;
  weaknesses: string[];
  lesson_title: string;
  remediation_text: string; // contains weakness statements, micro lesson, guided example, partially solved problem
  recheck_question: string;
  status: 'completed' | 'needs_retry';
  recheck_score?: number;
  recheck_feedback?: string;
}

export interface BlogPost {
  id: string;
  author_id?: string;
  title: string;
  slug: string;
  topic?: string;
  short_description?: string;
  category: string;
  language: 'en' | 'bn';
  excerpt: string;
  content_markdown: string;
  status?: 'draft' | 'published';
  is_published?: boolean;
  is_ai_generated?: boolean;
  model_name?: string;
  created_at: string;
  updated_at: string;
}
