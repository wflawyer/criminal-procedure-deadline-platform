import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedIds = ["criminal-procedure-law", "criminal-law-related", "injury-case-rules", "injury-standard", "criminal-case-rules", "reporting-filing-rules-2023", "filing-opinion-2015", "procuratorate-rules", "minor-injury-guidance", "spc-cpl-interpretation", "bail-rules-2022", "custody-necessity-rules-2023", "sentencing-procedure-opinion-2020", "criminal-property-execution-rules-2014", "holiday-2026"];

test("15份刑事法源清单、正文与摘要一致", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "public/legal/manifest.json"), "utf8"));
  assert.equal(manifest.length, 15);
  assert.deepEqual(manifest.map((doc) => doc.id), expectedIds);
  assert.equal(new Set(manifest.map((doc) => doc.filename)).size, 15);
  assert.equal(manifest.some((doc) => /行政复议|行政诉讼|治安管理处罚法/.test(doc.title)), false);
  for (const doc of manifest) {
    const content = await readFile(path.join(root, "public/legal", doc.filename), "utf8");
    assert.equal(content.length, doc.chars, `${doc.title}字符数`);
    assert.equal(createHash("sha256").update(content).digest("hex"), doc.sha256, `${doc.title}摘要`);
    assert.doesNotMatch(content.slice(0, 500), /404\s*not found|<html[\s>]/i);
  }
});

test("核心期限条文存在于官方来源文本", async () => {
  const dir = path.join(root, "public/legal");
  const cpl = await readFile(path.join(dir, "criminal-procedure-law.txt"), "utf8");
  const spc = await readFile(path.join(dir, "spc-cpl-interpretation.txt"), "utf8");
  const spp = await readFile(path.join(dir, "procuratorate-rules.txt"), "utf8");
  const custody = await readFile(path.join(dir, "custody-necessity-rules-2023.txt"), "utf8");
  const property = await readFile(path.join(dir, "criminal-property-execution-rules-2014.txt"), "utf8");
  assert.match(cpl, /第九十七条[\s\S]*三日以内作出决定/);
  assert.match(cpl, /第二百四十三条[\s\S]*二个月以内审结/);
  assert.match(spc, /第四百五十七条[\s\S]*至迟不得超过六个月/);
  assert.match(spp, /第三百八十六条[\s\S]*不得超过六个月/);
  assert.match(custody, /第十九条[\s\S]*十日以内[\s\S]*三日以内/);
  assert.match(property, /第三条[\s\S]*期限为六个月/);
  assert.match(property, /七日内立案/);
});

test("非全文来源明确标注证据边界", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "public/legal/manifest.json"), "utf8"));
  const doc = manifest.find((x) => x.id === "reporting-filing-rules-2023");
  assert.match(doc.coverage, /非全文/);
  assert.match(doc.source_note, /不是公安部公开发布的全文/);
});

test("法律文件具有法源分类和程序主题标签", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "public/legal/manifest.json"), "utf8"));
  const sourceGroups = new Set(["law", "judicial", "public-security", "joint", "auxiliary"]);
  const topics = new Set(["general", "filing", "investigation", "coercive", "prosecution", "trial", "execution", "injury", "period"]);
  for (const doc of manifest) {
    assert.ok(sourceGroups.has(doc.source_group), `${doc.id}法源分类无效`);
    assert.ok(Array.isArray(doc.topics) && doc.topics.length > 0, `${doc.id}缺少程序主题`);
    assert.equal(new Set(doc.topics).size, doc.topics.length, `${doc.id}主题重复`);
    for (const topic of doc.topics) assert.ok(topics.has(topic), `${doc.id}存在未知主题：${topic}`);
  }
  assert.equal(manifest.find((doc) => doc.id === "holiday-2026").source_group, "auxiliary");
  assert.match(manifest.find((doc) => doc.id === "criminal-law-related").coverage, /摘录/);
  assert.match(manifest.find((doc) => doc.id === "procuratorate-rules").level, /司法解释/);
});
