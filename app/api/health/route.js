// Provides a simple health check for deployment verification.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "priceo-ai-assistant",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
}
