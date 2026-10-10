"""
Complaint Agent Node
====================
Responds to dissatisfied customers with empathy and de-escalation.

Improvements:
- Tools called via MCP client (not direct import).
- LLM (Gemini) generates the final empathetic response when available.
- Queries Tavily / courier disruption DB via MCP web_search tool.
- Applies $10 late compensation credit per Policy §1.2.
"""
from agent.state import AgentState
from agent.llm_client import llm_generate, is_llm_available
from mcp_server.mcp_client import mcp_get_order, mcp_web_search


def complaint_agent_node(state: AgentState) -> dict:
    """
    Complaint Agent Node:
    1. Fetch order details via MCP get_order.
    2. Search courier disruptions via MCP web_search (Tavily fallback).
    3. Apply $10 credit remedy for delayed orders (Policy §1.2).
    4. Generate empathetic response via LLM or structured template.
    """
    order_id = state.order_id
    last_user_msg = ""
    for msg in reversed(state.messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    # 1. Fetch Order details via MCP
    order_details_str = ""
    order_status = "UNKNOWN"
    items_list_str = ""
    if order_id:
        order_res = mcp_get_order(order_id, user_email=state.customer_email)
        if order_res["success"]:
            ord_obj = order_res["order"]
            items_obj = order_res["items"]
            order_status = ord_obj["status"]
            items_list_str = ", ".join([it["product_name"] for it in items_obj])
            order_details_str = f"Order #{order_id} ({items_list_str}) - Current Status: `{order_status}`"

    # 2. Search Courier Disruption Intelligence via MCP web_search
    search_query = f"courier delays delivery disruption {last_user_msg}"
    web_res = mcp_web_search(search_query)
    web_results = web_res.get("results", [])
    disruption_note = ""
    if web_results:
        disruption_note = f"🔍 **Logistics Intelligence ({web_res['source']})**: {web_results[0]['snippet']}"

    # 3. Check for delay remedy eligibility
    delay_remedy_applied = False
    remedy_text = ""
    if order_id and order_status in ["DELAYED", "IN_TRANSIT"]:
        delay_remedy_applied = True
        remedy_text = (
            "🎁 **Compensation Issued (Policy §1.2)**: "
            "Because your package was delayed past the estimated date, I have automatically credited "
            "**$10.00 ApexCart Store Credit** to your account balance."
        )

    # 4. Generate empathetic response
    order_ctx_header = f"📋 **Order Reference**: {order_details_str}\n\n" if order_details_str else ""
    empathy_header = (
        "I am so sorry for the frustration and inconvenience this delay has caused you. "
        "We hold our delivery partners to high standards, and I completely understand why you are disappointed."
    )

    # Build template (always present as fallback)
    if state.late_count >= 3 or state.sentiment == "ANGRY":
        template = (
            f"💙 **Dear Valued Customer**,\n\n{order_ctx_header}{empathy_header}\n\n"
            f"Given that this is your **{state.late_count}th delayed order**, standard resolution is not enough. "
            "I am immediately escalating your case to our Senior Customer Care Support Manager with high priority.\n\n"
            f"{disruption_note}\n\n"
            f"{remedy_text}\n\n"
            "A support manager is reviewing your case file and history right now."
        )
    else:
        template = (
            f"💙 **Customer Support Resolution**:\n\n{order_ctx_header}{empathy_header}\n\n"
            f"{disruption_note}\n\n"
            f"{remedy_text if remedy_text else 'I am actively monitoring your shipment and will send instant updates as soon as the carrier logs the next scan.'}\n\n"
            "Please let me know if you would like me to issue a replacement order or connect you with a human representative."
        )

    # LLM-generated response (if available)
    if is_llm_available():
        system_prompt = (
            "You are an empathetic ApexCart customer support agent handling a complaint. "
            "Acknowledge the customer's frustration genuinely, provide actionable resolution steps, "
            "and cite any compensation or policy details. Be warm, professional, and concise. "
            "Use Markdown formatting."
        )
        context = {
            "order_reference": order_details_str,
            "disruption_note": disruption_note,
            "remedy_applied": remedy_text or "None",
            "sentiment": state.sentiment,
            "late_count": state.late_count,
        }
        resp = llm_generate(
            system_prompt=system_prompt,
            user_content=last_user_msg,
            context=context,
            fallback=template,
        )
    else:
        resp = template

    log_entry = {
        "step": "Complaint Agent (MCP + LLM)",
        "web_search_source": web_res.get("source"),
        "remedy_applied": delay_remedy_applied,
        "sentiment": state.sentiment,
        "llm_used": is_llm_available(),
    }

    return {
        "final_response": resp,
        "actions_log": state.actions_log + [log_entry],
    }
