export type CasePerspective = "victimAgent" | "suspectDefendant" | "defender";

export const OPTIONAL_PROCEDURE_IDS = [
  "appraisal", "filingRelief", "nonCustodialMeasures", "custodyNecessity", "investigationRecusal",
  "rightsObstruction", "nonProsecutionRelief", "incidentalCivil", "judgmentRelief", "complaintRetrial", "propertyExecution",
] as const;
export type OptionalProcedureId = typeof OPTIONAL_PROCEDURE_IDS[number];

export type CaseInputs = {
  caseName: string;
  perspective: CasePerspective;
  caseRoute: "public" | "private";
  asOf: string;
  optionalProcedures: OptionalProcedureId[];
  incidentDate: string;
  reportDate: string;
  acceptedAt: string;
  appraisalCommissionAt: string;
  appraisalComplexity: "instant" | "complex" | "functional";
  appraisalOpinionAt: string;
  appraisalDocumentDate: string;
  appraisalServedDate: string;
  injuryLevel: "pending" | "minor" | "light2" | "light1" | "serious" | "death";
  criminalReviewStartDate: string;
  criminalReviewTrack: "ordinary" | "verify" | "major";
  criminalFiledDate: string;
  noCaseDecisionDate: string;
  noCaseNoticeDate: string;
  reconsiderApplicationDate: string;
  reconsiderDecisionDate: string;
  reconsiderExtended: boolean;
  reviewApplicationDate: string;
  reviewDecisionDate: string;
  reviewExtended: boolean;
  prosecutorComplaintDate: string;
  prosecutorFileNoticeDate: string;
  detentionAt: string;
  detentionTrack: "ordinary10" | "special14" | "major37";
  arrestDate: string;
  custodyTrack: "base2" | "complex3" | "special5" | "ten7" | "npcSpecial";
  custodyFirstExtensionConditionsConfirmed: boolean;
  custodyFirstExtensionRequestedDate: string;
  custodyFirstExtensionApprovedDate: string;
  custodySpecialGround: "none" | "remote" | "crimeGroup" | "fugitive" | "broadDifficult";
  custodySecondExtensionRequestedDate: string;
  custodySecondExtensionApprovedDate: string;
  custodyTenYearEligible: boolean;
  custodyThirdExtensionRequestedDate: string;
  custodyThirdExtensionApprovedDate: string;
  custodyAdditionalCrimeDiscoveredDate: string;
  custodyRecalculationReportedDate: string;
  custodyRecalculationApprovedDate: string;
  custodySpecialPostponementApprovedDate: string;
  defenseRightTriggerAt: string;
  defenseRightNoticeAt: string;
  bailStartDate: string;
  bailEndDate: string;
  residentialSurveillanceStartDate: string;
  residentialSurveillanceEndDate: string;
  measureChangeApplicationDate: string;
  measureChangeDecisionDate: string;
  custodyNecessityApplicationDate: string;
  custodyNecessityDecisionDate: string;
  custodyNecessityTrack: "investigation3" | "prosecution3" | "procuratorate10";
  recusalApplicationDate: string;
  recusalDecisionTrack: "ordinary2" | "complex5";
  recusalDecisionDate: string;
  recusalRejectedReceivedDate: string;
  recusalReviewApplicationDate: string;
  recusalReviewDecisionDate: string;
  prosecutionReceivedDate: string;
  prosecutionChangedJurisdictionReceivedDate: string;
  prosecutionTrack: "ordinary" | "major" | "fast10" | "fast15";
  prosecutionRightsNoticeDate: string;
  prosecutionDefenseNoticeDate: string;
  supplement1ReturnedDate: string;
  supplement1ResubmittedDate: string;
  supplement2ReturnedDate: string;
  supplement2ResubmittedDate: string;
  rightsObstructionComplaintDate: string;
  rightsObstructionReplyDate: string;
  nonProsecutionReceivedDate: string;
  nonProsecutionAppealDate: string;
  nonProsecutionReviewFiledDate: string;
  nonProsecutionReviewDecisionDate: string;
  nonProsecutionReviewExtended: boolean;
  courtProsecutionReceivedDate: string;
  courtReceivedDate: string;
  courtDefenseNoticeDate: string;
  privateProsecutionSubmittedDate: string;
  privateProsecutionAcceptedDate: string;
  incidentalCivilSubmittedDate: string;
  incidentalCivilAcceptedDate: string;
  hearingDate: string;
  indictmentReceivedDate: string;
  hearingNoticeReceivedDate: string;
  trialTrack: "ordinary2" | "ordinary3" | "special6" | "summary20" | "summary45" | "fast10" | "fast15" | "private6";
  judgmentAnnouncedDate: string;
  judgmentPronouncementTrack: "inCourt" | "scheduled";
  judgmentReceivedDate: string;
  protestRequestDate: string;
  protestDecisionReceivedDate: string;
  firstDecisionType: "judgment" | "ruling";
  appealFiledDate: string;
  firstCourtTransferredDate: string;
  secondInstanceReceivedDate: string;
  secondInstanceTrack: "ordinary2" | "special4";
  secondJudgmentReceivedDate: string;
  complaintReviewStartedDate: string;
  complaintDecisionDate: string;
  complaintExtended: boolean;
  retrialDecisionDate: string;
  retrialCompletedDate: string;
  retrialExtended: boolean;
  effectiveJudgmentDate: string;
  executionDocumentsDeliveredDate: string;
  propertyExecutionTransferredDate: string;
  propertyExecutionFiledDate: string;
  propertyExecutionCompletedDate: string;
  propertyExecutionExtended: boolean;
};

export type DeadlineStatus = "done" | "overdue" | "dueSoon" | "future" | "waiting" | "expired" | "trigger" | "projected";

export type DeadlineItem = {
  id: string;
  stage: string;
  stageNo: number;
  title: string;
  summary: string;
  basis: string;
  lawText: string;
  action: string;
  due: Date | null;
  rawDue?: Date | null;
  completedAt?: string;
  status: DeadlineStatus;
  statusText: string;
  dateText: string;
  provisional?: boolean;
  kind?: "authority" | "party" | "custody" | "information";
  noFixed?: boolean;
  note?: string;
};

export type CaseInputIssue = {
  id: string;
  severity: "error" | "warning";
  title: string;
  detail: string;
};

const OPTIONAL_PROCEDURE_TRIGGER_FIELDS: Record<OptionalProcedureId, Array<keyof CaseInputs>> = {
  appraisal: ["appraisalCommissionAt", "appraisalOpinionAt", "appraisalDocumentDate", "appraisalServedDate"],
  filingRelief: ["noCaseDecisionDate", "noCaseNoticeDate", "reconsiderApplicationDate", "reconsiderDecisionDate", "reviewApplicationDate", "reviewDecisionDate", "prosecutorComplaintDate", "prosecutorFileNoticeDate"],
  nonCustodialMeasures: ["bailStartDate", "bailEndDate", "residentialSurveillanceStartDate", "residentialSurveillanceEndDate", "measureChangeApplicationDate", "measureChangeDecisionDate"],
  custodyNecessity: ["custodyNecessityApplicationDate", "custodyNecessityDecisionDate"],
  investigationRecusal: ["recusalApplicationDate", "recusalDecisionDate", "recusalRejectedReceivedDate", "recusalReviewApplicationDate", "recusalReviewDecisionDate"],
  rightsObstruction: ["rightsObstructionComplaintDate", "rightsObstructionReplyDate"],
  nonProsecutionRelief: ["nonProsecutionReceivedDate", "nonProsecutionAppealDate", "nonProsecutionReviewFiledDate", "nonProsecutionReviewDecisionDate"],
  incidentalCivil: ["incidentalCivilSubmittedDate", "incidentalCivilAcceptedDate"],
  judgmentRelief: ["protestRequestDate", "protestDecisionReceivedDate", "appealFiledDate", "firstCourtTransferredDate"],
  complaintRetrial: ["complaintReviewStartedDate", "complaintDecisionDate", "retrialDecisionDate", "retrialCompletedDate"],
  propertyExecution: ["propertyExecutionTransferredDate", "propertyExecutionFiledDate", "propertyExecutionCompletedDate"],
};

export function getEnabledOptionalProcedures(input: CaseInputs): OptionalProcedureId[] {
  const enabled = new Set(input.optionalProcedures.filter((id) => OPTIONAL_PROCEDURE_IDS.includes(id)));
  for (const id of OPTIONAL_PROCEDURE_IDS) {
    if (OPTIONAL_PROCEDURE_TRIGGER_FIELDS[id].some((key) => Boolean(input[key]))) enabled.add(id);
  }
  if (input.injuryLevel !== "pending" || input.appraisalComplexity !== "instant") enabled.add("appraisal");
  return [...enabled];
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

const HOLIDAYS_2026 = new Set<string>();
const WORKDAYS_2026 = new Set(["2026-01-04", "2026-02-14", "2026-02-28", "2026-05-09", "2026-09-20", "2026-10-10"]);

function addHolidayRange(start: string, end: string) {
  let cursor = parseLocalDate(start)!;
  const last = parseLocalDate(end)!;
  while (cursor <= last) {
    HOLIDAYS_2026.add(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
}

addHolidayRange("2026-01-01", "2026-01-03");
addHolidayRange("2026-02-15", "2026-02-23");
addHolidayRange("2026-04-04", "2026-04-06");
addHolidayRange("2026-05-01", "2026-05-05");
addHolidayRange("2026-06-19", "2026-06-21");
addHolidayRange("2026-09-25", "2026-09-27");
addHolidayRange("2026-10-01", "2026-10-07");

export function parseLocalDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/.test(value)) return null;
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== year || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day || parsed.getHours() !== hour || parsed.getMinutes() !== minute
  ) return null;
  return parsed;
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function toChinaDateTimeKey(date: Date): string {
  const chinaTime = new Date(date.getTime() + 8 * HOUR_MS);
  return `${chinaTime.getUTCFullYear()}-${String(chinaTime.getUTCMonth() + 1).padStart(2, "0")}-${String(chinaTime.getUTCDate()).padStart(2, "0")}T${String(chinaTime.getUTCHours()).padStart(2, "0")}:${String(chinaTime.getUTCMinutes()).padStart(2, "0")}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  result.setDate(Math.min(day, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
  return result;
}

export function isNonWorkingDay(date: Date): boolean {
  const key = toDateKey(date);
  if (date.getFullYear() === 2026) {
    if (WORKDAYS_2026.has(key)) return false;
    if (HOLIDAYS_2026.has(key)) return true;
  }
  return date.getDay() === 0 || date.getDay() === 6;
}

export function adjustNonCustodyDeadline(raw: Date): Date {
  let result = new Date(raw);
  while (isNonWorkingDay(result)) result = addDays(result, 1);
  return result;
}

export function formatDate(date: Date | null, withTime = false): string {
  if (!date) return "待补录起算日期";
  return withTime
    ? `${toDateKey(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : toDateKey(date);
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}

function resolveStatus(due: Date | null, asOf: Date, completedAt?: string, kind: DeadlineItem["kind"] = "authority", withTime = false) {
  if (completedAt) {
    const completed = parseLocalDate(completedAt);
    if (due && completed && completed.getTime() > due.getTime()) {
      const late = withTime ? `${Math.max(1, Math.ceil((completed.getTime() - due.getTime()) / HOUR_MS))}小时` : `${Math.max(1, daysBetween(due, completed))}日`;
      return { status: "done" as const, statusText: `已记录完成：${completedAt.replace("T", " ")}（迟于节点${late}）` };
    }
    return { status: "done" as const, statusText: `已记录完成：${completedAt.replace("T", " ")}` };
  }
  if (!due) return { status: "waiting" as const, statusText: "待补录起算日期" };
  const diff = withTime ? due.getTime() - asOf.getTime() : daysBetween(asOf, due);
  const unit = withTime ? Math.max(1, Math.ceil(Math.abs(diff) / HOUR_MS)) : Math.abs(diff);
  const label = `${unit}${withTime ? "小时" : "日"}`;
  if (diff < 0) {
    if (kind === "information") return { status: "trigger" as const, statusText: `监督触发已过${label}` };
    if (kind === "party") return { status: "expired" as const, statusText: `申请期限已过${label}` };
    return { status: "overdue" as const, statusText: `期限已届满${label}` };
  }
  if (diff === 0) return { status: "dueSoon" as const, statusText: withTime ? "此刻到期" : "今日到期" };
  if ((withTime && diff <= 72 * HOUR_MS) || (!withTime && diff <= 3)) return { status: "dueSoon" as const, statusText: `剩余${label}` };
  return { status: "future" as const, statusText: `剩余${withTime ? Math.ceil(diff / DAY_MS) : diff}日` };
}

type ItemOptions = Omit<DeadlineItem, "due" | "rawDue" | "status" | "statusText" | "dateText"> & {
  rawDue: Date | null;
  adjust?: boolean;
  withTime?: boolean;
};

function makeItem(options: ItemOptions, asOf: Date): DeadlineItem {
  const due = options.rawDue && options.adjust !== false ? adjustNonCustodyDeadline(options.rawDue) : options.rawDue;
  const resolved = options.provisional && due && !options.completedAt
    ? { status: "projected" as const, statusText: "根据已录上游节点预测；录入真实起算时间后自动替换" }
    : options.noFixed && !due && !options.completedAt
    ? { status: "waiting" as const, statusText: "法律未规定统一固定日数" }
    : resolveStatus(due, asOf, options.completedAt, options.kind, options.withTime);
  const shifted = Boolean(options.rawDue && due && toDateKey(options.rawDue) !== toDateKey(due));
  const outside2026 = Boolean(options.rawDue && options.adjust !== false && options.rawDue.getFullYear() !== 2026);
  const calendarNote = outside2026 ? "当前仅完整内置2026年节假日；其他年度只按周末估算顺延，须核对当年国务院放假安排。" : "";
  return {
    ...options,
    due,
    rawDue: options.rawDue,
    status: resolved.status,
    statusText: resolved.statusText,
    provisional: Boolean(options.provisional || outside2026),
    note: [options.note, calendarNote].filter(Boolean).join("\n") || undefined,
    dateText: options.noFixed && !due
      ? (options.completedAt ? options.completedAt.replace("T", " ") : "无统一固定日数")
      : due
      ? `${formatDate(due, options.withTime)}${shifted ? `（原始期满日${formatDate(options.rawDue)}，遇休假日顺延）` : ""}`
      : "待补录起算日期",
  };
}

const LAW_TEXT = {
  receipt: `《公安机关办理刑事案件程序规定》第一百六十九条：“公安机关对于公民扭送、报案、控告、举报或者犯罪嫌疑人自动投案的，都应当立即接受，问明情况，并制作笔录。”\n第一百七十一条：“公安机关接受案件时，应当制作受案登记表和受案回执，并将受案回执交扭送人、报案人、控告人、举报人。”`,
  appraisalCommission: `《公安机关办理伤害案件规定》第十八条：“公安机关受理伤害案件后，应当在24小时内开具伤情鉴定委托书，告知被害人到指定的鉴定机构进行伤情鉴定。”`,
  appraisalInstant: `《公安机关办理伤害案件规定》第十九条第一款：“具备即时进行伤情鉴定条件的，公安机关的鉴定机构应当在受委托之时起24小时内提出鉴定意见，并在3日内出具鉴定文书。”`,
  appraisalComplex: `《公安机关办理伤害案件规定》第十九条第二款：“对伤情比较复杂，不具备即时进行鉴定条件的，应当在受委托之日起7日内提出鉴定意见并出具鉴定文书。”`,
  appraisalFunctional: `《公安机关办理伤害案件规定》第十九条第三款：“对影响组织、器官功能或者伤情复杂，一时难以进行鉴定的，待伤情稳定后及时提出鉴定意见，并出具鉴定文书。”`,
  appraisalNotice: `《公安机关办理刑事案件程序规定》第二百五十二条第二款：“对经审查作为证据使用的鉴定意见，公安机关应当及时告知犯罪嫌疑人、被害人或者其法定代理人。”`,
  appraisalObjection: `《公安机关办理刑事案件程序规定》第二百五十三条：“犯罪嫌疑人、被害人对鉴定意见有异议提出申请，以及办案部门或者侦查人员对鉴定意见有疑义的，可以将鉴定意见送交其他有专门知识的人员提出意见。必要时，询问鉴定人并制作笔录附卷。”\n第二百五十五条：“经审查，发现有下列情形之一的，经县级以上公安机关负责人批准，应当重新鉴定：（一）鉴定程序违法或者违反相关专业技术要求的；（二）鉴定机构、鉴定人不具备鉴定资质和条件的；（三）鉴定人故意作虚假鉴定或者违反回避规定的；（四）鉴定意见依据明显不足的；（五）检材虚假或者被损坏的；（六）其他应当重新鉴定的情形。重新鉴定，应当另行指派或者聘请鉴定人。经审查，不符合上述情形的，经县级以上公安机关负责人批准，作出不准予重新鉴定的决定，并在作出决定后三日以内书面通知申请人。”`,
  filingReview: `公安部《关于改革完善受案立案制度的意见》：“刑事案件立案审查期限原则上不超过3日；涉嫌犯罪线索需要查证的，立案审查期限不超过7日；重大疑难复杂案件，经县级以上公安机关负责人批准，立案审查期限可以延长至30日。”`,
  noCaseService: `《公安机关办理刑事案件程序规定》第一百七十八条第二款：“对有控告人的案件，决定不予立案的，公安机关应当制作不予立案通知书，并在三日以内送达控告人。”`,
  noCaseRemedy: `《公安机关办理刑事案件程序规定》第一百七十九条：“控告人对不予立案决定不服的，可以在收到不予立案通知书后七日以内向作出决定的公安机关申请复议；公安机关应当在收到复议申请后三十日以内作出决定……控告人对不予立案的复议决定不服的，可以在收到复议决定书后七日以内向上一级公安机关申请复核；上一级公安机关应当在收到复核申请后三十日以内作出决定……案情重大、复杂的，公安机关可以延长复议、复核时限，但是延长时限不得超过三十日，并书面告知申请人。”`,
  prosecutorExplain: `《人民检察院刑事诉讼规则》第五百六十条：“人民检察院要求公安机关说明不立案或者立案理由，应当书面通知公安机关，并且告知公安机关在收到通知后七日以内，书面说明不立案或者立案的情况、依据和理由，连同有关证据材料回复人民检察院。”`,
  prosecutorFile: `《人民检察院刑事诉讼规则》第五百六十三条：“人民检察院通知公安机关立案……应当……告知公安机关应当在收到通知立案书后十五日以内立案……”`,
  prosecutorTrigger: `《人民检察院刑事诉讼规则》第五百六十四条第三款：“公安机关立案后三个月以内未侦查终结的，人民检察院可以向公安机关发出立案监督案件催办函，要求公安机关及时向人民检察院反馈侦查工作进展情况。”`,
  detention24: `《刑事诉讼法》第八十五条第二款：“拘留后……至迟不得超过二十四小时……应当在拘留后二十四小时以内，通知被拘留人的家属。”第八十六条：“公安机关对被拘留的人，应当在拘留后的二十四小时以内进行讯问。”`,
  detentionCap: `《刑事诉讼法》第九十一条：“公安机关对被拘留的人，认为需要逮捕的，应当在拘留后的三日以内，提请人民检察院审查批准。在特殊情况下……可以延长一日至四日。对于流窜作案、多次作案、结伙作案的重大嫌疑分子……可以延长至三十日。人民检察院应当自接到……提请批准逮捕书后的七日以内，作出批准逮捕或者不批准逮捕的决定。”`,
  arrest24: `《刑事诉讼法》第九十三条：“公安机关逮捕人的时候，必须出示逮捕证。逮捕后，应当立即将被逮捕人送看守所羁押。除无法通知的以外，应当在逮捕后二十四小时以内，通知被逮捕人的家属。”第九十四条：“人民法院、人民检察院对于各自决定逮捕的人，公安机关对于经人民检察院批准逮捕的人，都必须在逮捕后的二十四小时以内进行讯问。”`,
  custody: `《刑事诉讼法》第一百五十六条：“对犯罪嫌疑人逮捕后的侦查羁押期限不得超过二个月。案情复杂、期限届满不能终结的案件，可以经上一级人民检察院批准延长一个月。”\n第一百五十八条：“下列案件在本法第一百五十六条规定的期限届满不能侦查终结的，经省、自治区、直辖市人民检察院批准或者决定，可以延长二个月：（一）交通十分不便的边远地区的重大复杂案件；（二）重大的犯罪集团案件；（三）流窜作案的重大复杂案件；（四）犯罪涉及面广，取证困难的重大复杂案件。”\n第一百五十九条：“对犯罪嫌疑人可能判处十年有期徒刑以上刑罚，依照本法第一百五十八条规定延长期限届满，仍不能侦查终结的，经省、自治区、直辖市人民检察院批准或者决定，可以再延长二个月。”`,
  custodyProcedure: `《公安机关办理刑事案件程序规定》第一百四十八条：“对犯罪嫌疑人逮捕后的侦查羁押期限不得超过二个月。案情复杂、期限届满不能侦查终结的案件，应当制作提请批准延长侦查羁押期限意见书，经县级以上公安机关负责人批准后，在期限届满七日前送请同级人民检察院转报上一级人民检察院批准延长一个月。”\n第一百四十九条：“下列案件在本规定第一百四十八条规定的期限届满不能侦查终结的，应当制作提请批准延长侦查羁押期限意见书，经县级以上公安机关负责人批准，在期限届满七日前送请同级人民检察院层报省、自治区、直辖市人民检察院批准，延长二个月：（一）交通十分不便的边远地区的重大复杂案件；（二）重大的犯罪集团案件；（三）流窜作案的重大复杂案件；（四）犯罪涉及面广，取证困难的重大复杂案件。”\n第一百五十条：“对犯罪嫌疑人可能判处十年有期徒刑以上刑罚，依照本规定第一百四十九条规定的延长期限届满，仍不能侦查终结的，应当制作提请批准延长侦查羁押期限意见书，经县级以上公安机关负责人批准，在期限届满七日前送请同级人民检察院层报省、自治区、直辖市人民检察院批准，再延长二个月。”\n《人民检察院刑事诉讼规则》第三百零九条：“公安机关需要延长侦查羁押期限的，人民检察院应当要求其在侦查羁押期限届满七日前提请批准延长侦查羁押期限。\n人民检察院办理直接受理侦查的案件，负责侦查的部门认为需要延长侦查羁押期限的，应当按照前款规定向本院负责捕诉的部门移送延长侦查羁押期限意见书及有关材料。\n对于超过法定羁押期限提请延长侦查羁押期限的，不予受理。”\n第三百一十一条：“对于同时具备下列条件的案件，人民检察院应当作出批准延长侦查羁押期限一个月的决定：（一）符合刑事诉讼法第一百五十六条的规定；（二）符合逮捕条件；（三）犯罪嫌疑人有继续羁押的必要。”\n第三百一十二条第一款：“犯罪嫌疑人虽然符合逮捕条件，但经审查，公安机关在对犯罪嫌疑人执行逮捕后二个月以内未有效开展侦查工作或者侦查取证工作没有实质进展的，人民检察院可以作出不批准延长侦查羁押期限的决定。”`,
  custodyRecalculation: `《刑事诉讼法》第一百六十条：“在侦查期间，发现犯罪嫌疑人另有重要罪行的，自发现之日起依照本法第一百五十六条的规定重新计算侦查羁押期限。”\n《公安机关办理刑事案件程序规定》第一百五十一条：“在侦查期间，发现犯罪嫌疑人另有重要罪行的，应当自发现之日起五日以内报县级以上公安机关负责人批准后，重新计算侦查羁押期限，制作变更羁押期限通知书，送达看守所，并报批准逮捕的人民检察院备案。前款规定的‘另有重要罪行’，是指与逮捕时的罪行不同种的重大犯罪以及同种犯罪并将影响罪名认定、量刑档次的重大犯罪。”\n《人民检察院刑事诉讼规则》第三百一十七条：“对公安机关重新计算侦查羁押期限的备案，由负责捕诉的部门审查。负责捕诉的部门认为公安机关重新计算侦查羁押期限不当的，应当提出纠正意见。”`,
  custodySpecialPostponement: `《刑事诉讼法》第一百五十七条：“因为特殊原因，在较长时间内不宜交付审判的特别重大复杂的案件，由最高人民检察院报请全国人民代表大会常务委员会批准延期审理。”\n《人民检察院刑事诉讼规则》第三百一十四条：“因为特殊原因，在较长时间内不宜交付审判的特别重大复杂的案件，由最高人民检察院报请全国人民代表大会常务委员会批准延期审理。”`,
  investigationTransfer: `《刑事诉讼法》第一百六十二条：“公安机关侦查终结的案件，应当做到犯罪事实清楚，证据确实、充分，并且写出起诉意见书，连同案卷材料、证据一并移送同级人民检察院审查决定；同时将案件移送情况告知犯罪嫌疑人及其辩护律师。”`,
  defenseRight: `《刑事诉讼法》第三十四条：“犯罪嫌疑人自被侦查机关第一次讯问或者采取强制措施之日起，有权委托辩护人……侦查机关在第一次讯问犯罪嫌疑人或者对犯罪嫌疑人采取强制措施的时候，应当告知犯罪嫌疑人有权委托辩护人。人民检察院自收到移送审查起诉的案件材料之日起三日以内，应当告知犯罪嫌疑人有权委托辩护人。人民法院自受理案件之日起三日以内，应当告知被告人有权委托辩护人。”`,
  bail: `《刑事诉讼法》第七十九条：“人民法院、人民检察院和公安机关对犯罪嫌疑人、被告人取保候审最长不得超过十二个月，监视居住最长不得超过六个月。”`,
  measureChange: `《刑事诉讼法》第九十七条：“犯罪嫌疑人、被告人及其法定代理人、近亲属或者辩护人有权申请变更强制措施。人民法院、人民检察院和公安机关收到申请后，应当在三日以内作出决定；不同意变更强制措施的，应当告知申请人，并说明不同意的理由。”`,
  custodyNecessity: `《人民检察院 公安机关羁押必要性审查、评估工作规定》第十九条：“人民检察院在侦查阶段、审判阶段收到羁押必要性审查申请或者建议的，应当在十日以内决定是否向公安机关、人民法院提出释放或者变更的建议。人民检察院在审查起诉阶段、公安机关在侦查阶段收到变更申请的，应当在三日以内作出决定。”`,
  investigationRecusal: `《公安机关办理刑事案件程序规定》第三十六条：“当事人及其法定代理人对侦查人员提出回避申请的，公安机关应当在收到回避申请后二日以内作出决定并通知申请人；情况复杂的，经县级以上公安机关负责人批准，可以在收到回避申请后五日以内作出决定。当事人及其法定代理人对县级以上公安机关负责人提出回避申请的，公安机关应当及时将申请移送同级人民检察院。”\n第三十七条：“当事人及其法定代理人对驳回申请回避的决定不服的，可以在收到驳回申请回避决定书后五日以内向作出决定的公安机关申请复议。公安机关应当在收到复议申请后五日以内作出复议决定并书面通知申请人。”`,
  prosecutionRights: `《人民检察院刑事诉讼规则》第五十五条：“人民检察院自收到移送起诉案卷材料之日起三日以内，应当告知被害人……有权委托诉讼代理人。”`,
  prosecutionDecision: `《刑事诉讼法》第一百七十二条：“人民检察院对于监察机关、公安机关移送起诉的案件，应当在一个月以内作出决定，重大、复杂的案件，可以延长十五日；犯罪嫌疑人认罪认罚，符合速裁程序适用条件的，应当在十日以内作出决定，对可能判处的有期徒刑超过一年的，可以延长至十五日。”`,
  prosecutionRule351: `《人民检察院刑事诉讼规则》第三百五十一条：“人民检察院对于移送起诉的案件，应当在一个月以内作出决定；重大、复杂的案件，一个月以内不能作出决定的，可以延长十五日。人民检察院审查起诉的案件，改变管辖的，从改变后的人民检察院收到案件之日起计算审查起诉期限。”`,
  supplement: `《刑事诉讼法》第一百七十五条第三款：“对于补充侦查的案件，应当在一个月以内补充侦查完毕。补充侦查以二次为限。补充侦查完毕移送人民检察院后，人民检察院重新计算审查起诉期限。”`,
  rightsComplaint: `《人民检察院刑事诉讼规则》第五十八条：“辩护人、诉讼代理人认为其依法行使诉讼权利受到阻碍向人民检察院申诉或者控告的，人民检察院应当及时受理并调查核实，在十日以内办结并书面答复。”`,
  nonProsecution: `《刑事诉讼法》第一百八十条：“对于有被害人的案件，决定不起诉的，人民检察院应当将不起诉决定书送达被害人。被害人如果不服，可以自收到决定书后七日以内向上一级人民检察院申诉，请求提起公诉。”`,
  nonProsecutionReview: `《人民检察院刑事诉讼规则》第三百八十六条：“人民检察院复查不服不起诉决定的申诉，应当在立案后三个月以内报经检察长批准作出复查决定。案情复杂的，不得超过六个月。”`,
  courtAcceptance: `《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第二百一十九条：“对公诉案件是否受理，应当在七日以内审查完毕。”`,
  privateAcceptance: `《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第三百二十条：“对自诉案件，人民法院应当在十五日以内审查完毕。”`,
  incidentalCivil: `《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第一百八十六条：“被害人或者其法定代理人、近亲属提起附带民事诉讼的，人民法院应当在七日以内决定是否受理。”`,
  hearing: `《刑事诉讼法》第一百八十七条：“人民法院决定开庭审判后……将人民检察院的起诉书副本至迟在开庭十日以前送达被告人及其辩护人……传票和通知书至迟在开庭三日以前送达。”`,
  trialOrdinary: `《刑事诉讼法》第二百零八条：“人民法院审理公诉案件，应当在受理后二个月以内宣判，至迟不得超过三个月。对于可能判处死刑的案件或者附带民事诉讼的案件，以及有本法第一百五十八条规定情形之一的，经上一级人民法院批准，可以延长三个月；因特殊情况还需要延长的，报请最高人民法院批准。”`,
  trialSummary: `《刑事诉讼法》第二百二十条：“适用简易程序审理案件，人民法院应当在受理后二十日以内审结；对可能判处的有期徒刑超过三年的，可以延长至一个半月。”`,
  trialFast: `《刑事诉讼法》第二百二十五条：“适用速裁程序审理案件，人民法院应当在受理后十日以内审结；对可能判处的有期徒刑超过一年的，可以延长至十五日。”`,
  trialPrivate: `《刑事诉讼法》第二百一十二条第二款：“人民法院审理自诉案件的期限，被告人被羁押的，适用本法第二百零八条第一款、第二款的规定；未被羁押的，应当在受理后六个月以内宣判。”`,
  judgmentService: `《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第三百零二条：“当庭宣告判决的，应当在五日以内送达判决书……定期宣告判决的……判决宣告后，应当立即送达判决书。”`,
  protest: `《刑事诉讼法》第二百二十九条：“被害人及其法定代理人不服地方各级人民法院第一审的判决的，自收到判决书后五日以内，有权请求人民检察院提出抗诉。人民检察院自收到……请求后五日以内，应当作出是否抗诉的决定并且答复请求人。”`,
  appeal: `《刑事诉讼法》第二百二十七条：“被告人、自诉人和他们的法定代理人，不服地方各级人民法院第一审的判决、裁定，有权用书状或者口头向上一级人民法院上诉……附带民事诉讼的当事人和他们的法定代理人，可以对地方各级人民法院第一审的判决、裁定中的附带民事诉讼部分，提出上诉。”\n第二百三十条：“不服判决的上诉和抗诉的期限为十日，不服裁定的上诉和抗诉的期限为五日，从接到判决书、裁定书的第二日起算。”\n《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第三百八十条：“上诉、抗诉必须在法定期限内提出。不服判决的上诉、抗诉的期限为十日；不服裁定的上诉、抗诉的期限为五日。上诉、抗诉的期限，从接到判决书、裁定书的第二日起计算。”`,
  appealTransfer: `《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第三百八十一条：“上诉人通过第一审人民法院提出上诉的……应当在上诉期满后三日以内将上诉状连同案卷、证据移送上一级人民法院……”`,
  secondInstance: `《刑事诉讼法》第二百四十三条：“第二审人民法院受理上诉、抗诉案件，应当在二个月以内审结。对于可能判处死刑的案件或者附带民事诉讼的案件，以及有本法第一百五十八条规定情形之一的，经省、自治区、直辖市高级人民法院批准或者决定，可以延长二个月；因特殊情况还需要延长的，报请最高人民法院批准。”`,
  complaintReview: `《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第四百五十七条：“对立案审查的申诉案件，应当在三个月以内作出决定，至迟不得超过六个月。”`,
  retrial: `《刑事诉讼法》第二百五十八条：“人民法院按照审判监督程序重新审判的案件，应当在作出提审、再审决定之日起三个月以内审结，需要延长期限的，不得超过六个月。”`,
  execution: `《刑事诉讼法》第二百六十四条：“罪犯被交付执行刑罚的时候，应当由交付执行的人民法院在判决生效后十日以内将有关的法律文书送达公安机关、监狱或者其他执行机关。”`,
  propertyExecution: `《最高人民法院关于刑事裁判涉财产部分执行的若干规定》第三条：“人民法院办理刑事裁判涉财产部分执行案件的期限为六个月。有特殊情况需要延长的，经本院院长批准，可以延长。”第七条：“人民法院立案部门经审查，认为属于移送范围且移送材料齐全的，应当在七日内立案，并移送执行机构。”`,
};

function roleAction(perspective: CasePerspective, victim: string, suspect: string, defender: string): string {
  return perspective === "victimAgent" ? victim : perspective === "suspectDefendant" ? suspect : defender;
}

function dueByProsecutionTrack(base: Date, track: CaseInputs["prosecutionTrack"]): Date {
  if (track === "major") return addDays(addMonthsClamped(base, 1), 15);
  if (track === "fast10") return addDays(base, 10);
  if (track === "fast15") return addDays(base, 15);
  return addMonthsClamped(base, 1);
}

const OPTIONAL_DEADLINE_GROUPS: Partial<Record<string, OptionalProcedureId>> = {
  "appraisal-commission": "appraisal", "appraisal-result": "appraisal", "appraisal-opinion": "appraisal", "appraisal-document": "appraisal", "appraisal-notice": "appraisal", "appraisal-objection": "appraisal",
  "no-case-service": "filingRelief", "no-case-reconsider-apply": "filingRelief", "no-case-reconsider-decision": "filingRelief", "no-case-review-apply": "filingRelief", "no-case-review-decision": "filingRelief", "prosecutor-explain": "filingRelief", "prosecutor-file": "filingRelief",
  "bail-cap": "nonCustodialMeasures", "residential-cap": "nonCustodialMeasures", "measure-change": "nonCustodialMeasures",
  "custody-necessity": "custodyNecessity",
  "recusal-decision": "investigationRecusal", "recusal-review-apply": "investigationRecusal", "recusal-review-decision": "investigationRecusal",
  "rights-obstruction": "rightsObstruction",
  "non-prosecution-appeal": "nonProsecutionRelief", "non-prosecution-review": "nonProsecutionRelief",
  "incidental-civil": "incidentalCivil",
  "complaint-review": "complaintRetrial", "retrial": "complaintRetrial",
  "property-execution-file": "propertyExecution", "property-execution-complete": "propertyExecution",
};

export function buildDeadlines(input: CaseInputs): DeadlineItem[] {
  const asOf = parseLocalDate(input.asOf) ?? new Date();
  const p = input.perspective;
  const d = (key: keyof CaseInputs) => typeof input[key] === "string" ? parseLocalDate(input[key] as string) : null;
  const items: DeadlineItem[] = [];
  const publicOnly = new Set([
    "prosecution-transfer-forecast", "prosecution-rights", "prosecution-defense-rights", "prosecution-decision", "supplement-1", "supplement-2",
    "non-prosecution-appeal", "non-prosecution-review", "court-acceptance", "victim-protest", "victim-protest-reply",
  ]);
  const add = (options: ItemOptions, audiences?: CasePerspective[]) => {
    if (input.caseRoute === "private" && publicOnly.has(options.id)) return;
    if (!audiences || audiences.includes(p)) items.push(makeItem(options, asOf));
  };

  const report = d("reportDate");
  const accepted = d("acceptedAt");
  add({ id: "receipt", stage: "接报案与取证", stageNo: 1, title: "立即接受报案并出具受案回执", summary: "公安机关对报案、控告、举报必须立即接受、制作笔录和受案回执；不是等待伤情鉴定后才受案。", basis: "《公安机关办理刑事案件程序规定》第169、171条", lawText: LAW_TEXT.receipt, action: roleAction(p, "固定110记录、受案登记表、回执编号和证据清单；未出具回执的书面催要。", "核对报案笔录是否完整、是否存在把自首或陈述误记的情况。", "调取受案登记、报案笔录及回执，审查案件来源和管辖。"), rawDue: report, completedAt: input.acceptedAt, kind: "authority", adjust: false, note: "‘立即’不是可机械换算的统一小时数；日期卡仅用于标记报案当日。" });

  add({ id: "appraisal-commission", stage: "接报案与取证", stageNo: 1, title: "伤情鉴定委托：受理后24小时内", summary: "公安受理伤害案件后24小时内开具委托书并告知被害人到指定机构鉴定。", basis: "《公安机关办理伤害案件规定》第18条", lawText: LAW_TEXT.appraisalCommission, action: roleAction(p, "索要委托书并核对受委托时刻、检材清单和指定机构。", "核对鉴定委托、检材来源及是否完整反映伤情形成原因。", "申请查阅鉴定委托、送检材料和鉴定机构资质，保留补充或重新鉴定意见。"), rawDue: accepted ? addHours(accepted, 24) : null, completedAt: input.appraisalCommissionAt, kind: "authority", adjust: false, withTime: true });

  const appraisalBase = d("appraisalCommissionAt");
  if (input.appraisalComplexity === "functional") {
    add({ id: "appraisal-result", stage: "接报案与取证", stageNo: 1, title: "功能性或复杂伤情：伤情稳定后及时鉴定", summary: "影响组织、器官功能或伤情复杂、一时难以鉴定的，不存在统一7日硬期限。", basis: "《公安机关办理伤害案件规定》第19条第3款", lawText: LAW_TEXT.appraisalFunctional, action: roleAction(p, "持续提交复诊、康复和功能检查资料，书面询问何时达到鉴定条件。", "保留既往病史、伤后恢复和因果关系材料，避免把治疗期误当鉴定拖延。", "跟踪伤情稳定性与鉴定条件，必要时申请有专门知识的人提出意见。"), rawDue: null, completedAt: input.appraisalDocumentDate, kind: "authority", noFixed: true });
  } else if (input.appraisalComplexity === "complex") {
    add({ id: "appraisal-result", stage: "接报案与取证", stageNo: 1, title: "复杂伤情：7日内提出意见并出具文书", summary: "不具备即时鉴定条件但不属于功能稳定型伤情的，受委托后7日内完成。", basis: "《公安机关办理伤害案件规定》第19条第2款", lawText: LAW_TEXT.appraisalComplex, action: roleAction(p, "核对7日起算点和鉴定文书落款、送达时间。", "审查伤情是否确属复杂类型以及检材、鉴定过程。", "核验鉴定方法、检材完整性及伤病关系，逾期或有疑义时提出书面意见。"), rawDue: appraisalBase ? addDays(appraisalBase, 7) : null, completedAt: input.appraisalDocumentDate, kind: "authority" });
  } else {
    add({ id: "appraisal-opinion", stage: "接报案与取证", stageNo: 1, title: "即时鉴定意见：受委托后24小时内", summary: "具备即时鉴定条件时，24小时内提出鉴定意见。", basis: "《公安机关办理伤害案件规定》第19条第1款", lawText: LAW_TEXT.appraisalInstant, action: roleAction(p, "核对受委托时刻和提出意见的原始记录。", "要求区分初步意见与正式鉴定文书，核查形成时间。", "审查是否具备即时鉴定条件及意见形成依据。"), rawDue: appraisalBase ? addHours(appraisalBase, 24) : null, completedAt: input.appraisalOpinionAt, kind: "authority", adjust: false, withTime: true });
    add({ id: "appraisal-document", stage: "接报案与取证", stageNo: 1, title: "即时鉴定文书：受委托后3日内", summary: "即时鉴定路径中，鉴定机构应在3日内出具正式文书。", basis: "《公安机关办理伤害案件规定》第19条第1款", lawText: LAW_TEXT.appraisalInstant, action: roleAction(p, "索取正式鉴定文书及送达记录，不以口头伤情结论代替。", "记录正式文书送达日，核对是否载明异议和重新鉴定途径。", "比对鉴定意见与正式文书，审查鉴定人、方法和依据。"), rawDue: appraisalBase ? addDays(appraisalBase, 3) : null, completedAt: input.appraisalDocumentDate, kind: "authority" });
  }
  add({ id: "appraisal-notice", stage: "接报案与取证", stageNo: 1, title: "刑事鉴定意见：及时告知双方", summary: "刑事程序只规定‘及时告知’，不能虚构统一3日异议期。", basis: "《公安机关办理刑事案件程序规定》第252条第2款", lawText: LAW_TEXT.appraisalNotice, action: roleAction(p, "记录实际收到日期；有异议立即提交补充、重新鉴定或专家意见申请。", "收到后立即与辩护人核对，明确是否申请补充或重新鉴定。", "书面提出鉴定异议、专家辅助人或重新鉴定申请，并要求书面决定。"), rawDue: null, completedAt: input.appraisalServedDate, kind: "authority", noFixed: true });
  add({ id: "appraisal-objection", stage: "接报案与取证", stageNo: 1, title: "刑事鉴定异议：法无统一申请日数", summary: "刑事程序允许申请专家意见、补充鉴定或重新鉴定，但没有统一规定‘收到后3日内申请’。不准予重新鉴定的书面通知是作出决定后3日内。", basis: "《公安机关办理刑事案件程序规定》第253—255条", lawText: LAW_TEXT.appraisalObjection, action: roleAction(p, "收到鉴定意见后立即提出具体异议和重新鉴定理由，避免证据审查阶段被动。", "与辩护人核对检材、程序、资质、依据和伤病关系后尽快申请。", "把异议对应到法定补充或重新鉴定情形，并要求对不准予决定书面通知。"), rawDue: null, kind: "party", noFixed: true });

  const reviewStart = d("criminalReviewStartDate") ?? report;
  const reviewDays = input.criminalReviewTrack === "ordinary" ? 3 : input.criminalReviewTrack === "verify" ? 7 : 30;
  add({ id: "filing-review", stage: "立案与立案监督", stageNo: 2, title: `刑事立案审查：${reviewDays}日`, summary: reviewDays === 30 ? "重大疑难复杂案件须经县级以上公安机关负责人批准，不能自动使用30日。" : reviewDays === 7 ? "需要查证涉嫌犯罪线索时，立案审查不超过7日。" : "一般刑事案件立案审查原则上不超过3日。", basis: "公安部《关于改革完善受案立案制度的意见》", lawText: LAW_TEXT.filingReview, action: roleAction(p, "在期满日书面要求立案决定或不予立案通知，避免只接受口头答复。", "核对是否已经刑事立案及被追诉人的程序身份。", "向办案机关核实立案日期、罪名和强制措施依据。"), rawDue: reviewStart ? addDays(reviewStart, reviewDays) : null, completedAt: input.criminalFiledDate || input.noCaseDecisionDate, kind: "authority", provisional: !input.criminalReviewStartDate, note: !input.criminalReviewStartDate && report ? "未录入刑事立案审查启动日，暂以报案日估算。" : undefined });

  add({ id: "no-case-service", stage: "立案与立案监督", stageNo: 2, title: "不予立案通知书：决定后3日内送达", summary: "有控告人的案件决定不予立案，必须制作并送达书面通知。", basis: "《公安机关办理刑事案件程序规定》第178条第2款", lawText: LAW_TEXT.noCaseService, action: roleAction(p, "取得通知书原件和签收凭证，准备复议或检察监督材料。", "本节点通常不适用于犯罪嫌疑人一方。", "审查不予立案决定是否影响委托人身份及后续控告风险。"), rawDue: d("noCaseDecisionDate") ? addDays(d("noCaseDecisionDate")!, 3) : null, completedAt: input.noCaseNoticeDate, kind: "authority" }, ["victimAgent"]);

  add({ id: "no-case-reconsider-apply", stage: "立案与立案监督", stageNo: 2, title: "不予立案复议申请：收到通知后7日内", summary: "控告人向作出不予立案决定的公安机关申请复议。", basis: "《公安机关办理刑事案件程序规定》第179条", lawText: LAW_TEXT.noCaseRemedy, action: "在7日内提交刑事复议申请，逐项列明犯罪事实、证据和立案标准，保留收件凭证。", rawDue: d("noCaseNoticeDate") ? addDays(d("noCaseNoticeDate")!, 7) : null, completedAt: input.reconsiderApplicationDate, kind: "party" }, ["victimAgent"]);
  add({ id: "no-case-reconsider-decision", stage: "立案与立案监督", stageNo: 2, title: `不予立案复议决定：${input.reconsiderExtended ? 60 : 30}日内`, summary: input.reconsiderExtended ? "重大复杂可以延长，但延长不得超过30日且应书面告知。" : "公安收到复议申请后30日内作出决定并送达。", basis: "《公安机关办理刑事案件程序规定》第179条", lawText: LAW_TEXT.noCaseRemedy, action: "期满未答复时，同时向上级公安法制部门和检察院提交逾期材料。", rawDue: d("reconsiderApplicationDate") ? addDays(d("reconsiderApplicationDate")!, input.reconsiderExtended ? 60 : 30) : null, completedAt: input.reconsiderDecisionDate, kind: "authority" }, ["victimAgent"]);
  add({ id: "no-case-review-apply", stage: "立案与立案监督", stageNo: 2, title: "不予立案复核申请：收到复议决定后7日内", summary: "控告人向上一级公安机关申请复核。", basis: "《公安机关办理刑事案件程序规定》第179条", lawText: LAW_TEXT.noCaseRemedy, action: "7日内向上一级公安机关提交复核申请，不要等待其他部门口头协调。", rawDue: d("reconsiderDecisionDate") ? addDays(d("reconsiderDecisionDate")!, 7) : null, completedAt: input.reviewApplicationDate, kind: "party" }, ["victimAgent"]);
  add({ id: "no-case-review-decision", stage: "立案与立案监督", stageNo: 2, title: `不予立案复核决定：${input.reviewExtended ? 60 : 30}日内`, summary: input.reviewExtended ? "重大复杂案件的复核时限可延长不超过30日，并须书面告知。" : "上一级公安机关收到复核申请后30日内作出决定。", basis: "《公安机关办理刑事案件程序规定》第179条", lawText: LAW_TEXT.noCaseRemedy, action: "核对复核机关收件日、延期告知和书面决定。", rawDue: d("reviewApplicationDate") ? addDays(d("reviewApplicationDate")!, input.reviewExtended ? 60 : 30) : null, completedAt: input.reviewDecisionDate, kind: "authority" }, ["victimAgent"]);

  add({ id: "prosecutor-explain", stage: "立案与立案监督", stageNo: 2, title: "公安向检察院说明不立案理由：7日内", summary: "检察院发出要求说明通知后，公安7日内书面回复并移送证据材料。", basis: "《人民检察院刑事诉讼规则》第560条", lawText: LAW_TEXT.prosecutorExplain, action: roleAction(p, "向检察院确认通知送达日并在7日期满后跟踪书面回复。", "关注检察立案监督是否改变案件程序身份。", "调取立案监督进展，评估其对侦查合法性和证据的影响。"), rawDue: d("prosecutorComplaintDate") ? addDays(d("prosecutorComplaintDate")!, 7) : null, kind: "authority" });
  add({ id: "prosecutor-file", stage: "立案与立案监督", stageNo: 2, title: "公安执行检察院通知立案：15日内", summary: "公安收到通知立案书后15日内立案。", basis: "《人民检察院刑事诉讼规则》第563条", lawText: LAW_TEXT.prosecutorFile, action: roleAction(p, "15日期满后向检察院申请发纠正违法通知并索取公安反馈。", "核实立案决定及后续传唤、强制措施是否合法。", "同步核验通知立案材料、立案决定和侦查行为的时间顺序。"), rawDue: d("prosecutorFileNoticeDate") ? addDays(d("prosecutorFileNoticeDate")!, 15) : null, completedAt: input.criminalFiledDate, kind: "authority" });
  add({ id: "investigation-supervision-trigger", stage: "立案与立案监督", stageNo: 2, title: "刑事立案满3个月未侦结：检察催办监督触发", summary: "这是检察机关可以发催办函的监督触发点，不是所有未羁押案件的统一侦查终结期限。", basis: "《人民检察院刑事诉讼规则》第564条第3款", lawText: LAW_TEXT.prosecutorTrigger, action: roleAction(p, "立案满3个月仍无结果，可向检察院申请立案监督催办并要求公安反馈进展。", "不得把该节点误读为案件自动撤销或侦查违法。", "区分检察监督触发与侦查羁押期限，按实际强制措施审查。"), rawDue: d("criminalFiledDate") ? addMonthsClamped(d("criminalFiledDate")!, 3) : null, kind: "information", adjust: false });

  const detention = d("detentionAt");
  add({ id: "detention-24", stage: "强制措施与羁押", stageNo: 3, title: "拘留后讯问、家属通知：24小时内", summary: "无法通知或法定有碍侦查情形属于例外，不能常态化。", basis: "《刑事诉讼法》第85、86条", lawText: LAW_TEXT.detention24, action: roleAction(p, "记录嫌疑人被控制和家属实际获知时间，监督是否超期羁押。", "立即告知辩护人拘留时间、地点和未通知家属情况。", "以拘留证和实际失去自由时刻核算24小时，核查讯问与通知记录。"), rawDue: detention ? addHours(detention, 24) : null, kind: "custody", adjust: false, withTime: true });
  const detentionDays = input.detentionTrack === "ordinary10" ? 10 : input.detentionTrack === "special14" ? 14 : 37;
  add({ id: "detention-cap", stage: "强制措施与羁押", stageNo: 3, title: `拘留至批捕决定最长节点：${detentionDays}日`, summary: detentionDays === 37 ? "37日仅适用于流窜、多次、结伙作案的重大嫌疑分子，不能因多人案件自动套用。" : "包含公安提请批捕期限与检察院7日审查批捕期限。", basis: "《刑事诉讼法》第91条", lawText: LAW_TEXT.detentionCap, action: roleAction(p, "跟踪批捕结果；不批捕后仍限制人身自由的，立即固定证据。", "到期前确认是否批准逮捕、释放或变更强制措施。", "逐项核验延长条件与审批，37日路径必须有法定事实基础。"), rawDue: detention ? addDays(detention, detentionDays) : null, completedAt: input.arrestDate, kind: "custody", adjust: false });

  const arrest = d("arrestDate");
  add({ id: "arrest-24", stage: "强制措施与羁押", stageNo: 3, title: "逮捕后讯问、家属通知：24小时内", summary: "逮捕后24小时内讯问；除无法通知外，24小时内通知家属。", basis: "《刑事诉讼法》第93、94条", lawText: LAW_TEXT.arrest24, action: roleAction(p, "记录逮捕日期，后续按侦查羁押期限跟踪。", "确认是否讯问和通知家属，及时委托辩护人。", "会见核对实际逮捕时刻、讯问和通知记录。"), rawDue: arrest ? addHours(arrest, 24) : null, kind: "custody", adjust: false, withTime: true });
  add({ id: "defense-right-investigation", stage: "强制措施与羁押", stageNo: 3, title: "第一次讯问或采取强制措施时：告知有权委托辩护人", summary: "权利从第一次讯问或采取强制措施之日起产生；侦查机关应当在该时点告知。", basis: "《刑事诉讼法》第34条", lawText: LAW_TEXT.defenseRight, action: roleAction(p, "该节点不属于被害人一方权利。", "未被告知或委托要求未及时转达的，立即记录并交辩护人处理。", "核对第一次讯问、强制措施与权利告知时间，及时向办案机关提交委托手续。"), rawDue: d("defenseRightTriggerAt"), completedAt: input.defenseRightNoticeAt, kind: "authority", adjust: false, withTime: true }, ["suspectDefendant", "defender"]);
  const estimatedArrest = arrest ?? (detention ? addDays(detention, detentionDays) : null);
  const arrestIsProjected = !arrest && Boolean(estimatedArrest);
  const additionalCrimeDiscovered = d("custodyAdditionalCrimeDiscoveredDate");
  const recalculationReported = d("custodyRecalculationReportedDate");
  const recalculationApproved = d("custodyRecalculationApprovedDate");
  const recalculationEffective = Boolean(
    arrest
    && additionalCrimeDiscovered
    && recalculationApproved
    && additionalCrimeDiscovered >= arrest
    && recalculationApproved >= additionalCrimeDiscovered,
  );
  const custodyCycleStart = recalculationEffective ? additionalCrimeDiscovered : estimatedArrest;
  const baseCustodyEnd = custodyCycleStart ? addMonthsClamped(custodyCycleStart, 2) : null;
  const firstCustodyEnd = custodyCycleStart ? addMonthsClamped(custodyCycleStart, 3) : null;
  const secondCustodyEnd = custodyCycleStart ? addMonthsClamped(custodyCycleStart, 5) : null;
  const thirdCustodyEnd = custodyCycleStart ? addMonthsClamped(custodyCycleStart, 7) : null;
  const withinCycle = (value: Date | null, end: Date | null) => Boolean(value && custodyCycleStart && end && value >= custodyCycleStart && value <= end);
  const firstApproval = d("custodyFirstExtensionApprovedDate");
  const secondApproval = d("custodySecondExtensionApprovedDate");
  const thirdApproval = d("custodyThirdExtensionApprovedDate");
  const firstExtensionEffective = Boolean(arrest) && withinCycle(firstApproval, baseCustodyEnd);
  const secondExtensionEffective = firstExtensionEffective && withinCycle(secondApproval, firstCustodyEnd);
  const thirdExtensionEffective = secondExtensionEffective && withinCycle(thirdApproval, secondCustodyEnd);
  const approvedCustodyMonths = thirdExtensionEffective ? 7 : secondExtensionEffective ? 5 : firstExtensionEffective ? 3 : 2;
  const currentCustodyEnd = approvedCustodyMonths === 7 ? thirdCustodyEnd : approvedCustodyMonths === 5 ? secondCustodyEnd : approvedCustodyMonths === 3 ? firstCustodyEnd : baseCustodyEnd;
  const selectedCustodyMonths = input.custodyTrack === "base2" ? 2 : input.custodyTrack === "complex3" ? 3 : input.custodyTrack === "special5" ? 5 : input.custodyTrack === "ten7" ? 7 : null;
  const selectedCustodyEnd = selectedCustodyMonths === 7 ? thirdCustodyEnd : selectedCustodyMonths === 5 ? secondCustodyEnd : selectedCustodyMonths === 3 ? firstCustodyEnd : selectedCustodyMonths === 2 ? baseCustodyEnd : null;
  const specialPostponementApproved = Boolean(d("custodySpecialPostponementApprovedDate"));
  const custodyEnd = specialPostponementApproved ? null : selectedCustodyEnd ?? currentCustodyEnd;

  if (additionalCrimeDiscovered || recalculationReported || recalculationApproved) {
    const recalculationNote = !arrest
      ? "尚未录入实际执行逮捕时间，重新计算不能被识别为已经生效。"
      : undefined;
    add({ id: "custody-recalculation-report", stage: "强制措施与羁押", stageNo: 3, title: "发现另有重要罪行：发现日起5日内报批", summary: "五日约束的是向县级以上公安机关负责人报请批准的时点，不是要求批准机关必须在五日内作出批准。", basis: "《公安机关办理刑事案件程序规定》第151条", lawText: LAW_TEXT.custodyRecalculation, action: roleAction(p, "核对发现日、实际报批日和审批材料。", "让辩护人审查是否在发现日起五日内报批。", "核验五日报批、另有重要罪行的实质条件及报批材料。"), rawDue: additionalCrimeDiscovered ? addDays(additionalCrimeDiscovered, 5) : null, completedAt: input.custodyRecalculationReportedDate, kind: "authority", adjust: false, provisional: !arrest, note: recalculationNote });
    add({ id: "custody-recalculation-approval", stage: "强制措施与羁押", stageNo: 3, title: "县级以上公安机关负责人批准重新计算", summary: "依法批准后，期限从发现另有重要罪行之日重新起算；同时制作变更羁押期限通知书、送达看守所并报原批捕检察院备案。法律未另设统一的批准完成日数。", basis: "《刑事诉讼法》第160条；《公安机关办理刑事案件程序规定》第151条", lawText: LAW_TEXT.custodyRecalculation, action: roleAction(p, "取得批准、看守所送达和检察备案材料。", "让辩护人审查另罪条件、批准、送达和备案。", "核验发现日、另罪的重要性、批准、送达和备案；不当重新计算应请求检察纠正。"), rawDue: null, completedAt: input.custodyRecalculationApprovedDate, kind: "custody", adjust: false, noFixed: true, provisional: !arrest, note: recalculationNote });
  }

  const custodyPathRank = input.custodyTrack === "complex3" ? 1 : input.custodyTrack === "special5" ? 2 : input.custodyTrack === "ten7" ? 3 : 0;
  const showFirstExtension = custodyPathRank >= 1 || Boolean(input.custodyFirstExtensionRequestedDate || input.custodyFirstExtensionApprovedDate);
  const showSecondExtension = custodyPathRank >= 2 || Boolean(input.custodySecondExtensionRequestedDate || input.custodySecondExtensionApprovedDate);
  const showThirdExtension = custodyPathRank >= 3 || Boolean(input.custodyThirdExtensionRequestedDate || input.custodyThirdExtensionApprovedDate);
  const firstLayerProjected = arrestIsProjected;
  const secondLayerProjected = arrestIsProjected || !firstExtensionEffective;
  const thirdLayerProjected = arrestIsProjected || !secondExtensionEffective;
  const extensionAction = roleAction(p, "索取提请日、批准机关、批准日和决定书；未批准不改变原届满日。", "延押未批准时仍按原期限核对释放、变更措施或移送起诉。", "在每个期满前核对七日提请、法定条件、审批层级和批准决定书。");
  if (showFirstExtension) {
    add({ id: "custody-extension-1-request", stage: "强制措施与羁押", stageNo: 3, title: "首次延押：基础2个月届满前7日提请", summary: "案情复杂、基础期满不能侦查终结，符合逮捕条件且确有继续羁押必要时，由公安在期满七日前提请。", basis: "《公安机关办理刑事案件程序规定》第148条；《人民检察院刑事诉讼规则》第309、311条", lawText: LAW_TEXT.custodyProcedure, action: extensionAction, rawDue: baseCustodyEnd ? addDays(baseCustodyEnd, -7) : null, completedAt: input.custodyFirstExtensionRequestedDate, kind: "authority", adjust: false, provisional: firstLayerProjected, note: firstLayerProjected ? "尚未录入实际逮捕日，本节点仅按拘留路径估算。" : undefined });
    add({ id: "custody-extension-1-approval", stage: "强制措施与羁押", stageNo: 3, title: "首次延押批准：上一级检察院批准延长1个月", summary: "未取得批准决定，当前有效届满日仍是基础2个月期满日。", basis: "《刑事诉讼法》第156条；《人民检察院刑事诉讼规则》第311条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyProcedure}`, action: extensionAction, rawDue: baseCustodyEnd, completedAt: input.custodyFirstExtensionApprovedDate, kind: "custody", adjust: false, provisional: firstLayerProjected, note: firstLayerProjected ? "尚未录入实际逮捕日，本节点及所录批准不能改变当前有效期限。" : undefined });
  }
  if (showSecondExtension) {
    add({ id: "custody-extension-2-request", stage: "强制措施与羁押", stageNo: 3, title: "四类重大复杂案件：3个月届满前7日提请", summary: "仅限刑诉法第158条四类案件，由省级人民检察院批准延长2个月。", basis: "《刑事诉讼法》第158条；《公安机关办理刑事案件程序规定》第149条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyProcedure}`, action: extensionAction, rawDue: firstCustodyEnd ? addDays(firstCustodyEnd, -7) : null, completedAt: input.custodySecondExtensionRequestedDate, kind: "authority", adjust: false, provisional: secondLayerProjected, note: secondLayerProjected ? "首次延押尚未依法生效，本节点只是条件预测，不能作为当前法定期限。" : undefined });
    add({ id: "custody-extension-2-approval", stage: "强制措施与羁押", stageNo: 3, title: "四类重大复杂案件批准：再延长2个月", summary: "必须已有首次延押批准，且符合第158条四类法定情形之一。", basis: "《刑事诉讼法》第158条；《公安机关办理刑事案件程序规定》第149条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyProcedure}`, action: extensionAction, rawDue: firstCustodyEnd, completedAt: input.custodySecondExtensionApprovedDate, kind: "custody", adjust: false, provisional: secondLayerProjected, note: secondLayerProjected ? "首次延押尚未依法生效，第二层批准不能单独形成累计5个月期限。" : undefined });
  }
  if (showThirdExtension) {
    add({ id: "custody-extension-3-request", stage: "强制措施与羁押", stageNo: 3, title: "可能判10年以上：5个月届满前7日提请", summary: "必须已用完第158条的延长期限，仍不能侦结，且犯罪嫌疑人可能被判处10年有期徒刑以上刑罚。", basis: "《刑事诉讼法》第159条；《公安机关办理刑事案件程序规定》第150条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyProcedure}`, action: extensionAction, rawDue: secondCustodyEnd ? addDays(secondCustodyEnd, -7) : null, completedAt: input.custodyThirdExtensionRequestedDate, kind: "authority", adjust: false, provisional: thirdLayerProjected, note: thirdLayerProjected ? "第158条第二层延押尚未依法生效，本节点只是条件预测。" : undefined });
    add({ id: "custody-extension-3-approval", stage: "强制措施与羁押", stageNo: 3, title: "可能判10年以上再延押：省级检察院批准再延长2个月", summary: "不能只按涉嫌罪名选择；应根据案件事实和可能适用的法定刑核验。", basis: "《刑事诉讼法》第159条；《公安机关办理刑事案件程序规定》第150条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyProcedure}`, action: extensionAction, rawDue: secondCustodyEnd, completedAt: input.custodyThirdExtensionApprovedDate, kind: "custody", adjust: false, provisional: thirdLayerProjected, note: thirdLayerProjected ? "前序延押尚未完整依法生效，第三层批准不能单独形成累计7个月期限。" : undefined });
  }

  if (input.custodyTrack === "npcSpecial" || input.custodySpecialPostponementApprovedDate) {
    add({ id: "custody-special-postponement", stage: "强制措施与羁押", stageNo: 3, title: "特别重大复杂案件：最高检报请全国人大常委会批准延期", summary: "这不是普通3、5、7个月路径后的自动下一层。法律未规定统一延期月数，必须核对全国人大常委会批准决定载明的内容，系统不能自动生成固定届满日。", basis: "《刑事诉讼法》第157条；《人民检察院刑事诉讼规则》第314条", lawText: LAW_TEXT.custodySpecialPostponement, action: extensionAction, rawDue: null, completedAt: input.custodySpecialPostponementApprovedDate, kind: "custody", noFixed: true, provisional: !arrest, note: !arrest ? "尚未录入实际逮捕日，本程序不能被识别为已经生效的羁押期限变更。" : undefined });
  }

  const ordinaryCapCompletion = input.custodySpecialPostponementApprovedDate || input.prosecutionReceivedDate;
  add({ id: "custody-cap", stage: "强制措施与羁押", stageNo: 3, title: arrestIsProjected ? "预测的逮捕后侦查羁押期限：基础2个月" : `当前有效的逮捕后侦查羁押期限：${approvedCustodyMonths}个月`, summary: arrestIsProjected ? "尚未录入实际逮捕日；本项只是根据拘留至批捕路径推算，任何延押批准暂不计为生效。" : approvedCustodyMonths === 2 ? "未录入有效延押批准时，当前届满日仍按基础2个月计算。" : `系统仅按已录入且在前一期限届满前作出的批准计入，当前累计${approvedCustodyMonths}个月。`, basis: "《刑事诉讼法》第156、158、159、160条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyRecalculation}`, action: roleAction(p, "记录每次延押批准文书；未获批准不改变当前届满日。", "在当前届满前核实移送起诉、释放、变更措施或已生效的延押批准。", "分别审查当前有效届满日、各次批准层级和重新计算事由。"), rawDue: currentCustodyEnd, completedAt: ordinaryCapCompletion, kind: "custody", adjust: false, provisional: arrestIsProjected, note: [arrestIsProjected ? `暂按拘留后第${detentionDays}日估算逮捕起点；录入真实逮捕时间后自动替换。` : "", recalculationEffective ? "已按发现另有重要罪行日重新起算；旧周期的延押批准不会自动带入新周期。" : ""].filter(Boolean).join("\n") || undefined });
  if (selectedCustodyMonths && selectedCustodyMonths > approvedCustodyMonths) {
    add({ id: "custody-conditional-cap", stage: "强制措施与羁押", stageNo: 3, title: `条件预测：若所需延押均依法批准，累计${selectedCustodyMonths}个月`, summary: "这不是当前已生效的羁押届满日。补录每次实际批准日后，系统才会逐级更新“当前有效期限”。", basis: "《刑事诉讼法》第156、158、159条；《公安机关办理刑事案件程序规定》第148—150条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.custodyProcedure}`, action: extensionAction, rawDue: selectedCustodyEnd, kind: "information", adjust: false, provisional: true, note: "条件预测不代替延长侦查羁押期限决定书；未批准时仍以当前有效届满日为准。" });
  }

  add({ id: "bail-cap", stage: "强制措施与羁押", stageNo: 3, title: "取保候审最长12个月", summary: "期限届满应解除或依法变更；不能以案件仍在办理为由无限延续。", basis: "《刑事诉讼法》第79、99条", lawText: LAW_TEXT.bail, action: roleAction(p, "被害人可关注措施变更及社会危险性，但无权要求以羁押代替个案审查。", "到期前要求解除取保候审或依法变更，并取得书面决定。", "建立12个月到期预警；期满未处理时书面要求解除。"), rawDue: d("bailStartDate") ? addMonthsClamped(d("bailStartDate")!, 12) : null, completedAt: input.bailEndDate, kind: "custody", adjust: false }, ["suspectDefendant", "defender"]);
  add({ id: "residential-cap", stage: "强制措施与羁押", stageNo: 3, title: "监视居住最长6个月", summary: "期限届满应及时解除或依法变更。", basis: "《刑事诉讼法》第79、99条", lawText: LAW_TEXT.bail, action: roleAction(p, "记录措施变化即可。", "期满前要求解除或依法变更并留存书面材料。", "核对起算日、执行地点及期限届满处理。"), rawDue: d("residentialSurveillanceStartDate") ? addMonthsClamped(d("residentialSurveillanceStartDate")!, 6) : null, completedAt: input.residentialSurveillanceEndDate, kind: "custody", adjust: false }, ["suspectDefendant", "defender"]);
  add({ id: "measure-change", stage: "强制措施与羁押", stageNo: 3, title: "变更强制措施申请：3日内决定", summary: "不同意变更的，应告知申请人并说明理由。", basis: "《刑事诉讼法》第97条", lawText: LAW_TEXT.measureChange, action: roleAction(p, "被害人一方不能据此申请变更嫌疑人的措施。", "提交后第3日核对书面决定和理由。", "同时提交无社会危险性、医疗、家庭与保证条件材料，要求书面答复。"), rawDue: d("measureChangeApplicationDate") ? addDays(d("measureChangeApplicationDate")!, 3) : null, completedAt: input.measureChangeDecisionDate, kind: "authority" }, ["suspectDefendant", "defender"]);
  const custodyNecessityDays = input.custodyNecessityTrack === "procuratorate10" ? 10 : 3;
  add({ id: "custody-necessity", stage: "强制措施与羁押", stageNo: 3, title: `羁押必要性审查／评估：${custodyNecessityDays}日`, summary: input.custodyNecessityTrack === "procuratorate10" ? "检察院在侦查或审判阶段收到申请，10日内决定是否提出释放或变更建议。" : "审查起诉阶段由检察院、侦查阶段由公安收到变更申请，3日内作出决定。", basis: "《人民检察院 公安机关羁押必要性审查、评估工作规定》第19条", lawText: LAW_TEXT.custodyNecessity, action: roleAction(p, "被害人可提交社会危险性、威胁报复等材料供审查，但不能替代办案机关决定。", "提交后跟踪3日或10日节点并索取结果。", "准确选择诉讼阶段和受理机关，附上不需继续羁押的证据。"), rawDue: d("custodyNecessityApplicationDate") ? addDays(d("custodyNecessityApplicationDate")!, custodyNecessityDays) : null, completedAt: input.custodyNecessityDecisionDate, kind: "authority" });

  const recusalDecisionDays = input.recusalDecisionTrack === "complex5" ? 5 : 2;
  add({ id: "recusal-decision", stage: "公安侦查", stageNo: 3, title: `公安侦查人员回避申请：${recusalDecisionDays}日内决定`, summary: input.recusalDecisionTrack === "complex5" ? "仅情况复杂并经县级以上公安机关负责人批准，决定期限才可到5日。" : "公安机关收到对侦查人员的回避申请后2日内决定并通知申请人。", basis: "《公安机关办理刑事案件程序规定》第36条", lawText: LAW_TEXT.investigationRecusal, action: roleAction(p, "记录申请对象、回避事由和公安收件日期；如对象为县级以上公安负责人，不套用本节点。", "保存回避申请及收件凭证，核对是否按期作出书面决定。", "列明法定回避事由和证据，跟踪普通2日或复杂批准5日节点。"), rawDue: d("recusalApplicationDate") ? addDays(d("recusalApplicationDate")!, recusalDecisionDays) : null, completedAt: input.recusalDecisionDate, kind: "authority" });
  add({ id: "recusal-review-apply", stage: "公安侦查", stageNo: 3, title: "驳回侦查人员回避申请：收到决定后5日内申请复议", summary: "当事人及其法定代理人对驳回决定不服，可以向作出决定的公安机关申请复议。", basis: "《公安机关办理刑事案件程序规定》第37条", lawText: LAW_TEXT.investigationRecusal, action: roleAction(p, "诉讼代理人可依照回避规定申请复议，保留驳回决定实际收件凭证。", "在5日内提交复议申请并保留收件证明。", "核对驳回决定送达日，在5日内提出一次有针对性的复议。"), rawDue: d("recusalRejectedReceivedDate") ? addDays(d("recusalRejectedReceivedDate")!, 5) : null, completedAt: input.recusalReviewApplicationDate, kind: "party" });
  add({ id: "recusal-review-decision", stage: "公安侦查", stageNo: 3, title: "公安机关回避复议：收到申请后5日内决定", summary: "公安机关应作出复议决定并书面通知申请人。", basis: "《公安机关办理刑事案件程序规定》第37条", lawText: LAW_TEXT.investigationRecusal, action: roleAction(p, "期满未答复时书面催办并保存沟通记录。", "索取书面复议决定并核对参与侦查人员是否调整。", "跟踪书面决定及回避前诉讼活动效力处理。"), rawDue: d("recusalReviewApplicationDate") ? addDays(d("recusalReviewApplicationDate")!, 5) : null, completedAt: input.recusalReviewDecisionDate, kind: "authority" });

  const prosecution = d("prosecutionReceivedDate");
  const changedJurisdiction = d("prosecutionChangedJurisdictionReceivedDate");
  const firstSupplementReturned = d("supplement1ReturnedDate");
  const firstSupplementResubmitted = d("supplement1ResubmittedDate");
  const secondSupplementReturned = d("supplement2ReturnedDate");
  const secondSupplementResubmitted = d("supplement2ResubmittedDate");
  const hasActualProsecutionStage = Boolean(
    prosecution || changedJurisdiction || firstSupplementResubmitted || secondSupplementResubmitted
    || firstSupplementReturned || secondSupplementReturned
    || d("courtProsecutionReceivedDate") || d("nonProsecutionReceivedDate"),
  );
  const projectedProsecution = input.caseRoute === "public" && !hasActualProsecutionStage ? custodyEnd : null;
  const prosecutionBase = changedJurisdiction ?? prosecution ?? projectedProsecution;
  const prosecutionIsProjected = !changedJurisdiction && !prosecution && Boolean(projectedProsecution);
  if (projectedProsecution) {
    add({ id: "prosecution-transfer-forecast", stage: "审查起诉", stageNo: 4, title: "预计侦查终结并移送审查起诉", summary: "按当前已选拘留、逮捕和侦查羁押路径推算的计划节点；公安可以提前侦查终结，依法批准延长或重新计算也会改变该日期。", basis: "《刑事诉讼法》第156、158、159、162条", lawText: `${LAW_TEXT.custody}\n${LAW_TEXT.investigationTransfer}`, action: roleAction(p, "在预计节点前后向公安确认是否侦查终结、移送检察院，并索取移送告知信息。", "在预计节点前核对释放、变更措施、延长羁押批准或者移送审查起诉情况。", "提前核验侦查终结、延长审批和移送告知，防止预测日期被误当成实际收案日。"), rawDue: projectedProsecution, kind: "information", adjust: false, provisional: true, note: "这是从羁押期限上限向后推演的计划日期，不是检察院审查起诉期限的法定起算事实；实际移送、收案日期录入后自动替换。" });
  }
  add({ id: "prosecution-rights", stage: "审查起诉", stageNo: 4, title: "告知被害人委托诉讼代理人权利：3日内", summary: "检察院收到移送起诉案卷材料后3日内履行告知义务。", basis: "《人民检察院刑事诉讼规则》第55条", lawText: LAW_TEXT.prosecutionRights, action: "未收到告知的，向检察院案件管理部门核实收案日、承办人并提交代理手续。", rawDue: prosecutionBase ? addDays(prosecutionBase, 3) : null, completedAt: input.prosecutionRightsNoticeDate, kind: "authority", provisional: prosecutionIsProjected, note: prosecutionIsProjected ? "暂按预计移送日推算；检察院实际收案日才是本期限的法定起算点。" : undefined }, ["victimAgent"]);
  add({ id: "prosecution-defense-rights", stage: "审查起诉", stageNo: 4, title: "检察院告知有权委托辩护人：收案后3日内", summary: "检察院收到移送审查起诉案件材料后3日内告知犯罪嫌疑人。", basis: "《刑事诉讼法》第34条", lawText: LAW_TEXT.defenseRight, action: roleAction(p, "该节点不属于被害人一方权利。", "确认已获告知并及时委托辩护人。", "核对收案日和告知日，立即办理阅卷并提交辩护意见。"), rawDue: prosecutionBase ? addDays(prosecutionBase, 3) : null, completedAt: input.prosecutionDefenseNoticeDate, kind: "authority", provisional: prosecutionIsProjected, note: prosecutionIsProjected ? "暂按预计移送日推算；检察院实际收案日才是本期限的法定起算点。" : undefined }, ["suspectDefendant", "defender"]);
  const prosecutionDecisionBase = secondSupplementResubmitted ?? firstSupplementResubmitted ?? prosecutionBase;
  const prosecutionDecisionIsProjected = !secondSupplementResubmitted && !firstSupplementResubmitted && prosecutionIsProjected;
  const awaitingSupplement = Boolean(
    (secondSupplementReturned && !secondSupplementResubmitted)
    || (firstSupplementReturned && !firstSupplementResubmitted),
  );
  const prosecutionRestart = secondSupplementResubmitted ? "第二次补侦重报后重新计算" : firstSupplementResubmitted ? "第一次补侦重报后重新计算" : changedJurisdiction ? "改变管辖后重新计算" : prosecutionIsProjected ? "按预计移送日推算" : "首次收案起算";
  if (input.prosecutionTrack === "major") {
    add({ id: "prosecution-extension", stage: "审查起诉", stageNo: 4, title: "重大复杂案件：1个月基本期限届满", summary: "只有案件重大、复杂且一个月内不能作出决定时，才可以延长十五日；延长不是所有审查起诉案件的自动期限。", basis: "《刑事诉讼法》第172条；《人民检察院刑事诉讼规则》第351条", lawText: `${LAW_TEXT.prosecutionDecision}\n${LAW_TEXT.prosecutionRule351}`, action: roleAction(p, "核对是否存在重大、复杂且一个月内不能决定的具体情形，并记录延长依据。", "要求辩护人核对延长条件，避免把十五日自动叠加为常规期限。", "在一个月节点前完成阅卷意见，并核验延长十五日的实体条件和程序记录。"), rawDue: prosecutionDecisionBase ? addMonthsClamped(prosecutionDecisionBase, 1) : null, kind: "information", provisional: prosecutionDecisionIsProjected, note: `${prosecutionRestart}；本节点提示延长条件，最终延长后期满日另行显示。` });
  }
  const prosecutionDecisionRaw = prosecutionDecisionBase ? dueByProsecutionTrack(prosecutionDecisionBase, input.prosecutionTrack) : null;
  const prosecutionDecisionDue = prosecutionDecisionRaw ? adjustNonCustodyDeadline(prosecutionDecisionRaw) : null;
  const prosecutionDecisionCompletion = input.courtProsecutionReceivedDate || input.nonProsecutionReceivedDate
    || (awaitingSupplement ? input.supplement2ReturnedDate || input.supplement1ReturnedDate : "");
  add({ id: "prosecution-decision", stage: "审查起诉", stageNo: 4, title: `${input.prosecutionTrack === "major" ? "重大复杂案件延长后决定期限" : "审查起诉决定期限"}（${prosecutionRestart}）`, summary: `${input.prosecutionTrack === "major" ? "基本期限为1个月；仅符合法定条件时延长15日。" : input.prosecutionTrack === "ordinary" ? "普通案件1个月。" : `认罪认罚速裁审查按${input.prosecutionTrack === "fast10" ? 10 : 15}日。`}${firstSupplementResubmitted || secondSupplementResubmitted ? "补充侦查完毕重报后，审查起诉期限重新计算。" : ""}${changedJurisdiction ? "改变管辖后，从变更后的检察院收案日起重新计算。" : ""}`, basis: firstSupplementResubmitted || secondSupplementResubmitted ? "《刑事诉讼法》第172、175条；《人民检察院刑事诉讼规则》第351条" : "《刑事诉讼法》第172条；《人民检察院刑事诉讼规则》第351条", lawText: firstSupplementResubmitted || secondSupplementResubmitted ? `${LAW_TEXT.prosecutionDecision}\n${LAW_TEXT.prosecutionRule351}\n${LAW_TEXT.supplement}` : `${LAW_TEXT.prosecutionDecision}\n${LAW_TEXT.prosecutionRule351}`, action: roleAction(p, "在期限内提交书面意见、量刑和赔偿材料，并跟踪起诉或不起诉结果。", "确认是否签署认罪认罚具结书及量刑建议，防止超期羁押。", "在期限内完成阅卷、证据审查和书面辩护意见。"), rawDue: prosecutionDecisionRaw, completedAt: prosecutionDecisionCompletion, kind: "authority", provisional: prosecutionDecisionIsProjected, note: prosecutionDecisionIsProjected ? "本节点从预计移送日继续推算，只用于计划管理；录入检察院实际收案日后，系统按真实日期重新计算。" : changedJurisdiction ? "改变管辖后，以变更后的人民检察院实际收案日重新起算。" : undefined });

  add({ id: "supplement-1", stage: "审查起诉", stageNo: 4, title: "第一次补充侦查：1个月内", summary: "补充侦查每次1个月，最多二次；重报后重新计算审查起诉期限。", basis: "《刑事诉讼法》第175条第3款", lawText: LAW_TEXT.supplement, action: roleAction(p, "跟踪退补提纲和重报日，继续补充损失、因果关系和共同犯罪证据。", "核查退补是否改变指控事实、罪名和羁押必要性。", "取得补侦材料后重新阅卷，审查补证是否补足证明标准。"), rawDue: d("supplement1ReturnedDate") ? addMonthsClamped(d("supplement1ReturnedDate")!, 1) : null, completedAt: input.supplement1ResubmittedDate, kind: "custody", adjust: false });
  add({ id: "supplement-2", stage: "审查起诉", stageNo: 4, title: "第二次补充侦查：1个月内", summary: "第二次补充侦查仍为1个月，补充侦查以二次为限。", basis: "《刑事诉讼法》第175条第3款", lawText: LAW_TEXT.supplement, action: roleAction(p, "第二次重报后要求检察院依法作出起诉或不起诉决定。", "关注二次退补后证据仍不足的处理。", "重点审查两次退补仍未补足的证据缺口，提交不起诉意见。"), rawDue: d("supplement2ReturnedDate") ? addMonthsClamped(d("supplement2ReturnedDate")!, 1) : null, completedAt: input.supplement2ResubmittedDate, kind: "custody", adjust: false });

  add({ id: "rights-obstruction", stage: "审查起诉", stageNo: 4, title: "辩护人／诉讼代理人权利受阻控告：10日内办结答复", summary: "检察院应及时受理、调查核实，并在10日内办结书面答复。", basis: "《人民检察院刑事诉讼规则》第58条", lawText: LAW_TEXT.rightsComplaint, action: roleAction(p, "诉讼代理人阅卷、会见当事人或提交意见受阻时，书面控告并留存收件凭证。", "让辩护人记录受阻事实并向检察院控告。", "逐项列明受阻权利、时间、人员和证据，10日后催要书面答复。"), rawDue: d("rightsObstructionComplaintDate") ? addDays(d("rightsObstructionComplaintDate")!, 10) : null, completedAt: input.rightsObstructionReplyDate, kind: "authority" }, ["victimAgent", "defender"]);

  add({ id: "non-prosecution-appeal", stage: "审查起诉", stageNo: 4, title: "被害人不服不起诉申诉：收到后7日内", summary: "向上一级检察院申诉，请求提起公诉。", basis: "《刑事诉讼法》第180条", lawText: LAW_TEXT.nonProsecution, action: "7日内提交申诉，不等待口头解释；同时固定不起诉决定送达凭证。", rawDue: d("nonProsecutionReceivedDate") ? addDays(d("nonProsecutionReceivedDate")!, 7) : null, completedAt: input.nonProsecutionAppealDate, kind: "party" }, ["victimAgent"]);
  add({ id: "non-prosecution-review", stage: "审查起诉", stageNo: 4, title: `不起诉申诉复查：${input.nonProsecutionReviewExtended ? 6 : 3}个月内`, summary: input.nonProsecutionReviewExtended ? "案情复杂，复查最长不得超过6个月。" : "立案复查后3个月内作出复查决定。", basis: "《人民检察院刑事诉讼规则》第386条", lawText: LAW_TEXT.nonProsecutionReview, action: "区分‘申诉收件日’与‘立案复查日’，期限从立案复查日起算。", rawDue: d("nonProsecutionReviewFiledDate") ? addMonthsClamped(d("nonProsecutionReviewFiledDate")!, input.nonProsecutionReviewExtended ? 6 : 3) : null, completedAt: input.nonProsecutionReviewDecisionDate, kind: "authority" }, ["victimAgent"]);

  const courtMaterialsReceived = d("courtProsecutionReceivedDate");
  const courtReceived = d("courtReceivedDate");
  const projectedCourtMaterials = input.caseRoute === "public" && !courtMaterialsReceived && !courtReceived && !d("nonProsecutionReceivedDate") && !awaitingSupplement
    ? prosecutionDecisionDue
    : null;
  const courtMaterialsBase = courtMaterialsReceived ?? projectedCourtMaterials;
  const courtMaterialsIsProjected = !courtMaterialsReceived && Boolean(projectedCourtMaterials);
  const courtAcceptanceRaw = courtMaterialsBase ? addDays(courtMaterialsBase, 7) : null;
  const projectedCourtReceived = !courtReceived && courtAcceptanceRaw ? adjustNonCustodyDeadline(courtAcceptanceRaw) : null;
  const courtReceivedBase = courtReceived ?? projectedCourtReceived;
  const courtReceivedIsProjected = !courtReceived && Boolean(projectedCourtReceived);
  add({ id: "court-acceptance", stage: "一审", stageNo: 5, title: "法院公诉案件受理审查：7日内", summary: "法院对检察院提起公诉的案件是否受理，应在7日内审查完毕。", basis: "《刑诉法解释》第219条", lawText: LAW_TEXT.courtAcceptance, action: roleAction(p, "跟踪检察院移送法院日期和法院正式受理日期。", "确认法院受理、案号和审判组织。", "核对起诉材料移送与法院受理日期，准备审前会议申请。"), rawDue: courtAcceptanceRaw, completedAt: input.courtReceivedDate, kind: "authority", provisional: courtMaterialsIsProjected, note: courtMaterialsIsProjected ? "假设检察院在当前审查起诉预计期满日提起公诉；不起诉、退回补充侦查或实际起诉日不同，都会改变本预测。" : undefined });
  add({ id: "court-defense-rights", stage: "一审", stageNo: 5, title: "法院告知有权委托辩护人：受理后3日内", summary: "人民法院自受理案件之日起3日内告知被告人有权委托辩护人。", basis: "《刑事诉讼法》第34条", lawText: LAW_TEXT.defenseRight, action: roleAction(p, "该节点不属于被害人一方权利。", "收到告知后立即确认辩护安排。", "核对法院受理、告知和委托手续，避免开庭准备时间被压缩。"), rawDue: courtReceivedBase ? addDays(courtReceivedBase, 3) : null, completedAt: input.courtDefenseNoticeDate, kind: "authority", provisional: courtReceivedIsProjected, note: courtReceivedIsProjected ? "暂按预计法院受理日推算；录入法院实际受理日后自动替换。" : undefined }, ["suspectDefendant", "defender"]);
  add({ id: "private-acceptance", stage: "一审", stageNo: 5, title: "自诉案件受理审查：15日内", summary: "仅在刑事自诉路径显示；公诉案件不适用。", basis: "《刑诉法解释》第320条", lawText: LAW_TEXT.privateAcceptance, action: roleAction(p, "准备符合自诉受案范围的犯罪事实、被告人信息和证明材料。", "收到自诉材料后及时委托辩护并核实管辖。", "审查自诉受案条件、证据和是否存在公诉优先情形。"), rawDue: d("privateProsecutionSubmittedDate") ? addDays(d("privateProsecutionSubmittedDate")!, 15) : null, completedAt: input.privateProsecutionAcceptedDate, kind: "authority" }, input.caseRoute === "private" ? undefined : []);
  add({ id: "incidental-civil", stage: "一审", stageNo: 5, title: "附带民事诉讼受理决定：7日内", summary: "被害人等提起附带民事诉讼，法院7日内决定是否受理。", basis: "《刑诉法解释》第186条", lawText: LAW_TEXT.incidentalCivil, action: "提交医疗费、误工费、护理费、交通费等物质损失证据并保留收件凭证。", rawDue: d("incidentalCivilSubmittedDate") ? addDays(d("incidentalCivilSubmittedDate")!, 7) : null, completedAt: input.incidentalCivilAcceptedDate, kind: "authority" }, ["victimAgent"]);

  const hearing = d("hearingDate");
  add({ id: "indictment-service", stage: "一审", stageNo: 5, title: "起诉书副本：开庭至少10日前送达", summary: "送达对象是被告人及其辩护人。该节点从开庭日向前倒算，不适用期满日向后顺延。", basis: "《刑事诉讼法》第187条", lawText: LAW_TEXT.hearing, action: roleAction(p, "被害人一方不适用起诉书副本10日节点，应跟踪开庭通知。", "收到起诉书后立即与辩护人核对指控事实和罪名。", "若不足10日，及时提出程序异议并评估是否申请延期审理。"), rawDue: hearing ? addDays(hearing, -10) : null, completedAt: input.indictmentReceivedDate, kind: "authority", adjust: false }, ["suspectDefendant", "defender"]);
  add({ id: "hearing-notice", stage: "一审", stageNo: 5, title: "传票、开庭通知：开庭至少3日前送达", summary: "当事人、辩护人、诉讼代理人、证人等的传票和通知书至迟在开庭3日前送达。该节点从开庭日向前倒算，不适用期满日向后顺延。", basis: "《刑事诉讼法》第187条", lawText: LAW_TEXT.hearing, action: roleAction(p, "未按期收到通知或无法准备时，立即书面向法院反映。", "收到后确认开庭时间、地点和辩护安排。", "核对通知送达并完成证人、非法证据排除和庭前会议申请。"), rawDue: hearing ? addDays(hearing, -3) : null, completedAt: input.hearingNoticeReceivedDate, kind: "authority", adjust: false });

  const trialBase = input.caseRoute === "private" ? d("privateProsecutionAcceptedDate") : courtReceivedBase;
  const trialIsProjected = input.caseRoute === "public" && courtReceivedIsProjected;
  let trialDue: Date | null = null;
  let trialTitle = "一审审理期限";
  let trialLaw = LAW_TEXT.trialOrdinary;
  if (trialBase) {
    if (input.trialTrack === "ordinary2") { trialDue = addMonthsClamped(trialBase, 2); trialTitle = "普通公诉一审：通常2个月内宣判"; }
    if (input.trialTrack === "ordinary3") { trialDue = addMonthsClamped(trialBase, 3); trialTitle = "普通公诉一审：常规最迟3个月"; }
    if (input.trialTrack === "special6") { trialDue = addMonthsClamped(trialBase, 6); trialTitle = "法定特殊案件经批准：最长6个月节点"; }
    if (input.trialTrack === "summary20") { trialDue = addDays(trialBase, 20); trialTitle = "简易程序：20日内审结"; trialLaw = LAW_TEXT.trialSummary; }
    if (input.trialTrack === "summary45") { trialDue = addDays(addMonthsClamped(trialBase, 1), 15); trialTitle = "简易程序可能判3年以上：1个半月"; trialLaw = LAW_TEXT.trialSummary; }
    if (input.trialTrack === "fast10") { trialDue = addDays(trialBase, 10); trialTitle = "速裁程序：10日内审结"; trialLaw = LAW_TEXT.trialFast; }
    if (input.trialTrack === "fast15") { trialDue = addDays(trialBase, 15); trialTitle = "速裁程序可能判1年以上：15日内审结"; trialLaw = LAW_TEXT.trialFast; }
    if (input.trialTrack === "private6") { trialDue = addMonthsClamped(trialBase, 6); trialTitle = "未羁押自诉案件：6个月内宣判"; trialLaw = LAW_TEXT.trialPrivate; }
  }
  add({ id: "trial", stage: "一审", stageNo: 5, title: trialTitle, summary: input.trialTrack === "special6" ? "3个月后再延长3个月须符合法定案件类型并经上一级法院批准；特殊情况继续延长须报最高法院。" : "从法院正式受理日起算；改变管辖、法院补充侦查等可能触发重新计算。", basis: input.trialTrack.startsWith("summary") ? "《刑事诉讼法》第220条" : input.trialTrack.startsWith("fast") ? "《刑事诉讼法》第225条" : input.trialTrack === "private6" ? "《刑事诉讼法》第212条" : "《刑事诉讼法》第208条", lawText: trialLaw, action: roleAction(p, "庭前提交代理意见、附带民事和量刑材料，超期时书面查询审批依据。", "与辩护人核查审限和羁押期限，避免以审限延长掩盖超期羁押。", "调取审限变更审批或重新计算依据，分别审查审限和羁押期限。"), rawDue: trialDue, completedAt: input.judgmentAnnouncedDate, kind: "authority", provisional: trialIsProjected, note: [input.trialTrack === "summary45" ? "‘一个半月’按一个月再加十五日计算，不机械等同于每案45个自然日。" : "", trialIsProjected ? "本节点假设案件起诉并按预计日期受理；实际起诉、受理、退补、改变管辖或重新计算将覆盖本预测。" : ""].filter(Boolean).join("\n") || undefined });

  const announced = d("judgmentAnnouncedDate");
  add({ id: "judgment-service", stage: "一审", stageNo: 5, title: input.judgmentPronouncementTrack === "inCourt" ? "当庭宣判：5日内送达判决书" : "定期宣判：宣判后立即送达判决书", summary: "必须按实际宣判方式选择，否则会错误计算送达节点。", basis: "《刑诉法解释》第302条", lawText: LAW_TEXT.judgmentService, action: roleAction(p, "记录宣判方式和实际签收日，抗诉请求期限从收到判决书起算。", "记录实际收到判决书日期，上诉期从次日起算。", "立即核对裁判主文、事实认定、证据和上诉期限。"), rawDue: announced ? addDays(announced, input.judgmentPronouncementTrack === "inCourt" ? 5 : 0) : null, completedAt: input.judgmentReceivedDate, kind: "authority", adjust: input.judgmentPronouncementTrack === "inCourt" });
  add({ id: "victim-protest", stage: "一审", stageNo: 5, title: "被害人请求检察院抗诉：收到判决后5日内", summary: "被害人没有独立上诉权，必须在5日内请求检察院抗诉。", basis: "《刑事诉讼法》第229条", lawText: LAW_TEXT.protest, action: "在5日内提交抗诉请求书，明确事实、证据、定性、量刑和程序错误。", rawDue: d("judgmentReceivedDate") ? addDays(d("judgmentReceivedDate")!, 5) : null, completedAt: input.protestRequestDate, kind: "party" }, ["victimAgent"]);
  add({ id: "victim-protest-reply", stage: "一审", stageNo: 5, title: "检察院答复是否抗诉：收到请求后5日内", summary: "检察院应作出是否抗诉的决定并答复请求人。", basis: "《刑事诉讼法》第229条", lawText: LAW_TEXT.protest, action: "以检察院实际收件日计算，期满未答复时向案件管理和控告申诉部门催办。", rawDue: d("protestRequestDate") ? addDays(d("protestRequestDate")!, 5) : null, completedAt: input.protestDecisionReceivedDate, kind: "authority" }, ["victimAgent"]);
  const appealDays = input.firstDecisionType === "judgment" ? 10 : 5;
  const victimCanAppeal = input.caseRoute === "private" || Boolean(input.incidentalCivilSubmittedDate || input.incidentalCivilAcceptedDate);
  const appealAudiences: CasePerspective[] = ["suspectDefendant", "defender", ...(victimCanAppeal ? ["victimAgent" as const] : [])];
  add({ id: "appeal", stage: "一审", stageNo: 5, title: `不服一审${input.firstDecisionType === "judgment" ? "判决" : "裁定"}：${appealDays}日内上诉`, summary: "期限从接到判决书、裁定书的第二日起计算。公诉案件普通被害人对刑事部分没有独立上诉权。", basis: "《刑事诉讼法》第230条；《刑诉法解释》第380条", lawText: LAW_TEXT.appeal, action: roleAction(p, input.caseRoute === "private" ? "作为自诉人在法定期间内提出上诉。" : "附带民事原告人只能就附带民事部分上诉；刑事部分应使用5日请求抗诉节点。", "在法定期间内提出上诉，先提交上诉状即可阻断逾期。", "以实际送达日核算并保留提交凭证，判决10日、裁定5日。"), rawDue: d("judgmentReceivedDate") ? addDays(d("judgmentReceivedDate")!, appealDays) : null, completedAt: input.appealFiledDate, kind: "party" }, appealAudiences);
  const appealExpiry = d("judgmentReceivedDate") ? adjustNonCustodyDeadline(addDays(d("judgmentReceivedDate")!, appealDays)) : null;
  add({ id: "appeal-transfer", stage: "二审", stageNo: 6, title: "一审法院移送上诉材料：上诉期满后3日内", summary: "经一审法院提出上诉的，法院审查后在上诉期满3日内移送案卷、证据。", basis: "《刑诉法解释》第381条", lawText: LAW_TEXT.appealTransfer, action: roleAction(p, "跟踪案件是否因被告人、自诉人、附带民事当事人上诉或检察抗诉进入二审。", "核对上诉是否已转送并取得二审案号。", "上诉期满3日后查询移送情况，防止案卷滞留。"), rawDue: appealExpiry ? addDays(appealExpiry, 3) : null, completedAt: input.firstCourtTransferredDate, kind: "authority" });

  const secondMonths = input.secondInstanceTrack === "special4" ? 4 : 2;
  add({ id: "second-instance", stage: "二审", stageNo: 6, title: `二审审理期限：${secondMonths}个月`, summary: secondMonths === 4 ? "仅法定特殊案件经省级高院批准或决定，才可在2个月基础上延长2个月。" : "二审法院受理上诉、抗诉案件后2个月内审结。", basis: "《刑事诉讼法》第243条", lawText: LAW_TEXT.secondInstance, action: roleAction(p, "关注是否开庭、是否提交代理意见和被害人权益材料。", "分别核对二审审限和在押期限。", "提交二审辩护意见，核验延长审批及是否需要开庭审理。"), rawDue: d("secondInstanceReceivedDate") ? addMonthsClamped(d("secondInstanceReceivedDate")!, secondMonths) : null, completedAt: input.secondJudgmentReceivedDate, kind: "authority" });
  add({ id: "complaint-review", stage: "申诉再审与执行", stageNo: 7, title: `法院申诉立案审查：${input.complaintExtended ? 6 : 3}个月`, summary: input.complaintExtended ? "疑难、复杂、重大或其他特殊原因可延长，但至迟不超过6个月。" : "申诉立案审查后3个月内作出决定。", basis: "《刑诉法解释》第457条", lawText: LAW_TEXT.complaintReview, action: roleAction(p, "围绕法定再审事由提交新证据、证据矛盾和程序违法材料。", "申诉不停止原裁判执行，应同步处理执行和强制措施问题。", "严格区分申诉收件与立案审查日期，建立3/6个月台账。"), rawDue: d("complaintReviewStartedDate") ? addMonthsClamped(d("complaintReviewStartedDate")!, input.complaintExtended ? 6 : 3) : null, completedAt: input.complaintDecisionDate, kind: "authority" });
  add({ id: "retrial", stage: "申诉再审与执行", stageNo: 7, title: `再审审理期限：${input.retrialExtended ? 6 : 3}个月`, summary: input.retrialExtended ? "需要延长时不得超过6个月。" : "从作出提审、再审决定之日起3个月内审结。", basis: "《刑事诉讼法》第258条", lawText: LAW_TEXT.retrial, action: roleAction(p, "按再审范围补充代理意见和损失材料。", "核对再审是否中止执行及羁押措施。", "建立再审决定、阅卷、开庭和审限变更台账。"), rawDue: d("retrialDecisionDate") ? addMonthsClamped(d("retrialDecisionDate")!, input.retrialExtended ? 6 : 3) : null, completedAt: input.retrialCompletedDate, kind: "authority" });
  add({ id: "execution-documents", stage: "申诉再审与执行", stageNo: 7, title: "生效判决交付执行文书：10日内", summary: "交付执行刑罚时，一审法院在判决生效后10日内送达有关法律文书。", basis: "《刑事诉讼法》第264条", lawText: LAW_TEXT.execution, action: roleAction(p, "关注刑罚、退赔和附带民事裁判是否进入执行。", "核对执行机关、刑期折抵和交付执行手续。", "审查生效日期、执行文书与刑期计算。"), rawDue: d("effectiveJudgmentDate") ? addDays(d("effectiveJudgmentDate")!, 10) : null, completedAt: input.executionDocumentsDeliveredDate, kind: "authority" });
  add({ id: "property-execution-file", stage: "申诉再审与执行", stageNo: 7, title: "刑事涉财产执行移送材料齐全后：7日内立案", summary: "罚金、没收财产、追缴、责令退赔等涉财产部分由一审法院执行。", basis: "《刑事裁判涉财产部分执行规定》第7条", lawText: LAW_TEXT.propertyExecution, action: roleAction(p, "核对责令退赔、追缴和附带民事部分是否分别立案执行。", "核对执行标的范围，提出执行异议时严格区分实体与执行程序。", "审查执行依据、财产清单和查控范围，依法提出执行异议。"), rawDue: d("propertyExecutionTransferredDate") ? addDays(d("propertyExecutionTransferredDate")!, 7) : null, completedAt: input.propertyExecutionFiledDate, kind: "authority" });
  add({ id: "property-execution-complete", stage: "申诉再审与执行", stageNo: 7, title: `刑事涉财产执行：${input.propertyExecutionExtended ? "特殊情况经批准延长" : "6个月"}`, summary: input.propertyExecutionExtended ? "6个月并非延长后的固定上限；特殊情况经本院院长批准可以延长，应核对批准。" : "人民法院办理刑事裁判涉财产部分执行案件的期限为6个月。", basis: "《刑事裁判涉财产部分执行规定》第3条", lawText: LAW_TEXT.propertyExecution, action: roleAction(p, "6个月未执行完毕时查询财产查控、终本理由和延期批准。", "关注退赔、罚金、没收财产之间的执行顺序和合法财产保护。", "审查执行措施、参与分配、案外人异议及延期审批。"), rawDue: d("propertyExecutionFiledDate") && !input.propertyExecutionExtended ? addMonthsClamped(d("propertyExecutionFiledDate")!, 6) : null, completedAt: input.propertyExecutionCompletedDate, kind: "authority", noFixed: input.propertyExecutionExtended, note: input.propertyExecutionExtended ? "已选择特殊延长。现行条文未给延长的统一上限，工作台不编造期满日。" : undefined });

  const enabledOptional = new Set(getEnabledOptionalProcedures(input));
  return items
    .filter((item) => !OPTIONAL_DEADLINE_GROUPS[item.id] || enabledOptional.has(OPTIONAL_DEADLINE_GROUPS[item.id]!))
    .sort((a, b) => a.stageNo - b.stageNo || ((a.due?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.due?.getTime() ?? Number.MAX_SAFE_INTEGER)));
}

const DATE_FIELDS: Array<[keyof CaseInputs, string]> = [
  ["asOf", "计算截至时间"], ["incidentDate", "案发日期"], ["reportDate", "报案日期"], ["acceptedAt", "正式受理时间"],
  ["appraisalCommissionAt", "鉴定委托时间"], ["appraisalOpinionAt", "鉴定意见时间"], ["appraisalDocumentDate", "鉴定文书日期"], ["appraisalServedDate", "鉴定告知日期"],
  ["criminalReviewStartDate", "刑事立案审查启动日"], ["criminalFiledDate", "刑事立案日"], ["noCaseDecisionDate", "不予立案决定日"], ["noCaseNoticeDate", "不予立案通知收到日"],
  ["reconsiderApplicationDate", "复议申请日"], ["reconsiderDecisionDate", "复议决定收到日"], ["reviewApplicationDate", "复核申请日"], ["reviewDecisionDate", "复核决定收到日"],
  ["prosecutorComplaintDate", "公安收到检察要求说明通知日"], ["prosecutorFileNoticeDate", "公安收到检察通知立案日"], ["detentionAt", "拘留时间"], ["arrestDate", "逮捕时间"],
  ["custodyFirstExtensionRequestedDate", "首次延长侦查羁押实际提请日"], ["custodyFirstExtensionApprovedDate", "首次延长侦查羁押批准日"],
  ["custodySecondExtensionRequestedDate", "四类重大复杂案件延押实际提请日"], ["custodySecondExtensionApprovedDate", "四类重大复杂案件延押批准日"],
  ["custodyThirdExtensionRequestedDate", "十年以上刑罚案件再次延押实际提请日"], ["custodyThirdExtensionApprovedDate", "十年以上刑罚案件再次延押批准日"],
  ["custodyAdditionalCrimeDiscoveredDate", "发现另有重要罪行日"], ["custodyRecalculationReportedDate", "重新计算侦查羁押期限报批日"], ["custodyRecalculationApprovedDate", "重新计算侦查羁押期限批准日"], ["custodySpecialPostponementApprovedDate", "全国人大常委会批准延期日"],
  ["defenseRightTriggerAt", "第一次讯问或采取强制措施时间"], ["defenseRightNoticeAt", "侦查阶段辩护权告知时间"],
  ["bailStartDate", "取保候审开始日"], ["bailEndDate", "取保候审解除日"], ["residentialSurveillanceStartDate", "监视居住开始日"], ["residentialSurveillanceEndDate", "监视居住解除日"],
  ["measureChangeApplicationDate", "变更强制措施申请日"], ["measureChangeDecisionDate", "变更强制措施决定日"], ["custodyNecessityApplicationDate", "羁押必要性申请日"], ["custodyNecessityDecisionDate", "羁押必要性决定日"],
  ["recusalApplicationDate", "侦查人员回避申请日"], ["recusalDecisionDate", "回避决定日"], ["recusalRejectedReceivedDate", "驳回回避决定收到日"], ["recusalReviewApplicationDate", "回避复议申请日"], ["recusalReviewDecisionDate", "回避复议决定日"],
  ["prosecutionReceivedDate", "审查起诉收案日"], ["prosecutionChangedJurisdictionReceivedDate", "改变管辖后检察院收案日"], ["prosecutionRightsNoticeDate", "被害人权利告知日"], ["prosecutionDefenseNoticeDate", "审查起诉辩护权告知日"], ["supplement1ReturnedDate", "第一次退补日"], ["supplement1ResubmittedDate", "第一次重报日"],
  ["supplement2ReturnedDate", "第二次退补日"], ["supplement2ResubmittedDate", "第二次重报日"], ["rightsObstructionComplaintDate", "权利受阻控告日"], ["rightsObstructionReplyDate", "权利受阻答复日"],
  ["nonProsecutionReceivedDate", "不起诉决定收到日"], ["nonProsecutionAppealDate", "不起诉申诉日"], ["nonProsecutionReviewFiledDate", "不起诉复查立案日"], ["nonProsecutionReviewDecisionDate", "不起诉复查决定日"],
  ["courtProsecutionReceivedDate", "法院收到公诉材料日"], ["courtReceivedDate", "法院受理日"], ["courtDefenseNoticeDate", "法院辩护权告知日"], ["privateProsecutionSubmittedDate", "自诉材料提交日"], ["privateProsecutionAcceptedDate", "自诉受理日"],
  ["incidentalCivilSubmittedDate", "附带民事提交日"], ["incidentalCivilAcceptedDate", "附带民事受理日"], ["hearingDate", "开庭日"], ["indictmentReceivedDate", "起诉书副本收到日"],
  ["hearingNoticeReceivedDate", "开庭通知收到日"], ["judgmentAnnouncedDate", "宣判日"], ["judgmentReceivedDate", "裁判文书收到日"], ["protestRequestDate", "抗诉请求日"],
  ["protestDecisionReceivedDate", "抗诉答复收到日"], ["appealFiledDate", "上诉提交日"], ["firstCourtTransferredDate", "一审法院移送日"], ["secondInstanceReceivedDate", "二审受理日"],
  ["secondJudgmentReceivedDate", "二审裁判收到日"], ["complaintReviewStartedDate", "申诉立案审查日"], ["complaintDecisionDate", "申诉审查决定日"], ["retrialDecisionDate", "再审决定日"],
  ["retrialCompletedDate", "再审审结日"], ["effectiveJudgmentDate", "裁判生效日"], ["executionDocumentsDeliveredDate", "执行文书送达日"], ["propertyExecutionTransferredDate", "涉财产执行移送日"],
  ["propertyExecutionFiledDate", "涉财产执行立案日"], ["propertyExecutionCompletedDate", "涉财产执行完成日"],
];

export function validateCaseInputs(input: CaseInputs): CaseInputIssue[] {
  const issues: CaseInputIssue[] = [];
  const add = (issue: CaseInputIssue) => { if (!issues.some((x) => x.id === issue.id)) issues.push(issue); };
  for (const [key, label] of DATE_FIELDS) {
    const value = input[key];
    if (typeof value === "string" && value && !parseLocalDate(value)) add({ id: `invalid-${String(key)}`, severity: "error", title: `${label}格式无效`, detail: "请输入真实存在的日期或时间。" });
  }
  if (!input.asOf) add({ id: "missing-as-of", severity: "error", title: "未填写计算截至时间", detail: "无法判断节点状态。" });

  const chronology = (a: keyof CaseInputs, b: keyof CaseInputs, id: string, title: string, severity: CaseInputIssue["severity"] = "error") => {
    const av = typeof input[a] === "string" ? parseLocalDate(input[a] as string) : null;
    const bv = typeof input[b] === "string" ? parseLocalDate(input[b] as string) : null;
    if (av && bv && bv < av) add({ id, severity, title, detail: "请核对两份文书的落款、收件回执和实际发生时间；如属特殊情形，请在案件备注说明。" });
  };
  chronology("incidentDate", "reportDate", "report-before-incident", "报案日期早于案发日期");
  chronology("reportDate", "acceptedAt", "accept-before-report", "受理时间早于报案日期");
  chronology("acceptedAt", "appraisalCommissionAt", "commission-before-accept", "鉴定委托早于正式受理", "warning");
  chronology("appraisalCommissionAt", "appraisalDocumentDate", "document-before-commission", "鉴定文书早于鉴定委托");
  chronology("criminalReviewStartDate", "criminalFiledDate", "filing-before-review", "刑事立案早于立案审查启动", "warning");
  chronology("noCaseDecisionDate", "noCaseNoticeDate", "notice-before-decision", "不予立案通知送达早于决定作出");
  chronology("noCaseNoticeDate", "reconsiderApplicationDate", "reconsider-before-notice", "复议申请早于不予立案通知", "warning");
  chronology("reconsiderApplicationDate", "reconsiderDecisionDate", "reconsider-decision-before-apply", "复议决定早于复议申请");
  chronology("reconsiderDecisionDate", "reviewApplicationDate", "review-before-reconsider", "复核申请早于复议决定", "warning");
  chronology("detentionAt", "arrestDate", "arrest-before-detention", "逮捕早于拘留", "warning");
  chronology("custodyFirstExtensionRequestedDate", "custodyFirstExtensionApprovedDate", "custody-first-approval-before-request", "首次延押批准早于公安实际提请");
  chronology("custodySecondExtensionRequestedDate", "custodySecondExtensionApprovedDate", "custody-second-approval-before-request", "四类重大复杂案件延押批准早于公安实际提请");
  chronology("custodyThirdExtensionRequestedDate", "custodyThirdExtensionApprovedDate", "custody-third-approval-before-request", "十年以上刑罚案件再次延押批准早于公安实际提请");
  chronology("custodyAdditionalCrimeDiscoveredDate", "custodyRecalculationReportedDate", "custody-recalculation-report-before-discovery", "重新计算报批早于发现另有重要罪行");
  chronology("custodyRecalculationReportedDate", "custodyRecalculationApprovedDate", "custody-recalculation-approval-before-report", "重新计算批准早于实际报批");
  chronology("custodyAdditionalCrimeDiscoveredDate", "custodyRecalculationApprovedDate", "custody-recalculation-approval-before-discovery", "重新计算批准早于发现另有重要罪行");
  chronology("recusalApplicationDate", "recusalDecisionDate", "recusal-decision-before-apply", "回避决定早于回避申请");
  chronology("recusalRejectedReceivedDate", "recusalReviewApplicationDate", "recusal-review-before-rejection", "回避复议申请早于收到驳回决定", "warning");
  chronology("recusalReviewApplicationDate", "recusalReviewDecisionDate", "recusal-review-decision-before-apply", "回避复议决定早于复议申请");
  chronology("arrestDate", "prosecutionReceivedDate", "prosecution-before-arrest", "审查起诉收案早于逮捕", "warning");
  chronology("prosecutionReceivedDate", "prosecutionChangedJurisdictionReceivedDate", "jurisdiction-change-before-first-receipt", "改变管辖后的收案日早于首次审查起诉收案日");
  chronology("supplement1ReturnedDate", "supplement1ResubmittedDate", "supplement1-reversed", "第一次补侦重报早于退补");
  chronology("supplement2ReturnedDate", "supplement2ResubmittedDate", "supplement2-reversed", "第二次补侦重报早于退补");
  chronology("courtProsecutionReceivedDate", "courtReceivedDate", "court-accept-before-materials", "法院受理早于收到公诉材料");
  chronology("courtReceivedDate", "hearingDate", "hearing-before-accept", "开庭早于法院受理");
  chronology("judgmentAnnouncedDate", "judgmentReceivedDate", "judgment-service-before-announce", "裁判文书送达早于宣判");
  chronology("secondInstanceReceivedDate", "secondJudgmentReceivedDate", "second-result-before-accept", "二审裁判早于二审受理");
  chronology("retrialDecisionDate", "retrialCompletedDate", "retrial-result-before-decision", "再审审结早于再审决定");
  chronology("propertyExecutionTransferredDate", "propertyExecutionFiledDate", "property-file-before-transfer", "涉财产执行立案早于移送");

  const custodyTrackRank = input.custodyTrack === "complex3" ? 1 : input.custodyTrack === "special5" ? 2 : input.custodyTrack === "ten7" ? 3 : 0;
  const hasFirstExtensionData = Boolean(input.custodyFirstExtensionRequestedDate || input.custodyFirstExtensionApprovedDate);
  const hasSecondExtensionData = Boolean(input.custodySecondExtensionRequestedDate || input.custodySecondExtensionApprovedDate);
  const hasThirdExtensionData = Boolean(input.custodyThirdExtensionRequestedDate || input.custodyThirdExtensionApprovedDate);
  const hasCustodyExtensionData = hasFirstExtensionData || hasSecondExtensionData || hasThirdExtensionData;
  const hasRecalculationData = Boolean(input.custodyAdditionalCrimeDiscoveredDate || input.custodyRecalculationReportedDate || input.custodyRecalculationApprovedDate);
  const hasSpecialPostponementData = Boolean(input.custodySpecialPostponementApprovedDate);
  const needsFirstExtension = custodyTrackRank >= 1 || hasFirstExtensionData || hasSecondExtensionData || hasThirdExtensionData;
  const needsSecondExtension = custodyTrackRank >= 2 || hasSecondExtensionData || hasThirdExtensionData;
  const needsThirdExtension = custodyTrackRank >= 3 || hasThirdExtensionData;
  if ((custodyTrackRank > 0 || input.custodyTrack === "npcSpecial" || hasCustodyExtensionData || hasRecalculationData || hasSpecialPostponementData) && !input.arrestDate) {
    add({ id: "custody-extension-without-arrest-base", severity: "warning", title: "缺少实际执行逮捕时间", detail: "侦查羁押及其延长、重新计算均以已经执行逮捕并继续羁押为前提。即使已录拘留时间，系统也只作条件预测，不把延押或重新计算识别为生效。" });
  }
  if (needsFirstExtension && !input.custodyFirstExtensionConditionsConfirmed) {
    add({ id: "custody-first-conditions-unconfirmed", severity: "warning", title: "首次延押法定条件未确认", detail: "应同时核对：案情复杂且期满不能侦结、仍符合逮捕条件、确有继续羁押必要。" });
  }
  if (needsFirstExtension && !input.custodyFirstExtensionApprovedDate) {
    add({ id: "custody-first-approval-missing", severity: "warning", title: "首次延押批准决定未录入", detail: "在上一级人民检察院批准前，当前有效届满日仍是基础2个月期满日。" });
  }
  if (needsSecondExtension && input.custodySpecialGround === "none") {
    add({ id: "custody-second-ground-missing", severity: "warning", title: "未选择第158条四类重大复杂案件事由", detail: "普通故意伤害案件不能因为人数多就自动适用再延长二个月。" });
  }
  if (needsSecondExtension && !input.custodySecondExtensionApprovedDate) {
    add({ id: "custody-second-approval-missing", severity: "warning", title: "四类重大复杂案件延押批准未录入", detail: "未取得省级人民检察院批准，系统不会把累计5个月显示为当前有效届满日。" });
  }
  if (needsThirdExtension && !input.custodyTenYearEligible) {
    add({ id: "custody-third-ten-year-unconfirmed", severity: "warning", title: "未确认可能判处10年有期徒刑以上", detail: "不能只按涉嫌罪名选择，应根据案件事实和可能适用的法定刑核验。" });
  }
  if (needsThirdExtension && !input.custodyThirdExtensionApprovedDate) {
    add({ id: "custody-third-approval-missing", severity: "warning", title: "十年以上刑罚案件再次延押批准未录入", detail: "未取得省级人民检察院批准，系统不会把累计7个月显示为当前有效届满日。" });
  }
  if (input.custodyFirstExtensionApprovedDate && !input.custodyFirstExtensionRequestedDate) {
    add({ id: "custody-first-approval-without-request", severity: "warning", title: "首次延押已有批准日但缺少公安提请日", detail: "请补录同级检察院收件凭证或公安提请材料，以核对是否在期限届满七日前提请。" });
  }
  if (input.custodySecondExtensionApprovedDate && !input.custodySecondExtensionRequestedDate) {
    add({ id: "custody-second-approval-without-request", severity: "warning", title: "第二层延押已有批准日但缺少公安提请日", detail: "请补录层报省级人民检察院的实际提请日，以核对七日前提请要求。" });
  }
  if (input.custodyThirdExtensionApprovedDate && !input.custodyThirdExtensionRequestedDate) {
    add({ id: "custody-third-approval-without-request", severity: "warning", title: "第三层延押已有批准日但缺少公安提请日", detail: "请补录层报省级人民检察院的实际提请日，以核对七日前提请要求。" });
  }
  if (input.custodySecondExtensionRequestedDate && !input.custodyFirstExtensionApprovedDate) {
    add({ id: "custody-second-request-without-first", severity: "error", title: "第二层延押已提请但首次延押尚未批准", detail: "第158条层级不能跳过首次延押批准；当前只能保留为条件预测。" });
  }
  if (input.custodyThirdExtensionRequestedDate && (!input.custodyFirstExtensionApprovedDate || !input.custodySecondExtensionApprovedDate)) {
    add({ id: "custody-third-request-without-prior", severity: "error", title: "第三层延押已提请但前序延押批准不完整", detail: "第159条必须在第158条延长期限届满后依次适用；当前只能保留为条件预测。" });
  }
  if (input.custodySecondExtensionApprovedDate && !input.custodyFirstExtensionApprovedDate) {
    add({ id: "custody-second-without-first", severity: "error", title: "已录入第二层延押，但缺少首次延押批准", detail: "第158条的延长必须在前一层期限基础上依次适用。" });
  }
  if (input.custodyThirdExtensionApprovedDate && (!input.custodyFirstExtensionApprovedDate || !input.custodySecondExtensionApprovedDate)) {
    add({ id: "custody-third-without-prior", severity: "error", title: "已录入第三层延押，但前序延押批准不完整", detail: "第159条必须在第158条延长期限届满后才可适用。" });
  }
  if (hasCustodyExtensionData && custodyTrackRank === 0 && input.custodyTrack !== "npcSpecial") {
    add({ id: "custody-approval-track-mismatch", severity: "warning", title: "已录入延押材料，但路径仍为基础2个月", detail: "请根据最高已批准层级选择相应路径；系统仍会保留已录批准日期并作出校验。" });
  }

  const additionalCrime = parseLocalDate(input.custodyAdditionalCrimeDiscoveredDate);
  const recalculationReport = parseLocalDate(input.custodyRecalculationReportedDate);
  const recalculationApproval = parseLocalDate(input.custodyRecalculationApprovedDate);
  const actualArrest = parseLocalDate(input.arrestDate);
  const custodyCycleStart = actualArrest && additionalCrime && recalculationApproval && additionalCrime >= actualArrest && recalculationApproval >= additionalCrime
    ? additionalCrime
    : actualArrest;
  const custodyApprovalChecks: Array<{ requestKey: keyof CaseInputs; approvalKey: keyof CaseInputs; months: number; label: string; id: string }> = [
    { requestKey: "custodyFirstExtensionRequestedDate", approvalKey: "custodyFirstExtensionApprovedDate", months: 2, label: "首次延押", id: "first" },
    { requestKey: "custodySecondExtensionRequestedDate", approvalKey: "custodySecondExtensionApprovedDate", months: 3, label: "四类重大复杂案件延押", id: "second" },
    { requestKey: "custodyThirdExtensionRequestedDate", approvalKey: "custodyThirdExtensionApprovedDate", months: 5, label: "十年以上刑罚案件再次延押", id: "third" },
  ];
  if (custodyCycleStart) {
    for (const check of custodyApprovalChecks) {
      const cap = addMonthsClamped(custodyCycleStart, check.months);
      const requestDue = addDays(cap, -7);
      const requested = parseLocalDate(input[check.requestKey] as string);
      const approved = parseLocalDate(input[check.approvalKey] as string);
      if (requested && requested > requestDue) add({ id: `custody-${check.id}-request-late`, severity: "warning", title: `${check.label}未在届满七日前提请`, detail: `法定最迟提请日为${toDateKey(requestDue)}；实际提请日为${toDateKey(requested)}。请核对同级检察院收件凭证。` });
      if (requested && requested > cap) add({ id: `custody-${check.id}-request-after-cap`, severity: "error", title: `${check.label}在原法定羁押期限届满后才提请`, detail: "超过法定羁押期限提请延长的，人民检察院不予受理。" });
      if (approved && (approved < custodyCycleStart || approved > cap)) add({ id: `custody-${check.id}-approval-outside-cycle`, severity: "error", title: `${check.label}批准日不在本次羁押周期内`, detail: `本层原法定期限届满日为${toDateKey(cap)}。请核对批准决定的送达日和发现另有重要罪行后的新周期。` });
    }
  }
  if (recalculationReport && !additionalCrime) add({ id: "custody-recalculation-report-without-discovery", severity: "error", title: "已录入重新计算报批日，但缺少发现另有重要罪行日", detail: "五日报批期限和重新计算起点都必须以实际发现日为基础。" });
  if (recalculationApproval && !additionalCrime) add({ id: "custody-recalculation-without-discovery", severity: "error", title: "已录入重新计算批准，但缺少发现另有重要罪行日", detail: "重新计算的法定起点是发现日，不是批准日。" });
  if (additionalCrime && !recalculationReport) add({ id: "custody-recalculation-report-missing", severity: "warning", title: "发现另有重要罪行后的实际报批日未录入", detail: "公安机关应当自发现之日起五日以内报县级以上公安机关负责人批准。五日约束的是报批时点。" });
  if (recalculationApproval && !recalculationReport) add({ id: "custody-recalculation-approval-without-report", severity: "warning", title: "已有重新计算批准日但缺少实际报批日", detail: "请补录报批材料日期，以核验是否遵守发现日起五日内报批的要求。" });
  if (additionalCrime && recalculationReport && recalculationReport > addDays(additionalCrime, 5)) add({ id: "custody-recalculation-report-late", severity: "warning", title: "重新计算报批超过发现后5日", detail: "请核对发现笔录和实际报县级以上公安机关负责人批准的日期；五日并非批准完成期限。" });
  if (additionalCrime && !recalculationApproval) add({ id: "custody-recalculation-approval-missing", severity: "warning", title: "重新计算批准决定未录入", detail: "在县级以上公安机关负责人批准之前，系统不会把发现日作为已生效的新起算日；法律未另定统一批准完成日数。" });
  if (input.custodyTrack === "npcSpecial" && !input.custodySpecialPostponementApprovedDate) add({ id: "custody-special-postponement-approval-missing", severity: "warning", title: "特别重大复杂案件延期批准未录入", detail: "须由最高人民检察院报请全国人大常委会批准。未取得并核对批准决定前，普通侦查羁押期限仍应继续计算，不能被自动改为无固定日期。" });
  if (hasSpecialPostponementData && input.custodyTrack !== "npcSpecial") add({ id: "custody-special-postponement-track-mismatch", severity: "warning", title: "已录入第157条批准，但当前核验层级不是例外程序", detail: "请切换到第157条例外程序并核对全国人大常委会批准决定载明的具体处理内容。" });

  if (input.criminalFiledDate && input.noCaseDecisionDate) add({ id: "filed-and-no-case", severity: "warning", title: "同时录入刑事立案与不予立案决定", detail: "如系复议、复核或检察监督后改正，属于可能的正常先后过程；否则请核对是否为不同嫌疑人或分案。" });
  if (input.courtReceivedDate && input.nonProsecutionReceivedDate) add({ id: "court-and-non-prosecution", severity: "warning", title: "同时录入法院受理与不起诉决定", detail: "同一嫌疑人的同一程序分支通常不能并存；多人分案时应在备注说明。" });
  if (input.caseRoute === "private" && input.trialTrack !== "private6" && !input.detentionAt && !input.arrestDate) add({ id: "private-track", severity: "warning", title: "自诉路径未选择未羁押6个月审限", detail: "若自诉案件被告人未被羁押，应选择‘未羁押自诉6个月’；被羁押时才按公诉审限规则。" });
  const outside2026 = DATE_FIELDS.some(([key]) => { const value = input[key]; const parsed = typeof value === "string" ? parseLocalDate(value) : null; return parsed && parsed.getFullYear() !== 2026; });
  if (outside2026) add({ id: "holiday-calendar-outside-2026", severity: "warning", title: "案件日期超出完整节假日年度", detail: "当前仅完整内置2026年法定节假日和调休；其他年度顺延结果须核对当年放假安排。" });
  return issues;
}

export function getDefaultInputs(today = new Date()): CaseInputs {
  return {
    caseName: "新建刑事案件", perspective: "victimAgent", caseRoute: "public", asOf: toChinaDateTimeKey(today), optionalProcedures: [], incidentDate: "", reportDate: "", acceptedAt: "",
    appraisalCommissionAt: "", appraisalComplexity: "instant", appraisalOpinionAt: "", appraisalDocumentDate: "", appraisalServedDate: "", injuryLevel: "pending",
    criminalReviewStartDate: "", criminalReviewTrack: "verify", criminalFiledDate: "", noCaseDecisionDate: "", noCaseNoticeDate: "", reconsiderApplicationDate: "", reconsiderDecisionDate: "", reconsiderExtended: false, reviewApplicationDate: "", reviewDecisionDate: "", reviewExtended: false, prosecutorComplaintDate: "", prosecutorFileNoticeDate: "",
    detentionAt: "", detentionTrack: "special14", arrestDate: "", custodyTrack: "base2", custodyFirstExtensionConditionsConfirmed: false, custodyFirstExtensionRequestedDate: "", custodyFirstExtensionApprovedDate: "", custodySpecialGround: "none", custodySecondExtensionRequestedDate: "", custodySecondExtensionApprovedDate: "", custodyTenYearEligible: false, custodyThirdExtensionRequestedDate: "", custodyThirdExtensionApprovedDate: "", custodyAdditionalCrimeDiscoveredDate: "", custodyRecalculationReportedDate: "", custodyRecalculationApprovedDate: "", custodySpecialPostponementApprovedDate: "", defenseRightTriggerAt: "", defenseRightNoticeAt: "", bailStartDate: "", bailEndDate: "", residentialSurveillanceStartDate: "", residentialSurveillanceEndDate: "", measureChangeApplicationDate: "", measureChangeDecisionDate: "", custodyNecessityApplicationDate: "", custodyNecessityDecisionDate: "", custodyNecessityTrack: "procuratorate10", recusalApplicationDate: "", recusalDecisionTrack: "ordinary2", recusalDecisionDate: "", recusalRejectedReceivedDate: "", recusalReviewApplicationDate: "", recusalReviewDecisionDate: "",
    prosecutionReceivedDate: "", prosecutionChangedJurisdictionReceivedDate: "", prosecutionTrack: "ordinary", prosecutionRightsNoticeDate: "", prosecutionDefenseNoticeDate: "", supplement1ReturnedDate: "", supplement1ResubmittedDate: "", supplement2ReturnedDate: "", supplement2ResubmittedDate: "", rightsObstructionComplaintDate: "", rightsObstructionReplyDate: "", nonProsecutionReceivedDate: "", nonProsecutionAppealDate: "", nonProsecutionReviewFiledDate: "", nonProsecutionReviewDecisionDate: "", nonProsecutionReviewExtended: false,
    courtProsecutionReceivedDate: "", courtReceivedDate: "", courtDefenseNoticeDate: "", privateProsecutionSubmittedDate: "", privateProsecutionAcceptedDate: "", incidentalCivilSubmittedDate: "", incidentalCivilAcceptedDate: "", hearingDate: "", indictmentReceivedDate: "", hearingNoticeReceivedDate: "", trialTrack: "ordinary3", judgmentAnnouncedDate: "", judgmentPronouncementTrack: "inCourt", judgmentReceivedDate: "", protestRequestDate: "", protestDecisionReceivedDate: "", firstDecisionType: "judgment", appealFiledDate: "", firstCourtTransferredDate: "",
    secondInstanceReceivedDate: "", secondInstanceTrack: "ordinary2", secondJudgmentReceivedDate: "", complaintReviewStartedDate: "", complaintDecisionDate: "", complaintExtended: false, retrialDecisionDate: "", retrialCompletedDate: "", retrialExtended: false, effectiveJudgmentDate: "", executionDocumentsDeliveredDate: "", propertyExecutionTransferredDate: "", propertyExecutionFiledDate: "", propertyExecutionCompletedDate: "", propertyExecutionExtended: false,
  };
}
