#!/usr/bin/env tsx
/**
 * remediate-pipeline.ts — local implementation of the Duo
 * `remediate-pipeline` flow's hands-off loop:
 *
 *   detect → diagnose → propose → apply → verify
 *
 * 1. DETECT: acts as an MCP client — spawns scripts/mcp-pipeline-logs-server.mjs
 *    and calls get_failed_job_log over stdio JSON-RPC (the same tool contract
 *    the flow uses against the GitLab MCP server's get_job on live GitLab).
 * 2. DIAGNOSE: matches the log against the registered playbook
 *    (demo/pipeline-remediation/remediation-action.json). Anything without a
 *    matching entry escalates to a human — no blind fixes. `--llm` adds an
 *    optional LLM second opinion via the Hugging Face router (falls back to
 *    rules on any error).
 * 3. PROPOSE: prints the minimal fix diff.
 * 4. APPLY: applies the fix to a working copy under .work/ (the broken
 *    fixture stays broken so the loop is re-provable).
 * 5. VERIFY: re-runs the failing check against the fixed copy.
 *
 * Writes an audit log to demo/pipeline-remediation/remediation-log.json.
 *
 * Usage:
 *   npx tsx scripts/remediate-pipeline.ts [--ci] [--llm] [--reset]
 */

import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DEMO = join(ROOT, "demo", "pipeline-remediation");
const WORK = join(DEMO, ".work");
const LOG = join(DEMO, "remediation-log.json");

const CI = process.argv.includes("--ci");
const USE_LLM = process.argv.includes("--llm");

type AuditStep = { step: string; at: string; detail: unknown };
const audit: AuditStep[] = [];
const stamp = () => new Date().toISOString();
function log(step: string, detail: unknown) {
  audit.push({ step, at: stamp(), detail });
  if (!CI) console.log(`\n### ${step.toUpperCase()}\n${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}`);
}
function fail(msg: string): never {
  log("escalate", msg);
  writeFileSync(LOG, JSON.stringify({ status: "escalated", audit }, null, 2));
  console.error(`\nESCALATED TO HUMAN: ${msg}\n(no fix applied — no blind fixes)`);
  process.exit(2);
}

// ------------------------------------------------------------------ 1. DETECT
async function mcpCall(method: string, params: unknown, id: number | null): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const server = spawn("node", [join(HERE, "mcp-pipeline-logs-server.mjs")], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    const timer = setTimeout(() => {
      server.kill();
      reject(new Error("MCP server timed out"));
    }, 15000);
    const rl = createInterface({ input: server.stdout, crlfDelay: Infinity });
    const send = (obj: unknown) => server.stdin.write(JSON.stringify(obj) + "\n");

    let phase = 0;
    rl.on("line", (line) => {
      let msg: { id?: number; result?: unknown; error?: unknown };
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (phase === 0 && "result" in msg) {
        // initialized — acknowledge, then call the tool
        send({ jsonrpc: "2.0", method: "notifications/initialized" });
        send({ jsonrpc: "2.0", id, method, params });
        phase = 1;
      } else if (phase === 1 && "result" in msg) {
        clearTimeout(timer);
        server.kill();
        resolve(msg.result);
      } else if (msg.error) {
        clearTimeout(timer);
        server.kill();
        reject(new Error(`MCP error: ${JSON.stringify(msg.error)}`));
      }
    });
    server.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "remediate-pipeline", version: "0.1.0" } },
    });
  });
}

async function detect(): Promise<{ job: string; stage: string; log: string[] }> {
  const result = (await mcpCall("tools/call", { name: "get_failed_job_log", arguments: {} }, 2)) as {
    content: { type: string; text: string }[];
  };
  const payload = JSON.parse(result.content[0].text) as {
    job_name: string;
    stage: string;
    log_tail: string[];
    error?: string;
  };
  if (payload.error) throw new Error(String(payload.error));
  log("detect", `Failed job "${payload.job_name}" in stage "${payload.stage}" — log tail:\n${payload.log_tail.join("\n")}`);
  return { job: payload.job_name, stage: payload.stage, log: payload.log_tail };
}

// ---------------------------------------------------------------- 2. DIAGNOSE
async function diagnose(logLines: string[]): Promise<{ playbook: Record<string, unknown>; classification: string }> {
  const text = logLines.join("\n");
  const action = JSON.parse(readFileSync(join(DEMO, "remediation-action.json"), "utf8"));
  const sig = new RegExp(action.signature);

  if (!sig.test(text)) {
    fail(
      `Failure signature does not match any registered playbook entry.\n` +
        `Log excerpt:\n${logLines.slice(0, 4).join("\n")}`
    );
  }

  let classification = `${action.playbook_id}: ${action.description}`;
  if (USE_LLM) {
    classification += `\nLLM second opinion: ${await llmOpinion(text)}`;
  }
  log("diagnose", classification);
  return { playbook: action, classification };
}

async function llmOpinion(logText: string): Promise<string> {
  try {
    const tokenPath = join(process.env.HOME ?? "", ".cache", "huggingface", "token");
    if (!existsSync(tokenPath)) return "(no HF token — skipped)";
    const token = readFileSync(tokenPath, "utf8").trim();
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          { role: "system", content: "You are a CI failure triage assistant. Reply in one sentence." },
          { role: "user", content: `What caused this CI failure?\n${logText.slice(0, 800)}` },
        ],
        max_tokens: 80,
      }),
    });
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? "(no answer)";
  } catch (e) {
    return `(LLM unavailable — ${String(e).slice(0, 80)})`;
  }
}

// ------------------------------------------------------------ 3/4. PROPOSE+APPLY
function applyFix(playbook: Record<string, unknown>): string {
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(join(WORK, "src"), { recursive: true });
  mkdirSync(join(WORK, "test"), { recursive: true });
  cpSync(join(DEMO, "src", "checkout.ts"), join(WORK, "src", "checkout.ts"));
  cpSync(join(DEMO, "test", "checkout.test.mjs"), join(WORK, "test", "checkout.test.mjs"));

  const target = join(WORK, "src", "checkout.ts");
  const before = readFileSync(target, "utf8");
  const find = playbook.find as string;
  const replace = playbook.replace as string;
  if (!before.includes(find)) {
    fail(`Playbook fix no longer applies cleanly to ${playbook.target} — escalating.`);
  }
  writeFileSync(target, before.replace(find, replace));

  const diff = `- ${find}\n+ ${replace}`;
  log("propose", `Minimal fix diff (playbook: ${playbook.playbook_id}):\n${diff}`);
  log("apply", `Applied to working copy ${target}`);
  return diff;
}

// ----------------------------------------------------------------- 5. VERIFY
async function verify(): Promise<void> {
  // Re-run the failing check against the fixed copy.
  const { stdout } = await execFileAsync("node", ["--test", join(WORK, "test", "checkout.test.mjs")], {
    cwd: ROOT,
    timeout: 30000,
  }).catch((e: { stdout?: string; stderr?: string }) => {
    fail(`Re-run still failing after fix:\n${e.stdout ?? ""}${e.stderr ?? ""}`);
    throw e;
  });
  const passMatch = stdout.match(/(?:ℹ|#)\s*pass\s+(\d+)/);
  const failMatch = stdout.match(/(?:ℹ|#)\s*fail\s+(\d+)/);
  const testOk =
    passMatch !== null &&
    Number(passMatch[1]) > 0 &&
    (failMatch === null || Number(failMatch[1]) === 0);

  // Best-effort: re-run the typecheck too (needs a tsc on PATH).
  let tscOk: string = "skipped (no tsc on PATH)";
  try {
    await execFileAsync("tsc", ["--version"], { timeout: 15000 });
    await execFileAsync("tsc", ["--noEmit", join(WORK, "src", "checkout.ts")], {
      cwd: ROOT,
      timeout: 60000,
    });
    tscOk = "pass";
  } catch (e) {
    const err = e as { code?: unknown; stdout?: string; message?: string };
    if (err.code === "ENOENT") {
      tscOk = "skipped (no tsc on PATH)";
    } else {
      fail(`Typecheck still failing after fix:\n${err.stdout ?? err.message}`);
    }
  }

  log("verify", `node --test on fixed copy: ${testOk ? "PASS" : "FAIL"}\ntsc --noEmit on fixed copy: ${tscOk}`);
  if (!testOk) fail("Verification failed.");
}

// --------------------------------------------------------------------- main
async function main() {
  if (process.argv.includes("--reset")) {
    rmSync(WORK, { recursive: true, force: true });
    rmSync(LOG, { force: true });
    console.log("Reset: working copy and audit log removed.");
    return;
  }

  console.log("remediate-pipeline — hands-off loop: detect → diagnose → propose → apply → verify");
  const { log: logLines } = await detect();
  const { playbook } = await diagnose(logLines);
  applyFix(playbook);
  await verify();

  writeFileSync(LOG, JSON.stringify({ status: "fixed", audit }, null, 2));
  console.log("\n✅ PIPELINE REMEDIATED — audit log written to demo/pipeline-remediation/remediation-log.json");
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
