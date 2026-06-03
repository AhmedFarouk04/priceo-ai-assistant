// Parses the user message into a structured intent and params object.
import { AI_INTENT_SYSTEM_PROMPT } from "../config/env.js";
import { getOpenAIClient } from "./client.js";

const ALLOWED_INTENTS = new Set([
  "product_search",
  "product_details",
  "policy_question",
  "user_orders",
  "order_details",
  "cart",
  "wishlist",
  "user_notifications",
  "admin_orders_stats",
  "admin_sales_statistics",
  "admin_notifications",
  "admin_complaints",
  "admin_coupons",
  "coupon_details",
  "create_complaint",
  "apply_coupon",
  "send_notification",
  "unknown",
]);

const DEFAULT_PARAMS = {
  keyword: "",
  sort: "",
  limit: 10,
  priceGte: null,
  priceLte: null,
  ratingGte: null,
  id: null,
  coupon: null,
  subject: null,
  sendTo: null,
};

function stripCodeFences(text = "") {
  return String(text)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseJson(text) {
  const normalized = stripCodeFences(text);
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Intent parser returned invalid JSON.");
  }

  const jsonText = normalized.slice(start, end + 1);
  return JSON.parse(jsonText);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sanitizeIntent(intent) {
  return ALLOWED_INTENTS.has(intent) ? intent : null;
}

function sanitizeParams(params = {}) {
  const source = params && typeof params === "object" ? params : {};

  const keyword =
    typeof source.keyword === "string" ? source.keyword.trim() : "";
  const sort = typeof source.sort === "string" ? source.sort.trim() : "";
  const limitNumber = toNumberOrNull(source.limit);
  const limit =
    limitNumber === null ? DEFAULT_PARAMS.limit : Math.max(1, Math.floor(limitNumber));

  const normalizedSort =
    sort === "price" ||
    sort === "-price" ||
    sort === "ratingsAverage" ||
    sort === "-ratingsAverage"
      ? sort
      : "";

  return {
    keyword,
    sort: normalizedSort,
    limit,
    priceGte: toNumberOrNull(source.priceGte),
    priceLte: toNumberOrNull(source.priceLte),
    ratingGte: toNumberOrNull(source.ratingGte),
    id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : null,
    coupon:
      typeof source.coupon === "string" && source.coupon.trim()
        ? source.coupon.trim()
        : null,
    subject:
      typeof source.subject === "string" && source.subject.trim()
        ? source.subject.trim()
        : null,
    sendTo:
      typeof source.sendTo === "string" && source.sendTo.trim()
        ? source.sendTo.trim()
        : null,
  };
}

export async function parseIntentWithAI({ message, role }) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI client unavailable.");
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 150,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: AI_INTENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Role: ${role || "user"}\nUser message: ${String(message || "")}`,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || "";
  const parsed = parseJson(content);
  const intent = sanitizeIntent(parsed?.intent);

  if (!intent) {
    throw new Error("Invalid intent returned by parser.");
  }

  return {
    intent,
    params: sanitizeParams(parsed?.params),
  };
}
