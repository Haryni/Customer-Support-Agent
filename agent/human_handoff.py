import sqlite3
import os
import json
import uuid
from agent.state import AgentState
from mcp_server.tools import track_shipment

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "ecommerce.db")

def human_handoff_node(state: AgentState) -> dict:
    """
    Human Handoff Node:
    - Triggered when triage router or agents identify escalation criteria (angry sentiment, 3+ late orders, human request).
    - Interrupts automatic bot resolution.
    - Generates a structured case handoff summary for human support agents.
    - Persists ticket to database for Support Team Dashboard.
    """
    ticket_id = f"TICK-{uuid.uuid4().hex[:6].upper()}"
    
    # Gather shipment context if order ID present
    tracking_ctx = ""
    if state.order_id:
        t_res = track_shipment(state.order_id)
        if t_res["success"]:
            sh = t_res["shipment"]
            tracking_ctx = f"Carrier: {sh['carrier']}, Location: {sh['current_location']} ({sh['status']})"

    # Gather actions taken
    actions_summary = []
    for log in state.actions_log:
        step_name = log.get("step", "Agent Node")
        if "detected_intent" in log:
            actions_summary.append(f"Triage intent '{log['detected_intent']}' with sentiment '{log['detected_sentiment']}'")
        elif "tools_executed" in log:
            actions_summary.append(f"Executed MCP Tools: {', '.join(log['tools_executed'])}")
        elif "policy_citations" in log:
            actions_summary.append(f"RAG Policy Lookup: {', '.join(log['policy_citations'])}")

    actions_taken_str = " -> ".join(actions_summary) if actions_summary else "Initial Triage Evaluation"

    rec_action = "Contact customer via phone/email, offer 100% full refund or free priority replacement."
    if state.late_count >= 3:
        rec_action = f"Escalate to Carrier Liaison Manager. Customer has experienced {state.late_count} late orders. Grant $25 goodwill gift card."
    elif state.intent == "RETURN_REQUEST":
        rec_action = "Review manual policy return override. Verify item condition photos with buyer."

    issue_type = state.intent if state.intent != "UNKNOWN" else "COMPLAINT_ESCALATION"

    handoff_summary = {
        "ticket_id": ticket_id,
        "customer_email": state.customer_email,
        "order_id": state.order_id or "N/A",
        "sentiment": state.sentiment,
        "issue_type": issue_type,
        "late_order_count": state.late_count,
        "actions_taken": actions_taken_str,
        "escalation_reason": f"Escalation triggered due to {state.sentiment} sentiment and {state.late_count} order delays. {tracking_ctx}",
        "recommended_action": rec_action,
        "created_at": "2026-09-27 16:30:00"
    }

    # Save to SQLite escalated_tickets table
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO escalated_tickets 
               (ticket_id, customer_email, order_id, sentiment, issue_type, summary, actions_taken, recommended_action, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                ticket_id,
                state.customer_email,
                state.order_id or "N/A",
                state.sentiment,
                issue_type,
                json.dumps(handoff_summary),
                actions_taken_str,
                rec_action,
                "OPEN"
            )
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error persisting ticket to DB: {e}")

    # Public Response to Customer
    customer_response = (
        f"👨‍💼 **Case Escalated to Human Support Manager**\n\n"
        f"I have transferred your case to our Senior Customer Support Team.\n\n"
        f"📋 **Case Handoff Reference**: `{ticket_id}`\n"
        f"• **Assigned Account**: `{state.customer_email}`\n"
        f"• **Order ID**: #{state.order_id if state.order_id else 'N/A'}\n"
        f"• **Logistics Context**: {tracking_ctx if tracking_ctx else 'Standard carrier log'}\n"
        f"• **Escalation Reason**: High priority complaint / {state.late_count} late order events detected.\n"
        f"• **Status**: `HUMAN_HANDOFF_OPEN`\n\n"
        f"A human support supervisor is reviewing your full interaction history, tool logs, and policy options right now. "
        f"They will respond directly in this chat session shortly."
    )

    log_entry = {
        "step": "Human Handoff (Interrupt)",
        "ticket_id": ticket_id,
        "escalated": True
    }

    return {
        "is_escalated": True,
        "handoff_summary": handoff_summary,
        "final_response": customer_response,
        "actions_log": state.actions_log + [log_entry]
    }
