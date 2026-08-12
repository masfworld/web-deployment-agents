export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  AGENT = 'AGENT'
}

export class Logger {
  static info(agent: string, message: string, data?: unknown) {
    console.log(`[${new Date().toISOString()}] [INFO] [${agent}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  static success(agent: string, message: string, data?: unknown) {
    console.log(`[${new Date().toISOString()}] [✅ SUCCESS] [${agent}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  static warn(agent: string, message: string, data?: unknown) {
    console.warn(`[${new Date().toISOString()}] [⚠️ WARN] [${agent}] ${message}`);
    if (data) console.warn(JSON.stringify(data, null, 2));
  }

  static error(agent: string, message: string, error?: unknown) {
    console.error(`[${new Date().toISOString()}] [❌ ERROR] [${agent}] ${message}`);
    if (error) console.error(error);
  }
}
