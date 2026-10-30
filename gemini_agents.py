# FILE 2: gemini_agents.py (Owned by Navyashree H S)
import os
import json
import time
from typing import Literal, List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# ==========================================================
# 1. STRICT OUTPUT SCHEMAS (Guarantees 100% Accurate Format)
# ==========================================================
class TriageOutput(BaseModel):
    is_noise: bool = Field(description="True if non-critical blip or health check; False if real incident.")
    severity: Literal["P1-CRITICAL", "P2-HIGH", "P3-LOW", "P4-NOISE"]
    cascading_risk: bool = Field(description="True if other services are affected.")
    summary: str = Field(description="1-sentence triage explanation.")


class RootCauseOutput(BaseModel):
    runbook_id: str = Field(description="ID of the matched runbook, e.g., RB-101.")
    root_cause: str = Field(description="Clear explanation of what broke and why.")
    evidence_quote: str = Field(description="Exact error log line proving the diagnosis.")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0.")


class AutoFixOutput(BaseModel):
    action_command: Literal[
        "restart_and_scale_memory",
        "drain_idle_db_connections",
        "rollback_production_deployment",
        "no_action_needed"
    ]
    risk_level: Literal["LOW", "HIGH"]
    requires_human_approval: bool
    aws_lambda_payload: str = Field(description="JSON string parameters for AWS Lambda.")
    slack_notification: str = Field(description="Message for #sre-incident-alerts on Slack.")
    jira_ticket_summary: str = Field(description="Title and summary for Jira ticket.")


# ==========================================================
# 2. STABLE GEMINI HELPER (1 API Key + Auto-Retry)
# ==========================================================
def call_gemini_structured(system_instruction: str, user_prompt: str, schema_class: type[BaseModel], api_key: str):
    """Calls Gemini with strict JSON schema and retries on rate limits."""
    client = genai.Client(api_key=api_key)
    delay = 2
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=schema_class,
                ),
            )
            return schema_class.model_validate_json(response.text).model_dump()
        except Exception as e:
            if attempt == 2:
                raise e
            time.sleep(delay)
            delay *= 2


# ==========================================================
# 3. THE THREE SPECIALIZED AI AGENTS
# ==========================================================
def run_smart_triage_agent(alert: dict, api_key: str) -> dict:
    """Agent 1: Filters noise and assigns severity in <5 seconds."""
    system_prompt = (
        "You are Agent 1: Smart Triage Agent in Auto-Rescue AI. "
        "Filter out transient CPU spikes with 0 errors as is_noise=True and severity='P4-NOISE'. "
        "Mark OOM errors, DB pool exhaustion, or 5xx crashes as is_noise=False."
    )
    user_prompt = f"CloudWatch Alert:\n{json.dumps(alert, indent=2)}"
    return call_gemini_structured(system_prompt, user_prompt, TriageOutput, api_key)


def run_root_cause_agent(alert: dict, triage_result: dict, rag_runbook: dict, api_key: str) -> dict:
    """Agent 2: Cross-references CloudWatch logs with RAG Runbook to find root cause."""
    system_prompt = (
        "You are Agent 2: Root Cause Diagnostic Agent. "
        "Compare the CloudWatch logs with the Retrieved Knowledge Base Runbook. "
        "Quote the exact error line from the logs in evidence_quote."
    )
    user_prompt = (
        f"Alert Logs:\n{json.dumps(alert, indent=2)}\n\n"
        f"Triage Output:\n{json.dumps(triage_result, indent=2)}\n\n"
        f"Retrieved Runbook:\n{json.dumps(rag_runbook, indent=2)}"
    )
    return call_gemini_structured(system_prompt, user_prompt, RootCauseOutput, api_key)


def run_autofix_agent(alert: dict, diagnosis_result: dict, rag_runbook: dict, api_key: str) -> dict:
    """Agent 3: Prepares Lambda remediation, Slack alert, Jira ticket, and HITL flag."""
    system_prompt = (
        "You are Agent 3: Auto-Fix Remediation Agent. "
        "Select the recommended action from the runbook. "
        "CRITICAL RULE: If the action is 'rollback_production_deployment' or risk_level is 'HIGH', "
        "you MUST set requires_human_approval=True."
    )
    user_prompt = (
        f"Alert:\n{json.dumps(alert, indent=2)}\n\n"
        f"Diagnosis:\n{json.dumps(diagnosis_result, indent=2)}\n\n"
        f"Runbook:\n{json.dumps(rag_runbook, indent=2)}"
    )
    return call_gemini_structured(system_prompt, user_prompt, AutoFixOutput, api_key)


# Test block for Navyashree
if __name__ == "__main__":
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        print("⚠️ Set your GEMINI_API_KEY first to test live calls, e.g.:")
        print("   Windows PowerShell: $env:GEMINI_API_KEY='your_key'")
        print("   Mac/Linux: export GEMINI_API_KEY='your_key'")
    else:
        test_alert = {"service": "payment-service", "logs": ["ERROR OutOfMemoryError: Java heap space"]}
        res = run_smart_triage_agent(test_alert, key)
        print("✅ Gemini Triage Agent Output:", res)
        test_runbook = {
            "runbook_id": "RB-101",
            "description": "For OutOfMemoryError, check memory usage and restart the affected service."
        }

        diagnosis = run_root_cause_agent(
            test_alert,
            res,
            test_runbook,
            key
        )

        print("Root Cause Agent Output:", diagnosis)
        autofix = run_autofix_agent(
            test_alert,
            diagnosis,
            test_runbook,
            key
        )
        print("Auto=Fix Agent output:",autofix)
        