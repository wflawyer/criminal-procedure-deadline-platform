# 本地案件输入说明

## 文件结构

`init` 生成的文件结构如下。`calculate` 和 `validate` 也接受直接以字段对象作为文件根节点的简化格式。

```json
{
  "version": 1,
  "caseId": "case-anonymous",
  "status": "准备中",
  "createdAt": "2026-07-15T00:00:00.000Z",
  "updatedAt": "2026-07-15T00:00:00.000Z",
  "inputs": {
    "caseName": "匿名案件",
    "perspective": "victimAgent",
    "caseRoute": "public",
    "asOf": "2026-07-15T14:30",
    "optionalProcedures": [],
    "reportDate": "2026-07-01",
    "acceptedAt": "2026-07-01T10:20"
  }
}
```

未提供的字段由脚本使用空值或默认程序路径补齐。空值表示“未知/尚未发生”，不是零日期。

## 基本枚举

| 字段 | 允许值 |
|---|---|
| `perspective` | `victimAgent`、`suspectDefendant`、`defender` |
| `caseRoute` | `public`、`private` |
| `appraisalComplexity` | `instant`、`complex`、`functional` |
| `injuryLevel` | `pending`、`minor`、`light2`、`light1`、`serious`、`death` |
| `criminalReviewTrack` | `ordinary`、`verify`、`major` |
| `detentionTrack` | `ordinary10`、`special14`、`major37` |
| `custodyTrack` | `base2`、`complex3`、`special5`、`ten7`、`npcSpecial` |
| `prosecutionTrack` | `ordinary`、`major`、`fast10`、`fast15` |
| `trialTrack` | `ordinary2`、`ordinary3`、`special6`、`summary20`、`summary45`、`fast10`、`fast15`、`private6` |
| `firstDecisionType` | `judgment`、`ruling` |
| `secondInstanceTrack` | `ordinary2`、`special4` |

完整字段和默认值以 `deadline-cli.mjs schema` 的输出为准。

## 可选程序

`optionalProcedures` 可包含：

- `appraisal`：伤情鉴定
- `filingRelief`：不立案复议、复核、检察监督
- `nonCustodialMeasures`：取保、监视居住、变更强制措施
- `custodyNecessity`：羁押必要性审查
- `investigationRecusal`：侦查阶段回避及复议
- `rightsObstruction`：诉讼权利受阻控告
- `nonProsecutionRelief`：不起诉申诉、复查
- `incidentalCivil`：刑事附带民事
- `judgmentRelief`：请求抗诉、上诉
- `complaintRetrial`：申诉、再审
- `propertyExecution`：涉财产执行

即使未手动加入编号，只要录入了该程序的实际日期，脚本也会自动启用相应节点。

## 重点日期分组

- 报案立案：`incidentDate`、`reportDate`、`acceptedAt`、`criminalReviewStartDate`、`criminalFiledDate`、`noCaseDecisionDate`、`noCaseNoticeDate`
- 鉴定：`appraisalCommissionAt`、`appraisalOpinionAt`、`appraisalDocumentDate`、`appraisalServedDate`
- 羁押侦查：`detentionAt`、`arrestDate`、各层延长提请/批准日期、发现另有重要罪行及重新计算报批日期
- 审查起诉：`prosecutionReceivedDate`、两次退补及重报日期、不起诉决定送达和救济日期
- 审判救济：法院收案、开庭、裁判宣告/送达、请求抗诉、上诉、二审、申诉再审日期
- 执行：生效裁判、执行文书送达、涉财产移送/立案/完成日期

## 日期证据优先级

优先使用盖章收件凭证、送达回证、决定书落款及实际签收记录。用户口述日期与书面材料不一致时，两者都记录在说明中，但计算字段采用经核实的程序起算日期。
