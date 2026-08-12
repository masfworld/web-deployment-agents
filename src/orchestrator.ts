import fs from 'fs';
import path from 'path';
import { QATestingAgent } from './agents/qaTestingAgent.js';
import { ProdDeployAgent } from './agents/prodDeployAgent.js';
import { PostDeployVerifierAgent } from './agents/postDeployVerifierAgent.js';
import { AgentResult, WebAgentState } from './agents/baseAgent.js';
import { getGeminiClient } from './utils/gemini.js';
import { CONFIG } from './config/env.js';
import { Logger } from './utils/logger.js';

export interface OrchestrationReport {
  timestamp: string;
  overallSuccess: boolean;
  finalState: WebAgentState;
  results: AgentResult[];
  geminiSynthesis?: string;
}

const MARKDOWN_MEMORY_FILE = path.join(process.cwd(), 'ADK_MEMORY.md');

export class ADKSupervisorOrchestrator {
  private qaAgent = new QATestingAgent();
  private deployAgent = new ProdDeployAgent();
  private verifierAgent = new PostDeployVerifierAgent();

  public async runFullPipeline(): Promise<OrchestrationReport> {
    Logger.info('ADK Supervisor', 'Initializing full Web Deployment Multi-Agent Pipeline...');

    let state: WebAgentState = {
      qaPassed: false,
      preflightOk: false,
      deploymentTriggered: false,
      prodHealthy: false,
      timestamp: new Date().toISOString()
    };

    const results: AgentResult[] = [];

    // Phase 1: QA Testing Suite
    Logger.info('ADK Supervisor', 'PHASE 1: Executing QA & Testing Suite Agent...');
    const qaResult = await this.qaAgent.execute(state);
    results.push(qaResult);
    if (qaResult.stateUpdate) state = { ...state, ...qaResult.stateUpdate };

    if (!qaResult.success) {
      Logger.error('ADK Supervisor', 'Phase 1 Failed. Aborting Deployment Pipeline!');
      return this.finishRun(results, state, false);
    }

    // Phase 2: Pre-Flight Audit & Production Deployment
    Logger.info('ADK Supervisor', 'PHASE 2: Executing Pre-flight Audit & Production Deployment Agent...');
    const deployResult = await this.deployAgent.execute(state);
    results.push(deployResult);
    if (deployResult.stateUpdate) state = { ...state, ...deployResult.stateUpdate };

    if (!deployResult.success) {
      Logger.error('ADK Supervisor', 'Phase 2 Failed. Aborting Post-Deployment Verification!');
      return this.finishRun(results, state, false);
    }

    // Phase 3: Post-Deployment Verification
    Logger.info('ADK Supervisor', 'PHASE 3: Executing Post-Deployment Verification Agent...');
    const verifierResult = await this.verifierAgent.execute(state);
    results.push(verifierResult);
    if (verifierResult.stateUpdate) state = { ...state, ...verifierResult.stateUpdate };

    const overallSuccess = results.every(r => r.success);
    return this.finishRun(results, state, overallSuccess);
  }

  private async finishRun(results: AgentResult[], state: WebAgentState, overallSuccess: boolean): Promise<OrchestrationReport> {
    let geminiSynthesis: string | undefined = undefined;

    try {
      const ai = getGeminiClient();
      const prompt = `You are the Web Deployment ADK Supervisor Agent. Synthesize these agent results and final state into a clear markdown executive summary:\nState: ${JSON.stringify(state, null, 2)}\nResults: ${JSON.stringify(results, null, 2)}`;
      
      const response = await ai.models.generateContent({
        model: CONFIG.geminiModel,
        contents: prompt
      });

      geminiSynthesis = response.text;
    } catch (err: any) {
      Logger.warn('ADK Supervisor', `Could not generate AI synthesis report: ${err.message}`);
    }

    const report: OrchestrationReport = {
      timestamp: new Date().toISOString(),
      overallSuccess,
      finalState: state,
      results,
      geminiSynthesis
    };

    // Save report as clean Markdown Memory
    this.appendMarkdownMemory(report);

    return report;
  }

  private appendMarkdownMemory(report: OrchestrationReport) {
    try {
      const exists = fs.existsSync(MARKDOWN_MEMORY_FILE);
      let mdContent = '';

      if (!exists) {
        mdContent += `# 🧠 Web Deployment Agents Memory Log\n\n`;
        mdContent += `Persistent execution history and state memory for the multi-agent deployment system.\n\n---\n\n`;
      }

      const statusBadge = report.overallSuccess ? '✅ PASSED' : '❌ FAILED';
      mdContent += `## 🚀 Execution Run: \`${report.timestamp}\` (${statusBadge})\n\n`;
      mdContent += `### 📌 State Summary\n`;
      mdContent += `- **QA Suite Passed**: ${report.finalState.qaPassed ? '✅ Yes' : '❌ No'}\n`;
      mdContent += `- **Pre-flight Audit OK**: ${report.finalState.preflightOk ? '✅ Yes' : '❌ No'}\n`;
      mdContent += `- **Deployment Triggered**: ${report.finalState.deploymentTriggered ? '✅ Yes' : '❌ No'}\n`;
      mdContent += `- **Production Healthy**: ${report.finalState.prodHealthy ? '✅ Yes' : '❌ No'}\n\n`;

      mdContent += `### 📊 Agent Results\n`;
      mdContent += `| Agent | Status | Summary |\n`;
      mdContent += `|-------|--------|---------|\n`;
      for (const res of report.results) {
        const icon = res.success ? '✅ PASSED' : '❌ FAILED';
        mdContent += `| **${res.agentName}** | ${icon} | ${res.summary.replace(/\n/g, ' ')} |\n`;
      }
      mdContent += `\n`;

      if (report.geminiSynthesis) {
        mdContent += `### 🤖 AI Executive Synthesis\n`;
        mdContent += `> ${report.geminiSynthesis.replace(/\n/g, '\n> ')}\n\n`;
      }

      mdContent += `---\n\n`;

      fs.appendFileSync(MARKDOWN_MEMORY_FILE, mdContent, 'utf-8');
      Logger.success('ADK Supervisor', `Appended execution memory to ADK_MEMORY.md`);
    } catch (e: any) {
      Logger.error('ADK Supervisor', `Failed to write to ADK_MEMORY.md: ${e.message}`);
    }
  }
}
