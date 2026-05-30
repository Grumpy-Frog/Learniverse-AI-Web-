import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Simulation } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';
import { Play, Sparkles, AlertTriangle, MonitorPlay, XCircle } from 'lucide-react';

interface SimulationViewerProps {
  topicId: string;
  chapterId?: string;
  topicTitle?: string;
}

export default function SimulationViewer({ topicId, chapterId, topicTitle }: SimulationViewerProps) {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSim, setSelectedSim] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (topicId) {
      fetchSimulations();
    }
  }, [topicId, chapterId]);

  const fetchSimulations = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedSim(null);
    try {
      let data = await api.getSimulationsByTopic(topicId);
      
      // If no simulations for topic, fallback to chapter
      if ((!data || data.length === 0) && chapterId) {
        data = await api.getSimulationsByChapter(chapterId);
      }

      // Filter active simulations
      const activeSims = data.filter((s: Simulation) => s.is_active !== false);
      setSimulations(activeSims);
      if (activeSims.length > 0) {
        setSelectedSim(activeSims[0]);
      }
    } catch (err: any) {
      console.warn('Error loading simulations:', err);
      // Frequently fallback to empty lists if no simulations exist for a newly created topic
      setSimulations([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Connecting to interactive simulation pipeline..." size="sm" />;
  }

  return (
    <div className="space-y-5">
      
      {/* Header section */}
      <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Topic Virtual Simulations ({simulations.length})
          </h3>
        </div>
        <p className="text-[10px] font-mono text-slate-400">
          HTML5 sandbox sandbox environment
        </p>
      </div>

      {simulations.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-dotted border-slate-250 dark:border-slate-800 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2 shrink-0" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            No Lab Simulations Installed
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 max-w-md mx-auto">
            Interactive virtual simulations, formulas parameters or vectors graphs can be registered in the admin dashboard for '{topicTitle || 'this topic'}'.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Simulations List */}
          <div className="lg:col-span-3 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
            {simulations.map(sim => (
              <div key={sim.id}>
                <Card
                  onClick={() => setSelectedSim(sim)}
                  className={`p-3.5 border transition-all duration-200 relative ${
                    selectedSim?.id === sim.id
                      ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-900/60 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950/20'
                  }`}
                >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 line-clamp-2">
                    {sim.title}
                  </h4>
                  <Badge variant={sim.language === 'bn' ? 'default' : 'admin'}>
                    {sim.language === 'bn' ? 'Bangla' : 'English'}
                  </Badge>
                </div>
                
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {sim.description || 'Virtual lab environment mapping this subject point.'}
                </p>

                {selectedSim?.id === sim.id && (
                  <div className="absolute right-3 bottom-3 text-red-500 flex items-center gap-1 font-mono text-[8px] font-bold uppercase animate-pulse">
                    <Sparkles className="h-2.5 w-2.5" /> Activated
                  </div>
                )}
              </Card>
            </div>
          ))}
          </div>

          {/* Right Sandbox Viewport iframe */}
          <div className="lg:col-span-9 flex flex-col gap-2">
            {selectedSim ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-md flex flex-col">
                {/* Meta details bar */}
                <div className="px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span className="truncate">URL: {selectedSim.simulation_url}</span>
                  <span className="uppercase text-rose-400 font-bold tracking-wider">Physics & Math Interactive Simulator</span>
                </div>
                
                {/* The iframe viewport */}
                <div className="w-full relative aspect-video bg-white min-h-[600px] md:min-h-[800px]">
                  <iframe
                    src={selectedSim.simulation_url}
                    title={selectedSim.title}
                    sandbox="allow-scripts allow-same-origin"
                    className="absolute inset-0 w-full h-full border-0"
                    id="sim-iframe"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center min-h-[360px]">
                <Play className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse mb-3 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select an interactive lab simulation on the left to initialize inside the sandboxed viewport.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
