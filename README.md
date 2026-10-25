# ProcurePilot — Life After Code (Path B)

**Life After Code** (GitLab Transcend Hackathon) entry — **Path B: Bring Your Own** —
by **Solana Minter** (Purple Castle Ventures).

🚀 **Live demo (public preview):** https://life-after-code.vercel.app

🎬 **Demo video (1:49, Public):** https://youtu.be/hCFln68ajwk

🖼️ **Cover image:** `assets/media-generation-life-after-code-cover-0-ded0a068-4f95-4e7e-a534-bfdd4596606b.webp` (generated 2026-10-22 for the filing's thumbnail slot; video verified public via YouTube oEmbed this run)

The base project is **ProcurePilot**, an MIT-licensed conversational AI
procurement agent (original: https://github.com/solanaminter/procurepilot).
For this hackathon, the app is unchanged — what's new is the **agentic
post-code automation wrapped around it**, built with GitLab Duo Agent Platform
features (agents, flows, MCP clients). One command to the human, the agents
handle the rest of the DevSecOps lifecycle.

## What the automation does

**Supervised ship loop** (`duo/flows/plan-verify-secure-deploy.flow.yml`) —
on every merge request, agents: post a review plan → watch the pipeline →
review SAST findings with fix suggestions → post the preview URL. The human
approves the outcome, not each step.

**Hands-off pipeline remediation** (`duo/flows/remediate-pipeline.flow.yml`) —
the headline demo. When a pipeline job fails, the loop runs with no human in
the middle:

1. **Detect** — fetch the failed job's log (via MCP: `get_failed_job_log`)
2. **Diagnose** — classify against the registered remediation playbook
3. **Propose** — produce the minimal fix diff
4. **Apply** — commit to a fix branch (Assisted mode: propose and wait for a tap)
5. **Verify** — re-run the pipeline; green → open the MR with the audit log

Unknown failures **escalate to a human with the diagnosis — no blind fixes.**

The same loop runs locally, provably:
`npx tsx scripts/remediate-pipeline.ts` (see [the demo](#headline-demo-hands-off-remediation)).

## Lifecycle stages covered

| Stage | How it's touched |
|---|---|
| plan | Agent posts a review plan on every MR |
| create | Agent proposes fix diffs as suggestions |
| verify | Multi-stage CI pipeline + remediation flow |
| package | `build:app` produces the Next.js artifact |
| secure | GitLab SAST template + agent review of findings |
| release | Manual `deploy:preview` per MR with preview URL; Cloud Run target via `infra/gcp/` (bonus) |
| configure | Pipeline, flows, agents, MCP config all as code |
| monitor | Remediation audit log = pipeline health telemetry |
| govern | Approval gates + every agent action audit-logged |

## Google Cloud deployment (bonus)

The repo ships production Google Cloud deployment code for Cloud Run
(`infra/gcp/`: production Dockerfile, Cloud Build pipeline, one-command
`deploy.sh`, GCP env template) — targeting the hackathon's optional **Google
Cloud bonus** (up to +0.2 judging points for deployment code with a live
Google Cloud link). Demo-mode deploy needs no API keys (`MOCK_MODE=true`).
Full steps and reviewer checklist: [docs/GCP_DEPLOY.md](docs/GCP_DEPLOY.md).

## Repository layout (new for this submission)

```
.gitlab-ci.yml            # install → typecheck → test → build → secure → deploy
duo/
  ai-catalog.yml          # AI Catalog manifest (register on import)
  agents/
    pipeline-remediator.agent.yml
  flows/
    plan-verify-secure-deploy.flow.yml   # supervised MR loop
    remediate-pipeline.flow.yml          # hands-off failure loop
  mcp/
    procurepilot-mcp.json # MCP client config (local demo server + GitLab template)
scripts/
  remediate-pipeline.ts      # local implementation of the remediation loop
  mcp-pipeline-logs-server.mjs  # local MCP server (get_failed_job_log)
demo/
  pipeline-remediation/   # failing fixture + playbook + audit log
docs/
  PATH_B_CHANGES.md       # what changed during the submission period
  DEMO_VIDEO_SCRIPT.md    # <3 min video outline
```

Everything under `duo/`, `scripts/remediate-pipeline.ts`,
`scripts/mcp-pipeline-logs-server.mjs`, `demo/`, `.gitlab-ci.yml`, and `docs/`
is **new work for the submission period (post Oct 5, 2026)**. The `app/`,
`lib/`, `components/` base is the pre-existing MIT ProcurePilot project —
see `docs/PATH_B_CHANGES.md` for the full accounting.

## Headline demo: hands-off remediation

```bash
# 1. Watch the fixture fail (the "broken pipeline")
node --test demo/pipeline-remediation/test/

# 2. Run the hands-off loop — detect → diagnose → propose → apply → verify
npx tsx scripts/remediate-pipeline.ts

# 3. Inspect the audit trail
cat demo/pipeline-remediation/remediation-log.json

# 4. Start over
npx tsx scripts/remediate-pipeline.ts --reset
```

The fixture (`demo/pipeline-remediation/src/checkout.ts`) carries a genuine
TS2322 type error that also fails the test suite. The agent matches the
failure signature to the registered playbook entry (`ts-type-mismatch`),
applies the minimal fix to a working copy, and re-runs both `node --test`
and `tsc --noEmit` to prove green — then writes the audit log. The broken
fixture is never modified, so the loop is re-provable on every run.

## Running the app

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build (also the CI build:app job)
```

The app itself runs on mock adapters by default (no secrets needed); see
`.env.example`. The PayPal sandbox wiring is orthogonal to this submission —
the automation story here is the CI/CD + Duo layer, which is fully local.

## What happens on GitLab import

1. Import this repo to GitLab (public, MIT `LICENSE` at top).
2. Contributor onboarding for the hackathon (~24h approval) enables Duo.
3. Register `duo/` contents in the project's AI Catalog
   (`duo/ai-catalog.yml` is the manifest).
4. Push — the `.gitlab-ci.yml` pipeline runs with visible history.
5. Enable the `gitlab-live` MCP server entry for live pipeline tools.

## License

MIT — see [LICENSE](LICENSE). Base project ProcurePilot is MIT-licensed by
Solana Minter; all Life After Code automation work is likewise MIT.
