# ProcurePilot — Life After Code Demo Video Script

**Target:** < 3:00 total (~400 words @ ~150 wpm ≈ 2:40 + transitions)
**Narration engine:** Kokoro, default voice (free path; HeyGen Marcia alternate)
**Record against:** terminal for the remediation loop + GitLab UI (pipeline,
AI Catalog, Agentic Chat) once imported — local segments work today

---

## 0:00–0:18 — The problem (code is solved; everything after isn't)

**On screen:** montage — MR open, red pipeline, SAST alert, deploy checklist.

**Narration:**
> "Code generation is solved. What happens after the code is written — the
> review, the broken pipeline at midnight, the security scan, the deploy —
> still eats your week. We built agents that take over the rest of the
> DevSecOps lifecycle for a real app: ProcurePilot, our MIT-licensed
> procurement agent. Watch what happens when its pipeline breaks."

## 0:18–0:50 — The setup (Path B, one breath)

**On screen:** GitLab repo page — MIT license visible; pipeline history with
green runs; AI Catalog with the two flows and the agent.

**Narration:**
> "This is Path B: bring your own project. ProcurePilot is ours, MIT-licensed
> and public. New for this hackathon: a supervised ship loop — on every merge
> request, agents plan the review, watch the pipeline, triage security
> findings, and post the preview URL. And a hands-off remediation flow that
> fixes broken pipelines with no human in the middle."

## 0:50–1:55 — Headline: hands-off pipeline remediation (live)

**On screen:** terminal. Run the failing check, then the loop. Show each
phase header as it prints.

**Narration:**
> "Here's the headline. A pipeline job just failed — a type error in the
> checkout math. The agent detects it through the pipeline-log tool…
> diagnoses it against its registered playbook — string prices concatenated
> instead of summed… proposes the minimal diff… applies it to a fix branch…
> and re-runs the pipeline. Tests pass. Typecheck passes. And everything is
> written to an audit log. No human touched anything."

*(Beat. Show `remediation-log.json` — detect, diagnose, propose, apply, verify.)*

> "And when the failure doesn't match the playbook? It escalates to a human
> with the diagnosis. No blind fixes — that's the governance story."

## 1:55–2:30 — Architecture (30 seconds, one diagram)

**On screen:** simple diagram — MR → ship-loop flow → pipeline → (on failure)
remediation flow → MCP tools → audit log. Nine lifecycle stages checklist
ticking off: plan, create, verify, package, secure, release, configure,
monitor, govern.

**Narration:**
> "Under the hood: two custom Duo flows and one agent, published through the
> AI Catalog, reaching the pipeline through MCP tools. The flows, the agent,
> the MCP config, and the pipeline itself are all defined as code in the repo —
> and the whole remediation loop runs locally too, so you can verify every
> claim in this video."

## 2:30–2:55 — Close

**On screen:** ProcurePilot dashboard; "Life After Code — Path B" title card.

**Narration:**
> "Life after code isn't a demo — it's the rest of the job, automated.
> ProcurePilot plus hands-off DevSecOps agents. Built for Life After Code,
> Path B."

---

## Shot list (recording order)

1. Terminal: `node --test demo/pipeline-remediation/test/checkout.test.mjs` → red (5s)
2. Terminal: `npx tsx scripts/remediate-pipeline.ts` → full loop, green (45s)
3. `cat demo/pipeline-remediation/remediation-log.json` (8s)
4. GitLab UI (post-import): repo page w/ MIT license, pipeline history, AI Catalog entries (15s)
5. Diagram overlay for architecture (record as motion graphic) (30s)
6. App dashboard beauty shot (10s)

## Compliance notes

- No third-party trademarks or copyrighted music (rules requirement).
- Video must show the automation running — shots 1–3 are the proof.
- Keep under 3:00; judges aren't required to watch past it.
