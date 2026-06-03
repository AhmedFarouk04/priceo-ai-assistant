// Handles product-related assistant read operations.
import { priceoRequest } from "../priceo/apiClient.js";
import { priceoEndpoints } from "../priceo/endpoints.js";

export async function searchProducts({
  keyword,
  sort,
  limit = 10,
  priceGte,
  priceLte,
  ratingGte,
} = {}) {
  const query = {
    keyword: keyword ?? "",
    sort: sort ?? "",
    limit,
    fields:
      "title,price,priceAfterDiscount,quantity,category,ratingsAverage,imageCover",
  };

  if (priceGte !== undefined && priceGte !== null && priceGte !== "") {
    query["price[gte]"] = priceGte;
  }
  if (priceLte !== undefined && priceLte !== null && priceLte !== "") {
    query["price[lte]"] = priceLte;
  }
  if (ratingGte !== undefined && ratingGte !== null && ratingGte !== "") {
    query["ratingsAverage[gte]"] = ratingGte;
  }

  return priceoRequest({
    path: priceoEndpoints.PRODUCTS,
    query,
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

