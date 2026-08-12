import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  targetAppDir: process.env.TARGET_APP_DIR || process.env.KOTRAIL_APP_DIR || './',
  prodAppUrl: process.env.PROD_APP_URL || 'https://example.com',
  prodDomain: process.env.PROD_DOMAIN || process.env.HOSTINGER_DOMAIN || 'example.com',
  resendApiKey: process.env.RESEND_API_KEY || '',
  supabaseUrl: process.env.PROD_SUPABASE_URL || '',
  supabaseAnonKey: process.env.PROD_SUPABASE_ANON_KEY || ''
};
