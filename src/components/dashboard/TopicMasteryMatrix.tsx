import React, { useState } from 'react';
import { DashboardTopic } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getTopicMasteryCategory } from '../../lib/dashboardLoader';

interface TopicMasteryMatrixProps {
  topics: DashboardTopic[];
  onTopicClick: (topic: DashboardTopic) => void;
}

export default function TopicMasteryMatrix({ topics, onTopicClick }: TopicMasteryMatrixProps) {
  const [hoveredTopic, setHoveredTopic] = useState<DashboardTopic | null>(null);

  // Stats calculation
  const completedCount = topics.filter(t => t.completion_status === 'completed').length;
  const totalCount = topics.length;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getTileColor = (topic: DashboardTopic) => {
    const category = getTopicMasteryCategory(topic);
    switch (category) {
      case "mastered":
        return 'bg-[var(--success)] shadow-lg shadow-[var(--success)]/20';
      case "improving":
        return 'bg-cyan-500 shadow-lg shadow-cyan-500/20';
      case "practice":
        return 'bg-[var(--warning)] shadow-lg shadow-[var(--warning)]/20';
      case "weak":
        return 'bg-[var(--danger)] shadow-lg shadow-[var(--danger)]/20';
      default:
        return 'bg-[var(--glass-bg)] border border-[var(--glass-border)] opacity-40';
    }
  };

  return (
    <Card className="p-6 relative overflow-visible">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[var(--text-secondary)] mb-0.5">Focus Heatmap</p>
          <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Topic Mastery Matrix</h3>
        </div>
        <Badge variant={overallPercent >= 85 ? 'completed' : overallPercent >= 60 ? 'needs_practice' : 'not_started'}>
          {overallPercent >= 85 ? 'Top 15% Class' : overallPercent >= 60 ? 'On Track' : 'Keep Practicing'}
        </Badge>
      </div>

      {topics.length > 0 ? (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5">
          {topics.map((topic) => (
            <div 
              key={topic.topic_id} 
              className={`h-9 rounded-lg ${getTileColor(topic)} cursor-pointer transition-all hover:scale-110 hover:z-20 group relative flex items-center justify-center p-1 px-1.5 overflow-hidden`}
              onClick={() => onTopicClick(topic)}
              onMouseEnter={() => setHoveredTopic(topic)}
              onMouseLeave={() => setHoveredTopic(null)}
              title={`${topic.topic_title} \u00B7 ${topic.completion_status} \u00B7 ${topic.best_score ?? "No score"}`}
            >
              <span className="text-[7px] font-black leading-none uppercase text-white/90 truncate text-center pointer-events-none">
                {topic.topic_title}
              </span>
              
              {/* Tooltip implementation */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <p className="text-[9px] font-mono text-[var(--text-secondary)] uppercase mb-1">{topic.subject_name}</p>
                <h4 className="text-[11px] font-black text-[var(--text-primary)] leading-tight mb-2">{topic.topic_title}</h4>
                <div className="flex justify-between items-center text-[10px] border-t border-[var(--glass-border)] pt-2">
                   <span className="font-bold text-[var(--text-secondary)]">STATUS</span>
                   <span className="font-black uppercase text-blue-500">{topic.completion_status.replace('_', ' ')}</span>
                </div>
                {topic.latest_score !== null && (
                   <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="font-bold text-[var(--text-secondary)]">LAST SCORE</span>
                    <span className="font-black">{topic.latest_score}%</span>
                  </div>
                )}
                {topic.best_score !== null && (
                   <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="font-bold text-[var(--text-secondary)]">BEST SCORE</span>
                    <span className="font-black">{topic.best_score}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-[var(--glass-border)] rounded-xl">
           <p className="text-xs text-[var(--text-secondary)] font-medium">No topics available yet.</p>
        </div>
      )}
      
      <div className="flex justify-between mt-5 pt-4 border-t border-[var(--glass-border)] text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--danger)]"></div> Weak</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--warning)]"></div> Practice</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></div> Improving</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--success)]"></div> Mastered</div>
        </div>
      </div>
    </Card>
  );
}
