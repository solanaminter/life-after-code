# Life After Code — submission draft (prepared 2026-10-23, NOT yet filed)

**Hackathon:** GitLab Transcend — Life After Code, Path B: Bring Your Own.
**Deadline:** Oct 27, 2026, 6:00 AM PT (per prior run logs; re-verify on the
platform at filing time). **Status at draft time:** registered; no project
draft created yet — draft creation is queued behind the GitLab sign-in gate.
**Entrant:** Solana Minter (Purple Castle Ventures), solo.

## Title
ProcurePilot — Hands-Off DevSecOps Agents (Life After Code, GitLab Path B)

## One-line pitch
One command to the human; GitLab Duo agents handle the rest of the DevSecOps
lifecycle — a supervised ship loop on every merge request and a hands-off
pipeline-remediation loop that detects a failed job, diagnoses it against a
registered playbook, proposes the minimal fix, applies it, and re-verifies
green, escalating unknown failures to a human with the diagnosis instead of
fixing blind.

## What is new for the submission period (post Oct 5, 2026)
Everything under `duo/` (AI Catalog manifest, pipeline-remediator agent,
plan-verify-secure-deploy and remediate-pipeline flows, MCP client config),
`scripts/remediate-pipeline.ts`, `scripts/mcp-pipeline-logs-server.mjs`,
`demo/`, `.gitlab-ci.yml`, and `docs/` — see `docs/PATH_B_CHANGES.md` for the
full accounting. The `app/`, `lib/`, `components/` base is the pre-existing
MIT-licensed ProcurePilot project, disclosed in the README — not claimed as
new work.

## How it works (judge walkthrough)
1. Headline demo, re-provable locally (re-verified 2026-10-23 18:49 PT run):
   from `demo/pipeline-remediation/`, run `node --test ./test/checkout.test.mjs`
   — it fails genuinely (string-concatenation totals, `''` vs expected numbers).
   NOTE: do NOT use the directory form `node --test demo/pipeline-remediation/test/` —
   it misfires under Node 24 with MODULE_NOT_FOUND (the test file itself
   documents this); the file-path form above is the correct judge command.
   The same fixture also fails `tsc --noEmit` with a genuine TS2322 type error
   in `demo/pipeline-remediation/src/checkout.ts`.
2. `npx tsx scripts/remediate-pipeline.ts` runs detect → diagnose (playbook
   entry `ts-type-mismatch`) → propose → apply to a working copy → verify
   (`node --test` + `tsc --noEmit` green) → audit log. The broken fixture is
   never modified, so the loop re-proves on every run. Re-verified end-to-end
   2026-10-23 18:49 PT run: TS2322 detected, fix applied to `.work/` copy,
   both verifications PASS, audit log written to
   `demo/pipeline-remediation/remediation-log.json`.
3. On GitLab import, the same loop is expressed as Duo flows + MCP clients:
   supervised MR loop (review plan → pipeline watch → SAST review with fix
   suggestions → preview URL) and the hands-off remediation flow, with
   approval gates and every agent action audit-logged.
4. Lifecycle coverage: plan, create, verify, package, secure (GitLab SAST
   template + agent review), release (manual `deploy:preview` per MR; Cloud
   Run target via `infra/gcp/`), configure, monitor (remediation audit log),
   govern (approval gates, audit trail).

## Links (all verified 2026-10-23; remediation loop re-proved 2026-10-23 22:50 PT run: TS2322 detected, fix applied to `.work/` copy, both verifications PASS, audit log status `fixed`)
- Live demo (HTTP 200): https://life-after-code.vercel.app
- Demo video (1:49, public via YouTube oEmbed): https://youtu.be/hCFln68ajwk
- Cover image, Devpost-ready JPG/PNG: `assets/life-after-code-cover-devpost.jpg`
  (444 KB) / `.png` (1.76 MB) — converted 2026-10-23 because Devpost rejects WebP.
- Local demo video file: `video/life-after-code-demo.mp4` (1:49)
- Re-proof 2026-10-24 09:50 PT run: fixture fails genuinely (`''` vs numbers), remediation script detects TS2322, applies Number() fix to `.work/` copy, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Broken fixture never modified.
- Re-proof 2026-10-25 12:55 PT run (hourly win loop): same result — fixture fails genuinely, TS2322 detected, Number() fix applied to `.work/` copy, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Live demo https://life-after-code.vercel.app HTTP 200 and video public via YouTube oEmbed re-verified same run.
- Re-proof 2026-10-25 14:55 PT run (hourly win loop): same result — fixture still broken (`sum + item.price, ""`), TS2322 detected, Number() fix applied to `.work/` copy only, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Live demo HTTP 200 and video public via YouTube oEmbed re-verified same run. GCP bonus still unclaimed: no gcloud/Google auth in this shell, so no live Cloud Run URL — file without the +0.2 bonus unless he supplies a GCP sign-in.

## GAPS — resolve before hitting submit (do not file past these)
1. **Public repo URL: https://github.com/solanaminter/life-after-code** (public, created 2026-10-25 00:13 PT; all 69 text files pushed via the GitHub snapshot route in 5 commits, verified present via the GitHub API 2026-10-25 ~01:25 PT: README, LICENSE, `app/` incl. chat route, `package.json`, `package-lock.json`, `.gitlab-ci.yml`, `SUBMISSION_DRAFT.md`, `.env.example`). Correction: the 00:50 PT run's "empty README / missing app" note was stale — it checked after batches 1–2 but before batch 3a landed; batch 3a (landed twice, identical content) delivered everything it flagged. Local repo (`master`) still has NO git remote configured — the push came through the snapshot route, not local git. Excluded from the snapshot by design: cover binaries, video build artifacts, `tsconfig.tsbuildinfo`, `.vercel/` link files.
2. **GitLab project draft: not created.** Requires the GitLab sign-in gate
   (his tap / staffed window); the README's "What happens on GitLab import"
   steps assume that import.
3. **Google Cloud bonus (+0.2 pts max): code shipped, live GCP link NOT
   confirmed.** `infra/gcp/` (Dockerfile, Cloud Build, `deploy.sh`) is in the
   repo and demo-mode deploy needs no API keys, but no live Cloud Run URL
   was verified this run — claim the bonus only if a live link is verified,
   otherwise file without it.

## Filing checklist (staffed window)
- [ ] Public repo pushed; URL pasted above
- [ ] GitLab sign-in + project draft created
- [ ] Cover JPG uploaded as thumbnail
- [ ] Video URL, demo URL, repo URL, README linked
- [ ] Path B disclosure + new-work accounting included (above)
- [ ] Terms ticked + final submit only in a staffed window
- Re-proof 2026-10-26 00:49 PT run (hourly win loop): fixture fails genuinely (`''` vs numbers), remediation script detects TS2322, applies Number() fix to `.work/` copy only, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Live demo https://life-after-code.vercel.app 200, /api/healthz 200, video public via YouTube oEmbed re-verified same run.
- Re-proof 2026-10-26 01:49 PT run (hourly win loop): same result — fixture fails genuinely (`''` vs expected 0), TS2322 detected, Number() fix applied to `.work/` copy only, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Broken fixture never modified. Live demo 200, /api/healthz 200, video public via YouTube oEmbed re-verified same run.
- Re-proof + fix 2026-10-26 02:49 PT run (hourly win loop): README judge command FIXED — the old `node --test demo/pipeline-remediation/test/` form fails under Node 24.22.1 with MODULE_NOT_FOUND, not the genuine fixture failure; README now uses the file-path form, verified from repo root to fail genuinely (`'12.508.00'` vs expected 20.5). Remediation loop re-proved end to end (detect TS2322, fix to `.work/` copy, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`). Live demo 200, /api/healthz 200. Remote sync still blocked: local repo has no git remote configured and `gh` is not logged in — the README fix is committed locally (6f22d93) and still needs a remote sync before filing so judges see the corrected command. Filing itself remains blocked on Dy's GitLab security-code tap for draft creation.
- Re-proof 2026-10-26 15:49 PT run (hourly win loop): fixture fails genuinely (`''` vs expected 0), remediation script detects TS2322, applies Number() fix to `.work/` copy only, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Live demo 200, /api/healthz 200. Local commits 6f22d93/a8b1b85 still unpushed (gh not logged in); filing still blocked only on Dy's GitLab security-code tap for draft creation.
- Re-proof 2026-10-26 19:49 PT run (hourly win loop): fixture fails genuinely (`''` vs expected 0), remediation script detects TS2322, applies Number() fix to `.work/` copy only, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Live demo 200 re-verified this run (see run log); filing still blocked only on Dy's GitLab security-code tap for draft creation.
- Re-proof 2026-10-26 23:49 PT run (hourly win loop): same result — fixture fails genuinely (`''` vs expected 0), TS2322 detected, Number() fix applied to `.work/` copy only, `node --test` PASS + `tsc --noEmit` pass, audit log status `fixed`. Live demo 200, /api/healthz 200. Filing still blocked only on Dy's GitLab security-code tap for draft creation (deadline Tue Oct 27 6:00 AM PT).
