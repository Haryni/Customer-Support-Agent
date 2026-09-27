import re
import sqlite3
import os
from agent.state import AgentState

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "ecommerce.db")

def triage_node(state: AgentState) -> dict:
    """
    Triage Router Node:
    - Analyzes incoming user prompt for intent, sentiment, and order IDs.
    - Inspects customer history (late delivery count, previous complaints).
    - Checks escalation triggers (angry sentiment, 3+ late orders, human request).
    """
    last_user_msg = ""
    for msg in reversed(state.messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    query_lower = last_user_msg.lower()
    
    # 1. Extract Order ID if present in prompt (e.g., #10245, order 10245, 10245)
    order_id = state.order_id
    order_match = re.search(r'#?(\d{5})', last_user_msg)
    if order_match:
        order_id = order_match.group(1)

    # 2. Check Customer History in SQLite
    late_count = 0
    if state.customer_email:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(late_count) as total_late FROM orders WHERE customer_email = ?", (state.customer_email,))
        row = cursor.fetchone()
        if row and row["total_late"]:
            late_count = row["total_late"]
            
        if order_id:
            cursor.execute("SELECT late_count FROM orders WHERE order_id = ?", (order_id,))
            ord_row = cursor.fetchone()
            if ord_row and ord_row["late_count"]:
                late_count = max(late_count, ord_row["late_count"])
        conn.close()

    # 3. Sentiment Analysis
    sentiment = "NEUTRAL"
    angry_keywords = ["angry", "upset", "horrible", "terrible", "third time", "3rd time", "manager", "unacceptable", "furious", "worst", "hate", "lawyer", "scam"]
    negative_keywords = ["late", "delayed", "missing", "broken", "wrong", "fail", "slow", "disappointed", "refund"]
    positive_keywords = ["thanks", "thank you", "great", "helpful", "awesome", "good"]

    if any(k in query_lower for k in angry_keywords):
        sentiment = "ANGRY"
    elif any(k in query_lower for k in negative_keywords):
        sentiment = "NEGATIVE"
    elif any(k in query_lower for k in positive_keywords):
        sentiment = "POSITIVE"

    # 4. Intent Classification
    human_triggers = ["manager", "human", "speak to a person", "agent", "supervisor", "representative", "customer service agent"]
    wants_human = any(t in query_lower for t in human_triggers)

    intent = "UNKNOWN"
    if wants_human:
        intent = "ESCALATION"
    elif any(k in query_lower for k in ["return", "exchange", "send back", "bring back"]):
        intent = "RETURN_REQUEST"
    elif any(k in query_lower for k in ["where", "tracking", "status", "shipment", "located", "arrived", "deliver"]):
        intent = "TRACK_SHIPMENT" if "track" in query_lower else "ORDER_STATUS"
    elif any(k in query_lower for k in ["policy", "warranty", "rule", "days to return", "how long", "faq", "guarantee"]):
        intent = "POLICY_INQUIRY"
    elif any(k in query_lower for k in ["refund", "money", "late", "delay", "damaged", "complaint", "issue"]):
        intent = "COMPLAINT"
    else:
        intent = "ORDER_STATUS" if order_id else "POLICY_INQUIRY"

    # 5. Escalation Trigger Logic
    # Trigger conditions:
    # a) Explicit human/manager request
    # b) Angry sentiment or (Negative sentiment AND late_count >= 3)
    # c) Repeated complaints for same order
    should_escalate = False
    escalation_reason = ""

    if wants_human:
        should_escalate = True
        escalation_reason = "Customer explicitly requested manager / human agent intervention."
    elif late_count >= 3:
        should_escalate = True
        escalation_reason = f"Customer has experienced {late_count} repeated order delays (Threshold >= 3)."
    elif sentiment == "ANGRY" and ("late" in query_lower or "refund" in query_lower or "third" in query_lower or "3rd" in query_lower):
        should_escalate = True
        escalation_reason = "High dissatisfaction detected combined with late delivery/refund complaint."

    log_entry = {
        "step": "Triage Router",
        "detected_intent": intent,
        "detected_sentiment": sentiment,
        "extracted_order_id": order_id,
        "late_count": late_count,
        "escalation_triggered": should_escalate,
        "escalation_reason": escalation_reason
    }

    return {
        "order_id": order_id,
        "intent": intent,
        "sentiment": sentiment,
        "late_count": late_count,
        "is_escalated": should_escalate,
        "actions_log": state.actions_log + [log_entry]
    }
