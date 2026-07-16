import test from "node:test";
import assert from "node:assert/strict";
import { buildDeadlines, getDefaultInputs, parseLocalDate } from "../lib/deadlines.ts";
import { filterDeadlinesByRoleScope, getRoleStats, isRoleFocus, roleViewConfigs } from "../lib/role-views.ts";

test("三类角色具有不同的首页说明和录入策略", () => {
  assert.equal(roleViewConfigs.victimAgent.headline, "掌握办案期限，及时行使被害人权利");
  assert.equal(roleViewConfigs.suspectDefendant.headline, "掌握羁押期限，及时行使诉讼权利");
  assert.equal(roleViewConfigs.defender.headline, "掌握程序期限，及时开展辩护工作");
  assert.ok(Object.values(roleViewConfigs).every((config) => !config.headline.includes("\n")));
  assert.notEqual(roleViewConfigs.victimAgent.inputTitle, roleViewConfigs.defender.inputTitle);
  assert.match(roleViewConfigs.suspectDefendant.eyebrow, /辩护与救济/);
  assert.doesNotMatch(`${roleViewConfigs.suspectDefendant.eyebrow}${roleViewConfigs.suspectDefendant.description}`, /本人上诉/);
});

test("被害人重点时间线包含立案监督但排除羁押办理细节", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.detentionAt = "2026-07-09T10:00";
  const deadlines = buildDeadlines(input);
  const focus = filterDeadlinesByRoleScope(deadlines, "victimAgent", "focus");
  assert.ok(focus.some((item) => item.id === "filing-review"));
  assert.ok(focus.some((item) => item.id === "victim-protest"));
  assert.equal(focus.some((item) => item.id === "detention-cap"), false);
});

test("嫌疑人／被告人重点时间线包含羁押和上诉救济但排除立案监督", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "suspectDefendant";
  input.detentionAt = "2026-07-09T10:00";
  input.judgmentReceivedDate = "2026-07-10";
  const focus = filterDeadlinesByRoleScope(buildDeadlines(input), input.perspective, "focus");
  assert.ok(focus.some((item) => item.id === "detention-cap"));
  assert.ok(focus.some((item) => item.id === "appeal"));
  assert.equal(focus.some((item) => item.id === "filing-review"), false);
});

test("辩护人重点时间线额外覆盖权利受阻控告", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "defender";
  input.optionalProcedures = ["rightsObstruction"];
  const deadlines = buildDeadlines(input);
  const rights = deadlines.find((item) => item.id === "rights-obstruction")!;
  assert.equal(isRoleFocus(rights, "defender"), true);
  assert.equal(isRoleFocus(rights, "suspectDefendant"), false);
});

test("延押提请、批准和条件预测进入嫌疑人与辩护人重点时间线", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-01T10:00")!);
  input.perspective = "defender";
  input.arrestDate = "2026-01-15T09:00";
  input.custodyTrack = "complex3";
  const focus = filterDeadlinesByRoleScope(buildDeadlines(input), input.perspective, "focus");
  assert.ok(focus.some((item) => item.id === "custody-extension-1-request"));
  assert.ok(focus.some((item) => item.id === "custody-extension-1-approval"));
  assert.ok(focus.some((item) => item.id === "custody-conditional-cap"));
});

test("按需新增的公安侦查人员回避进入三类角色重点时间线", () => {
  for (const perspective of ["victimAgent", "suspectDefendant", "defender"] as const) {
    const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
    input.perspective = perspective;
    input.optionalProcedures = ["investigationRecusal"];
    const focus = filterDeadlinesByRoleScope(buildDeadlines(input), perspective, "focus");
    assert.ok(focus.some((item) => item.id === "recusal-decision"));
  }
});

test("紧急筛选和待补录开关可独立工作", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.criminalReviewStartDate = "2026-07-01";
  const deadlines = buildDeadlines(input);
  const urgent = filterDeadlinesByRoleScope(deadlines, input.perspective, "urgent", false);
  assert.ok(urgent.length > 0);
  assert.ok(urgent.every((item) => ["overdue", "expired", "dueSoon", "trigger"].includes(item.status)));
  assert.equal(urgent.some((item) => item.status === "waiting"), false);
});

test("统计卡名称按角色变化而不是共用一套指标", () => {
  const base = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  const victimLabels = getRoleStats(buildDeadlines(base), "victimAgent").map((item) => item.label);
  base.perspective = "suspectDefendant";
  const suspectLabels = getRoleStats(buildDeadlines(base), "suspectDefendant").map((item) => item.label);
  base.perspective = "defender";
  const defenderLabels = getRoleStats(buildDeadlines(base), "defender").map((item) => item.label);
  assert.ok(victimLabels.includes("监督已触发"));
  assert.ok(suspectLabels.includes("羁押／措施在途"));
  assert.ok(defenderLabels.includes("辩护权在途"));
});
