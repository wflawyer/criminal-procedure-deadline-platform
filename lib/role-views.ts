import type { CasePerspective, DeadlineItem } from "./deadlines.ts";

export type TimelineScope = "focus" | "urgent" | "all";

export type RoleViewConfig = {
  eyebrow: string;
  headline: string;
  description: string;
  assessment: string;
  inputTitle: string;
  inputDescription: string;
  inputPriorities: [string, string, string];
  focusLabel: string;
  focusDescription: string;
};

export const roleViewConfigs: Record<CasePerspective, RoleViewConfig> = {
  victimAgent: {
    eyebrow: "机关办理期限 · 被害人救济窗口 · 损失追偿",
    headline: "让诉讼程序和节点可视化",
    description: "默认呈现报案受理、伤情鉴定、刑事立案监督、审查起诉、不起诉申诉、请求抗诉和附带民事等被害人真正需要采取行动的节点。",
    assessment: "重点监测公安、检察院和法院是否按期办理，并防止7日申诉、5日请求抗诉等短期权利窗口失效。",
    inputTitle: "被害人案件关键时间",
    inputDescription: "隐藏强制措施申请、辩护权告知等被追诉方专属录入项；已录数据不会被删除。",
    inputPriorities: ["先录报案、受理和鉴定", "再录立案或不立案结果", "收到决定或判决当天录入送达日"],
    focusLabel: "被害人重点",
    focusDescription: "默认只看机关办理、立案监督和被害人专属救济节点",
  },
  suspectDefendant: {
    eyebrow: "人身自由期限 · 强制措施 · 辩护与救济",
    headline: "掌握羁押期限，及时行使诉讼权利",
    description: "默认呈现拘留、逮捕、侦查羁押、取保候审、监视居住、强制措施变更、审查起诉、审判、上诉及其他程序救济节点。",
    assessment: "重点区分审限与羁押期限，核对每次延长的法定条件，并及时行使辩护、申请、申诉、上诉等相应权利。",
    inputTitle: "嫌疑人／被告人关键时间",
    inputDescription: "隐藏不立案复议、不起诉申诉、请求抗诉和附带民事等被害人专属录入项；已录数据不会被删除。",
    inputPriorities: ["先录实际失去自由的时刻", "再录逮捕、取保或监视居住", "收到起诉书和裁判文书当天录入"],
    focusLabel: "权利重点",
    focusDescription: "默认只看羁押、强制措施、审判和依法救济节点",
  },
  defender: {
    eyebrow: "羁押审查 · 辩护权保障 · 程序异议",
    headline: "掌握程序期限，及时开展辩护工作",
    description: "默认呈现羁押期限、强制措施变更、辩护权告知、权利受阻控告、审查起诉、起诉书送达、审判和上诉等辩护工作节点。",
    assessment: "重点核验羁押与延长审批，及时完成会见阅卷、书面辩护、程序异议和上诉提交。",
    inputTitle: "辩护工作关键时间",
    inputDescription: "隐藏被害人不立案、不起诉、请求抗诉和附带民事专属录入项；已录数据不会被删除。",
    inputPriorities: ["先核对拘留、逮捕和权利告知", "再录阅卷、退补和权利受阻", "开庭与裁判送达日期必须精确"],
    focusLabel: "辩护重点",
    focusDescription: "默认只看羁押、辩护权、审判准备和救济节点",
  },
};

const victimFocusIds = new Set([
  "receipt", "appraisal-commission", "appraisal-result", "appraisal-opinion", "appraisal-document", "appraisal-notice", "appraisal-objection",
  "filing-review", "no-case-service", "no-case-reconsider-apply", "no-case-reconsider-decision", "no-case-review-apply", "no-case-review-decision",
  "prosecutor-explain", "prosecutor-file", "investigation-supervision-trigger", "prosecution-transfer-forecast", "prosecution-rights", "prosecution-extension", "prosecution-decision", "supplement-1", "supplement-2",
  "rights-obstruction", "non-prosecution-appeal", "non-prosecution-review", "court-acceptance", "private-acceptance", "incidental-civil", "hearing-notice",
  "trial", "judgment-service", "victim-protest", "victim-protest-reply", "appeal", "appeal-transfer", "second-instance", "complaint-review", "retrial",
  "execution-documents", "property-execution-file", "property-execution-complete",
  "recusal-decision", "recusal-review-apply", "recusal-review-decision",
]);

const suspectFocusIds = new Set([
  "appraisal-notice", "appraisal-objection", "detention-24", "detention-cap", "arrest-24", "defense-right-investigation",
  "custody-recalculation-report", "custody-recalculation-approval", "custody-extension-1-request", "custody-extension-1-approval", "custody-extension-2-request", "custody-extension-2-approval",
  "custody-extension-3-request", "custody-extension-3-approval", "custody-special-postponement", "custody-cap", "custody-conditional-cap", "bail-cap",
  "residential-cap", "measure-change", "custody-necessity", "prosecution-transfer-forecast", "prosecution-defense-rights", "prosecution-extension", "prosecution-decision", "supplement-1", "supplement-2",
  "court-acceptance", "court-defense-rights", "private-acceptance", "indictment-service", "hearing-notice", "trial", "judgment-service", "appeal",
  "appeal-transfer", "second-instance", "complaint-review", "retrial", "execution-documents", "property-execution-file", "property-execution-complete",
  "recusal-decision", "recusal-review-apply", "recusal-review-decision",
]);

const defenderFocusIds = new Set([
  ...suspectFocusIds,
  "appraisal-result", "appraisal-opinion", "rights-obstruction",
]);

export function isRoleFocus(item: DeadlineItem, perspective: CasePerspective): boolean {
  if (perspective === "victimAgent") return victimFocusIds.has(item.id);
  if (perspective === "suspectDefendant") return suspectFocusIds.has(item.id);
  return defenderFocusIds.has(item.id);
}

const urgentStatuses = new Set(["overdue", "expired", "dueSoon", "trigger"]);

export function filterDeadlinesByRoleScope(deadlines: DeadlineItem[], perspective: CasePerspective, scope: TimelineScope, showWaiting = true): DeadlineItem[] {
  return deadlines.filter((item) => {
    if (!showWaiting && item.status === "waiting") return false;
    if (scope === "all") return true;
    if (scope === "urgent") return urgentStatuses.has(item.status);
    return isRoleFocus(item, perspective);
  });
}

export type RoleStat = { label: string; value: number; tone: "red" | "amber" | "slate" | "green" | "plain" };

const isOpen = (item: DeadlineItem) => item.status !== "done" && item.status !== "waiting";
const isAuthorityLate = (item: DeadlineItem) => item.kind !== "party" && item.status === "overdue";
const isPartyWindow = (item: DeadlineItem) => item.kind === "party" && isOpen(item);
const isCustodyRisk = (item: DeadlineItem) => item.kind === "custody" && isOpen(item);

export function getRoleStats(deadlines: DeadlineItem[], perspective: CasePerspective): RoleStat[] {
  const focus = deadlines.filter((item) => isRoleFocus(item, perspective));
  const waiting = focus.filter((item) => item.status === "waiting").length;
  const done = focus.filter((item) => item.status === "done").length;
  if (perspective === "victimAgent") {
    return [
      { label: "机关期限已届满", value: focus.filter(isAuthorityLate).length, tone: "red" },
      { label: "我的权利窗口", value: focus.filter(isPartyWindow).length, tone: "amber" },
      { label: "监督已触发", value: focus.filter((item) => item.status === "trigger").length, tone: "slate" },
      { label: "已完成", value: done, tone: "green" },
      { label: "待补录", value: waiting, tone: "plain" },
    ];
  }
  if (perspective === "suspectDefendant") {
    return [
      { label: "羁押／措施在途", value: focus.filter(isCustodyRisk).length, tone: "red" },
      { label: "我的权利窗口", value: focus.filter(isPartyWindow).length, tone: "amber" },
      { label: "机关期限已届满", value: focus.filter(isAuthorityLate).length, tone: "slate" },
      { label: "已完成", value: done, tone: "green" },
      { label: "待补录", value: waiting, tone: "plain" },
    ];
  }
  const rightsIds = new Set(["defense-right-investigation", "prosecution-defense-rights", "court-defense-rights", "rights-obstruction", "indictment-service", "hearing-notice"]);
  return [
    { label: "羁押风险节点", value: focus.filter(isCustodyRisk).length, tone: "red" },
    { label: "辩护权在途", value: focus.filter((item) => rightsIds.has(item.id) && isOpen(item)).length, tone: "amber" },
    { label: "当事人期限", value: focus.filter(isPartyWindow).length, tone: "slate" },
    { label: "已完成", value: done, tone: "green" },
    { label: "待补录", value: waiting, tone: "plain" },
  ];
}
