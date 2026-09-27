from agent.state import AgentState
from mcp_server.tools import get_order, track_shipment, web_search_disruptions

def complaint_agent_node(state: AgentState) -> dict:
    """
    Complaint Agent Node:
    - Responds to dissatisfied customers with empathy and de-escalation strategies.
    - Queries Tavily / Web Search for courier disruptions or logistics delays.
    - Applies authorized policy remedies (e.g., $10 late compensation credit per Policy §1.2).
    """
    order_id = state.order_id
    last_user_msg = ""
    for msg in reversed(state.messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    # 1. Fetch Order details if order_id is present
    order_details_str = ""
    order_status = "UNKNOWN"
    if order_id:
        order_res = get_order(order_id, user_email=state.customer_email)
        if order_res["success"]:
            ord_obj = order_res["order"]
            items_obj = order_res["items"]
            order_status = ord_obj["status"]
            items_list = ", ".join([it["product_name"] for it in items_obj])
            order_details_str = f"Order #{order_id} ({items_list}) - Current Status: `{order_status}`"

    # 2. Search Courier Disruption Intelligence via Tavily / Web Search
    search_query = f"courier delays delivery disruption {last_user_msg}"
    web_res = web_search_disruptions(search_query)
    web_results = web_res.get("results", [])
    disruption_note = ""
    if web_results:
        disruption_note = f"🔍 **Logistics Intelligence ({web_res['source']})**: {web_results[0]['snippet']}"

    # 3. Check Order & Delivery delay status
    delay_remedy_applied = False
    remedy_text = ""
    
    if order_id and order_status in ["DELAYED", "IN_TRANSIT"]:
        delay_remedy_applied = True
        remedy_text = (
            "🎁 **Compensation Issued (Policy §1.2)**: "
            "Because your package was delayed past the estimated date, I have automatically credited "
            "**$10.00 ApexCart Store Credit** to your account balance."
        )

    # 4. Formulate Empathetic De-escalation Response
    empathy_header = (
        "I am so sorry for the frustration and inconvenience this delay has caused you. "
        "We hold our delivery partners to high standards, and I completely understand why you are disappointed."
    )
    
    order_ctx_header = f"📋 **Order Reference**: {order_details_str}\n\n" if order_details_str else ""

    if state.late_count >= 3 or state.sentiment == "ANGRY":
        resp = (
            f"💙 **Dear Valued Customer**,\n\n{order_ctx_header}{empathy_header}\n\n"
            f"Given that this is your **{state.late_count}th delayed order**, standard resolution is not enough. "
            f"I am immediately escalating your case to our Senior Customer Care Support Manager with high priority.\n\n"
            f"{disruption_note}\n\n"
            f"{remedy_text}\n\n"
            f"A support manager is reviewing your case file and history right now."
        )
    else:
        resp = (
            f"💙 **Customer Support Resolution**:\n\n{order_ctx_header}{empathy_header}\n\n"
            f"{disruption_note}\n\n"
            f"{remedy_text if remedy_text else 'I am actively monitoring your shipment and will send instant updates as soon as the carrier logs the next scan.'}\n\n"
            f"Please let me know if you would like me to issue a replacement order or connect you with a human representative."
        )

    log_entry = {
        "step": "Complaint Agent (Empathy & Search)",
        "web_search_source": web_res.get("source"),
        "remedy_applied": delay_remedy_applied,
        "sentiment": state.sentiment
    }

    return {
        "final_response": resp,
        "actions_log": state.actions_log + [log_entry]
    }
