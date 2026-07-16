---
name: calculate-criminal-deadlines
description: 确定性计算中国刑事案件程序期限，校验案件日期冲突，并按被害人代理人、犯罪嫌疑人/被告人或辩护人视角生成行动清单。适用于报案受案、伤情鉴定、立案监督、拘留逮捕、侦查羁押、审查起诉、一审二审、不起诉救济、申诉再审和执行期限；也适用于查询内置程序目录或本地法条文本。用户提到刑事程序时间线、期限届满、超期、下一步行动、案件节点核验或希望把案件数据保存在本地文件时使用。
---

# 刑事诉讼期限管理

使用本 Skill 的确定性脚本计算日期，不要由语言模型心算期限。案件数据默认写入用户指定的本地 JSON/Markdown 文件；未经用户明确要求，不上传、发布或写入第三方服务。

## 工作流

1. 先确认角色视角：`victimAgent`（被害人/代理人）、`suspectDefendant`（犯罪嫌疑人/被告人）或 `defender`（辩护人）。
2. 只收集影响当前程序阶段的事实日期。日期格式使用 `YYYY-MM-DD`；精确到时分时使用 `YYYY-MM-DDTHH:mm`。
3. 新案件先执行 `init` 生成本地模板，再编辑其中的 `inputs`。已有 JSON 可直接使用；脚本接受完整案件对象或仅含字段的对象。
4. 先执行 `validate`，修正明确的错误；无法确认的日期保留为空，不要猜测。
5. 执行 `calculate`。默认用 `focus` 生成角色重点；需要排查全部节点时改为 `all`，只看紧急节点时用 `urgent`。
6. 报告中分别陈述：已录事实、脚本计算结果、校验警告、仍待核实的证据。不要把预测节点写成已发生事实。
7. 准备对外提交的法律材料前，检查本地法条库 `checked_at`。法律或节假日可能变化时，另行核对当前官方来源。

## 命令

将 `<skill-root>` 替换为本 Skill 所在目录。Node.js 需支持 TypeScript 类型剥离（建议 Node.js 22.6+）。

```bash
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs help
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs init --output ./匿名案件.json --perspective victimAgent
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs validate --input ./匿名案件.json
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs calculate --input ./匿名案件.json --scope focus --format markdown --output ./匿名案件-期限报告.md
```

其他能力：

```bash
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs schema --format markdown
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs procedures --query 不立案 --format markdown
node --experimental-strip-types <skill-root>/scripts/deadline-cli.mjs search-law --query 七日以内 --limit 10 --format markdown
```

`calculate` 可使用 `--scope focus|urgent|all`、`--hide-waiting`、`--include-law-text` 和 `--format markdown|json`。除 `init` 外，命令不修改输入案件文件。

## 输入与输出规则

- 需要字段定义、枚举值或可选程序编号时，读取 [references/input-schema.md](references/input-schema.md)，并优先运行 `schema` 获得机器生成的当前字段表。
- 需要判断程序操作步骤、材料和救济路径时，运行 `procedures`；不要把程序目录中的概括替代正式法条。
- 需要法条原文时，运行 `search-law`。引用时同时保留法规标题、文本覆盖范围、核验日期和来源链接。
- 发现输入日期被忽略、未知字段、前后矛盾或超出 2026 年节假日完整覆盖范围时，必须在结果中显式保留警告。
- 不用真实姓名作为测试样例或文件名。需要隐私说明时，读取 [references/privacy-and-boundaries.md](references/privacy-and-boundaries.md)。

## 结果表达

先给出可执行结论，再列关键截止日和依据。对每个高风险节点至少包含：截止时间、当前状态、应立即采取的动作、法源依据、待补证据。若脚本未能计算固定期限，明确写“无法从现有输入确定”，不要补造日期。
