import { CONFIG } from '../config/env.js';

export interface HealthProbeResult {
  url: string;
  healthy: boolean;
  statusCode?: number;
  responseTimeMs: number;
  error?: string;
}

export async function probeHttpEndpoint(url: string = CONFIG.prodAppUrl): Promise<HealthProbeResult> {
  const startTime = Date.now();
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Web-Deployment-Verifier' } });
    const responseTimeMs = Date.now() - startTime;
    return {
      url,
      healthy: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      responseTimeMs
    };
  } catch (error: any) {
    return {
      url,
      healthy: false,
      responseTimeMs: Date.now() - startTime,
      error: error.message
    };
  }
}
