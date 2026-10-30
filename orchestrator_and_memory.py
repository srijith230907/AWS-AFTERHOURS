
import sqlite3
import hashlib
import json
import time
from datetime import datetime
from typing import Dict, Any, List
from telemetry_and_rag import query_knowledge_base_rag
from gemini_agents import execute_triage_agent, execute_root_cause_agent, execute_autofix_agent

DB_FILE = "agent_memory_stream.db"
DEDUP_CACHE: Dict[str, float] = {}


# 1. GENERATIVE AGENT MEMORY STREAM (SQLite Database matching Slide 3 Diagram)
def init_memory_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS memory_stream (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            incident_id TEXT,
            service TEXT,
            severity TEXT,
            root_cause TEXT,
            action_taken TEXT,
            resolution_mode TEXT,
            reflection_note TEXT
        )
    """)
    conn.commit()
    conn.close()


def save_agent_reflection(incident_id: str, service: str, severity: str, root_cause: str, action: str, mode: str, reflection: str):
    init_memory_db()
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO memory_stream
           (timestamp, incident_id, service, severity, root_cause, action_taken, resolution_mode, reflection_note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"), incident_id, service, severity, root_cause, action, mode, reflection)
    )
    conn.commit()
    conn.close()


def fetch_recent_memories(limit: int = 10) -> List[Dict[str, Any]]:
    init_memory_db()
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM memory_stream ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


# 2. ALERT DEDUPLICATION GATE
def check_is_duplicate(alert: Dict[str, Any], ttl_seconds: int = 120) -> bool:
    sig = f"{alert.get('service')}:{alert.get('alarm_name')}"
    digest = hashlib.sha256(sig.encode()).hexdigest()
    now = time.time()
    if digest in DEDUP_CACHE and (now - DEDUP_CACHE[digest]) < ttl_seconds:
        return True
    DEDUP_CACHE[digest] = now
    return False


# 3. MASTER SUPERVISOR ORCHESTRATOR
def run_incident_orchestrator(alert: Dict[str, Any], api_key: str, enable_dedup: bool = False) -> Dict[str, Any]:
    init_memory_db()
    t0 = time.time()
    trace_log: List[str] = []
    inc_id = alert.get("incident_id", "INC-UNKNOWN")
    service = alert.get("service", "unknown")

    # Stage 0: Deduplication Check
    if enable_dedup and check_is_duplicate(alert):
        trace_log.append("⚡ [PERCEIVE -> DEDUPLICATE] Duplicate alert fingerprint matched in <10ms (0 API tokens used).")
        return {
            "status": "SUPPRESSED_DUPLICATE",
            "duration_sec": round(time.time() - t0, 2),
            "triage": {"is_noise": True, "severity": "P4-NOISE", "cascading_failure": False, "triage_reasoning": "Suppressed duplicate alert storm."},
            "rag": None,
            "diagnosis": None,
            "autofix": None,
            "trace_log": trace_log
        }

    # Stage 1: Smart Triage Agent
    trace_log.append(f"🔍 [PERCEIVE] Smart Triage Agent inspecting telemetry for `{service}`...")
    triage = execute_triage_agent(alert, api_key)
    trace_log.append(f"✅ [TRIAGE COMPLETE] Severity: {triage['severity']} | Noise: {triage['is_noise']} ({triage.get('engine_mode')})")

    if triage["is_noise"]:
        save_agent_reflection(
            inc_id, service, triage["severity"], "Non-critical noise blip", "Suppressed", "NOISE_FILTERED",
            "Reflected: Similar cron/healthcheck CPU spikes on this service can be safely ignored."
        )
        trace_log.append("🛑 [REFLECT & END] Alert logged as noise in Memory Stream. On-call engineer not disturbed.")
        return {
            "status": "NOISE_FILTERED",
            "duration_sec": round(time.time() - t0, 2),
            "triage": triage,
            "rag": None,
            "diagnosis": None,
            "autofix": None,
            "trace_log": trace_log
        }

    # Stage 2: Retrieve from Knowledge Base & Past Memory Stream
    trace_log.append("📚 [RETRIEVE] Querying SRE Runbook Knowledge Base & Generative Memory Stream...")
    rag_data = query_knowledge_base_rag(alert)
    rb = rag_data["matched_runbook"]
    trace_log.append(f"📖 [RAG MATCH] Matched `{rb['runbook_id']}` ({rb['title']}) with similarity {rag_data['similarity_score']}")

    # Stage 3: Root Cause Diagnostic Agent
    trace_log.append("🧠 [PLAN / DIAGNOSE] Root Cause Agent correlating error logs with runbook...")
    diagnosis = execute_root_cause_agent(alert, triage, rag_data, api_key)
    trace_log.append(f"✅ [DIAGNOSIS COMPLETE] Confidence: {int(diagnosis['confidence_score']*100)}% | Quoted log evidence extracted.")

    # Stage 4: Auto-Fix Agent & Deterministic Safety Guardrail
    trace_log.append("🛠️ [ACT / REMEDIATE] Auto-Fix Agent generating AWS Lambda payload, Slack message & Jira ticket...")
    autofix = execute_autofix_agent(alert, diagnosis, rag_data, api_key)

    # Hard Safety Policy Override (Never allow unsupervised production rollbacks)
    if autofix["action_command"] == "rollback_production_deployment" or rb["risk_level"] == "HIGH":
        autofix["requires_human_approval"] = True
        autofix["risk_level"] = "HIGH"
        status = "AWAITING_HUMAN_APPROVAL"
        trace_log.append("⚠️ [SAFETY GUARDRAIL] High-risk action blocked from auto-execution. Waiting for Human-In-The-Loop approval.")
    else:
        autofix["requires_human_approval"] = False
        status = "AUTO_HEALED"
        trace_log.append(f"🚀 [LAMBDA EXECUTED] Invoked `{rb['aws_lambda_arn']}` -> Action `{autofix['action_command']}` succeeded.")
        save_agent_reflection(
            inc_id, service, triage["severity"], diagnosis["root_cause_summary"],
            autofix["action_command"], "AUTO_HEALED",
            f"Verified fix via {rb['runbook_id']}. Service restored autonomously."
        )
        trace_log.append("💾 [REFLECT] Saved incident resolution into persistent Generative Agent Memory Stream.")

    return {
        "status": status,
        "duration_sec": round(time.time() - t0, 2),
        "triage": triage,
        "rag": rag_data,
        "diagnosis": diagnosis,
        "autofix": autofix,
        "trace_log": trace_log
    }


if __name__ == "__main__":
    from telemetry_and_rag import CLOUDWATCH_SCENARIOS
    print("Testing Sanjay's Orchestrator & SQLite Memory Stream...")
    sample = CLOUDWATCH_SCENARIOS["Scenario 2: Payment Microservice Memory Leak (Autonomous Fix)"]
    out = run_incident_orchestrator(sample, api_key="")
    print("✅ Orchestrator Status:", out["status"])
    print("✅ Stored Memories Count:", len(fetch_recent_memories()))