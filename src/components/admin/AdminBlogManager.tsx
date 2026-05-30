import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BlogPost } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import { Newspaper, Share, FileText, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface AdminBlogManagerProps {
  onNavigate?: (path: string) => void;
}

export default function AdminBlogManager({ onNavigate }: AdminBlogManagerProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const list = await api.getBlogs(); // Retrieves both draft and published posts
      setBlogs(list || []);
    } catch (e: any) {
      setFeedback({ type: 'err', text: `Failed to load blog posts: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    setLoading(true);
    setFeedback(null);
    try {
      if (post.is_published || post.status === 'published') {
        await api.unpublishBlog(post.id);
        setFeedback({ type: 'success', text: `Successfully unpublished "${post.title}".` });
      } else {
        await api.publishBlog(post.id);
        setFeedback({ type: 'success', text: `Successfully published "${post.title}".` });
      }
      fetchBlogs();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Publish action failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Structural Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] font-black text-blue-500 uppercase">
            Blog Admin
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
            Blog Posts Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-semibold">
            Generate, review, publish, and unpublish Learniverse AI blog posts.
          </p>
        </div>
        <Button onClick={() => onNavigate && onNavigate('/admin/blog/new')}>
          New Blog Draft
        </Button>
      </div>

      {feedback && (
        <StatusMessage
          type={feedback.type === 'success' ? 'success' : 'error'}
          message={feedback.text}
        />
      )}

      {loading && blogs.length === 0 ? (
        <LoadingState message="Loading blog posts..." />
      ) : blogs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-400 border-dashed">
          <Newspaper className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No blog posts found.</p>
          <Button onClick={() => onNavigate && onNavigate('/admin/blog/new')} className="mt-4" variant="secondary">
            Generate your first blog draft
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(post => {
            const isPublished = post.is_published || post.status === 'published';
            return (
              <Card key={post.id} className="p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      post.category === 'physics' ? 'bg-blue-100 text-blue-800' :
                      post.category === 'chemistry' ? 'bg-purple-100 text-purple-800' :
                      post.category === 'biology' ? 'bg-green-100 text-green-800' :
                      'bg-cyan-100 text-cyan-800'
                    }`}>
                      {post.category || 'Science'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        {post.language}
                      </span>
                      {isPublished ? (
                        <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center font-bold">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded flex items-center font-bold">
                          <FileText className="w-3 h-3 mr-1" /> Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] leading-tight">{post.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2">{post.excerpt || post.short_description || 'No description available'}</p>
                  </div>
                  
                  <div className="text-[9px] text-[var(--text-secondary)] font-mono">
                    Created: {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
                  <Button 
                    variant={isPublished ? "secondary" : "primary"}
                    size="sm" 
                    onClick={() => handleTogglePublish(post)}
                    disabled={loading}
                    className="text-xs"
                  >
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  
                  {isPublished && onNavigate && (
                    <button 
                      onClick={() => onNavigate(`/blog/${post.slug}`)} 
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Public
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
