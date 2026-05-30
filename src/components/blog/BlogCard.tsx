import React from 'react';
import { BlogPost } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  onClick: (slug: string) => void;
  key?: React.Key | null | undefined;
}

export default function BlogCard({ post, onClick }: BlogCardProps) {
  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown Date';

  return (
    <Card
      onClick={() => onClick(post.slug)}
      className="border border-slate-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-all duration-300 flex flex-col justify-between group overflow-hidden bg-white/70 dark:bg-slate-900/40 relative active:scale-99 select-none"
    >
      {/* Dynamic indicators row */}
      <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-mono tracking-widest uppercase font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15">
              {post.category || 'Science Education'}
            </span>
            <Badge variant={post.language === 'bn' ? 'default' : 'admin'}>
              {post.language === 'bn' ? 'Bangla' : 'English'}
            </Badge>
          </div>

          <h3 className="text-sm font-black uppercase tracking-tight text-slate-955 dark:text-white leading-snug group-hover:text-rose-500 transition-colors line-clamp-2">
            {post.title}
          </h3>

          <p className="text-[11.5px] text-slate-500 leading-normal line-clamp-3">
            {post.excerpt || 'Read this AI-generated visual exploration on Physics or Mathematics formulas concept maps.'}
          </p>
        </div>

        {/* Small calendar footer indicators */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-105 dark:border-slate-800/60 mt-4 text-[10px] text-slate-450 font-mono">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.12em] group-hover:translate-x-1 transition-all duration-200 text-rose-500 inline-flex items-center gap-1 cursor-pointer">
            Read <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

    </Card>
  );
}
