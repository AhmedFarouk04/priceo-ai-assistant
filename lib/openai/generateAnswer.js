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
    return "OpenAI API key is missing. Please set OPENAI_API_KEY in environment variables.";
  }

  const replyLanguage = detectDominantLanguage(userMessage);
  const context = [
    `Role: ${role || "user"}`,
    `Intent: ${intent}`,
    `Reply language: ${replyLanguage}.`,
    `You must answer in ${replyLanguage} only.`,
    "Do not translate product names or IDs.",
    "Use only normalizedData. Do not use raw payloads or invent details.",
    "Keep the answer concise and grounded in the provided data.",
    intent === "policy_question"
      ? [
          "Policy answer format:",
          "1) Start with one short direct answer sentence.",
          "2) Then add 2 to 4 short bullets maximum.",
          "3) Do not mention internal keys or source names.",
          "4) If return/refund policy is missing, say it is not fully available and advise contacting support.",
        ].join("\n")
      : "",
    `Available data: ${JSON.stringify(data)}`,
    `User message: ${userMessage}`,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: context },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
}

