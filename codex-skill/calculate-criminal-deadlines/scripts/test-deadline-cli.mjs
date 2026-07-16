import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildDeadlines, getDefaultInputs, validateCaseInputs } from "./lib/deadlines.ts";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cli = path.join(scriptDir, "deadline-cli.mjs");

function run(args) {
  return execFileSync(process.execPath, ["--experimental-strip-types", cli, ...args], { encoding: "utf8" });
}

test("立案审查一般路径按确定性规则计算", () => {
  const inputs = getDefaultInputs(new Date(2026, 6, 15, 12, 0));
  inputs.caseName = "匿名测试案件";
  inputs.criminalReviewStartDate = "2026-07-01";
  inputs.criminalReviewTrack = "ordinary";
  const item = buildDeadlines(inputs).find((deadline) => deadline.id === "filing-review");
  assert.ok(item);
  assert.equal(item.due?.getFullYear(), 2026);
  assert.equal(item.due?.getMonth(), 6);
  assert.equal(item.due?.getDate(), 6);
});

test("无效日期和未知字段会显示为规范化警告", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "deadline-skill-"));
  try {
    const input = path.join(directory, "case.json");
    writeFileSync(input, JSON.stringify({ caseName: "匿名测试案件", asOf: "2026-07-15", reportDate: "2026-02-31", unknownField: "x" }));
    const result = JSON.parse(run(["validate", "--input", input, "--format", "json"]));
    assert.equal(result.valid, true);
    assert.ok(result.normalizationWarnings.some((warning) => warning.includes("reportDate")));
    assert.ok(result.normalizationWarnings.some((warning) => warning.includes("unknownField")));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI 可创建本地案件并输出 Markdown 报告", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "deadline-skill-"));
  try {
    const input = path.join(directory, "case.json");
    const output = path.join(directory, "report.md");
    run(["init", "--output", input, "--perspective", "victimAgent"]);
    const payload = JSON.parse(readFileSync(input, "utf8"));
    payload.inputs.caseName = "匿名测试案件";
    payload.inputs.asOf = "2026-07-15T14:30";
    payload.inputs.criminalReviewStartDate = "2026-07-01";
    writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);
    run(["calculate", "--input", input, "--scope", "focus", "--output", output]);
    const markdown = readFileSync(output, "utf8");
    assert.match(markdown, /匿名测试案件｜刑事程序期限报告/);
    assert.match(markdown, /立案/);
    assert.doesNotMatch(markdown, /真实当事人姓名/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("程序目录与法条库可检索，法条哈希一致", () => {
  assert.match(run(["procedures", "--query", "不立案"]), /不立案/);
  assert.match(run(["search-law", "--query", "刑事诉讼", "--limit", "2"]), /命中/);
  const integrity = JSON.parse(run(["verify-corpus", "--format", "json"]));
  assert.equal(integrity.valid, true);
  assert.ok(integrity.documents >= 15);
});

test("前后矛盾日期由核心校验器捕获", () => {
  const inputs = getDefaultInputs(new Date(2026, 6, 15, 12, 0));
  inputs.appraisalCommissionAt = "2026-07-10";
  inputs.appraisalDocumentDate = "2026-07-01";
  assert.ok(validateCaseInputs(inputs).some((issue) => issue.severity === "error"));
});
