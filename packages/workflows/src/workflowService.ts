import mongoose from 'mongoose';
import { WorkflowDefinitionModel, IWorkflowDefinitionDocument } from '@insta-automation/database';
import type { WorkflowGraph, WorkflowStatus, WorkflowNode, WorkflowEdge, WorkflowTrigger } from '@insta-automation/types';

export interface CreateWorkflowParams {
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  workflowKey?: string;
}

export interface UpdateWorkflowParams {
  name?: string;
  description?: string;
  trigger?: WorkflowTrigger;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  variables?: Record<string, any>;
}

export class WorkflowService {
  private inMemoryStore: Map<string, WorkflowGraph[]> = new Map();

  public async createWorkflow(
    workspaceId: string,
    params: CreateWorkflowParams
  ): Promise<WorkflowGraph> {
    const workflowKey = params.workflowKey || `wf_key_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const graph: WorkflowGraph = {
      workflowKey,
      name: params.name,
      description: params.description,
      version: 1,
      status: 'DRAFT',
      trigger: params.trigger,
      nodes: params.nodes,
      edges: params.edges,
      variables: params.variables || {},
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await WorkflowDefinitionModel.create({
          workspaceId,
          workflowKey,
          name: params.name,
          description: params.description,
          version: 1,
          status: 'DRAFT',
          isLatest: true,
          trigger: params.trigger,
          nodes: params.nodes,
          edges: params.edges,
          variables: params.variables || {},
        });
      } catch {}
    }

    const storeKey = `${workspaceId}:${workflowKey}`;
    if (!this.inMemoryStore.has(storeKey)) {
      this.inMemoryStore.set(storeKey, []);
    }
    this.inMemoryStore.get(storeKey)!.push({ ...graph });

    return graph;
  }

  public async updateWorkflow(
    workspaceId: string,
    workflowKey: string,
    params: UpdateWorkflowParams
  ): Promise<WorkflowGraph> {
    const latest = await this.getLatestWorkflow(workspaceId, workflowKey);
    if (!latest) {
      throw new Error(`Workflow '${workflowKey}' not found in workspace '${workspaceId}'`);
    }

    // IMMUTABILITY RULE: Published workflows (ACTIVE or PAUSED) cannot be modified in-place!
    // Modifying an active workflow automatically spawns a new DRAFT version.
    if (latest.status === 'ACTIVE' || latest.status === 'PAUSED') {
      const newVersion = latest.version + 1;
      const newGraph: WorkflowGraph = {
        workflowKey,
        name: params.name ?? latest.name,
        description: params.description ?? latest.description,
        version: newVersion,
        status: 'DRAFT',
        trigger: params.trigger ?? latest.trigger,
        nodes: params.nodes ?? latest.nodes,
        edges: params.edges ?? latest.edges,
        variables: params.variables ? { ...latest.variables, ...params.variables } : latest.variables,
      };

      if (mongoose.connection.readyState === 1) {
        try {
          await WorkflowDefinitionModel.updateMany({ workspaceId, workflowKey }, { $set: { isLatest: false } });

          await WorkflowDefinitionModel.create({
            workspaceId,
            workflowKey,
            name: newGraph.name,
            description: newGraph.description,
            version: newVersion,
            status: 'DRAFT',
            isLatest: true,
            trigger: newGraph.trigger,
            nodes: newGraph.nodes,
            edges: newGraph.edges,
            variables: newGraph.variables,
          });
        } catch {}
      }

      const storeKey = `${workspaceId}:${workflowKey}`;
      const list = this.inMemoryStore.get(storeKey) || [];
      list.push({ ...newGraph });
      this.inMemoryStore.set(storeKey, list);

      return newGraph;
    }

    // If already DRAFT, update in-place
    latest.name = params.name ?? latest.name;
    latest.description = params.description ?? latest.description;
    latest.trigger = params.trigger ?? latest.trigger;
    latest.nodes = params.nodes ?? latest.nodes;
    latest.edges = params.edges ?? latest.edges;
    if (params.variables) {
      latest.variables = { ...latest.variables, ...params.variables };
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await WorkflowDefinitionModel.updateOne(
          { workspaceId, workflowKey, version: latest.version },
          {
            $set: {
              name: latest.name,
              description: latest.description,
              trigger: latest.trigger,
              nodes: latest.nodes,
              edges: latest.edges,
              variables: latest.variables,
            },
          }
        );
      } catch {}
    }

    return latest;
  }

  public async publishWorkflow(
    workspaceId: string,
    workflowKey: string,
    version?: number
  ): Promise<WorkflowGraph> {
    const list = await this.listWorkflowVersions(workspaceId, workflowKey);
    if (list.length === 0) {
      throw new Error(`Workflow '${workflowKey}' not found`);
    }

    const target = version
      ? list.find((w) => w.version === version)
      : list.find((w) => w.status === 'DRAFT') || list[list.length - 1];

    if (!target) {
      throw new Error(`Target version '${version}' not found for workflow '${workflowKey}'`);
    }

    // Mark previous ACTIVE versions as PAUSED
    for (const w of list) {
      if (w.status === 'ACTIVE') {
        w.status = 'PAUSED';
      }
    }

    target.status = 'ACTIVE';

    if (mongoose.connection.readyState === 1) {
      try {
        await WorkflowDefinitionModel.updateMany(
          { workspaceId, workflowKey, status: 'ACTIVE' },
          { $set: { status: 'PAUSED', isLatest: false } }
        );

        await WorkflowDefinitionModel.updateOne(
          { workspaceId, workflowKey, version: target.version },
          { $set: { status: 'ACTIVE', isLatest: true, publishedAt: new Date() } }
        );
      } catch {}
    }

    return target;
  }

  public async pauseWorkflow(
    workspaceId: string,
    workflowKey: string,
    version?: number
  ): Promise<WorkflowGraph> {
    const list = await this.listWorkflowVersions(workspaceId, workflowKey);
    const target = version ? list.find((w) => w.version === version) : list.find((w) => w.status === 'ACTIVE');

    if (!target) {
      throw new Error(`Active workflow version not found for key '${workflowKey}'`);
    }

    target.status = 'PAUSED';

    if (mongoose.connection.readyState === 1) {
      try {
        await WorkflowDefinitionModel.updateOne(
          { workspaceId, workflowKey, version: target.version },
          { $set: { status: 'PAUSED' } }
        );
      } catch {}
    }

    return target;
  }

  public async rollbackWorkflow(
    workspaceId: string,
    workflowKey: string,
    targetVersion: number
  ): Promise<WorkflowGraph> {
    const list = await this.listWorkflowVersions(workspaceId, workflowKey);
    const target = list.find((w) => w.version === targetVersion);
    if (!target) {
      throw new Error(`Cannot rollback: version '${targetVersion}' does not exist for workflow '${workflowKey}'`);
    }

    const highestVersion = Math.max(...list.map((w) => w.version));
    const newVersion = highestVersion + 1;

    // Pause currently ACTIVE version
    for (const w of list) {
      if (w.status === 'ACTIVE') {
        w.status = 'PAUSED';
      }
    }

    const rolledBackGraph: WorkflowGraph = {
      workflowKey,
      name: `${target.name} (Rollback v${targetVersion})`,
      description: target.description,
      version: newVersion,
      status: 'ACTIVE',
      trigger: target.trigger,
      nodes: target.nodes,
      edges: target.edges,
      variables: target.variables,
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await WorkflowDefinitionModel.updateMany(
          { workspaceId, workflowKey, status: 'ACTIVE' },
          { $set: { status: 'PAUSED', isLatest: false } }
        );

        await WorkflowDefinitionModel.create({
          workspaceId,
          workflowKey,
          name: rolledBackGraph.name,
          description: rolledBackGraph.description,
          version: newVersion,
          status: 'ACTIVE',
          isLatest: true,
          publishedAt: new Date(),
          trigger: rolledBackGraph.trigger,
          nodes: rolledBackGraph.nodes,
          edges: rolledBackGraph.edges,
          variables: rolledBackGraph.variables,
        });
      } catch {}
    }

    const storeKey = `${workspaceId}:${workflowKey}`;
    const memList = this.inMemoryStore.get(storeKey) || [];
    memList.push({ ...rolledBackGraph });
    this.inMemoryStore.set(storeKey, memList);

    return rolledBackGraph;
  }

  public async getLatestWorkflow(workspaceId: string, workflowKey: string): Promise<WorkflowGraph | null> {
    const list = await this.listWorkflowVersions(workspaceId, workflowKey);
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  public async listWorkflowVersions(workspaceId: string, workflowKey: string): Promise<WorkflowGraph[]> {
    const storeKey = `${workspaceId}:${workflowKey}`;
    const cached = this.inMemoryStore.get(storeKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await WorkflowDefinitionModel.find({ workspaceId, workflowKey })
          .sort({ version: 1 })
          .lean();

        if (docs.length > 0) {
          const graphs: WorkflowGraph[] = docs.map((d) => ({
            workflowKey: d.workflowKey,
            name: d.name,
            description: d.description,
            version: d.version,
            status: d.status as WorkflowStatus,
            trigger: d.trigger as any,
            nodes: d.nodes as any,
            edges: d.edges as any,
            variables: d.variables as any,
          }));
          this.inMemoryStore.set(storeKey, graphs);
          return graphs;
        }
      } catch {}
    }

    return [];
  }
}

export const workflowService = new WorkflowService();
