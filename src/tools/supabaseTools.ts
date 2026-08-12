import { runCommand } from '../utils/exec.js';
import { CONFIG } from '../config/env.js';

export async function auditSupabaseSecrets(): Promise<{ success: boolean; output: string }> {
  const result = await runCommand('supabase secrets list', CONFIG.targetAppDir);
  return {
    success: result.success,
    output: result.stdout || result.stderr
  };
}

export async function checkSupabaseMigrations(): Promise<{ success: boolean; output: string }> {
  const result = await runCommand('supabase db list', CONFIG.targetAppDir);
  return {
    success: result.success,
    output: result.stdout || result.stderr
  };
}
