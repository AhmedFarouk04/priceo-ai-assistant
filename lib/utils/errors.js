// Reserved shared error helpers for consistent API responses.
// Currently unused by the assistant runtime, but kept as a documented placeholder.
export function toErrorResponse(error) {
  return {
    ok: false,
    error: error?.message || "Unknown error",
  };
}
