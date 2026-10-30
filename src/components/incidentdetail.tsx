import { useState } from "react";
import { type Incident } from "@/lib/incidents";
import { queryFreeLlamaLive } from "@/lib/engine";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Terminal,
  Sparkles,
  FileWarning,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface IncidentDetailProps {
  incident: Incident;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function IncidentDetail({ incident, onApprove, onReject }: IncidentDetailProps) {
  const [groqKey, setGroqKey] = useState("");
  const [llamaOutput, setLlamaOutput] = useState<string | null>(null);
  const [loadingLlama, setLoadingLlama] = useState(false);

  const handleRunLiveLlama = async () => {
    setLoadingLlama(true);
    const res = await queryFreeLlamaLive(incident, groqKey);
    setLlamaOutput(res);
    setLoadingLlama(false);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-teal-400">{incident.id}</span>
            <span className="text-xs text-slate-400">• {incident.service}</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">{incident.title}</h2>
          <p className="text-xs text-slate-400">{incident.metric}</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Alert Fatigue Compression (Hint 3)</span>
          <span className="text-sm font-bold text-teal-400">
            {incident.bundledCount} Noisy Alerts ➔ 1 Incident
          </span>
        </div>
      </div>

      {incident.gate && incident.stage === "awaiting_approval" && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-950">
                Hint 3: Batched Digest Gate (Replaces {incident.gate.bundledAlertsCount} Popups)
              </span>
              <h3 className="text-sm font-bold text-white">{incident.gate.reason}</h3>
              <p className="font-mono text-xs text-teal-300">$ {incident.gate.proposedAction}</p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onApprove(incident.id)}
                className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-md"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Batch ({incident.gate.bundledAlertsCount} Alerts)
              </button>
              <button
                onClick={() => onReject(incident.id)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-500/20 px-3.5 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition"
              >
                <XCircle className="h-4 w-4" />
                Reject & Escalate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-rose-500/30 bg-slate-950/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
              <FileWarning className="h-4 w-4" /> Raw Untrusted Inputs (Hint 1)
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {incident.runbookSource}
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-2">
            <strong>Runbook:</strong> {incident.rawRunbook}
          </p>
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 font-mono text-xs text-rose-200">
            <strong>{incident.ticketCommentAuthor}:</strong> "{incident.rawTicketComment}"
          </div>
        </div>

        <div className="rounded-xl border border-teal-500/30 bg-slate-950/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-400">
              <ShieldCheck className="h-4 w-4" /> Sanitized Context Sent to Llama
            </span>
          </div>
          <div className="rounded-lg border border-teal-500/20 bg-teal-950/20 p-2.5 font-mono text-xs text-teal-200">
            {incident.sanitizedContext || "Sanitizing untrusted text..."}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
            <Terminal className="h-4 w-4" /> Deterministic Policy Airgap (Hint 2: Non-AI Command Verification)
          </span>
          {incident.policyVetoed && (
            <span className="flex items-center gap-1 rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              <ShieldAlert className="h-3 w-3" /> HARD VETO TRIGGERED
            </span>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-emerald-300">
          Verified Safe Command: $ {incident.verifiedSafeCommand}
        </div>
      </div>

      <div className="rounded-xl border border-teal-500/30 bg-slate-950/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400" />
            <span className="text-xs font-bold text-white">Live Llama-3.3-70B Deep Diagnostic</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Optional Free Groq Key (gsk_...)"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white"
            />
            <button
              onClick={handleRunLiveLlama}
              disabled={loadingLlama}
              className="rounded-lg bg-teal-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
            >
              {loadingLlama ? "Querying Llama..." : "Run Llama Analysis"}
            </button>
          </div>
        </div>
        {(llamaOutput || incident.diagnosisSummary) && (
          <p className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200">
            {llamaOutput || incident.diagnosisSummary}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Activity className="h-3.5 w-3.5 text-teal-400" /> Immutable Agent Execution Log
        </h4>
        <div className="max-h-44 space-y-1.5 overflow-y-auto font-mono text-xs">
          {incident.log.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-300">
              <span className="text-slate-500 shrink-0">[{new Date(entry.t).toLocaleTimeString()}]</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
