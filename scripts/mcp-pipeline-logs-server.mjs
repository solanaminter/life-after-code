#!/usr/bin/env node
/**
 * Minimal local MCP server (stdio, newline-delimited JSON-RPC) exposing the
 * pipeline-log tool contract used by the remediate-pipeline flow demo.
 *
 * Tool: get_failed_job_log
 *   Reads demo/pipeline-remediation/pipeline-failure.json and returns the
 *   failed job's name, stage, exit code, and log tail — the same shape the
 *   agent consumes from the GitLab MCP server's get_job tool on live GitLab.
 *
 * Registered in duo/mcp/procurepilot-mcp.json as the "pipeline-logs" server.
 */

import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "..", "demo", "pipeline-remediation", "pipeline-failure.json");

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function getFailedJobLog() {
  if (!existsSync(FIXTURE)) {
    return { error: `fixture not found: ${FIXTURE}` };
  }
  const data = JSON.parse(readFileSync(FIXTURE, "utf8"));
  const job = data.failed_job;
  return {
    pipeline_id: data.pipeline_id,
    job_name: job.name,
    stage: job.stage,
    exit_code: job.exit_code,
    log_tail: job.log_tail,
  };
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = msg;

  if (method === "initialize") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "pipeline-logs", version: "0.1.0" },
      },
    });
    return;
  }

  if (method === "notifications/initialized") return;

  if (method === "tools/list") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "get_failed_job_log",
            description:
              "Return the failed CI job's name, stage, exit code, and log tail for diagnosis.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
          },
        ],
      },
    });
    return;
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    if (toolName !== "get_failed_job_log") {
      send({ jsonrpc: "2.0", id, error: { code: -32602, message: `unknown tool: ${toolName}` } });
      return;
    }
    send({
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(getFailedJobLog(), null, 2) }],
      },
    });
    return;
  }

  send({ jsonrpc: "2.0", id, error: { code: -32601, message: `unknown method: ${method}` } });
});
