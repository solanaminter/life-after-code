#!/usr/bin/env bash
# ProcurePilot — Life After Code (Path B)
# One-command manual deploy to Cloud Run (no Cloud Build trigger needed).
#
# Usage (needs owner's Google sign-in first — this is the user-side gate):
#   gcloud auth login
#   ./infra/gcp/deploy.sh <PROJECT_ID> <REGION> <SERVICE_NAME>
#   # e.g. ./infra/gcp/deploy.sh my-gcp-project us-west1 life-after-code
#
# Reads runtime env vars from your shell (see .env.example.gcp). Never commits
# secrets — they are passed to `gcloud run deploy` and stored in GCP, not here.

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <PROJECT_ID> <REGION> <SERVICE_NAME>" >&2
  exit 1
fi

PROJECT_ID="$1"
REGION="$2"
SERVICE="$3"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE}/${SERVICE}:latest"

echo "==> Enabling required APIs"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT_ID}"

echo "==> Ensuring Artifact Registry repo exists"
gcloud artifacts repositories describe "${SERVICE}" \
  --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
gcloud artifacts repositories create "${SERVICE}" \
  --repository-format=docker --location="${REGION}" \
  --project="${PROJECT_ID}"

echo "==> Configuring Docker auth for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "==> Building production image"
docker build -f infra/gcp/Dockerfile -t "${IMAGE}" .

echo "==> Pushing image"
docker push "${IMAGE}"

echo "==> Deploying to Cloud Run (public, scale-to-zero)"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=4 \
  --allow-unauthenticated \
  --set-env-vars="MOCK_MODE=${MOCK_MODE:-true},LLM_MODEL=${LLM_MODEL:-gpt-4o-mini}" \
  ${LLM_API_KEY:+--set-env-vars="LLM_API_KEY=${LLM_API_KEY}"} \
  --format="value(status.url)"

echo "==> Done. Verify with: curl \$(gcloud run services describe ${SERVICE} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)')/api/healthz"
