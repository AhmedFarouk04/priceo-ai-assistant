// Handles dashboard-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getOrderStats({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.ADMIN_ORDER_STATS,
    token,
  });
}

export async function getSalesStatistics({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.ADMIN_SALES_STATS,
    token,
  });
}

