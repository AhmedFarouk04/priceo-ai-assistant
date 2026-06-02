// Handles coupon-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getAdminCoupons({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.COUPONS,
    token,
  });
}

export async function getCouponById({ id, token } = {}) {
  if (!id) {
    const error = new Error("Coupon id is required.");
    error.status = 400;
    throw error;
  }

  return priceoRequest({
    path: priceoEndpoints.COUPON_BY_ID(id),
    token,
  });
}

