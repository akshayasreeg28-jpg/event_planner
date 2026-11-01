import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// The API key is accessed strictly via process.env.GEMINI_API_KEY on the server.
const rawKey = process.env.GEMINI_API_KEY || '';
const apiKey = rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey.trim().length > 5 ? rawKey.trim() : '';

// Valid Flash model configurable via GEMINI_MODEL env var, defaulting to gemini-3.8-flash
export const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

console.log(`[Gemini Client] Initialized with model: ${MODEL_NAME} | Key Configured: ${!!apiKey}`);

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Re-export Type enum for structured schema definitions
export { Type };

// Typed errors for robust diagnostics
export class GeminiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.status = status;
  }
}

export class GeminiConfigError extends GeminiError {
  constructor(message = 'Gemini API key is not configured') {
    super(message, 'API_KEY_MISSING', 503);
    this.name = 'GeminiConfigError';
  }
}

export class GeminiTimeoutError extends GeminiError {
  constructor(message = 'Gemini API request timed out') {
    super(message, 'TIMEOUT', 504);
    this.name = 'GeminiTimeoutError';
  }
}

export class GeminiApiError extends GeminiError {
  constructor(message: string, status?: number) {
    super(message, 'API_ERROR', status || 500);
    this.name = 'GeminiApiError';
  }
}

export class GeminiValidationError extends GeminiError {
  constructor(message: string) {
    super(message, 'VALIDATION_FAILED', 422);
    this.name = 'GeminiValidationError';
  }
}

export interface CallGeminiOptions {
  contents: string | any;
  systemInstruction?: string;
  config?: Record<string, any>;
  timeoutMs?: number;
  retries?: number;
  silent?: boolean;
}

/**
 * Shared helper to call Gemini with timeout, exponential backoff retries,
 * and typed error handling.
 */
export async function callGemini(options: CallGeminiOptions): Promise<string> {
  if (!ai) {
    throw new GeminiConfigError();
  }

  const { contents, systemInstruction, config = {}, timeoutMs = 25000, retries = 2, silent = false } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    try {
      const callPromise = (async () => {
        // Do NOT pass deprecated sampling params (temperature, topP, topK) for gemini-3.8-flash
        const sanitizedConfig = { ...config };
        delete sanitizedConfig.temperature;
        delete sanitizedConfig.topP;
        delete sanitizedConfig.topK;

        if (systemInstruction) {
          sanitizedConfig.systemInstruction = systemInstruction;
        }

        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: sanitizedConfig,
        });

        const text = response.text;
        if (!text) {
          throw new GeminiApiError('Gemini returned an empty response');
        }
        return text;
      })();

      // Enforce timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new GeminiTimeoutError(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        // Ensure timer doesn't hold event loop open
        if (typeof timer.unref === 'function') timer.unref();
      });

      return await Promise.race([callPromise, timeoutPromise]);
    } catch (err: any) {
      lastError = err;
      attempt++;

      if (err instanceof GeminiConfigError) {
        throw err;
      }

      if (!silent) {
        console.warn(`[Gemini Client] Attempt ${attempt}/${retries + 1} failed: ${err.message}`);
      }

      if (attempt <= retries) {
        // Exponential backoff: 600ms, then 1200ms
        const delay = Math.pow(2, attempt - 1) * 600;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError instanceof GeminiError ? lastError : new GeminiApiError(lastError?.message || 'Gemini call failed');
}

let cachedHealthResult: { ok: boolean; message: string; latencyMs?: number; timestamp: number } | null = null;

/**
 * Lightweight health-check probe with configuration verification and 60-second caching.
 */
export async function testGeminiHealth(forceLive = false): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  if (!apiKey || !ai) {
    return { ok: false, message: 'GEMINI_API_KEY environment variable is not configured or placeholder.' };
  }

  // If live roundtrip probe is not explicitly requested, confirm client readiness
  if (!forceLive) {
    return {
      ok: true,
      message: `Client initialized for ${MODEL_NAME} with active API key`,
      latencyMs: 1,
    };
  }

  const now = Date.now();
  if (cachedHealthResult && now - cachedHealthResult.timestamp < 60000) {
    return { ok: cachedHealthResult.ok, message: cachedHealthResult.message, latencyMs: cachedHealthResult.latencyMs };
  }

  const start = Date.now();
  try {
    const reply = await callGemini({
      contents: 'Respond with exactly: OK',
      config: {
        maxOutputTokens: 10,
      },
      timeoutMs: 15000,
      retries: 0,
      silent: true,
    });

    const latencyMs = Date.now() - start;
    const res = { ok: true, message: `Connected to ${MODEL_NAME}: "${reply.trim()}"`, latencyMs };
    cachedHealthResult = { ...res, timestamp: now };
    return res;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const res = { ok: false, message: `Live probe notice: ${err.message}`, latencyMs };
    cachedHealthResult = { ...res, timestamp: now };
    return res;
  }
}
