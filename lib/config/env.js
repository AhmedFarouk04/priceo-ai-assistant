// Centralizes environment variables and runtime validation for the service.
const NODE_ENV = process.env.NODE_ENV || "development";

const rawPriceoBaseUrl = process.env.PRICEO_BASE_URL;
if (!rawPriceoBaseUrl) {
  throw new Error("PRICEO_BASE_URL is required.");
}

export const PRICEO_BASE_URL = rawPriceoBaseUrl.replace(/\/+$/, "");
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
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
