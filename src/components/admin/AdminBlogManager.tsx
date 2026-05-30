import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BlogPost } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import MarkdownContent from '../markdown/MarkdownContent';
import { PenTool, Sparkles, BookOpen, Trash2, Calendar, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminBlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);

  // Editor states
  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'Physics',
    language: 'en' as 'en' | 'bn',
    excerpt: '',
    contentMarkdown: '',
    keywords: '' // Trigger for draft generation
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // Load initially
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const list = await api.getBlogs(); // Retrieves both draft and published posts
      setBlogs(list || []);
    } catch (e: any) {
      setFeedback({ type: 'err', text: `Failed to load edit history: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPost = (post: BlogPost) => {
    setSelectedBlog(post);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category || 'Physics',
      language: post.language,
      excerpt: post.excerpt || '',
      contentMarkdown: post.content_markdown,
      keywords: ''
    });
  };

  const handleResetForm = () => {
    setSelectedBlog(null);
    setForm({
      title: '',
      slug: '',
      category: 'Physics',
      language: 'en',
      excerpt: '',
      contentMarkdown: '',
      keywords: ''
    });
  };

  const handleGenerateAiDraft = async () => {
    if (!form.keywords.trim()) {
      setFeedback({ type: 'err', text: 'Specify a topic concept outline or brief keywords in the Keywords input field to synthesize.' });
      return;
    }

    setGenerating(true);
    setFeedback(null);
    try {
      // POST `/blog/draft/generate`
      const result = await api.generateBlogDraft(form.keywords, form.language, form.category);
      
      // Merge values into editor
      setForm(prev => ({
        ...prev,
        title: result.title || prev.title || 'AI Generated Blog Lesson Draft',
        slug: result.slug || prev.title.toLowerCase().replace(/[^a-z0-0]+/g, '-'),
        excerpt: result.excerpt || '',
        contentMarkdown: result.content_markdown || ''
      }));

      setFeedback({ type: 'success', text: 'High-quality comprehensive educational lesson synthesized successfully! Verify the markdown draft below.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Error occurred while generating AI outline draft.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.contentMarkdown.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: form.category,
        language: form.language,
        excerpt: form.excerpt,
        content_markdown: form.contentMarkdown,
        is_published: selectedBlog ? selectedBlog.is_published : false
      };

      if (selectedBlog) {
        // PATCH
        await api.updateBlog(selectedBlog.id, payload);
        setFeedback({ type: 'success', text: `Article "${form.title}" successfully saved.` });
      } else {
        // POST
        await api.createBlog(payload);
        setFeedback({ type: 'success', text: `Draft "${form.title}" successfully created.` });
      }

      handleResetForm();
      fetchBlogs();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save educational resources draft.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you absolutely sure you want to delete this class post? This is final.')) return;

    setLoading(true);
    try {
      await api.deleteBlog(id);
      setFeedback({ type: 'success', text: 'Article deleted successfully.' });
      handleResetForm();
      fetchBlogs();
    } catch (err: any) {
      setFeedback({ type: 'err', text: `Could not delete: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setFeedback(null);
    try {
      if (post.is_published) {
        await api.unpublishBlog(post.id);
        setFeedback({ type: 'success', text: `Successfully unpublished "${post.title}". Draft restricted.` });
      } else {
        await api.publishBlog(post.id);
        setFeedback({ type: 'success', text: `Successfully published "${post.title}"! visible now in catalog.` });
      }
      fetchBlogs();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Publish toggle failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase mb-1">Administrative Office</span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white heading-font">
          EDUCATIONAL ARTICLE WORKBENCH
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-404 mt-1 max-w-xl font-semibold">
          Draft educational posts manually, synthesize detailed articles with specialized LLM parameters, and publish resources directly into the catalog list.
        </p>
      </div>

      {feedback && (
        <StatusMessage
          type={feedback.type === 'success' ? 'success' : 'error'}
          message={feedback.text}
        />
      )}

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sibling Panel: List of available blogs */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-4 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-3.5">
            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">DICTONARY DIRECTORY ({blogs.length})</span>
            
            {loading ? (
              <LoadingState message="Connecting to editorial database..." size="sm" />
            ) : blogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No posts drafted. Create your first on the right!</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {blogs.map(post => {
                  const isActive = selectedBlog?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      onClick={() => handleSelectPost(post)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition flex justify-between items-start gap-2.5
                        ${isActive 
                          ? 'border-indigo-500 bg-slate-105 dark:border-blue-400 dark:bg-slate-950/40' 
                          : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 bg-white dark:bg-slate-955'
                        }`}
                    >
                      <div className="space-y-0.5 truncate max-w-[210px]">
                        <h5 className="font-extrabold text-slate-850 dark:text-slate-50 truncate leading-tight">{post.title}</h5>
                        <p className="text-[10px] text-slate-450 truncate">Category: {post.category} &bull; Lang: {post.language}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* Publish controls */}
                        <button
                          type="button"
                          onClick={(e) => handleTogglePublish(post, e)}
                          title={post.is_published ? 'Click to unpublish' : 'Click to publish'}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            post.is_published 
                              ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' 
                              : 'text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-800'
                          }`}
                        >
                          {post.is_published ? (
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 rounded uppercase">Live</span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-555 bg-slate-500/10 px-1.5 rounded uppercase">Draft</span>
                          )}
                        </button>

                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-neutral-802 rounded"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Detailed editor */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-5 md:p-6 border-slate-202 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font">
                {selectedBlog ? `EDITING: ${selectedBlog.title}` : 'COMPOSE LESSON ARTICLE'}
              </span>
              {selectedBlog && (
                <button onClick={handleResetForm} className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-800 dark:hover:text-white transition">Cancel</button>
              )}
            </div>

            {/* AI drafting wizard segment */}
            <div className="p-4 rounded-xl border border-dashed border-indigo-200 dark:border-blue-900 bg-indigo-500/5 dark:bg-blue-400/5 space-y-3 font-normal">
              <div className="flex gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono font-black text-indigo-500 dark:text-blue-400 block tracking-wider">Learniverse AI Writer Assist</span>
                  <p className="text-[11px] text-slate-455 dark:text-slate-355 leading-relaxed">
                    Provide specialized organic chemistry, physical science, cellular organelles, or linear formula keywords. Let AI synthesize a long-form draft!
                  </p>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <textarea
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="e.g., Alkanes physical properties, covalent properties, combustion equations..."
                  className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 placeholder:text-slate-405"
                  rows={2}
                />
                <Button
                  onClick={handleGenerateAiDraft}
                  isLoading={generating}
                  size="sm"
                  variant="primary"
                  className="h-[52px] select-none"
                >
                  Generate Draft
                </Button>
              </div>
            </div>

            {/* Editing Form */}
            <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Article Title"
                  placeholder="e.g., Guide to Alkanes structures"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <Input
                  label="URL Slug"
                  placeholder="e.g., guide-to-alkanes-structures"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category selectors */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Catalog Category Subject</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>

                {/* language dialect */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Language Dialect</span>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value as 'en' | 'bn' })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-955 text-slate-901 dark:text-white"
                  >
                    <option value="en">English (en)</option>
                    <option value="bn">Bangla (bn)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Course Card Excerpt"
                placeholder="Give a short 1-line hook description for lists cards summary..."
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />

              {/* Contents body code block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Markdown Body Workspace</span>
                  <textarea
                    value={form.contentMarkdown}
                    onChange={(e) => setForm({ ...form, contentMarkdown: e.target.value })}
                    placeholder="Provide detailed standard academic lesson texts using rich markdown details..."
                    className="w-full min-h-[300px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                    required
                  />
                </div>

                {/* Previews panel */}
                <div className="space-y-1 flex flex-col h-full overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 select-none">Live Markdown Render</span>
                  <div className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-y-auto max-h-[300px] prose dark:prose-invert">
                    {form.contentMarkdown ? (
                      <MarkdownContent content={form.contentMarkdown} />
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No content drafted yet. Use Assist above or compose manually.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] text-slate-450 select-none">Markdown fully supported & parsed at compilation runtime</span>
                <Button type="submit" size="md" isLoading={saving}>
                  {selectedBlog ? 'Update Article' : 'Pin New Draft'}
                </Button>
              </div>

            </form>

          </Card>
        </div>

      </div>

    </div>
  );
}
