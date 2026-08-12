import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config/env.js';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = CONFIG.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}
