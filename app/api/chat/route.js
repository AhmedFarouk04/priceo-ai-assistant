// Handles the main assistant chat API endpoint and assistant flow.
import {
  ALLOW_DEBUG,
  APP_ENV,
  USE_AI_INTENT_PARSER,
} from "../../../lib/config/env.js";
import { detectIntent } from "../../../lib/assistant/detectIntent.js";
import {
  validateCreateComplaintPendingAction,
  validateApplyCouponPendingAction,
  mapPriceoErrorMessage,
} from "../../../lib/assistant/actionGuards.js";
import {
  adminIntents,
  protectedUserIntents,
  mutationIntents,
  publicIntents,
} from "../../../lib/assistant/intentConfig.js";
import { normalizeDataForAnswer } from "../../../lib/assistant/normalizeData.js";
import { routeIntent } from "../../../lib/assistant/router.js";
import { parseIntentWithAI } from "../../../lib/openai/parseIntent.js";
import { generateAnswer } from "../../../lib/openai/generateAnswer.js";
import {
  createComplaint,
  extractComplaintSubject,
  normalizeComplaintResult,
} from "../../../lib/tools/complaintTool.js";
import {
  applyCoupon,
  extractCouponCode as extractCartCouponCode,
  isValidCouponCode,
  normalizeApplyCouponResult,
} from "../../../lib/tools/cartTool.js";

function buildComplaintPreview(subject, includeAnswer = true, parsedIntent = null) {
  const response = {
    ok: true,
    intent: "create_complaint",
    requiresConfirmation: true,
    actionPreview: {
      type: "create_complaint",
      subject,
    },
  };

  if (parsedIntent) {
    response.parsedIntent = parsedIntent;
  }

  if (includeAnswer) {
    response.answer = `هسجل الشكوى بالنص ده: ${subject}. أكدلي التنفيذ؟`;
  }

  return response;
}

function buildCouponPreview(coupon, includeAnswer = true, parsedIntent = null) {
  const response = {
    ok: true,
    intent: "apply_coupon",
    requiresConfirmation: true,
    actionPreview: {
      type: "apply_coupon",
      coupon,
    },
  };

  if (parsedIntent) {
    response.parsedIntent = parsedIntent;
  }

  if (includeAnswer) {
    response.answer = `هطبق كوبون ${coupon} على السلة. أكدلي التنفيذ؟`;
  }

  return response;
}

function extractNotificationSubject(message = "") {
  const text = String(message || "").trim();
  if (!text) {
    return "";
  }

  const cleaned = text
    .replace(
      /^\s*(?:ابعت|ارسل|أرسل|send|notify)\s+(?:إشعار|اشعار|نوتيفيكيشن|notification|announcement)\s*/i,
      ""
    )
    .replace(/^\s*(?:لكل المستخدمين|all users)\s*/i, "")
    .replace(/^\s*(?:إن|ان|that|about)\s+/i, "")
    .replace(/^\s*[\u0627\u0625]?\u0646\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function extractNotificationSendTo(message = "") {
  const text = String(message || "").toLowerCase();
  if (
    text.includes("\u0643\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646") ||
    text.includes("all users")
  ) {
    return "ALL";
  }

  return "";
}

function buildNotificationPreview(
  { subject, sendTo },
  includeAnswer = true,
  parsedIntent = null
) {
  const response = {
    ok: true,
    intent: "send_notification",
    requiresConfirmation: true,
    actionPreview: {
      type: "send_notification",
      subject,
      sendTo,
    },
  };

  if (parsedIntent) {
    response.parsedIntent = parsedIntent;
  }

  if (includeAnswer) {
    response.answer = `هتتبعت رسالة ${sendTo === "ALL" ? "لكل المستخدمين" : "للمستهدفين"} بالنص ده: ${subject}. التنفيذ الحقيقي غير مفعّل حاليًا.`;
  }

  return response;
}

function getComplaintSubjectFromAction(message, pendingAction) {
  const pendingSubject =
    typeof pendingAction?.subject === "string"
      ? pendingAction.subject.trim()
      : "";
  const messageSubject = extractComplaintSubject(message);

  return (pendingSubject || messageSubject).trim();
}

function getCouponFromAction(message, pendingAction) {
  const pendingCoupon =
    typeof pendingAction?.coupon === "string"
      ? pendingAction.coupon.trim()
      : "";
  const messageCoupon = extractCartCouponCode(message);

  return (pendingCoupon || messageCoupon).trim();
}

function isValidNotificationSubject(subject = "") {
  return typeof subject === "string" && subject.trim().length >= 5 && subject.trim().length <= 300;
}

function buildInvalidApplyCouponResponse() {
  return Response.json(
    {
      ok: false,
      error: "Failed to process chat request.",
      details: "Invalid Priceo apply coupon response.",
      source: "priceo",
    },
      { status: 502 }
    );
}

function isAllowedIntent(intent) {
  return [
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
  ].includes(intent);
}

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

function joinTitles(items, language) {
  const titles = (Array.isArray(items) ? items : [])
    .map((item) => item?.title)
    .filter(Boolean)
    .slice(0, 3);

  if (!titles.length) {
    return "";
  }

  return language === "Arabic" ? titles.join("، ") : titles.join(", ");
}

function buildFallbackAnswer({ intent, data, userMessage }) {
  const language = detectDominantLanguage(userMessage);
  const isArabic = language === "Arabic";

  const text = (() => {
    switch (intent) {
      case "product_search": {
        const products = Array.isArray(data?.products) ? data.products : [];
        if (!products.length) {
          return isArabic
            ? "لا توجد منتجات مطابقة حالياً."
            : "No matching products were found.";
        }
        const titles = joinTitles(products, language);
        return isArabic
          ? `وجدت ${products.length} منتجًا. أبرزها: ${titles}.`
          : `I found ${products.length} products. Top matches: ${titles}.`;
      }
      case "wishlist": {
        const products = Array.isArray(data?.products) ? data.products : [];
        if (!products.length) {
          return isArabic
            ? "المفضلة فارغة حالياً."
            : "Your wishlist is empty.";
        }
        const titles = joinTitles(products, language);
        return isArabic
          ? `في المفضلة ${products.length} منتج. أبرزها: ${titles}.`
          : `Your wishlist has ${products.length} products. Top items: ${titles}.`;
      }
      case "cart": {
        if (data?.hasCart === false) {
          return isArabic
            ? "لا توجد سلة لهذا المستخدم حاليًا."
            : "No cart is available for this user right now.";
        }
        const count = data?.numOfCartItems ?? 0;
        return isArabic
          ? `سلة المستخدم تحتوي على ${count} عنصرًا.`
          : `The cart contains ${count} items.`;
      }
      case "user_orders": {
        const active = data?.activeOrdersCount ?? 0;
        const completed = data?.completedOrdersCount ?? 0;
        return isArabic
          ? `عندك ${active} أوردرات نشطة و${completed} مكتملة.`
          : `You have ${active} active orders and ${completed} completed orders.`;
      }
      case "order_details":
        return isArabic
          ? "تفاصيل الأوردر جاهزة من البيانات المتاحة."
          : "Order details are available in the returned data.";
      case "admin_orders_stats":
        return isArabic
          ? `إجمالي الأوردرات ${data?.totalOrders ?? 0}، المكتملة ${data?.completedOrders ?? 0}، والنشطة ${data?.activeOrders ?? 0}.`
          : `Total orders: ${data?.totalOrders ?? 0}, completed: ${data?.completedOrders ?? 0}, active: ${data?.activeOrders ?? 0}.`;
      case "admin_sales_statistics": {
        const months = Array.isArray(data?.months) ? data.months : [];
        if (!months.length) {
          return isArabic
            ? "لا توجد إحصائيات مبيعات متاحة لهذا العام."
            : "No sales statistics are available for the current year.";
        }
        const firstMonth = months[0];
        return isArabic
          ? `متاح ${months.length} شهر من إحصائيات السنة الحالية. أول شهر ظاهر هو ${firstMonth?.monthName || "غير معروف"}.`
          : `There are ${months.length} months of statistics for the current year. The first visible month is ${firstMonth?.monthName || "unknown"}.`;
      }
      case "user_notifications": {
        const unread = data?.unreadCount ?? 0;
        const count = data?.count ?? 0;
        return isArabic
          ? `عندك ${unread} إشعار غير مقروء من إجمالي ${count}.`
          : `You have ${unread} unread notifications out of ${count} total.`;
      }
      case "admin_notifications": {
        const count = data?.count ?? 0;
        return isArabic
          ? `إشعارات الأدمن المتاحة: ${count}.`
          : `Admin notifications available: ${count}.`;
      }
      case "admin_complaints": {
        const count = data?.count ?? 0;
        return isArabic
          ? `إجمالي الشكاوى المتاحة: ${count}.`
          : `Total complaints available: ${count}.`;
      }
      case "admin_coupons": {
        const count = data?.count ?? 0;
        return isArabic
          ? `عدد الكوبونات المتاحة: ${count}.`
          : `There are ${count} available coupons.`;
      }
      case "coupon_details":
        return isArabic
          ? `تفاصيل الكوبون ${data?.name || data?.id || "غير متاح"}.`
          : `Coupon details for ${data?.name || data?.id || "unavailable"}.`;
      case "policy_question":
        return isArabic
          ? data?.ar || data?.en || "معلومات هذه السياسة غير متاحة حاليًا."
          : data?.en || data?.ar || "This policy information is not available yet.";
      case "create_complaint":
        return isArabic
          ? "تم تجهيز الشكوى للمراجعة."
          : "The complaint has been prepared for review.";
      case "apply_coupon":
        return isArabic
          ? "تم تجهيز تطبيق الكوبون للمراجعة."
          : "The coupon application is ready for review.";
      case "send_notification":
        return isArabic
          ? "تم تجهيز الإشعار للمراجعة."
          : "The notification is ready for review.";
      default:
        return isArabic
          ? "تم استلام البيانات بنجاح."
          : "The data was received successfully.";
    }
  })();

  return text;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      message,
      role = "user",
      token = "",
      debug = false,
      confirmAction = false,
      pendingAction = null,
    } = body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json(
        { ok: false, error: "Invalid message. 'message' is required." },
        { status: 400 }
      );
    }
    if (role !== "user" && role !== "admin") {
      return Response.json(
        { ok: false, error: "Invalid role. Role must be 'user' or 'admin'." },
        { status: 400 }
      );
    }

    if (debug === true && APP_ENV === "production" && !ALLOW_DEBUG) {
      return Response.json(
        { ok: false, error: "Debug mode is disabled." },
        { status: 403 }
      );
    }

    if (confirmAction === true) {
      if (
        !pendingAction ||
        typeof pendingAction !== "object" ||
        Array.isArray(pendingAction) ||
        typeof pendingAction.type !== "string" ||
        !pendingAction.type.trim() ||
        !mutationIntents.has(pendingAction.type)
      ) {
        return Response.json(
          { ok: false, error: "Invalid pending action." },
          { status: 400 }
        );
      }
    }

    let parsedIntent = null;
    let parserFallback = false;
    let parserError = "";
    let intent = "unknown";
    let params = {};

    if (confirmAction !== true) {
      if (USE_AI_INTENT_PARSER) {
        try {
          const parsed = await parseIntentWithAI({ message, role });
          if (parsed && parsed.intent !== "unknown" && isAllowedIntent(parsed.intent)) {
            parsedIntent = parsed;
            intent = parsed.intent;
            params = parsed.params || {};
          } else {
            throw new Error("Invalid parser output.");
          }
        } catch (error) {
          parserFallback = true;
          parserError = error?.message || "Intent parser failed.";
          parsedIntent = null;
          intent = detectIntent(message, role);
          params = {};
        }
      } else {
        intent = detectIntent(message, role);
        params = {};
      }
    }

    if (confirmAction === true && pendingAction?.type === "apply_coupon") {
      if (!validateApplyCouponPendingAction(pendingAction)) {
        return Response.json(
          { ok: false, error: "Invalid pending action." },
          { status: 400 }
        );
      }

      if (role !== "user") {
        return Response.json(
          { ok: false, error: "User role is required for this intent." },
          { status: 403 }
        );
      }

      if (!token) {
        return Response.json(
          { ok: false, error: "Authentication token is required for this intent." },
          { status: 401 }
        );
      }

      const coupon = getCouponFromAction(message, pendingAction);

      if (debug === true) {
        return Response.json(buildCouponPreview(coupon, false, parsedIntent));
      }

      try {
        const cart = await applyCoupon({
          token,
          coupon,
        });
        const normalizedCart = normalizeApplyCouponResult(cart);

        return Response.json({
          ok: true,
          intent: "apply_coupon",
          actionExecuted: true,
          data: normalizedCart,
          answer: "تم تطبيق الكوبون على السلة بنجاح.",
        });
      } catch (error) {
        if (
          /totalCartPrice/i.test(error?.message || "") ||
          /Invalid Priceo apply coupon response/i.test(error?.message || "")
        ) {
          return buildInvalidApplyCouponResponse();
        }

        throw error;
      }
    }

    if (confirmAction === true && pendingAction?.type === "create_complaint") {
      if (!validateCreateComplaintPendingAction(pendingAction)) {
        return Response.json(
          { ok: false, error: "Invalid pending action." },
          { status: 400 }
        );
      }

      if (!token) {
        return Response.json(
          { ok: false, error: "Authentication token is required for this intent." },
          { status: 401 }
        );
      }

      const subject = getComplaintSubjectFromAction(message, pendingAction);

      if (debug === true) {
        return Response.json(buildComplaintPreview(subject, false));
      }

      const complaint = await createComplaint({
        token,
        subject,
      });

      return Response.json({
        ok: true,
        intent: "create_complaint",
        actionExecuted: true,
        data: normalizeComplaintResult(complaint),
        answer: "تم تسجيل الشكوى بنجاح.",
      });
    }

    if (intent === "send_notification") {
      if (role !== "admin") {
        return Response.json(
          { ok: false, error: "Admin role is required for this intent." },
          { status: 403 }
        );
      }

      if (!token) {
        return Response.json(
          { ok: false, error: "Authentication token is required for this intent." },
          { status: 401 }
        );
      }

      const subject = params?.subject || extractNotificationSubject(message);
      const sendTo = params?.sendTo || extractNotificationSendTo(message);

      if (!subject || !isValidNotificationSubject(subject)) {
        return Response.json({
          ok: true,
          intent: "send_notification",
          requiresConfirmation: false,
          answer: "اكتب نص الإشعار باختصار عشان أقدر أجهزه.",
        });
      }

      if (!sendTo) {
        return Response.json({
          ok: true,
          intent: "send_notification",
          requiresConfirmation: false,
          answer: "حدد المستهدف: كل المستخدمين.",
        });
      }

      if (debug === true) {
        return Response.json(
          buildNotificationPreview({ subject, sendTo }, false, parsedIntent)
        );
      }

      if (confirmAction === true) {
        return Response.json(
          {
            ok: false,
            error: "Notification execution is disabled in this MVP.",
          },
          { status: 400 }
        );
      }

      return Response.json(buildNotificationPreview({ subject, sendTo }, true));
    }

    if (intent === "apply_coupon") {
      if (role !== "user") {
        return Response.json(
          { ok: false, error: "User role is required for this intent." },
          { status: 403 }
        );
      }

      if (!token) {
        return Response.json(
          { ok: false, error: "Authentication token is required for this intent." },
          { status: 401 }
        );
      }

      const coupon = params?.coupon || extractCartCouponCode(message);

      if (!coupon) {
        return Response.json({
          ok: true,
          intent: "apply_coupon",
          requiresConfirmation: false,
          answer: "اكتب كود الكوبون عشان أقدر أطبقه.",
        });
      }

      if (!isValidCouponCode(coupon)) {
        return Response.json({
          ok: true,
          intent: "apply_coupon",
          requiresConfirmation: false,
          answer: "اكتب كود كوبون صحيح من 3 إلى 50 حرف، ويحتوي على حروف أو أرقام أو _ أو - فقط.",
        });
      }

      if (debug === true) {
        return Response.json(buildCouponPreview(coupon, false, parsedIntent));
      }

      if (confirmAction !== true) {
        return Response.json(buildCouponPreview(coupon, true, parsedIntent));
      }

      if (!pendingAction || pendingAction.type !== "apply_coupon") {
        return Response.json(
          { ok: false, error: "Invalid pending action." },
          { status: 400 }
        );
      }

      if (!validateApplyCouponPendingAction(pendingAction)) {
        return Response.json(
          { ok: false, error: "Invalid pending action." },
          { status: 400 }
        );
      }

      try {
        const cart = await applyCoupon({
          token,
          coupon: pendingAction.coupon || coupon,
        });

        return Response.json({
          ok: true,
          intent: "apply_coupon",
          actionExecuted: true,
          data: normalizeApplyCouponExecutionResult(cart),
          answer: "تم تطبيق الكوبون على السلة بنجاح.",
        });
      } catch (error) {
        if (
          /totalCartPrice/i.test(error?.message || "") ||
          /Invalid Priceo apply coupon response/i.test(error?.message || "")
        ) {
          return buildInvalidApplyCouponResponse();
        }

        throw error;
      }
    }

    if (intent === "create_complaint") {
      if (!token) {
        return Response.json(
          { ok: false, error: "Authentication token is required for this intent." },
          { status: 401 }
        );
      }

      const subject = params?.subject || getComplaintSubjectFromAction(message, pendingAction);

      if (!subject || subject.length < 5) {
        return Response.json({
          ok: true,
          intent: "create_complaint",
          requiresConfirmation: false,
          answer: "اكتب تفاصيل الشكوى باختصار عشان أقدر أسجلها.",
        });
      }

      if (debug === true) {
        return Response.json(buildComplaintPreview(subject, false, parsedIntent));
      }

      if (confirmAction !== true) {
        return Response.json(buildComplaintPreview(subject, true, parsedIntent));
      }

      if (!pendingAction || pendingAction.type !== "create_complaint") {
        return Response.json(
          { ok: false, error: "Invalid pending action." },
          { status: 400 }
        );
      }

      const complaint = await createComplaint({
        token,
        subject: pendingAction.subject || subject,
      });

      return Response.json({
        ok: true,
        intent: "create_complaint",
        actionExecuted: true,
        data: normalizeComplaintResult(complaint),
        answer: "تم تسجيل الشكوى بنجاح.",
      });
    }

    if (protectedUserIntents.has(intent) && !token) {
      return Response.json(
        { ok: false, error: "Authentication token is required for this intent." },
        { status: 401 }
      );
    }

    if (adminIntents.has(intent)) {
      if (role !== "admin") {
        return Response.json(
          { ok: false, error: "Admin role is required for this intent." },
          { status: 403 }
        );
      }
      if (!token) {
        return Response.json(
          { ok: false, error: "Authentication token is required for admin intents." },
          { status: 401 }
        );
      }
    }

    // Keep for clarity: these intents are public and can continue without token.
    if (publicIntents.has(intent)) {
      // No auth gate needed for current public intents.
    }

    // For future protected Priceo calls:
    // fetch(url, { headers: { authorization: token } })
    // Never trust role alone for sensitive actions; Priceo APIs validate token server-side.

    const routed = await routeIntent({ intent, message, role, token, params });
    const normalizedData = normalizeDataForAnswer({ intent, data: routed.data });

    if (debug === true) {
      const response = {
        ok: true,
        intent,
        source: routed.source,
        rawData: routed.data,
        normalizedData,
      };

      if (parsedIntent) {
        response.parsedIntent = parsedIntent;
      }

      if (parserFallback) {
        response.parserFallback = true;
        response.parserError = parserError;
      }

      return Response.json(response);
    }

    if (intent === "cart" && normalizedData?.hasCart === false) {
      const isArabic = detectDominantLanguage(message) === "Arabic";
      return Response.json({
        ok: true,
        intent: "cart",
        answer: isArabic
          ? "السلة فارغة حاليًا."
          : "Your cart is empty right now.",
      });
    }

    let answer;
    try {
      answer = await generateAnswer({
        userMessage: message,
        intent,
        data: normalizedData,
        role,
      });
    } catch {
      answer = buildFallbackAnswer({
        intent,
        data: normalizedData,
        userMessage: message,
      });
    }

    return Response.json({
      ok: true,
      intent,
      answer,
    });
  } catch (error) {
    const status = error?.status || 500;
    const cleanMessage = mapPriceoErrorMessage(
      error?.message || "Unknown error"
    );

    return Response.json(
      {
        ok: false,
        error: "Failed to process chat request.",
        details: cleanMessage,
        source: error?.source || "assistant",
      },
      { status }
    );
  }
}
