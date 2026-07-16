import assert from "node:assert/strict";
import test from "node:test";
import { procedureCategories } from "../lib/procedure-catalog.ts";

test("刑事程序分类和程序事项具有唯一标识及完整详情", () => {
  const requiredCategories = [
    "filing", "investigation", "coercive-measures", "prosecution", "trial",
    "appeal-review", "review-execution", "rights", "special",
  ];
  const categoryIds = procedureCategories.map((category) => category.id);
  assert.equal(new Set(categoryIds).size, categoryIds.length);
  for (const id of requiredCategories) assert.ok(categoryIds.includes(id), `缺少程序分类：${id}`);

  const items = procedureCategories.flatMap((category) => category.items);
  const itemIds = items.map((item) => item.id);
  assert.equal(new Set(itemIds).size, itemIds.length);
  assert.ok(items.length >= 30, "程序目录应覆盖主线和常见分支");

  for (const category of procedureCategories) {
    assert.ok(category.title.trim());
    assert.ok(category.items.length > 0, `${category.title}没有程序事项`);
  }
  for (const item of items) {
    assert.ok(item.title.trim(), `${item.id}缺少标题`);
    assert.ok(item.summary.trim(), `${item.id}缺少摘要`);
    assert.ok(item.timing.trim(), `${item.id}缺少期限说明`);
    assert.ok(item.conditions.length > 0, `${item.id}缺少适用条件`);
    assert.ok(item.steps.length > 0, `${item.id}缺少办理步骤`);
    assert.ok(item.evidence.length > 0, `${item.id}缺少留存材料`);
    assert.ok(item.remedies.length > 0, `${item.id}缺少救济说明`);
    assert.ok(item.basis.length > 0, `${item.id}缺少法律依据`);
  }
});
