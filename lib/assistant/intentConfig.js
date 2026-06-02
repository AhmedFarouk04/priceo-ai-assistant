// Centralizes intent groups used across routing and auth checks.
export const publicIntents = new Set([
  "product_search",
  "product_details",
  "policy_question",
]);

export const protectedUserIntents = new Set([
  "user_orders",
  "order_details",
  "cart",
  "wishlist",
  "complaints",
  "user_notifications",
]);

export const adminIntents = new Set([
  "admin_orders_stats",
  "admin_sales_statistics",
  "admin_notifications",
  "admin_complaints",
  "admin_coupons",
  "coupon_details",
]);

export const mutationIntents = new Set([
  "create_complaint",
  "apply_coupon",
  "send_notification",
]);
