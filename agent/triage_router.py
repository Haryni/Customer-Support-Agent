"""
Triage Router Node
==================
Analyzes incoming user messages for intent, sentiment, and order IDs.
Inspects customer history (late delivery count, previous complaints).
Checks escalation triggers.

When a Google Gemini API key is configured the triage uses the LLM for
intent and sentiment classification, falling back to rule-based logic
if the LLM is unavailable or returns an unrecognised label.
"""
import re
import json
import sqlite3
import os
from agent.state import AgentState
from agent.llm_client import llm_generate, is_llm_available

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "ecommerce.db")

VALID_INTENTS = {"ORDER_STATUS", "TRACK_SHIPMENT", "RETURN_REQUEST", "POLICY_INQUIRY", "COMPLAINT", "ESCALATION", "UNKNOWN"}
VALID_SENTIMENTS = {"POSITIVE", "NEUTRAL", "NEGATIVE", "ANGRY"}

# ---------------------------------------------------------------------------
# Rule-based fallback helpers
# ---------------------------------------------------------------------------
def _rule_based_intent(query_lower: str, order_id) -> str:
    human_triggers = ["manager", "human", "speak to a person", "agent", "supervisor", "representative", "customer service agent"]
    if any(t in query_lower for t in human_triggers):
        return "ESCALATION"
    if any(k in query_lower for k in ["return", "exchange", "send back", "bring back"]):
        return "RETURN_REQUEST"
    if any(k in query_lower for k in ["where", "tracking", "status", "shipment", "located", "arrived", "deliver"]):
        return "TRACK_SHIPMENT" if "track" in query_lower else "ORDER_STATUS"
    if any(k in query_lower for k in ["policy", "warranty", "rule", "days to return", "how long", "faq", "guarantee"]):
        return "POLICY_INQUIRY"
    if any(k in query_lower for k in ["refund", "money", "late", "delay", "damaged", "complaint", "issue"]):
        return "COMPLAINT"
    return "ORDER_STATUS" if order_id else "POLICY_INQUIRY"


def _rule_based_sentiment(query_lower: str) -> str:
    angry_keywords = ["angry", "upset", "horrible", "terrible", "third time", "3rd time", "manager", "unacceptable", "furious", "worst", "hate", "lawyer", "scam"]
    negative_keywords = ["late", "delayed", "missing", "broken", "wrong", "fail", "slow", "disappointed", "refund"]
    positive_keywords = ["thanks", "thank you", "great", "helpful", "awesome", "good"]
    if any(k in query_lower for k in angry_keywords):
        return "ANGRY"
    if any(k in query_lower for k in negative_keywords):
        return "NEGATIVE"
    if any(k in query_lower for k in positive_keywords):
        return "POSITIVE"
    return "NEUTRAL"


# ---------------------------------------------------------------------------
# LLM-based classification (runs when Gemini key is configured)
# ---------------------------------------------------------------------------
def _llm_classify(query: str) -> tuple:
    """
    Use Gemini to classify intent and sentiment in a single API call.
    Returns (intent, sentiment) or (None, None) on failure/parse error.
    """
    system = (
        "You are a customer support triage classifier. "
        "Classify the customer message and respond ONLY with a JSON object "
        "containing exactly two keys: 'intent' and 'sentiment'.\n\n"
        "Valid 'intent' values: ORDER_STATUS, TRACK_SHIPMENT, RETURN_REQUEST, "
        "POLICY_INQUIRY, COMPLAINT, ESCALATION\n"
        "Valid 'sentiment' values: POSITIVE, NEUTRAL, NEGATIVE, ANGRY\n\n"
        "Rules:\n"
        "- Use ESCALATION if customer asks for a human/manager/supervisor.\n"
        "- Use ANGRY sentiment for hostile, threatening, or extremely frustrated messages.\n"
        "- Output ONLY the JSON. No explanation, no markdown."
    )
    raw = llm_generate(system_prompt=system, user_content=query)
    try:
        # Strip markdown code fences if present
        clean = raw.strip().strip("```json").strip("```").strip()
        data = json.loads(clean)
        intent = data.get("intent", "").upper()
        sentiment = data.get("sentiment", "").upper()
        if intent in VALID_INTENTS and sentiment in VALID_SENTIMENTS:
            return intent, sentiment
    except Exception:
        pass
    return None, None


# ---------------------------------------------------------------------------
# Main node
# ---------------------------------------------------------------------------
def triage_node(state: AgentState) -> dict:
    """
    Triage Router Node:
    - Extracts order ID from message via regex.
    - Inspects customer history (late delivery count) from SQLite.
    - Classifies intent and sentiment via LLM (Gemini) when available,
      falling back to rule-based keyword matching.
    - Checks escalation triggers: angry sentiment, 3+ late orders, or
      explicit human-agent request.
    """
    last_user_msg = ""
    for msg in reversed(state.messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    query_lower = last_user_msg.lower()

    # 1. Extract Order ID (e.g. #10245, order 10245)
    order_id = state.order_id
    order_match = re.search(r"#?(\d{5})", last_user_msg)
    if order_match:
        order_id = order_match.group(1)

    # 2. Customer history from SQLite
    late_count = 0
    if state.customer_email:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT SUM(late_count) as total_late FROM orders WHERE customer_email = ?",
            (state.customer_email,),
        )
        row = cursor.fetchone()
        if row and row["total_late"]:
            late_count = row["total_late"]

        if order_id:
            cursor.execute("SELECT late_count FROM orders WHERE order_id = ?", (order_id,))
            ord_row = cursor.fetchone()
            if ord_row and ord_row["late_count"]:
                late_count = max(late_count, ord_row["late_count"])
        conn.close()

    # 3. Intent & Sentiment Classification
    intent, sentiment = None, None
    llm_used = False

    if is_llm_available():
        intent, sentiment = _llm_classify(last_user_msg)
        if intent and sentiment:
            llm_used = True

    # Fallback to rule-based if LLM unavailable or returned invalid label
    if not intent:
        intent = _rule_based_intent(query_lower, order_id)
    if not sentiment:
        sentiment = _rule_based_sentiment(query_lower)

    # 4. Escalation trigger logic
    wants_human = any(
        t in query_lower
        for t in ["manager", "human", "speak to a person", "agent", "supervisor", "representative"]
    )

    should_escalate = False
    escalation_reason = ""

    if wants_human or intent == "ESCALATION":
        should_escalate = True
        escalation_reason = "Customer explicitly requested manager / human agent intervention."
        intent = "ESCALATION"
    elif late_count >= 3:
        should_escalate = True
        escalation_reason = f"Customer has experienced {late_count} repeated order delays (Threshold >= 3)."
    elif sentiment == "ANGRY" and any(
        k in query_lower for k in ["late", "refund", "third", "3rd", "delay"]
    ):
        should_escalate = True
        escalation_reason = "High dissatisfaction detected combined with late delivery/refund complaint."

    log_entry = {
        "step": "Triage Router",
        "detected_intent": intent,
        "detected_sentiment": sentiment,
        "extracted_order_id": order_id,
        "late_count": late_count,
        "classification_method": "LLM (Gemini)" if llm_used else "Rule-based (fallback)",
        "escalation_triggered": should_escalate,
        "escalation_reason": escalation_reason,
    }

    return {
        "order_id": order_id,
        "intent": intent,
        "sentiment": sentiment,
        "late_count": late_count,
        "is_escalated": should_escalate,
        "actions_log": state.actions_log + [log_entry],
    }
