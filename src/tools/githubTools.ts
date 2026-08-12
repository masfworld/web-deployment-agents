import { runCommand } from '../utils/exec.js';
import { CONFIG } from '../config/env.js';

export interface SecretAuditResult {
  secretName: string;
  exists: boolean;
}

export const REQUIRED_GH_SECRETS = [
  'PROD_EXPO_PUBLIC_SUPABASE_URL',
  'PROD_EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'PROD_EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'PROD_EXPO_PUBLIC_APP_URL',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'PROD_SUPABASE_ACCESS_TOKEN',
  'PROD_SUPABASE_DB_PASSWORD',
  'PROD_SUPABASE_PROJECT_REF'
];

export async function auditGitHubSecrets(): Promise<{ allPresent: boolean; results: SecretAuditResult[]; rawOutput: string }> {
  const result = await runCommand('gh secret list', CONFIG.targetAppDir);
  if (!result.success) {
    return {
      allPresent: false,
      results: REQUIRED_GH_SECRETS.map(s => ({ secretName: s, exists: false })),
      rawOutput: result.stderr || result.stdout
    };
  }

  const existingSecrets = result.stdout.split('\n').map(line => line.split('\t')[0].trim());
  const auditResults: SecretAuditResult[] = REQUIRED_GH_SECRETS.map(secret => ({
    secretName: secret,
    exists: existingSecrets.includes(secret)
  }));

  const allPresent = auditResults.every(r => r.exists);

  return {
    allPresent,
    results: auditResults,
    rawOutput: result.stdout
  };
}

export async function triggerGitHubDeployWorkflow(workflowName: string = 'deploy-production.yml'): Promise<{ success: boolean; output: string }> {
  const result = await runCommand(`gh workflow run ${workflowName}`, CONFIG.targetAppDir);
  return {
    success: result.success,
    output: result.stdout + '\n' + result.stderr
  };
}

export async function getLatestWorkflowRuns(): Promise<{ success: boolean; output: string }> {
  const result = await runCommand('gh run list --limit 5', CONFIG.targetAppDir);
  return {
    success: result.success,
    output: result.stdout
  };
}
