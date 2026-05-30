import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { BlogPost } from '../../types';
import LoadingState from '../ui/LoadingState';
import { Newspaper } from 'lucide-react';
import BlogCardReal from '../blog/BlogCard';

interface PublicBlogListProps {
  onNavigate: (path: string) => void;
}

export default function PublicBlogList({ onNavigate }: PublicBlogListProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPublishedBlogs();
      setBlogs(data);
      setFilteredBlogs(data);
    } catch (err: any) {
      console.warn('Could not read published blog channels', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (cat: string) => {
    setCategoryFilter(cat);
    if (cat === 'All') {
      setFilteredBlogs(blogs);
    } else {
      setFilteredBlogs(blogs.filter(b => (b.category || '').toLowerCase() === cat.toLowerCase()));
    }
  };

  // Extract unique categories safely as strings
  const categories: string[] = ['All', ...blogs.map(b => b.category || '').filter((val, index, self) => val && self.indexOf(val) === index)];

  if (isLoading) {
    return <LoadingState message="Awaiting educational journal stream..." size="lg" />;
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* Visual Header */}
      <div className="border-b border-black dark:border-white pb-3 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-mono tracking-[0.25em] font-black text-rose-500 uppercase">
            Learniverse AI Editorial Journal
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-905 dark:text-white mt-1">
            Science & Math Blog
          </h1>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-xl border">
          <Newspaper className="h-10 w-10 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Journal stream empty
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No published blog posts found. Administrators can generate and publish articles from the blog editor console dashboard pages.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categories Tab headers */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => handleFilterChange(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all tracking-wider border ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black'
                    : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-655'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grids list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBlogs.map(blog => (
              <div key={blog.id}>
                <BlogCardReal
                  post={blog}
                  onClick={(slug) => onNavigate(`/blog/${slug}`)}
                />
              </div>
            ))}
          </div>

          {filteredBlogs.length === 0 && (
            <p className="text-xs text-slate-455 italic p-12 text-center">No published posts matching filter parameters.</p>
          )}
        </div>
      )}

    </div>
  );
}
