import { runCommand, ExecResult } from '../utils/exec.js';
import { CONFIG } from '../config/env.js';

export async function runJestTests(): Promise<{ passed: boolean; output: string }> {
  const result: ExecResult = await runCommand('npm test', CONFIG.targetAppDir);
  return {
    passed: result.success,
    output: result.stdout + '\n' + result.stderr
  };
}

export async function runJestCoverage(): Promise<{ passed: boolean; output: string }> {
  const result: ExecResult = await runCommand('npm run test:coverage', CONFIG.targetAppDir);
  return {
    passed: result.success,
    output: result.stdout + '\n' + result.stderr
  };
}
