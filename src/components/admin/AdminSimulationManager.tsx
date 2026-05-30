import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Grade, Subject, Chapter, Topic, Simulation } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import LoadingState from '../ui/LoadingState';
import { PlayCircle, Globe, Edit3, Trash, Check, Plus } from 'lucide-react';

export default function AdminSimulationManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);

  // Selected contexts
  const [selGrade, setSelGrade] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [selChapter, setSelChapter] = useState('');
  const [selTopic, setSelTopic] = useState('');

  // Form states
  const [editingSim, setEditingSim] = useState<Simulation | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    language: 'en' as 'en' | 'bn',
    simulationUrl: '',
    thumbnailUrl: '',
    displayOrder: 1,
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const isValidUrl = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const validPrefix = lowerUrl.startsWith('/simulations/') || lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://');
    const validExtension = lowerUrl.endsWith('.html');
    return validPrefix && validExtension;
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const g = await api.getGrades();
      setGrades(g || []);
    } catch (e: any) {
      setFeedback({ type: 'error', msg: `Failed to fetch grades lists: ${e.message}` });
    }
  };

  const handleGradeChange = async (gId: string) => {
    setSelGrade(gId);
    setSelSubject('');
    setSelChapter('');
    setSelTopic('');
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setSimulations([]);

    if (!gId) return;
    try {
      const s = await api.getSubjects(gId);
      setSubjects(s || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSubjectChange = async (sId: string) => {
    setSelSubject(sId);
    setSelChapter('');
    setSelTopic('');
    setChapters([]);
    setTopics([]);
    setSimulations([]);

    if (!sId) return;
    try {
      const c = await api.getChapters(sId);
      setChapters(c || []);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleChapterChange = async (cId: string) => {
    setSelChapter(cId);
    setSelTopic('');
    setTopics([]);
    setSimulations([]);

    if (!cId) return;
    setLoading(true);
    try {
      const t = await api.getTopics(cId);
      setTopics(t || []);

      // Pull simulations associated with this chapter
      const list = await api.getSimulationsByChapter(cId);
      setSimulations(list || []);
    } catch (e: any) {
      setFeedback({ type: 'error', msg: `Failed to fetch simulations: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = async (tId: string) => {
    setSelTopic(tId);
    if (!tId) {
      // Revert to chapter list
      if (selChapter) {
        const list = await api.getSimulationsByChapter(selChapter);
        setSimulations(list || []);
      }
      return;
    }

    setLoading(true);
    try {
      const list = await api.getSimulationsByTopic(tId);
      setSimulations(list || []);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (sim: Simulation) => {
    setEditingSim(sim);
    setForm({
      title: sim.title,
      slug: sim.slug,
      description: sim.description,
      language: sim.language,
      simulationUrl: sim.simulation_url,
      thumbnailUrl: sim.thumbnail_url || '',
      displayOrder: sim.display_order,
      isActive: sim.is_active
    });
  };

  const handleResetForm = () => {
    setEditingSim(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      language: 'en',
      simulationUrl: '',
      thumbnailUrl: '',
      displayOrder: 1,
      isActive: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selChapter) {
      setFeedback({ type: 'error', msg: 'Please select an active Chapter to link the simulation.' });
      return;
    }
    if (!form.title.trim() || !form.simulationUrl.trim()) return;

    if (!isValidUrl(form.simulationUrl)) {
      setFeedback({ 
        type: 'error', 
        msg: 'Invalid simulation URL. Must start with /simulations/, http://, or https:// and end with .html' 
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description,
        language: form.language,
        simulation_url: form.simulationUrl,
        thumbnail_url: form.thumbnailUrl || undefined,
        display_order: form.displayOrder,
        is_active: form.isActive,
        topic_id: selTopic || undefined
      };

      if (editingSim) {
        // PATCH update
        await api.updateSimulation(editingSim.id, payload);
        setFeedback({ type: 'success', msg: `Simulation "${form.title}" successfully updated!` });
      } else {
        // POST create
        await api.createSimulation(selChapter, payload);
        setFeedback({ type: 'success', msg: `Simulation "${form.title}" successfully indexed under chapter!` });
      }

      handleResetForm();
      // Reload lists
      if (selTopic) {
        handleTopicChange(selTopic);
      } else {
        handleChapterChange(selChapter);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Error occurred while saving simulation metadata.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase mb-1">Interactive Content Desk</span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white heading-font">
          LAB SIMULATION REGISTRY
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-semibold">
          Index, configure, and bind interactive HTML5 laboratories or PhET simulations with specific syllabus chapters.
        </p>
      </div>

      {feedback && (
        <StatusMessage
          type={feedback.type === 'success' ? 'success' : 'error'}
          message={feedback.msg}
        />
      )}

      {/* Selectors Bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Grade */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500">Grade Level</label>
          <select
            value={selGrade}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            <option value="">-- Choose Grade --</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500">Subject</label>
          <select
            value={selSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={!selGrade}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Chapter */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500">Chapter</label>
          <select
            value={selChapter}
            onChange={(e) => handleChapterChange(e.target.value)}
            disabled={!selSubject}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="">-- Choose Chapter --</option>
            {chapters.map(c => <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.title}</option>)}
          </select>
        </div>

        {/* Optional Topic */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500">Topic focus (Optional)</label>
          <select
            value={selTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={!selChapter}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-805 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="">-- All Chapter Simulations --</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </Card>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form panel */}
        <div className="lg:col-span-5">
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-black uppercase text-slate-800 dark:text-white heading-font">
                {editingSim ? 'EDIT SIMULATION VALUE' : 'REGISTER NEW LABORATORY'}
              </span>
              {editingSim && (
                <button onClick={handleResetForm} className="text-[10px] font-bold uppercase text-slate-400 hover:text-white transition">Cancel</button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <Input
                label="Simulation Title"
                placeholder="e.g., Force & Acceleration Sandbox"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Slug"
                  placeholder="e.g., force-acceleration"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Language Dialect</span>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value as 'en' | 'bn' })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="en">English (en)</option>
                    <option value="bn">Bangla (bn)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Simulation HTML URL / Public Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., /simulations/physics/ch-3/force-motion.html"
                    value={form.simulationUrl}
                    onChange={(e) => setForm({ ...form, simulationUrl: e.target.value })}
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    disabled={!form.simulationUrl || !isValidUrl(form.simulationUrl)}
                    onClick={() => {
                      const url = form.simulationUrl.startsWith('/') 
                        ? window.location.origin + form.simulationUrl 
                        : form.simulationUrl;
                      window.open(url, '_blank');
                    }}
                    className="px-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-500 hover:text-blue-500 disabled:opacity-30 transition-colors"
                    title="Preview Simulation"
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                  Place simulation HTML files inside <code className="text-blue-500">public/simulations/</code> and register the path. 
                  Example: <code className="text-blue-500">/simulations/physics/chapter-3/force-motion-en.html</code>
                </p>
              </div>

              <Input
                label="Thumbnail preview image URL (Optional)"
                placeholder="e.g., /assets/thumbnails/force.png"
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              />

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Lab Brief Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summarize the interactive components and calculations models students can test..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <Input
                  label="Display Order"
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-900"
                />
                <div className="flex justify-between items-center h-full pb-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 uppercase">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-slate-350"
                    />
                    <span>Active</span>
                  </label>
                  <Button type="submit" size="sm" isLoading={saving}>
                    {editingSim ? 'Save' : 'Register'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Existing simulations list panel */}
        <div className="lg:col-span-7">
          <Card className="p-5 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-4">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block heading-font border-b border-slate-100 dark:border-slate-805 pb-2">
              REGISTERED LABORATORY VIEWS ({simulations.length})
            </span>

            {loading ? (
              <LoadingState message="Fetching catalog files..." />
            ) : !selChapter ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">First, select Grade level & Subject & Chapter above to view associated simulation logs.</p>
            ) : simulations.length === 0 ? (
              <p className="text-xs text-slate-405 italic py-6 text-center">No simulations registered in this chapter yet.</p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {simulations.map(sim => (
                  <div key={sim.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-start gap-4">
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-indigo-500/10 text-indigo-500 rounded">
                          {sim.language === 'bn' ? 'Bangla bn' : 'English en'}
                        </span>
                        {!sim.is_active && <span className="text-[9px] text-amber-500 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-955 rounded">Draft</span>}
                      </div>
                      <h5 className="font-extrabold text-sm text-slate-800 dark:text-white leading-normal truncate">{sim.title}</h5>
                      <p className="text-xs text-slate-405 truncate">{sim.simulation_url}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditClick(sim)}
                      className="shrink-0 text-xs px-2.5 py-1.5"
                    >
                      <Globe className="h-3.5 w-3.5 mr-1" /> Edit Meta
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
}
