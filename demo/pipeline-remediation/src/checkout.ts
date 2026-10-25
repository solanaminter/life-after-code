/**
 * Demo fixture: checkout math with an intentional bug.
 *
 * The bug (playbook: ts-type-mismatch): catalog prices arrive as strings.
 * Concatenating them produces "12.508.00" instead of 20.5 — and the declared
 * `number` return type makes tsc fail with TS2322, which is what the failed
 * pipeline job reports.
 *
 * The remediation agent fixes this hands-off (see scripts/remediate-pipeline.ts).
 * This file stays broken on purpose: the script always works on a copy under
 * .work/ so the loop is re-provable on every run.
 */

export interface LineItem {
  name: string;
  /** Prices arrive as strings from the catalog API. */
  price: string;
  qty: number;
}

export function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.price, "");
}
