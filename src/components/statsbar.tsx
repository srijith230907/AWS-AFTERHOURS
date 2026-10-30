import { type Incident } from "@/lib/incidents";
import { ShieldCheck, Flame, BellOff, Lock } from "lucide-react";

interface StatsBarProps {
  incidents: Incident[];
}

export function StatsBar({ incidents }: StatsBarProps) {
  const totalRawAlerts = incidents.reduce((sum: number, i: Incident) => sum + i.bundledCount, 0);
  const poisonCaught = incidents.filter((i: Incident) => i.poisonDetected).length;
  const hardVetoes = incidents.filter((i: Incident) => i.policyVetoed).length;
  const pendingGates = incidents.filter((i: Incident) => i.stage === "awaiting_approval").length;
  const resolvedCount = incidents.filter((i: Incident) => i.stage === "resolved").length;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Poisoned Inputs Stripped (Hint 1)</span>
          <Flame className="h-5 w-5 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-400">{poisonCaught}</span>
          <span className="text-xs text-slate-500">untrusted comments/wiki edits sanitized</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Hard Policy Vetoes (Hint 2)</span>
          <Lock className="h-5 w-5 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-400">{hardVetoes}</span>
          <span className="text-xs text-slate-500">destructive commands blocked outside AI</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Approval Fatigue Reduction (Hint 3)</span>
          <BellOff className="h-5 w-5 text-teal-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-teal-400">{totalRawAlerts} ➔ {pendingGates}</span>
          <span className="text-xs text-slate-500">alerts collapsed into batched digests</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Auto-Healed Clusters</span>
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400">{resolvedCount} / {incidents.length}</span>
          <span className="text-xs text-slate-500">MTTR &lt; 5s • Conflict-free</span>
        </div>
      </div>
    </div>
  );
}
