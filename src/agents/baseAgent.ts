export interface WebAgentState {
  qaPassed: boolean;
  preflightOk: boolean;
  deploymentTriggered: boolean;
  prodHealthy: boolean;
  lastAuditSummary?: string;
  githubSecretsOk?: boolean;
  dnsConfigured?: boolean;
  resendConfigured?: boolean;
  timestamp: string;
}

export type KotrailAgentState = WebAgentState; // Backward compatibility alias

export interface AgentResult {
  agentName: string;
  success: boolean;
  summary: string;
  details?: unknown;
  stateUpdate?: Partial<WebAgentState>;
  timestamp: string;
}

export abstract class BaseAgent {
  public abstract readonly name: string;
  public abstract readonly description: string;

  public abstract execute(state: WebAgentState): Promise<AgentResult>;
}
