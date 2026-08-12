import { CONFIG } from '../config/env.js';

export interface ResendAuditReport {
  apiKeyPresent: boolean;
  domain: string;
  verified: boolean;
  message: string;
}

export async function auditResendConfig(apiKey: string = CONFIG.resendApiKey, domain: string = CONFIG.prodDomain): Promise<ResendAuditReport> {
  if (!apiKey) {
    return {
      apiKeyPresent: false,
      domain,
      verified: false,
      message: 'RESEND_API_KEY is not configured in env'
    };
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      return {
        apiKeyPresent: true,
        domain,
        verified: false,
        message: `Resend API Error: HTTP ${response.status}`
      };
    }

    const data: any = await response.json();
    const domainRecord = data.data?.find((d: any) => d.name === domain);

    return {
      apiKeyPresent: true,
      domain,
      verified: domainRecord ? domainRecord.status === 'verified' : false,
      message: domainRecord ? `Domain status: ${domainRecord.status}` : `Domain ${domain} not found in Resend`
    };
  } catch (error: any) {
    return {
      apiKeyPresent: true,
      domain,
      verified: false,
      message: `Failed to probe Resend API: ${error.message}`
    };
  }
}
