import React from 'react';
import {
  Play,
  Save,
  CheckCircle2,
  Undo2,
  Redo2,
  Copy,
  History,
  Send,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { WorkflowStatus } from '../types/workflow';

interface TopNavProps {
  workflowName: string;
  onUpdateName: (name: string) => void;
  version: number;
  status: WorkflowStatus;
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasErrors: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onOpenHistory: () => void;
  onOpenSimulator: () => void;
  onSave: () => void;
  onPublish: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  workflowName,
  onUpdateName,
  version,
  status,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  hasErrors,
  onUndo,
  onRedo,
  onDuplicate,
  onOpenHistory,
  onOpenSimulator,
  onSave,
  onPublish,
}) => {
  return (
    <header className="h-14 bg-slate-950/95 border-b border-slate-800/80 px-4 flex items-center justify-between select-none backdrop-blur-xl z-20">
      {/* Left Title & Status */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400">
          <Send className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onUpdateName(e.target.value)}
            className="text-sm font-semibold text-white bg-transparent border border-transparent hover:border-slate-800 focus:border-violet-500 rounded px-1.5 py-0.5 focus:outline-none transition-colors"
          />

          <span
            className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border uppercase ${
              status === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            v{version} {status}
          </span>

          <span className="text-xs text-slate-500 flex items-center gap-1.5 ml-2">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                <span className="text-violet-400">Saving...</span>
              </>
            ) : isDirty ? (
              <span className="text-amber-400 font-medium">• Unsaved changes</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Saved just now</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Center Utility Toolbar */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={onDuplicate}
          title="Duplicate Workflow"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Duplicate</span>
        </button>

        <button
          onClick={onOpenHistory}
          title="Version History"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors text-xs font-semibold"
        >
          <Play className="w-3.5 h-3.5 fill-cyan-300" />
          <span>Test Simulator</span>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors text-xs font-semibold"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 transition-colors text-xs font-semibold"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish Workflow</span>
        </button>
      </div>
    </header>
  );
};
