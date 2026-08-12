import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(command: string, cwd: string): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execPromise(command, { cwd, maxBuffer: 10 * 1024 * 1024 });
    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : error.message,
      exitCode: error.code || 1
    };
  }
}
