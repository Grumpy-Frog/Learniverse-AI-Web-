import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BlogPost } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import StatusMessage from '../ui/StatusMessage';
import MarkdownContent from '../markdown/MarkdownContent';
import { BookOpen, Calendar, ArrowLeft, ArrowUpRight } from 'lucide-react';

interface BlogWorkspaceProps {
  initialSlug?: string;
  onNavigate?: (route: string) => void;
}

export default function BlogWorkspace({ initialSlug, onNavigate }: BlogWorkspaceProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSlug) {
      fetchBlogDetail(initialSlug);
    } else {
      fetchBlogs();
    }
  }, [initialSlug]);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    setActiveBlog(null);
    try {
      const list = await api.getPublishedBlogs();
      setBlogs(list || []);
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading educational resources.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogDetail = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBlogBySlug(slug);
      setActiveBlog(data);
    } catch (err: any) {
      setError(`Failed to retrieve post details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPost = (post: BlogPost) => {
    // Update hash router gracefully 
    window.location.hash = `#/blog/${post.slug}`;
    setActiveBlog(post);
  };

  const handleBackToList = () => {
    window.location.hash = `#/blog`;
    setActiveBlog(null);
    fetchBlogs();
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return 'Educator Article';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-8">
      
      {/* Blog Header (Only show if not reading detail) */}
      {!activeBlog && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-1">LEARNIVERSE CORNER</div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white heading-font">
            SCIENCE & MATHEMATICS BLOG
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-semibold leading-relaxed">
            Explaining physical forces, chemical elements, biological cells, and formulas through clear concepts curated by educators and AI experts.
          </p>
        </div>
      )}

      {loading && <LoadingState message="Connecting to educational publishing desk..." />}

      {error && (
        <StatusMessage type="error" message={error} onRetry={activeBlog ? () => fetchBlogDetail(activeBlog.slug) : fetchBlogs} />
      )}

      {/* List of published posts */}
      {!loading && !activeBlog && (
        blogs.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-slate-205 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/30">
            <span className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-350 mx-auto block w-fit mb-3 border border-slate-105 dark:border-slate-805">
              <BookOpen className="h-6 w-6" />
            </span>
            <p className="text-sm font-bold text-slate-705 dark:text-slate-355 mb-1">No educational posts published yet.</p>
            <p className="text-xs text-slate-450">Check back later or log as admin to generate AI drafts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map(post => (
              <div key={post.id}>
                <Card
                  onClick={() => handleSelectPost(post)}
                  className="p-6 md:p-7 h-full flex flex-col justify-between gap-4 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 select-none group"
                >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
                    <Badge variant="source_grounded">{post.category || 'Science'}</Badge>
                    <span className="text-slate-450">{post.language === 'bn' ? 'Bangla bn' : 'English en'}</span>
                  </div>
                  <h3 className="text-lg font-black leading-tight text-slate-905 dark:text-slate-50 heading-font group-hover:text-blue-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-3.5 mt-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 font-medium select-none">
                    <Calendar className="h-3 w-3" /> {formatDate(post.created_at)}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 group-hover:underline">
                    Read Article &nbsp;<ArrowUpRight className="h-4 w-4 shrink-0" />
                  </span>
                </div>
              </Card>
            </div>
          ))}
          </div>
        )
      )}

      {/* Detailed article layout */}
      {!loading && activeBlog && (
        <article className="space-y-6 pt-4">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer select-none mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> BACK TO DICTONARY
          </button>

          <div className="space-y-4 max-w-(--size-xs) mx-auto">
            {/* Category / language */}
            <div className="flex items-center gap-3 select-none">
              <Badge variant="source_grounded">{activeBlog.category || 'Science'}</Badge>
              <span className="text-xs uppercase font-mono text-slate-400 dark:text-slate-500">
                {activeBlog.language === 'bn' ? 'Bangla bn' : 'English en'} &bull; {formatDate(activeBlog.created_at)}
              </span>
            </div>

            {/* Title / excerpt */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-3">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white heading-font leading-tight">
                {activeBlog.title}
              </h1>
              {activeBlog.excerpt && (
                <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic pl-3 border-l-2 border-indigo-500">
                  {activeBlog.excerpt}
                </p>
              )}
            </div>

            {/* Markdown content parser block */}
            <MarkdownContent content={activeBlog.content_markdown} className="py-2 prose prose-slate dark:prose-invert" />
          </div>
        </article>
      )}

    </div>
  );
}
