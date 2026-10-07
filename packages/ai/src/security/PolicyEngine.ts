import { ToolDefinition, ToolExecutionContext, ToolRiskLevel } from '../types';

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  riskLevel: ToolRiskLevel;
}

export class PolicyEngine {
  public static evaluatePolicy(
    tool: ToolDefinition,
    input: any,
    context: ToolExecutionContext
  ): PolicyCheckResult {
    // 1. Authorization check: Permissions
    const missingPermissions = tool.requiredPermissions.filter(
      (perm) => !context.userPermissions.includes(perm) && !context.userPermissions.includes('*')
    );

    if (missingPermissions.length > 0) {
      return {
        allowed: false,
        reason: `User is missing required permissions: ${missingPermissions.join(', ')}`,
        riskLevel: tool.riskLevel,
      };
    }

    // 2. High & Critical Risk Policy Checks
    if (tool.riskLevel === 'CRITICAL') {
      return {
        allowed: false,
        reason: `Tool '${tool.name}' has CRITICAL risk level and is blocked by system security policy.`,
        riskLevel: tool.riskLevel,
      };
    }

    if (tool.riskLevel === 'HIGH' && !context.allowHighRisk) {
      return {
        allowed: false,
        reason: `Tool '${tool.name}' has HIGH risk level and requires explicit high-risk confirmation context.`,
        riskLevel: tool.riskLevel,
      };
    }

    return {
      allowed: true,
      riskLevel: tool.riskLevel,
    };
  }
}
