/**
 * Failing check for the remediation demo. Run with: node --test ./test/checkout.test.mjs
 * (imports the TypeScript fixture directly — Node 22.18+ type stripping.
 * Use the file path, not the directory — `node --test test/` misfires under Node 24.)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { calculateTotal } from "../src/checkout.ts";

test("sums string prices numerically", () => {
  const items = [
    { name: "Coffee pods", price: "12.50", qty: 2 },
    { name: "Paper", price: "8.00", qty: 1 },
  ];
  assert.equal(calculateTotal(items), 20.5);
});

test("empty cart totals zero", () => {
  assert.equal(calculateTotal([]), 0);
});
