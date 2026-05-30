import React from 'react';
import Card from '../ui/Card';
import { Award } from 'lucide-react';
import { formatSkillLabel } from '../../lib/dashboardLoader';

interface StrengthsCardProps {
  strengths: string[];
}

export default function StrengthsCard({ strengths }: StrengthsCardProps) {
  return (
    <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 h-full">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Strengths</p>
        <Award className="h-5 w-5 text-emerald-500" />
      </div>
      <h4 className="text-3xl font-black text-emerald-500 mb-1">{strengths.length}</h4>
      <p className="text-[11px] font-bold text-[var(--text-secondary)] mb-4">Unique competencies observed</p>
      
      <div className="flex flex-wrap gap-2">
        {strengths.length > 0 ? (
          strengths.map((s, idx) => (
            <span key={idx} className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-tighter">
              {formatSkillLabel(s)}
            </span>
          ))
        ) : (
          <p className="text-[10px] text-[var(--text-secondary)] italic">Complete checks to trigger strengths.</p>
        )}
      </div>
    </Card>
  );
}
