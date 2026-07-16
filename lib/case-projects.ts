import { getDefaultInputs, OPTIONAL_PROCEDURE_IDS, parseLocalDate } from "./deadlines.ts";
import type { CaseInputs, DeadlineItem } from "./deadlines.ts";

// 保留旧键名，确保此前浏览器中已经录入的案件仍可读取。
export const WORKBENCH_STORAGE_KEY = "injury-case-workbench-v2";
export const LEGACY_STORAGE_KEY = "injury-case-deadline-v1";
export const MAX_PROJECTS = 500;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type CaseProjectStatus = "准备中" | "公安侦查" | "审查起诉" | "一审" | "二审" | "申诉再审" | "执行" | "已归档";

export type CaseProject = {
  id: string;
  status: CaseProjectStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  inputs: CaseInputs;
};

export type WorkbenchData = { version: 2; activeProjectId: string; projects: CaseProject[] };

export const projectStatuses: CaseProjectStatus[] = ["准备中", "公安侦查", "审查起诉", "一审", "二审", "申诉再审", "执行", "已归档"];

export function inferProjectStatus(inputs: CaseInputs): Exclude<CaseProjectStatus, "已归档"> {
  if (inputs.effectiveJudgmentDate || inputs.executionDocumentsDeliveredDate || inputs.propertyExecutionTransferredDate || inputs.propertyExecutionFiledDate || inputs.propertyExecutionCompletedDate) return "执行";
  if (inputs.complaintReviewStartedDate || inputs.complaintDecisionDate || inputs.retrialDecisionDate || inputs.retrialCompletedDate) return "申诉再审";
  if (inputs.firstCourtTransferredDate || inputs.secondInstanceReceivedDate || inputs.secondJudgmentReceivedDate) return "二审";
  if (inputs.courtProsecutionReceivedDate || inputs.courtReceivedDate || inputs.privateProsecutionSubmittedDate || inputs.privateProsecutionAcceptedDate || inputs.hearingDate || inputs.judgmentAnnouncedDate || inputs.judgmentReceivedDate) return "一审";
  if (inputs.prosecutionReceivedDate || inputs.prosecutionChangedJurisdictionReceivedDate || inputs.supplement1ReturnedDate || inputs.supplement1ResubmittedDate || inputs.supplement2ReturnedDate || inputs.supplement2ResubmittedDate || inputs.nonProsecutionReceivedDate) return "审查起诉";
  if (
    inputs.criminalFiledDate || inputs.detentionAt || inputs.arrestDate || inputs.defenseRightTriggerAt || inputs.recusalApplicationDate
    || inputs.custodyFirstExtensionRequestedDate || inputs.custodyFirstExtensionApprovedDate
    || inputs.custodySecondExtensionRequestedDate || inputs.custodySecondExtensionApprovedDate
    || inputs.custodyThirdExtensionRequestedDate || inputs.custodyThirdExtensionApprovedDate
    || inputs.custodyAdditionalCrimeDiscoveredDate || inputs.custodyRecalculationReportedDate || inputs.custodyRecalculationApprovedDate || inputs.custodySpecialPostponementApprovedDate
  ) return "公安侦查";
  return "准备中";
}

export function advanceProjectStatus(current: CaseProjectStatus, inputs: CaseInputs): CaseProjectStatus {
  if (current === "已归档") return current;
  const inferred = inferProjectStatus(inputs);
  return projectStatuses.indexOf(inferred) > projectStatuses.indexOf(current) ? inferred : current;
}

const stageRanges: Record<Exclude<CaseProjectStatus, "已归档">, [number, number]> = {
  "准备中": [1, 1],
  "公安侦查": [1, 3],
  "审查起诉": [4, 4],
  "一审": [5, 5],
  "二审": [6, 6],
  "申诉再审": [7, 7],
  "执行": [7, 7],
};

const deadlinePriority: Record<DeadlineItem["status"], number> = {
  overdue: 0, expired: 0, dueSoon: 0, trigger: 0, future: 1, projected: 2, waiting: 3, done: 4,
};

function sortNextDeadlines(a: DeadlineItem, b: DeadlineItem): number {
  const statusDifference = deadlinePriority[a.status] - deadlinePriority[b.status];
  if (statusDifference) return statusDifference;
  const dueDifference = (a.due?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.due?.getTime() ?? Number.MAX_SAFE_INTEGER);
  return dueDifference || a.stageNo - b.stageNo;
}

export function getNextProcedureDeadline(status: CaseProjectStatus, deadlines: DeadlineItem[]): DeadlineItem | null {
  if (status === "已归档") return null;
  const [fromStage, toStage] = stageRanges[status];
  const unfinished = deadlines.filter((item) => item.status !== "done");
  const currentStage = unfinished.filter((item) => item.stageNo >= fromStage && item.stageNo <= toStage).sort(sortNextDeadlines);
  if (currentStage.length) return currentStage[0];
  return unfinished.filter((item) => item.stageNo > toStage).sort((a, b) => a.stageNo - b.stageNo || sortNextDeadlines(a, b))[0] ?? null;
}

export function makeId(prefix = "case"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createProject(inputs: CaseInputs, status: CaseProjectStatus = "准备中", id = makeId()): CaseProject {
  const now = new Date().toISOString();
  return { id, status, notes: "", createdAt: now, updatedAt: now, inputs };
}

export function createBlankInputs(now = new Date()): CaseInputs {
  return getDefaultInputs(now);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const enumFields: Partial<Record<keyof CaseInputs, readonly string[]>> = {
  perspective: ["victimAgent", "suspectDefendant", "defender"],
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

const booleanFields = new Set<keyof CaseInputs>([
  "reconsiderExtended", "reviewExtended", "custodyFirstExtensionConditionsConfirmed", "custodyTenYearEligible",
  "nonProsecutionReviewExtended", "complaintExtended", "retrialExtended", "propertyExecutionExtended",
]);

function isDateField(key: keyof CaseInputs): boolean {
  return key === "asOf" || key === "incidentDate" || key === "reportDate" || key.endsWith("Date") || key.endsWith("At");
}

function normalizeInputs(value: unknown): CaseInputs {
  const defaults = createBlankInputs();
  if (!isRecord(value)) return defaults;
  const target = { ...defaults } as CaseInputs;
  const mutable = target as unknown as Record<string, unknown>;
  for (const key of Object.keys(defaults) as Array<keyof CaseInputs>) {
    const candidate = value[key];
    if (key === "caseName") {
      if (typeof candidate === "string") target.caseName = candidate.slice(0, 160) || defaults.caseName;
      continue;
    }
    if (key === "optionalProcedures") {
      if (Array.isArray(candidate)) target.optionalProcedures = [...new Set(candidate.filter((id): id is CaseInputs["optionalProcedures"][number] => typeof id === "string" && OPTIONAL_PROCEDURE_IDS.includes(id as CaseInputs["optionalProcedures"][number])))];
      continue;
    }
    const allowed = enumFields[key];
    if (allowed) {
      if (typeof candidate === "string" && allowed.includes(candidate)) mutable[key] = candidate;
      continue;
    }
    if (booleanFields.has(key)) {
      if (typeof candidate === "boolean") mutable[key] = candidate;
      continue;
    }
    if (isDateField(key) && typeof candidate === "string") {
      const normalized = key === "asOf" && candidate && !candidate.includes("T") ? `${candidate}T00:00` : candidate;
      if (!normalized || parseLocalDate(normalized)) mutable[key] = normalized;
    }
  }
  return target;
}

function normalizeTimestamp(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.length > 64 || Number.isNaN(Date.parse(value))) return fallback;
  return value;
}

function normalizeProject(value: unknown, index: number): CaseProject | null {
  if (!isRecord(value)) return null;
  const now = new Date().toISOString();
  const legacyStatuses: Record<string, CaseProjectStatus> = {
    "公安办理中": "公安侦查",
    "检察院阶段": "审查起诉",
    "法院阶段": "一审",
    "已办结": "执行",
  };
  const storedStatus = typeof value.status === "string" && projectStatuses.includes(value.status as CaseProjectStatus)
    ? value.status as CaseProjectStatus
    : typeof value.status === "string" && legacyStatuses[value.status]
      ? legacyStatuses[value.status]
      : "准备中";
  const inputs = normalizeInputs(value.inputs);
  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim().slice(0, 160) : makeId(`import-${index + 1}`),
    status: advanceProjectStatus(storedStatus, inputs),
    notes: typeof value.notes === "string" ? value.notes.slice(0, 20_000) : "",
    createdAt: normalizeTimestamp(value.createdAt, now),
    updatedAt: normalizeTimestamp(value.updatedAt, now),
    inputs,
  };
}

export function parseWorkbench(value: unknown): WorkbenchData | null {
  if (!isRecord(value) || value.version !== 2 || !Array.isArray(value.projects)) return null;
  const normalized = value.projects.slice(0, MAX_PROJECTS).map(normalizeProject).filter((project): project is CaseProject => Boolean(project));
  if (!normalized.length) return null;
  const ids = new Set<string>();
  const projects = normalized.map((project, index) => {
    let id = project.id;
    while (ids.has(id)) id = makeId(`import-${index + 1}`);
    ids.add(id);
    return id === project.id ? project : { ...project, id };
  });
  const requested = typeof value.activeProjectId === "string" ? value.activeProjectId : "";
  return { version: 2, activeProjectId: projects.some((p) => p.id === requested) ? requested : projects[0].id, projects };
}

export function mergeWorkbenches(current: WorkbenchData, incoming: WorkbenchData): WorkbenchData {
  const ids = new Set(current.projects.map((project) => project.id));
  const added = incoming.projects.slice(0, Math.max(0, MAX_PROJECTS - current.projects.length)).map((project, index) => {
    let id = project.id;
    while (ids.has(id)) id = makeId(`import-${index + 1}`);
    ids.add(id);
    return id === project.id ? project : { ...project, id };
  });
  return added.length ? { version: 2, activeProjectId: added[0].id, projects: [...added, ...current.projects] } : current;
}

export function migrateLegacy(value: unknown): WorkbenchData {
  const project = createProject(normalizeInputs(value), "公安侦查", "legacy-case");
  return { version: 2, activeProjectId: project.id, projects: [project] };
}

export function initialWorkbench(): WorkbenchData {
  const project = createProject(getDefaultInputs(), "准备中", "first-case");
  return { version: 2, activeProjectId: project.id, projects: [project] };
}
