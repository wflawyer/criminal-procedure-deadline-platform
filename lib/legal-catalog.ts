export type LegalDocument = {
  id: string;
  title: string;
  level: string;
  authority: string;
  source_url?: string;
  database_url?: string;
  source_group: string;
  topics: string[];
  coverage: string;
  effective: string;
  points: string;
  filename: string;
  source_note?: string;
  chars: number;
  sha256: string;
  checked_at: string;
  local?: boolean;
  mime_type?: string;
  size?: number;
  uploaded_at?: string;
};

export const legalSourceGroups = [
  { id: "all", label: "全部法源" },
  { id: "law", label: "法律" },
  { id: "judicial", label: "司法解释与检察规则" },
  { id: "public-security", label: "公安规章与规范" },
  { id: "joint", label: "联合文件与标准" },
  { id: "auxiliary", label: "期间计算资料" },
  { id: "local", label: "本地上传" },
] as const;

export const legalTopics = [
  { id: "all", label: "全部程序主题" },
  { id: "general", label: "综合程序" },
  { id: "filing", label: "报案与立案" },
  { id: "investigation", label: "侦查与证据" },
  { id: "coercive", label: "强制措施与羁押" },
  { id: "prosecution", label: "审查起诉" },
  { id: "trial", label: "审判与救济" },
  { id: "execution", label: "执行" },
  { id: "injury", label: "伤害案件专题" },
  { id: "period", label: "期间计算" },
] as const;

export function filterLegalDocuments(
  documents: LegalDocument[],
  filters: { sourceGroup: string; topic: string; query: string },
) {
  const query = filters.query.trim().toLowerCase();
  return documents.filter((document) => {
    const searchable = `${document.title}${document.filename}${document.points}${document.authority}${document.level}${document.topics.join("")}`.toLowerCase();
    return (
      (!query || searchable.includes(query))
      && (filters.sourceGroup === "all" || document.source_group === filters.sourceGroup)
      && (filters.topic === "all" || document.topics.includes(filters.topic))
    );
  });
}
