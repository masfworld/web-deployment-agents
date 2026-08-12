import { QATestingAgent } from './agents/qaTestingAgent.js';
import { ProdDeployAgent } from './agents/prodDeployAgent.js';
import { PostDeployVerifierAgent } from './agents/postDeployVerifierAgent.js';
import { ADKSupervisorOrchestrator } from './orchestrator.js';
import { WebAgentState } from './agents/baseAgent.js';
import { Logger } from './utils/logger.js';

async function main() {
  const args = process.argv.slice(2);
  const agentArg = args.find(a => a.startsWith('--agent='))?.split('=')[1] || 'orchestrate';

  Logger.info('CLI', `Web Deployment ADK Multi-Agent System starting (Target Agent: ${agentArg})...`);

  const initialState: WebAgentState = {
    qaPassed: false,
    preflightOk: false,
    deploymentTriggered: false,
    prodHealthy: false,
    timestamp: new Date().toISOString()
  };

  try {
    switch (agentArg) {
      case 'qa': {
        const qaAgent = new QATestingAgent();
        const res = await qaAgent.execute(initialState);
        console.log('\n--- AGENT RESULT ---');
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case 'deploy': {
        const deployAgent = new ProdDeployAgent();
        const res = await deployAgent.execute(initialState);
        console.log('\n--- AGENT RESULT ---');
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case 'verify': {
        const verifierAgent = new PostDeployVerifierAgent();
        const res = await verifierAgent.execute(initialState);
        console.log('\n--- AGENT RESULT ---');
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case 'orchestrate':
      default: {
        const orchestrator = new ADKSupervisorOrchestrator();
        const report = await orchestrator.runFullPipeline();
        console.log('\n=== ORCHESTRATION REPORT ===');
        console.log(JSON.stringify(report, null, 2));
        if (report.geminiSynthesis) {
          console.log('\n=== AI EXECUTIVE SYNTHESIS ===');
          console.log(report.geminiSynthesis);
        }
        break;
      }
    }
  } catch (error) {
    Logger.error('CLI', 'Fatal execution error', error);
    process.exit(1);
  }
}

main();
