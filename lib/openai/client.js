// Creates and exports a singleton OpenAI client instance.
import OpenAI from "openai";
import {
  ALLOW_DEBUG,
  OPENAI_API_KEY,
  isProduction,
  requireOpenAIKeyIfNeeded,
} from "../config/env.js";

let client;

export function getOpenAIClient() {
  if (!OPENAI_API_KEY) {
    requireOpenAIKeyIfNeeded();

    if (isProduction() && !ALLOW_DEBUG) {
      return null;
    }

    return null;
  }

  if (!client) {
    client = new OpenAI({ apiKey: OPENAI_API_KEY });
  }

  return client;
}

