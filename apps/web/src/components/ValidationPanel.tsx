import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown, Route } from 'lucide-react';
import { ValidationError } from '../types/workflow';

interface ValidationPanelProps {
  errors: ValidationError[];
  estimatedPath: string[];
  onSelectNode: (nodeId: string) => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  errors,
  estimatedPath,
  onSelectNode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = errors.filter((e) => e.severity === 'ERROR').length;
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length;

  return (
    <div className="bg-slate-950/95 border-t border-slate-800/80 px-4 py-2 text-xs flex flex-col justify-center select-none backdrop-blur-xl z-20">
      {/* Summary Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {errorCount > 0 ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorCount} Error{errorCount > 1 ? 's' : ''}</span>
              </span>
            ) : warningCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{warningCount} Warning{warningCount > 1 ? 's' : ''}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Workflow Valid & Ready</span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Estimated Path:</span>
            <span className="font-mono text-cyan-300 font-semibold text-[11px]">
              {estimatedPath.length > 0 ? `${estimatedPath.length} steps` : 'no active path'}
            </span>
          </div>
        </div>

        {errors.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-[11px]">{isExpanded ? 'Hide Diagnostics' : 'View Diagnostics'}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded Diagnostics */}
      {isExpanded && errors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5 max-h-32 overflow-y-auto">
          {errors.map((err) => (
            <div
              key={err.id}
              onClick={() => err.nodeId && onSelectNode(err.nodeId)}
              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                err.severity === 'ERROR'
                  ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {err.severity === 'ERROR' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{err.message}</span>
              </div>
              {err.nodeId && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Inspect Node
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
