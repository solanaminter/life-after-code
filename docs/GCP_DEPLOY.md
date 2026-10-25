# Google Cloud deployment (bonus path)

The repo ships production-grade Google Cloud deployment code
(`infra/gcp/`), which is the **optional Google Cloud bonus** on this
hackathon: up to +0.2 judging points for shipping deployment code with a live
Google Cloud link.

## What's in `infra/gcp/`

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage production image (Node 20, `npm ci --omit=dev`, standalone Next.js build, non-root runtime user) |
| `cloudbuild.yaml` | Build → push → deploy pipeline: Artifact Registry image, Cloud Run deploy with Secret Manager injection |
| `deploy.sh` | One-command manual alternative (build locally, push, `gcloud run deploy`) |
| `.env.example.gcp` | GCP runtime env template — docs only, **no real values** (secrets come from Secret Manager / your shell, never the repo) |

`next.config.ts` uses `output: "standalone"` so the runtime image carries only
the production bundle (local `dev`/`build` behavior is unchanged).

## One-command deploy (needs your Google sign-in)

```bash
gcloud auth login
./infra/gcp/deploy.sh <PROJECT_ID> <REGION> <SERVICE_NAME>
# e.g. ./infra/gcp/deploy.sh my-gcp-project us-west1 life-after-code
```

The deploy is demo-mode by default (`MOCK_MODE=true`) — **no API keys
required** for a live, clickable deployment. Pass `LLM_API_KEY=…` in your
shell to light up real LLM calls, or wire Secret Manager with the Cloud Build
path instead.

Or via Cloud Build (no local Docker needed): push this repo and create a
trigger pointing at `infra/gcp/cloudbuild.yaml` with substitutions
`_REGION`, `_SERVICE`, `_REPO`.

## What a reviewer should see

- **Live URL**: the Cloud Run service URL printed at the end of `deploy.sh`
  (public, HTTPS, scale-to-zero — cold starts are expected on first hit).
- **Health check**: `<URL>/api/healthz` returns
  `{"status":"ok","service":"life-after-code","timestamp":"…"}`.
- **App itself**: `<URL>/` — full ProcurePilot demo UI + dashboard, running on
  the same mock-mode fixtures as the Vercel preview.

**Status:** deployment code is in the repo; the live deploy itself is pending
the owner's Google sign-in tap (`gcloud auth login`) — a user-side step that
automation can't perform.
