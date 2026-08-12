import { runCommand, ExecResult } from '../utils/exec.js';
import { CONFIG } from '../config/env.js';

export async function runPlaywrightE2E(): Promise<{ passed: boolean; output: string }> {
  const result: ExecResult = await runCommand('npm run test:e2e', CONFIG.targetAppDir);
  return {
    passed: result.success,
    output: result.stdout + '\n' + result.stderr
  };
}

export async function runPlaywrightSmoke(targetUrl?: string): Promise<{ passed: boolean; output: string }> {
  const envPrefix = targetUrl ? `PLAYWRIGHT_TEST_BASE_URL=${targetUrl} ` : '';
  const result: ExecResult = await runCommand(`${envPrefix}npx playwright test e2e/smoke.spec.ts`, CONFIG.targetAppDir);
  return {
    passed: result.success,
    output: result.stdout + '\n' + result.stderr
  };
}
