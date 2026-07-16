"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildDeadlines, CaseInputs, CasePerspective, DeadlineItem, validateCaseInputs } from "../lib/deadlines";
import { filterDeadlinesByRoleScope, roleViewConfigs, TimelineScope } from "../lib/role-views";
import {
  advanceProjectStatus, CaseProject, createBlankInputs, createProject, initialWorkbench, LEGACY_STORAGE_KEY,
  getNextProcedureDeadline, MAX_IMPORT_BYTES, MAX_PROJECTS, mergeWorkbenches, migrateLegacy, parseWorkbench,
  WorkbenchData, WORKBENCH_STORAGE_KEY,
} from "../lib/case-projects";
import { procedureStages, ProcedureStage, procedureStagesForDeadline, visibleInProcedureStage } from "../lib/procedure-stages";
import { filterLegalDocuments, legalSourceGroups, legalTopics, LegalDocument } from "../lib/legal-catalog";
import {
  formatLocalLegalFileSize, importLocalLegalFiles, listLocalLegalDocuments, LocalLegalDocument,
  readLocalLegalContent, removeLocalLegalDocument,
} from "../lib/local-legal-library";
import { RoleInputSections } from "./role-input-sections";
import { ProcedureGuide } from "./procedure-guide";

type Tab = "cases" | "calculator" | "procedure" | "sources";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const workPageTitles: Record<Exclude<Tab, "cases">, string> = {
  calculator: "程序期限",
  procedure: "程序说明",
  sources: "法律依据",
};

const tabItems: Array<{ key: Tab; index: string; label: string }> = [
  { key: "cases", index: "01", label: "案件" },
  { key: "calculator", index: "02", label: "程序期限" },
  { key: "procedure", index: "03", label: "程序说明" },
  { key: "sources", index: "04", label: "法律依据" },
];

const perspectiveLabels: Record<CasePerspective, string> = {
  victimAgent: "被害人／诉讼代理人", suspectDefendant: "犯罪嫌疑人／被告人", defender: "辩护人",
};
const statusLabels = { done: "已完成", overdue: "已届满", dueSoon: "临近／今日", future: "未届满", waiting: "待补录", expired: "申请期已过", trigger: "监督触发", projected: "预测" };
const procedureStageIndex: Record<string, number> = { "准备中": -1, "公安侦查": 0, "审查起诉": 1, "一审": 2, "二审": 3, "申诉再审": 4, "执行": 4, "已归档": 5 };
const procedureStageGuides: Record<ProcedureStage, { inputHint: string }> = {
  "公安侦查": {
    inputHint: "立案日、刑事拘留时间和执行逮捕时间。",
  },
  "审查起诉": {
    inputHint: "检察院实际收案日；退回补充侦查时录入退回日和重新移送日。",
  },
  "一审": {
    inputHint: "法院收案日、正式受理日、开庭日和裁判送达日。",
  },
  "二审": {
    inputHint: "上诉或抗诉提出日、二审法院实际收案日。",
  },
  "执行": {
    inputHint: "裁判生效日；涉财产执行时录入执行立案日和延长批准日。",
  },
};

type ProcedureProgressItem = {
  id: string;
  stage: string;
  visibleStages: ProcedureStage[];
  title: string;
  dateText: string;
  source: "actual" | "statutory" | "projected";
  sourceLabel: string;
  statusLabel: string;
  basis: string;
  lawText?: string;
};

function displayRecordedDate(value: string): string {
  return value.replace("T", " ");
}

function procedureStageFromDisplayLabel(stage: string): ProcedureStage {
  if (stage === "审查起诉") return "审查起诉";
  if (stage === "一审") return "一审";
  if (stage === "二审") return "二审";
  if (stage === "执行") return "执行";
  return "公安侦查";
}

type ProgressDisplayOptions = {
  visibleStages?: ProcedureStage[];
  displayStage?: string;
};

function buildProcedureProgress(inputs: CaseInputs, deadlines: DeadlineItem[]): ProcedureProgressItem[] {
  const items: ProcedureProgressItem[] = [];
  const byId = new Map(deadlines.map((item) => [item.id, item]));
  const actual = (id: string, stage: string, title: string, value: string, basis: string, lawSourceId?: string, options?: ProgressDisplayOptions) => {
    if (!value) return;
    const lawSource = lawSourceId ? byId.get(lawSourceId) : undefined;
    items.push({
      id,
      stage: options?.displayStage ?? stage,
      visibleStages: options?.visibleStages ?? (lawSource ? procedureStagesForDeadline(lawSource) : [procedureStageFromDisplayLabel(stage)]),
      title,
      dateText: displayRecordedDate(value),
      source: "actual",
      sourceLabel: "已记录",
      statusLabel: "已记录",
      basis,
      lawText: lawSource?.lawText,
    });
  };
  const deadline = (id: string, title?: string, options?: ProgressDisplayOptions) => {
    const item = byId.get(id);
    if (!item?.due) return;
    items.push({ id, stage: options?.displayStage ?? item.stage, visibleStages: options?.visibleStages ?? procedureStagesForDeadline(item), title: title ?? item.title, dateText: item.dateText, source: item.provisional ? "projected" : "statutory", sourceLabel: item.provisional ? "预测" : "法定节点", statusLabel: statusLabels[item.status], basis: item.basis, lawText: item.lawText });
  };

  if (inputs.perspective === "victimAgent") {
    actual("actual-report", "接报案与立案", "报案", inputs.reportDate, "《公安机关办理刑事案件程序规定》第169、171条", "receipt");
    actual("actual-accepted", "接报案与立案", "公安机关受理", inputs.acceptedAt, "《公安机关办理刑事案件程序规定》第169、171条", "receipt");
    deadline("filing-review", "刑事立案审查期满");
    actual("actual-filed", "接报案与立案", "刑事立案", inputs.criminalFiledDate, "《刑事诉讼法》第112条");
  }
  if (inputs.perspective !== "victimAgent") actual("actual-defense-trigger", "侦查与强制措施", "第一次讯问或采取强制措施", inputs.defenseRightTriggerAt, "《刑事诉讼法》第34条", "defense-right-investigation");
  actual("actual-detention", "侦查与强制措施", "刑事拘留", inputs.detentionAt, "《刑事诉讼法》第85、86条", "detention-24");
  if (inputs.arrestDate) actual("actual-arrest", "侦查与强制措施", "执行逮捕", inputs.arrestDate, "《刑事诉讼法》第93、94条", "arrest-24");
  else deadline("detention-cap", "拘留至批捕决定最长节点");
  if (inputs.custodyAdditionalCrimeDiscoveredDate) actual("actual-custody-additional-crime", "侦查与强制措施", "发现另有重要罪行", inputs.custodyAdditionalCrimeDiscoveredDate, "《刑事诉讼法》第160条", "custody-recalculation-report");
  if (inputs.custodyRecalculationReportedDate) actual("actual-custody-recalculation-reported", "侦查与强制措施", "发现另有重要罪行后报批重新计算", inputs.custodyRecalculationReportedDate, "《公安机关办理刑事案件程序规定》第151条", "custody-recalculation-report");
  if (inputs.custodyRecalculationApprovedDate) actual("actual-custody-recalculation-approved", "侦查与强制措施", "批准重新计算侦查羁押期限", inputs.custodyRecalculationApprovedDate, "《公安机关办理刑事案件程序规定》第151条", "custody-recalculation-approval");
  else deadline("custody-recalculation-report", "发现另有重要罪行后5日内报批节点");
  const custodyExtensionProgress = [
    { request: inputs.custodyFirstExtensionRequestedDate, approval: inputs.custodyFirstExtensionApprovedDate, requestId: "custody-extension-1-request", approvalId: "custody-extension-1-approval", requestTitle: "首次延押实际提请", approvalTitle: "首次延押获批：延长1个月" },
    { request: inputs.custodySecondExtensionRequestedDate, approval: inputs.custodySecondExtensionApprovedDate, requestId: "custody-extension-2-request", approvalId: "custody-extension-2-approval", requestTitle: "第158条延押实际提请", approvalTitle: "第158条延押获批：再延长2个月" },
    { request: inputs.custodyThirdExtensionRequestedDate, approval: inputs.custodyThirdExtensionApprovedDate, requestId: "custody-extension-3-request", approvalId: "custody-extension-3-approval", requestTitle: "第159条再次延押实际提请", approvalTitle: "第159条延押获批：再延长2个月" },
  ];
  for (const extension of custodyExtensionProgress) {
    if (extension.request) actual(`actual-${extension.requestId}`, "侦查与强制措施", extension.requestTitle, extension.request, "《公安机关办理刑事案件程序规定》第148—150条", extension.requestId);
    else deadline(extension.requestId);
    if (extension.approval) actual(`actual-${extension.approvalId}`, "侦查与强制措施", extension.approvalTitle, extension.approval, "《刑事诉讼法》第156、158、159条", extension.approvalId);
    else deadline(extension.approvalId);
  }
  if (inputs.custodySpecialPostponementApprovedDate) actual("actual-custody-special-postponement", "侦查与强制措施", "全国人大常委会批准特殊延期", inputs.custodySpecialPostponementApprovedDate, "《刑事诉讼法》第157条", "custody-special-postponement");
  deadline("custody-cap", "当前有效的逮捕后侦查羁押期限届满");
  deadline("custody-conditional-cap", "延押均获批时的条件预测届满日");

  if (inputs.prosecutionReceivedDate) actual("actual-prosecution-received", "审查起诉", "检察院首次收案", inputs.prosecutionReceivedDate, "《刑事诉讼法》第172条；《人民检察院刑事诉讼规则》第351条", "prosecution-decision");
  else deadline("prosecution-transfer-forecast", "预计侦查终结并移送审查起诉", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "侦查终结与移送" });
  actual("actual-jurisdiction-change", "审查起诉", "改变管辖后新检察院收案", inputs.prosecutionChangedJurisdictionReceivedDate, "《人民检察院刑事诉讼规则》第351条", "prosecution-decision");
  actual("actual-supplement-1-return", "审查起诉", "第一次退回补充侦查", inputs.supplement1ReturnedDate, "《刑事诉讼法》第175条", "supplement-1", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "退回补充侦查" });
  deadline("supplement-1", "第一次补充侦查期限届满", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "退回补充侦查" });
  actual("actual-supplement-1-resubmit", "审查起诉", "第一次补侦重报", inputs.supplement1ResubmittedDate, "《刑事诉讼法》第175条", "supplement-1", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "退回补充侦查" });
  actual("actual-supplement-2-return", "审查起诉", "第二次退回补充侦查", inputs.supplement2ReturnedDate, "《刑事诉讼法》第175条", "supplement-2", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "退回补充侦查" });
  deadline("supplement-2", "第二次补充侦查期限届满", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "退回补充侦查" });
  actual("actual-supplement-2-resubmit", "审查起诉", "第二次补侦重报", inputs.supplement2ResubmittedDate, "《刑事诉讼法》第175条", "supplement-2", { visibleStages: ["公安侦查", "审查起诉"], displayStage: "退回补充侦查" });
  deadline("prosecution-extension", "重大复杂案件1个月基本期限届满");
  deadline("prosecution-decision", "审查起诉决定期限届满");

  actual("actual-court-materials", "一审", "法院收到公诉材料", inputs.courtProsecutionReceivedDate, "《最高人民法院关于适用〈中华人民共和国刑事诉讼法〉的解释》第219条", "court-acceptance");
  if (inputs.courtReceivedDate) actual("actual-court-accepted", "一审", "法院正式受理", inputs.courtReceivedDate, "《刑诉法解释》第219条", "court-acceptance");
  else deadline("court-acceptance", "法院公诉案件受理审查期满");
  actual("actual-hearing", "一审", "开庭", inputs.hearingDate, "《刑事诉讼法》第187条", "hearing-notice");
  deadline("trial", "一审审理期限届满");
  actual("actual-judgment", "一审", "收到一审裁判", inputs.judgmentReceivedDate, "《刑事诉讼法》第229、230条", "judgment-service");
  if (inputs.perspective === "victimAgent") deadline("victim-protest", "请求检察院抗诉期限届满");
  else deadline("appeal", "上诉期限届满");

  actual("actual-second-received", "二审", "二审法院受理", inputs.secondInstanceReceivedDate, "《刑事诉讼法》第243条", "second-instance");
  deadline("second-instance", "二审审理期限届满");
  actual("actual-second-judgment", "二审", "收到二审裁判", inputs.secondJudgmentReceivedDate, "《刑事诉讼法》第243条", "second-instance");
  actual("actual-effective", "执行", "裁判生效", inputs.effectiveJudgmentDate, "《刑事诉讼法》第264条", "execution-documents");
  deadline("execution-documents", "交付执行法律文书期限届满");
  return items;
}

function TextField({ label, value, onChange, type = "date", hint }: { label: string; value: string; onChange: (value: string) => void; type?: "date" | "datetime-local" | "text"; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} />{hint && <small className="field-hint">{hint}</small>}</label>;
}
function SelectField<T extends string>({ label, value, onChange, options, hint }: { label: string; value: T; onChange: (value: T) => void; options: Array<[T, string]>; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><select value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{hint && <small className="field-hint">{hint}</small>}</label>;
}
function ToggleField({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return <label className="toggle-field"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="toggle-control" /><span><strong>{label}</strong>{hint && <small>{hint}</small>}</span></label>;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, index) => part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : part);
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function htmlText(value: string | number) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "未命名刑事案件";
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("cases");
  const [workbench, setWorkbench] = useState<WorkbenchData>(() => initialWorkbench());
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [showWaiting, setShowWaiting] = useState(true);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [inspectedStageSelection, setInspectedStageSelection] = useState<{ projectId: string; status: string; stage: ProcedureStage } | null>(null);
  const [timelineScope, setTimelineScope] = useState<TimelineScope>("focus");
  const [caseSearch, setCaseSearch] = useState("");
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);
  const [localLegalDocs, setLocalLegalDocs] = useState<LocalLegalDocument[]>([]);
  const [legalDirectoryError, setLegalDirectoryError] = useState("");
  const [localLegalMessage, setLocalLegalMessage] = useState("");
  const [localLegalError, setLocalLegalError] = useState("");
  const [legalQuery, setLegalQuery] = useState("");
  const [legalSourceGroup, setLegalSourceGroup] = useState("all");
  const [legalTopic, setLegalTopic] = useState("all");
  const [activeLegalId, setActiveLegalId] = useState("");
  const [legalText, setLegalText] = useState("");
  const [legalTextForId, setLegalTextForId] = useState("");
  const [legalTextQuery, setLegalTextQuery] = useState("");
  const [localLegalObjectUrl, setLocalLegalObjectUrl] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const legalImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(WORKBENCH_STORAGE_KEY);
        if (saved) {
          const parsed = parseWorkbench(JSON.parse(saved));
          if (parsed) setWorkbench(parsed); else setStorageError("浏览器中的案件库无法通过完整性校验，已暂停覆盖保存；请先导出或清理损坏数据。");
        } else {
          const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) setWorkbench(migrateLegacy(JSON.parse(legacy)));
        }
      } catch { setStorageError("读取浏览器案件库失败，自动保存已暂停。现有本地数据不会被覆盖。"); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || storageError) return;
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(workbench)); }
      catch { setStorageError("浏览器拒绝保存案件数据，自动保存已暂停。请立即导出JSON备份。"); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [workbench, hydrated, storageError]);

  useEffect(() => {
    fetch(`${basePath}/legal/manifest.json`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((docs: LegalDocument[]) => {
      setLegalDocs(docs); setActiveLegalId((current) => current || docs[0]?.id || "");
    }).catch(() => setLegalDirectoryError("内置法律目录加载失败"));
  }, []);

  useEffect(() => {
    listLocalLegalDocuments().then(setLocalLegalDocs).catch(() => setLocalLegalError("当前浏览器无法读取本地法律文件。"));
  }, []);

  const activeProject = workbench.projects.find((p) => p.id === workbench.activeProjectId) ?? workbench.projects[0];
  const inputs = activeProject.inputs;
  const deadlines = useMemo(() => buildDeadlines(inputs), [inputs]);
  const projectRecords = useMemo(() => workbench.projects.map((project) => ({
    project,
    nextDeadline: getNextProcedureDeadline(project.status, buildDeadlines(project.inputs)),
  })), [workbench.projects]);
  const filteredProjectRecords = useMemo(() => {
    const query = caseSearch.trim().toLocaleLowerCase("zh-CN");
    if (!query) return projectRecords;
    return projectRecords.filter(({ project }) => `${project.inputs.caseName}${project.status}${project.notes}${perspectiveLabels[project.inputs.perspective]}`.toLocaleLowerCase("zh-CN").includes(query));
  }, [caseSearch, projectRecords]);
  const caseStats = useMemo(() => ({
    active: workbench.projects.filter((project) => project.status !== "已归档").length,
    attention: projectRecords.filter(({ nextDeadline }) => nextDeadline && ["overdue", "expired", "dueSoon", "trigger"].includes(nextDeadline.status)).length,
    archived: workbench.projects.filter((project) => project.status === "已归档").length,
  }), [projectRecords, workbench.projects]);
  const currentProcedureStage = procedureStages[Math.min(Math.max(procedureStageIndex[activeProject.status] ?? 0, 0), procedureStages.length - 1)];
  const inspectedStage = inspectedStageSelection?.projectId === activeProject.id && inspectedStageSelection.status === activeProject.status
    ? inspectedStageSelection.stage
    : currentProcedureStage;
  const setInspectedStage = (stage: ProcedureStage) => setInspectedStageSelection({ projectId: activeProject.id, status: activeProject.status, stage });
  const issues = useMemo(() => validateCaseInputs(inputs), [inputs]);
  const visibleDeadlines = useMemo(() => filterDeadlinesByRoleScope(deadlines, inputs.perspective, timelineScope, showWaiting), [deadlines, inputs.perspective, timelineScope, showWaiting]);
  const currentStageDeadlines = useMemo(() => deadlines.filter((item) => procedureStagesForDeadline(item).includes(currentProcedureStage)), [currentProcedureStage, deadlines]);
  const nextProcedure = useMemo(() => getNextProcedureDeadline(activeProject.status, deadlines), [activeProject.status, deadlines]);
  const nextForwardProcedure = useMemo(() => currentStageDeadlines
    .filter((item) => item.due && ["dueSoon", "future", "projected"].includes(item.status))
    .sort((a, b) => a.due!.getTime() - b.due!.getTime())[0] ?? null, [currentStageDeadlines]);
  const allProcedureProgress = useMemo(() => buildProcedureProgress(inputs, deadlines), [deadlines, inputs]);
  const procedureProgress = useMemo(() => allProcedureProgress.filter((item) => visibleInProcedureStage(item, inspectedStage)), [allProcedureProgress, inspectedStage]);
  const roleConfig = roleViewConfigs[inputs.perspective];
  const allLegalDocs = useMemo(() => [...legalDocs, ...localLegalDocs], [legalDocs, localLegalDocs]);
  const filteredLegal = useMemo(() => filterLegalDocuments(allLegalDocs, {
    sourceGroup: legalSourceGroup,
    topic: legalTopic,
    query: legalQuery,
  }), [allLegalDocs, legalQuery, legalSourceGroup, legalTopic]);
  const activeLegal = filteredLegal.find((doc) => doc.id === activeLegalId) ?? filteredLegal[0];
  const displayedLegalText = activeLegal?.id === legalTextForId ? legalText : "";
  const activeLegalIsLocalPdf = Boolean(activeLegal?.local && (activeLegal.mime_type === "application/pdf" || activeLegal.filename.toLowerCase().endsWith(".pdf")));

  useEffect(() => {
    if (!activeLegal) return;
    let cancelled = false;
    let objectUrl = "";
    if (activeLegal.local) {
      readLocalLegalContent(activeLegal.id).then((content) => {
        if (cancelled) return;
        if (!content) throw new Error();
        if (content.mimeType === "application/pdf" || content.fileName.toLowerCase().endsWith(".pdf")) {
          objectUrl = URL.createObjectURL(content.blob);
          setLocalLegalObjectUrl(objectUrl);
          setLegalText("");
        } else {
          setLocalLegalObjectUrl("");
          setLegalText(content.text);
        }
        setLegalTextForId(activeLegal.id);
      }).catch(() => { if (!cancelled) { setLocalLegalObjectUrl(""); setLegalText("本地法律文件读取失败，请重新上传。"); setLegalTextForId(activeLegal.id); } });
    } else {
      fetch(`${basePath}/legal/${activeLegal.filename}`).then((r) => { if (!r.ok) throw new Error(); return r.text(); }).then((text) => { if (!cancelled) { setLocalLegalObjectUrl(""); setLegalText(text); setLegalTextForId(activeLegal.id); } }).catch(() => { if (!cancelled) { setLocalLegalObjectUrl(""); setLegalText("法律文本加载失败，请刷新后重试。"); setLegalTextForId(activeLegal.id); } });
    }
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [activeLegal]);

  const updateProject = (id: string, fn: (project: CaseProject) => CaseProject) => setWorkbench((current) => ({ ...current, projects: current.projects.map((project) => project.id === id ? { ...fn(project), updatedAt: new Date().toISOString() } : project) }));
  const setValue = <K extends keyof CaseInputs>(key: K, value: CaseInputs[K]) => updateProject(activeProject.id, (project) => { const nextInputs = { ...project.inputs, [key]: value }; return { ...project, status: advanceProjectStatus(project.status, nextInputs), inputs: nextInputs }; });
  const setValues = (values: Partial<CaseInputs>) => updateProject(activeProject.id, (project) => { const nextInputs = { ...project.inputs, ...values }; return { ...project, status: advanceProjectStatus(project.status, nextInputs), inputs: nextInputs }; });
  const createNew = () => {
    if (workbench.projects.length >= MAX_PROJECTS) return alert(`案件数量已达到上限 ${MAX_PROJECTS}。`);
    const project = createProject(createBlankInputs());
    setWorkbench((current) => ({ ...current, activeProjectId: project.id, projects: [project, ...current.projects] }));
    setShowInputPanel(true);
    setTab("calculator");
  };
  const duplicate = (project: CaseProject) => {
    if (workbench.projects.length >= MAX_PROJECTS) return;
    const copy = createProject({ ...project.inputs, caseName: `${project.inputs.caseName}（副本）` }, project.status);
    copy.notes = project.notes;
    setWorkbench((current) => ({ ...current, activeProjectId: copy.id, projects: [copy, ...current.projects] }));
  };
  const removeProject = (project: CaseProject) => {
    if (workbench.projects.length === 1 || !confirm(`确认删除“${project.inputs.caseName}”？该操作只删除当前浏览器数据。`)) return;
    setWorkbench((current) => { const projects = current.projects.filter((p) => p.id !== project.id); return { ...current, projects, activeProjectId: current.activeProjectId === project.id ? projects[0].id : current.activeProjectId }; });
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(workbench, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `刑事诉讼案件库-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const exportTimelineHtml = () => {
    const reportDeadlines = filterDeadlinesByRoleScope(deadlines, inputs.perspective, "all", true);
    const generatedAt = new Date().toLocaleString("zh-CN", { hour12: false });
    const title = inputs.caseName || "未命名刑事案件";
    const deadlineHtml = reportDeadlines.map((item, index) => `<article class="deadline status-${item.status}">
      <div class="deadline-no">${String(index + 1).padStart(2, "0")}</div>
      <div class="deadline-content">
        <div class="deadline-title"><div><span>阶段 ${item.stageNo} · ${escapeHtml(item.stage)}</span><h2>${escapeHtml(item.title)}</h2></div><em>${escapeHtml(statusLabels[item.status])}</em></div>
        <div class="deadline-time"><strong>${escapeHtml(item.dateText)}</strong><span>${escapeHtml(item.statusText)}</span></div>
        <p>${htmlText(item.summary)}</p>
        <section><b>当前角色行动</b><p>${htmlText(item.action)}</p></section>
        <section><b>法律依据</b><p>${htmlText(item.basis)}</p></section>
        <details><summary>法条原文</summary><blockquote>${htmlText(item.lawText)}</blockquote>${item.note ? `<p class="note">计算说明：${htmlText(item.note)}</p>` : ""}</details>
      </div>
    </article>`).join("\n");
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}－刑事诉讼时间线</title><style>
      :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;color:#182b37;background:#f4f1e9;font-family:"PingFang SC","Microsoft YaHei",sans-serif}main{width:min(980px,calc(100% - 32px));margin:32px auto 64px}.report-head{padding:28px 30px;color:#f7f2e8;background:#182b37;border-top:5px solid #ba3c31}.report-head span{color:#efb47d;font-size:12px;letter-spacing:.12em}.report-head h1{margin:8px 0 0;font-family:"Songti SC",serif;font-size:30px}.report-head p{margin:9px 0 0;color:#d7e0e5;font-size:13px}.overview{display:grid;grid-template-columns:.7fr 1.4fr .8fr;margin-top:16px;background:#fff;border:1px solid #cec8bc}.overview div{padding:16px;border-right:1px solid #ded8cc}.overview div:last-child{border-right:0}.overview span{display:block;color:#70808a;font-size:11px}.overview strong{display:block;margin-top:6px;font-size:16px;line-height:1.45}.overview small{display:block;margin-top:5px;color:#70808a}.deadline{display:grid;grid-template-columns:54px 1fr;margin-top:14px;background:#fff;border:1px solid #d8d2c7;break-inside:avoid}.deadline-no{padding-top:20px;text-align:center;color:#fff;background:#182b37;font-family:monospace}.deadline-content{padding:19px 21px}.deadline-title{display:flex;justify-content:space-between;gap:20px}.deadline-title span{color:#70808a;font-size:11px}.deadline-title h2{margin:4px 0 0;font-size:17px}.deadline-title em{height:max-content;padding:4px 8px;color:#2d5f7b;background:#e7f0f4;border-radius:20px;font-size:11px;font-style:normal}.deadline-time{margin-top:12px;padding:9px 11px;display:flex;gap:14px;background:#f6f3ed;border-left:3px solid #2d5f7b}.deadline-time strong{font-family:monospace}.deadline-content>p,.deadline-content section p{font-size:13px;line-height:1.75}.deadline-content section{margin-top:11px;padding:11px 12px;background:#f3f8fa;border:1px solid #d2e0e7}.deadline-content section b{color:#2d5f7b;font-size:11px}.deadline-content section p{margin:5px 0 0}.deadline-content details{margin-top:12px;color:#53646f;font-size:12px}.deadline-content summary{cursor:pointer;font-weight:700}.deadline-content blockquote{margin:8px 0 0;padding:12px;white-space:normal;line-height:1.8;background:#f7f5ef;border-left:3px solid #8b999f}.note{color:#a9362b}.report-foot{margin-top:22px;color:#70808a;font-size:11px;text-align:right}@media(max-width:680px){.overview{grid-template-columns:1fr}.overview div{border-right:0;border-bottom:1px solid #ded8cc}.deadline{grid-template-columns:40px 1fr}.deadline-content{padding:16px}.deadline-title{flex-direction:column}}@media print{@page{size:A4;margin:16mm}body{background:#fff}main{width:100%;margin:0}.report-head{-webkit-print-color-adjust:exact;print-color-adjust:exact}.deadline-no{-webkit-print-color-adjust:exact;print-color-adjust:exact}.deadline details{display:block}.deadline details>summary{display:none}}
    </style></head><body><main><header class="report-head"><span>CRIMINAL PROCEDURE TIMELINE</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(perspectiveLabels[inputs.perspective])} · 计算截至 ${escapeHtml(inputs.asOf.replace("T", " "))}</p></header><section class="overview"><div><span>当前阶段</span><strong>${escapeHtml(activeProject.status)}</strong></div><div><span>下一诉讼环节</span><strong>${escapeHtml(nextProcedure?.title ?? "暂无待办诉讼环节")}</strong><small>${escapeHtml(nextProcedure?.stage ?? "请补充关键时间")}</small></div><div><span>时间节点</span><strong>${escapeHtml(nextProcedure?.dateText ?? "待录入")}</strong><small>${escapeHtml(nextProcedure ? statusLabels[nextProcedure.status] : "待补录")}</small></div></section>${deadlineHtml}<footer class="report-foot">由刑事诉讼程序与期限管理平台生成 · ${escapeHtml(generatedAt)}</footer></main></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${safeFileName(title)}-刑事诉讼时间线.html`; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const importData = async (file?: File) => {
    if (!file || file.size > MAX_IMPORT_BYTES) return alert("请选择不超过5MB的JSON案件库文件。");
    try {
      const parsed = parseWorkbench(JSON.parse(await file.text()));
      if (!parsed) throw new Error();
      setWorkbench((current) => mergeWorkbenches(current, parsed)); setStorageError("");
    } catch { alert("导入失败：文件不是有效的案件库备份。"); }
    if (importRef.current) importRef.current.value = "";
  };
  const importLocalLegalDatabase = async (fileList?: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    setLocalLegalError("");
    setLocalLegalMessage("正在导入本地法律文件……");
    try {
      const result = await importLocalLegalFiles(files);
      const documents = await listLocalLegalDocuments();
      setLocalLegalDocs(documents);
      if (result.imported.length) {
        setLegalSourceGroup("local");
        setLegalTopic("all");
        setActiveLegalId(result.imported[0].id);
        setLegalTextQuery("");
      }
      const messages = [
        result.imported.length ? `已导入${result.imported.length}份` : "",
        result.skipped.length ? `跳过${result.skipped.length}份重复文件` : "",
        result.rejected.length ? `${result.rejected.length}份未导入` : "",
      ].filter(Boolean);
      setLocalLegalMessage(messages.join("，") || "未选择可导入的文件");
      if (result.rejected.length) setLocalLegalError(result.rejected.map((item) => `${item.fileName}：${item.reason}`).join("；"));
    } catch (error) {
      setLocalLegalMessage("");
      setLocalLegalError(error instanceof Error ? error.message : "本地法律数据库导入失败");
    } finally {
      if (legalImportRef.current) legalImportRef.current.value = "";
    }
  };
  const deleteLocalLegalFile = async (document: LocalLegalDocument) => {
    if (!confirm(`确认从当前浏览器删除“${document.title}”？`)) return;
    try {
      await removeLocalLegalDocument(document.id);
      const documents = await listLocalLegalDocuments();
      setLocalLegalDocs(documents);
      if (!documents.length) setLegalSourceGroup("all");
      if (activeLegalId === document.id) setActiveLegalId(documents[0]?.id ?? legalDocs[0]?.id ?? "");
      setLocalLegalMessage("本地法律文件已删除");
      setLocalLegalError("");
    } catch {
      setLocalLegalError("删除失败，请检查浏览器是否允许本地存储。");
    }
  };
  const selectTab = (nextTab: Tab) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  };
  const printTimeline = () => { setTab("calculator"); setTimeout(() => window.print(), 50); };
  const workPage = tab === "cases" ? null : { key: tab, title: workPageTitles[tab] };

  return <main>
    {tab === "cases" && <><header className="site-header"><div className="brand-mark">刑</div><div className="brand-copy"><span>CRIMINAL PROCEDURE DESK</span><strong>刑事诉讼程序与期限管理平台</strong></div><div className="header-meta"><span>规则结构核验日</span><strong>2026-07-15</strong></div></header><section className={`hero role-hero role-${inputs.perspective}`}><div className="hero-copy"><span className="eyebrow">{roleConfig.eyebrow}</span><h1>{roleConfig.headline}</h1><p>{roleConfig.description}</p><div className="hero-trust-row" aria-label="平台特性"><span>本地自动保存</span><span>法律依据可追溯</span><span>三类诉讼视角</span></div></div><aside className="hero-program-visual" aria-label="刑事诉讼程序期限示意图"><div className="program-visual-top"><span>CASE WORKFLOW</span><em>{perspectiveLabels[inputs.perspective]}</em></div><strong>程序向前推进，期限同步更新</strong><p>从侦查、审查起诉到审判与执行，区分机关办理期限、羁押期限和当事人权利期限。</p><div className="program-stage-flow" aria-hidden="true">{[["01", "侦查"], ["02", "审查起诉"], ["03", "审判"], ["04", "救济执行"]].map(([no, label]) => <div key={no}><span>{no}</span><strong>{label}</strong></div>)}</div><div className="program-role-note"><span>当前视角</span><p>{roleConfig.assessment}</p></div></aside></section></>}

    {workPage && <header className={`work-page-header page-${workPage.key}`} aria-label="当前工作信息">
      <div className="work-page-identity"><span className="work-page-mark" aria-hidden="true">刑</span><div><span>刑事诉讼期限管理</span><h1>{workPage.title}</h1></div></div>
      <dl className="work-page-context">
        <div className="work-page-case"><dt>当前案件</dt><dd title={inputs.caseName || "未命名刑事案件"}>{inputs.caseName || "未命名刑事案件"}</dd></div>
        <div><dt>当前视角</dt><dd>{perspectiveLabels[inputs.perspective]}</dd></div>
        <div><dt>案件阶段</dt><dd>{activeProject.status}</dd></div>
      </dl>
      <button type="button" className="work-page-back" aria-label="返回案件库" onClick={() => selectTab("cases")}><span aria-hidden="true">←</span> 返回案件</button>
    </header>}

    <nav className="tab-bar" aria-label="主要功能">{tabItems.map((item) => <button type="button" aria-label={item.label} aria-current={tab === item.key ? "page" : undefined} className={tab === item.key ? "active" : ""} onClick={() => selectTab(item.key)} key={item.key}><span aria-hidden="true">{item.index}</span><strong>{item.label}</strong></button>)}</nav>

    {storageError && <div className="storage-alert"><div><strong>本地保存异常</strong><p>{storageError}</p></div><div className="storage-alert-actions"><button onClick={exportData}>导出当前数据</button><button className="ghost" onClick={() => setStorageError("")}>重新尝试保存</button></div></div>}

    {tab === "cases" && <section className="cases-page">
      <div className="case-library-heading"><div className="section-intro"><span>案件工作台</span><h2>刑事案件库</h2><p>统一管理案件进度、程序期限与待办权利窗口。</p></div><div className="case-library-actions"><button className="primary" onClick={createNew}><span aria-hidden="true">＋</span> 新增案件</button><button className="ghost" onClick={exportData}>导出备份</button><button className="ghost" onClick={() => importRef.current?.click()}>导入并合并</button><input ref={importRef} hidden type="file" accept="application/json" onChange={(e) => importData(e.target.files?.[0])} /></div></div>
      <div className="case-overview" aria-label="案件库概况"><div><span>全部案件</span><strong>{workbench.projects.length}</strong><small>当前浏览器</small></div><div><span>推进中</span><strong>{caseStats.active}</strong><small>未归档案件</small></div><div className={caseStats.attention ? "needs-attention" : ""}><span>需关注</span><strong>{caseStats.attention}</strong><small>临期、届满或监督触发</small></div><div><span>已归档</span><strong>{caseStats.archived}</strong><small>已完成案件</small></div></div>
      <div className="case-search-row"><label className="case-search-box"><span className="visually-hidden">搜索案件</span><i aria-hidden="true" /><input placeholder="搜索案件名称、状态、视角或备注" value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} />{caseSearch && <button type="button" aria-label="清空案件搜索" onClick={() => setCaseSearch("")}>清空</button>}</label><span aria-live="polite">显示 {filteredProjectRecords.length} 个 · 上限 {MAX_PROJECTS}</span></div>
      {filteredProjectRecords.length ? <div className="case-project-grid">{filteredProjectRecords.map(({ project, nextDeadline }) => <article className={`case-project-card compact ${project.id === activeProject.id ? "active" : ""}`} key={project.id}><div className="case-card-top"><span>{perspectiveLabels[project.inputs.perspective]}</span>{project.id === activeProject.id && <em>当前案件</em>}</div><h3>{project.inputs.caseName}</h3><div className="case-compact-meta"><span>当前阶段<strong>{project.status}</strong></span><time>{hydrated ? `截至 ${project.inputs.asOf.replace("T", " ")}` : "正在同步计算时间"}</time></div><div className={`case-next-deadline ${nextDeadline ? `status-${nextDeadline.status}` : "is-empty"}`}><span>下一个诉讼环节及时间</span>{nextDeadline ? <><div className="case-next-stage"><strong>{nextDeadline.stage}</strong><time>{nextDeadline.dateText}</time></div><p>{nextDeadline.title}</p><small>{statusLabels[nextDeadline.status]}</small></> : <><strong>暂无待办诉讼环节</strong><p>{project.status === "已归档" ? "案件已归档" : "请补充当前阶段的关键时间"}</p></>}</div><div className="case-card-actions"><button onClick={() => { setWorkbench((c) => ({ ...c, activeProjectId: project.id })); setTab("calculator"); }}>打开案件 <span aria-hidden="true">→</span></button><button className="ghost" onClick={() => duplicate(project)}>复制</button><button className="danger" onClick={() => removeProject(project)}>删除</button></div></article>)}</div> : <div className="case-search-empty"><span aria-hidden="true">⌕</span><strong>没有找到匹配案件</strong><p>请调整搜索关键词，或清空筛选后查看全部案件。</p><button type="button" onClick={() => setCaseSearch("")}>清空搜索</button></div>}
    </section>}

    {tab === "calculator" && <section className={`calculator-layout ${showInputPanel ? "with-input" : "without-input"}`}>
      {showInputPanel && <aside className="input-panel"><div className="panel-heading"><div><h2>关键时间录入</h2></div><span className={`autosave ${storageError ? "paused" : ""}`}>{storageError ? "保存暂停" : "自动保存"}</span></div>
        <SelectField label="查看视角" value={inputs.perspective} onChange={(v) => { setValue("perspective", v); setTimelineScope("focus"); }} options={Object.entries(perspectiveLabels) as Array<[CasePerspective, string]>} />
        <TextField label="案件名称" type="text" value={inputs.caseName} onChange={(v) => setValue("caseName", v)} />
        <details className="case-settings"><summary>案件设置</summary><SelectField label="案件路径" value={inputs.caseRoute} onChange={(v) => setValue("caseRoute", v)} options={[["public", "公诉案件"], ["private", "刑事自诉案件"]]} /><TextField label="计算截至时间" type="datetime-local" value={inputs.asOf} onChange={(v) => setValue("asOf", v)} /></details>

        <RoleInputSections inputs={inputs} setValue={setValue} setValues={setValues} status={activeProject.status} />

      </aside>}

      <div className="result-panel"><div className="case-title-row"><div><span>{perspectiveLabels[inputs.perspective]}</span><h2>{inputs.caseName || "未命名刑事案件"}</h2></div><div className="result-actions"><button className="input-toggle" onClick={() => setShowInputPanel((current) => !current)}>{showInputPanel ? "收起时间录入" : "录入／修改关键时间"}</button><button onClick={printTimeline}>打印／保存PDF</button><button className="ghost" onClick={exportTimelineHtml}>导出HTML</button></div></div>
        <section className={`tool-summary ${nextForwardProcedure ? `status-${nextForwardProcedure.status}` : "is-empty"}`} aria-label="案件当前进展"><div><span>案件实际阶段</span><strong>{activeProject.status}</strong></div><div><span>下一办理节点</span><strong>{nextForwardProcedure?.title ?? "尚缺少起算时间"}</strong><small>{nextForwardProcedure?.stage ?? "请录入当前阶段的实际发生日期"}</small></div><div><span>节点日期</span><strong>{nextForwardProcedure?.dateText ?? "待录入"}</strong><small>{nextForwardProcedure ? statusLabels[nextForwardProcedure.status] : "待计算"}</small></div><div className="tool-action"><span>建议操作</span><strong>{nextForwardProcedure?.action ?? "点击“录入／修改关键时间”，补充当前阶段的实际时间。"}</strong></div></section>
        <section className="stage-browser"><div className="stage-browser-heading"><div><h3>按阶段查看程序</h3><p>选择阶段只会改变下方查看内容，不会修改案件实际阶段。</p></div><span>案件实际阶段 <strong>{activeProject.status}</strong></span></div>
          <div className="stage-progress" role="tablist" aria-label="查看各诉讼阶段信息">{procedureStages.map((stage, index) => <button type="button" role="tab" id={`stage-tab-${index}`} aria-controls="stage-inspector" aria-selected={inspectedStage === stage} title={`查看${stage}阶段信息`} className={`${procedureStageIndex[activeProject.status] === index ? "active" : ""} ${procedureStageIndex[activeProject.status] > index ? "done" : ""} ${inspectedStage === stage ? "selected" : ""}`} onClick={() => setInspectedStage(stage)} key={stage}><span>{index + 1}</span><strong>{stage}</strong></button>)}</div>
          <section id="stage-inspector" aria-labelledby={`stage-tab-${procedureStages.indexOf(inspectedStage)}`} className={`procedure-progress stage-procedure ${inspectedStage === currentProcedureStage ? "is-current" : "is-preview"}`} role="tabpanel"><div className="quick-section-heading"><div><div className="selected-stage-title"><span>{inspectedStage === currentProcedureStage ? "当前阶段" : "后续预览"}</span><h3>{inspectedStage}程序节点</h3></div><p>{inspectedStage !== currentProcedureStage ? `正在查看${inspectedStage}阶段；案件实际阶段仍为“${activeProject.status}”。进入该阶段并录入实际起算日后，日期会重新计算。` : inspectedStage === "公安侦查" ? "按发生顺序显示已录入事实、法定期限和预测节点；检察院退回补充侦查也归入本阶段。" : "按发生顺序显示本阶段的已录入事实、法定期限和预测节点。"}</p></div><div className="stage-input-hint"><span>{inspectedStage === currentProcedureStage ? "建议补录的关键时间" : "进入本阶段后需录入"}</span><strong>{procedureStageGuides[inspectedStage].inputHint}</strong></div></div><div className="timeline-legend" aria-label="节点类型说明"><span><i className="actual" />已记录＝实际发生</span><span><i className="statutory" />法定节点＝依法计算</span><span><i className="projected" />预测＝根据现有时间推算</span></div>{procedureProgress.length ? <ol className="procedure-progress-list">{procedureProgress.map((item, index) => <li className={`procedure-progress-item source-${item.source}`} key={item.id}><div className="progress-rail"><span>{String(index + 1).padStart(2, "0")}</span></div><article><div className="progress-meta"><span>{item.stage}</span><div><em>{item.sourceLabel}</em>{item.statusLabel !== item.sourceLabel && <b>{item.statusLabel}</b>}</div></div><div className="progress-main"><h4>{item.title}</h4><time>{item.dateText}</time></div><p className="progress-basis"><strong>法律依据</strong>{item.basis}</p>{item.lawText && <details className="progress-law"><summary>查看法条原文</summary><blockquote>{item.lawText}</blockquote></details>}</article></li>)}</ol> : <div className="empty-state compact"><strong>{inspectedStage === currentProcedureStage ? "当前阶段" : `${inspectedStage}阶段`}尚未生成程序节点</strong><p>{inspectedStage === currentProcedureStage ? "点击“录入／修改关键时间”，录入当前阶段实际时间后自动推算。" : `录入${inspectedStage}阶段的实际起算时间后，系统会自动生成对应节点。`}</p></div>}</section>
        </section>
        {issues.length > 0 && <details className="input-issues-alert" open><summary><div><strong>录入时间有 {issues.length} 项需要核对</strong><span>日期倒置或程序路径冲突可能改变计算结果。</span></div><em>查看并处理</em></summary><div className="input-audit"><div className="input-issue-list">{issues.map((issue) => <div className={`input-issue ${issue.severity}`} key={issue.id}><span>{issue.severity === "error" ? "错误" : "核对"}</span><div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</div></div></details>}
        <details className="full-timeline"><summary><div><strong>跨阶段完整时间线</strong><span>查看从侦查到执行的全部节点、行动建议和法条原文</span></div><em>{visibleDeadlines.length} / {deadlines.length} 项</em></summary><div className="full-timeline-body"><details className="calculation-method"><summary><div><strong>期限计算说明</strong><span>查看起算日、节假日顺延和羁押期限的计算规则</span></div></summary><div className="calculation-rules"><strong>计算规则</strong><span>起算日不计入</span><span>非羁押期满遇法定休假日顺延</span><span>羁押期限不顺延</span><span>2026节假日完整内置</span><span>无固定期限不编造日期</span></div></details><div className="filter-row"><ToggleField checked={showWaiting} onChange={setShowWaiting} label="显示待补录节点" /></div><div className="timeline-scope-tabs" role="group" aria-label="时间线显示范围"><button className={timelineScope === "focus" ? "active" : ""} onClick={() => setTimelineScope("focus")}>{roleConfig.focusLabel}</button><button className={timelineScope === "urgent" ? "active" : ""} onClick={() => setTimelineScope("urgent")}>仅看紧急</button><button className={timelineScope === "all" ? "active" : ""} onClick={() => setTimelineScope("all")}>全部相关</button></div><div className="deadline-list">{visibleDeadlines.length ? visibleDeadlines.map((item, index) => <DeadlineCard key={item.id} item={item} index={index + 1} />) : <div className="empty-state"><strong>当前筛选范围没有节点</strong><p>可切换“全部相关”或打开“显示待补录节点”。</p></div>}</div></div></details>
      </div>
    </section>}

    {tab === "procedure" && <ProcedureGuide />}

    {tab === "sources" && <section className="sources-page">
      <div className="legal-library-heading">
        <div className="section-intro"><h2>刑事法律库</h2><p>按法源类型和程序主题分类。法律、司法解释优先在国家法律法规数据库核验；其他文件以发布机关官网为准。</p></div>
        <a className="legal-database-link" href="https://flk.npc.gov.cn/" target="_blank" rel="noreferrer"><span>国家权威法源</span><strong>打开国家法律法规数据库</strong><small>法律、行政法规、司法解释等</small></a>
      </div>

      <div className="legal-upload-bar">
        <div className="legal-upload-copy"><strong>本地法律数据库</strong><span>上传 TXT、Markdown、JSON 或 PDF；文件只保存在当前浏览器，不上传服务器。</span></div>
        <div className="legal-upload-actions"><button type="button" onClick={() => legalImportRef.current?.click()}>上传本地法律数据库</button><input ref={legalImportRef} hidden multiple type="file" accept=".txt,.md,.markdown,.json,.pdf,text/plain,text/markdown,application/json,application/pdf" onChange={(event) => importLocalLegalDatabase(event.target.files)} /></div>
      </div>
      {(localLegalMessage || localLegalError) && <div className={`legal-upload-status ${localLegalError ? "has-error" : ""}`} role="status"><strong>{localLegalMessage || "部分文件未能导入"}</strong>{localLegalError && <span>{localLegalError}</span>}</div>}

      <nav className="legal-category-tabs" aria-label="法源类型分类">
        {legalSourceGroups.map((group) => <button type="button" className={legalSourceGroup === group.id ? "active" : ""} aria-pressed={legalSourceGroup === group.id} onClick={() => setLegalSourceGroup(group.id)} key={group.id}>{group.label}<span>{group.id === "all" ? allLegalDocs.length : allLegalDocs.filter((doc) => doc.source_group === group.id).length}</span></button>)}
      </nav>

      <div className="legal-filter-bar">
        <label className="legal-query"><span>搜索文件名、发布机关或内容主题</span><input value={legalQuery} onChange={(e) => setLegalQuery(e.target.value)} placeholder="例如：羁押必要性、伤情鉴定、抗诉" /></label>
        <label><span>程序主题</span><select value={legalTopic} onChange={(e) => setLegalTopic(e.target.value)}>{legalTopics.map((topic) => <option value={topic.id} key={topic.id}>{topic.label}</option>)}</select></label>
        <button type="button" className="legal-filter-reset" onClick={() => { setLegalQuery(""); setLegalSourceGroup("all"); setLegalTopic("all"); }}>重置筛选</button>
        <span className="legal-result-count">{filteredLegal.length} / {allLegalDocs.length || 15} 份</span>
      </div>

      <div className="legal-library-layout">
        <div className="legal-document-list">
          {legalDirectoryError && <div className="empty-state"><strong>{legalDirectoryError}</strong></div>}
          {!legalDirectoryError && filteredLegal.length === 0 && <div className="empty-state compact"><strong>没有匹配文件</strong><p>请减少筛选条件或重置分类。</p></div>}
          {filteredLegal.map((doc, index) => <button type="button" key={doc.id} className={`legal-document-card ${doc.local ? "local" : ""} ${doc.id === activeLegal?.id ? "active" : ""}`} onClick={() => { setActiveLegalId(doc.id); setLegalTextQuery(""); }}><span className="source-index">{String(index + 1).padStart(2, "0")}</span><div><span className="source-level">{doc.local ? "本地上传" : doc.level}</span><h3>{doc.title}</h3><p>{doc.points}</p><div className="legal-card-tags">{doc.local && <em>仅当前浏览器</em>}{doc.topics.slice(0, 2).map((topicId) => <em key={topicId}>{legalTopics.find((topic) => topic.id === topicId)?.label ?? topicId}</em>)}</div><small>{doc.authority} · {doc.local ? doc.filename : doc.effective}</small></div></button>)}
        </div>
        <article className="legal-reader">{activeLegal ? <>
          <div className="legal-reader-heading"><div><span>{activeLegal.local ? "本地上传 · 当前浏览器" : `${activeLegal.level} · ${activeLegal.authority}`}</span><h3>{activeLegal.title}</h3><p>{activeLegal.local ? `导入：${activeLegal.checked_at} · ${formatLocalLegalFileSize(activeLegal.size ?? 0)} · ${activeLegal.coverage}` : `核验：${activeLegal.checked_at} · ${activeLegal.chars.toLocaleString()}字符 · ${activeLegal.coverage}`}</p></div><div className="legal-source-actions">{activeLegal.local ? <button type="button" className="danger" onClick={() => deleteLocalLegalFile(activeLegal as LocalLegalDocument)}>删除本地文件</button> : <>{activeLegal.database_url && <a href={activeLegal.database_url} target="_blank" rel="noreferrer">国家库下载</a>}{activeLegal.source_url && <a href={activeLegal.source_url} target="_blank" rel="noreferrer">发布来源</a>}</>}</div></div>
          <div className="legal-reader-search"><input disabled={activeLegalIsLocalPdf} value={legalTextQuery} onChange={(e) => setLegalTextQuery(e.target.value)} placeholder={activeLegalIsLocalPdf ? "PDF暂不支持全文搜索" : "在本文件内搜索条文"} /><span>{activeLegalIsLocalPdf ? "本地PDF预览" : legalTextQuery ? `${displayedLegalText.toLowerCase().split(legalTextQuery.toLowerCase()).length - 1}处匹配` : "输入关键词"}</span></div>
          {activeLegal.coverage.includes("非全文") && <div className="legal-coverage-warning">该文件仅为依政府信息公开取得的部分内容，不是公安部公开发布的完整全文。</div>}
          {activeLegal.coverage.includes("摘录") && <div className="legal-coverage-warning">该文件是平台从完整法律中整理的专题条文摘录，不等同于国家法律法规数据库下载的整部法律。</div>}
          {activeLegalIsLocalPdf ? localLegalObjectUrl ? <iframe className="legal-pdf-preview" src={localLegalObjectUrl} title={`${activeLegal.title} PDF预览`} /> : <div className="legal-text legal-loading">正在载入本地PDF……</div> : <pre className="legal-text">{displayedLegalText ? highlightText(displayedLegalText, legalTextQuery) : "正在载入法律文本……"}</pre>}
          <details className="legal-provenance"><summary>{activeLegal.local ? "本地文件信息" : "来源与校验信息"}</summary>{activeLegal.local ? <><p>文件名：{activeLegal.filename}</p><p>本地上传文件未经平台核验，也不会自动成为期限计算依据。</p></> : activeLegal.source_note && <p>{activeLegal.source_note}</p>}<code>SHA-256 {activeLegal.sha256}</code></details>
        </> : <div className="empty-state"><strong>请选择法律文件</strong><p>当前筛选没有可阅读的法源。</p></div>}</article>
      </div>
    </section>}

    <footer><strong>刑事诉讼程序与期限管理平台</strong><span>案件数据仅存当前浏览器 · 分享链接不包含案件数据 · 法律文本核验日 2026-07-14</span></footer>
  </main>;
}

function DeadlineCard({ item, index }: { item: DeadlineItem; index: number }) {
  return <article className={`deadline-card status-${item.status}`}><div className="deadline-rail">{String(index).padStart(2, "0")}</div><div className="deadline-body"><div className="deadline-heading"><div><span className="stage-label">阶段 {item.stageNo} · {item.stage}</span><h3>{item.title}</h3></div><span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span></div><div className="due-line"><strong>{item.dateText}</strong><span>{item.statusText}</span>{item.provisional && <em>估算</em>}</div><p className="deadline-summary">{item.summary}</p><div className="action-box"><span>当前角色行动</span><p>{item.action}</p></div><details className="legal-detail"><summary>展开法律依据与法条原文</summary><p className="basis-line"><strong>法律依据</strong>{item.basis}</p><div className="law-original"><strong>法条原文</strong><blockquote>{item.lawText}</blockquote></div>{item.note && <p className="detail-note">计算说明：{item.note}</p>}</details></div></article>;
}
