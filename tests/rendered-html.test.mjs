import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("服务端输出以案件库为主页的刑事诉讼平台首屏", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>刑事诉讼程序与期限管理平台<\/title>/i);
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="hero role-hero/);
  assert.match(html, /刑事案件库/);
  assert.match(html, /掌握办案期限，及时行使被害人权利/);
  assert.match(html, /程序向前推进，期限同步更新/);
  assert.match(html, /程序期限/);
  assert.match(html, /程序说明/);
  assert.match(html, /法律依据/);
  assert.match(html, /被害人／诉讼代理人/);
  assert.match(html, /正在同步计算时间/);
  assert.doesNotMatch(html, /录入／修改关键时间|跨阶段完整时间线/);
  assert.doesNotMatch(html, /当前案件阶段/);
  assert.doesNotMatch(html, /class="work-page-header/);
  assert.doesNotMatch(html, /真实当事人姓名/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("案件主页显示完整主视觉，其他页显示紧凑工作顶栏", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /useState<Tab>\("cases"\)/);
  assert.match(source, /\{tab === "cases" && <><header className="site-header"/);
  assert.match(source, /\{workPage && <header className=\{`work-page-header page-\$\{workPage\.key\}`\}/);
  assert.doesNotMatch(source, /\{tab !== "calculator" && <section className=\{`hero/);
  assert.match(source, /<nav className="tab-bar" aria-label="主要功能">/);
  assert.match(source, /tabItems\.map\(\(item\) => <button/);
  assert.match(source, /aria-label=\{item\.label\}/);
  assert.match(source, /aria-current=\{tab === item\.key \? "page" : undefined\}/);
  assert.match(source, /<h1>\{workPage\.title\}<\/h1>/);
  assert.doesNotMatch(source, /tab !== "cases" && <h1 className="visually-hidden"/);
});

test("工作页顶栏显示案件上下文并可返回案件库", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<dt>当前案件<\/dt>/);
  assert.match(source, /<dt>当前视角<\/dt>/);
  assert.match(source, /<dt>案件阶段<\/dt>/);
  assert.match(source, /<dd>\{activeProject\.status\}<\/dd>/);
  assert.match(source, /aria-label="返回案件库" onClick=\{\(\) => selectTab\("cases"\)\}/);
});

test("主导航和法律库使用用户指定名称", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /\{ key: "calculator", index: "02", label: "程序期限" \}/);
  assert.match(source, /\{ key: "sources", index: "04", label: "法律依据" \}/);
  assert.match(source, /<h2>刑事法律库<\/h2>/);
  assert.doesNotMatch(source, /期限工具|刑事法律依据库/);
});

test("程序说明采用分类目录并一次只显示一个事项详情", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const guide = await readFile(new URL("../app/procedure-guide.tsx", import.meta.url), "utf8");
  assert.match(page, /<ProcedureGuide \/>/);
  assert.doesNotMatch(page, /procedureSteps\.map/);
  assert.match(guide, /activeProcedureId/);
  assert.match(guide, /className="procedure-category-nav" role="tablist"/);
  assert.match(guide, /className={`procedure-item-button/);
  assert.match(guide, /role="tab"/);
  assert.match(guide, /aria-selected=/);
  assert.match(guide, /className="procedure-detail" role="tabpanel"/);
  assert.match(guide, /<details className="audit-panel">/);
  assert.doesNotMatch(guide, /<details className="audit-panel" open/);
});

test("法律库支持法源类型和程序主题双重筛选", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../lib/legal-catalog.ts", import.meta.url), "utf8");
  assert.match(source, /legalSourceGroup/);
  assert.match(source, /legalTopic/);
  assert.match(source, /className="legal-category-tabs"/);
  assert.match(source, /国家法律法规数据库/);
  assert.match(source, /activeLegal\.database_url/);
  assert.match(catalog, /document\.source_group === filters\.sourceGroup/);
  assert.match(catalog, /document\.topics\.includes\(filters\.topic\)/);
});

test("法律库支持独立的浏览器本地数据库上传", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../lib/legal-catalog.ts", import.meta.url), "utf8");
  const localStore = await readFile(new URL("../lib/local-legal-library.ts", import.meta.url), "utf8");
  assert.match(source, />上传本地法律数据库<\/button>/);
  assert.match(source, /ref=\{legalImportRef\} hidden multiple type="file"/);
  assert.match(source, /\.txt,\.md,\.markdown,\.json,\.pdf/);
  assert.match(source, /allLegalDocs = useMemo\(\(\) => \[\.\.\.legalDocs, \.\.\.localLegalDocs\]/);
  assert.match(source, /activeLegal\.local/);
  assert.match(source, /readLocalLegalContent\(activeLegal\.id\)/);
  assert.match(source, /className="legal-pdf-preview"/);
  assert.match(source, /本地上传文件未经平台核验，也不会自动成为期限计算依据/);
  assert.match(catalog, /\{ id: "local", label: "本地上传" \}/);
  assert.doesNotMatch(catalog, /\{ id: "case"/);
  assert.match(localStore, /indexedDB\.open/);
  assert.match(localStore, /const DOCUMENT_STORE = "documents"/);
  assert.match(localStore, /const CONTENT_STORE = "contents"/);
  assert.doesNotMatch(localStore, /localStorage|sessionStorage|dangerouslySetInnerHTML/);
});

test("期限录入区按阶段切换并将例外程序收起", async () => {
  const source = await readFile(new URL("../app/role-input-sections.tsx", import.meta.url), "utf8");
  assert.match(source, /phase-input-tabs/);
  assert.match(source, /<details className="key-node-guide"><summary>计算说明/);
  assert.doesNotMatch(source, /<details className="key-node-guide" open/);
  assert.match(source, /审查起诉关键时间/);
  assert.match(source, /延长、改变管辖与退回补充侦查/);
  assert.match(source, /改变管辖后新检察院收案日/);
  assert.match(source, /按需增加回避、羁押审查等/);
  assert.match(source, /羁押必要性审查／评估/);
  assert.match(source, /公安侦查人员回避/);
  assert.match(source, /当前自动结果/);
  assert.match(source, /未羁押侦查没有统一终结期限/);
  assert.match(source, /完整法定层级与批准日期/);
  assert.match(source, /拟核验的期限层级（不等于已经批准）/);
  assert.match(source, /普通侦查羁押期限/);
  assert.match(source, /第157条例外程序/);
  assert.match(source, /基础2个月期限届满7日前提请/);
  assert.match(source, /上一级人民检察院批准/);
  assert.match(source, /省、自治区、直辖市人民检察院批准/);
  assert.match(source, /累计3个月/);
  assert.match(source, /累计5个月/);
  assert.match(source, /累计7个月/);
  assert.match(source, /交通十分不便的边远地区重大复杂案件/);
  assert.match(source, /重大的犯罪集团案件/);
  assert.match(source, /流窜作案的重大复杂案件/);
  assert.match(source, /犯罪涉及面广、取证困难的重大复杂案件/);
  assert.match(source, /第157条不是普通累计期限的下一层/);
  assert.match(source, /第158条法定事由/);
  assert.match(source, /发现另有重要罪行：重新计算/);
  assert.match(source, /发现日起5日内实际报批日/);
  assert.match(source, /5日约束的是报批/);
  assert.match(source, /每一层是否实际生效，以对应批准日期为准/);
  assert.doesNotMatch(source, /DefenseRightsSection|LaterStagesSection/);
});

test("案件库卡片采用紧凑案件摘要并显示下一诉讼环节时间", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /className="new-case-card"/);
  assert.match(source, /className="primary" onClick=\{createNew\}/);
  assert.match(source, /> 新增案件<\/button>/);
  assert.match(source, /当前阶段/);
  assert.match(source, /下一个诉讼环节及时间/);
  assert.match(source, /case-project-card compact/);
  assert.match(source, /className="case-overview"/);
  assert.doesNotMatch(source, /case-card-stats|case-current-stage|case-status-field|case-notes-field/);
  assert.doesNotMatch(source, /案件资料只保存在当前浏览器。分享网页不会自动分享案件数据/);
  assert.match(source, /className="hero-program-visual"/);
  assert.doesNotMatch(source, /className="case-assessment"/);
  assert.match(source, /label: "法律依据"/);
  assert.doesNotMatch(source, />法律原文<\/button>/);
});

test("期限页区分案件真实进展与所选阶段时间线", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /className="stage-progress"/);
  assert.match(source, /className={`tool-summary/);
  assert.match(source, /案件实际阶段/);
  assert.match(source, /下一办理节点/);
  assert.match(source, /节点日期/);
  assert.match(source, /建议操作/);
  assert.match(source, /按阶段查看程序/);
  assert.match(source, /已记录＝实际发生/);
  assert.match(source, /法定节点＝依法计算/);
  assert.match(source, /预测＝根据现有时间推算/);
  assert.match(source, /录入／修改关键时间/);
  assert.match(source, /跨阶段完整时间线/);
  assert.doesNotMatch(source, /className="stats-grid"/);
  assert.match(source, />打印／保存PDF<\/button>/);
  assert.match(source, />导出HTML<\/button>/);
  assert.match(source, /type: "text\/html;charset=utf-8"/);
  assert.match(source, /刑事诉讼时间线\.html/);
  assert.match(source, />导出备份<\/button>/);
});

test("首页主视觉保持紧凑并提供手机阅读规格", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(css, /\.hero \{[\s\S]*?padding: 36px 0 32px;/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.result-actions \.input-toggle \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /\.stage-progress \{ grid-template-columns: repeat\(5, minmax\(88px, 1fr\)\); overflow-x: auto;/);
  assert.match(css, /@media \(max-width: 420px\)/);
  assert.match(css, /\.work-page-back \{[\s\S]*?min-height: 44px;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.work-page-header \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*?\.work-page-context \{ grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.procedure-item-button \{[^}]*min-height: 50px;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.procedure-detail-grid \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.match(css, /\.legal-category-tabs button \{[^}]*min-width: max-content; min-height: 46px;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.legal-filter-bar \{ grid-template-columns: 1fr 1fr; \}/);
  assert.match(css, /\.custody-track-field select \{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; \}/);
  assert.match(css, /\.custody-track-summary dl > div,[\s\S]*?\.custody-law-ladder dl > div \{ grid-template-columns: minmax\(0, 1fr\); gap: 3px; \}/);
  assert.match(layout, /viewportFit: "cover"/);
});

test("诉讼阶段可点击预览且不改变案件实际阶段", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /className="stage-progress" role="tablist"/);
  assert.match(source, /role="tab"[^>]*aria-selected=/);
  assert.match(source, /setInspectedStage\(stage\)/);
  assert.match(source, /后续预览/);
  assert.match(source, /案件实际阶段仍为/);
  assert.match(source, /className={`procedure-progress stage-procedure/);
  assert.doesNotMatch(source, /stage-inspector-item|stage-inspector-grid|quick-stats/);
  assert.match(css, /\.stage-procedure/);
  assert.doesNotMatch(css, /\.stage-inspector-grid|\.quick-stats/);
});

test("主程序时间线与选择阶段联动且不改变案件实际阶段", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const stageSource = await readFile(new URL("../lib/procedure-stages.ts", import.meta.url), "utf8");
  assert.match(source, /visibleInProcedureStage\(item, inspectedStage\)/);
  assert.doesNotMatch(source, /visibleInProcedureStage\(item, currentProcedureStage\)/);
  assert.match(source, /\{inspectedStage\}程序节点/);
  assert.match(source, /案件实际阶段仍为/);
  assert.doesNotMatch(source, /\bgetRoleStats\b|\broleStats\b|inspectedStageDeadlines/);
  assert.match(source, /退回补充侦查也归入本阶段/);
  assert.match(source, /displayStage: "侦查终结与移送"/);
  assert.match(source, /displayStage: "退回补充侦查"/);
  assert.match(source, /查看从侦查到执行的全部节点/);
  assert.match(stageSource, /"prosecution-transfer-forecast"/);
  assert.match(stageSource, /"supplement-1"/);
  assert.match(stageSource, /return \["公安侦查", "审查起诉"\]/);
});

test("重复的阶段预览卡已删除，仅保留真实进展和一套阶段节点", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const summaryIndex = source.indexOf("aria-label=\"案件当前进展\"");
  const browserIndex = source.indexOf("className=\"stage-browser\"");
  const progressIndex = source.indexOf("className={`procedure-progress stage-procedure");
  assert.ok(summaryIndex >= 0 && browserIndex > summaryIndex && progressIndex > browserIndex);
  assert.doesNotMatch(source, /stage-inspector-item|stage-inspector-grid|inspectedStageItems/);
  assert.match(source, /选择阶段只会改变下方查看内容，不会修改案件实际阶段/);
});

test("正常输入不显示校验栏，异常入口仍保留", async () => {
  const response = await render();
  const html = await response.text();
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(html, /校验正常|输入数据校验|输入校验与计算口径/);
  assert.match(source, /\{issues\.length > 0 && <details className="input-issues-alert" open>/);
  assert.match(source, /录入时间有 \{issues\.length\} 项需要核对/);
});

test("期限计算说明并入跨阶段完整时间线", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const fullTimelineIndex = source.indexOf('<details className="full-timeline"');
  const rulesIndex = source.indexOf('className="calculation-rules"');
  assert.ok(fullTimelineIndex >= 0 && rulesIndex > fullTimelineIndex);
  assert.match(source, /className="calculation-method"/);
  assert.doesNotMatch(source, /输入校验与计算口径|校验正常/);
  assert.equal(source.match(/className="calculation-rules"/g)?.length, 1);
});

test("全站统一律师工具字体层级并压缩重复备注", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--font-ui:/);
  assert.match(css, /--text-caption: 12px/);
  assert.match(css, /--text-body: 14px/);
  assert.match(css, /--muted: #5a6b76/);
  assert.match(css, /\.progress-main h4 \{ font-size: var\(--text-important\)/);
  assert.match(css, /\.progress-basis \{ font-size: var\(--text-caption\)/);
  assert.match(css, /\.legal-text \{ font-size: 15px; line-height: 1\.9;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.legal-text \{ min-height: 420px; padding: 16px; font-size: 16px;/);
  assert.match(css, /\.field input,[\s\S]*?font-size: 16px;/);
  assert.doesNotMatch(source, /OPTIONAL INPUT|PROCEDURE PROGRESS|VERIFIED LEGAL SOURCES|CASE PROJECTS/);
  assert.match(source, /className="legal-provenance"/);
  assert.doesNotMatch(source, /className="legal-hash"/);
});
