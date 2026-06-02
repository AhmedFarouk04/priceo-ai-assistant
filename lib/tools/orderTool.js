// Handles order-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getUserOrders({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.USER_ORDERS,
    token,
  });
}

export async function getOrderById({ id, token } = {}) {
  if (!id) {
    const error = new Error("Order id is required.");
    error.status = 400;
    throw error;
  }

  return priceoRequest({
    path: priceoEndpoints.ORDER_BY_ID(id),
    token,
  });
}

export async function getAllOrders({ token, limit } = {}) {
  return priceoRequest({
    path: priceoEndpoints.ORDERS,
    token,
    query: { limit },
  });
}

