import React from 'react';
import { Sliders, Trash2, X, AlertCircle } from 'lucide-react';
import { WorkflowNodeData } from '../types/workflow';

interface RightPanelProps {
  selectedNode: any | null;
  onUpdateConfig: (nodeId: string, label: string, config: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedNode,
  onUpdateConfig,
  onDeleteNode,
  onClose,
}) => {
  if (!selectedNode) {
    return (
      <aside className="w-80 bg-slate-950/95 border-l border-slate-800/80 p-4 flex flex-col justify-center items-center text-center text-slate-400 select-none backdrop-blur-xl">
        <Sliders className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
        <h4 className="text-xs font-medium text-slate-400">No Node Selected</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
          Click any node on the canvas to configure its trigger, condition, or action parameters.
        </p>
      </aside>
    );
  }

  const data: WorkflowNodeData = selectedNode.data;
  const nodeType = data.nodeType;
  const config = data.config || {};

  const handleLabelChange = (val: string) => {
    onUpdateConfig(selectedNode.id, val, { ...config });
  };

  const handleFieldChange = (key: string, val: any) => {
    onUpdateConfig(selectedNode.id, data.label, { ...config, [key]: val });
  };

  return (
    <aside className="w-80 bg-slate-950/95 border-l border-slate-800/80 flex flex-col h-full overflow-y-auto select-none backdrop-blur-xl">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-violet-400 uppercase">
            {nodeType} CONFIGURATION
          </span>
          <h3 className="text-sm font-semibold text-white truncate max-w-[200px]">{data.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
        {/* Node Name / Label */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Node Name / Label</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Trigger Config */}
        {nodeType === 'TRIGGER' && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Trigger Event Type</label>
            <select
              value={config.triggerType || 'COMMENT_CREATED'}
              onChange={(e) => handleFieldChange('triggerType', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="COMMENT_CREATED">Instagram Comment Created</option>
              <option value="MESSAGE_RECEIVED">Instagram Direct Message Received</option>
              <option value="MENTION_CREATED">Account Mention Created</option>
              <option value="STORY_REPLY">Instagram Story Reply</option>
            </select>
          </div>
        )}

        {/* Condition Config */}
        {nodeType === 'CONDITION' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Evaluated Context Field</label>
              <input
                type="text"
                value={config.field || 'comment.text'}
                onChange={(e) => handleFieldChange('field', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Comparison Operator</label>
              <select
                value={config.operator || 'contains'}
                onChange={(e) => handleFieldChange('operator', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="contains">contains (Text contains value)</option>
                <option value="equals">equals (Exact match)</option>
                <option value="startsWith">startsWith (Prefix match)</option>
                <option value="regex">regex (Regular Expression)</option>
                <option value="intent">intent (AI Intent Classifier)</option>
                <option value="sentiment">sentiment (Sentiment Analysis)</option>
                <option value="customer_tag">customer_tag (Tag exists)</option>
                <option value="lead_score">lead_score (Min Score threshold)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Match Value / Keyword</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => handleFieldChange('value', e.target.value)}
                placeholder="e.g. how much / price"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </>
        )}

        {/* Action Config */}
        {nodeType === 'ACTION' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Action Type</label>
              <select
                value={config.actionType || 'PUBLIC_REPLY'}
                onChange={(e) => handleFieldChange('actionType', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="PUBLIC_REPLY">Public Comment Reply</option>
                <option value="SEND_MESSAGE">Send Private Direct Message</option>
                <option value="ADD_TAG">Add Customer Tag</option>
                <option value="CREATE_LEAD">Create Qualified Lead</option>
                <option value="UPDATE_LEAD">Update Lead Status</option>
                <option value="NOTIFY_TEAM">Notify Sales Team</option>
                <option value="CREATE_TASK">Create Follow-up Task</option>
              </select>
            </div>

            {(config.actionType === 'PUBLIC_REPLY' || !config.actionType) && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Public Reply Template</label>
                <textarea
                  rows={3}
                  value={config.replyText || ''}
                  onChange={(e) => handleFieldChange('replyText', e.target.value)}
                  placeholder="Hey @{{customer.username}}, check your DMs!"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            )}

            {config.actionType === 'SEND_MESSAGE' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Private DM Message Template</label>
                <textarea
                  rows={3}
                  value={config.messageText || ''}
                  onChange={(e) => handleFieldChange('messageText', e.target.value)}
                  placeholder="Here is the link for pricing details!"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            )}

            {config.actionType === 'ADD_TAG' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Tag Name</label>
                <input
                  type="text"
                  value={config.tagName || ''}
                  onChange={(e) => handleFieldChange('tagName', e.target.value)}
                  placeholder="e.g. price_prospect"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </>
        )}

        {/* AI Decision Config */}
        {nodeType === 'AI_DECISION' && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">AI Classification Prompt</label>
            <textarea
              rows={3}
              value={config.prompt || ''}
              onChange={(e) => handleFieldChange('prompt', e.target.value)}
              placeholder="Classify user message into price inquiry or location inquiry..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
            />
          </div>
        )}

        {/* Delay Config */}
        {nodeType === 'DELAY' && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Delay Duration (Milliseconds)</label>
            <input
              type="number"
              value={config.delayMs || 5000}
              onChange={(e) => handleFieldChange('delayMs', Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>
        )}

        {/* Set Variable Config */}
        {nodeType === 'SET_VARIABLE' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Variable Name</label>
              <input
                type="text"
                value={config.variableName || ''}
                onChange={(e) => handleFieldChange('variableName', e.target.value)}
                placeholder="asked_price"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Variable Value</label>
              <input
                type="text"
                value={config.variableValue || ''}
                onChange={(e) => handleFieldChange('variableValue', e.target.value)}
                placeholder="true"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </>
        )}

        {/* Goal Config */}
        {nodeType === 'GOAL' && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Goal Target Name</label>
            <input
              type="text"
              value={config.goalName || ''}
              onChange={(e) => handleFieldChange('goalName', e.target.value)}
              placeholder="e.g. Lead Captured"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950">
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors text-xs font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>
      </div>
    </aside>
  );
};
