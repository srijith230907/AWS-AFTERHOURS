import { ShieldAlert, Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface HeaderProps {
  running: boolean;
  onToggle: () => void;
  onReset?: () => void;
}

export function Header({ running, onToggle, onReset }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-950/50">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Auto-Rescue AI</h1>
            <span className="rounded-md bg-teal-500 px-2 py-0.5 text-xs font-bold text-slate-950">Team AH-47</span>
            <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              <Sparkles className="h-3 w-3" /> Hurdle: Poisoned Runbooks & Approval Fatigue
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Autonomous Llama Multi-Agent Incident Response • Prompt-Injection Airgap & Smart Digest Batching
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${running ? "animate-ping bg-teal-400" : "bg-amber-400"}`} />
          <span className="text-slate-300 font-medium">
            {running ? "Swarm Engine Ticking (1.4s)" : "Simulation Paused"}
          </span>
        </div>

        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition shadow ${
            running
              ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-teal-500 text-slate-950 hover:bg-teal-400"
          }`}
        >
          {running ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause Stream
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Resume Stream
            </>
          )}
        </button>

        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>
    </header>
  );
}
