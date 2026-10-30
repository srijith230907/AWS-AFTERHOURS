# AWS-AFTERHOURS
# Auto-Rescue AI: Autonomous Incident Response

**Team Name:** The Coders (Team ID: AH-47)  
**Hackathon:** AfterHours 1.0[cite: 1]  
**Team Members:** Srijith Srivathsa, Navyashree H S, Sanjay Kanth C, Shashank V Kalburgi[cite: 1]

---

## Overview

Modern cloud infrastructure teams are overwhelmed by operational noise, handling over 500 alerts daily where 70% are non-critical false positives[cite: 1]. Manual log inspection during off-hours leads to prolonged Mean Time To Resolution (MTTR > 4 hours) and substantial financial impact ($5,600+ per minute in enterprise cloud downtime)[cite: 1].

**Auto-Rescue AI** is an autonomous multi-agent incident response platform designed to filter alert noise, diagnose root causes using Retrieval-Augmented Generation (RAG), and execute safe automated remediations through AWS Lambda while incorporating Human-in-the-Loop (HITL) safeguards for high-risk actions[cite: 1].

---

## System Architecture & Workflow

Auto-Rescue AI follows a 5-stage supervisor workflow:

1. **Telemetry Ingestion & Deduplication:** Incoming AWS CloudWatch alerts are evaluated through a SHA-256 fingerprint deduplication cache to suppress alert storms and save API quota[cite: 1].
2. **Smart Triage Agent (Agent 1):** Filters false-positive noise, analyzes cascading microservice impacts, and assigns severity scores (`P1-CRITICAL` to `P4-NOISE`) in under 5 seconds[cite: 1].
3. **Root Cause Agent & RAG (Agent 2):** Cross-references live telemetry and logs against an SRE Runbook Knowledge Base to pinpoint the exact failure and extract log evidence[cite: 1].
4. **Auto-Fix Remediation Agent (Agent 3):** Dispatches automated AWS Lambda remediation scripts, formats Slack incident alerts for `#sre-oncall`, and logs Jira tickets. High-risk actions automatically trigger a Human-in-the-Loop approval gate[cite: 1].
5. **Generative Memory Stream:** Persists incident states, diagnoses, and reflections into an SQLite database so the system maintains historical context[cite: 1].

---

## Project Structure

The repository is modularized into four clean components to prevent merge conflicts during the 24-hour hackathon:

* `telemetry_and_rag.py` *(Owned by Srijith Srivathsa)*: Contains enterprise CloudWatch simulation scenarios and the local SRE Runbook RAG engine.
* `ai_agents.py` *(Owned by Navyashree H S)*: Implements the three Gemini 2.5 Flash agents with strict Pydantic schemas (`temperature=0.0`) and bulletproof offline fallbacks.
* `orchestrator_and_memory.py` *(Owned by Sanjay Kanth C)*: Manages the master supervisor pipeline, deduplication filter, SQLite memory stream, and safety policies.
* `app.py` *(Owned by Shashank V Kalburgi)*: Provides the enterprise Streamlit command center UI with live metrics, agent traces, and HITL approval controls.

---

## Installation & Quick Start

### 1. Clone and Navigate to the Repository
```bash
git clone [https://github.com/your-username/auto-rescue-ai.git](https://github.com/your-username/auto-rescue-ai.git)
cd auto-rescue-ai
