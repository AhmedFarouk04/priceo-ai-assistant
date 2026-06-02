// Detects user intent from incoming chat messages using simple rules.
export function detectIntent(message, role = "user") {
  const text = String(message || "").toLowerCase().trim();
  const hasObjectId = /\b[a-f0-9]{24}\b/i.test(text);
  const hasGenericId = /\bid[:\s-]*[a-z0-9_-]{4,}\b/i.test(text);
  const hasIdLike = hasObjectId || hasGenericId;

  if (!text) {
    return "unknown";
  }

  const hasAny = (keywords) =>
    keywords.some((keyword) => text.includes(keyword.toLowerCase()));

  const detailsKeywords = [
    "\u062A\u0641\u0627\u0635\u064A\u0644",
    "\u0645\u0648\u0627\u0635\u0641\u0627\u062A",
    "details",
    "detail",
    "specs",
    "specifications",
  ];

  const policyKeywords = [
    "\u0637\u0631\u0642 \u0627\u0644\u062F\u0641\u0639",
    "\u0627\u0644\u062F\u0641\u0639",
    "\u0633\u064A\u0627\u0633\u0629",
    "\u0633\u064A\u0627\u0633\u0627\u062A",
    "\u0627\u0644\u0634\u062D\u0646",
    "\u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639",
    "\u0627\u0644\u0627\u0631\u062C\u0627\u0639",
    "\u0627\u0631\u062C\u0639",
    "policy",
    "policies",
    "shipping",
    "payment",
    "refund",
    "return",
  ];
  if (hasAny(policyKeywords)) {
    return "policy_question";
  }

  const adminSalesKeywords = [
    "\u0625\u062C\u0645\u0627\u0644\u064A \u0645\u0628\u064A\u0639\u0627\u062A",
    "\u0627\u062C\u0645\u0627\u0644\u064A \u0645\u0628\u064A\u0639\u0627\u062A",
    "\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0634\u0647\u0631",
    "sales",
    "revenue",
    "gmv",
    "statistics",
    "analytics",
  ];
  if (hasAny(adminSalesKeywords)) {
    return "admin_sales_statistics";
  }

  const adminOrdersKeywords = [
    "\u0643\u0627\u0645 \u0623\u0648\u0631\u062F\u0631",
    "\u0643\u0627\u0645 \u0627\u0648\u0631\u062F\u0631",
    "\u0639\u062F\u062F \u0627\u0644\u0623\u0648\u0631\u062F\u0631\u0627\u062A",
    "\u0639\u062F\u062F \u0627\u0644\u0627\u0648\u0631\u062F\u0631\u0627\u062A",
    "orders count",
    "order stats",
    "orders stats",
    "how many orders",
  ];
  if (hasAny(adminOrdersKeywords)) {
    return "admin_orders_stats";
  }

  const notificationKeywords = [
    "\u0625\u0634\u0639\u0627\u0631",
    "\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
    "\u0627\u0634\u0639\u0627\u0631",
    "\u0627\u0634\u0639\u0627\u0631\u0627\u062A",
    "notification",
    "notifications",
    "alerts",
  ];
  const sendNotificationKeywords = [
    "\u0627\u0628\u0639\u062A \u0625\u0634\u0639\u0627\u0631",
    "\u0627\u0631\u0633\u0644 \u0625\u0634\u0639\u0627\u0631",
    "\u0627\u0628\u0639\u062A \u0646\u0648\u062A\u064A\u0641\u064A\u0643\u064A\u0634\u0646",
    "\u0627\u0639\u0644\u0646 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646",
    "send notification",
    "send announcement",
    "notify users",
  ];
  if (hasAny(sendNotificationKeywords)) {
    return "send_notification";
  }
  const adminKeywords = [
    "\u0627\u0644\u0623\u062F\u0645\u0646",
    "\u0627\u0644\u0627\u062F\u0645\u0646",
    "admin",
  ];
  if (hasAny(notificationKeywords)) {
    if (role === "admin" && hasAny(adminKeywords)) {
      return "admin_notifications";
    }
    return role === "admin" && !hasAny(["\u0639\u0646\u062F\u064A", "my"])
      ? "admin_notifications"
      : "user_notifications";
  }

  const couponKeywords = [
    "\u0643\u0648\u0628\u0648\u0646",
    "\u0643\u0648\u0628\u0648\u0646\u0627\u062A",
    "coupon",
    "coupons",
    "promo",
    "discount code",
  ];
  const applyCouponKeywords = [
    "\u0637\u0628\u0642 \u0643\u0648\u0628\u0648\u0646",
    "\u0627\u0633\u062A\u062E\u062F\u0645 \u0643\u0648\u0628\u0648\u0646",
    "\u0641\u0639\u0644 \u0643\u0648\u0628\u0648\u0646",
    "\u0636\u064A\u0641 \u0643\u0648\u0628\u0648\u0646",
    "\u0627\u0636\u0641 \u0643\u0648\u0628\u0648\u0646",
    "apply coupon",
    "use coupon",
    "add coupon",
  ];
  if (hasAny(applyCouponKeywords)) {
    return "apply_coupon";
  }
  if (hasAny(couponKeywords) && hasAny(detailsKeywords) && hasIdLike) {
    return "coupon_details";
  }
  if (hasAny(couponKeywords)) {
    return "admin_coupons";
  }

  const adminComplaintViewKeywords = [
    "\u0627\u0639\u0631\u0636 \u0634\u0643\u0627\u0648\u0649",
    "\u0639\u0631\u0636 \u0634\u0643\u0627\u0648\u0649",
    "show complaints",
    "list complaints",
    "view complaints",
    "\u0634\u0643\u0627\u0648\u0649 \u0627\u0644\u0623\u062f\u0645\u0646",
    "\u0634\u0643\u0648\u0649 \u0627\u0644\u0623\u062f\u0645\u0646",
  ];
  if (role === "admin" && hasAny(adminComplaintViewKeywords)) {
    return "admin_complaints";
  }

  const createComplaintKeywords = [
    "\u0627\u0639\u0645\u0644 \u0634\u0643\u0648\u0649",
    "\u0633\u062c\u0644 \u0634\u0643\u0648\u0649",
    "\u0639\u0627\u064a\u0632 \u0627\u0634\u062a\u0643\u064a",
    "\u0639\u0627\u064a\u0632 \u0627\u0634\u062a\u0643\u064a",
    "\u0639\u0646\u062f\u064a \u0645\u0634\u0643\u0644\u0629",
    "create complaint",
    "submit complaint",
    "i have a complaint",
    "i have an issue",
    "i have a problem",
    "complain",
  ];
  if (hasAny(createComplaintKeywords) || (hasAny(["\u0634\u0643\u0648\u0649"]) && !hasAny(adminComplaintViewKeywords))) {
    return "create_complaint";
  }

  const orderKeywords = [
    "\u0623\u0648\u0631\u062F\u0631",
    "\u0627\u0648\u0631\u062F\u0631",
    "\u0637\u0644\u0628",
    "order",
    "orders",
  ];
  if (hasIdLike && hasAny(orderKeywords) && hasAny(detailsKeywords)) {
    return "order_details";
  }

  const userOrdersKeywords = [
    "\u0627\u0644\u0623\u0648\u0631\u062F\u0631 \u0628\u062A\u0627\u0639\u064A",
    "\u0627\u0644\u0627\u0648\u0631\u062F\u0631 \u0628\u062A\u0627\u0639\u064A",
    "\u0627\u0648\u0631\u062F\u0631\u064A",
    "\u0637\u0644\u0628\u064A",
    "order status",
    "my order",
    "where is my order",
  ];
  if (hasAny(userOrdersKeywords)) {
    return "user_orders";
  }

  const cartKeywords = [
    "\u0627\u0644\u0633\u0644\u0629",
    "\u0627\u0644\u0643\u0627\u0631\u062A",
    "\u0639\u0631\u0628\u0629 \u0627\u0644\u062A\u0633\u0648\u0642",
    "\u0639\u0631\u0628\u0629",
    "cart",
    "basket",
  ];
  if (hasAny(cartKeywords)) {
    return "cart";
  }

  const wishlistKeywords = [
    "\u0627\u0644\u0645\u0641\u0636\u0644\u0629",
    "\u0648\u064A\u0634\u0644\u0633\u062A",
    "wishlist",
    "favorites",
    "favourites",
  ];
  if (hasAny(wishlistKeywords)) {
    return "wishlist";
  }

  const productKeywords = [
    "\u0645\u0646\u062A\u062C",
    "\u0645\u0646\u062A\u062C\u0627\u062A",
    "\u0627\u064A\u0641\u0648\u0646",
    "iphone",
    "product",
    "products",
    "catalog",
    "show me",
    "search",
  ];
  if (hasIdLike && hasAny(productKeywords) && hasAny(detailsKeywords)) {
    return "product_details";
  }

  if (hasAny(productKeywords)) {
    return "product_search";
  }

  return "unknown";
}
