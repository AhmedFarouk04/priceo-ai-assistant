// Centralizes pending-action validation and Priceo error normalization.
export function validateCreateComplaintPendingAction(pendingAction) {
  if (!pendingAction || typeof pendingAction !== "object") {
    return false;
  }

  if (pendingAction.type !== "create_complaint") {
    return false;
  }

  if (typeof pendingAction.subject !== "string") {
    return false;
  }

  const subject = pendingAction.subject.trim();
  return subject.length >= 5 && subject.length <= 500;
}

export function validateApplyCouponPendingAction(pendingAction) {
  if (!pendingAction || typeof pendingAction !== "object") {
    return false;
  }

  if (pendingAction.type !== "apply_coupon") {
    return false;
  }

  if (typeof pendingAction.coupon !== "string") {
    return false;
  }

  const coupon = pendingAction.coupon.trim();
  return coupon.length >= 3 && coupon.length <= 50 && /^[A-Za-z0-9_-]+$/.test(coupon);
}

export function mapPriceoErrorMessage(message = "") {
  if (/Coupon is invalid or expired/i.test(message)) {
    return "الكوبون غير صالح أو منتهي الصلاحية.";
  }

  if (/There is no cart for this user/i.test(message)) {
    return "لا توجد سلة لهذا المستخدم حاليًا.";
  }

  return message;
}
