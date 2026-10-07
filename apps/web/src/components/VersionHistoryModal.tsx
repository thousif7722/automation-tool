import React from 'react';
import { History, X, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { WorkflowVersion } from '../types/workflow';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: WorkflowVersion[];
  currentVersion: number;
  onRestoreVersion: (versionNum: number) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onRestoreVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Workflow Version History</h3>
              <p className="text-[11px] text-slate-400">View immutable published versions & restore prior states</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Versions List */}
        <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto text-xs">
          {versions.map((ver) => {
            const isCurrent = ver.version === currentVersion;

            return (
              <div
                key={ver.version}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-violet-600/10 border-violet-500/50 shadow-violet-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[44px]">
                    <span className="text-xs font-bold text-violet-400">v{ver.version}</span>
                    <span
                      className={`block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded mt-0.5 border ${
                        ver.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {ver.status}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-200">
                      {isCurrent ? 'Current Active Version' : `Version ${ver.version} Snapshot`}
                    </h5>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{ver.createdAt}</span> • <span>{ver.nodesCount} nodes</span>
                    </p>
                  </div>
                </div>

                {isCurrent ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onRestoreVersion(ver.version);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
                  >
                    <RotateCcw className="w-3 h-3 text-violet-400" />
                    <span>Restore v{ver.version}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
