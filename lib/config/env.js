// Centralizes environment variables and runtime validation for the service.
import {
  DEFAULT_AI_ANSWER_SYSTEM_PROMPT,
  DEFAULT_AI_INTENT_SYSTEM_PROMPT,
} from "../assistant/promptDefaults.js";

const NODE_ENV = process.env.NODE_ENV || "development";

const rawPriceoBaseUrl = process.env.PRICEO_BASE_URL;
if (!rawPriceoBaseUrl) {
  throw new Error("PRICEO_BASE_URL is required.");
}

export const PRICEO_BASE_URL = rawPriceoBaseUrl.replace(/\/+$/, "");
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const USE_AI_INTENT_PARSER =
  String(process.env.USE_AI_INTENT_PARSER ?? "true").toLowerCase() === "true";
export const AI_INTENT_SYSTEM_PROMPT =
  process.env.AI_INTENT_SYSTEM_PROMPT || DEFAULT_AI_INTENT_SYSTEM_PROMPT;
export const AI_ANSWER_SYSTEM_PROMPT =
  process.env.AI_ANSWER_SYSTEM_PROMPT || DEFAULT_AI_ANSWER_SYSTEM_PROMPT;
export const ALLOW_DEBUG =
  String(process.env.ALLOW_DEBUG || "false").toLowerCase() === "true";
export const APP_ENV = NODE_ENV;

export function isProduction() {
  return NODE_ENV === "production";
}

export function requireOpenAIKeyIfNeeded({ debugOnly = false } = {}) {
  if (OPENAI_API_KEY) {
    return OPENAI_API_KEY;
  }

  if (isProduction() && !ALLOW_DEBUG && !debugOnly) {
    throw new Error("OPENAI_API_KEY is required in production.");
  }

  return "";
}
