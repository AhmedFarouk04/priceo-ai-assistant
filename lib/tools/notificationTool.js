// Handles notification-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getUserNotifications({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.NOTIFICATIONS,
    token,
  });
}

export async function getAdminNotifications({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.ADMIN_NOTIFICATIONS,
    token,
  });
}

