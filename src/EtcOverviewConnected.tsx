import * as React from "react";
import type { SaasSession } from "./saasApi";
import {
  getEtcOverview,
  type EtcDashboardResponse,
  type EtcDashboardStep,
  type EtcDashboardTask,
} from "./etcDashboardApi";
import { EtcOverview, type EtcOverviewData, type EtcOverviewProps } from "./EtcOverview";

export type EtcOverviewNavigationTarget =
  | "applicability"
  | "population"
  | "survey-vmt"
  | "validation"
  | "package"
  | "tasks"
  | "evidence";

export type UseEtcOverviewResult = {
  data: EtcDashboardResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function publicError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "The ETC overview could not be loaded. Please try again.";
}

/**
 * Loads one worksite/cycle at a time. The request is aborted when the scope
 * changes or the component unmounts, preventing stale responses from winning.
 */
export function useEtcOverview(
  session: SaasSession | null,
  organizationId: string | null,
  siteId: string | null,
  reportingYearId?: string | null,
): UseEtcOverviewResult {
  const [data, setData] = React.useState<EtcDashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const refresh = React.useCallback(async () => {
    const currentRequest = ++requestId.current;
    setError(null);
    setRefreshing(true);

    if (!session || !organizationId || !siteId) {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      setError("Choose an authenticated organization and worksite to load the ETC overview.");
      return;
    }

    try {
      const result = await getEtcOverview(session, organizationId, siteId, reportingYearId);
      if (currentRequest !== requestId.current) return;
      setData(result);
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      setError(publicError(caught));
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [organizationId, reportingYearId, session, siteId]);

  React.useEffect(() => {
    void refresh();
    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return { data, loading, refreshing, error, refresh };
}

function mapStep(step: EtcDashboardStep): EtcOverviewData["steps"][number] {
  return { id: step.id, label: step.label, detail: step.detail, status: step.status };
}

function mapTask(task: EtcDashboardTask): EtcOverviewData["tasks"][number] {
  return { id: task.id, title: task.title, description: task.description, owner: task.owner, dueLabel: task.due_label, status: task.status };
}

export function mapEtcDashboardToOverview(data: EtcDashboardResponse): EtcOverviewData {
  return {
    worksiteName: data.worksite.name,
    reportingYear: data.cycle?.reporting_year ?? new Date().getFullYear(),
    cycleLabel: data.cycle ? "South Coast AQMD · ETC workspace" : "ETC workspace setup",
    readinessReady: data.readiness.ready,
    readinessTotal: data.readiness.total,
    readinessLabel: data.readiness.label,
    nextAction: {
      title: data.tasks[0]?.title ?? "Review reporting cycle",
      description: data.tasks[0]?.description ?? "Review the current reporting-cycle state and next required action.",
      actionLabel: data.tasks[0]?.status === "blocking" ? "Open blocking task" : "Open next action",
    },
    steps: data.steps.map(mapStep),
    tasks: data.tasks.map(mapTask),
    evidence: {
      verified: data.evidence.verified,
      selfReported: data.evidence.self_reported,
      needsCorrection: data.evidence.needs_correction,
      missing: data.evidence.missing,
    },
    deadlines: data.deadlines,
  };
}

export type ConnectedEtcOverviewProps = Omit<EtcOverviewProps, "data" | "isLoading" | "error" | "onRetry" | "onOpenNextAction" | "onOpenStep" | "onOpenTasks" | "onOpenEvidence"> & {
  session: SaasSession | null;
  organizationId: string | null;
  siteId: string | null;
  reportingYearId?: string | null;
  onNavigate?: (target: EtcOverviewNavigationTarget) => void;
  onExportStatusBrief?: () => void;
};

function targetForStep(stepId: string): EtcOverviewNavigationTarget {
  if (stepId === "applicability" || stepId === "population" || stepId === "survey-vmt" || stepId === "validation" || stepId === "package") return stepId;
  return "applicability";
}

export default function ConnectedEtcOverview({ session, organizationId, siteId, reportingYearId, onNavigate, onExportStatusBrief }: ConnectedEtcOverviewProps) {
  const overview = useEtcOverview(session, organizationId, siteId, reportingYearId);
  const mappedData = overview.data ? mapEtcDashboardToOverview(overview.data) : undefined;

  const navigate = React.useCallback((target: EtcOverviewNavigationTarget) => onNavigate?.(target), [onNavigate]);
  const componentProps: EtcOverviewProps = {
    data: mappedData ?? {
      worksiteName: "ETC workspace",
      reportingYear: new Date().getFullYear(),
      cycleLabel: "Loading reporting cycle",
      readinessReady: 0,
      readinessTotal: 6,
      readinessLabel: "Loading worksite data…",
      nextAction: { title: "Loading overview", description: "Loading the current reporting-cycle state.", actionLabel: "Loading" },
      steps: [],
      tasks: [],
      evidence: { verified: 0, selfReported: 0, needsCorrection: 0, missing: 0 },
      deadlines: [],
    },
    isLoading: overview.loading,
    error: overview.error,
    onRetry: overview.refresh,
    onExportStatusBrief,
    onOpenNextAction: () => navigate(targetForStep(overview.data?.steps.find((step) => step.status === "blocked" || step.status === "review" || step.status === "not_started")?.id ?? "applicability")),
    onOpenStep: (stepId) => navigate(targetForStep(stepId)),
    onOpenTasks: () => navigate("tasks"),
    onOpenEvidence: () => navigate("evidence"),
  };

  return <EtcOverview {...componentProps} />;
}
