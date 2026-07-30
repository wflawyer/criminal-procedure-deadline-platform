(() => {
    "use strict";

    const VERSION = "2.10.0";
    const DRAFT_KEY = "civil_complaint_element_form_v2";
    const DEFAULT_FORM_VALUES = {
        other_costs: "无",
        mediation_awareness: "了解",
        mediation_choice: "no",
        mediation_benefit_1: "了解",
        mediation_benefit_2: "了解",
        mediation_benefit_3: "了解",
        mediation_benefit_4: "了解",
        mediation_benefit_5: "了解"
    };

    const ORGANIZATION_TYPES = [
        "",
        "有限责任公司",
        "其他企业法人",
        "社会服务机构",
        "股份有限公司",
        "上市公司",
        "事业单位",
        "社会团体",
        "基金会",
        "机关法人",
        "农村集体经济组织法人",
        "城镇农村的合作经济组织法人",
        "基层群众性自治组织法人",
        "个人独资企业",
        "合伙企业",
        "不具有法人资格的专业服务机构"
    ];

    const OWNERSHIP_TYPES = [
        "",
        "国有（控股）",
        "国有（参股）",
        "民营",
        "其他"
    ];

    const FORM_IDS = [
        "dispute_type", "court_name", "filing_date",
        "plaintiff_kind", "plaintiff_name", "plaintiff_gender", "plaintiff_birth",
        "plaintiff_ethnicity", "plaintiff_work_unit", "plaintiff_position",
        "plaintiff_phone", "plaintiff_id_type", "plaintiff_address",
        "plaintiff_residence", "plaintiff_id", "plaintiff_org_name",
        "plaintiff_org_address", "plaintiff_org_registered",
        "plaintiff_org_representative", "plaintiff_org_position",
        "plaintiff_org_phone", "plaintiff_org_credit_code",
        "plaintiff_org_type", "plaintiff_org_ownership",
        "has_attorney", "attorney_name", "attorney_unit", "attorney_position",
        "attorney_phone", "attorney_authority",
        "defendant_kind", "defendant_name", "defendant_gender", "defendant_birth",
        "defendant_ethnicity", "defendant_work_unit", "defendant_position",
        "defendant_phone", "defendant_id_type", "defendant_address",
        "defendant_residence", "defendant_id", "defendant_org_name",
        "defendant_org_address", "defendant_org_registered",
        "defendant_org_representative", "defendant_org_position",
        "defendant_org_phone", "defendant_org_credit_code",
        "defendant_org_type", "defendant_org_ownership",
        "has_third_party", "third_party_kind", "third_party_name",
        "third_party_gender", "third_party_birth", "third_party_ethnicity",
        "third_party_work_unit", "third_party_position", "third_party_phone",
        "third_party_id_type", "third_party_address", "third_party_residence",
        "third_party_id", "third_party_org_name", "third_party_org_address",
        "third_party_org_registered", "third_party_org_representative",
        "third_party_org_position", "third_party_org_phone",
        "third_party_org_credit_code", "third_party_org_type",
        "third_party_org_ownership", "claims", "other_costs", "subject_amount",
        "facts", "preservation_status", "preservation_court",
        "preservation_date", "preservation_case_no", "appraisal_status",
        "appraisal_matter", "mediation_awareness", "mediation_choice",
        "mediation_benefit_1", "mediation_benefit_2", "mediation_benefit_3",
        "mediation_benefit_4", "mediation_benefit_5"
    ];

    const REQUIRED_SUMMARY_IDS = [
        "dispute_type", "plaintiff_name", "plaintiff_org_name",
        "defendant_name", "defendant_org_name", "claims", "facts"
    ];

    const $ = (id) => document.getElementById(id);

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        populateSelectOptions();
        applyDefaultFormValues();
        bindEvents();
        syncConditionalFields();
        renderPreview();
        updateCompletion();
        checkDependencies();
        window.__ysqs = {
            version: VERSION,
            parseText: parseComplaintText,
            getData: collectFormData,
            renderPreview
        };
    }

    function populateSelectOptions() {
        ["plaintiff", "defendant", "third_party"].forEach((prefix) => {
            populateSelect(`${prefix}_org_type`, ORGANIZATION_TYPES, "未选择");
            populateSelect(`${prefix}_org_ownership`, OWNERSHIP_TYPES, "未选择");
        });
    }

    function populateSelect(id, values, emptyLabel) {
        const select = $(id);
        if (!select) return;
        select.innerHTML = "";
        values.forEach((value, index) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = index === 0 ? emptyLabel : value;
            select.appendChild(option);
        });
    }

    function applyDefaultFormValues() {
        Object.entries(DEFAULT_FORM_VALUES).forEach(([id, value]) => {
            const control = $(id);
            if (control && !control.value) control.value = value;
        });
    }

    function bindEvents() {
        $("parseButton").addEventListener("click", parseFromTextarea);
        $("clearButton").addEventListener("click", clearAll);
        $("saveDraftButton").addEventListener("click", saveDraft);
        $("loadDraftButton").addEventListener("click", loadDraft);
        $("sourceFile").addEventListener("change", importFile);
        $("downloadButton").addEventListener("click", downloadDocx);
        $("printButton").addEventListener("click", () => window.print());
        $("copyButton").addEventListener("click", copyComplaintText);

        document.querySelectorAll("input, textarea, select").forEach((control) => {
            if (control.id === "sourceText" || control.id === "sourceFile") return;
            control.addEventListener("input", handleFormChange);
            control.addEventListener("change", handleFormChange);
        });
    }

    function handleFormChange(event) {
        if (
            event.target.id.endsWith("_kind") ||
            event.target.id === "has_attorney" ||
            event.target.id === "has_third_party"
        ) {
            syncConditionalFields();
        }
        renderPreview();
        updateCompletion();
    }

    function checkDependencies() {
        const missing = [];
        if (!window.JSZip) missing.push("DOCX 导入组件");
        if (!window.docx) missing.push("DOCX 导出组件");
        if (missing.length) {
            showStatus(`本地依赖未加载：${missing.join("、")}。请确认 vendor 文件夹与本页面位于同一目录。`, "error");
        }
    }

    function syncConditionalFields() {
        ["plaintiff", "defendant", "third_party"].forEach((prefix) => {
            const select = $(`${prefix}_kind`);
            if (!select) return;
            document.querySelectorAll(`[data-party="${prefix}"][data-kind]`).forEach((panel) => {
                panel.hidden = panel.dataset.kind !== select.value;
            });
        });

        $("attorneyFields").hidden = !$("has_attorney").checked;
        $("thirdPartyFields").hidden = !$("has_third_party").checked;
    }

    async function importFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        showStatus(`正在读取 ${file.name}……`, "info");
        try {
            const lowerName = file.name.toLowerCase();
            let text = "";
            if (lowerName.endsWith(".txt")) {
                text = await file.text();
            } else if (lowerName.endsWith(".docx")) {
                text = await extractTextFromDocx(file);
            } else {
                throw new Error("仅支持 TXT 和 DOCX 文件");
            }
            $("sourceText").value = text.trim();
            showStatus(`已从 ${file.name} 提取 ${text.trim().length} 个字符，请点击“识别并填入”。`, "success");
        } catch (error) {
            showStatus(`文件读取失败：${error.message}`, "error");
        } finally {
            event.target.value = "";
        }
    }

    async function extractTextFromDocx(file) {
        if (!window.JSZip) throw new Error("DOCX 导入组件未加载");
        const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
        const documentEntry = zip.file("word/document.xml");
        if (!documentEntry) throw new Error("文件中未找到 Word 正文");
        const xml = await documentEntry.async("string");
        const parsed = new DOMParser().parseFromString(xml, "application/xml");
        if (parsed.querySelector("parsererror")) throw new Error("Word 正文结构无法解析");

        const paragraphs = Array.from(parsed.getElementsByTagNameNS(
            "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            "p"
        ));
        return paragraphs
            .map((paragraph) => {
                const textNodes = Array.from(paragraph.getElementsByTagNameNS(
                    "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    "t"
                ));
                return textNodes.map((node) => node.textContent || "").join("");
            })
            .filter((line) => line.trim())
            .join("\n");
    }

    function parseFromTextarea() {
        const source = normalizeText($("sourceText").value);
        if (source.length < 30) {
            showStatus("请先粘贴或导入较完整的待转换正文。", "warning");
            return;
        }
        if (!/(?:^|\n)\s*原告\s*[：:]/m.test(source) || !/(?:^|\n)\s*被告\s*[：:]/m.test(source)) {
            showStatus("未找到以“原告：”“被告：”开头的当事人段落，请核对原文或手动填写。", "warning");
        }

        const parsed = parseComplaintText(source);
        resetFormFields({ preserveSource: true });
        applyParsedData(parsed);
        syncConditionalFields();
        renderPreview();
        updateCompletion();
        renderParseSummary(parsed);
        showStatus(`识别完成：已填入 ${parsed.recognized.length} 类信息。请逐项核对后再下载。`, "success");
    }

    function parseComplaintText(input) {
        const text = normalizeText(input);
        const plaintiffBlock = extractSection(text, "原告", ["被告", "第三人", "委托诉讼代理人", "诉讼请求", "事实与理由", "事实和理由"]);
        const defendantBlock = extractSection(text, "被告", ["第三人", "委托诉讼代理人", "诉讼请求", "事实与理由", "事实和理由"]);
        const thirdPartyBlock = extractSection(text, "第三人", ["委托诉讼代理人", "诉讼请求", "事实与理由", "事实和理由"]);
        const attorneyBlock = extractSection(text, "委托诉讼代理人", ["诉讼请求", "事实与理由", "事实和理由"]);
        const claims = extractHeadingBody(text, ["诉讼请求"], ["事实与理由", "事实和理由"]);
        const facts = extractHeadingBody(text, ["事实与理由", "事实和理由"], ["此致", "具状人"]);

        const parsed = {
            disputeType: inferDisputeType(text),
            courtName: extractCourt(text),
            filingDate: extractFilingDate(text),
            plaintiff: parsePartyBlock(plaintiffBlock),
            defendant: parsePartyBlock(defendantBlock),
            thirdParty: parsePartyBlock(thirdPartyBlock),
            attorney: parseAttorneyBlock(attorneyBlock),
            claims: cleanSectionText(claims),
            facts: cleanSectionText(facts),
            otherCosts: extractOtherCosts(claims),
            subjectAmount: extractSubjectAmount(claims),
            recognized: []
        };

        if (parsed.disputeType) parsed.recognized.push("纠纷类型");
        if (partyHasData(parsed.plaintiff)) parsed.recognized.push("原告");
        if (partyHasData(parsed.defendant)) parsed.recognized.push("被告");
        if (partyHasData(parsed.thirdParty)) parsed.recognized.push("第三人");
        if (parsed.attorney && parsed.attorney.name) parsed.recognized.push("委托诉讼代理人");
        if (parsed.claims) parsed.recognized.push("诉讼请求");
        if (parsed.facts) parsed.recognized.push("事实与理由");
        if (parsed.courtName) parsed.recognized.push("受诉法院");
        if (parsed.filingDate) parsed.recognized.push("具状日期");
        if (parsed.subjectAmount) parsed.recognized.push("标的总额");
        return parsed;
    }

    function normalizeText(text) {
        return String(text || "")
            .replace(/\r\n?/g, "\n")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function extractSection(text, label, endLabels) {
        const start = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(label)}(?:（[^）\\n]+）|\\([^\\)\\n]+\\))?\\s*[：:]?\\s*`, "m");
        const match = start.exec(text);
        if (!match) return "";
        const rest = text.slice(match.index + match[0].length);
        let end = rest.length;
        endLabels.forEach((endLabel) => {
            const pattern = new RegExp(`\\n\\s*${escapeRegExp(endLabel)}(?:（[^）\\n]+）|\\([^\\)\\n]+\\))?\\s*[：:]?`, "m");
            const found = pattern.exec(rest);
            if (found && found.index < end) end = found.index;
        });
        return rest.slice(0, end).trim();
    }

    function extractHeadingBody(text, startLabels, endLabels) {
        let startMatch = null;
        for (const label of startLabels) {
            const pattern = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(label)}\\s*[：:]?\\s*`, "m");
            const found = pattern.exec(text);
            if (found && (!startMatch || found.index < startMatch.index)) startMatch = found;
        }
        if (!startMatch) return "";
        const rest = text.slice(startMatch.index + startMatch[0].length);
        let end = rest.length;
        endLabels.forEach((label) => {
            const pattern = new RegExp(`\\n\\s*${escapeRegExp(label)}\\s*[：:]?`, "m");
            const found = pattern.exec(rest);
            if (found && found.index < end) end = found.index;
        });
        return rest.slice(0, end).trim();
    }

    function cleanSectionText(text) {
        return normalizeText(text)
            .replace(/^\s*[：:]\s*/, "")
            .replace(/\n\s*此致[\s\S]*$/m, "")
            .trim();
    }

    function parsePartyBlock(block) {
        if (!block) return { kind: "natural" };
        return looksLikeOrganization(block) ? parseOrganizationBlock(block) : parseNaturalBlock(block);
    }

    function looksLikeOrganization(text) {
        return /(公司|委员会|事务所|中心|学校|医院|基金会|协会|企业|合作社|机关|事业单位|社会团体|组织|合伙)/.test(text);
    }

    function parseNaturalBlock(block) {
        const firstPart = (block.split(/[，,\n。]/)[0] || "").trim();
        const birthMatch = block.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        const ethnicityMatch =
            block.match(/[，,]\s*([^，,。\s]{1,5}族)(?=[，,。\s])/)
            || block.match(/民族\s*[：:]?\s*([^，,。\s]{1,5}族?)/);
        const genderMatch =
            block.match(/性别\s*[：:]?\s*([男女])/)
            || block.match(/[，,\s]([男女])(?=[，,\s。])/);
        const idMatch = block.match(/(?:公民身份号码|身份证(?:号码|号)?|证件号码)\s*[：:]?\s*([0-9Xx]{15,18})/);
        const phoneMatch =
            block.match(/(?:联系电话|电话|手机)\s*[：:]?\s*([0-9\- ]{7,20})/)
            || block.match(/(?<![0-9])1[3-9]\d{9}(?![0-9])/);

        return {
            kind: "natural",
            name: stripPartyPrefix(firstPart),
            gender: genderMatch ? genderMatch[1] : "",
            birth: birthMatch ? `${birthMatch[1]}年${Number(birthMatch[2])}月${Number(birthMatch[3])}日` : "",
            ethnicity: ethnicityMatch ? normalizeEthnicity(ethnicityMatch[1]) : "",
            workUnit: extractLabeledValue(block, ["工作单位", "单位"], ["职务", "联系电话", "电话", "住址", "住所地"]),
            position: extractLabeledValue(block, ["职务", "职位"], ["联系电话", "电话", "住址", "住所地"]),
            phone: phoneMatch ? (phoneMatch[1] || phoneMatch[0]).replace(/\s+/g, "") : "",
            idType: idMatch ? "居民身份证" : "",
            address: extractAddress(block),
            residence: extractLabeledValue(block, ["经常居住地"], ["证件类型", "证件号码", "公民身份号码"]),
            id: idMatch ? idMatch[1].toUpperCase() : ""
        };
    }

    function parseOrganizationBlock(block) {
        const firstPart = (block.split(/[，,\n。]/)[0] || "").trim();
        const creditMatch = block.match(/(?:统一社会信用代码|社会信用代码)\s*[：:]?\s*([0-9A-Z]{18})/i);
        return {
            kind: "organization",
            name: stripPartyPrefix(firstPart),
            address: extractLabeledValue(block, ["住所地", "主要办事机构所在地", "地址"], ["注册地", "登记地", "法定代表人", "负责人"]),
            registered: extractLabeledValue(block, ["注册地", "登记地"], ["法定代表人", "负责人", "职务", "联系电话"]),
            representative: extractLabeledValue(block, ["法定代表人", "负责人"], ["职务", "联系电话", "电话"]),
            position: extractLabeledValue(block, ["职务"], ["联系电话", "电话", "统一社会信用代码"]),
            phone: extractPhone(block),
            creditCode: creditMatch ? creditMatch[1].toUpperCase() : "",
            organizationType: inferOrganizationType(block),
            ownership: inferOwnership(block)
        };
    }

    function parseAttorneyBlock(block) {
        if (!block) return null;
        const natural = parseNaturalBlock(block);
        return {
            name: natural.name,
            unit: extractLabeledValue(block, ["单位", "律师事务所"], ["职务", "联系电话", "电话", "代理权限"]),
            position: extractLabeledValue(block, ["职务"], ["联系电话", "电话", "代理权限"]),
            phone: extractPhone(block),
            authority: /特别授权/.test(block) ? "特别授权" : (/一般授权/.test(block) ? "一般授权" : "")
        };
    }

    function stripPartyPrefix(text) {
        return String(text || "")
            .replace(/^(?:原告|被告|第三人|委托诉讼代理人)\s*[：:]?\s*/, "")
            .replace(/^(?:姓名|名称)\s*[：:]?\s*/, "")
            .trim();
    }

    function normalizeEthnicity(value) {
        const trimmed = String(value || "").trim();
        if (!trimmed) return "";
        return trimmed.endsWith("族") ? trimmed : `${trimmed}族`;
    }

    function extractAddress(block) {
        const patterns = [
            /(?:住所地\s*[\(（]户籍所在地[\)）]|住所地|住址|住)\s*[：:]?\s*([\s\S]*?)(?=[，,]\s*(?:公民身份号码|身份证|联系电话|电话|手机)|[。\n]|$)/,
            /户籍所在地\s*[：:]?\s*([\s\S]*?)(?=[，,]\s*(?:公民身份号码|身份证|联系电话|电话|手机)|[。\n]|$)/
        ];
        for (const pattern of patterns) {
            const match = block.match(pattern);
            if (match && match[1]) return match[1].trim().replace(/[，,]$/, "");
        }
        return "";
    }

    function extractLabeledValue(text, labels, stopLabels) {
        for (const label of labels) {
            const stop = stopLabels.map(escapeRegExp).join("|");
            const pattern = new RegExp(`${escapeRegExp(label)}\\s*[：:]?\\s*([\\s\\S]*?)(?=[，,。\\n]|${stop ? `(?:${stop})\\s*[：:]?` : "$"}|$)`);
            const match = text.match(pattern);
            if (match && match[1] && match[1].trim()) return match[1].trim();
        }
        return "";
    }

    function extractPhone(text) {
        const match =
            text.match(/(?:联系电话|电话|手机)\s*[：:]?\s*([0-9\- ]{7,20})/)
            || text.match(/(?<![0-9])1[3-9]\d{9}(?![0-9])/);
        return match ? (match[1] || match[0]).replace(/\s+/g, "") : "";
    }

    function inferOrganizationType(text) {
        return ORGANIZATION_TYPES.find((type) => type && text.includes(type))
            || (/有限责任公司/.test(text) ? "有限责任公司" : "")
            || (/股份有限公司/.test(text) ? "股份有限公司" : "")
            || (/合伙/.test(text) ? "合伙企业" : "");
    }

    function inferOwnership(text) {
        if (/国有[\s\S]{0,8}控股/.test(text)) return "国有（控股）";
        if (/国有[\s\S]{0,8}参股/.test(text)) return "国有（参股）";
        if (/民营/.test(text)) return "民营";
        return "";
    }

    function inferDisputeType(text) {
        const titleMatch = text.match(/民事起诉状\s*(?:\n\s*)?[（(]\s*([^）)\n]+?)\s*[）)]/);
        if (titleMatch && titleMatch[1]) return normalizeDisputeName(titleMatch[1]);
        const causeMatch = text.match(/案由\s*[：:]\s*([^\n。]+)/);
        if (causeMatch && causeMatch[1]) return normalizeDisputeName(causeMatch[1]);

        const rules = [
            [/民间借贷|借款合同|偿还借款/, "民间借贷纠纷"],
            [/离婚协议[\s\S]{0,40}(?:财产|房屋|产权)|离婚后财产/, "离婚后财产纠纷"],
            [/离婚|解除婚姻关系/, "离婚纠纷"],
            [/机动车交通事故|交通事故责任/, "机动车交通事故责任纠纷"],
            [/买卖合同|货款/, "买卖合同纠纷"],
            [/劳动合同|工资|劳动报酬/, "劳动争议"],
            [/房屋租赁|租金/, "房屋租赁合同纠纷"],
            [/建设工程|工程款/, "建设工程合同纠纷"],
            [/侵害.*(?:生命|健康|身体)|人身损害/, "生命权、身体权、健康权纠纷"]
        ];
        const found = rules.find(([pattern]) => pattern.test(text));
        return found ? found[1] : "";
    }

    function normalizeDisputeName(value) {
        return String(value || "")
            .replace(/^\s*（?/, "")
            .replace(/）?\s*$/, "")
            .trim();
    }

    function extractCourt(text) {
        const match = text.match(/此致\s*(?:\n\s*)?([^\n。]{2,50}人民法院)/);
        return match ? match[1].trim() : "";
    }

    function extractFilingDate(text) {
        const matches = Array.from(text.matchAll(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g));
        if (!matches.length) return "";
        const last = matches[matches.length - 1];
        return `${last[1]}年${Number(last[2])}月${Number(last[3])}日`;
    }

    function extractOtherCosts(claims) {
        const costLines = normalizeText(claims)
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => /(诉讼费|诉讼费用|案件受理费|鉴定费|保全费)/.test(line))
            .filter((line) => !/(?:由|归).{0,16}(?:原告|被告|双方|各方).{0,8}(?:承担|负担)|(?:原告|被告|双方|各方).{0,8}(?:承担|负担)|(?:承担|负担).{0,12}(?:诉讼费|诉讼费用|案件受理费|鉴定费|保全费)/.test(line))
            .filter((line) => /(?:人民币|￥|¥)?\s*[\d,]+(?:\.\d+)?\s*(?:万)?元/.test(line));
        return costLines.join("\n") || "无";
    }

    function extractSubjectAmount(claims) {
        const normalized = normalizeText(claims);
        let totalCents = 0;
        const moneyPattern = /(?:人民币|￥|¥)?\s*([\d,]+(?:\.\d+)?)\s*(万)?元/g;

        normalized
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .filter((line) => !/(?:诉讼费|诉讼费用|案件受理费).{0,20}(?:承担|负担)|(?:承担|负担).{0,20}(?:诉讼费|诉讼费用|案件受理费)/.test(line))
            .forEach((line) => {
                for (const match of line.matchAll(moneyPattern)) {
                    const before = line.slice(Math.max(0, match.index - 18), match.index);
                    const after = line.slice(match.index + match[0].length, match.index + match[0].length + 10);
                    if (/(?:标的总额|合计|共计|总计)\s*[：:]?\s*(?:人民币)?\s*$/.test(before)) continue;
                    if (/(?:以|按|按照).{0,15}(?:本金|款项|金额)?\s*$/.test(before) && /(?:为|作为)?基数/.test(after)) continue;
                    if (/^(?:为|作为)?基数/.test(after)) continue;
                    const amount = Number(match[1].replace(/,/g, "")) * (match[2] ? 10000 : 1);
                    if (Number.isFinite(amount) && amount > 0) totalCents += Math.round(amount * 100);
                }
            });

        if (totalCents > 0) return formatAmountFromCents(totalCents);
        const explicit = normalized.match(/(?:标的总额|合计)\s*[：:]?\s*(?:人民币)?\s*([\d,]+(?:\.\d+)?)\s*(万)?元/);
        if (!explicit) return "";
        const explicitAmount = Number(explicit[1].replace(/,/g, "")) * (explicit[2] ? 10000 : 1);
        return Number.isFinite(explicitAmount) ? formatAmountFromCents(Math.round(explicitAmount * 100)) : "";
    }

    function formatAmountFromCents(cents) {
        const whole = Math.trunc(cents / 100);
        const fraction = cents % 100;
        return `${whole}${fraction ? `.${String(fraction).padStart(2, "0").replace(/0$/, "")}` : ""}元`;
    }

    function partyHasData(party) {
        return !!(party && (party.name || party.address || party.id || party.creditCode));
    }

    function applyParsedData(parsed) {
        setIfValue("dispute_type", parsed.disputeType);
        setIfValue("court_name", parsed.courtName);
        setIfValue("filing_date", parsed.filingDate);
        applyParty("plaintiff", parsed.plaintiff);
        applyParty("defendant", parsed.defendant);

        if (partyHasData(parsed.thirdParty)) {
            $("has_third_party").checked = true;
            applyParty("third_party", parsed.thirdParty);
        }
        if (parsed.attorney && parsed.attorney.name) {
            $("has_attorney").checked = true;
            setIfValue("attorney_name", parsed.attorney.name);
            setIfValue("attorney_unit", parsed.attorney.unit);
            setIfValue("attorney_position", parsed.attorney.position);
            setIfValue("attorney_phone", parsed.attorney.phone);
            setIfValue("attorney_authority", parsed.attorney.authority);
        }
        setIfValue("claims", parsed.claims);
        setIfValue("facts", parsed.facts);
        setIfValue("other_costs", parsed.otherCosts);
        setIfValue("subject_amount", parsed.subjectAmount);
    }

    function applyParty(prefix, party) {
        if (!party || !partyHasData(party)) return;
        $(`${prefix}_kind`).value = party.kind || "natural";
        if (party.kind === "organization") {
            setIfValue(`${prefix}_org_name`, party.name);
            setIfValue(`${prefix}_org_address`, party.address);
            setIfValue(`${prefix}_org_registered`, party.registered);
            setIfValue(`${prefix}_org_representative`, party.representative);
            setIfValue(`${prefix}_org_position`, party.position);
            setIfValue(`${prefix}_org_phone`, party.phone);
            setIfValue(`${prefix}_org_credit_code`, party.creditCode);
            setIfValue(`${prefix}_org_type`, party.organizationType);
            setIfValue(`${prefix}_org_ownership`, party.ownership);
        } else {
            setIfValue(`${prefix}_name`, party.name);
            setIfValue(`${prefix}_gender`, party.gender);
            setIfValue(`${prefix}_birth`, party.birth);
            setIfValue(`${prefix}_ethnicity`, party.ethnicity);
            setIfValue(`${prefix}_work_unit`, party.workUnit);
            setIfValue(`${prefix}_position`, party.position);
            setIfValue(`${prefix}_phone`, party.phone);
            setIfValue(`${prefix}_id_type`, party.idType);
            setIfValue(`${prefix}_address`, party.address);
            setIfValue(`${prefix}_residence`, party.residence);
            setIfValue(`${prefix}_id`, party.id);
        }
    }

    function setIfValue(id, value) {
        const element = $(id);
        if (element && value !== undefined && value !== null && String(value).trim()) {
            element.value = String(value).trim();
        }
    }

    function renderParseSummary(parsed) {
        const panel = $("parseSummary");
        const missing = [];
        if (!partyHasData(parsed.plaintiff)) missing.push("原告");
        if (!partyHasData(parsed.defendant)) missing.push("被告");
        if (!parsed.claims) missing.push("诉讼请求");
        if (!parsed.facts) missing.push("事实与理由");
        panel.hidden = false;
        panel.innerHTML = `
            <strong>识别结果：</strong>${escapeHtml(parsed.recognized.join("、") || "未自动识别出结构化内容")}
            ${missing.length ? `<br><strong>需要手动补充：</strong>${escapeHtml(missing.join("、"))}` : ""}
            <br>自动识别仅用于搬运原文，不生成案件事实或法律依据。
        `;
    }

    function collectFormData() {
        const data = {};
        FORM_IDS.forEach((id) => {
            const control = $(id);
            if (!control) return;
            data[id] = control.type === "checkbox" ? control.checked : control.value.trim();
        });
        return data;
    }

    function resetFormFields({ preserveSource = false } = {}) {
        FORM_IDS.forEach((id) => {
            const control = $(id);
            if (!control) return;
            if (control.type === "checkbox") control.checked = false;
            else if (id.endsWith("_kind")) control.value = "natural";
            else control.value = DEFAULT_FORM_VALUES[id] || "";
        });
        if (!preserveSource) $("sourceText").value = "";
        $("parseSummary").hidden = true;
        $("parseSummary").innerHTML = "";
    }

    function clearAll() {
        resetFormFields({ preserveSource: false });
        syncConditionalFields();
        renderPreview();
        updateCompletion();
        showStatus("已清空当前内容。旧版文件和已保存草稿未被删除。", "info");
    }

    function saveDraft() {
        try {
            const payload = {
                version: VERSION,
                sourceText: $("sourceText").value,
                form: collectFormData(),
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
            showStatus("草稿已保存在本机浏览器中。", "success");
        } catch (error) {
            showStatus(`草稿保存失败：${error.message}`, "error");
        }
    }

    function loadDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) {
                showStatus("本机没有已保存的草稿。", "warning");
                return;
            }
            const payload = JSON.parse(raw);
            resetFormFields({ preserveSource: false });
            $("sourceText").value = payload.sourceText || "";
            Object.entries(payload.form || {}).forEach(([id, value]) => {
                const control = $(id);
                if (!control) return;
                if (control.type === "checkbox") control.checked = !!value;
                else control.value = value || DEFAULT_FORM_VALUES[id] || "";
            });
            syncConditionalFields();
            renderPreview();
            updateCompletion();
            showStatus("已恢复本地草稿。", "success");
        } catch (error) {
            showStatus(`草稿恢复失败：${error.message}`, "error");
        }
    }

    function updateCompletion() {
        const data = collectFormData();
        const filled = Object.entries(data).filter(([id, value]) => {
            if (id.endsWith("_kind")) return false;
            return typeof value === "boolean" ? value : !!value;
        }).length;
        $("completionBadge").textContent = `${filled} 项已填写`;

        const hasPlaintiff = data.plaintiff_kind === "organization"
            ? !!data.plaintiff_org_name
            : !!data.plaintiff_name;
        const hasDefendant = data.defendant_kind === "organization"
            ? !!data.defendant_org_name
            : !!data.defendant_name;
        const ready = hasPlaintiff && hasDefendant && data.claims && data.facts;
        $("downloadButton").dataset.ready = ready ? "true" : "false";
        void REQUIRED_SUMMARY_IDS;
    }

    function renderPreview() {
        const data = collectFormData();
        $("documentPreview").innerHTML = [
            renderPageOne(data),
            renderPageTwo(data),
            renderPageThree(data),
            renderPageFour(data)
        ].join("");
    }

    function renderPageOne(data) {
        return `
            <article class="document-page page-1" aria-label="民事起诉状第1页">
                <h1 class="document-title">民事起诉状</h1>
                <p class="document-subtitle">${escapeHtml(formatDisputeTitle(data.dispute_type))}</p>
                <table class="pdf-table">
                    <colgroup>
                        <col class="label-column">
                        <col class="content-column">
                    </colgroup>
                    <tr class="r-instructions">
                        <td colspan="2" class="instructions">
                            <p><strong>说明：</strong></p>
                            <p class="indent">为了方便您更好地参加诉讼，保护您的合法权利，请填写本表。</p>
                            <p class="indent">1. 起诉时需向人民法院提交证明您身份的材料，如身份证复印件、营业执照复印件等。</p>
                            <p class="indent">2. 本表所列内容是您提起诉讼以及人民法院查明案件事实所需，请务必如实填写。</p>
                            <p class="indent">3. 本表有些内容可能与您的案件无关，您认为与案件无关的项目可以填“无”或不填；对于本表中勾选项可以在对应项打“√”；您认为另有重要内容需要列明的，可以另附页填写。</p>
                            <p class="indent">4. 本表 Word 电子版填写时，相关栏目可复制粘贴或扩容，但不得改变要素内容、格式设置。例如，多原告、多被告或多委托诉讼代理人等情况，可根据实际情况复制粘贴；需填写文字较多时，可根据实际对栏目进行扩容等。</p>
                            <p class="indent notice">★特别提示★</p>
                            <p class="indent">诉讼参加人应遵守诚信原则如实认真填写表格。</p>
                            <p class="indent">如果诉讼参加人违反有关规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。</p>
                        </td>
                    </tr>
                    <tr class="r-party-heading"><td colspan="2" class="section-title">当事人信息</td></tr>
                    <tr class="r-natural">
                        <td class="label-cell">原告<br>（自然人）</td>
                        <td class="content-cell">${naturalPartyHtml(data, "plaintiff", data.plaintiff_kind === "natural")}</td>
                    </tr>
                    <tr class="r-organization">
                        <td class="label-cell">原告<br>（法人、非法人组织）</td>
                        <td class="content-cell">${organizationPartyHtml(data, "plaintiff", data.plaintiff_kind === "organization", true)}</td>
                    </tr>
                </table>
            </article>
        `;
    }

    function renderPageTwo(data) {
        return `
            <article class="document-page page-2" aria-label="民事起诉状第2页">
                <table class="pdf-table">
                    <colgroup>
                        <col class="label-column">
                        <col class="content-column">
                    </colgroup>
                    <tr class="r-attorney">
                        <td class="label-cell">委托诉讼代理人</td>
                        <td class="content-cell">${attorneyHtml(data)}</td>
                    </tr>
                    <tr class="r-defendant-natural">
                        <td class="label-cell">被告<br>（自然人）</td>
                        <td class="content-cell">${naturalPartyHtml(data, "defendant", data.defendant_kind === "natural")}</td>
                    </tr>
                    <tr class="r-defendant-org">
                        <td class="label-cell">被告<br>（法人、非法人组织）</td>
                        <td class="content-cell">${organizationPartyHtml(data, "defendant", data.defendant_kind === "organization", true)}</td>
                    </tr>
                </table>
            </article>
        `;
    }

    function renderPageThree(data) {
        const hasThird = !!data.has_third_party;
        return `
            <article class="document-page page-3" aria-label="民事起诉状第3页">
                <table class="pdf-table">
                    <colgroup>
                        <col class="label-column">
                        <col class="content-column">
                    </colgroup>
                    <tr class="r-third-natural">
                        <td class="label-cell">第三人（自然人）</td>
                        <td class="content-cell">${naturalPartyHtml(data, "third_party", hasThird && data.third_party_kind === "natural")}</td>
                    </tr>
                    <tr class="r-third-org">
                        <td class="label-cell">第三人<br>（法人、非法人组织）</td>
                        <td class="content-cell">${organizationPartyHtml(data, "third_party", hasThird && data.third_party_kind === "organization", true)}</td>
                    </tr>
                    <tr class="r-claims-heading">
                        <td colspan="2" class="claim-heading">
                            <strong>诉讼请求</strong>
                            （主张人身损害赔偿，填写第1项至第10项；主张赔偿财产损失，填写第11项；<br>
                            第12项至第13项为共同项）
                        </td>
                    </tr>
                    <tr class="r-claims-text">
                        <td colspan="2">
                            <div class="free-text">${valueWithBreaks(data.claims)}</div>
                        </td>
                    </tr>
                    <tr class="r-cost">
                        <td>1.其他费用</td>
                        <td>${displayValue(data.other_costs || "无")}</td>
                    </tr>
                    <tr class="r-cost">
                        <td>2.标的总额</td>
                        <td>${displayValue(data.subject_amount)}</td>
                    </tr>
                </table>
            </article>
        `;
    }

    function renderPageFour(data) {
        return `
            <article class="document-page page-4" aria-label="民事起诉状第4页">
                <table class="pdf-table">
                    <colgroup>
                        <col class="label-column">
                        <col class="content-column">
                    </colgroup>
                    <tr class="r-pre-heading"><td colspan="2" class="section-title">诉前保全及鉴定申请</td></tr>
                    <tr class="r-preservation">
                        <td class="label-cell">1. 是否已经诉前保全</td>
                        <td class="content-cell info-lines">
                            <div class="line">是${checkHtml(data.preservation_status === "yes")}　保全法院：${displayValue(data.preservation_court)}　　　保全时间：${displayValue(data.preservation_date)}</div>
                            <div class="line">　　　保全案号：${displayValue(data.preservation_case_no)}</div>
                            <div class="line">否${checkHtml(data.preservation_status === "no")}</div>
                            <div class="line">（如申请诉讼保全，请另行提交诉讼保全申请及相关材料）</div>
                        </td>
                    </tr>
                    <tr class="r-appraisal">
                        <td class="label-cell">2. 是否申请鉴定</td>
                        <td class="content-cell info-lines">
                            <div class="line">是${checkHtml(data.appraisal_status === "yes")}　鉴定事项：${displayValue(data.appraisal_matter)}</div>
                            <div class="line">否${checkHtml(data.appraisal_status === "no")}</div>
                        </td>
                    </tr>
                    <tr class="r-facts-heading"><td colspan="2" class="section-title">事实与理由</td></tr>
                    <tr class="r-facts">
                        <td colspan="2">
                            <p class="facts-note">（可完整表述纠纷涉及的事实与理由；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）</p>
                            <div class="free-text">${valueWithBreaks(data.facts)}</div>
                        </td>
                    </tr>
                    <tr class="r-mediation-heading"><td colspan="2" class="section-title">对纠纷解决方式的意愿</td></tr>
                    <tr class="r-mediation-awareness">
                        <td class="label-cell">是否了解调解作为非诉讼纠纷解决方式，能及时、高效、低成本、不伤和气地解决纠纷</td>
                        <td class="content-cell" style="vertical-align: middle;">了解${checkHtml(data.mediation_awareness === "了解")}　　不了解${checkHtml(data.mediation_awareness === "不了解")}</td>
                    </tr>
                    <tr class="r-mediation-benefits-a">
                        <td class="label-cell">是否了解先行调解<br>解决纠纷的好处</td>
                        <td class="content-cell mediation-copy">
                            <p>1. 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。</p>
                            ${mediationChoiceLine(data.mediation_benefit_1)}
                            <p>2. 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。</p>
                            ${mediationChoiceLine(data.mediation_benefit_2)}
                            <p>3. 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。</p>
                            ${mediationChoiceLine(data.mediation_benefit_3)}
                        </td>
                    </tr>
                    <tr class="r-mediation-benefits-b">
                        <td class="label-cell">是否了解先行调解<br>解决纠纷的好处</td>
                        <td class="content-cell mediation-copy">
                            <p>4. 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。</p>
                            ${mediationChoiceLine(data.mediation_benefit_4)}
                            <p>5. 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。</p>
                            ${mediationChoiceLine(data.mediation_benefit_5)}
                        </td>
                    </tr>
                    <tr class="r-mediation-choice">
                        <td class="label-cell">是否考虑先行调解</td>
                        <td class="content-cell" style="vertical-align: middle;">
                            是${checkHtml(data.mediation_choice === "yes")}　否${checkHtml(data.mediation_choice === "no")}<br>
                            暂不确定，想要了解更多内容${checkHtml(data.mediation_choice === "unsure")}
                        </td>
                    </tr>
                </table>
                <div class="signature-block">
                    <div>具状人（签字、盖章）：</div>
                    <div class="date-line">日期：${displayValue(data.filing_date)}</div>
                </div>
            </article>
        `;
    }

    function naturalPartyHtml(data, prefix, active) {
        const get = (suffix) => active ? data[`${prefix}_${suffix}`] || "" : "";
        const birth = splitBirth(get("birth"));
        return `
            <div class="info-lines">
                <div class="line">姓名：${displayValue(get("name"))}</div>
                <div class="line">性别：男${checkHtml(get("gender") === "男")}　　女${checkHtml(get("gender") === "女")}</div>
                <div class="line">出生日期：${displayValue(birth.year)}年　${displayValue(birth.month)}月　${displayValue(birth.day)}日　　　民族：${displayValue(get("ethnicity"))}</div>
                <div class="line">工作单位：${displayValue(get("work_unit"))}　　　　　　　　　职务：${displayValue(get("position"))}</div>
                <div class="line">联系电话：${displayValue(get("phone"))}</div>
                <div class="line">住所地（户籍所在地）：${displayValue(get("address"))}</div>
                <div class="line">经常居住地：${displayValue(get("residence"))}</div>
                <div class="line">证件类型：${displayValue(get("id_type"))}</div>
                <div class="line">证件号码：${displayValue(get("id"))}</div>
            </div>
        `;
    }

    function organizationPartyHtml(data, prefix, active, includeOwnership) {
        const get = (suffix) => active ? data[`${prefix}_org_${suffix}`] || "" : "";
        return `
            <div class="info-lines small-type">
                <div class="line">名称：${displayValue(get("name"))}</div>
                <div class="line">住所地（主要办事机构所在地）：${displayValue(get("address"))}</div>
                <div class="line">注册地／登记地：${displayValue(get("registered"))}</div>
                <div class="line">法定代表人／负责人：${displayValue(get("representative"))}</div>
                <div class="line">职务：${displayValue(get("position"))}　　　　　　　联系电话：${displayValue(get("phone"))}</div>
                <div class="line">统一社会信用代码：${displayValue(get("credit_code"))}</div>
                ${organizationTypeHtml(get("type"))}
                ${includeOwnership ? ownershipHtml(data, prefix, active) : ""}
            </div>
        `;
    }

    function organizationTypeHtml(selected) {
        const options = ORGANIZATION_TYPES
            .filter(Boolean)
            .map((value) => `<span class="org-type-option">${escapeHtml(value)}${checkHtml(selected === value)}</span>`)
            .join("");
        return `
            <div class="org-type-block">
                <div class="org-type-title">类型：</div>
                <div class="org-type-grid">${options}</div>
            </div>
        `;
    }

    function ownershipHtml(data, prefix, active) {
        const selected = active ? data[`${prefix}_org_ownership`] || "" : "";
        const other = selected === "其他" ? "__________" : "__________";
        return `
            <div class="ownership-row">所有制性质：国有${checkHtml(selected === "国有（控股）" || selected === "国有（参股）")}（控股${checkHtml(selected === "国有（控股）")}／参股${checkHtml(selected === "国有（参股）")}）　民营${checkHtml(selected === "民营")}　　其他${checkHtml(selected === "其他")}${other}</div>
        `;
    }

    function attorneyHtml(data) {
        const active = !!data.has_attorney;
        const get = (suffix) => active ? data[`attorney_${suffix}`] || "" : "";
        return `
            <div class="info-lines">
                <div class="line">有${checkHtml(active)}</div>
                <div class="line">　　姓名：${displayValue(get("name"))}</div>
                <div class="line">　　单位：${displayValue(get("unit"))}</div>
                <div class="line">　　职务：${displayValue(get("position"))}　　　　　　联系电话：${displayValue(get("phone"))}</div>
                <div class="line">　　代理权限：一般授权${checkHtml(get("authority") === "一般授权")}　　特别授权${checkHtml(get("authority") === "特别授权")}　________________</div>
                <div class="line">无${checkHtml(!active)}</div>
            </div>
        `;
    }

    function mediationChoiceLine(value) {
        return `<p class="choice-line">了解${checkHtml(value === "了解")}　　不了解${checkHtml(value === "不了解")}</p>`;
    }

    function splitBirth(value) {
        const match = String(value || "").match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        return match ? { year: match[1], month: match[2], day: match[3] } : { year: "", month: "", day: "" };
    }

    function formatDisputeTitle(value) {
        const clean = String(value || "").trim();
        if (!clean) return "（　　　　　　　　纠纷）";
        return clean.endsWith("纠纷") || clean === "劳动争议" ? `（${clean}）` : `（${clean}纠纷）`;
    }

    function checkHtml(checked) {
        return `<span class="check">${checked ? "☑" : "□"}</span>`;
    }

    function displayValue(value) {
        const text = String(value || "").trim();
        return text ? `<span class="fill-value">${escapeHtml(text)}</span>` : "";
    }

    function valueWithBreaks(value) {
        const text = String(value || "").trim();
        return text ? `<span class="fill-value">${escapeHtml(text).replace(/\n/g, "<br>")}</span>` : "";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    async function copyComplaintText() {
        const data = collectFormData();
        const text = buildPlainText(data);
        try {
            await navigator.clipboard.writeText(text);
            showStatus("已复制生成后的起诉状正文。", "success");
        } catch (error) {
            showStatus("浏览器未允许写入剪贴板，请在预览中手动复制。", "warning");
        }
    }

    function buildPlainText(data) {
        const plaintiffName = data.plaintiff_kind === "organization" ? data.plaintiff_org_name : data.plaintiff_name;
        const defendantName = data.defendant_kind === "organization" ? data.defendant_org_name : data.defendant_name;
        return [
            "民事起诉状",
            formatDisputeTitle(data.dispute_type),
            "",
            `原告：${plaintiffName || ""}`,
            `被告：${defendantName || ""}`,
            "",
            "诉讼请求：",
            data.claims || "",
            "",
            "事实与理由：",
            data.facts || "",
            "",
            data.court_name ? `此致\n${data.court_name}` : "",
            "具状人（签字、盖章）：",
            `日期：${data.filing_date || ""}`
        ].filter((line, index, array) => !(line === "" && array[index - 1] === "")).join("\n");
    }

    async function downloadDocx() {
        if (!window.docx) {
            showStatus("DOCX 导出组件未加载，请确认 vendor/docx.iife.js 存在。", "error");
            return;
        }
        const data = collectFormData();
        const plaintiffName = data.plaintiff_kind === "organization" ? data.plaintiff_org_name : data.plaintiff_name;
        const defendantName = data.defendant_kind === "organization" ? data.defendant_org_name : data.defendant_name;
        if (!plaintiffName || !defendantName) {
            showStatus("下载前至少应填写原告和被告名称。", "warning");
            return;
        }

        showStatus("正在生成可编辑 DOCX……", "info");
        try {
            const documentFile = buildWordDocument(data);
            const blob = await window.docx.Packer.toBlob(documentFile);
            const filename = sanitizeFilename(`民事起诉状（${plaintiffName}诉${defendantName}）-四页协调版.docx`);
            saveBlob(blob, filename);
            showStatus("四页协调版 DOCX 已生成。请打开新下载的文件核对，不要继续使用旧文件。", "success");
        } catch (error) {
            console.error(error);
            showStatus(`DOCX 生成失败：${error.message}`, "error");
        }
    }

    function saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function sanitizeFilename(value) {
        return value.replace(/[\\/:*?"<>|]/g, "_");
    }

    function buildWordDocument(data) {
        const {
            AlignmentType,
            BorderStyle,
            CheckBox,
            Document,
            HeightRule,
            Paragraph,
            Packer,
            SectionType,
            Table,
            TableCell,
            TableLayoutType,
            TableRow,
            Tab,
            TabStopType,
            TextRun,
            VerticalAlign,
            WidthType
        } = window.docx;
        void Packer;

        const border = { style: BorderStyle.SINGLE, size: 5, color: "000000" };
        const borders = {
            top: border, bottom: border, left: border, right: border,
            insideHorizontal: border, insideVertical: border
        };
        const pageWidth = 11906;
        const pageHeight = 16838;
        const tableWidth = 8960;
        const labelWidth = 2150;
        const contentWidth = tableWidth - labelWidth;
        const bodyFont = "Songti SC";
        const cm = (value) => Math.round(value * 567);
        let checkboxIndex = 0;

        const checkbox = (checked) => new CheckBox({
            alias: `可勾选选项 ${++checkboxIndex}`,
            checked,
            checkedState: { value: "2611", font: "MS Gothic" },
            uncheckedState: { value: "2610", font: "MS Gothic" }
        });

        const inlineChildren = (text, options = {}) => {
            const size = options.size || 21;
            const font = options.font || bodyFont;
            return String(text ?? "").split(/([□☑])/g).flatMap((part) => {
                if (part === "□" || part === "☑") return [checkbox(part === "☑")];
                if (!part) return [];
                return [new TextRun({
                    text: part,
                    size,
                    bold: !!options.bold,
                    font
                })];
            });
        };

        const paragraph = (text, options = {}) => {
            const size = options.size || 21;
            const lines = String(text ?? "").split("\n");
            const children = [];
            lines.forEach((line, index) => {
                if (index > 0) {
                    children.push(new TextRun({
                        text: "",
                        break: 1,
                        size,
                        font: options.font || bodyFont
                    }));
                }
                children.push(...inlineChildren(line, {
                    size,
                    bold: options.bold,
                    font: options.font || bodyFont
                }));
            });
            if (!children.length) children.push(new TextRun({ text: "", size, font: bodyFont }));
            return new Paragraph({
                children,
                run: {
                    size: options.checkboxSize || Math.max(size + 6, 28),
                    bold: !!options.bold
                },
                alignment: options.alignment || AlignmentType.LEFT,
                keepNext: !!options.keepNext,
                keepLines: !!options.keepLines,
                spacing: {
                    before: options.before || 0,
                    after: options.after || 0,
                    line: options.line || 300
                },
                indent: {
                    left: options.leftIndent || 0,
                    right: options.rightIndent || 0,
                    firstLine: options.firstLine || 0
                },
                tabStops: options.tabStops
            });
        };

        const organizationOptionPairs = [
            ["有限责任公司", "股份有限公司"],
            ["其他企业法人", "社会服务机构"],
            ["上市公司", "事业单位"],
            ["社会团体", "基金会"],
            ["机关法人", "农村集体经济组织法人"],
            ["城镇农村的合作经济组织法人", "基层群众性自治组织法人"],
            ["个人独资企业", "合伙企业"],
            ["不具有法人资格的专业服务机构", ""]
        ];

        const organizationPartyWord = (prefix, active, includeOwnership, size = 18, line = 235) => {
            const get = (suffix) => active ? data[`${prefix}_org_${suffix}`] || "" : "";
            const selectedType = get("type");
            const selectedOwnership = get("ownership");
            const optionText = (value) => value ? `${value}${box(selectedType === value)}` : "";
            const optionParagraphs = organizationOptionPairs.map(([left, right]) => new Paragraph({
                children: [
                    ...inlineChildren(optionText(left), { size, font: bodyFont }),
                    ...(right ? [
                        new TextRun({
                            children: [new Tab()],
                            size,
                            font: bodyFont
                        }),
                        ...inlineChildren(optionText(right), {
                        size,
                        font: bodyFont
                        })
                    ] : [])
                ],
                run: { size: Math.max(size + 6, 28) },
                keepLines: true,
                spacing: { before: 0, after: 0, line },
                indent: { left: 140 },
                tabStops: [{ type: TabStopType.LEFT, position: 3300 }]
            }));
            const paragraphs = [
                paragraph(`名称：${get("name")}`, { size, line }),
                paragraph(`住所地（主要办事机构所在地）：${get("address")}`, { size, line }),
                paragraph(`注册地／登记地：${get("registered")}`, { size, line }),
                paragraph(`法定代表人／负责人：${get("representative")}`, { size, line }),
                paragraph(`职务：${get("position")}　　　　　　　联系电话：${get("phone")}`, { size, line }),
                paragraph(`统一社会信用代码：${get("credit_code")}`, { size, line }),
                paragraph("类型：", { size, line, bold: true }),
                ...optionParagraphs
            ];
            if (includeOwnership) {
                paragraphs.push(paragraph(
                    `所有制性质：国有${box(selectedOwnership === "国有（控股）" || selectedOwnership === "国有（参股）")}（控股${box(selectedOwnership === "国有（控股）")}／参股${box(selectedOwnership === "国有（参股）")}）　民营${box(selectedOwnership === "民营")}　其他${box(selectedOwnership === "其他")}__________`,
                    { size, line, before: 50, keepLines: true }
                ));
            }
            return paragraphs;
        };

        const cell = (textOrParagraphs, options = {}) => {
            const content = Array.isArray(textOrParagraphs)
                ? textOrParagraphs
                : [paragraph(textOrParagraphs, options)];
            return new TableCell({
                children: content,
                columnSpan: options.colSpan,
                width: { size: options.width || contentWidth, type: WidthType.DXA },
                verticalAlign: options.verticalAlign || VerticalAlign.TOP,
                margins: {
                    top: options.marginTop ?? 70,
                    bottom: options.marginBottom ?? 70,
                    left: options.marginLeft ?? 90,
                    right: options.marginRight ?? 90
                }
            });
        };

        const row = (left, right, heightCm, options = {}) => new TableRow({
            cantSplit: true,
            height: {
                value: cm(heightCm),
                rule: options.exact ? HeightRule.EXACT : HeightRule.ATLEAST
            },
            children: options.full
                ? [cell(left, {
                    colSpan: 2,
                    width: tableWidth,
                    size: options.size,
                    bold: options.bold,
                    alignment: options.alignment,
                    verticalAlign: options.verticalAlign,
                    line: options.line
                })]
                : [
                    cell(left, {
                        width: labelWidth,
                        size: options.leftSize || options.size,
                        bold: options.leftBold,
                        alignment: options.leftAlignment || AlignmentType.CENTER,
                        verticalAlign: options.leftVerticalAlign || VerticalAlign.CENTER,
                        line: options.leftLine || options.line
                    }),
                    cell(right, {
                        width: contentWidth,
                        size: options.rightSize || options.size,
                        bold: options.rightBold,
                        alignment: options.rightAlignment,
                        verticalAlign: options.rightVerticalAlign,
                        line: options.rightLine || options.line
                    })
                ]
        });

        const table = (rows) => new Table({
            rows,
            width: { size: tableWidth, type: WidthType.DXA },
            columnWidths: [labelWidth, contentWidth],
            layout: TableLayoutType.FIXED,
            alignment: AlignmentType.CENTER,
            borders
        });

        const sectionProperties = (topCm, nextPage, bottomCm = 1.55) => ({
            type: nextPage ? SectionType.NEXT_PAGE : undefined,
            page: {
                size: { width: pageWidth, height: pageHeight },
                margin: {
                    top: cm(topCm),
                    right: cm(2.6),
                    bottom: cm(bottomCm),
                    left: cm(2.6),
                    header: cm(0.8),
                    footer: cm(0.8),
                    gutter: 0
                }
            }
        });

        const activeNatural = (prefix) => data[`${prefix}_kind`] === "natural";
        const activeOrg = (prefix) => data[`${prefix}_kind`] === "organization";
        const activeThirdNatural = data.has_third_party && activeNatural("third_party");
        const activeThirdOrg = data.has_third_party && activeOrg("third_party");

        const instructions = [
            "说明：",
            "　　为了方便您更好地参加诉讼，保护您的合法权利，请填写本表。",
            "　　1. 起诉时需向人民法院提交证明您身份的材料，如身份证复印件、营业执照复印件等。",
            "　　2. 本表所列内容是您提起诉讼以及人民法院查明案件事实所需，请务必如实填写。",
            "　　3. 本表有些内容可能与您的案件无关，您认为与案件无关的项目可以填“无”或不填；对于本表中勾选项可以在对应项打“√”；您认为另有重要内容需要列明的，可以另附页填写。",
            "　　4. 本表 Word 电子版填写时，相关栏目可复制粘贴或扩容，但不得改变要素内容、格式设置。例如，多原告、多被告或多委托诉讼代理人等情况，可根据实际情况复制粘贴；需填写文字较多时，可根据实际对栏目进行扩容等。",
            "　　★特别提示★",
            "　　诉讼参加人应遵守诚信原则如实认真填写表格。",
            "　　如果诉讼参加人违反有关规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。"
        ].join("\n");

        const claimHeaderParagraphs = [
            paragraph("诉讼请求", { size: 32, bold: true, alignment: AlignmentType.CENTER, line: 360 }),
            paragraph("（主张人身损害赔偿，填写第1项至第10项；主张赔偿财产损失，填写第11项；", { size: 21, alignment: AlignmentType.CENTER, line: 280 }),
            paragraph("第12项至第13项为共同项）", { size: 21, alignment: AlignmentType.CENTER, line: 280 })
        ];

        const page1Table = new Table({
            rows: [
                row(instructions, "", 7.4, { full: true, size: 18, line: 245, exact: true }),
                row("当事人信息", "", 0.8, { full: true, size: 30, bold: true, alignment: AlignmentType.CENTER, verticalAlign: VerticalAlign.CENTER, exact: true }),
                row("原告\n（自然人）", naturalPartyPlain(data, "plaintiff", activeNatural("plaintiff")), 5.5, { leftSize: 23, rightSize: 20, rightLine: 280 }),
                row("原告\n（法人、非法人组织）", organizationPartyWord("plaintiff", activeOrg("plaintiff"), true, 18, 225), 8.0, { leftSize: 22 })
            ],
            width: { size: tableWidth, type: WidthType.DXA },
            columnWidths: [labelWidth, contentWidth],
            layout: TableLayoutType.FIXED,
            alignment: AlignmentType.CENTER,
            borders
        });

        const page2Table = table([
            row("委托诉讼代理人", attorneyPlain(data), 4.2, { leftSize: 24, rightSize: 21, rightLine: 300 }),
            row("被告\n（自然人）", naturalPartyPlain(data, "defendant", activeNatural("defendant")), 6.4, { leftSize: 24, rightSize: 21, rightLine: 320 }),
            row("被告\n（法人、非法人组织）", organizationPartyWord("defendant", activeOrg("defendant"), true, 19, 255), 12.0, { leftSize: 23 })
        ]);

        const page3Rows = [
            row("第三人（自然人）", naturalPartyPlain(data, "third_party", activeThirdNatural), 5.9, { leftSize: 24, rightSize: 21, rightLine: 320 }),
            row("第三人\n（法人、非法人组织）", organizationPartyWord("third_party", activeThirdOrg, true, 18, 235), 9.2, { leftSize: 23 }),
            new TableRow({
                cantSplit: true,
                height: { value: cm(1.85), rule: HeightRule.ATLEAST },
                children: [cell(claimHeaderParagraphs, { colSpan: 2, width: tableWidth, verticalAlign: VerticalAlign.CENTER })]
            }),
            new TableRow({
                cantSplit: true,
                height: { value: cm(5.05), rule: HeightRule.ATLEAST },
                children: [cell([
                    paragraph(data.claims || "", { size: 21, line: 315 })
                ], { colSpan: 2, width: tableWidth })]
            }),
            row("1.其他费用", data.other_costs || "无", 0.68, { leftAlignment: AlignmentType.LEFT, leftSize: 21, rightSize: 21, exact: true }),
            row("2.标的总额", data.subject_amount || "", 0.68, { leftAlignment: AlignmentType.LEFT, leftSize: 21, rightSize: 21, exact: true })
        ];
        const page3Table = table(page3Rows);

        const benefitsA = [
            "1. 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。",
            mediationChoicePlain(data.mediation_benefit_1),
            "2. 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。",
            mediationChoicePlain(data.mediation_benefit_2),
            "3. 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。",
            mediationChoicePlain(data.mediation_benefit_3)
        ].join("\n");
        const benefitsB = [
            "4. 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。",
            mediationChoicePlain(data.mediation_benefit_4),
            "5. 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。",
            mediationChoicePlain(data.mediation_benefit_5)
        ].join("\n");

        const page4Table = table([
            row("诉前保全及鉴定申请", "", 0.84, { full: true, size: 31, bold: true, alignment: AlignmentType.CENTER, verticalAlign: VerticalAlign.CENTER, exact: true }),
            row("1. 是否已经诉前保全", preservationPlain(data), 2.95, { leftAlignment: AlignmentType.LEFT, leftSize: 23, rightSize: 21, rightLine: 310 }),
            row("2. 是否申请鉴定", appraisalPlain(data), 1.27, { leftAlignment: AlignmentType.LEFT, leftSize: 23, rightSize: 21, rightLine: 305 }),
            row("事实与理由", "", 0.85, { full: true, size: 32, bold: true, alignment: AlignmentType.CENTER, verticalAlign: VerticalAlign.CENTER, exact: true }),
            new TableRow({
                cantSplit: true,
                height: { value: cm(3.05), rule: HeightRule.ATLEAST },
                children: [cell([
                    paragraph("（可完整表述纠纷涉及的事实与理由；为方便、准确梳理要点，相关内容请在下方要素式表格中填写）", { size: 20, line: 285 }),
                    paragraph(data.facts || "", { size: 21, line: 315 })
                ], { colSpan: 2, width: tableWidth })]
            }),
            row("对纠纷解决方式的意愿", "", 0.85, { full: true, size: 32, bold: true, alignment: AlignmentType.CENTER, verticalAlign: VerticalAlign.CENTER, exact: true }),
            row("是否了解调解作为非诉讼纠纷解决方式，能及时、高效、低成本、不伤和气地解决纠纷", `了解${box(data.mediation_awareness === "了解")}　　不了解${box(data.mediation_awareness === "不了解")}`, 2.45, { leftAlignment: AlignmentType.LEFT, leftSize: 21, rightSize: 22, rightVerticalAlign: VerticalAlign.CENTER, leftLine: 310 }),
            row("是否了解先行调解\n解决纠纷的好处", benefitsA, 6.05, { leftAlignment: AlignmentType.LEFT, leftSize: 22, rightSize: 20, rightLine: 285 }),
            row("是否了解先行调解\n解决纠纷的好处", benefitsB, 3.18, { leftAlignment: AlignmentType.LEFT, leftSize: 22, rightSize: 20, rightLine: 285 }),
            row("是否考虑先行调解", `是${box(data.mediation_choice === "yes")}　否${box(data.mediation_choice === "no")}\n暂不确定，想要了解更多内容${box(data.mediation_choice === "unsure")}`, 2.4, { leftAlignment: AlignmentType.LEFT, leftSize: 22, rightSize: 22, rightVerticalAlign: VerticalAlign.CENTER, rightLine: 320 })
        ]);

        return new Document({
            creator: "要素式诉状转换工具",
            title: "民事起诉状",
            description: "由要素式诉状转换工具按当前四页民事起诉状模板生成的可编辑文档",
            styles: {
                default: {
                    document: {
                        run: { font: bodyFont, size: 21 },
                        paragraph: { spacing: { after: 0 } }
                    }
                }
            },
            sections: [
                {
                    properties: sectionProperties(2.0, false, 0.35),
                    children: [
                        paragraph("民事起诉状", { size: 44, bold: true, alignment: AlignmentType.CENTER, line: 560 }),
                        paragraph(formatDisputeTitle(data.dispute_type), { size: 30, bold: true, alignment: AlignmentType.CENTER, line: 420, after: 170 }),
                        page1Table
                    ]
                },
                {
                    properties: sectionProperties(1.9, true),
                    children: [page2Table]
                },
                {
                    properties: sectionProperties(1.3, true),
                    children: [page3Table]
                },
                {
                    properties: sectionProperties(1.4, true, 0.35),
                    children: [
                        page4Table,
                        paragraph("具状人（签字、盖章）：", { size: 28, bold: true, alignment: AlignmentType.RIGHT, line: 300, before: 20, rightIndent: cm(1.55), keepNext: true, keepLines: true }),
                        paragraph(`日期：${data.filing_date || ""}`, { size: 26, alignment: AlignmentType.RIGHT, line: 300, rightIndent: cm(2.75), keepLines: true })
                    ]
                }
            ]
        });
    }

    function naturalPartyPlain(data, prefix, active) {
        const get = (suffix) => active ? data[`${prefix}_${suffix}`] || "" : "";
        const birth = splitBirth(get("birth"));
        return [
            `姓名：${get("name")}`,
            `性别：男${box(get("gender") === "男")}　　女${box(get("gender") === "女")}`,
            `出生日期：${birth.year}年　${birth.month}月　${birth.day}日　　　民族：${get("ethnicity")}`,
            `工作单位：${get("work_unit")}　　　　　　　　　职务：${get("position")}`,
            `联系电话：${get("phone")}`,
            `住所地（户籍所在地）：${get("address")}`,
            `经常居住地：${get("residence")}`,
            `证件类型：${get("id_type")}`,
            `证件号码：${get("id")}`
        ].join("\n");
    }

    function organizationPartyPlain(data, prefix, active, includeOwnership) {
        const get = (suffix) => active ? data[`${prefix}_org_${suffix}`] || "" : "";
        const selected = get("type");
        const lines = [
            `名称：${get("name")}`,
            `住所地（主要办事机构所在地）：${get("address")}`,
            `注册地／登记地：${get("registered")}`,
            `法定代表人／负责人：${get("representative")}`,
            `职务：${get("position")}　　　　　　　联系电话：${get("phone")}`,
            `统一社会信用代码：${get("credit_code")}`,
            `类型：有限责任公司${box(selected === "有限责任公司")}　其他企业法人${box(selected === "其他企业法人")}　社会服务机构${box(selected === "社会服务机构")}`,
            `股份有限公司${box(selected === "股份有限公司")}　　上市公司${box(selected === "上市公司")}`,
            `事业单位${box(selected === "事业单位")}　　社会团体${box(selected === "社会团体")}　　基金会${box(selected === "基金会")}`,
            `机关法人${box(selected === "机关法人")}　　农村集体经济组织法人${box(selected === "农村集体经济组织法人")}`,
            `　　　　城镇农村的合作经济组织法人${box(selected === "城镇农村的合作经济组织法人")}　基层群众性自治组织法人${box(selected === "基层群众性自治组织法人")}`,
            `　　　　个人独资企业${box(selected === "个人独资企业")}　合伙企业${box(selected === "合伙企业")}　不具有法人资格的专业服务机构${box(selected === "不具有法人资格的专业服务机构")}`
        ];
        if (includeOwnership) lines.push(ownershipPlain(data, prefix, active));
        return lines.join("\n");
    }

    function ownershipPlain(data, prefix, active) {
        const selected = active ? data[`${prefix}_org_ownership`] || "" : "";
        return `□ 所有制性质：国有${box(selected === "国有（控股）" || selected === "国有（参股）")}（控股${box(selected === "国有（控股）")}／参股${box(selected === "国有（参股）")}）　民营${box(selected === "民营")}　其他${box(selected === "其他")}__________`;
    }

    function attorneyPlain(data) {
        const active = !!data.has_attorney;
        const get = (suffix) => active ? data[`attorney_${suffix}`] || "" : "";
        return [
            `有${box(active)}`,
            `　　姓名：${get("name")}`,
            `　　单位：${get("unit")}`,
            `　　职务：${get("position")}　　　　　　联系电话：${get("phone")}`,
            `　　代理权限：一般授权${box(get("authority") === "一般授权")}　特别授权${box(get("authority") === "特别授权")}　________________`,
            `无${box(!active)}`
        ].join("\n");
    }

    function preservationPlain(data) {
        return [
            `是${box(data.preservation_status === "yes")}　　保全法院：${data.preservation_court || ""}　　　　　　　保全时间：${data.preservation_date || ""}`,
            `　　　　保全案号：${data.preservation_case_no || ""}`,
            `否${box(data.preservation_status === "no")}`,
            "（如申请诉讼保全，请另行提交诉讼保全申请及相关材料）"
        ].join("\n");
    }

    function appraisalPlain(data) {
        return [
            `是${box(data.appraisal_status === "yes")}　　鉴定事项：${data.appraisal_matter || ""}`,
            `否${box(data.appraisal_status === "no")}`
        ].join("\n");
    }

    function mediationChoicePlain(value) {
        return `了解${box(value === "了解")}　　不了解${box(value === "不了解")}`;
    }

    function box(checked) {
        return checked ? "☑" : "□";
    }

    function showStatus(message, type = "info") {
        const status = $("status");
        status.className = `status ${type}`;
        status.textContent = message;
    }
})();
