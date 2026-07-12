import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

// Lazy singleton, mirroring lib/supabase/server.ts's "construct once, reuse"
// shape — the API key check happens here rather than at import time so a
// missing env var only breaks the photo-scan feature, not the whole app.
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
