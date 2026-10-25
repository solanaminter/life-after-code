# Path B: what changed during the submission period

Life After Code **Path B: Bring Your Own** requires: an existing MIT-licensed
open-source base, plus **agentic automation and deployment built on or after
October 5, 2026**. This file is the accounting.

## The base (pre-existing, MIT)

- **ProcurePilot** — conversational AI procurement agent (Next.js 16, Vercel AI
  SDK, AG Grid dashboard, PayPal/Channel3 adapter contracts)
- Original: https://github.com/solanaminter/procurepilot (public, MIT)
- Directories carried over unchanged: `app/`, `lib/`, `components/`,
  `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`,
  `.env.example`, `vercel.json`, `next-env.d.ts`, `LICENSE`

The application code is **not** the submission's new work. It is the
"existing project" Path B starts from.

## New work for the submission period (Oct 5 → Oct 27, 2026)

All of the following was authored specifically for Life After Code:

| File(s) | What it is |
|---|---|
| `.gitlab-ci.yml` | Multi-stage pipeline: install → typecheck → test → build → secure (GitLab SAST template) → deploy (manual preview). Produces the visible pipeline history the rules require. |
| `duo/flows/plan-verify-secure-deploy.flow.yml` | Supervised MR loop: plan → verify → secure → deploy. Custom Duo flow definition. |
| `duo/flows/remediate-pipeline.flow.yml` | Hands-off pipeline remediation flow: detect → diagnose → propose → apply → verify, with an Assisted-mode flag. Custom Duo flow definition. |
| `duo/agents/pipeline-remediator.agent.yml` | Custom Duo agent: classifies pipeline failures, proposes playbook-backed fixes. |
| `duo/ai-catalog.yml` | AI Catalog manifest registering the agents, flows, and MCP config. |
| `duo/mcp/procurepilot-mcp.json` | MCP client config: local `pipeline-logs` server + GitLab MCP server template. |
| `scripts/remediate-pipeline.ts` | Working local implementation of the remediation loop — a real MCP client against the local server, rule-based diagnosis with optional LLM second opinion, fix application, and re-verification. |
| `scripts/mcp-pipeline-logs-server.mjs` | Minimal stdio MCP server exposing `get_failed_job_log` (the tool contract the flow uses). |
| `demo/pipeline-remediation/` | Failing fixture (genuine TS2322 + failing tests), registered playbook entry, simulated pipeline-failure payload, and the generated audit log. |
| `docs/DEMO_VIDEO_SCRIPT.md` | Under-3-minute demo video outline. |
| `README.md` (this repo) | Rewritten for the Life After Code submission. |

## Deployment (Path B requirement)

Deployment target: preview environment per the `deploy:preview` CI job
(manual trigger; Vercel or GitLab Pages). The live URL goes in the Devpost
submission form; Google Cloud deploy is optional (bonus points) and a
follow-up, not part of this local prep.

## License

MIT throughout — base and new work alike (see `LICENSE`).
