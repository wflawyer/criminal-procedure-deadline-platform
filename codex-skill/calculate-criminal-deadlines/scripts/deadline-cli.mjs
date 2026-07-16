#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  OPTIONAL_PROCEDURE_IDS,
  buildDeadlines,
  getDefaultInputs,
  toDateKey,
  toDateTimeLocalKey,
  validateCaseInputs,
} from "./lib/deadlines.ts";
import { inferProjectStatus, parseWorkbench } from "./lib/case-projects.ts";
import { procedureCategories } from "./lib/procedure-catalog.ts";
import { filterDeadlinesByRoleScope, getRoleStats, roleViewConfigs } from "./lib/role-views.ts";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, "..");
const legalDir = path.join(skillRoot, "references", "legal");
const perspectives = ["victimAgent", "suspectDefendant", "defender"];
const scopes = ["focus", "urgent", "all"];
const formats = ["markdown", "json"];

const enumOptions = {
  perspective: perspectives,
  caseRoute: ["public", "private"],
  appraisalComplexity: ["instant", "complex", "functional"],
  injuryLevel: ["pending", "minor", "light2", "light1", "serious", "death"],
  criminalReviewTrack: ["ordinary", "verify", "major"],
  detentionTrack: ["ordinary10", "special14", "major37"],
  custodyTrack: ["base2", "complex3", "special5", "ten7", "npcSpecial"],
  custodySpecialGround: ["none", "remote", "crimeGroup", "fugitive", "broadDifficult"],
  custodyNecessityTrack: ["investigation3", "prosecution3", "procuratorate10"],
  recusalDecisionTrack: ["ordinary2", "complex5"],
  prosecutionTrack: ["ordinary", "major", "fast10", "fast15"],
  trialTrack: ["ordinary2", "ordinary3", "special6", "summary20", "summary45", "fast10", "fast15", "private6"],
  judgmentPronouncementTrack: ["inCourt", "scheduled"],
  firstDecisionType: ["judgment", "ruling"],
  secondInstanceTrack: ["ordinary2", "special4"],
};

function parseArgs(argv) {
  const positionals = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const equals = token.indexOf("=");
    if (equals > 2) {
      options[token.slice(2, equals)] = token.slice(equals + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      i += 1;
    } else {
      options[key] = true;
    }
  }
  return { command: positionals[0] || "help", positionals: positionals.slice(1), options };
}

function requireString(options, key) {
  const value = options[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`缺少必填参数 --${key}`);
  return value;
}

function optionChoice(options, key, allowed, fallback) {
  const value = options[key] ?? fallback;
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`--${key} 只能是：${allowed.join("、")}`);
  }
  return value;
}

function markdownCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function clip(value, length = 260) {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length - 1)}…` : compact;
}

async function readJson(filename) {
  const absolute = path.resolve(filename);
  let text;
  try {
    text = await readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(`无法读取输入文件 ${absolute}：${error.message}`);
  }
  try {
    return { absolute, value: JSON.parse(text) };
  } catch (error) {
    throw new Error(`输入文件不是有效 JSON（${absolute}）：${error.message}`);
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCase(raw) {
  if (!isRecord(raw)) throw new Error("案件输入必须是 JSON 对象");
  const rawInputs = isRecord(raw.inputs) ? raw.inputs : raw;
  const now = new Date().toISOString();
  const workbench = parseWorkbench({
    version: 2,
    activeProjectId: "local-input",
    projects: [{
      id: "local-input",
      status: typeof raw.status === "string" ? raw.status : "准备中",
      notes: "",
      createdAt: now,
      updatedAt: now,
      inputs: rawInputs,
    }],
  });
  if (!workbench) throw new Error("无法规范化案件输入");
  const inputs = workbench.projects[0].inputs;
  const defaults = getDefaultInputs();
  const known = new Set(Object.keys(defaults));
  const warnings = [];

  for (const key of Object.keys(rawInputs)) {
    if (!known.has(key)) warnings.push(`未知字段 ${key} 已忽略`);
  }
  for (const key of Object.keys(defaults)) {
    if (!(key in rawInputs)) continue;
    const supplied = rawInputs[key];
    const normalized = inputs[key];
    if (key === "asOf" && typeof supplied === "string" && normalized === `${supplied}T00:00`) continue;
    if (JSON.stringify(supplied) !== JSON.stringify(normalized)) {
      warnings.push(`字段 ${key} 的值不合法或已被规范化：${clip(JSON.stringify(supplied), 100)} → ${clip(JSON.stringify(normalized), 100)}`);
    }
  }
  return { inputs, warnings };
}

async function loadCase(filename) {
  const loaded = await readJson(filename);
  return { ...loaded, ...normalizeCase(loaded.value) };
}

function localDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.getHours() || date.getMinutes() ? toDateTimeLocalKey(date) : toDateKey(date);
}

function serializeDeadline(item, includeLawText) {
  return {
    id: item.id,
    stage: item.stage,
    stageNo: item.stageNo,
    title: item.title,
    summary: item.summary,
    basis: item.basis,
    ...(includeLawText ? { lawText: item.lawText } : {}),
    action: item.action,
    due: localDateValue(item.due),
    rawDue: localDateValue(item.rawDue),
    completedAt: item.completedAt || null,
    status: item.status,
    statusText: item.statusText,
    dateText: item.dateText,
    provisional: Boolean(item.provisional),
    kind: item.kind || null,
    noFixed: Boolean(item.noFixed),
    note: item.note || "",
  };
}

async function loadManifest() {
  const raw = await readFile(path.join(legalDir, "manifest.json"), "utf8");
  return JSON.parse(raw);
}

async function legalSnapshot() {
  const manifest = await loadManifest();
  const checked = [...new Set(manifest.map((entry) => entry.checked_at).filter(Boolean))].sort();
  return { count: manifest.length, checkedAt: checked.at(-1) || "未知" };
}

function renderIssues(issues) {
  if (!issues.length) return "未发现日期逻辑冲突。";
  return [
    "| 级别 | 问题 | 说明 |",
    "|---|---|---|",
    ...issues.map((issue) => `| ${issue.severity === "error" ? "错误" : "警告"} | ${markdownCell(issue.title)} | ${markdownCell(issue.detail)} |`),
  ].join("\n");
}

async function buildReport(inputs, warnings, options) {
  const scope = optionChoice(options, "scope", scopes, "focus");
  const includeLawText = Boolean(options["include-law-text"]);
  const showWaiting = !options["hide-waiting"];
  const allDeadlines = buildDeadlines(inputs);
  const deadlines = filterDeadlinesByRoleScope(allDeadlines, inputs.perspective, scope, showWaiting);
  const issues = validateCaseInputs(inputs);
  const stats = getRoleStats(allDeadlines, inputs.perspective);
  const role = roleViewConfigs[inputs.perspective];
  const legal = await legalSnapshot();
  return {
    generatedAt: new Date().toISOString(),
    caseName: inputs.caseName,
    perspective: inputs.perspective,
    perspectiveTitle: role.headline,
    asOf: inputs.asOf,
    inferredStatus: inferProjectStatus(inputs),
    scope,
    legalCorpus: legal,
    normalizationWarnings: warnings,
    validationIssues: issues,
    stats,
    deadlines: deadlines.map((item) => serializeDeadline(item, includeLawText)),
  };
}

function reportMarkdown(report) {
  const warningText = report.normalizationWarnings.length
    ? report.normalizationWarnings.map((item) => `- ${item}`).join("\n")
    : "无。";
  const table = report.deadlines.length
    ? [
        "| 阶段 | 节点 | 日期/状态 | 立即行动 | 依据 |",
        "|---|---|---|---|---|",
        ...report.deadlines.map((item) => `| ${markdownCell(item.stage)} | ${markdownCell(item.title)} | ${markdownCell(`${item.dateText}；${item.statusText}`)} | ${markdownCell(item.action)} | ${markdownCell(item.basis)} |`),
      ].join("\n")
    : "当前筛选条件下没有节点。";
  const details = report.deadlines.map((item) => {
    const lines = [
      `### ${item.title}`,
      "",
      `- 阶段：${item.stage}`,
      `- 日期与状态：${item.dateText}；${item.statusText}`,
      `- 说明：${item.summary}`,
      `- 行动：${item.action}`,
      `- 依据：${item.basis}`,
    ];
    if (item.note) lines.push(`- 核验提示：${item.note}`);
    if (item.provisional) lines.push("- 性质：预测节点，尚未由实际程序事实触发或完成");
    if (item.lawText) lines.push(`- 内置法条：${item.lawText}`);
    return lines.join("\n");
  }).join("\n\n");

  return [
    `# ${report.caseName}｜刑事程序期限报告`,
    "",
    `- 角色视角：${report.perspectiveTitle}（${report.perspective}）`,
    `- 计算截至：${report.asOf}`,
    `- 推定阶段：${report.inferredStatus}`,
    `- 筛选范围：${report.scope}`,
    `- 法条库：${report.legalCorpus.count} 份文本，最近核验日期 ${report.legalCorpus.checkedAt}`,
    "- 计算方式：本地确定性脚本；预测节点不等于已发生事实",
    "",
    "## 概览",
    "",
    report.stats.map((item) => `${item.label}：${item.value}`).join("；"),
    "",
    "## 输入规范化提示",
    "",
    warningText,
    "",
    "## 日期校验",
    "",
    renderIssues(report.validationIssues),
    "",
    "## 期限与行动",
    "",
    table,
    details ? `\n\n## 节点详情\n\n${details}` : "",
    "",
  ].join("\n");
}

async function outputValue(value, options, defaultFormat = "markdown") {
  const format = optionChoice(options, "format", formats, defaultFormat);
  const text = format === "json" ? `${JSON.stringify(value, null, 2)}\n` : `${value}\n`;
  if (typeof options.output === "string") {
    const destination = path.resolve(options.output);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, text, "utf8");
    process.stdout.write(`${destination}\n`);
  } else {
    process.stdout.write(text);
  }
}

async function commandInit(options) {
  const output = path.resolve(requireString(options, "output"));
  const perspective = optionChoice(options, "perspective", perspectives, "victimAgent");
  const now = new Date();
  const inputs = getDefaultInputs(now);
  inputs.caseName = "匿名刑事案件";
  inputs.perspective = perspective;
  const payload = {
    version: 1,
    caseId: `case-${randomUUID()}`,
    status: "准备中",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    inputs,
  };
  await mkdir(path.dirname(output), { recursive: true });
  try {
    await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: options.force ? "w" : "wx" });
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`文件已存在：${output}。如确认覆盖，请增加 --force`);
    throw error;
  }
  process.stdout.write(`${output}\n`);
}

async function commandValidate(options) {
  const source = requireString(options, "input");
  const loaded = await loadCase(source);
  const issues = validateCaseInputs(loaded.inputs);
  const result = {
    input: loaded.absolute,
    valid: !issues.some((item) => item.severity === "error"),
    normalizationWarnings: loaded.warnings,
    validationIssues: issues,
  };
  if ((options.format ?? "markdown") === "json") return outputValue(result, options, "json");
  const markdown = [
    `# ${loaded.inputs.caseName}输入校验`,
    "",
    `结论：${result.valid ? "未发现阻断性错误" : "存在需要修正的错误"}`,
    "",
    "## 输入规范化提示",
    "",
    loaded.warnings.length ? loaded.warnings.map((item) => `- ${item}`).join("\n") : "无。",
    "",
    "## 日期逻辑问题",
    "",
    renderIssues(issues),
  ].join("\n");
  return outputValue(markdown, options);
}

async function commandCalculate(options) {
  const source = requireString(options, "input");
  const loaded = await loadCase(source);
  const report = await buildReport(loaded.inputs, loaded.warnings, options);
  if ((options.format ?? "markdown") === "json") return outputValue(report, options, "json");
  return outputValue(reportMarkdown(report), options);
}

function schemaData() {
  const defaults = getDefaultInputs();
  return {
    dateFormats: ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm"],
    optionalProcedures: OPTIONAL_PROCEDURE_IDS,
    enumOptions,
    fields: Object.entries(defaults).map(([name, defaultValue]) => ({ name, defaultValue })),
  };
}

async function commandSchema(options) {
  const schema = schemaData();
  if ((options.format ?? "markdown") === "json") return outputValue(schema, options, "json");
  const markdown = [
    "# 刑事案件输入字段",
    "",
    `日期格式：${schema.dateFormats.join(" 或 ")}`,
    "",
    "## 枚举字段",
    "",
    "| 字段 | 允许值 |",
    "|---|---|",
    ...Object.entries(schema.enumOptions).map(([name, values]) => `| ${name} | ${values.join("、")} |`),
    "",
    "## 可选程序",
    "",
    schema.optionalProcedures.map((id) => `- ${id}`).join("\n"),
    "",
    "## 全部字段与默认值",
    "",
    "| 字段 | 默认值 |",
    "|---|---|",
    ...schema.fields.map((field) => `| ${field.name} | ${markdownCell(JSON.stringify(field.defaultValue))} |`),
  ].join("\n");
  return outputValue(markdown, options);
}

function procedureMatches(item, category, query) {
  if (!query) return true;
  const haystack = [category.title, category.summary, item.title, item.summary, item.timing, ...item.conditions, ...item.steps, ...item.evidence, ...item.remedies, ...item.basis].join("\n").toLocaleLowerCase("zh-CN");
  return haystack.includes(query.toLocaleLowerCase("zh-CN"));
}

async function commandProcedures(options) {
  const query = typeof options.query === "string" ? options.query.trim() : "";
  const matches = procedureCategories.flatMap((category) => category.items
    .filter((item) => procedureMatches(item, category, query))
    .map((item) => ({ category: { id: category.id, no: category.no, title: category.title }, ...item })));
  if ((options.format ?? "markdown") === "json") return outputValue({ query, count: matches.length, results: matches }, options, "json");
  if (!query) {
    const index = procedureCategories.flatMap((category) => [
      `## ${category.no} ${category.title}`,
      "",
      category.items.map((item) => `- ${item.title}：${item.summary}`).join("\n"),
      "",
    ]).join("\n");
    return outputValue(`# 刑事程序目录\n\n共 ${matches.length} 个程序项目。使用 \`--query 关键词\` 查看详情。\n\n${index}`, options);
  }
  const body = matches.map((item) => [
    `## ${item.title}`,
    "",
    `- 所属阶段：${item.category.no} ${item.category.title}`,
    `- 概要：${item.summary}`,
    `- 时机：${item.timing}`,
    `- 条件：${item.conditions.join("；")}`,
    `- 步骤：${item.steps.join("；")}`,
    `- 证据：${item.evidence.join("；")}`,
    `- 救济：${item.remedies.join("；")}`,
    `- 依据：${item.basis.join("；")}`,
  ].join("\n")).join("\n\n");
  return outputValue(`# 程序查询：${query}\n\n命中 ${matches.length} 项。\n\n${body || "未找到匹配项目。"}`, options);
}

function lineSnippet(line, query) {
  const compact = line.trim();
  const index = compact.toLocaleLowerCase("zh-CN").indexOf(query.toLocaleLowerCase("zh-CN"));
  if (index < 0) return clip(compact, 300);
  const start = Math.max(0, index - 90);
  const end = Math.min(compact.length, index + query.length + 170);
  return `${start > 0 ? "…" : ""}${compact.slice(start, end)}${end < compact.length ? "…" : ""}`;
}

async function commandSearchLaw(options) {
  const query = requireString(options, "query").trim();
  const parsedLimit = Number(options.limit ?? 10);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) throw new Error("--limit 必须是 1 到 100 的整数");
  const manifest = await loadManifest();
  const results = [];
  for (const entry of manifest) {
    const file = path.join(legalDir, entry.filename);
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length && results.length < parsedLimit; index += 1) {
      if (!lines[index].toLocaleLowerCase("zh-CN").includes(query.toLocaleLowerCase("zh-CN"))) continue;
      results.push({
        documentId: entry.id,
        title: entry.title,
        authority: entry.authority,
        coverage: entry.coverage,
        checkedAt: entry.checked_at,
        sourceUrl: entry.source_url,
        sourceNote: entry.source_note || "",
        line: index + 1,
        snippet: lineSnippet(lines[index], query),
      });
    }
    if (results.length >= parsedLimit) break;
  }
  const result = { query, limit: parsedLimit, count: results.length, results };
  if ((options.format ?? "markdown") === "json") return outputValue(result, options, "json");
  const body = results.map((item, index) => [
    `## ${index + 1}. ${item.title}`,
    "",
    `- 发布机关：${item.authority}`,
    `- 覆盖范围：${item.coverage}`,
    `- 本地核验日期：${item.checkedAt}`,
    `- 来源：${item.sourceUrl}`,
    `- 文本位置：第 ${item.line} 行`,
    item.sourceNote ? `- 来源提示：${item.sourceNote}` : "",
    "",
    `> ${item.snippet}`,
  ].filter(Boolean).join("\n")).join("\n\n");
  return outputValue(`# 法条检索：${query}\n\n命中 ${results.length} 处（上限 ${parsedLimit}）。\n\n${body || "未找到匹配文本。"}`, options);
}

async function commandVerifyCorpus(options) {
  const manifest = await loadManifest();
  const failures = [];
  for (const entry of manifest) {
    const content = await readFile(path.join(legalDir, entry.filename));
    const actual = createHash("sha256").update(content).digest("hex");
    if (actual !== entry.sha256) failures.push({ id: entry.id, expected: entry.sha256, actual });
  }
  const result = { valid: failures.length === 0, documents: manifest.length, failures };
  if ((options.format ?? "json") === "markdown") {
    return outputValue(`# 法条库完整性校验\n\n${result.valid ? `通过：${result.documents} 份文本哈希一致。` : `失败：${failures.length} 份文本不一致。`}`, options);
  }
  return outputValue(result, options, "json");
}

function helpText() {
  return `刑事诉讼期限管理 Skill\n\n用法：\n  deadline-cli.mjs init --output FILE [--perspective ROLE] [--force]\n  deadline-cli.mjs validate --input FILE [--format markdown|json] [--output FILE]\n  deadline-cli.mjs calculate --input FILE [--scope focus|urgent|all] [--hide-waiting] [--include-law-text] [--format markdown|json] [--output FILE]\n  deadline-cli.mjs schema [--format markdown|json] [--output FILE]\n  deadline-cli.mjs procedures [--query TEXT] [--format markdown|json] [--output FILE]\n  deadline-cli.mjs search-law --query TEXT [--limit 10] [--format markdown|json] [--output FILE]\n  deadline-cli.mjs verify-corpus [--format markdown|json]\n\n角色 ROLE：victimAgent、suspectDefendant、defender\n`;
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === "help" || command === "--help" || command === "-h") return process.stdout.write(helpText());
  if (command === "init") return commandInit(options);
  if (command === "validate") return commandValidate(options);
  if (command === "calculate") return commandCalculate(options);
  if (command === "schema") return commandSchema(options);
  if (command === "procedures") return commandProcedures(options);
  if (command === "search-law") return commandSearchLaw(options);
  if (command === "verify-corpus") return commandVerifyCorpus(options);
  throw new Error(`未知命令：${command}\n\n${helpText()}`);
}

main().catch((error) => {
  process.stderr.write(`错误：${error.message}\n`);
  process.exitCode = 1;
});
