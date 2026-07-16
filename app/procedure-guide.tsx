"use client";

import { useMemo, useState } from "react";
import { procedureCategories } from "../lib/procedure-catalog";

const auditNotes = [
  "预测日期只用于计划，不直接认定办案机关逾期。",
  "条件性长期限必须同时核对案件事实、提请日期和有权机关批准。",
  "法院审理期限与犯罪嫌疑人、被告人的羁押期限分别计算。",
  "收案、送达、批准等实际发生日期优先于文书落款日期。",
];

export function ProcedureGuide() {
  const [activeCategoryId, setActiveCategoryId] = useState(procedureCategories[0].id);
  const [activeProcedureId, setActiveProcedureId] = useState(procedureCategories[0].items[0].id);

  const activeCategory = useMemo(
    () => procedureCategories.find((category) => category.id === activeCategoryId) ?? procedureCategories[0],
    [activeCategoryId],
  );
  const activeProcedure = useMemo(
    () => activeCategory.items.find((item) => item.id === activeProcedureId) ?? activeCategory.items[0],
    [activeCategory, activeProcedureId],
  );

  const selectCategory = (categoryId: string) => {
    const category = procedureCategories.find((item) => item.id === categoryId) ?? procedureCategories[0];
    setActiveCategoryId(category.id);
    setActiveProcedureId(category.items[0].id);
  };

  return (
    <section className="procedure-page">
      <div className="section-intro procedure-intro">
        <h2>刑事诉讼程序分类</h2>
        <p>按案件推进顺序分类展示主要程序与常见分支。先选择阶段，再点击具体事项查看办理要求、期限、留存材料、救济方式和法律依据。</p>
      </div>

      <div className="procedure-guardrails" aria-label="阅读口径">
        <span>起算事实优先</span><span>审限与羁押分开</span><span>延长须有依据和批准</span><span>预测不等于逾期认定</span>
      </div>

      <nav className="procedure-category-nav" role="tablist" aria-label="刑事诉讼程序分类">
        {procedureCategories.map((category) => (
          <button
            type="button"
            role="tab"
            id={`procedure-category-${category.id}`}
            aria-controls="procedure-category-panel"
            aria-selected={category.id === activeCategory.id}
            className={category.id === activeCategory.id ? "active" : ""}
            onClick={() => selectCategory(category.id)}
            key={category.id}
          >
            <span>{category.no}</span><strong>{category.shortTitle}</strong><small>{category.items.length}项</small>
          </button>
        ))}
      </nav>

      <div className="procedure-mobile-selectors">
        <label><span>程序阶段</span><select value={activeCategory.id} onChange={(event) => selectCategory(event.target.value)}>{procedureCategories.map((category) => <option value={category.id} key={category.id}>{category.no} {category.title}</option>)}</select></label>
        <label><span>具体程序</span><select value={activeProcedure.id} onChange={(event) => setActiveProcedureId(event.target.value)}>{activeCategory.items.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      </div>

      <section id="procedure-category-panel" className="procedure-browser" role="tabpanel" aria-labelledby={`procedure-category-${activeCategory.id}`}>
        <aside className="procedure-topic-panel">
          <div><span>{activeCategory.no}</span><h3>{activeCategory.title}</h3><p>{activeCategory.summary}</p></div>
          <nav className="procedure-topic-nav" role="tablist" aria-label={`${activeCategory.title}程序事项`}>
            {activeCategory.items.map((item, index) => (
              <button
                type="button"
                role="tab"
                id={`procedure-topic-${item.id}`}
                aria-controls="procedure-detail"
                aria-selected={item.id === activeProcedure.id}
                className={`procedure-item-button ${item.id === activeProcedure.id ? "active" : ""}`}
                onClick={() => setActiveProcedureId(item.id)}
                key={item.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong>
              </button>
            ))}
          </nav>
        </aside>

        <article id="procedure-detail" className="procedure-detail" role="tabpanel" aria-labelledby={`procedure-topic-${activeProcedure.id}`}>
          <header><span>{activeCategory.title}</span><h3>{activeProcedure.title}</h3><p>{activeProcedure.summary}</p></header>
          <div className="procedure-timing"><span>期限与起算</span><strong>{activeProcedure.timing}</strong></div>
          <div className="procedure-detail-grid">
            <section><h4>适用条件</h4><ul>{activeProcedure.conditions.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section><h4>办理步骤</h4><ol>{activeProcedure.steps.map((item) => <li key={item}>{item}</li>)}</ol></section>
            <section><h4>必须留存</h4><ul>{activeProcedure.evidence.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section><h4>权利与救济</h4><ul>{activeProcedure.remedies.map((item) => <li key={item}>{item}</li>)}</ul></section>
          </div>
          <section className="procedure-basis"><h4>法律依据</h4>{activeProcedure.basis.map((item) => <p key={item}>{item}</p>)}</section>
        </article>
      </section>

      <details className="audit-panel">
        <summary className="audit-summary"><span>规则口径与核验记录</span><em>{auditNotes.length}项 · 核验日 2026-07-15</em></summary>
        <ul>{auditNotes.map((item) => <li key={item}>{item}</li>)}</ul>
      </details>
    </section>
  );
}
