import { runCommand } from '../utils/exec.js';
import { CONFIG } from '../config/env.js';

export async function auditVercelConfig(): Promise<{ success: boolean; output: string }> {
  const result = await runCommand('vercel inspect --prod || vercel ls', CONFIG.targetAppDir);
  return {
    success: result.success,
    output: result.stdout || result.stderr
  };
}

export async function getVercelEnvironmentVars(): Promise<{ success: boolean; output: string }> {
  const result = await runCommand('vercel env ls', CONFIG.targetAppDir);
  return {
    success: result.success,
    output: result.stdout || result.stderr
  };
}
