// ProcurePilot — Life After Code (Path B)
// GET /api/healthz → { status: "ok", service, timestamp }
// Used by Cloud Run as a readiness probe and by reviewers to confirm liveness.

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "life-after-code",
    timestamp: new Date().toISOString(),
  });
}
