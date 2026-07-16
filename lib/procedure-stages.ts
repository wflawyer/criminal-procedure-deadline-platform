import type { DeadlineItem } from "./deadlines";

export const procedureStages = ["公安侦查", "审查起诉", "一审", "二审", "执行"] as const;

export type ProcedureStage = typeof procedureStages[number];

const investigationAndProsecutionDeadlineIds = new Set([
  "prosecution-transfer-forecast",
  "supplement-1",
  "supplement-2",
]);

/**
 * A deadline can belong to more than one display stage.  The transfer forecast is
 * the end point of investigation as well as the start boundary of prosecution;
 * supplementary investigation is ordered during prosecution but performed by
 * the investigating authority.
 */
export function procedureStagesForDeadline(
  item: Pick<DeadlineItem, "id" | "stageNo">,
): ProcedureStage[] {
  if (investigationAndProsecutionDeadlineIds.has(item.id)) {
    return ["公安侦查", "审查起诉"];
  }
  if (item.stageNo <= 3) return ["公安侦查"];
  if (item.stageNo === 4) return ["审查起诉"];
  if (item.stageNo === 5) return ["一审"];
  if (item.stageNo === 6) return ["二审"];
  return ["执行"];
}

export function visibleInProcedureStage(
  item: { visibleStages: readonly ProcedureStage[] },
  stage: ProcedureStage,
): boolean {
  return item.visibleStages.includes(stage);
}

export function procedureStageDisplayLabel(
  item: Pick<DeadlineItem, "id" | "stage">,
  viewingStage: ProcedureStage,
): string {
  if (viewingStage === "公安侦查" && item.id === "prosecution-transfer-forecast") {
    return "侦查终结与移送";
  }
  if (viewingStage === "公安侦查" && (item.id === "supplement-1" || item.id === "supplement-2")) {
    return "退回补充侦查";
  }
  return item.stage;
}
