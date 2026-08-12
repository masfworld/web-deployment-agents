import { BaseAgent, AgentResult, WebAgentState } from './baseAgent.js';
import { probeHttpEndpoint } from '../tools/healthTools.js';
import { runPlaywrightSmoke } from '../tools/playwrightTools.js';
import { Logger } from '../utils/logger.js';
import { CONFIG } from '../config/env.js';

export class PostDeployVerifierAgent extends BaseAgent {
  public readonly name = 'Post-Deployment Verification Agent';
  public readonly description = 'Runs live health probes and Playwright smoke tests against production target web application';

  public async execute(state: WebAgentState): Promise<AgentResult> {
    Logger.info(this.name, `Starting Post-Deployment Verification against ${CONFIG.prodAppUrl}...`);

    const healthResult = await probeHttpEndpoint(CONFIG.prodAppUrl);
    const smokeResult = await runPlaywrightSmoke(CONFIG.prodAppUrl);

    const overallSuccess = healthResult.healthy && smokeResult.passed;

    return {
      agentName: this.name,
      success: overallSuccess,
      summary: overallSuccess
        ? `Post-deployment verification PASSED for ${CONFIG.prodAppUrl}`
        : `Post-deployment verification FAILED: Health OK=${healthResult.healthy}, Smoke Test Passed=${smokeResult.passed}`,
      details: {
        healthProbe: healthResult,
        smokeTestOutput: smokeResult.output.slice(-1000)
      },
      stateUpdate: {
        prodHealthy: overallSuccess
      },
      timestamp: new Date().toISOString()
    };
  }
}
