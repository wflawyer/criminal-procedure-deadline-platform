import test from "node:test";
import assert from "node:assert/strict";
import { addDays, addMonthsClamped, adjustNonCustodyDeadline, buildDeadlines, getDefaultInputs, parseLocalDate, toDateKey, validateCaseInputs } from "../lib/deadlines.ts";

test("日期解析拒绝不存在的日期和越界时分", () => {
  assert.equal(parseLocalDate("2026-02-29"), null);
  assert.equal(parseLocalDate("2026-04-31"), null);
  assert.equal(parseLocalDate("2026-07-09T24:00"), null);
  assert.equal(toDateKey(parseLocalDate("2026-02-28")!), "2026-02-28");
});

test("非羁押期限末日遇2026年周末顺延", () => {
  const raw = addDays(parseLocalDate("2026-07-09")!, 3);
  assert.equal(toDateKey(raw), "2026-07-12");
  assert.equal(toDateKey(adjustNonCustodyDeadline(raw)), "2026-07-13");
});

test("刑事立案审查按3日、7日、30日分别计算", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-10T10:00")!);
  input.reportDate = "2026-07-09";
  input.criminalReviewStartDate = "2026-07-09";
  input.criminalReviewTrack = "ordinary";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "filing-review")!.due!), "2026-07-13");
  input.criminalReviewTrack = "verify";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "filing-review")!.due!), "2026-07-16");
  input.criminalReviewTrack = "major";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "filing-review")!.due!), "2026-08-10");
});

test("24小时鉴定委托按具体时分计算", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-11T00:00")!);
  input.optionalProcedures = ["appraisal"];
  input.asOf = "2026-07-11T00:00";
  input.acceptedAt = "2026-07-09T23:00";
  const item = buildDeadlines(input).find((x) => x.id === "appraisal-commission")!;
  assert.equal(item.dateText, "2026-07-10 23:00");
  assert.equal(item.status, "overdue");
  assert.match(item.statusText, /期限已届满/);
  assert.match(item.statusText, /1小时/);
});

test("羁押期限不因周末顺延", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-13T10:00")!);
  input.detentionAt = "2026-07-09T10:00";
  input.detentionTrack = "ordinary10";
  const item = buildDeadlines(input).find((x) => x.id === "detention-cap")!;
  assert.equal(toDateKey(item.rawDue!), "2026-07-19");
  assert.equal(toDateKey(item.due!), "2026-07-19");
});

test("仅录入拘留时间即可按拘留和侦查羁押路径预测审查起诉", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-15T10:00")!);
  input.perspective = "suspectDefendant";
  input.detentionAt = "2026-05-08T18:45";
  input.detentionTrack = "major37";
  input.custodyTrack = "base2";
  const items = buildDeadlines(input);
  const custody = items.find((x) => x.id === "custody-cap")!;
  const transfer = items.find((x) => x.id === "prosecution-transfer-forecast")!;
  const prosecution = items.find((x) => x.id === "prosecution-decision")!;
  assert.equal(toDateKey(custody.due!), "2026-08-14");
  assert.equal(toDateKey(transfer.due!), "2026-08-14");
  assert.equal(toDateKey(prosecution.due!), "2026-09-14");
  assert.equal(transfer.status, "projected");
  assert.equal(prosecution.status, "projected");
  assert.equal(transfer.provisional, true);
});

test("实际逮捕时间覆盖拘留推算并继续预测审查起诉和一审", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-15T10:00")!);
  input.perspective = "defender";
  input.detentionAt = "2026-05-08T18:45";
  input.detentionTrack = "major37";
  input.arrestDate = "2026-06-08T19:00";
  input.custodyTrack = "base2";
  input.prosecutionTrack = "ordinary";
  input.trialTrack = "ordinary2";
  const items = buildDeadlines(input);
  assert.equal(toDateKey(items.find((x) => x.id === "prosecution-transfer-forecast")!.due!), "2026-08-08");
  assert.equal(toDateKey(items.find((x) => x.id === "prosecution-decision")!.due!), "2026-09-08");
  assert.equal(toDateKey(items.find((x) => x.id === "court-acceptance")!.due!), "2026-09-15");
  assert.equal(toDateKey(items.find((x) => x.id === "trial")!.due!), "2026-11-16");
  assert.equal(items.find((x) => x.id === "trial")!.status, "projected");
});

test("延押未批准时保留当前2个月届满日并单独显示条件预测", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-01T10:00")!);
  input.perspective = "defender";
  input.arrestDate = "2026-01-15T09:00";
  input.custodyTrack = "special5";
  const items = buildDeadlines(input);
  const current = items.find((x) => x.id === "custody-cap")!;
  const conditional = items.find((x) => x.id === "custody-conditional-cap")!;
  assert.equal(toDateKey(current.due!), "2026-03-15");
  assert.equal(toDateKey(conditional.due!), "2026-06-15");
  assert.equal(conditional.status, "projected");
  assert.match(conditional.summary, /不是当前已生效/);
  assert.equal(items.find((x) => x.id === "custody-extension-2-request")!.provisional, true);
  assert.equal(items.find((x) => x.id === "custody-extension-2-request")!.status, "projected");
  assert.match(items.find((x) => x.id === "custody-extension-2-request")!.note ?? "", /首次延押尚未依法生效/);
  const issues = validateCaseInputs(input).map((issue) => issue.id);
  assert.ok(issues.includes("custody-first-approval-missing"));
  assert.ok(issues.includes("custody-second-ground-missing"));
  assert.ok(issues.includes("custody-second-approval-missing"));
});

test("未录入实际逮捕日时延押批准只作条件记录，不改变预测基础期限", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-01T10:00")!);
  input.perspective = "defender";
  input.detentionAt = "2026-01-01T09:00";
  input.detentionTrack = "major37";
  input.custodyTrack = "complex3";
  input.custodyFirstExtensionConditionsConfirmed = true;
  input.custodyFirstExtensionRequestedDate = "2026-03-01";
  input.custodyFirstExtensionApprovedDate = "2026-03-05";
  const items = buildDeadlines(input);
  const current = items.find((x) => x.id === "custody-cap")!;
  assert.match(current.title, /预测的逮捕后侦查羁押期限：基础2个月/);
  assert.equal(current.provisional, true);
  assert.equal(toDateKey(current.due!), "2026-04-07");
  assert.ok(validateCaseInputs(input).some((issue) => issue.id === "custody-extension-without-arrest-base"));
});

test("三层延押均获批时按同一逮捕起点计算3、5、7个月", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-01T10:00")!);
  input.perspective = "defender";
  input.arrestDate = "2026-01-15T09:00";
  input.custodyTrack = "ten7";
  input.custodyFirstExtensionConditionsConfirmed = true;
  input.custodyFirstExtensionRequestedDate = "2026-03-08";
  input.custodyFirstExtensionApprovedDate = "2026-03-14";
  input.custodySpecialGround = "crimeGroup";
  input.custodySecondExtensionRequestedDate = "2026-04-08";
  input.custodySecondExtensionApprovedDate = "2026-04-14";
  input.custodyTenYearEligible = true;
  input.custodyThirdExtensionRequestedDate = "2026-06-08";
  input.custodyThirdExtensionApprovedDate = "2026-06-14";
  const items = buildDeadlines(input);
  assert.equal(toDateKey(items.find((x) => x.id === "custody-extension-1-request")!.due!), "2026-03-08");
  assert.equal(toDateKey(items.find((x) => x.id === "custody-extension-2-request")!.due!), "2026-04-08");
  assert.equal(toDateKey(items.find((x) => x.id === "custody-extension-3-request")!.due!), "2026-06-08");
  assert.equal(toDateKey(items.find((x) => x.id === "custody-cap")!.due!), "2026-08-15");
  assert.equal(items.some((x) => x.id === "custody-conditional-cap"), false);
  const issues = validateCaseInputs(input).map((issue) => issue.id);
  assert.equal(issues.some((id) => id.startsWith("custody-") && id.endsWith("-missing")), false);
});

test("发现另有重要罪行按5日内报批，批准后从发现日重新起算且旧批准不带入", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-02T10:00")!);
  input.perspective = "suspectDefendant";
  input.arrestDate = "2026-01-15T09:00";
  input.custodyFirstExtensionConditionsConfirmed = true;
  input.custodyFirstExtensionRequestedDate = "2026-01-25";
  input.custodyFirstExtensionApprovedDate = "2026-01-30";
  input.custodyAdditionalCrimeDiscoveredDate = "2026-02-01";
  input.custodyRecalculationReportedDate = "2026-02-04";
  input.custodyRecalculationApprovedDate = "2026-02-05";
  const items = buildDeadlines(input);
  assert.equal(toDateKey(items.find((x) => x.id === "custody-recalculation-report")!.due!), "2026-02-06");
  assert.equal(items.find((x) => x.id === "custody-recalculation-approval")!.dateText, "2026-02-05");
  assert.equal(toDateKey(items.find((x) => x.id === "custody-cap")!.due!), "2026-04-01");
  assert.match(items.find((x) => x.id === "custody-cap")!.title, /2个月/);
  assert.match(items.find((x) => x.id === "custody-cap")!.note ?? "", /旧周期的延押批准不会自动带入/);
});

test("特别重大复杂案件获批后不编造统一延期日且停止跨阶段日期预测", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-01T10:00")!);
  input.perspective = "defender";
  input.arrestDate = "2026-01-15T09:00";
  input.custodyTrack = "npcSpecial";
  input.custodySpecialPostponementApprovedDate = "2026-03-10";
  const items = buildDeadlines(input);
  const special = items.find((x) => x.id === "custody-special-postponement")!;
  assert.equal(special.due, null);
  assert.equal(special.noFixed, true);
  assert.equal(special.status, "done");
  assert.equal(special.dateText, "2026-03-10");
  assert.match(special.summary, /批准决定载明的内容/);
  assert.equal(items.some((x) => x.id === "prosecution-transfer-forecast"), false);
});

test("真实收案和法院受理时间逐级覆盖跨阶段预测", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-15T10:00")!);
  input.detentionAt = "2026-05-08T18:45";
  input.arrestDate = "2026-06-08T19:00";
  input.prosecutionReceivedDate = "2026-07-10";
  input.trialTrack = "ordinary2";
  let items = buildDeadlines(input);
  assert.equal(items.some((x) => x.id === "prosecution-transfer-forecast"), false);
  assert.equal(items.find((x) => x.id === "prosecution-decision")!.provisional, false);
  assert.equal(toDateKey(items.find((x) => x.id === "prosecution-decision")!.due!), "2026-08-10");
  input.courtReceivedDate = "2026-08-20";
  items = buildDeadlines(input);
  assert.equal(items.find((x) => x.id === "trial")!.provisional, false);
  assert.equal(toDateKey(items.find((x) => x.id === "trial")!.due!), "2026-10-20");
});

test("自诉和仅有立案日的非羁押侦查不生成公诉跨阶段预测", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-15T10:00")!);
  input.criminalFiledDate = "2026-07-01";
  let items = buildDeadlines(input);
  assert.equal(items.some((x) => x.id === "prosecution-transfer-forecast"), false);
  assert.equal(items.find((x) => x.id === "prosecution-decision")!.due, null);
  input.caseRoute = "private";
  input.detentionAt = "2026-07-02T10:00";
  items = buildDeadlines(input);
  assert.equal(items.some((x) => x.id === "prosecution-transfer-forecast"), false);
  assert.equal(items.some((x) => x.id === "prosecution-decision"), false);
});

test("按月期间遇月末取该月最后一日", () => {
  assert.equal(toDateKey(addMonthsClamped(parseLocalDate("2026-01-31")!, 1)), "2026-02-28");
});

test("立案满3个月只生成监督触发而不作休假日顺延", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-13T10:00")!);
  input.criminalFiledDate = "2026-04-12";
  const item = buildDeadlines(input).find((x) => x.id === "investigation-supervision-trigger")!;
  assert.equal(toDateKey(item.due!), "2026-07-12");
  assert.equal(item.status, "trigger");
  assert.match(item.lawText, /催办函/);
});

test("普通一审2个月与3个月由用户明确选择而不混成一个期限", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-13T10:00")!);
  input.courtReceivedDate = "2026-07-09";
  input.trialTrack = "ordinary2";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "trial")!.due!), "2026-09-09");
  input.trialTrack = "ordinary3";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "trial")!.due!), "2026-10-09");
});

test("刑事鉴定告知不虚构统一固定日数", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-13T10:00")!);
  input.optionalProcedures = ["appraisal"];
  const item = buildDeadlines(input).find((x) => x.id === "appraisal-notice")!;
  assert.equal(item.due, null);
  assert.equal(item.dateText, "无统一固定日数");
});

test("取保候审12个月和监视居住6个月只向嫌疑人或辩护人展示", () => {
  const victim = getDefaultInputs(parseLocalDate("2026-07-13T10:00")!);
  victim.bailStartDate = "2026-01-31";
  assert.equal(buildDeadlines(victim).some((x) => x.id === "bail-cap"), false);
  victim.perspective = "defender";
  const items = buildDeadlines(victim);
  assert.equal(toDateKey(items.find((x) => x.id === "bail-cap")!.due!), "2027-01-31");
  assert.ok(items.some((x) => x.id === "residential-cap"));
});

test("羁押必要性审查按阶段区分3日和10日", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.custodyNecessityApplicationDate = "2026-07-10";
  input.custodyNecessityTrack = "investigation3";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "custody-necessity")!.due!), "2026-07-13");
  input.custodyNecessityTrack = "procuratorate10";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "custody-necessity")!.due!), "2026-07-20");
});

test("补充侦查重报后自动重新计算审查起诉期限", () => {
  const input = getDefaultInputs(parseLocalDate("2026-09-15T10:00")!);
  input.prosecutionReceivedDate = "2026-07-06";
  input.prosecutionTrack = "ordinary";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "prosecution-decision")!.due!), "2026-08-06");
  input.supplement1ResubmittedDate = "2026-08-10";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "prosecution-decision")!.due!), "2026-09-10");
  input.supplement2ResubmittedDate = "2026-09-14";
  const restarted = buildDeadlines(input).find((x) => x.id === "prosecution-decision")!;
  assert.equal(toDateKey(restarted.due!), "2026-10-14");
  assert.match(restarted.title, /第二次补侦重报后重新计算/);
  assert.match(restarted.lawText, /补充侦查完毕移送人民检察院后/);
});

test("重大复杂审查起诉分别显示1个月基本节点和延长后15日节点", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-20T10:00")!);
  input.prosecutionReceivedDate = "2026-07-06";
  input.prosecutionTrack = "major";
  const items = buildDeadlines(input);
  const extension = items.find((x) => x.id === "prosecution-extension")!;
  const decision = items.find((x) => x.id === "prosecution-decision")!;
  assert.equal(toDateKey(extension.due!), "2026-08-06");
  assert.equal(toDateKey(decision.due!), "2026-08-21");
  assert.match(extension.summary, /重大、复杂且一个月内不能作出决定/);
  assert.match(decision.lawText, /第三百五十一条/);
});

test("改变管辖后从新检察院收案日重新计算审查起诉期限", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-25T10:00")!);
  input.prosecutionReceivedDate = "2026-07-06";
  input.prosecutionChangedJurisdictionReceivedDate = "2026-07-20";
  input.prosecutionTrack = "ordinary";
  const decision = buildDeadlines(input).find((x) => x.id === "prosecution-decision")!;
  assert.equal(toDateKey(decision.due!), "2026-08-20");
  assert.match(decision.title, /改变管辖后重新计算/);
  assert.match(decision.note ?? "", /变更后的人民检察院实际收案日/);
});

test("已退回补充侦查但尚未重报时停止向法院继续预测", () => {
  const input = getDefaultInputs(parseLocalDate("2026-08-20T10:00")!);
  input.prosecutionReceivedDate = "2026-07-06";
  input.supplement1ReturnedDate = "2026-08-01";
  const items = buildDeadlines(input);
  assert.equal(items.find((x) => x.id === "prosecution-decision")!.status, "done");
  assert.equal(items.find((x) => x.id === "court-acceptance")!.due, null);
  assert.equal(items.find((x) => x.id === "trial")!.due, null);
});

test("未添加单独程序时不生成占位节点，添加后立即参与计算", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "defender";
  let items = buildDeadlines(input);
  assert.equal(items.some((x) => x.id === "custody-necessity"), false);
  assert.equal(items.some((x) => x.id === "recusal-decision"), false);
  input.optionalProcedures = ["custodyNecessity", "investigationRecusal"];
  items = buildDeadlines(input);
  assert.ok(items.some((x) => x.id === "custody-necessity"));
  assert.ok(items.some((x) => x.id === "recusal-decision"));
  assert.equal(items.find((x) => x.id === "custody-necessity")?.status, "waiting");
});

test("公安侦查人员回避按2／5日决定和5日复议节点计算", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "defender";
  input.optionalProcedures = ["investigationRecusal"];
  input.recusalApplicationDate = "2026-07-13";
  input.recusalDecisionTrack = "ordinary2";
  input.recusalRejectedReceivedDate = "2026-07-15";
  input.recusalReviewApplicationDate = "2026-07-20";
  const items = buildDeadlines(input);
  assert.equal(toDateKey(items.find((x) => x.id === "recusal-decision")!.due!), "2026-07-15");
  assert.equal(toDateKey(items.find((x) => x.id === "recusal-review-apply")!.due!), "2026-07-20");
  assert.equal(toDateKey(items.find((x) => x.id === "recusal-review-decision")!.due!), "2026-07-27");
  assert.match(items.find((x) => x.id === "recusal-decision")!.lawText, /第三十六条/);
});

test("被害人和被告人的判后期限按角色隔离", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.judgmentReceivedDate = "2026-07-10";
  let items = buildDeadlines(input);
  assert.ok(items.some((x) => x.id === "victim-protest"));
  assert.equal(items.some((x) => x.id === "appeal"), false);
  input.perspective = "suspectDefendant";
  items = buildDeadlines(input);
  assert.equal(items.some((x) => x.id === "victim-protest"), false);
  assert.equal(toDateKey(items.find((x) => x.id === "appeal")!.due!), "2026-07-20");
});

test("自诉路径隐藏公诉专属节点并向自诉人显示上诉权", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.caseRoute = "private";
  input.privateProsecutionSubmittedDate = "2026-07-01";
  input.privateProsecutionAcceptedDate = "2026-07-10";
  input.judgmentReceivedDate = "2026-07-10";
  const items = buildDeadlines(input);
  assert.ok(items.some((x) => x.id === "private-acceptance"));
  assert.ok(items.some((x) => x.id === "appeal"));
  assert.equal(items.some((x) => x.id === "prosecution-decision"), false);
  assert.equal(items.some((x) => x.id === "court-acceptance"), false);
  assert.equal(items.some((x) => x.id === "victim-protest"), false);
});

test("附带民事原告人可见仅限附带民事部分的上诉节点", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.judgmentReceivedDate = "2026-07-10";
  input.incidentalCivilSubmittedDate = "2026-06-01";
  const item = buildDeadlines(input).find((x) => x.id === "appeal")!;
  assert.ok(item);
  assert.match(item.action, /只能就附带民事部分/);
});

test("开庭前倒算的10日与3日节点不向后顺延", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-01T10:00")!);
  input.perspective = "defender";
  input.hearingDate = "2026-07-13";
  const items = buildDeadlines(input);
  assert.equal(toDateKey(items.find((x) => x.id === "indictment-service")!.due!), "2026-07-03");
  assert.equal(toDateKey(items.find((x) => x.id === "hearing-notice")!.due!), "2026-07-10");
});

test("简易程序一个半月按一个月再加十五日计算", () => {
  const input = getDefaultInputs(parseLocalDate("2026-02-01T10:00")!);
  input.courtReceivedDate = "2026-01-31";
  input.trialTrack = "summary45";
  const item = buildDeadlines(input).find((x) => x.id === "trial")!;
  assert.equal(toDateKey(item.rawDue!), "2026-03-15");
  assert.equal(toDateKey(item.due!), "2026-03-16");
  assert.match(item.note ?? "", /一个月再加十五日/);
});

test("嫌疑人和辩护人可见三阶段辩护权告知节点", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.perspective = "defender";
  input.defenseRightTriggerAt = "2026-07-09T10:00";
  input.prosecutionReceivedDate = "2026-07-10";
  input.courtReceivedDate = "2026-07-11";
  const items = buildDeadlines(input);
  assert.ok(items.some((x) => x.id === "defense-right-investigation"));
  assert.ok(items.some((x) => x.id === "prosecution-defense-rights"));
  assert.ok(items.some((x) => x.id === "court-defense-rights"));
});

test("不起诉申诉复查按立案复查日计算3或6个月", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.nonProsecutionReviewFiledDate = "2026-07-10";
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "non-prosecution-review")!.due!), "2026-10-10");
  input.nonProsecutionReviewExtended = true;
  assert.equal(toDateKey(buildDeadlines(input).find((x) => x.id === "non-prosecution-review")!.due!), "2027-01-11");
});

test("二审、再审、交付执行和涉财产执行均可计算", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.secondInstanceReceivedDate = "2026-07-10";
  input.secondInstanceTrack = "special4";
  input.retrialDecisionDate = "2026-07-10";
  input.retrialExtended = true;
  input.effectiveJudgmentDate = "2026-07-10";
  input.propertyExecutionTransferredDate = "2026-07-10";
  input.propertyExecutionFiledDate = "2026-07-17";
  const items = buildDeadlines(input);
  assert.equal(toDateKey(items.find((x) => x.id === "second-instance")!.due!), "2026-11-10");
  assert.equal(toDateKey(items.find((x) => x.id === "retrial")!.due!), "2027-01-11");
  assert.equal(toDateKey(items.find((x) => x.id === "execution-documents")!.due!), "2026-07-20");
  assert.equal(toDateKey(items.find((x) => x.id === "property-execution-file")!.due!), "2026-07-17");
  assert.equal(toDateKey(items.find((x) => x.id === "property-execution-complete")!.due!), "2027-01-18");
});

test("涉财产执行特殊延长不编造统一期满日", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.propertyExecutionFiledDate = "2026-07-10";
  input.propertyExecutionExtended = true;
  const item = buildDeadlines(input).find((x) => x.id === "property-execution-complete")!;
  assert.equal(item.due, null);
  assert.match(item.note ?? "", /未给延长的统一上限/);
});

test("所有角色可见计算节点均含法条原文", () => {
  for (const perspective of ["victimAgent", "suspectDefendant", "defender"] as const) {
    const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
    input.perspective = perspective;
    for (const item of buildDeadlines(input)) assert.ok(item.lawText.length > 20, `${perspective}/${item.id}缺少原文`);
  }
});

test("输入校验识别日期倒置、分支冲突和跨年度日历风险", () => {
  const input = getDefaultInputs(parseLocalDate("2026-07-14T10:00")!);
  input.incidentDate = "2026-07-10";
  input.reportDate = "2026-07-09";
  input.criminalFiledDate = "2027-01-02";
  input.noCaseDecisionDate = "2026-07-13";
  const ids = validateCaseInputs(input).map((x) => x.id);
  assert.ok(ids.includes("report-before-incident"));
  assert.ok(ids.includes("filed-and-no-case"));
  assert.ok(ids.includes("holiday-calendar-outside-2026"));
});

test("延押校验识别逾期提请、前序批准缺失和重新计算逾期报批", () => {
  const input = getDefaultInputs(parseLocalDate("2026-04-01T10:00")!);
  input.arrestDate = "2026-01-15T09:00";
  input.custodyTrack = "special5";
  input.custodyFirstExtensionRequestedDate = "2026-03-28";
  input.custodySecondExtensionApprovedDate = "2026-04-14";
  input.custodyAdditionalCrimeDiscoveredDate = "2026-02-01";
  input.custodyRecalculationReportedDate = "2026-02-10";
  input.custodyRecalculationApprovedDate = "2026-02-10";
  const ids = validateCaseInputs(input).map((issue) => issue.id);
  assert.ok(ids.includes("custody-first-request-late"));
  assert.ok(ids.includes("custody-second-without-first"));
  assert.ok(ids.includes("custody-recalculation-report-late"));
  assert.equal(ids.includes("custody-recalculation-approval-late"), false);
});

test("延押材料即使路径仍为基础2个月也执行逐层校验", () => {
  const input = getDefaultInputs(parseLocalDate("2026-04-01T10:00")!);
  input.arrestDate = "2026-01-15T09:00";
  input.custodyTrack = "base2";
  input.custodySecondExtensionRequestedDate = "2026-04-01";
  input.custodySecondExtensionApprovedDate = "2026-04-10";
  const ids = validateCaseInputs(input).map((issue) => issue.id);
  assert.ok(ids.includes("custody-first-conditions-unconfirmed"));
  assert.ok(ids.includes("custody-first-approval-missing"));
  assert.ok(ids.includes("custody-second-ground-missing"));
  assert.ok(ids.includes("custody-second-request-without-first"));
  assert.ok(ids.includes("custody-second-without-first"));
  assert.ok(ids.includes("custody-approval-track-mismatch"));
});
