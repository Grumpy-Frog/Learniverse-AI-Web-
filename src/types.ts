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
  page_count: number;
  is_approved: boolean;
  status: 'processing' | 'processed' | 'failed' | string;
}

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number;
  text_content: string;
  has_text: boolean;
}

export interface RAGChunk {
  id: string;
  document_id: string;
  topic_id?: string;
  page_number: number;
  content: string;
  word_count: number;
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
  sender: 'student' | 'tutor' | 'system';
  content: string;
  is_story?: boolean;
  is_refusal?: boolean;
  sources?: {
    title: string;
    document_id: string;
    page_start: number;
    page_end: number;
    text_preview: string;
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

export interface DiagnosticResult {
  session_id: string;
  score: number;
  max_score: number;
  percentage: number;
  outcome: string;
  show_checkmark: boolean;
  strengths: string[];
  weaknesses: string[];
  details: QuestionDetailFeedback[];
}

export interface TopicStatus {
  topic_id: string;
  status: 'not_started' | 'needs_practice' | 'completed';
  completion_percentage: number;
  last_test_score?: number;
  strengths: string[];
  weaknesses: string[];
}

export interface SubjectSummary {
  subject_id: string;
  subject_name: string;
  total_topics: number;
  completed_topics: number;
  completion_percentage: number;
  strengths: string[];
  weaknesses: string[];
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
  title: string;
  slug: string;
  category: string;
  language: 'en' | 'bn';
  excerpt: string;
  content_markdown: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
