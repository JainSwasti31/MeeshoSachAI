import { GoogleGenAI } from "@google/genai";

/**
 * Typed error class for Gemini service failures.
 * type: 'network' | 'parse' | 'timeout'
 */
export class GeminiError extends Error {
  constructor(type, message, cause) {
    super(message);
    this.name = "GeminiError";
    this.type = type; // 'network' | 'parse' | 'timeout'
    this.cause = cause;
  }
}

const MODEL = "gemini-2.5-flash";

/**
 * Send a prompt to Gemini and return the raw text response.
 * Explicitly uses GEMINI_API_KEY — never falls back to GOOGLE_API_KEY.
 * Strips markdown code fences if present. Times out after 60 seconds.
 */
export async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("network", "GEMINI_API_KEY is not set", null);
  }

  // Pass httpOptions to prevent the SDK from reading GOOGLE_API_KEY
  // from the system environment and overriding our explicit key.
  const ai = new GoogleGenAI({
    apiKey,
    // Suppress the "both keys set" warning by being explicit
    httpOptions: { apiVersion: "v1beta" },
  });

  const sdkCall = ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new GeminiError("timeout", "AI request timed out", null)),
      60000
    )
  );

  let result;
  try {
    result = await Promise.race([sdkCall, timeout]);
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    throw new GeminiError("network", err.message, err);
  }

  const text = result.text ?? "";
  return text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
}
