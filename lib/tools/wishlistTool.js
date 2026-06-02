// Handles wishlist-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function getWishlist({ token } = {}) {
  return priceoRequest({
    path: priceoEndpoints.WISHLIST,
    token,
  });
}

