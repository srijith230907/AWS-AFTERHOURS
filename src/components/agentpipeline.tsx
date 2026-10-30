import { type Incident, type Stage } from "@/lib/incidents";
import { ShieldCheck, Filter, Cpu, Lock, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";

interface AgentPipelineProps {
  incident: Incident;
}

const PIPELINE_STEPS: { key: Stage; label: string; sub: string; icon: any }[] = [
  { key: "sanitizing", label: "1. Input Sanitizer", sub: "Hint 1: Strip Poison", icon: ShieldCheck },
  { key: "triaging", label: "2. Triage & Lock", sub: "<5s Deduplication", icon: Filter },
  { key: "diagnosing", label: "3. Llama Diagnosis", sub: "RAG Root Cause", icon: Cpu },
  { key: "policy_check", label: "4. Hard Policy Gate", sub: "Hint 2: Non-AI Veto", icon: Lock },
  { key: "remediating", label: "5. Auto-Remediation", sub: "Hint 3: Batch Digest", icon: Wrench },
];

const STAGE_ORDER: Record<Stage, number> = {
  ingested: 0,
  sanitizing: 1,
  triaging: 2,
  diagnosing: 3,
  policy_check: 4,
  awaiting_approval: 4.5,
  remediating: 5,
  resolved: 6,
  escalated: 6,
};

export function AgentPipeline({ incident }: AgentPipelineProps) {
  const currentRank = STAGE_ORDER[incident.stage];

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white">
            Autonomous Multi-Agent Pipeline — <span className="text-teal-400">{incident.id}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time state machine with untrusted text sanitization & deterministic policy airgap
          </p>
        </div>
        <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 uppercase">
          Stage: {incident.stage.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {PIPELINE_STEPS.map((step, idx) => {
          const stepRank = idx + 1;
          const isDone = currentRank > stepRank;
          const isCurrent =
            Math.floor(currentRank) === stepRank ||
            (incident.stage === "awaiting_approval" && step.key === "remediating");

          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`rounded-xl border p-3 transition ${
                isDone
                  ? "border-teal-500/40 bg-teal-950/20"
                  : isCurrent
                  ? "border-amber-400 bg-amber-500/10 shadow-md shadow-amber-950/30"
                  : "border-slate-800 bg-slate-950/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={`h-4 w-4 ${
                    isDone ? "text-teal-400" : isCurrent ? "text-amber-400" : "text-slate-500"
                  }`}
                />
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                ) : isCurrent ? (
                  <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                ) : null}
              </div>
              <div className="mt-2 text-xs font-bold text-white">{step.label}</div>
              <div className="text-[11px] text-slate-400">{step.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
