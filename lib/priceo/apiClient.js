// Wraps HTTP calls to the existing Priceo backend APIs.
import { PRICEO_BASE_URL } from "../config/env.js";

export async function priceoRequest({
  path,
  token,
  query,
  method = "GET",
  body,
  timeoutMs = 10000,
} = {}) {
  if (!path) {
    const error = new Error("Priceo request path is required.");
    error.status = 400;
    throw error;
  }

  const baseUrl = PRICEO_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers = {
    Accept: "application/json",
  };

  const normalizedMethod = String(method || "GET").toUpperCase();
  if (normalizedMethod !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  // Priceo currently expects raw JWT token in authorization header, not Bearer format.
  // Never log full tokens; if logging is needed, always mask sensitive token content.
  if (token) {
    headers.authorization = token;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: normalizedMethod,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Priceo request timed out.");
      timeoutError.status = 504;
      timeoutError.source = "priceo";
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const rawMessage = isJson ? payload?.message || payload?.error : payload;
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : rawMessage && typeof rawMessage === "object"
          ? rawMessage.message || JSON.stringify(rawMessage)
          : `Priceo API request failed with status ${response.status}.`;
    const looksLikeAuthError = /jwt|token|unauthoriz|not authorized/i.test(
      message
    );
    const normalizedStatus =
      looksLikeAuthError && response.status >= 500 ? 401 : response.status;

    const error = new Error(message);
    error.status = normalizedStatus;
    error.source = "priceo";
    error.payload = payload;
    throw error;
  }

  return payload;
}

