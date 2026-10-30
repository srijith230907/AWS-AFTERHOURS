import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/header";
import { AlertFeed } from "@/components/alertfeed";
import { AgentPipeline } from "@/components/agentpipeline";
import { IncidentDetail } from "@/components/incidentdetail";
import { StatsBar } from "@/components/statsbar";
import { seedIncidents, type Incident, type Stage } from "@/lib/incidents";
import { advanceIncident } from "@/lib/engine";

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(() => seedIncidents());
  const [selectedId, setSelectedId] = useState<string>(() => seedIncidents()[0].id);
  const [running, setRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setIncidents((prev: Incident[]) => prev.map((inc: Incident) => advanceIncident(inc)));
    }, 1400);
    return () => clearInterval(timer);
  }, [running]);

  const selected = useMemo(
    () => incidents.find((i: Incident) => i.id === selectedId) ?? incidents[0],
    [incidents, selectedId]
  );

  const handleApprove = useCallback((id: string) => {
    setIncidents((prev: Incident[]) =>
      prev.map((inc: Incident) =>
        inc.id === id
          ? {
              ...inc,
              stage: "remediating" as Stage,
              gate: null,
              log: [
                ...inc.log,
                {
                  t: Date.now(),
                  text: "Human approved batched remediation gate — executing verified safe runbook.",
                },
              ],
            }
          : inc
      )
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setIncidents((prev: Incident[]) =>
      prev.map((inc: Incident) =>
        inc.id === id
          ? {
              ...inc,
              stage: "escalated" as Stage,
              gate: null,
              log: [
                ...inc.log,
                {
                  t: Date.now(),
                  text: "Human rejected remediation — escalated to on-call SRE.",
                },
              ],
            }
          : inc
      )
    );
  }, []);

  const handleInject = useCallback((newInc: Incident) => {
    setIncidents((prev: Incident[]) => [newInc, ...prev]);
    setSelectedId(newInc.id);
    setRunning(true);
  }, []);

  const handleReset = useCallback(() => {
    const fresh = seedIncidents();
    setIncidents(fresh);
    setSelectedId(fresh[0].id);
    setRunning(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-teal-950/40 via-slate-950 to-slate-950" />
      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <Header
          running={running}
          onToggle={() => setRunning((r: boolean) => !r)}
          onReset={handleReset}
        />
        <StatsBar incidents={incidents} />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <AlertFeed
              incidents={incidents}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              onInject={handleInject}
            />
          </div>
          <div className="lg:col-span-8 space-y-6">
            {selected && (
              <>
                <AgentPipeline incident={selected} />
                <IncidentDetail
                  incident={selected}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}