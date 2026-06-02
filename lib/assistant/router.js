// Routes intents to read-only Priceo tools.
import { getCart } from "../tools/cartTool.js";
import { extractComplaintSubject, getAdminComplaints } from "../tools/complaintTool.js";
import { getAdminCoupons, getCouponById } from "../tools/couponTool.js";
import { getOrderStats, getSalesStatistics } from "../tools/dashboardTool.js";
import { getPolicyData } from "../tools/knowledgeTool.js";
import {
  getAdminNotifications,
  getUserNotifications,
} from "../tools/notificationTool.js";
import { getOrderById, getUserOrders } from "../tools/orderTool.js";
import { getProductById, searchProducts } from "../tools/productTool.js";
import { getWishlist } from "../tools/wishlistTool.js";

function extractEntityId(message) {
  const text = String(message || "");
  const mongoId = text.match(/\b[a-f0-9]{24}\b/i);
  if (mongoId) {
    return mongoId[0];
  }

  const genericId = text.match(/\bid[:\s-]*([a-z0-9_-]{4,})\b/i);
  return genericId?.[1] || null;
}

function extractKeyword(message) {
  const text = String(message || "").trim();
  if (!text) {
    return "";
  }

  if (/\biphone\b/i.test(text) || /\u0627\u064A\u0641\u0648\u0646/.test(text)) {
    return "iphone";
  }

  const normalized = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const stopWords = new Set([
    "\u0627\u0639\u0631\u0636\u0644\u064A",
    "\u0645\u0646\u062A\u062C",
    "\u0645\u0646\u062A\u062C\u0627\u062A",
    "\u0641\u064A\u0647",
    "\u0641\u064A",
    "\u0647\u0644",
    "\u0639\u0627\u064A\u0632",
    "\u0645\u062D\u062A\u0627\u062C",
    "show",
    "me",
    "product",
    "products",
    "search",
    "for",
    "find",
  ]);

  const tokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !stopWords.has(token));

  if (!tokens.length) {
    return text;
  }

  return tokens.slice(0, 3).join(" ");
}

function hasProducts(payload) {
  if (!payload) {
    return false;
  }

  if (Array.isArray(payload) && payload.length > 0) {
    return true;
  }
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    return true;
  }
  if (Array.isArray(payload?.products) && payload.products.length > 0) {
    return true;
  }
  if (Array.isArray(payload?.data?.products) && payload.data.products.length > 0) {
    return true;
  }

  return false;
}

function withNoProductsNote(payload) {
  if (hasProducts(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      ...payload,
      note: "No products found.",
    };
  }

  return {
    data: payload ?? null,
    note: "No products found.",
  };
}

export async function routeIntent({ intent, message, role, token }) {
  const base = { message, role, hasToken: Boolean(token) };

  switch (intent) {
    case "product_search": {
      const products = await searchProducts({
        keyword: extractKeyword(message),
        limit: 10,
      });

      return {
        source: "priceo",
        data: withNoProductsNote(products),
      };
    }
    case "product_details": {
      const id = extractEntityId(message);
      if (!id) {
        return {
          source: "assistant",
          data: {
            ...base,
            note: "Product ID is required to fetch product details.",
          },
        };
      }

      return {
        source: "priceo",
        data: await getProductById({ id }),
      };
    }
    case "order_details": {
      const id = extractEntityId(message);
      if (!id) {
        return {
          source: "assistant",
          data: {
            ...base,
            note: "Order ID is required to fetch order details.",
          },
        };
      }

      return {
        source: "priceo",
        data: await getOrderById({ id, token }),
      };
    }
    case "user_orders":
      return {
        source: "priceo",
        data: await getUserOrders({ token }),
      };
    case "cart":
      return {
        source: "priceo",
        data: await getCart({ token }),
      };
    case "wishlist":
      return {
        source: "priceo",
        data: await getWishlist({ token }),
      };
    case "user_notifications":
      return {
        source: "priceo",
        data: await getUserNotifications({ token }),
      };
    case "admin_notifications":
      return {
        source: "priceo",
        data: await getAdminNotifications({ token }),
      };
    case "admin_complaints":
      return {
        source: "priceo",
        data: await getAdminComplaints({ token }),
      };
    case "admin_coupons":
      return {
        source: "priceo",
        data: await getAdminCoupons({ token }),
      };
    case "coupon_details": {
      const id = extractEntityId(message);
      if (!id) {
        return {
          source: "assistant",
          data: {
            ...base,
            note: "Coupon ID is required to fetch coupon details.",
          },
        };
      }
      return {
        source: "priceo",
        data: await getCouponById({ id, token }),
      };
    }
    case "admin_orders_stats":
      return {
        source: "priceo",
        data: await getOrderStats({ token }),
      };
    case "admin_sales_statistics":
      return {
        source: "priceo",
        data: await getSalesStatistics({ token }),
      };
    case "complaints":
      return {
        source: "assistant",
        data: {
          ...base,
          note: "User complaint creation is not implemented in read-only mode.",
        },
      };
    case "create_complaint":
      {
        const subject = extractComplaintSubject(message);
        return {
          source: "assistant",
          data: {
            ...base,
            subject,
            actionPreview: {
              type: "create_complaint",
              subject,
            },
          },
        };
      }
    case "policy_question":
      return {
        source: "knowledge",
        data: getPolicyData({ message }),
      };
    default:
      return {
        source: "assistant",
        data: {
          ...base,
          note: "No matching intent yet.",
        },
      };
  }
}

