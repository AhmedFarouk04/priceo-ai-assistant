// Generates an assistant answer using OpenAI gpt-4o-mini.
import { getOpenAIClient } from "./client.js";
import { systemPrompt } from "../assistant/systemPrompt.js";

function detectDominantLanguage(text) {
  const value = String(text || "");
  const arabicMatches = value.match(/[\u0600-\u06FF]/g) || [];
  const englishMatches = value.match(/[A-Za-z]/g) || [];

  if (arabicMatches.length > englishMatches.length) {
    return "Arabic";
  }
  if (englishMatches.length > arabicMatches.length) {
    return "English";
  }

  return arabicMatches.length > 0 ? "Arabic" : "English";
}

export async function generateAnswer({ userMessage, intent, data, role }) {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error("OpenAI client unavailable.");
  }

  const replyLanguage = detectDominantLanguage(userMessage);
  const context = [
    `Role: ${role || "user"}`,
    `Intent: ${intent}`,
    `Reply language: ${replyLanguage}`,
    `User message: ${userMessage}`,
    `Normalized data: ${JSON.stringify(data)}`,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 250,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: context },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
}
