#!/usr/bin/env python3
"""构建网页内置法律文本库。

生成物位于 public/legal/ 并随网页一同发布，因此在查看条文时不需要
跳转到外部网站。脚本会校验来源页面是否包含关键条文，避免将 404 页面或
网站导航误当作法律原文。
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import urllib.parse
from dataclasses import dataclass, asdict, field
from datetime import date
from pathlib import Path

from lxml import html


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "legal"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36"


@dataclass
class Document:
    id: str
    title: str
    level: str
    authority: str
    source_url: str
    coverage: str
    effective: str
    points: str
    filename: str
    source_note: str = ""
    database_url: str = ""
    source_group: str = ""
    topics: list[str] = field(default_factory=list)
    chars: int = 0
    sha256: str = ""
    checked_at: str = ""


def fetch(url: str) -> bytes:
    curl = shutil.which("curl")
    if not curl:
        raise RuntimeError("未找到 curl，无法通过系统可信证书下载法律文本")
    result = subprocess.run(
        [
            curl,
            "--fail",
            "--location",
            "--silent",
            "--show-error",
            "--max-time",
            "45",
            "--user-agent",
            USER_AGENT,
            url,
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout


def clean_line(value: str) -> str:
    value = value.replace("\u3000", " ").replace("\xa0", " ")
    return re.sub(r"[ \t\r\f\v]+", " ", value).strip()


def html_blocks(raw: bytes, xpath: str) -> str:
    doc = html.fromstring(raw)
    nodes = doc.xpath(xpath)
    if not nodes:
        raise RuntimeError(f"HTML 未找到正文节点: {xpath}")
    target = nodes[0]
    for bad in target.xpath(".//script|.//style|.//nav|.//form"):
        bad.drop_tree()
    blocks: list[str] = []
    candidates = target.xpath(".//h1|.//h2|.//h3|.//h4|.//p|.//li|.//tr")
    for node in candidates:
        text = clean_line("".join(node.itertext()))
        if not text or text in blocks[-2:]:
            continue
        blocks.append(text)
    if len("".join(blocks)) < 1000:
        blocks = [clean_line(line) for line in target.text_content().splitlines() if clean_line(line)]
    return "\n\n".join(blocks)


def extract_html(url: str, xpath: str) -> str:
    return html_blocks(fetch(url), xpath)


def extract_pdf(url: str) -> str:
    pdftotext = shutil.which("pdftotext") or "/opt/local/bin/pdftotext"
    if not Path(pdftotext).exists():
        raise RuntimeError("未找到 pdftotext，无法构建 PDF 法律原文")
    with tempfile.TemporaryDirectory() as temp:
        pdf = Path(temp) / "source.pdf"
        txt = Path(temp) / "source.txt"
        pdf.write_bytes(fetch(url))
        subprocess.run([pdftotext, "-raw", str(pdf), str(txt)], check=True)
        content = txt.read_text("utf-8", errors="replace")
    # 去掉 PDF 排版造成的汉字行内断行，保留句号后的自然分段。
    content = re.sub(r"(?<=[\u3400-\u9fff])\n(?=[\u3400-\u9fff])", "", content.replace("\f", "\n"))
    lines = [clean_line(line) for line in content.splitlines()]
    return "\n".join(line for line in lines if line)


def extract_reporting_rules() -> str:
    """将公安部依申请公开 PDF 的公开部分转为可检索文本。

    页面是该 PDF 的文字化镜像；每个分块的 JSON-LD text 与扫描件逐项核对。
    网页内会明确标注“依申请公开部分”，不把它误称为公开发布的全文。
    """
    index_url = "https://flfgsc.cn/law/公安机关接报案与立案工作规定-2023年"
    raw = fetch(urllib.parse.quote(index_url, safe=":/-"))
    doc = html.fromstring(raw)
    links: list[str] = []
    for href in doc.xpath("//a[contains(@href, '/block')]/@href"):
        url = urllib.parse.urljoin(index_url, href)
        if url not in links:
            links.append(url)
    texts: list[str] = []
    for link in links:
        block = html.fromstring(fetch(urllib.parse.quote(link, safe=":/-")))
        for script in block.xpath("//script[@type='application/ld+json']"):
            try:
                data = json.loads(script.text or "{}")
            except json.JSONDecodeError:
                continue
            value = clean_line(str(data.get("text", "")))
            if value and value not in texts:
                texts.append(value)
                break
    if len(texts) < 19:
        raise RuntimeError(f"接报案规定公开文本分块不完整: {len(texts)}")
    return "公安机关接报案与立案工作规定\n（公安部依政府信息公开申请公开的部分内容）\n\n" + "\n\n".join(texts)


def extract_criminal_law_articles() -> str:
    url = "https://www.spp.gov.cn/spp/fl/201802/t20180206_364975.shtml"
    text = extract_html(url, "//*[@id='fontzoom']")
    selections = []
    for article, next_article in [(36, 37), (234, 235)]:
        pattern = rf"第{to_cn(article)}条[\s\S]*?(?=第{to_cn(next_article)}条)"
        match = re.search(pattern, text)
        if not match:
            raise RuntimeError(f"未找到刑法第{article}条")
        selections.append(match.group(0).strip())
    return "中华人民共和国刑法——本工作台相关条文\n\n" + "\n\n".join(selections)


def to_cn(value: int) -> str:
    digits = "零一二三四五六七八九"
    if value < 10:
        return digits[value]
    if value < 20:
        return "十" + (digits[value % 10] if value % 10 else "")
    if value < 100:
        return digits[value // 10] + "十" + (digits[value % 10] if value % 10 else "")
    hundreds, rest = divmod(value, 100)
    result = digits[hundreds] + "百"
    if rest == 0:
        return result
    if rest < 10:
        return result + "零" + digits[rest]
    return result + to_cn(rest)


def ensure(text: str, anchors: list[str], min_chars: int, title: str) -> str:
    normalized = text.strip() + "\n"
    missing = [anchor for anchor in anchors if anchor not in normalized]
    if missing:
        raise RuntimeError(f"{title} 缺少校验锚点: {missing}")
    if len(normalized) < min_chars:
        raise RuntimeError(f"{title} 文本过短: {len(normalized)} < {min_chars}")
    return normalized


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    documents: list[tuple[Document, str, list[str], int]] = []

    def add(doc: Document, text: str, anchors: list[str], min_chars: int = 1000) -> None:
        documents.append((doc, ensure(text, anchors, min_chars, doc.title), anchors, min_chars))

    add(Document("criminal-procedure-law", "中华人民共和国刑事诉讼法", "法律", "全国人大", "https://www.spp.gov.cn/spp/zdgz/201810/t20181027_396818.shtml", "全文", "2018-10-26修正", "立案、强制措施、侦查、审查起诉、一二审、申诉再审及执行。", "criminal-procedure-law.txt"), extract_html("https://www.spp.gov.cn/spp/zdgz/201810/t20181027_396818.shtml", "//*[@id='fontzoom']"), ["第一百一十二条", "第二百四十三条", "第二百五十八条"], 30000)

    add(Document("criminal-law-related", "中华人民共和国刑法相关条文（故意伤害专题）", "法律条文摘录", "全国人大", "https://www.spp.gov.cn/spp/fl/201802/t20180206_364975.shtml", "第36、234条专题摘录", "现行条文", "故意伤害罪与经济损失赔偿，作为伤害类案件专题法源。", "criminal-law-related.txt"), extract_criminal_law_articles(), ["第三十六条", "第二百三十四条"], 200)

    add(Document("injury-case-rules", "公安机关办理伤害案件规定", "公安部规范性文件", "公安部", "https://www.taicang.gov.cn/taicang/tcgaj05/200803/de8108127d96431b8e4d3de242674b6d.shtml", "全文", "2006-02-01", "现场处置、调查取证、鉴定、行政刑事分流。", "injury-case-rules.txt"), extract_html("https://www.taicang.gov.cn/taicang/tcgaj05/200803/de8108127d96431b8e4d3de242674b6d.shtml", "//*[@id='zoomcon']"), ["第十八条", "第十九条", "第二十九条"], 3000)

    add(Document("injury-standard", "人体损伤程度鉴定标准", "联合发布标准", "最高法、最高检、公安部、国安部、司法部", "https://police.hangzhou.gov.cn/art/2015/1/15/art_1228937659_39671635.html", "全文", "2014-01-01", "人体损伤重伤、轻伤、轻微伤分级。", "injury-standard.txt"), extract_html("https://police.hangzhou.gov.cn/art/2015/1/15/art_1228937659_39671635.html", "(//*[contains(@class,'content-delite')])[1]"), ["5.6.3 轻伤一级", "5.6.4 轻伤二级", "肋骨骨折"], 15000)

    add(Document("criminal-case-rules", "公安机关办理刑事案件程序规定", "公安部规章", "公安部", "https://www.nia.gov.cn/News/files/c1460628/1506344.pdf", "全文", "2020-09-01修正", "刑事受案、立案与不立案救济、强制措施、侦查终结。", "criminal-case-rules.txt"), extract_pdf("https://www.nia.gov.cn/News/files/c1460628/1506344.pdf"), ["第一百六十九条", "第一百七十八条", "第一百七十九条"], 50000)

    add(Document("reporting-filing-rules-2023", "公安机关接报案与立案工作规定（依申请公开部分）", "公安部规范性文件", "公安部", "https://upload.wikimedia.org/wikipedia/commons/e/ec/%E3%80%8A%E5%85%AC%E5%AE%89%E6%9C%BA%E5%85%B3%E6%8E%A5%E6%8A%A5%E6%A1%88%E4%B8%8E%E7%AB%8B%E6%A1%88%E5%B7%A5%E4%BD%9C%E8%A7%84%E5%AE%9A%E3%80%8B%E9%83%A8%E5%88%86%E8%A7%84%E5%AE%9A.pdf", "依政府信息公开申请公开的部分内容；非全文", "2024-01-01", "三个当场、首接责任、管辖和接报案衔接。", "reporting-filing-rules-2023.txt", source_note="内置可搜索文本依据公开扫描件的文字化镜像整理；公开材料仅包含依政府信息公开申请获得的部分条款，不是公安部公开发布的全文。"), extract_reporting_rules(), ["三个当场", "对报案人上门报案", "2024年1月1日起施行"], 2000)

    add(Document("filing-opinion-2015", "公安部关于改革完善受案立案制度的意见", "公安部规范性文件", "公安部", "https://gaj.ezhou.gov.cn/jwgk/zc/qtzdgkwj2024/202403/t20240313_616277.html", "全文；与已公开现行规定发生可核实冲突时，以现行有效规定为准", "2015-11-04", "刑事立案审查3日、7日、30日。", "filing-opinion-2015.txt"), extract_html("https://gaj.ezhou.gov.cn/jwgk/zc/qtzdgkwj2024/202403/t20240313_616277.html", "(//*[contains(@class,'xqym-p')])[1]"), ["刑事案件立案审查期限原则上不超过3日", "可以延长至30日"], 2500)

    add(Document("procuratorate-rules", "人民检察院刑事诉讼规则", "司法解释（最高检规则）", "最高人民检察院", "https://www.spp.gov.cn/spp/xwfbh/wsfbh/201912/t20191230_451490.shtml", "全文", "2019-12-30", "立案监督、诉讼权利告知、审查起诉。", "procuratorate-rules.txt"), extract_html("https://www.spp.gov.cn/spp/xwfbh/wsfbh/201912/t20191230_451490.shtml", "//*[@id='fontzoom']"), ["第五百六十条", "第五百六十三条", "第五百六十四条"], 80000)

    add(Document("minor-injury-guidance", "关于依法妥善办理轻伤害案件的指导意见", "联合指导意见", "最高人民检察院、公安部", "https://www.spp.gov.cn/spp/xwfbh/wsfbt/202303/t20230302_604352.shtml", "全文（含官方发布说明）", "2023-03-02", "轻伤害案件的证据审查、行为责任区分和调解从宽。", "minor-injury-guidance.txt"), extract_html("https://www.spp.gov.cn/spp/xwfbh/wsfbt/202303/t20230302_604352.shtml", "//*[@id='fontzoom']"), ["关于依法妥善办理轻伤害案件的指导意见", "（二十四）"], 12000)

    add(Document("spc-cpl-interpretation", "最高人民法院关于适用《中华人民共和国刑事诉讼法》的解释", "司法解释", "最高人民法院", "https://www.court.gov.cn/zixun/xiangqing/286491.html", "全文", "2021-03-01", "期间计算、一二审、申诉再审、特别程序及执行。", "spc-cpl-interpretation.txt"), extract_html("https://www.court.gov.cn/zixun/xiangqing/286491.html", "//*[@id='zoom']"), ["第二百零二条", "第三百八十条", "第四百五十七条"], 70000)

    add(Document("bail-rules-2022", "关于取保候审若干问题的规定", "联合规范性文件", "最高法、最高检、公安部、国安部", "https://www.court.gov.cn/zixun/xiangqing/372491.html", "全文", "2022-09-21", "取保候审决定、执行、变更、解除以及权利保障。", "bail-rules-2022.txt"), extract_html("https://www.court.gov.cn/zixun/xiangqing/372491.html", "//*[@id='zoom']"), ["第二十三条", "第二十五条", "第二十九条"], 8000)

    add(Document("custody-necessity-rules-2023", "人民检察院 公安机关羁押必要性审查、评估工作规定", "联合规范性文件", "最高人民检察院、公安部", "https://www.spp.gov.cn/xwfbh/wsfbt/202312/t20231213_636603.shtml", "全文（含官方发布说明）", "2023-11-30", "羁押必要性审查、评估的申请、期限、通知和救济。", "custody-necessity-rules-2023.txt"), extract_html("https://www.spp.gov.cn/xwfbh/wsfbt/202312/t20231213_636603.shtml", "//*[@id='fontzoom']"), ["第七条", "第十九条", "第二十一条"], 7000)

    add(Document("sentencing-procedure-opinion-2020", "关于规范量刑程序若干问题的意见", "联合指导意见", "最高法、最高检、公安部、国安部、司法部", "https://www.spp.gov.cn/spp/xwfbh/wsfbt/202011/t20201105_484007.shtml", "全文（含官方发布说明）", "2020-11-05", "量刑建议、量刑证据、量刑辩论及被害人意见。", "sentencing-procedure-opinion-2020.txt"), extract_html("https://www.spp.gov.cn/spp/xwfbh/wsfbt/202011/t20201105_484007.shtml", "//*[@id='fontzoom']"), ["第六条", "第十四条", "第二十四条"], 4500)

    add(Document("criminal-property-execution-rules-2014", "最高人民法院关于刑事裁判涉财产部分执行的若干规定", "司法解释", "最高人民法院", "https://www.court.gov.cn/fabu/xiangqing/6880.html", "全文（含官方发布说明）", "2014-11-06", "刑事裁判涉财产部分的立案、执行期限、参与分配和救济。", "criminal-property-execution-rules-2014.txt"), extract_html("https://www.court.gov.cn/fabu/xiangqing/6880.html", "//*[contains(@class,'txt_txt')]"), ["第五条", "第十条", "第十六条"], 2200)

    add(Document("holiday-2026", "国务院办公厅关于2026年部分节假日安排的通知", "国务院文件", "国务院办公厅", "https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm", "全文", "2026年", "2026年法定节假日和调休上班日。", "holiday-2026.txt"), extract_html("https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm", "//*[@id='UCAP-CONTENT']"), ["2026年部分节假日安排", "10月1日"], 400)

    legal_metadata = {
        "criminal-procedure-law": ("law", ["general", "filing", "investigation", "coercive", "prosecution", "trial", "execution", "period"], "https://flk.npc.gov.cn/detail?fileId=&id=ff8080816f135f46016f1d1b81b01351&title=%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E5%88%91%E4%BA%8B%E8%AF%89%E8%AE%BC%E6%B3%95&type="),
        "criminal-law-related": ("law", ["injury", "trial"], "https://flk.npc.gov.cn/detail?fileId=&id=ff808181796a636a0179822a19640c92&title=%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E5%88%91%E6%B3%95&type="),
        "injury-case-rules": ("public-security", ["filing", "investigation", "injury"], ""),
        "injury-standard": ("joint", ["investigation", "injury"], ""),
        "criminal-case-rules": ("public-security", ["general", "filing", "investigation", "coercive", "period"], ""),
        "reporting-filing-rules-2023": ("public-security", ["filing"], ""),
        "filing-opinion-2015": ("public-security", ["filing", "period"], ""),
        "procuratorate-rules": ("judicial", ["general", "filing", "coercive", "prosecution", "trial", "execution"], ""),
        "minor-injury-guidance": ("joint", ["filing", "investigation", "prosecution", "trial", "injury"], ""),
        "spc-cpl-interpretation": ("judicial", ["general", "trial", "execution", "period"], ""),
        "bail-rules-2022": ("joint", ["coercive"], ""),
        "custody-necessity-rules-2023": ("joint", ["coercive"], ""),
        "sentencing-procedure-opinion-2020": ("joint", ["prosecution", "trial"], ""),
        "criminal-property-execution-rules-2014": ("judicial", ["execution"], ""),
        "holiday-2026": ("auxiliary", ["period"], ""),
    }
    for doc, _, _, _ in documents:
        doc.source_group, doc.topics, doc.database_url = legal_metadata[doc.id]

    expected_files = {doc.filename for doc, _, _, _ in documents}
    for stale in OUTPUT.glob("*.txt"):
        if stale.name not in expected_files:
            stale.unlink()

    manifest: list[dict[str, object]] = []
    for doc, content, _, _ in documents:
        path = OUTPUT / doc.filename
        path.write_text(content, "utf-8")
        doc.chars = len(content)
        doc.sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
        doc.checked_at = date.today().isoformat()
        manifest.append(asdict(doc))
        print(f"✓ {doc.title}: {doc.chars:,} 字符")

    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        "utf-8",
    )
    print(f"\n已生成 {len(manifest)} 份内置法律文本：{OUTPUT}")


if __name__ == "__main__":
    main()
