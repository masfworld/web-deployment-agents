import { BaseAgent, AgentResult, WebAgentState } from './baseAgent.js';
import { auditGitHubSecrets, triggerGitHubDeployWorkflow } from '../tools/githubTools.js';
import { auditVercelConfig, getVercelEnvironmentVars } from '../tools/vercelTools.js';
import { auditSupabaseSecrets, checkSupabaseMigrations } from '../tools/supabaseTools.js';
import { auditHostingerDns } from '../tools/hostingerDnsTools.js';
import { auditResendConfig } from '../tools/resendTools.js';
import { Logger } from '../utils/logger.js';

export class ProdDeployAgent extends BaseAgent {
  public readonly name = 'Production Deployment Agent';
  public readonly description = 'Audits pre-flight environment & triggers CD pipeline';

  public async execute(state: WebAgentState): Promise<AgentResult> {
    Logger.info(this.name, 'Starting Production Pre-Flight Audit & Deployment...');

    if (!state.qaPassed) {
      Logger.warn(this.name, 'QA tests have not passed in current state. Proceeding with pre-flight audit only...');
    }

    // 1. GitHub Secrets Audit
    const ghAudit = await auditGitHubSecrets();
    
    // 2. Vercel Audit
    const vercelConfig = await auditVercelConfig();
    const vercelEnvs = await getVercelEnvironmentVars();

    // 3. Supabase Audit
    const supaSecrets = await auditSupabaseSecrets();
    const supaMigrations = await checkSupabaseMigrations();

    // 4. DNS Audit
    const dnsReport = await auditHostingerDns();

    // 5. Resend Audit
    const resendReport = await auditResendConfig();

    const preflightOk = ghAudit.allPresent && dnsReport.isConfigured;

    // 6. Trigger GitHub Actions CD Pipeline
    Logger.info(this.name, 'Triggering GitHub Actions CD Workflow (deploy-production.yml)...');
    const deployTrigger = await triggerGitHubDeployWorkflow('deploy-production.yml');

    return {
      agentName: this.name,
      success: deployTrigger.success,
      summary: deployTrigger.success
        ? 'Pre-flight audit completed and GitHub Actions CD workflow successfully triggered.'
        : `Deployment Trigger Failed: ${deployTrigger.output}`,
      details: {
        githubSecretsAudit: ghAudit,
        dnsReport,
        resendReport,
        vercelAuditOutput: vercelConfig.output,
        supabaseSecretsOutput: supaSecrets.output,
        deployTriggerOutput: deployTrigger.output
      },
      stateUpdate: {
        preflightOk,
        githubSecretsOk: ghAudit.allPresent,
        dnsConfigured: dnsReport.isConfigured,
        resendConfigured: resendReport.verified,
        deploymentTriggered: deployTrigger.success,
        lastAuditSummary: `Preflight OK=${preflightOk}, Deploy Triggered=${deployTrigger.success}`
      },
      timestamp: new Date().toISOString()
    };
  }
}
