# FILE 4: app.py (Owned by Shashank V Kalburgi)
import os
import json
import streamlit as st
from data_and_rag import DEMO_INCIDENTS
from orchestrator import run_autonomous_pipeline

st.set_page_config(page_title="Auto-Rescue AI | Team AH-47", page_icon="🚨", layout="wide")

# Header matching your PPT
st.title("🚨 Auto-Rescue AI: Autonomous Incident Response")
st.caption("AfterHours 1.0 | Team ID: AH-47 (The Coders) — Srijith, Navyashree, Sanjay, Shashank")

# Sidebar for Single Gemini API Key & Metrics
with st.sidebar:
    st.header("🔑 Configuration")
    default_key = os.environ.get("GEMINI_API_KEY", "")
    api_key = st.text_input("Gemini API Key", value=default_key, type="password")
    st.divider()
    st.markdown("### 📊 Why It Matters")
    st.metric("Enterprise Downtime Cost", "$5,600 / min")
    st.metric("Target Triage Speed", "< 5 Seconds")
    st.metric("Daily Alert Noise Filtered", "70%")

# Main Scenario Selector
st.subheader("1️⃣ Select CloudWatch Incident Scenario")
selected_scenario = st.selectbox("Choose a live telemetry scenario to inject:", list(DEMO_INCIDENTS.keys()))
current_alert = DEMO_INCIDENTS[selected_scenario]

with st.expander("📄 View Raw CloudWatch Alert JSON & Logs", expanded=True):
    st.json(current_alert)

if st.button("🚀 Trigger Multi-Agent Autonomous Response", type="primary"):
    if not api_key:
        st.error("Please enter your Gemini API Key in the left sidebar first!")
    else:
        with st.spinner("Multi-Agent Swarm (Triage -> Root Cause -> Auto-Fix) investigating..."):
            result = run_autonomous_pipeline(current_alert, api_key)
            st.session_state["last_result"] = result

# Display Results if available
if "last_result" in st.session_state:
    res = st.session_state["last_result"]
    st.divider()

    # Top Status Banner
    col_a, col_b, col_c = st.columns(3)
    col_a.metric("Pipeline Status", res["status"])
    col_b.metric("Resolution / Triage Time", f"{res['elapsed_sec']} sec", delta="-4 hours MTTR")
    col_c.metric("Est. Downtime Saved", "$22,400" if res["status"] != "NOISE_FILTERED" else "$0 (Noise Ignored)")

    # 3 Columns for the 3 Agents (Matches Slide 5 of your PPT!)
    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown("### 1. Smart Triage Agent")
        triage = res["triage"]
        st.write(f"**Severity:** `{triage['severity']}`")
        st.write(f"**Is Noise?** `{triage['is_noise']}`")
        st.write(f"**Cascading Failure Risk:** `{triage['cascading_risk']}`")
        st.info(triage["summary"])

    with c2:
        st.markdown("### 2. Root Cause Agent")
        if res["diagnosis"]:
            diag = res["diagnosis"]
            st.write(f"**Matched Runbook:** `{diag['runbook_id']}`")
            st.write(f"**Confidence Score:** `{int(diag['confidence'] * 100)}%`")
            st.write(f"**Root Cause:** {diag['root_cause']}")
            st.code(diag["evidence_quote"], language="text")
        else:
            st.success("Skipped! Alert was filtered out as non-critical noise (saved API calls).")

    with c3:
        st.markdown("### 3. Auto-Fix Agent")
        if res["autofix"]:
            fix = res["autofix"]
            st.write(f"**Action:** `{fix['action_command']}`")
            st.write(f"**Risk Level:** `{fix['risk_level']}`")
            st.write("**Slack Notification Preview:**")
            st.chat_message("assistant").write(fix["slack_notification"])
            st.write(f"**Jira Ticket Created:** `{fix['jira_ticket_summary']}`")

            # Human-In-The-Loop Buttons for High-Risk Actions
            if fix["requires_human_approval"]:
                st.warning("⚠️ HIGH-RISK ACTION: Waiting for Human-In-The-Loop Approval!")
                b1, b2 = st.columns(2)
                if b1.button("✅ Approve Production Rollback"):
                    st.success("🎉 Approved! AWS Lambda executed rollback_production_deployment.")
                if b2.button("❌ Reject & Escalate"):
                    st.error("Aborted auto-fix. Escalated to Senior On-Call Engineer.")
            else:
                st.success("✅ Auto-Healed via AWS Lambda without human intervention!")
        else:
            st.info("No remediation needed for noise alerts.")

    # Audit Trail
    st.subheader("📜 Generative Agent Memory & Audit Trail")
    for entry in res["audit_log"]:
        st.write(entry)