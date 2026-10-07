'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  TriggerNode,
  ConditionNode,
  AINode,
  ActionNode,
  DelayNode,
  GoalNode,
  EndNode,
} from './nodes/CustomNodes';

import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { TopNav } from './TopNav';
import { SimulatorDrawer } from './SimulatorDrawer';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ValidationPanel } from './ValidationPanel';

import { validateWorkflowGraph, estimateExecutionPath } from '../utils/validation';
import { WorkflowStatus, WorkflowVersion, ValidationError } from '../types/workflow';

const nodeTypes = {
  TRIGGER: TriggerNode,
  CONDITION: ConditionNode,
  AI_DECISION: AINode,
  ACTION: ActionNode,
  DELAY: DelayNode,
  BRANCH: ConditionNode,
  SET_VARIABLE: ActionNode,
  HTTP_REQUEST: ActionNode,
  WAIT_FOR_EVENT: DelayNode,
  GOAL: GoalNode,
  END: EndNode,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'node_trigger',
    type: 'TRIGGER',
    position: { x: 250, y: 50 },
    data: {
      label: 'Instagram Comment Trigger',
      nodeType: 'TRIGGER',
      config: { triggerType: 'COMMENT_CREATED' },
    },
  },
  {
    id: 'node_condition',
    type: 'CONDITION',
    position: { x: 250, y: 220 },
    data: {
      label: 'Price Keyword Check',
      nodeType: 'CONDITION',
      config: { field: 'comment.text', operator: 'contains', value: 'how much' },
    },
  },
  {
    id: 'node_reply',
    type: 'ACTION',
    position: { x: 100, y: 400 },
    data: {
      label: 'Public Reply',
      nodeType: 'ACTION',
      config: { actionType: 'PUBLIC_REPLY', replyText: 'Hey @{{customer.username}}, check your DMs!' },
    },
  },
  {
    id: 'node_dm',
    type: 'ACTION',
    position: { x: 100, y: 560 },
    data: {
      label: 'Send Private DM',
      nodeType: 'ACTION',
      config: { actionType: 'SEND_MESSAGE', messageText: 'Here is the product details link!' },
    },
  },
  {
    id: 'node_goal',
    type: 'GOAL',
    position: { x: 100, y: 720 },
    data: {
      label: 'Price Lead Conversion',
      nodeType: 'GOAL',
      config: { goalName: 'Lead Captured' },
    },
  },
  {
    id: 'node_end',
    type: 'END',
    position: { x: 400, y: 400 },
    data: {
      label: 'End Workflow',
      nodeType: 'END',
      config: {},
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', source: 'node_trigger', target: 'node_condition' },
  { id: 'e2', source: 'node_condition', target: 'node_reply', sourceHandle: 'true', label: 'Match' },
  { id: 'e3', source: 'node_condition', target: 'node_end', sourceHandle: 'false', label: 'No Match' },
  { id: 'e4', source: 'node_reply', target: 'node_dm' },
  { id: 'e5', source: 'node_dm', target: 'node_goal' },
];

function WorkflowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [workflowName, setWorkflowName] = useState('Price Lead Automation');
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState<WorkflowStatus>('DRAFT');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Undo / Redo History Stack
  const [historyPast, setHistoryPast] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyFuture, setHistoryFuture] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);

  // Modals & Drawers
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Versions Store
  const [versions, setVersions] = useState<WorkflowVersion[]>([
    {
      version: 1,
      status: 'DRAFT',
      nodesCount: INITIAL_NODES.length,
      createdAt: 'Today, 00:15',
      graphData: { nodes: INITIAL_NODES, edges: INITIAL_EDGES },
    },
  ]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Push state to undo stack
  const saveStateToHistory = useCallback(() => {
    setHistoryPast((prev) => [...prev, { nodes, edges }]);
    setHistoryFuture([]);
    setIsDirty(true);
  }, [nodes, edges]);

  // Handle Edge Connection
  const onConnect = useCallback(
    (params: Connection) => {
      saveStateToHistory();
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } }, eds));
    },
    [setEdges, saveStateToHistory]
  );

  // Drag over handler for HTML5 drag-and-drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Drop handler
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      const item = JSON.parse(rawData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node_${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: item.type,
        position,
        data: {
          label: item.label,
          nodeType: item.type,
          config: item.defaultConfig || {},
        },
      };

      saveStateToHistory();
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNodeId);
    },
    [screenToFlowPosition, setNodes, saveStateToHistory]
  );

  // Add node from Left Panel click
  const handleAddNode = useCallback(
    (item: any) => {
      saveStateToHistory();
      const newNodeId = `node_${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: item.type,
        position: { x: 300 + Math.random() * 50, y: 200 + Math.random() * 50 },
        data: {
          label: item.label,
          nodeType: item.type,
          config: item.defaultConfig || {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNodeId);
    },
    [setNodes, saveStateToHistory]
  );

  // Node Selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Update Node Configuration from Right Panel
  const handleUpdateConfig = useCallback(
    (nodeId: string, label: string, config: Record<string, any>) => {
      saveStateToHistory();
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label, config } } : n))
      );
    },
    [setNodes, saveStateToHistory]
  );

  // Delete Node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      saveStateToHistory();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges, saveStateToHistory]
  );

  // Undo / Redo logic
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [{ nodes, edges }, ...prev]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setIsDirty(true);
  }, [historyPast, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setIsDirty(true);
  }, [historyFuture, nodes, edges, setNodes, setEdges]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Debounced Autosave
  useEffect(() => {
    if (!isDirty) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isDirty, nodes, edges]);

  // Duplicate Workflow
  const handleDuplicate = useCallback(() => {
    setWorkflowName((prev) => `${prev} (Copy)`);
    setVersion(1);
    setStatus('DRAFT');
    setIsDirty(true);
  }, []);

  // Save Workflow
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
    }, 400);
  }, []);

  // Publish Workflow (Enforces Immutability rules)
  const handlePublish = useCallback(() => {
    const nextVer = status === 'ACTIVE' ? version + 1 : version;
    setVersion(nextVer);
    setStatus('ACTIVE');

    setVersions((prev) => [
      ...prev.map((v) => ({ ...v, status: 'PAUSED' as WorkflowStatus })),
      {
        version: nextVer,
        status: 'ACTIVE',
        nodesCount: nodes.length,
        createdAt: new Date().toLocaleTimeString(),
        graphData: { nodes, edges },
      },
    ]);

    setIsDirty(false);
  }, [status, version, nodes, edges]);

  // Restore Version
  const handleRestoreVersion = useCallback(
    (versionNum: number) => {
      const target = versions.find((v) => v.version === versionNum);
      if (target) {
        saveStateToHistory();
        setNodes(target.graphData.nodes);
        setEdges(target.graphData.edges);
        setVersion(target.version);
        setStatus(target.status);
      }
    },
    [versions, setNodes, setEdges, saveStateToHistory]
  );

  // Highlight execution steps from simulator
  const handleHighlightSteps = useCallback(
    (executedNodeIds: string[]) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            status: executedNodeIds.includes(n.id) ? 'EXECUTED' : 'IDLE',
          },
        }))
      );

      // Clear highlights after 4 seconds
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: { ...n.data, status: 'IDLE' },
          }))
        );
      }, 4000);
    },
    [setNodes]
  );

  // Diagnostics & Validation
  const validationErrors = useMemo(() => validateWorkflowGraph(nodes, edges), [nodes, edges]);
  const estimatedPath = useMemo(() => estimateExecutionPath(nodes, edges), [nodes, edges]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Toolbar */}
      <TopNav
        workflowName={workflowName}
        onUpdateName={setWorkflowName}
        version={version}
        status={status}
        isDirty={isDirty}
        isSaving={isSaving}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        hasErrors={validationErrors.some((e) => e.severity === 'ERROR')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDuplicate={handleDuplicate}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {/* Main Canvas + Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Palette Sidebar */}
        <LeftPanel onAddNode={handleAddNode} />

        {/* Center React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full w-full relative bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
            }}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 !shadow-xl" />
            <MiniMap
              className="!bg-slate-900/90 !border-slate-800 !rounded-xl overflow-hidden"
              nodeColor={(n) => {
                if (n.type === 'TRIGGER') return '#8b5cf6';
                if (n.type === 'CONDITION') return '#f59e0b';
                if (n.type === 'ACTION') return '#6366f1';
                if (n.type === 'GOAL') return '#10b981';
                return '#475569';
              }}
            />
          </ReactFlow>
        </div>

        {/* Right Inspector Sidebar */}
        <RightPanel
          selectedNode={selectedNode}
          onUpdateConfig={handleUpdateConfig}
          onDeleteNode={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>

      {/* Bottom Diagnostics Bar */}
      <ValidationPanel
        errors={validationErrors}
        estimatedPath={estimatedPath}
        onSelectNode={(id) => setSelectedNodeId(id)}
      />

      {/* Simulator Drawer */}
      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        nodes={nodes}
        edges={edges}
        onHighlightSteps={handleHighlightSteps}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={versions}
        currentVersion={version}
        onRestoreVersion={handleRestoreVersion}
      />
    </div>
  );
}

export function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
