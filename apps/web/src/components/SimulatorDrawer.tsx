import React, { useState } from 'react';
import {
  Play,
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  Send,
  Sliders,
  Trophy,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { runInBrowserSimulation } from '../utils/simulator';
import { SimulationResult } from '../types/workflow';

interface SimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
  edges: any[];
  onHighlightSteps: (executedNodeIds: string[]) => void;
}

export const SimulatorDrawer: React.FC<SimulatorDrawerProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  onHighlightSteps,
}) => {
  const [inputText, setInputText] = useState('How much does this product cost?');
  const [username, setUsername] = useState('sarah_shopper');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runInBrowserSimulation(nodes, edges, inputText, username);
      setResult(res);
      setIsRunning(false);
      onHighlightSteps(res.executedNodes.map((n) => n.nodeId));
    }, 300);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col z-50 backdrop-blur-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Workflow Execution Simulator</h3>
            <p className="text-[11px] text-slate-400">Test automation without calling Meta APIs</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inputs Section */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/20 space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Simulated Customer Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Simulated Input Event Text</label>
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isRunning ? 'Running Simulation...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Results & Trace Output */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {result ? (
          <>
            {/* Status Summary */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                result.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {result.status === 'COMPLETED' ? 'Simulation Succeeded' : 'Simulation Failed'}
                  </h4>
                  <p className="text-[11px] opacity-80">
                    {result.executedNodes.length} nodes executed step-by-step
                  </p>
                </div>
              </div>
              {result.goalAchieved && (
                <div className="flex items-center gap-1 bg-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border border-emerald-500/40">
                  <Trophy className="w-3 h-3 text-emerald-400" />
                  <span>Goal Conversion</span>
                </div>
              )}
            </div>

            {/* Step-by-Step Executed Nodes */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Execution Step Trace
              </span>
              <div className="space-y-2">
                {result.executedNodes.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h5 className="font-medium text-slate-200">{step.nodeName}</h5>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {step.nodeType}
                      </span>
                    </div>

                    {step.output && (
                      <pre className="p-2 rounded bg-slate-950 text-[10px] font-mono text-cyan-300 overflow-x-auto border border-slate-800/80">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Context & Variables */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Execution Context State
              </span>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Customer Score:</span>
                  <span className="font-mono text-amber-300 font-semibold">{result.context.customer.score}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Customer Tags:</span>
                  <span className="font-mono text-indigo-300 font-semibold">
                    {result.context.customer.tags.join(', ') || 'none'}
                  </span>
                </div>
                {Object.keys(result.context.custom).length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 text-[10px] block mb-1">Custom Variables:</span>
                    <pre className="p-2 rounded bg-slate-950 text-[10px] font-mono text-emerald-300">
                      {JSON.stringify(result.context.custom, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
            <Sparkles className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
            <h4 className="text-xs font-medium text-slate-400">Simulator Idle</h4>
            <p className="text-[11px] max-w-[240px] mt-1 text-slate-500">
              Enter sample input above and click "Run Simulation" to trace condition evaluations and action executions in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
