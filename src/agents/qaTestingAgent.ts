import { BaseAgent, AgentResult, WebAgentState } from './baseAgent.js';
import { runJestTests } from '../tools/jestTools.js';
import { runPlaywrightE2E } from '../tools/playwrightTools.js';
import { Logger } from '../utils/logger.js';

export class QATestingAgent extends BaseAgent {
  public readonly name = 'QA & Testing Agent';
  public readonly description = 'Orchestrates unit, integration, and Playwright E2E test suites for target web application';

  public async execute(state: WebAgentState): Promise<AgentResult> {
    Logger.info(this.name, 'Starting QA & Testing execution...');

    Logger.info(this.name, 'Step 1: Running Jest unit & component tests...');
    const jestRes = await runJestTests();

    Logger.info(this.name, 'Step 2: Running Playwright E2E tests...');
    const pwRes = await runPlaywrightE2E();

    const overallSuccess = jestRes.passed && pwRes.passed;

    return {
      agentName: this.name,
      success: overallSuccess,
      summary: overallSuccess
        ? 'All unit, component, and E2E tests passed successfully.'
        : `QA Testing Failed: Jest Passed=${jestRes.passed}, Playwright Passed=${pwRes.passed}`,
      details: {
        jestOutput: jestRes.output.slice(-1000),
        playwrightOutput: pwRes.output.slice(-1000)
      },
      stateUpdate: {
        qaPassed: overallSuccess
      },
      timestamp: new Date().toISOString()
    };
  }
}
