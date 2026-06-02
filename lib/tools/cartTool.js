// Handles cart-related assistant read and safe mutation operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getCart({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.CART,
    token,
  });
}

export function extractCouponCode(message = "") {
  const text = String(message || "").trim();
  if (!text) {
    return "";
  }

  const patterns = [
    /(?:طبق|استخدم|فعل|ضيف|اضف|apply|use|add)\s+(?:كوبون|coupon)\s+([A-Za-z0-9_-]+)/i,
    /(?:كوبون|coupon)\s*[:\-]?\s*([A-Za-z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

export function isValidCouponCode(coupon = "") {
  if (typeof coupon !== "string") {
    return false;
  }

  const value = coupon.trim();
  if (value.length < 3 || value.length > 50) {
    return false;
  }

  return /^[A-Za-z0-9_-]+$/.test(value);
}

export async function applyCoupon({ token, coupon } = {}) {
  if (!coupon) {
    const error = new Error("Coupon code is required.");
    error.status = 400;
    throw error;
  }

  return priceoRequest({
    path: priceoEndpoints.APPLY_COUPON,
    token,
    method: "PUT",
    body: { coupon },
  });
}

export function normalizeApplyCouponResult(payload) {
  const error = new Error("Invalid Priceo apply coupon response.");
  error.status = 502;
  error.source = "priceo";

  if (!payload || typeof payload !== "object") {
    throw error;
  }

  const candidates = [
    payload.data,
    payload.cart,
    payload.result,
    payload,
  ].filter((item) => item && typeof item === "object");

  const cart = candidates.find((item) => {
    const nested = item.cart && typeof item.cart === "object" ? item.cart : item;
    return (
      nested &&
      typeof nested === "object" &&
      ("numOfCartItems" in nested ||
        "totalCartPrice" in nested ||
        "totalPriceAfterDiscount" in nested ||
        "taxPrice" in nested ||
        "shippingPrice" in nested)
    );
  });

  if (!cart) {
    throw error;
  }

  const normalizedCart = cart.cart && typeof cart.cart === "object" ? cart.cart : cart;

  return {
    numOfCartItems: normalizedCart?.numOfCartItems ?? null,
    totalCartPrice: normalizedCart?.totalCartPrice ?? null,
    totalPriceAfterDiscount: normalizedCart?.totalPriceAfterDiscount ?? null,
  };
}

