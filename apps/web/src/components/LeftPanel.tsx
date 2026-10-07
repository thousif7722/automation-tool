import React from 'react';
import {
  Zap,
  GitFork,
  Bot,
  Send,
  Clock,
  Sliders,
  Trophy,
  Globe,
  Tag,
  MessageSquare,
  Sparkles,
  UserPlus,
  PlayCircle,
  HelpCircle,
  Bell,
  CheckSquare,
} from 'lucide-react';
import { WorkflowNodeType } from '../types/workflow';

interface PaletteItem {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'Triggers' | 'Conditions' | 'Actions' | 'AI' | 'Utilities';
  defaultConfig: Record<string, any>;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Triggers
  {
    type: 'TRIGGER',
    label: 'Instagram Comment',
    description: 'Triggers when a customer posts a comment on a media post.',
    icon: <Zap className="w-4 h-4 text-violet-400" />,
    category: 'Triggers',
    defaultConfig: { triggerType: 'COMMENT_CREATED' },
  },
  {
    type: 'TRIGGER',
    label: 'Direct Message',
    description: 'Triggers when a customer sends a private DM to your account.',
    icon: <MessageSquare className="w-4 h-4 text-violet-400" />,
    category: 'Triggers',
    defaultConfig: { triggerType: 'MESSAGE_RECEIVED' },
  },
  {
    type: 'TRIGGER',
    label: 'Story Reply',
    description: 'Triggers when a user replies to your Instagram Story.',
    icon: <Zap className="w-4 h-4 text-violet-400" />,
    category: 'Triggers',
    defaultConfig: { triggerType: 'STORY_REPLY' },
  },

  // Conditions
  {
    type: 'CONDITION',
    label: 'Keyword Match',
    description: 'Evaluates if text contains specific keywords like "price".',
    icon: <GitFork className="w-4 h-4 text-amber-400" />,
    category: 'Conditions',
    defaultConfig: { field: 'comment.text', operator: 'contains', value: 'how much' },
  },
  {
    type: 'CONDITION',
    label: 'Lead Score Guard',
    description: 'Checks if customer lead score is above threshold.',
    icon: <GitFork className="w-4 h-4 text-amber-400" />,
    category: 'Conditions',
    defaultConfig: { field: 'customer.score', operator: 'lead_score', minScore: 10 },
  },

  // Actions
  {
    type: 'ACTION',
    label: 'Public Reply',
    description: 'Posts a public comment reply under customer comment.',
    icon: <Send className="w-4 h-4 text-indigo-400" />,
    category: 'Actions',
    defaultConfig: { actionType: 'PUBLIC_REPLY', replyText: 'Hey @{{customer.username}}, sent you a DM!' },
  },
  {
    type: 'ACTION',
    label: 'Send Private DM',
    description: 'Sends an automated private Instagram Direct Message.',
    icon: <Send className="w-4 h-4 text-indigo-400" />,
    category: 'Actions',
    defaultConfig: { actionType: 'SEND_MESSAGE', messageText: 'Here is the product details link!' },
  },
  {
    type: 'ACTION',
    label: 'Capture Lead',
    description: 'Creates a qualified lead record in database.',
    icon: <UserPlus className="w-4 h-4 text-indigo-400" />,
    category: 'Actions',
    defaultConfig: { actionType: 'CREATE_LEAD' },
  },
  {
    type: 'ACTION',
    label: 'Add Customer Tag',
    description: 'Appends a segmentation tag to customer profile.',
    icon: <Tag className="w-4 h-4 text-indigo-400" />,
    category: 'Actions',
    defaultConfig: { actionType: 'ADD_TAG', tagName: 'price_prospect' },
  },
  {
    type: 'ACTION',
    label: 'Notify Sales Team',
    description: 'Sends internal team alert regarding new prospect.',
    icon: <Bell className="w-4 h-4 text-indigo-400" />,
    category: 'Actions',
    defaultConfig: { actionType: 'NOTIFY_TEAM', notificationMessage: 'New lead from Instagram!' },
  },
  {
    type: 'ACTION',
    label: 'Create Follow-up Task',
    description: 'Assigns a follow-up task to team member.',
    icon: <CheckSquare className="w-4 h-4 text-indigo-400" />,
    category: 'Actions',
    defaultConfig: { actionType: 'CREATE_TASK', taskTitle: 'Follow up with price inquiry' },
  },

  // AI
  {
    type: 'AI_DECISION',
    label: 'AI Intent Classifier',
    description: 'Uses AI to classify customer intent (price, location, support).',
    icon: <Bot className="w-4 h-4 text-cyan-400" />,
    category: 'AI',
    defaultConfig: { prompt: 'Classify user message intent into price, location, or general' },
  },

  // Utilities
  {
    type: 'DELAY',
    label: 'Wait Delay',
    description: 'Pauses workflow execution for specified time duration.',
    icon: <Clock className="w-4 h-4 text-orange-400" />,
    category: 'Utilities',
    defaultConfig: { delayMs: 5000 },
  },
  {
    type: 'SET_VARIABLE',
    label: 'Set Variable',
    description: 'Updates workflow execution context variable.',
    icon: <Sliders className="w-4 h-4 text-emerald-400" />,
    category: 'Utilities',
    defaultConfig: { variableName: 'price_inquired', variableValue: 'true' },
  },
  {
    type: 'HTTP_REQUEST',
    label: 'HTTP Webhook Call',
    description: 'Triggers outbound HTTP request to external CRM or endpoint.',
    icon: <Globe className="w-4 h-4 text-sky-400" />,
    category: 'Utilities',
    defaultConfig: { httpUrl: 'https://api.crm.com/leads', httpMethod: 'POST' },
  },
  {
    type: 'GOAL',
    label: 'Goal Conversion',
    description: 'Marks workflow conversion goal achieved.',
    icon: <Trophy className="w-4 h-4 text-emerald-400" />,
    category: 'Utilities',
    defaultConfig: { goalName: 'Price Lead Conversion' },
  },
  {
    type: 'END',
    label: 'End Node',
    description: 'Terminates workflow execution cleanly.',
    icon: <PlayCircle className="w-4 h-4 text-slate-400" />,
    category: 'Utilities',
    defaultConfig: {},
  },
];

interface LeftPanelProps {
  onAddNode: (item: PaletteItem) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ onAddNode }) => {
  const categories: Array<'Triggers' | 'Conditions' | 'Actions' | 'AI' | 'Utilities'> = [
    'Triggers',
    'Conditions',
    'Actions',
    'AI',
    'Utilities',
  ];

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-full overflow-y-auto select-none backdrop-blur-xl">
      <div className="p-4 border-b border-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Node Palette</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Drag onto canvas or click to add</p>
      </div>

      <div className="flex-1 p-3 space-y-5 overflow-y-auto">
        {categories.map((cat) => {
          const items = PALETTE_ITEMS.filter((i) => i.category === cat);
          return (
            <div key={cat} className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase px-1">
                {cat}
              </span>
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div
                    key={`${cat}_${idx}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onClick={() => onAddNode(item)}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 cursor-grab active:cursor-grabbing transition-all group flex items-start gap-2.5"
                  >
                    <div className="mt-0.5 p-1.5 rounded-md bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                        {item.label}
                      </h5>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
