// Resolves a trusted auth context from the Priceo backend using the user profile endpoint.
import { mapPriceoErrorMessage } from "../assistant/actionGuards.js";
import { priceoEndpoints } from "./endpoints.js";
import { priceoRequest } from "./apiClient.js";

function extractAuthUser(payload) {
  const root = payload?.data || payload || {};

  return {
    userId:
      root?._id ||
      root?.id ||
      root?.userId ||
      root?.data?._id ||
      null,
    role:
      root?.role ||
      root?.userRole ||
      root?.data?.role ||
      null,
    active:
      root?.active ??
      root?.isActive ??
      root?.status ??
      root?.data?.active ??
      root?.data?.isActive ??
      root?.data?.status ??
      null,
  };
}

function createAuthError(message, status = 401) {
  const error = new Error(message);
  error.status = status;
  error.source = "priceo";
  return error;
}

export async function resolvePriceoAuthContext({ token } = {}) {
  if (!token) {
    return {
      isAuthenticated: false,
      userId: null,
      role: null,
      active: null,
    };
  }

  try {
    const payload = await priceoRequest({
      path: priceoEndpoints.GET_ME,
      token,
    });

    const auth = extractAuthUser(payload);
    const normalizedActive =
      typeof auth.active === "string"
        ? auth.active.toLowerCase()
        : auth.active;

    if (
      normalizedActive === false ||
      normalizedActive === "inactive" ||
      normalizedActive === "disabled"
    ) {
      throw createAuthError("Account is inactive.", 403);
    }

    return {
      isAuthenticated: true,
      userId: auth.userId,
      role: auth.role || "user",
      active: auth.active,
    };
  } catch (error) {
    if (error?.source === "priceo" || error?.status) {
      const mappedMessage = mapPriceoErrorMessage(error?.message || "");
      const status = error?.status === 403 ? 403 : 401;
      throw createAuthError(mappedMessage, status);
    }

    throw error;
  }
}
