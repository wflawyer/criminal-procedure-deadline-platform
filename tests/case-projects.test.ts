import test from "node:test";
import assert from "node:assert/strict";
import { advanceProjectStatus, createBlankInputs, getNextProcedureDeadline, inferProjectStatus, initialWorkbench, mergeWorkbenches, migrateLegacy, parseWorkbench } from "../lib/case-projects.ts";
import { buildDeadlines, parseLocalDate } from "../lib/deadlines.ts";
import { procedureStageDisplayLabel, procedureStagesForDeadline, visibleInProcedureStage } from "../lib/procedure-stages.ts";

test("首次打开生成不含真实当事人的通用刑事案件", () => {
  const data = initialWorkbench();
  assert.equal(data.version, 2);
  assert.equal(data.projects[0].id, "first-case");
  assert.equal(data.projects[0].inputs.caseName, "新建刑事案件");
  assert.equal(data.projects[0].inputs.incidentDate, "");
});

test("新建案件包含三类角色和纯刑事默认路径", () => {
  const input = createBlankInputs(new Date("2026-07-14T08:00:00+08:00"));
  assert.equal(input.perspective, "victimAgent");
  assert.equal(input.caseRoute, "public");
  assert.equal(input.asOf, "2026-07-14T08:00");
  assert.equal(input.reportDate, "");
  assert.deepEqual(input.optionalProcedures, []);
});

test("默认计算截至时间固定使用中国标准时间", () => {
  assert.equal(createBlankInputs(new Date("2026-07-13T16:30:00.000Z")).asOf, "2026-07-14T00:30");
  assert.equal(createBlankInputs(new Date("2026-07-14T00:30:00.000Z")).asOf, "2026-07-14T08:30");
});

test("旧版单案可迁移且保留已有案件名称和刑事日期", () => {
  const data = migrateLegacy({ caseName: "旧案", asOf: "2026-07-14", reportDate: "2026-07-01", criminalFiledDate: "2026-07-03" });
  assert.equal(data.projects[0].inputs.caseName, "旧案");
  assert.equal(data.projects[0].inputs.asOf, "2026-07-14T00:00");
  assert.equal(data.projects[0].inputs.criminalFiledDate, "2026-07-03");
  assert.equal(data.projects[0].status, "公安侦查");
});

test("导入时过滤无效日期、枚举和旧行政字段", () => {
  const parsed = parseWorkbench({ version: 2, activeProjectId: "x", projects: [{ id: "x", status: "无效", inputs: { caseName: "导入案", reportDate: "2026-02-31", perspective: "无效", adminReviewApplicationDate: "2026-07-01" } }] });
  assert.ok(parsed);
  assert.equal(parsed.projects[0].status, "准备中");
  assert.equal(parsed.projects[0].inputs.reportDate, "");
  assert.equal(parsed.projects[0].inputs.perspective, "victimAgent");
  assert.equal("adminReviewApplicationDate" in parsed.projects[0].inputs, false);
});

test("导入案件只保留受支持的按需程序", () => {
  const parsed = parseWorkbench({ version: 2, activeProjectId: "x", projects: [{ id: "x", status: "公安侦查", inputs: { caseName: "按需程序案", optionalProcedures: ["custodyNecessity", "investigationRecusal", "伪造程序"] } }] })!;
  assert.deepEqual(parsed.projects[0].inputs.optionalProcedures, ["custodyNecessity", "investigationRecusal"]);
});

test("导入保留新的延押路径、法定事由和批准日期", () => {
  const parsed = parseWorkbench({ version: 2, activeProjectId: "x", projects: [{ id: "x", status: "公安侦查", inputs: {
    caseName: "延押导入案", custodyTrack: "ten7", custodySpecialGround: "crimeGroup", custodyTenYearEligible: true,
    custodyFirstExtensionApprovedDate: "2026-03-14", custodySecondExtensionApprovedDate: "2026-04-14", custodyThirdExtensionApprovedDate: "2026-06-14",
    custodyAdditionalCrimeDiscoveredDate: "2026-05-01", custodyRecalculationReportedDate: "2026-05-04", custodyRecalculationApprovedDate: "2026-05-06",
  } }] })!;
  assert.equal(parsed.projects[0].inputs.custodyTrack, "ten7");
  assert.equal(parsed.projects[0].inputs.custodySpecialGround, "crimeGroup");
  assert.equal(parsed.projects[0].inputs.custodyTenYearEligible, true);
  assert.equal(parsed.projects[0].inputs.custodyThirdExtensionApprovedDate, "2026-06-14");
  assert.equal(parsed.projects[0].inputs.custodyRecalculationReportedDate, "2026-05-04");
});

test("旧项目阶段名称迁移到新的纯刑事阶段", () => {
  const parsed = parseWorkbench({ version: 2, activeProjectId: "x", projects: [{ id: "x", status: "检察院阶段", inputs: { caseName: "旧项目" } }] });
  assert.equal(parsed?.projects[0].status, "审查起诉");
});

test("没有有效案件的文件被拒绝", () => {
  assert.equal(parseWorkbench({ version: 2, projects: [] }), null);
  assert.equal(parseWorkbench({ version: 1, projects: [{}] }), null);
});

test("导入文件内重复ID和合并冲突均自动去重", () => {
  const incoming = parseWorkbench({ version: 2, activeProjectId: "first-case", projects: [{ id: "first-case", inputs: { caseName: "A" } }, { id: "first-case", inputs: { caseName: "B" } }] })!;
  assert.equal(new Set(incoming.projects.map((p) => p.id)).size, 2);
  const merged = mergeWorkbenches(initialWorkbench(), incoming);
  assert.equal(merged.projects.length, 3);
  assert.equal(new Set(merged.projects.map((p) => p.id)).size, 3);
});

test("案件卡优先显示当前阶段最紧迫的下一程序节点", () => {
  const input = createBlankInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "suspectDefendant";
  input.detentionAt = "2026-07-10T08:00";
  const next = getNextProcedureDeadline("公安侦查", buildDeadlines(input));
  assert.equal(next?.id, "detention-24");
  assert.equal(next?.status, "overdue");
});

test("当前阶段没有未完成节点时才向后查找后续阶段", () => {
  const input = createBlankInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "suspectDefendant";
  input.courtReceivedDate = "2026-07-10";
  const deadlines = buildDeadlines(input).map((item) => item.stageNo === 4 ? { ...item, status: "done" as const } : item);
  const next = getNextProcedureDeadline("审查起诉", deadlines);
  assert.equal(next?.stageNo, 5);
});

test("已归档案件不再生成下一程序节点", () => {
  const input = createBlankInputs(parseLocalDate("2026-07-14T10:00")!);
  assert.equal(getNextProcedureDeadline("已归档", buildDeadlines(input)), null);
});

test("录入关键时间自动推进案件阶段但不反向回退", () => {
  const input = createBlankInputs(parseLocalDate("2026-07-14T10:00")!);
  assert.equal(inferProjectStatus(input), "准备中");
  input.criminalFiledDate = "2026-07-01";
  assert.equal(advanceProjectStatus("准备中", input), "公安侦查");
  input.prosecutionReceivedDate = "2026-07-10";
  assert.equal(advanceProjectStatus("公安侦查", input), "审查起诉");
  input.courtReceivedDate = "2026-08-01";
  assert.equal(advanceProjectStatus("审查起诉", input), "一审");
  assert.equal(advanceProjectStatus("二审", input), "二审");
  assert.equal(advanceProjectStatus("已归档", input), "已归档");
});

test("公安侦查显示域排除审查起诉和审判期限但保留侦查终结移送", () => {
  const input = createBlankInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "suspectDefendant";
  input.detentionAt = "2026-05-08T18:45";
  input.arrestDate = "2026-06-08";
  const deadlines = buildDeadlines(input);
  const investigationIds = deadlines
    .filter((item) => procedureStagesForDeadline(item).includes("公安侦查"))
    .map((item) => item.id);

  assert.ok(investigationIds.includes("custody-cap"));
  assert.ok(investigationIds.includes("prosecution-transfer-forecast"));
  assert.equal(investigationIds.includes("prosecution-decision"), false);
  assert.equal(investigationIds.includes("court-acceptance"), false);
  assert.equal(investigationIds.includes("trial"), false);
});

test("退回补充侦查同时属于侦查与审查起诉显示域", () => {
  const input = createBlankInputs(parseLocalDate("2026-07-14T10:00")!);
  input.prosecutionReceivedDate = "2026-07-01";
  input.supplement1ReturnedDate = "2026-07-10";
  const supplement = buildDeadlines(input).find((item) => item.id === "supplement-1");
  assert.ok(supplement);
  assert.deepEqual(procedureStagesForDeadline(supplement), ["公安侦查", "审查起诉"]);
});

test("普通审查起诉、一审和二审节点只进入各自阶段", () => {
  assert.deepEqual(procedureStagesForDeadline({ id: "prosecution-decision", stageNo: 4 }), ["审查起诉"]);
  assert.deepEqual(procedureStagesForDeadline({ id: "trial", stageNo: 5 }), ["一审"]);
  assert.deepEqual(procedureStagesForDeadline({ id: "second-instance", stageNo: 6 }), ["二审"]);
});

test("同一组程序节点随查看阶段切换且不混入其他阶段", () => {
  const progress = [
    { id: "detention", visibleStages: ["公安侦查"] as const },
    { id: "supplement", visibleStages: ["公安侦查", "审查起诉"] as const },
    { id: "trial", visibleStages: ["一审"] as const },
    { id: "second-instance", visibleStages: ["二审"] as const },
  ];

  assert.deepEqual(progress.filter((item) => visibleInProcedureStage(item, "公安侦查")).map((item) => item.id), ["detention", "supplement"]);
  assert.deepEqual(progress.filter((item) => visibleInProcedureStage(item, "一审")).map((item) => item.id), ["trial"]);
  assert.deepEqual(progress.filter((item) => visibleInProcedureStage(item, "二审")).map((item) => item.id), ["second-instance"]);
});

test("公安侦查视图将跨阶段边界标为侦查终结或退回补充侦查", () => {
  assert.equal(procedureStageDisplayLabel({ id: "prosecution-transfer-forecast", stage: "审查起诉" }, "公安侦查"), "侦查终结与移送");
  assert.equal(procedureStageDisplayLabel({ id: "supplement-1", stage: "审查起诉" }, "公安侦查"), "退回补充侦查");
  assert.equal(procedureStageDisplayLabel({ id: "supplement-1", stage: "审查起诉" }, "审查起诉"), "审查起诉");
});
