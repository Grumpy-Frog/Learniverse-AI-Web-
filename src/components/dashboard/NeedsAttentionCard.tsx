import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ShieldAlert } from 'lucide-react';
import { DashboardTopic } from '../../types';
import { formatSkillLabel } from '../../lib/dashboardLoader';

interface NeedsAttentionCardProps {
  weaknesses: string[];
  needsPracticeTopics: DashboardTopic[];
  onPracticeTopic: (topic: DashboardTopic) => void;
}

export default function NeedsAttentionCard({ weaknesses, needsPracticeTopics, onPracticeTopic }: NeedsAttentionCardProps) {
  const needsAttentionCount = Math.max(weaknesses.length, needsPracticeTopics.length);

  return (
    <Card className="p-6 bg-rose-500/5 border-rose-500/20 h-full">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] uppercase tracking-widest font-black text-rose-500">Needs Attention</p>
        <ShieldAlert className="h-5 w-5 text-rose-500" />
      </div>
      <h4 className="text-3xl font-black text-rose-500 mb-1">{needsAttentionCount}</h4>
      <p className="text-[11px] font-bold text-[var(--text-secondary)] mb-4">Concepts with lower mastery scores</p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {weaknesses.length > 0 ? (
          weaknesses.map((w, idx) => (
            <span key={idx} className="text-[10px] font-black bg-rose-500/10 text-rose-600 px-2 py-1 rounded-lg border border-rose-500/20 uppercase tracking-tighter">
              {formatSkillLabel(w)}
            </span>
          ))
        ) : (
          <p className="text-[10px] text-[var(--text-secondary)] italic">No critical conceptual gaps identified yet.</p>
        )}
      </div>

      {needsPracticeTopics.length > 0 ? (
        <div className="space-y-3 mt-4 pt-4 border-t border-rose-500/10">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Recommended Practice</p>
          {needsPracticeTopics.slice(0, 3).map((topic) => (
            <div key={topic.topic_id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 transition-all">
              <div className="min-w-0">
                <h5 className="text-[11px] font-black text-[var(--text-primary)] truncate">{topic.topic_title}</h5>
                <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase truncate">{topic.subject_name}</p>
                {topic.latest_score !== null && (
                  <p className="text-[9px] font-mono text-rose-500 mt-0.5">Score: {topic.latest_score}%</p>
                )}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="shrink-0 h-7 px-3 text-[9px] font-black uppercase"
                onClick={() => onPracticeTopic(topic)}
              >
                Practice
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
