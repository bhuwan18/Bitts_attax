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

// Pass as the second argument to EVERY interactions.create() call.
//
// By default the SDK retries a 429 four times with exponential backoff before
// throwing. That default is right for a transient blip and badly wrong for the
// failure this app actually hits — an exhausted quota, which cannot come back
// within the life of a request. All it buys is a user sitting on "Reading your
// card…" for ~10 seconds before being told, unhelpfully, that something went
// wrong, while each doomed attempt spends another request against the allowance
// that's already gone. Measured against a real exhausted key: 9.9s with the
// default, 0.4s with this.
//
// The retry policy itself is left alone — 408/409/5xx are still retried, because
// those genuinely can succeed on a second try. Only 429 is removed from the
// retryable set. (Note this must be per-request: `interactions` is a separate
// client stack from `models` and does NOT read the GoogleGenAI constructor's
// httpOptions.retryOptions, so configuring it there silently does nothing —
// which it did, until this was measured.)
export const GEMINI_REQUEST_OPTIONS = {
  retry_codes: ["408", "409", "5XX"],
};

// "We are out of Gemini quota", as distinct from "Gemini failed" or "the model
// couldn't read the card". Worth telling apart because it's the only Gemini
// failure that is (a) certain to keep failing for the rest of the request, so
// there's no point pressing on, and (b) not the user's fault or their photo's
// fault, so the UI shouldn't imply it was.
//
// Matched structurally rather than on the SDK's error class, which isn't
// exported: a 429 status is the contract, the RateLimitError name and the
// message are belt-and-braces for older/newer SDK shapes.
export function isRateLimitError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const candidate = err as { status?: unknown; name?: unknown; message?: unknown };
  if (candidate.status === 429) return true;
  if (candidate.name === "RateLimitError") return true;
  return typeof candidate.message === "string" && candidate.message.includes("429");
}
