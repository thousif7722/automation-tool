import { ToolRegistry } from '../tools/ToolRegistry';
import { ToolDefinition } from '../types';

export class MCPManager {
  constructor(private registry: ToolRegistry = new ToolRegistry()) {}

  public listTools(): Array<{ name: string; description: string; riskLevel: string; permissions: string[] }> {
    return this.registry.getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      riskLevel: t.riskLevel,
      permissions: t.requiredPermissions,
    }));
  }

  public getToolSchema(toolName: string): ToolDefinition | undefined {
    return this.registry.getTool(toolName);
  }
}
