// Handles policy questions from the local knowledge base only.
import { knowledgeBase } from "../../data/knowledgeBase.js";

function isRefundReturnQuestion(message) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("refund") ||
    text.includes("return") ||
    text.includes("\u0627\u0644\u0627\u0631\u062c\u0627\u0639") ||
    text.includes("\u0627\u0644\u0631\u062f") ||
    text.includes("\u0627\u0644\u0631\u062c\u0648\u0639") ||
    text.includes("\u0627\u0631\u062c\u0639")
  );
}

function detectPolicyKey(message) {
  const text = String(message || "").toLowerCase();

  if (isRefundReturnQuestion(text)) {
    return "refundReturn";
  }
  if (
    text.includes("payment") ||
    text.includes("card") ||
    text.includes("\u062f\u0641\u0639") ||
    text.includes("\u0627\u0644\u062f\u0641\u0639")
  ) {
    return "paymentMethods";
  }
  if (
    text.includes("ship") ||
    text.includes("delivery") ||
    text.includes("\u0634\u062d\u0646") ||
    text.includes("\u062a\u0648\u0635\u064a\u0644")
  ) {
    return "shippingPolicy";
  }
  if (
    text.includes("coupon") ||
    text.includes("discount") ||
    text.includes("\u0643\u0648\u0628\u0648\u0646")
  ) {
    return "couponsFaq";
  }
  return "support";
}

export function getPolicyData({ message } = {}) {
  if (isRefundReturnQuestion(message)) {
    return {
      policyKey: "refundReturn",
      ar: "سياسة الإرجاع/الاسترداد غير متاحة بالكامل بعد. يرجى التواصل مع الدعم للتأكيد.",
      en: "The return/refund policy is not fully available yet. Please contact support for confirmation.",
    };
  }

  const key = detectPolicyKey(message);
  const policy = knowledgeBase[key];

  if (!policy) {
    return {
      policyKey: "unavailable",
      ar: "معلومات هذه السياسة غير متاحة حاليًا.",
      en: "This policy information is not available yet.",
    };
  }

  return {
    policyKey: key,
    ...policy,
  };
}

