// Handles complaint-related assistant read and create operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getAdminComplaints({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.COMPLAINTS,
    token,
  });
}

export function extractComplaintSubject(message = "") {
  const text = String(message || "").trim();
  if (!text) {
    return "";
  }

  const cleaned = text
    .replace(
      /^\s*(?:عايز|عايزة|اريد|أريد|أرغب|عاوز)?\s*(?:ان)?\s*(?:اعمل|أعمل|سجل|أسجل|اقدم|أقدم|قدم|قدِّم)\s*شكوى\s*/i,
      ""
    )
    .replace(
      /^\s*(?:عايز|عايزة|اريد|أريد|عاوز)?\s*(?:اشتكِي|اشتكي|اشكو|أشتكي|أشتكي من|اشتكي من)\s*/i,
      ""
    )
    .replace(/^\s*(?:create|submit)\s+complaint\s*/i, "")
    .replace(/^\s*i\s+have\s+(?:a|an)\s+complaint\s*/i, "")
    .replace(/^\s*complaint\s*/i, "")
    .replace(/^\s*(?:عندي\s+مشكلة|عندي\s+مشكله)\s*/i, "")
    .replace(/^\s*(?:إن|ان|لأن|that|because|for)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

export async function createComplaint({ token, subject } = {}) {
  if (!subject) {
    const error = new Error("Complaint subject is required.");
    error.status = 400;
    throw error;
  }

  return priceoRequest({
    path: priceoEndpoints.COMPLAINTS,
    token,
    method: "POST",
    body: { subject },
  });
}

export function normalizeComplaintResult(payload) {
  const item = payload?.data || payload?.complaint || payload || {};

  return {
    id: item?._id || item?.id || null,
    subject: item?.subject || null,
    createdAt: item?.createdAt || null,
  };
}

