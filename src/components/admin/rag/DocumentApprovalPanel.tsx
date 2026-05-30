import React, { useState } from 'react';
import { api } from '../../../lib/api';
import { TextbookDocument } from '../../../types';
import Button from '../../ui/Button';
import { ShieldCheck, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface DocumentApprovalPanelProps {
  document: TextbookDocument;
  onApproved: (updated: TextbookDocument) => void;
}

export default function DocumentApprovalPanel({ document, onApproved }: DocumentApprovalPanelProps) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      await api.approveDocument(document.id);
      const updated = await api.getDocumentDetail(document.id);
      onApproved(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to approve document');
    } finally {
      setApproving(false);
    }
  };

  if (document.is_approved) {
    return (
      <div className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 animate-in fade-in zoom-in-95">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Certified Source</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        onClick={handleApprove} 
        isLoading={approving}
        className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 px-6"
      >
        <ShieldCheck className="h-4 w-4 mr-2" />
        <span className="text-[10px] font-black uppercase tracking-widest">Verify & Approve</span>
      </Button>
      {error && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{error}</span>}
      <p className="text-[8px] font-black uppercase text-slate-600 tracking-tighter mr-1">Audit required before RAG indexing</p>
    </div>
  );
}
