import dns from 'dns/promises';
import { CONFIG } from '../config/env.js';

export interface DnsAuditReport {
  domain: string;
  aRecords: string[];
  txtRecords: string[][];
  mxRecords: Array<{ priority: number; exchange: string }>;
  cnameRecords: string[];
  isConfigured: boolean;
}

export async function auditHostingerDns(domain: string = CONFIG.prodDomain): Promise<DnsAuditReport> {
  const report: DnsAuditReport = {
    domain,
    aRecords: [],
    txtRecords: [],
    mxRecords: [],
    cnameRecords: [],
    isConfigured: false
  };

  try {
    report.aRecords = await dns.resolve4(domain).catch(() => []);
  } catch {}

  try {
    report.txtRecords = await dns.resolveTxt(domain).catch(() => []);
  } catch {}

  try {
    report.mxRecords = await dns.resolveMx(domain).catch(() => []);
  } catch {}

  try {
    report.cnameRecords = await dns.resolveCname(domain).catch(() => []);
  } catch {}

  report.isConfigured = report.aRecords.length > 0 || report.cnameRecords.length > 0;
  return report;
}
