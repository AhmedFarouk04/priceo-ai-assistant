// Handles product-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function searchProducts({ keyword, limit = 10 } = {}) {
  return priceoRequest({
    path: priceoEndpoints.PRODUCTS,
    query: {
      keyword: keyword || "",
      limit,
      fields:
        "title,price,priceAfterDiscount,quantity,category,ratingsAverage,imageCover",
    },
  });
}

export async function getProductById({ id } = {}) {
  if (!id) {
    const error = new Error("Product id is required.");
    error.status = 400;
    throw error;
  }

  return priceoRequest({
    path: priceoEndpoints.PRODUCT_BY_ID(id),
  });
}

