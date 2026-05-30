/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Read environment variables or fallback values.
// We support both NEXT_PUBLIC_API_BASE_URL (which can be injected into window or process) and VITE_API_BASE_URL.
const DEFAULT_URL = 'https://learniverse-ai-backend.onrender.com/api/v1';
const LEGACY_PLACEHOLDER_URL = 'https://YOUR-RENDER-BACKEND.onrender.com/api/v1';

export function getApiBaseUrl(): string {
  // Let the user dynamically change/configure the backend URL at runtime too, saved in localStorage
  const savedOverride = localStorage.getItem('learniverse_api_override');
  if (savedOverride === LEGACY_PLACEHOLDER_URL) {
    localStorage.removeItem('learniverse_api_override');
  } else if (savedOverride) {
    return savedOverride;
  }

  const envUrl = (import.meta as any).env?.VITE_NEXT_PUBLIC_API_BASE_URL || 
                 (import.meta as any).env?.VITE_API_BASE_URL ||
                 DEFAULT_URL;
  return envUrl;
}

export function setApiBaseUrlOverride(url: string | null) {
  if (url) {
    localStorage.setItem('learniverse_api_override', url);
  } else {
    localStorage.removeItem('learniverse_api_override');
  }
}

// Session keys
const TOKEN_KEY = 'learniverse_access_token';
const SELECTED_TOPIC_KEY = 'learniverse_selected_topic';

// Authorization helpers
export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Helper to make API requests with Authorization context and JSON formatting
async function request(path: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path}`;

  const headers = new Headers(options.headers || {});
  
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Parse response
    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Backend validation error list or structured exception
      let errorMessage = 'An error occurred';
      if (data && typeof data === 'object') {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err: any) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
          } else {
            errorMessage = data.detail;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (typeof data === 'string' && data.length > 0) {
        errorMessage = data;
      }
      
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.status) {
      throw error;
    }
    // Network reachability issue
    // Suppress console.error to avoid spamming the log in preview mode
    const connectionError: any = new Error('Could not reach backend server. Please verify your Render backend container is running and active.');
    connectionError.status = 503;
    throw connectionError;
  }
}

// API methods client
export const api = {
  // --- Authentication ---
  async register(fullname: string, email: string, password: string, language: string = 'en') {
    return request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password, language }),
    });
  },

  async login(email: string, password: string) {
    // URL encoded form data
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const data = await request('/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (data && data.access_token) {
      setAccessToken(data.access_token);
    }
    return data;
  },

  async getMe() {
    return request('/auth/me', { method: 'GET' });
  },

  // --- Grades / Catalog & Structure ---
  async getGrades() {
    return request('/catalog/grades', { method: 'GET' });
  },

  async createGrade(name: string, slug: string, displayOrder: number, isActive: boolean = true) {
    return request('/catalog/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, display_order: displayOrder, is_active: isActive }),
    });
  },

  async getSubjects(gradeId: string) {
    return request(`/catalog/grades/${gradeId}/subjects`, { method: 'GET' });
  },

  async createSubject(gradeId: string, name: string, slug: string, description: string, displayOrder: number, isActive: boolean = true) {
    return request(`/catalog/grades/${gradeId}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description, display_order: displayOrder, is_active: isActive }),
    });
  },

  async getChapters(subjectId: string) {
    return request(`/catalog/subjects/${subjectId}/chapters`, { method: 'GET' });
  },

  async createChapter(subjectId: string, chapterNumber: number, title: string, slug: string, description: string, isActive: boolean = true) {
    return request(`/catalog/subjects/${subjectId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_number: chapterNumber, title, slug, description, is_active: isActive }),
    });
  },

  async getTopics(chapterId: string) {
    return request(`/catalog/chapters/${chapterId}/topics`, { method: 'GET' });
  },

  async createTopic(chapterId: string, title: string, slug: string, description: string, learningObjective: string, displayOrder: number, isActive: boolean = true) {
    return request(`/catalog/chapters/${chapterId}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, explanation: description, description, learning_objective: learningObjective, display_order: displayOrder, is_active: isActive }),
    });
  },

  async getTopicDetail(topicId: string) {
    return request(`/catalog/topics/${topicId}`, { method: 'GET' });
  },

  // --- Simulations ---
  async getSimulationsByChapter(chapterId: string) {
    return request(`/simulations/chapters/${chapterId}`, { method: 'GET' });
  },

  async getSimulationsByTopic(topicId: string) {
    return request(`/simulations/topics/${topicId}`, { method: 'GET' });
  },

  async createSimulation(chapterId: string, payload: {
    title: string;
    slug: string;
    description: string;
    language: string;
    simulation_url: string;
    thumbnail_url?: string;
    display_order: number;
    is_active: boolean;
    topic_id?: string;
  }) {
    return request(`/simulations/chapters/${chapterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async updateSimulation(simulationId: string, payload: Partial<{
    title: string;
    slug: string;
    description: string;
    language: string;
    simulation_url: string;
    thumbnail_url?: string;
    display_order: number;
    is_active: boolean;
    topic_id?: string;
  }>) {
    return request(`/simulations/${simulationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async getSimulationDetail(simulationId: string) {
    return request(`/simulations/${simulationId}`, { method: 'GET' });
  },

  // --- Documents (Textbooks PDF) ---
  async getDocumentsByChapter(chapterId: string) {
    return request(`/documents/chapters/${chapterId}`, { method: 'GET' });
  },

  async uploadDocument(chapterId: string, title: string, language: string, file: File) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('language', language);
    formData.append('file', file);

    return request(`/documents/chapters/${chapterId}/upload`, {
      method: 'POST',
      body: formData, // Fetch automatically populates multiparts headers
    });
  },

  async getDocumentDetail(documentId: string) {
    return request(`/documents/${documentId}`, { method: 'GET' });
  },

  async getDocumentPages(documentId: string) {
    return request(`/documents/${documentId}/pages`, { method: 'GET' });
  },

  async approveDocument(documentId: string) {
    return request(`/documents/${documentId}/approve`, {
      method: 'PATCH',
    });
  },

  // --- RAG (Retrieval-Augmented Generation) ---
  async buildRagChunks(documentId: string, payload: {
    topic_id?: string;
    page_start: number;
    page_end: number;
    chunk_size_words?: number;
    overlap_words?: number;
  }) {
    return request(`/rag/documents/${documentId}/chunks/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async getRagChunks(documentId: string, topicId: string) {
    return request(`/rag/documents/${documentId}/topics/${topicId}/chunks`, { method: 'GET' });
  },

  async testRagSearch(query: string, language: string = 'en', topic_id?: string, k: number = 3) {
    return request('/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language, topic_id, k }),
    });
  },

  // --- Tutor Interactive Conversations ---
  async getConversations() {
    return request('/tutor/conversations', { method: 'GET' });
  },

  async createConversation(topicId: string, language: string = 'en', useRag: boolean = true) {
    return request('/tutor/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, language, use_rag: useRag }),
    });
  },

  async updateConversationSettings(conversationId: string, useRag: boolean, language: string) {
    return request(`/tutor/conversations/${conversationId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ use_rag: useRag, language }),
    });
  },

  async generateStoryLesson(conversationId: string, studentPreference: string) {
    return request(`/tutor/conversations/${conversationId}/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_preference: studentPreference }),
    });
  },

  async sendMessage(conversationId: string, message: string) {
    return request(`/tutor/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  },

  async getMessages(conversationId: string) {
    return request(`/tutor/conversations/${conversationId}/messages`, { method: 'GET' });
  },

  // --- Diagnostics, Quizzes and status checks ---
  async generateUnderstandingCheck(topicId: string) {
    return request(`/diagnostics/topics/${topicId}/understanding-check/generate`, {
      method: 'POST',
    });
  },

  async generateDiagnosticQuiz(topicId: string) {
    return request(`/diagnostics/topics/${topicId}/quiz/generate`, {
      method: 'POST',
    });
  },

  async getSessionQuestions(sessionId: string) {
    return request(`/diagnostics/sessions/${sessionId}/questions`, { method: 'GET' });
  },

  async submitSessionAnswers(sessionId: string, payload: any) {
    return request(`/diagnostics/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async getSessionResult(sessionId: string) {
    return request(`/diagnostics/sessions/${sessionId}/result`, { method: 'GET' });
  },

  async getTopicStatus(topicId: string) {
    return request(`/diagnostics/me/topics/${topicId}/status`, { method: 'GET' });
  },

  async getSubjectSummary(subjectId: string) {
    return request(`/diagnostics/me/subjects/${subjectId}/summary`, { method: 'GET' });
  },

  // --- Remediation ---
  async generateRemediation(diagnosticSessionId: string) {
    return request(`/remediation/diagnostic-sessions/${diagnosticSessionId}/generate`, {
      method: 'POST',
    });
  },

  async getRemediationSession(remediationSessionId: string) {
    return request(`/remediation/sessions/${remediationSessionId}`, { method: 'GET' });
  },

  async submitRemediationRecheck(remediationSessionId: string, studentAnswer: string) {
    return request(`/remediation/sessions/${remediationSessionId}/recheck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_answer: studentAnswer }),
    });
  },

  async getRemediationByTopic(topicId: string) {
    return request(`/remediation/me/topics/${topicId}`, { method: 'GET' });
  },

  // --- Educational Blog ---
  async getPublishedBlogs() {
    return request('/blog', { method: 'GET' });
  },

  async getBlogBySlug(slug: string) {
    return request(`/blog/${slug}`, { method: 'GET' });
  },

  async getAllBlogsAdmin() {
    return request('/blog/admin/all', { method: 'GET' });
  },

  async generateBlogDraft(topic: string, description: string, language: string = 'en') {
    return request('/blog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, description, language }),
    });
  },

  async publishBlog(blogId: string) {
    return request(`/blog/${blogId}/publish`, {
      method: 'PATCH',
    });
  },

  async unpublishBlog(blogId: string) {
    return request(`/blog/${blogId}/unpublish`, {
      method: 'PATCH',
    });
  },

  async getBlogs() {
    return this.getAllBlogsAdmin();
  },

  async createBlog(payload: any) {
    return request('/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async updateBlog(blogId: string, payload: any) {
    return request(`/blog/${blogId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async deleteBlog(blogId: string) {
    return request(`/blog/${blogId}`, {
      method: 'DELETE',
    });
  }
};
