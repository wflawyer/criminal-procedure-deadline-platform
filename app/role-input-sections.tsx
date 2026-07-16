"use client";

import { useMemo, useState } from "react";
import {
  buildDeadlines, CaseInputs, CasePerspective, getEnabledOptionalProcedures, OptionalProcedureId,
} from "../lib/deadlines";
import { CaseProjectStatus, getNextProcedureDeadline } from "../lib/case-projects";

type SetInputValue = <K extends keyof CaseInputs>(key: K, value: CaseInputs[K]) => void;
type SetInputValues = (values: Partial<CaseInputs>) => void;
type Props = { inputs: CaseInputs; setValue: SetInputValue; setValues: SetInputValues; status: CaseProjectStatus };

const injuryOptions: Array<[CaseInputs["injuryLevel"], string]> = [
  ["pending", "待正式鉴定"], ["minor", "轻微伤或未达轻伤"], ["light2", "轻伤二级"], ["light1", "轻伤一级"], ["serious", "重伤"], ["death", "死亡"],
];

type CustodyTrackDetail = {
  option: string;
  stage: string;
  result: string;
  prerequisite: string;
  authority: string;
  requestTiming: string;
  basis: string;
  exceptional?: boolean;
};

const custodyTrackDetails: Record<CaseInputs["custodyTrack"], CustodyTrackDetail> = {
  base2: {
    option: "基础期限｜逮捕后2个月",
    stage: "基础期限（不是延押）",
    result: "自执行逮捕之日起不超过2个月",
    prerequisite: "犯罪嫌疑人已经依法执行逮捕并继续羁押。未执行逮捕的案件，不能套用本期限。",
    authority: "法律直接规定，无须另行批准延长；未依法获批延长时，期限届满前应当侦查终结、释放或者依法变更强制措施。",
    requestTiming: "不适用“届满7日前提请延押”的程序。",
    basis: "《刑事诉讼法》第156条；《公安机关办理刑事案件程序规定》第148条",
  },
  complex3: {
    option: "首次延押｜加1个月，累计3个月",
    stage: "第一次延长：案情复杂",
    result: "批准后增加1个月，完整普通链条累计最长3个月",
    prerequisite: "案情复杂、基础期限届满不能侦查终结，并且仍符合逮捕条件、确有继续羁押必要。",
    authority: "公安案件经县级以上公安机关负责人批准后，送同级检察院转报上一级人民检察院批准。",
    requestTiming: "公安机关应当在基础2个月期限届满7日前提请；超过法定羁押期限提请的，检察院不予受理。",
    basis: "《刑事诉讼法》第156条；《公安机关办理刑事案件程序规定》第148条；《人民检察院刑事诉讼规则》第309、311—313条",
  },
  special5: {
    option: "第158条延押｜再加2个月，累计5个月",
    stage: "第二次延长：第158条四类案件",
    result: "批准后增加2个月，完整普通链条累计最长5个月",
    prerequisite: "第156条规定的期限（包含依法批准的1个月延长）届满仍不能侦查终结，且属于：交通十分不便的边远地区重大复杂案件、重大的犯罪集团案件、流窜作案的重大复杂案件，或者犯罪涉及面广、取证困难的重大复杂案件。",
    authority: "公安案件经县级以上公安机关负责人批准后，送同级检察院层报省、自治区、直辖市人民检察院批准。",
    requestTiming: "公安机关应当在前一期限届满7日前提请。多人作案、普通共同犯罪或普通故意伤害，不当然属于第158条四类案件。",
    basis: "《刑事诉讼法》第158条；《公安机关办理刑事案件程序规定》第149条；《人民检察院刑事诉讼规则》第309—310条",
  },
  ten7: {
    option: "第159条延押｜再加2个月，累计7个月",
    stage: "第三次延长：可能判处10年以上",
    result: "批准后再增加2个月，完整普通链条累计最长7个月",
    prerequisite: "已经依第158条延长2个月，届满仍不能侦查终结，并且犯罪嫌疑人可能被判处10年有期徒刑以上刑罚（包含10年）。",
    authority: "公安案件经县级以上公安机关负责人批准后，送同级检察院层报省、自治区、直辖市人民检察院批准。",
    requestTiming: "公安机关应当在第158条延长期限届满7日前提请；不能只根据涉嫌罪名机械判断可能刑期。",
    basis: "《刑事诉讼法》第159条；《公安机关办理刑事案件程序规定》第150条；《人民检察院刑事诉讼规则》第309—310条",
  },
  npcSpecial: {
    option: "第157条例外延期｜无统一月数",
    stage: "第157条特别重大复杂案件例外程序",
    result: "法律没有规定统一延期月数，须核对批准文件，系统不能自动形成固定届满日",
    prerequisite: "因特殊原因，在较长时间内不宜交付审判的特别重大复杂案件。它不是普通2＋1＋2＋2路径届满后的自动第五层。",
    authority: "由最高人民检察院报请全国人民代表大会常务委员会批准延期审理。",
    requestTiming: "现行条文没有规定统一的“期满7日前提请”期限；必须以实际批准文件确定的处理方式为准。",
    basis: "《刑事诉讼法》第157条；《人民检察院刑事诉讼规则》第314条",
    exceptional: true,
  },
};

const custodyTrackOrder: CaseInputs["custodyTrack"][] = ["base2", "complex3", "special5", "ten7", "npcSpecial"];

const procedureCatalog: Array<{ id: OptionalProcedureId; title: string; description: string; roles: CasePerspective[] }> = [
  { id: "appraisal", title: "鉴定及鉴定异议", description: "录入鉴定委托、意见、文书和实际告知时间。", roles: ["victimAgent", "suspectDefendant", "defender"] },
  { id: "filingRelief", title: "不立案复议、复核及检察监督", description: "根据决定送达、复议复核或检察通知时间计算救济节点。", roles: ["victimAgent"] },
  { id: "nonCustodialMeasures", title: "取保、监视居住及变更强制措施", description: "计算取保、监视居住上限及变更申请答复期限。", roles: ["suspectDefendant", "defender"] },
  { id: "custodyNecessity", title: "羁押必要性审查／评估", description: "按受理机关和诉讼阶段分别计算3日或10日。", roles: ["suspectDefendant", "defender"] },
  { id: "investigationRecusal", title: "公安侦查人员回避", description: "计算回避决定2／5日、复议申请5日和复议决定5日。", roles: ["victimAgent", "suspectDefendant", "defender"] },
  { id: "rightsObstruction", title: "辩护／代理权利受阻控告", description: "根据检察院收件日计算10日办结答复节点。", roles: ["victimAgent", "defender"] },
  { id: "nonProsecutionRelief", title: "被害人不服不起诉救济", description: "计算7日申诉及立案复查3／6个月节点。", roles: ["victimAgent"] },
  { id: "incidentalCivil", title: "刑事附带民事诉讼", description: "根据提交日期计算法院7日受理审查节点。", roles: ["victimAgent"] },
  { id: "judgmentRelief", title: "一审判后抗诉／上诉记录", description: "记录请求抗诉、上诉和一审法院移送情况。", roles: ["victimAgent", "suspectDefendant", "defender"] },
  { id: "complaintRetrial", title: "申诉立案审查与再审", description: "计算申诉审查和再审3／6个月期限。", roles: ["victimAgent", "suspectDefendant", "defender"] },
  { id: "propertyExecution", title: "刑事涉财产执行", description: "计算材料齐全后7日立案及通常6个月执行期限。", roles: ["victimAgent"] },
];

type MainlinePhase = "investigation" | "prosecution" | "trial" | "later";

const phaseForStatus: Record<CaseProjectStatus, MainlinePhase> = {
  "准备中": "investigation", "公安侦查": "investigation", "审查起诉": "prosecution", "一审": "trial",
  "二审": "later", "申诉再审": "later", "执行": "later", "已归档": "later",
};

const resetValues: Record<OptionalProcedureId, Partial<CaseInputs>> = {
  appraisal: { appraisalCommissionAt: "", appraisalOpinionAt: "", appraisalDocumentDate: "", appraisalServedDate: "", injuryLevel: "pending", appraisalComplexity: "instant" },
  filingRelief: { noCaseDecisionDate: "", noCaseNoticeDate: "", reconsiderApplicationDate: "", reconsiderDecisionDate: "", reconsiderExtended: false, reviewApplicationDate: "", reviewDecisionDate: "", reviewExtended: false, prosecutorComplaintDate: "", prosecutorFileNoticeDate: "" },
  nonCustodialMeasures: { bailStartDate: "", bailEndDate: "", residentialSurveillanceStartDate: "", residentialSurveillanceEndDate: "", measureChangeApplicationDate: "", measureChangeDecisionDate: "" },
  custodyNecessity: { custodyNecessityApplicationDate: "", custodyNecessityDecisionDate: "", custodyNecessityTrack: "procuratorate10" },
  investigationRecusal: { recusalApplicationDate: "", recusalDecisionTrack: "ordinary2", recusalDecisionDate: "", recusalRejectedReceivedDate: "", recusalReviewApplicationDate: "", recusalReviewDecisionDate: "" },
  rightsObstruction: { rightsObstructionComplaintDate: "", rightsObstructionReplyDate: "" },
  nonProsecutionRelief: { nonProsecutionReceivedDate: "", nonProsecutionAppealDate: "", nonProsecutionReviewFiledDate: "", nonProsecutionReviewDecisionDate: "", nonProsecutionReviewExtended: false },
  incidentalCivil: { incidentalCivilSubmittedDate: "", incidentalCivilAcceptedDate: "" },
  judgmentRelief: { protestRequestDate: "", protestDecisionReceivedDate: "", appealFiledDate: "", firstCourtTransferredDate: "" },
  complaintRetrial: { complaintReviewStartedDate: "", complaintDecisionDate: "", complaintExtended: false, retrialDecisionDate: "", retrialCompletedDate: "", retrialExtended: false },
  propertyExecution: { propertyExecutionTransferredDate: "", propertyExecutionFiledDate: "", propertyExecutionCompletedDate: "", propertyExecutionExtended: false },
};

function TextField({ label, value, onChange, type = "date", hint }: { label: string; value: string; onChange: (value: string) => void; type?: "date" | "datetime-local" | "text"; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} />{hint && <small className="field-hint">{hint}</small>}</label>;
}

function SelectField<T extends string>({ label, value, onChange, options, hint }: { label: string; value: T; onChange: (value: T) => void; options: Array<[T, string]>; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select>{hint && <small className="field-hint">{hint}</small>}</label>;
}

function CustodyTrackField({ value, onChange }: { value: CaseInputs["custodyTrack"]; onChange: (value: CaseInputs["custodyTrack"]) => void }) {
  const detail = custodyTrackDetails[value];
  return <div className="custody-track-field">
    <label className="field">
      <span className="field-label">拟核验的期限层级（不等于已经批准）</span>
      <select value={value} onChange={(event) => onChange(event.target.value as CaseInputs["custodyTrack"])}>
        <optgroup label="普通侦查羁押期限">
          {custodyTrackOrder.slice(0, 4).map((track) => <option key={track} value={track}>{custodyTrackDetails[track].option}</option>)}
        </optgroup>
        <optgroup label="第157条例外程序">
          <option value="npcSpecial">{custodyTrackDetails.npcSpecial.option}</option>
        </optgroup>
      </select>
      <small className="field-hint">这里只选择需要核验的最高层级。每一层是否实际生效，以对应批准日期为准；第157条不是普通累计期限的下一层。</small>
    </label>
    <article className={`custody-track-summary${detail.exceptional ? " exceptional" : ""}`} aria-live="polite">
      <header><span>当前所选层级</span><strong>{detail.stage}</strong><em>{detail.result}</em></header>
      <dl>
        <div><dt>法定前提</dt><dd>{detail.prerequisite}</dd></div>
        <div><dt>批准机关</dt><dd>{detail.authority}</dd></div>
        <div><dt>提请时点</dt><dd>{detail.requestTiming}</dd></div>
        <div><dt>法律依据</dt><dd>{detail.basis}</dd></div>
      </dl>
    </article>
  </div>;
}

function CustodyLawLadder({ current }: { current: CaseInputs["custodyTrack"] }) {
  return <div className="custody-law-ladder" aria-label="侦查羁押期限完整法定层级">
    {custodyTrackOrder.map((track, index) => {
      const detail = custodyTrackDetails[track];
      return <article key={track} className={`${detail.exceptional ? "exceptional " : ""}${current === track ? "current" : ""}`}>
        <header><span>{detail.exceptional ? "例外" : String(index + 1).padStart(2, "0")}</span><div><strong>{detail.stage}</strong><small>{detail.result}</small></div></header>
        <dl>
          <div><dt>前提</dt><dd>{detail.prerequisite}</dd></div>
          <div><dt>机关</dt><dd>{detail.authority}</dd></div>
          <div><dt>时点</dt><dd>{detail.requestTiming}</dd></div>
          <div><dt>依据</dt><dd>{detail.basis}</dd></div>
        </dl>
      </article>;
    })}
  </div>;
}

function ToggleField({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return <label className="toggle-field"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-control" /><span><strong>{label}</strong>{hint && <small>{hint}</small>}</span></label>;
}

function InvestigationMainline({ inputs, setValue }: Props) {
  const victim = inputs.perspective === "victimAgent";
  const custodyPathRank = inputs.custodyTrack === "complex3" ? 1 : inputs.custodyTrack === "special5" ? 2 : inputs.custodyTrack === "ten7" ? 3 : 0;
  const showFirstExtension = custodyPathRank >= 1 || Boolean(inputs.custodyFirstExtensionRequestedDate || inputs.custodyFirstExtensionApprovedDate);
  const showSecondExtension = custodyPathRank >= 2 || Boolean(inputs.custodySecondExtensionRequestedDate || inputs.custodySecondExtensionApprovedDate);
  const showThirdExtension = custodyPathRank >= 3 || Boolean(inputs.custodyThirdExtensionRequestedDate || inputs.custodyThirdExtensionApprovedDate);
  return <section className="phase-input-card"><div className="phase-input-heading"><span>01</span><div><strong>侦查关键时间</strong><p>录入实际发生时间，系统自动推算拘留、逮捕和侦查羁押节点。</p></div></div><div className="field-grid">
    {victim ? <>
      <TextField label="案发日" value={inputs.incidentDate} onChange={(v) => setValue("incidentDate", v)} />
      <TextField label="首次报案日" value={inputs.reportDate} onChange={(v) => setValue("reportDate", v)} />
      <TextField label="公安正式受理时间" type="datetime-local" value={inputs.acceptedAt} onChange={(v) => setValue("acceptedAt", v)} />
      <TextField label="刑事立案审查启动日" value={inputs.criminalReviewStartDate} onChange={(v) => setValue("criminalReviewStartDate", v)} hint="未填写时暂以报案日估算。" />
      <SelectField label="立案审查路径" value={inputs.criminalReviewTrack} onChange={(v) => setValue("criminalReviewTrack", v)} options={[["ordinary", "一般3日"], ["verify", "线索需查证7日"], ["major", "重大疑难复杂30日（须批准）"]]} />
    </> : <>
      <TextField label="第一次讯问或采取强制措施时间" type="datetime-local" value={inputs.defenseRightTriggerAt} onChange={(v) => setValue("defenseRightTriggerAt", v)} />
      <TextField label="刑事拘留时间" type="datetime-local" value={inputs.detentionAt} onChange={(v) => setValue("detentionAt", v)} />
      <SelectField label="拘留至批捕路径" value={inputs.detentionTrack} onChange={(v) => setValue("detentionTrack", v)} options={[["ordinary10", "通常10日"], ["special14", "特殊情况14日"], ["major37", "流窜／多次／结伙重大嫌疑37日"]]} />
      <TextField label="执行逮捕时间" type="datetime-local" value={inputs.arrestDate} onChange={(v) => setValue("arrestDate", v)} />
      <CustodyTrackField value={inputs.custodyTrack} onChange={(v) => setValue("custodyTrack", v)} />
    </>}
    <TextField label="刑事立案日" value={inputs.criminalFiledDate} onChange={(v) => setValue("criminalFiledDate", v)} />
  </div>{!victim && <details className="phase-exception-group custody-extension-group"><summary>完整法定层级与批准日期（当前核验：{custodyTrackDetails[inputs.custodyTrack].stage}）</summary><div className="rule-callout custody-boundary"><strong>适用边界</strong><p>仅适用于已执行逮捕并继续羁押的案件。普通延押不是自动叠加：每次均应在前一期限届满7日前提请，并取得相应检察院批准；未获批准，不改变当前有效届满日。</p></div><CustodyLawLadder current={inputs.custodyTrack} />
    {showFirstExtension && <section className="custody-extension-step"><div className="custody-extension-step-heading"><span>01</span><div><strong>复杂案件首次延押：延长1个月</strong><small>基础2个月届满前7日提请，由上一级人民检察院批准。</small></div></div><div className="field-grid"><ToggleField checked={inputs.custodyFirstExtensionConditionsConfirmed} onChange={(v) => setValue("custodyFirstExtensionConditionsConfirmed", v)} label="已核对首次延押三项条件" hint="案情复杂且期满不能侦结；仍符合逮捕条件；确有继续羁押必要。逮捕后2个月无有效侦查或取证无实质进展的，检察院可不批准。" /><TextField label="公安实际提请日" value={inputs.custodyFirstExtensionRequestedDate} onChange={(v) => setValue("custodyFirstExtensionRequestedDate", v)} /><TextField label="上一级检察院批准日" value={inputs.custodyFirstExtensionApprovedDate} onChange={(v) => setValue("custodyFirstExtensionApprovedDate", v)} /></div></section>}
    {showSecondExtension && <section className="custody-extension-step"><div className="custody-extension-step-heading"><span>02</span><div><strong>第158条四类重大复杂案件：再延长2个月</strong><small>必须已有首次延押批准，由省级人民检察院批准。</small></div></div><div className="field-grid"><SelectField label="第158条法定事由" value={inputs.custodySpecialGround} onChange={(v) => setValue("custodySpecialGround", v)} options={[["none", "未核对／不适用"], ["remote", "交通十分不便的边远地区重大复杂案件"], ["crimeGroup", "重大的犯罪集团案件"], ["fugitive", "流窜作案的重大复杂案件"], ["broadDifficult", "犯罪涉及面广、取证困难的重大复杂案件"]]} hint="多人作案或普通故意伤害不当然属于这四类。" /><span className="field-spacer" aria-hidden="true" /><TextField label="公安实际提请日" value={inputs.custodySecondExtensionRequestedDate} onChange={(v) => setValue("custodySecondExtensionRequestedDate", v)} /><TextField label="省级检察院批准日" value={inputs.custodySecondExtensionApprovedDate} onChange={(v) => setValue("custodySecondExtensionApprovedDate", v)} /></div></section>}
    {showThirdExtension && <section className="custody-extension-step"><div className="custody-extension-step-heading"><span>03</span><div><strong>可能判10年有期徒刑以上：再延长2个月</strong><small>必须已用完第158条延长期限，仍不能侦查终结。</small></div></div><div className="field-grid"><ToggleField checked={inputs.custodyTenYearEligible} onChange={(v) => setValue("custodyTenYearEligible", v)} label="已核对本案可能判处10年有期徒刑以上" hint="应根据案件事实和可能适用的法定刑判断，不能只按涉嫌罪名勾选。" /><TextField label="公安实际提请日" value={inputs.custodyThirdExtensionRequestedDate} onChange={(v) => setValue("custodyThirdExtensionRequestedDate", v)} /><TextField label="省级检察院批准日" value={inputs.custodyThirdExtensionApprovedDate} onChange={(v) => setValue("custodyThirdExtensionApprovedDate", v)} /></div></section>}
    <section className="custody-extension-step recalculation"><div className="custody-extension-step-heading"><span>R</span><div><strong>发现另有重要罪行：重新计算</strong><small>这不是延押。依法获批后从“发现日”开始新的2个月周期，不是从报批日或批准日起算。</small></div></div><div className="field-grid"><TextField label="发现另有重要罪行日" value={inputs.custodyAdditionalCrimeDiscoveredDate} onChange={(v) => setValue("custodyAdditionalCrimeDiscoveredDate", v)} hint="另有重要罪行是指不同种的重大犯罪，或影响罪名认定、量刑档次的同种重大犯罪。" /><TextField label="发现日起5日内实际报批日" value={inputs.custodyRecalculationReportedDate} onChange={(v) => setValue("custodyRecalculationReportedDate", v)} hint="第151条要求在发现之日起5日以内报县级以上公安机关负责人批准；5日约束的是报批，不宜误写为必须在5日内完成批准。" /><TextField label="县级以上公安负责人实际批准日" value={inputs.custodyRecalculationApprovedDate} onChange={(v) => setValue("custodyRecalculationApprovedDate", v)} hint="获批后制作变更羁押期限通知书，送达看守所，并报原批准逮捕的检察院备案。" /></div></section>
    {(inputs.custodyTrack === "npcSpecial" || inputs.custodySpecialPostponementApprovedDate) && <section className="custody-extension-step exceptional"><div className="custody-extension-step-heading"><span>S</span><div><strong>特别重大复杂案件特殊延期</strong><small>由最高检报请全国人大常委会批准；法律未规定统一延期月数。</small></div></div><div className="field-grid"><TextField label="全国人大常委会批准延期日" value={inputs.custodySpecialPostponementApprovedDate} onChange={(v) => setValue("custodySpecialPostponementApprovedDate", v)} /></div></section>}
    <p className="custody-exclusion-note">身份不明的特殊起算、犯罪嫌疑人精神病鉴定期间不计入办案期限，属于其他制度，不会被本路径自动叠加。</p></details>}</section>;
}

function ProsecutionMainline({ inputs, setValue }: Props) {
  return <section className="phase-input-card"><div className="phase-input-heading"><span>02</span><div><strong>审查起诉关键时间</strong><p>先录检察院收案日；延长、改变管辖和退补在下方按实际情况补录。</p></div></div><div className="field-grid">
    <TextField label="检察院审查起诉收案日" value={inputs.prosecutionReceivedDate} onChange={(v) => setValue("prosecutionReceivedDate", v)} />
    <SelectField label="审查起诉期限类型" value={inputs.prosecutionTrack} onChange={(v) => setValue("prosecutionTrack", v)} options={[["ordinary", "普通案件：1个月"], ["major", "重大复杂：1个月＋可延长15日"], ["fast10", "认罪认罚速裁：10日"], ["fast15", "速裁且可能判1年以上：15日"]]} hint={inputs.prosecutionTrack === "major" ? "延长15日须同时满足：案件重大、复杂，且1个月内不能作出决定。" : undefined} />
  </div><details className="phase-exception-group"><summary>延长、改变管辖与退回补充侦查</summary><div className="rule-callout"><strong>系统计算顺序</strong><p>首次收案 → 改变管辖重新起算 → 每次退补1个月 → 重报后重新计算审查起诉期限。补充侦查最多两次。</p></div><div className="field-grid">
      <TextField label="改变管辖后新检察院收案日" value={inputs.prosecutionChangedJurisdictionReceivedDate} onChange={(v) => setValue("prosecutionChangedJurisdictionReceivedDate", v)} hint="填写后，从新检察院实际收案日起重新计算。" />
      <span className="field-spacer" aria-hidden="true" />
      <TextField label="第一次退回补充侦查日" value={inputs.supplement1ReturnedDate} onChange={(v) => setValue("supplement1ReturnedDate", v)} />
      <TextField label="第一次补侦重报日" value={inputs.supplement1ResubmittedDate} onChange={(v) => setValue("supplement1ResubmittedDate", v)} />
      <TextField label="第二次退回补充侦查日" value={inputs.supplement2ReturnedDate} onChange={(v) => setValue("supplement2ReturnedDate", v)} />
      <TextField label="第二次补侦重报日" value={inputs.supplement2ResubmittedDate} onChange={(v) => setValue("supplement2ResubmittedDate", v)} />
    </div></details></section>;
}

function TrialMainline({ inputs, setValue }: Props) {
  return <section className="phase-input-card"><div className="phase-input-heading"><span>03</span><div><strong>一审关键时间</strong><p>录入法院实际收案、受理、开庭和裁判送达时间。</p></div></div><div className="field-grid">
    {inputs.caseRoute === "private" ? <>
      <TextField label="自诉材料提交日" value={inputs.privateProsecutionSubmittedDate} onChange={(v) => setValue("privateProsecutionSubmittedDate", v)} />
      <TextField label="自诉受理日" value={inputs.privateProsecutionAcceptedDate} onChange={(v) => setValue("privateProsecutionAcceptedDate", v)} />
    </> : <>
      <TextField label="法院收到公诉材料日" value={inputs.courtProsecutionReceivedDate} onChange={(v) => setValue("courtProsecutionReceivedDate", v)} />
      <TextField label="法院正式受理日" value={inputs.courtReceivedDate} onChange={(v) => setValue("courtReceivedDate", v)} />
    </>}
    <SelectField label="一审审理路径" value={inputs.trialTrack} onChange={(v) => setValue("trialTrack", v)} options={[["ordinary2", "普通公诉通常2个月"], ["ordinary3", "普通公诉至迟3个月"], ["special6", "法定特殊案件经批准6个月"], ["summary20", "简易程序20日"], ["summary45", "简易程序1个半月"], ["fast10", "速裁10日"], ["fast15", "速裁15日"], ["private6", "未羁押自诉6个月"]]} />
    <TextField label="计划开庭日" value={inputs.hearingDate} onChange={(v) => setValue("hearingDate", v)} />
    <TextField label="宣判日" value={inputs.judgmentAnnouncedDate} onChange={(v) => setValue("judgmentAnnouncedDate", v)} />
    <SelectField label="宣判方式" value={inputs.judgmentPronouncementTrack} onChange={(v) => setValue("judgmentPronouncementTrack", v)} options={[["inCourt", "当庭宣判"], ["scheduled", "定期宣判"]]} />
    <TextField label="收到一审判决／裁定日" value={inputs.judgmentReceivedDate} onChange={(v) => setValue("judgmentReceivedDate", v)} />
  </div></section>;
}

function LaterMainline({ inputs, setValue }: Props) {
  return <section className="phase-input-card"><div className="phase-input-heading"><span>04</span><div><strong>二审、生效与执行</strong><p>录入二审受理、裁判送达、生效和交付执行时间。</p></div></div><div className="field-grid">
    <TextField label="二审法院受理日" value={inputs.secondInstanceReceivedDate} onChange={(v) => setValue("secondInstanceReceivedDate", v)} />
    <SelectField label="二审审理路径" value={inputs.secondInstanceTrack} onChange={(v) => setValue("secondInstanceTrack", v)} options={[["ordinary2", "通常2个月"], ["special4", "法定特殊案件经批准4个月"]]} />
    <TextField label="收到二审裁判日" value={inputs.secondJudgmentReceivedDate} onChange={(v) => setValue("secondJudgmentReceivedDate", v)} />
    <TextField label="裁判生效日" value={inputs.effectiveJudgmentDate} onChange={(v) => setValue("effectiveJudgmentDate", v)} />
    <TextField label="执行法律文书送达执行机关日" value={inputs.executionDocumentsDeliveredDate} onChange={(v) => setValue("executionDocumentsDeliveredDate", v)} />
  </div></section>;
}

function OptionalFields({ id, inputs, setValue }: { id: OptionalProcedureId; inputs: CaseInputs; setValue: SetInputValue }) {
  if (id === "appraisal") return <div className="field-grid"><TextField label="鉴定机构受委托时间" type="datetime-local" value={inputs.appraisalCommissionAt} onChange={(v) => setValue("appraisalCommissionAt", v)} /><SelectField label="鉴定类型" value={inputs.appraisalComplexity} onChange={(v) => setValue("appraisalComplexity", v)} options={[["instant", "具备即时鉴定条件"], ["complex", "复杂但可在7日内鉴定"], ["functional", "待伤情稳定后鉴定"]]} /><SelectField label="正式伤情结论" value={inputs.injuryLevel} onChange={(v) => setValue("injuryLevel", v)} options={injuryOptions} /><TextField label="提出鉴定意见时间" type="datetime-local" value={inputs.appraisalOpinionAt} onChange={(v) => setValue("appraisalOpinionAt", v)} /><TextField label="鉴定文书出具日" value={inputs.appraisalDocumentDate} onChange={(v) => setValue("appraisalDocumentDate", v)} /><TextField label="实际收到／获知鉴定意见日" value={inputs.appraisalServedDate} onChange={(v) => setValue("appraisalServedDate", v)} /></div>;
  if (id === "filingRelief") return <div className="field-grid"><TextField label="不予立案决定日" value={inputs.noCaseDecisionDate} onChange={(v) => setValue("noCaseDecisionDate", v)} /><TextField label="收到不予立案通知日" value={inputs.noCaseNoticeDate} onChange={(v) => setValue("noCaseNoticeDate", v)} /><TextField label="刑事复议申请日" value={inputs.reconsiderApplicationDate} onChange={(v) => setValue("reconsiderApplicationDate", v)} /><TextField label="收到复议决定日" value={inputs.reconsiderDecisionDate} onChange={(v) => setValue("reconsiderDecisionDate", v)} /><ToggleField checked={inputs.reconsiderExtended} onChange={(v) => setValue("reconsiderExtended", v)} label="复议按重大复杂延长至60日" /><TextField label="刑事复核申请日" value={inputs.reviewApplicationDate} onChange={(v) => setValue("reviewApplicationDate", v)} /><TextField label="收到复核决定日" value={inputs.reviewDecisionDate} onChange={(v) => setValue("reviewDecisionDate", v)} /><ToggleField checked={inputs.reviewExtended} onChange={(v) => setValue("reviewExtended", v)} label="复核按重大复杂延长至60日" /><TextField label="公安收到检察要求说明通知日" value={inputs.prosecutorComplaintDate} onChange={(v) => setValue("prosecutorComplaintDate", v)} /><TextField label="公安收到检察通知立案日" value={inputs.prosecutorFileNoticeDate} onChange={(v) => setValue("prosecutorFileNoticeDate", v)} /></div>;
  if (id === "nonCustodialMeasures") return <div className="field-grid"><TextField label="取保候审开始日" value={inputs.bailStartDate} onChange={(v) => setValue("bailStartDate", v)} /><TextField label="取保候审解除／变更日" value={inputs.bailEndDate} onChange={(v) => setValue("bailEndDate", v)} /><TextField label="监视居住开始日" value={inputs.residentialSurveillanceStartDate} onChange={(v) => setValue("residentialSurveillanceStartDate", v)} /><TextField label="监视居住解除／变更日" value={inputs.residentialSurveillanceEndDate} onChange={(v) => setValue("residentialSurveillanceEndDate", v)} /><TextField label="变更强制措施申请日" value={inputs.measureChangeApplicationDate} onChange={(v) => setValue("measureChangeApplicationDate", v)} /><TextField label="变更强制措施决定日" value={inputs.measureChangeDecisionDate} onChange={(v) => setValue("measureChangeDecisionDate", v)} /></div>;
  if (id === "custodyNecessity") return <div className="field-grid"><TextField label="羁押必要性审查／变更申请日" value={inputs.custodyNecessityApplicationDate} onChange={(v) => setValue("custodyNecessityApplicationDate", v)} /><SelectField label="受理机关与诉讼阶段" value={inputs.custodyNecessityTrack} onChange={(v) => setValue("custodyNecessityTrack", v)} options={[["investigation3", "公安侦查阶段收到变更申请：3日"], ["prosecution3", "检察院审查起诉阶段：3日"], ["procuratorate10", "检察院侦查／审判阶段审查：10日"]]} /><TextField label="收到审查／决定结果日" value={inputs.custodyNecessityDecisionDate} onChange={(v) => setValue("custodyNecessityDecisionDate", v)} /></div>;
  if (id === "investigationRecusal") return <><div className="optional-law-boundary">仅适用于对公安侦查人员申请回避。对县级以上公安机关负责人申请回避，应及时移送同级检察院，不能套用2／5日决定期限。</div><div className="field-grid"><TextField label="公安收到侦查人员回避申请日" value={inputs.recusalApplicationDate} onChange={(v) => setValue("recusalApplicationDate", v)} /><SelectField label="回避决定路径" value={inputs.recusalDecisionTrack} onChange={(v) => setValue("recusalDecisionTrack", v)} options={[["ordinary2", "一般情形：2日内决定"], ["complex5", "复杂且经批准：5日内决定"]]} /><TextField label="公安作出回避决定日" value={inputs.recusalDecisionDate} onChange={(v) => setValue("recusalDecisionDate", v)} /><TextField label="收到驳回回避决定日" value={inputs.recusalRejectedReceivedDate} onChange={(v) => setValue("recusalRejectedReceivedDate", v)} /><TextField label="回避复议申请日" value={inputs.recusalReviewApplicationDate} onChange={(v) => setValue("recusalReviewApplicationDate", v)} /><TextField label="收到回避复议决定日" value={inputs.recusalReviewDecisionDate} onChange={(v) => setValue("recusalReviewDecisionDate", v)} /></div></>;
  if (id === "rightsObstruction") return <div className="field-grid"><TextField label="权利受阻控告日" value={inputs.rightsObstructionComplaintDate} onChange={(v) => setValue("rightsObstructionComplaintDate", v)} /><TextField label="收到书面答复日" value={inputs.rightsObstructionReplyDate} onChange={(v) => setValue("rightsObstructionReplyDate", v)} /></div>;
  if (id === "nonProsecutionRelief") return <div className="field-grid"><TextField label="收到不起诉决定日" value={inputs.nonProsecutionReceivedDate} onChange={(v) => setValue("nonProsecutionReceivedDate", v)} /><TextField label="被害人不起诉申诉日" value={inputs.nonProsecutionAppealDate} onChange={(v) => setValue("nonProsecutionAppealDate", v)} /><TextField label="不起诉复查立案日" value={inputs.nonProsecutionReviewFiledDate} onChange={(v) => setValue("nonProsecutionReviewFiledDate", v)} /><ToggleField checked={inputs.nonProsecutionReviewExtended} onChange={(v) => setValue("nonProsecutionReviewExtended", v)} label="复杂案件按6个月复查" /><TextField label="收到复查决定日" value={inputs.nonProsecutionReviewDecisionDate} onChange={(v) => setValue("nonProsecutionReviewDecisionDate", v)} /></div>;
  if (id === "incidentalCivil") return <div className="field-grid"><TextField label="附带民事诉讼提交日" value={inputs.incidentalCivilSubmittedDate} onChange={(v) => setValue("incidentalCivilSubmittedDate", v)} /><TextField label="附带民事受理日" value={inputs.incidentalCivilAcceptedDate} onChange={(v) => setValue("incidentalCivilAcceptedDate", v)} /></div>;
  if (id === "judgmentRelief") return <div className="field-grid">{inputs.perspective === "victimAgent" ? <><TextField label="被害人请求抗诉日" value={inputs.protestRequestDate} onChange={(v) => setValue("protestRequestDate", v)} /><TextField label="收到是否抗诉答复日" value={inputs.protestDecisionReceivedDate} onChange={(v) => setValue("protestDecisionReceivedDate", v)} /></> : <><SelectField label="一审裁判类型" value={inputs.firstDecisionType} onChange={(v) => setValue("firstDecisionType", v)} options={[["judgment", "判决（上诉10日）"], ["ruling", "裁定（上诉5日）"]]} /><TextField label="被告人提交上诉日" value={inputs.appealFiledDate} onChange={(v) => setValue("appealFiledDate", v)} /></>}<TextField label="一审法院移送上诉材料日" value={inputs.firstCourtTransferredDate} onChange={(v) => setValue("firstCourtTransferredDate", v)} /></div>;
  if (id === "complaintRetrial") return <div className="field-grid"><TextField label="法院申诉立案审查日" value={inputs.complaintReviewStartedDate} onChange={(v) => setValue("complaintReviewStartedDate", v)} /><ToggleField checked={inputs.complaintExtended} onChange={(v) => setValue("complaintExtended", v)} label="申诉审查按特殊情形6个月" /><TextField label="收到申诉审查决定日" value={inputs.complaintDecisionDate} onChange={(v) => setValue("complaintDecisionDate", v)} /><TextField label="提审／再审决定日" value={inputs.retrialDecisionDate} onChange={(v) => setValue("retrialDecisionDate", v)} /><ToggleField checked={inputs.retrialExtended} onChange={(v) => setValue("retrialExtended", v)} label="再审延长至6个月" /><TextField label="再审审结日" value={inputs.retrialCompletedDate} onChange={(v) => setValue("retrialCompletedDate", v)} /></div>;
  return <div className="field-grid"><TextField label="涉财产执行移送材料齐全日" value={inputs.propertyExecutionTransferredDate} onChange={(v) => setValue("propertyExecutionTransferredDate", v)} /><TextField label="涉财产执行立案日" value={inputs.propertyExecutionFiledDate} onChange={(v) => setValue("propertyExecutionFiledDate", v)} /><ToggleField checked={inputs.propertyExecutionExtended} onChange={(v) => setValue("propertyExecutionExtended", v)} label="有院长批准的特殊延长" hint="现行条文没有统一延长上限，选择后不生成虚假期满日。" /><TextField label="涉财产执行完成日" value={inputs.propertyExecutionCompletedDate} onChange={(v) => setValue("propertyExecutionCompletedDate", v)} /></div>;
}

export function RoleInputSections({ inputs, setValue, setValues, status }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<MainlinePhase | null>(null);
  const [pendingProcedure, setPendingProcedure] = useState<OptionalProcedureId | "">("");
  const [recentlyAdded, setRecentlyAdded] = useState<OptionalProcedureId | "">("");
  const enabled = useMemo(() => getEnabledOptionalProcedures(inputs), [inputs]);
  const available = procedureCatalog.filter((item) => item.roles.includes(inputs.perspective) && !enabled.includes(item.id));
  const enabledCatalog = procedureCatalog.filter((item) => item.roles.includes(inputs.perspective) && enabled.includes(item.id));
  const deadlines = useMemo(() => buildDeadlines(inputs), [inputs]);
  const next = useMemo(() => getNextProcedureDeadline(status, deadlines), [deadlines, status]);
  const activePhase = selectedPhase ?? phaseForStatus[status];
  const selectedProcedure = available.some((item) => item.id === pendingProcedure) ? pendingProcedure : "";

  const addProcedure = () => {
    if (!selectedProcedure) return;
    setValues({ optionalProcedures: [...new Set([...inputs.optionalProcedures, selectedProcedure])] });
    setRecentlyAdded(selectedProcedure);
    setPendingProcedure("");
  };
  const removeProcedure = (id: OptionalProcedureId) => {
    if (!window.confirm("移除该单独程序并清空其中已录日期？")) return;
    setValues({ ...resetValues[id], optionalProcedures: inputs.optionalProcedures.filter((item) => item !== id) });
    if (recentlyAdded === id) setRecentlyAdded("");
  };

  return <div className={`role-input-sections role-${inputs.perspective}`}>
    <div className={`input-next-node compact ${next ? `status-${next.status}` : "is-empty"}`}><span>当前自动结果</span><strong>{next?.dateText ?? "待录入"}</strong><p>{next?.title ?? "录入当前阶段的关键时间后自动推算。"}</p></div>
    <nav className="phase-input-tabs" aria-label="选择录入阶段">{([['investigation','侦查'],['prosecution','审查起诉'],['trial','一审'],['later','后续程序']] as Array<[MainlinePhase,string]>).map(([value,label]) => <button type="button" className={activePhase === value ? "active" : ""} onClick={() => setSelectedPhase(value)} key={value}>{label}</button>)}</nav>
    {activePhase === "investigation" && <InvestigationMainline inputs={inputs} setValue={setValue} setValues={setValues} status={status} />}
    {activePhase === "prosecution" && <ProsecutionMainline inputs={inputs} setValue={setValue} setValues={setValues} status={status} />}
    {activePhase === "trial" && <TrialMainline inputs={inputs} setValue={setValue} setValues={setValues} status={status} />}
    {activePhase === "later" && <LaterMainline inputs={inputs} setValue={setValue} setValues={setValues} status={status} />}
    <details className="key-node-guide"><summary>计算说明</summary><p>主线只需录入实际发生的关键时间，系统连续推算后续节点。回避、羁押必要性审查等独立程序按需添加。未羁押侦查没有统一终结期限，系统不会只凭立案日编造移送日期。</p></details>

    <details className="optional-procedures"><summary><div><span>其他程序</span><strong>按需增加回避、羁押审查等</strong></div><em>{enabledCatalog.length ? `已添加 ${enabledCatalog.length} 项` : "未添加"}</em></summary><div className="optional-procedures-body"><div className="optional-procedures-heading"><p>只有添加的分支程序才进入时间线；录入起算日期后立即计算。</p></div>
      <div className="optional-procedure-add"><select aria-label="选择要新增的单独程序" value={selectedProcedure} onChange={(event) => setPendingProcedure(event.target.value as OptionalProcedureId | "")}><option value="">选择程序</option>{available.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button type="button" disabled={!selectedProcedure} onClick={addProcedure}>＋ 添加</button></div>
      {!available.length && !enabledCatalog.length && <p className="optional-empty">当前角色没有可添加的单独程序。</p>}
      <div className="optional-procedure-list">{enabledCatalog.map((item) => <details className="optional-procedure-card" key={`${item.id}-${recentlyAdded === item.id ? "new" : "saved"}`} open={recentlyAdded === item.id}><summary><div><strong>{item.title}</strong><small>{item.description}</small></div><span>展开录入</span></summary><button className="remove-optional" type="button" onClick={() => removeProcedure(item.id)}>移除程序</button><OptionalFields id={item.id} inputs={inputs} setValue={setValue} /></details>)}</div></div>
    </details>
  </div>;
}
