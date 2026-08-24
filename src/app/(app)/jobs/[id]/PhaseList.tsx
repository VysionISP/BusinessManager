import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PHASE_STATUS_LABELS } from "@/lib/types";
import { actualCostsByCategory, budgetCostTotal, type JobCostEntryLike } from "@/lib/calculations";
import { PhaseForm } from "./PhaseForm";
import { addPhase, deletePhase, updatePhase } from "../actions";
import type { JobPhase } from "@prisma/client";

type CostEntryWithPhase = JobCostEntryLike & { phaseId?: number | null };

export function PhaseList({
  jobId,
  phases,
  costEntries,
}: {
  jobId: number;
  phases: JobPhase[];
  costEntries: CostEntryWithPhase[];
}) {
  return (
    <div className="space-y-3">
      {phases.map((phase) => {
        const phaseEntries = costEntries.filter((e) => e.phaseId === phase.id);
        const actual = actualCostsByCategory(phaseEntries);
        const budget = budgetCostTotal(phase);
        const overBudget = budget > 0 && actual.total > budget;
        return (
          <div key={phase.id} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">{phase.name}</div>
                {phase.description && <div className="text-sm text-slate-500 dark:text-slate-400">{phase.description}</div>}
                <div className="mt-1 text-xs text-slate-400">
                  {phase.scheduledStart && `Scheduled ${formatDate(phase.scheduledStart)}`}
                  {phase.scheduledStart && phase.scheduledEnd && " – "}
                  {phase.scheduledEnd && formatDate(phase.scheduledEnd)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrafficBadge severity="green" label={PHASE_STATUS_LABELS[phase.status as keyof typeof PHASE_STATUS_LABELS] ?? phase.status} />
                <form action={deletePhase.bind(null, jobId, phase.id)}>
                  <button type="submit" className="text-xs text-rose-600 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs sm:grid-cols-5">
              <Stat label="% complete" value={`${phase.percentComplete}%`} />
              <Stat label="Budget" value={formatCurrency(budget)} />
              <Stat label="Actual" value={formatCurrency(actual.total)} warn={overBudget} />
              <Stat label="Labour hrs" value={`${actual.labourHours.toFixed(1)} / ${phase.budgetLabourHours.toFixed(0)}`} />
              <Stat label="Variance" value={formatCurrency(budget - actual.total)} warn={overBudget} />
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-indigo-600">Edit phase</summary>
              <div className="mt-3">
                <PhaseForm phase={phase} action={updatePhase.bind(null, jobId, phase.id)} submitLabel="Save phase" />
              </div>
            </details>
          </div>
        );
      })}
      {phases.length === 0 && <p className="text-sm text-slate-400">No phases yet — costs are tracked against the whole job.</p>}

      <details>
        <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Add a phase</summary>
        <div className="mt-3">
          <PhaseForm action={addPhase.bind(null, jobId)} />
        </div>
      </details>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-slate-400">{label}</div>
      <div className={`font-medium ${warn ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>{value}</div>
    </div>
  );
}
