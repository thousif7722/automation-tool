import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Zap,
  GitFork,
  Bot,
  Send,
  Clock,
  Sliders,
  Trophy,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Tag,
  MessageSquare,
} from 'lucide-react';
import { WorkflowNodeData } from '../../types/workflow';

interface CustomNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
}

export const TriggerNode = memo(({ id, data, selected }: CustomNodeProps) => {
  const isExecuting = data.status === 'EXECUTING';
  const isExecuted = data.status === 'EXECUTED';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-slate-900/90 p-4 border transition-all shadow-xl backdrop-blur-md ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-500/30'
          : isExecuting
          ? 'border-amber-400 ring-4 ring-amber-400/30 animate-pulse'
          : isExecuted
          ? 'border-emerald-500/80 shadow-emerald-500/10'
          : 'border-violet-500/30 hover:border-violet-500/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-violet-400 uppercase">TRIGGER</span>
            <h4 className="text-sm font-semibold text-white">{data.label || 'Instagram Trigger'}</h4>
          </div>
        </div>
        {isExecuted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-violet-400" />
        <span>{data.config?.triggerType || 'COMMENT_CREATED'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />
    </div>
  );
});
TriggerNode.displayName = 'TriggerNode';

export const ConditionNode = memo(({ id, data, selected }: CustomNodeProps) => {
  const isExecuting = data.status === 'EXECUTING';
  const isExecuted = data.status === 'EXECUTED';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-slate-900/90 p-4 border transition-all shadow-xl backdrop-blur-md ${
        selected
          ? 'border-amber-500 ring-2 ring-amber-500/30'
          : isExecuting
          ? 'border-amber-400 ring-4 ring-amber-400/30 animate-pulse'
          : isExecuted
          ? 'border-emerald-500/80 shadow-emerald-500/10'
          : 'border-amber-500/30 hover:border-amber-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">CONDITION</span>
            <h4 className="text-sm font-semibold text-white">{data.label || 'If Keyword Matches'}</h4>
          </div>
        </div>
        {isExecuted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
        <span className="text-slate-400">{data.config?.operator || 'contains'}:</span>{' '}
        <span className="font-mono text-amber-300">"{data.config?.value || 'price'}"</span>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 text-[11px] font-medium border-t border-slate-800/80">
        <span className="text-emerald-400 flex items-center gap-1">TRUE</span>
        <span className="text-rose-400 flex items-center gap-1">FALSE</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />
    </div>
  );
});
ConditionNode.displayName = 'ConditionNode';

export const AINode = memo(({ id, data, selected }: CustomNodeProps) => {
  const isExecuting = data.status === 'EXECUTING';
  const isExecuted = data.status === 'EXECUTED';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-slate-900/90 p-4 border transition-all shadow-xl backdrop-blur-md ${
        selected
          ? 'border-cyan-500 ring-2 ring-cyan-500/30'
          : isExecuting
          ? 'border-cyan-400 ring-4 ring-cyan-400/30 animate-pulse'
          : isExecuted
          ? 'border-emerald-500/80 shadow-emerald-500/10'
          : 'border-cyan-500/30 hover:border-cyan-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">AI DECISION</span>
            <h4 className="text-sm font-semibold text-white">{data.label || 'AI Intent Classifier'}</h4>
          </div>
        </div>
        {isExecuted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
        <span className="text-slate-400">Prompt:</span>{' '}
        <span className="italic text-cyan-200">{data.config?.prompt || 'Classify customer intent...'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />
    </div>
  );
});
AINode.displayName = 'AINode';

export const ActionNode = memo(({ id, data, selected }: CustomNodeProps) => {
  const isExecuting = data.status === 'EXECUTING';
  const isExecuted = data.status === 'EXECUTED';
  const actionType = data.config?.actionType || 'PUBLIC_REPLY';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-slate-900/90 p-4 border transition-all shadow-xl backdrop-blur-md ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : isExecuting
          ? 'border-amber-400 ring-4 ring-amber-400/30 animate-pulse'
          : isExecuted
          ? 'border-emerald-500/80 shadow-emerald-500/10'
          : 'border-indigo-500/30 hover:border-indigo-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">ACTION</span>
            <h4 className="text-sm font-semibold text-white">{data.label || 'Public Reply'}</h4>
          </div>
        </div>
        {isExecuted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
        <span className="text-slate-400">Type:</span> <span className="font-semibold text-indigo-300">{actionType}</span>
        {data.config?.replyText && (
          <p className="mt-1 text-slate-400 truncate italic">"{data.config.replyText}"</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />
    </div>
  );
});
ActionNode.displayName = 'ActionNode';

export const DelayNode = memo(({ id, data, selected }: CustomNodeProps) => {
  return (
    <div
      className={`relative min-w-[200px] rounded-xl bg-slate-900/90 p-4 border transition-all shadow-xl backdrop-blur-md ${
        selected ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-orange-500/30 hover:border-orange-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-orange-400 uppercase">DELAY</span>
          <h4 className="text-sm font-semibold text-white">{data.label || 'Wait Duration'}</h4>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-orange-300">
        Pause for <span className="font-bold">{data.config?.delayMs ? `${data.config.delayMs / 1000}s` : '5s'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-slate-900"
      />
    </div>
  );
});
DelayNode.displayName = 'DelayNode';

export const GoalNode = memo(({ id, data, selected }: CustomNodeProps) => {
  return (
    <div
      className={`relative min-w-[240px] rounded-xl bg-slate-900/90 p-4 border transition-all shadow-xl backdrop-blur-md ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-emerald-500/30 hover:border-emerald-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">GOAL CONVERSION</span>
          <h4 className="text-sm font-semibold text-white">{data.label || 'Lead Conversion Goal'}</h4>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-emerald-300">
        Target: <span className="font-semibold text-emerald-200">{data.config?.goalName || 'Qualified Lead'}</span>
      </div>
    </div>
  );
});
GoalNode.displayName = 'GoalNode';

export const EndNode = memo(({ id, data, selected }: CustomNodeProps) => {
  return (
    <div
      className={`relative min-w-[180px] rounded-xl bg-slate-900/90 p-3 border transition-all shadow-xl backdrop-blur-md ${
        selected ? 'border-slate-400 ring-2 ring-slate-400/30' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900"
      />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
          <PlayCircle className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">TERMINATE</span>
          <h4 className="text-xs font-semibold text-slate-200">{data.label || 'End Workflow'}</h4>
        </div>
      </div>
    </div>
  );
});
EndNode.displayName = 'EndNode';
