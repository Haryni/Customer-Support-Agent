"""
Order Agent Node — ReAct-Style MCP Tool Caller
===============================================
Handles order lookup, tracking verification, and return initiation.

Architecture:
- Tools are called via the MCP client (mcp_server.mcp_client), NOT
  imported directly. This satisfies the MCP protocol requirement.
- Uses a lightweight ReAct (Reason + Act) loop: the agent first decides
  which tool to call based on intent, calls it via MCP, inspects the
  result, and then optionally calls a second tool before generating the
  final response.
- LLM (Gemini) is used to generate the final customer-facing response
  when available, falling back to a structured template.

Security Guardrail: Must verify order ID belongs to conversation customer email.
Policy Guardrail:   Must ensure policy_confirmed is True before calling initiate_return.
"""
from agent.state import AgentState
from agent.llm_client import llm_generate, is_llm_available
from mcp_server.mcp_client import mcp_get_order, mcp_track_shipment, mcp_initiate_return


def order_agent_node(state: AgentState) -> dict:
    """
    Order Agent — ReAct loop:
    Step 1 (Reason): Identify required tools based on intent.
    Step 2 (Act):    Call tool(s) via MCP client.
    Step 3 (Reason): Inspect results, decide if a second tool is needed.
    Step 4 (Act):    Call secondary tool if required.
    Step 5 (Respond): Generate final response via LLM or template.
    """
    order_id = state.order_id
    if not order_id:
        return {
            "final_response": (
                "Please provide your 5-digit Order ID (e.g. #10245) so I can look up your order details."
            ),
            "actions_log": state.actions_log + [{"step": "Order Agent", "error": "Missing order ID"}],
        }

    user_email = state.customer_email
    tool_calls = []

    # -------------------------------------------------------------------
    # ReAct Step 1+2: get_order via MCP (always the first action)
    # -------------------------------------------------------------------
    order_res = mcp_get_order(order_id=order_id, user_email=user_email)
    tool_calls.append("mcp_get_order")

    if not order_res["success"]:
        if order_res.get("guardrail_triggered"):
            resp = (
                f"🛡️ **Security Guardrail Notice**: Access denied. "
                f"Order #{order_id} does not belong to the active email address ({user_email}). "
                "To protect customer privacy, order details cannot be displayed across different accounts."
            )
            return {
                "final_response": resp,
                "actions_log": state.actions_log + [{"step": "Order Agent (MCP)", "guardrail_blocked": True}],
            }
        return {
            "final_response": (
                f"I checked our database, but Order #{order_id} could not be found. "
                "Please double-check the order number."
            ),
            "actions_log": state.actions_log + [{"step": "Order Agent (MCP)", "found": False}],
        }

    order_info = order_res["order"]
    items_info = order_res["items"]
    items_summary = ", ".join(
        [f"{it['quantity']}x {it['product_name']} (${it['price']})" for it in items_info]
    )

    final_resp = ""

    # -------------------------------------------------------------------
    # ReAct Step 3+4: decide secondary tool call
    # -------------------------------------------------------------------
    if state.intent == "RETURN_REQUEST":
        if not state.policy_confirmed:
            final_resp = (
                f"⚠️ **Policy Pre-Check Constraint**: Return execution requires policy confirmation. "
                f"Order #{order_id} is being evaluated against ApexCart return guidelines..."
            )
        else:
            # Act: call initiate_return via MCP
            first_item_id = items_info[0]["item_id"] if items_info else "ITEM-1"
            ret_res = mcp_initiate_return(
                order_id=order_id,
                item_id=first_item_id,
                reason="Customer requested return via Support Agent",
                user_email=user_email,
            )
            tool_calls.append("mcp_initiate_return")

            if ret_res["success"]:
                template = (
                    f"📦 **Return Request Successfully Initiated!**\n\n"
                    f"• **RMA Tracking Code**: `{ret_res['rma_code']}`\n"
                    f"• **Order ID**: #{order_id}\n"
                    f"• **Item**: {ret_res['item_name']}\n"
                    f"• **Refund Amount**: ${ret_res['refund_amount']:.2f}\n"
                    f"• **Policy Citation**: {ret_res['policy_citation']}\n\n"
                    f"**Next Steps**:\n"
                    f"1. Download your prepaid return label: [Download Return Label]({ret_res['return_label_url']})\n"
                    f"2. {ret_res['instructions']}\n"
                    f"3. Your refund of ${ret_res['refund_amount']:.2f} will post to your original "
                    f"payment method within 5-7 business days after drop-off scan."
                )
                # ReAct Step 5: LLM polishes the response
                if is_llm_available():
                    final_resp = llm_generate(
                        system_prompt=(
                            "You are an ApexCart support agent. A return has been successfully initiated. "
                            "Confirm the return details warmly and professionally, citing the policy. "
                            "Keep it concise. Use Markdown."
                        ),
                        user_content=f"Return initiated for Order #{order_id}.",
                        context={
                            "rma_code": ret_res["rma_code"],
                            "item": ret_res["item_name"],
                            "refund_amount": ret_res["refund_amount"],
                            "policy_citation": ret_res["policy_citation"],
                            "return_label_url": ret_res["return_label_url"],
                            "instructions": ret_res["instructions"],
                        },
                        fallback=template,
                    )
                else:
                    final_resp = template
            else:
                final_resp = f"Return Initiation Failed: {ret_res.get('reason', 'Policy constraint error.')}"

    else:
        # Act: call track_shipment via MCP
        track_res = mcp_track_shipment(order_id)
        tool_calls.append("mcp_track_shipment")

        if track_res["success"]:
            shipment = track_res["shipment"]
            checkpoints = shipment.get("checkpoints", [])
            latest_check = checkpoints[-1] if checkpoints else {
                "event": shipment["status"],
                "location": shipment["current_location"],
            }
            template = (
                f"📦 **Order Status & Shipment Details for #{order_id}**\n\n"
                f"• **Order Date**: {order_info['order_date']}\n"
                f"• **Status**: `{order_info['status']}`\n"
                f"• **Items**: {items_summary}\n"
                f"• **Total Paid**: ${order_info['total_amount']:.2f}\n"
                f"• **Shipping Address**: {order_info['shipping_address']}\n\n"
                f"🚚 **Shipment Tracking ({shipment['carrier']})**:\n"
                f"• **Tracking Number**: `{shipment['tracking_number']}`\n"
                f"• **Current Status**: {shipment['status']}\n"
                f"• **Current Location**: {shipment['current_location']}\n"
                f"• **Estimated Delivery**: **{shipment['estimated_delivery']}**\n"
                f"• **Latest Movement**: *{latest_check.get('event')}* at "
                f"{latest_check.get('location')} ({latest_check.get('time', '')})"
            )
            # ReAct Step 5: LLM enriches the tracking response
            if is_llm_available():
                final_resp = llm_generate(
                    system_prompt=(
                        "You are an ApexCart support agent. Provide a warm, helpful shipment update "
                        "using the structured data. Mention the carrier, status, and ETA clearly. "
                        "Keep it under 200 words. Use Markdown."
                    ),
                    user_content=f"Customer asked about order #{order_id}.",
                    context={
                        "order_id": order_id,
                        "status": order_info["status"],
                        "items": items_summary,
                        "carrier": shipment["carrier"],
                        "tracking_number": shipment["tracking_number"],
                        "current_location": shipment["current_location"],
                        "estimated_delivery": shipment["estimated_delivery"],
                        "latest_event": latest_check.get("event"),
                    },
                    fallback=template,
                )
            else:
                final_resp = template
        else:
            template = (
                f"📋 **Order Summary for #{order_id}**\n\n"
                f"• **Order Date**: {order_info['order_date']}\n"
                f"• **Status**: `{order_info['status']}`\n"
                f"• **Items**: {items_summary}\n"
                f"• **Total**: ${order_info['total_amount']:.2f}\n"
                f"*(Note: Carrier tracking scan is being prepared)*"
            )
            final_resp = template

    log_entry = {
        "step": "Order Agent (MCP ReAct)",
        "tools_executed": tool_calls,
        "order_id": order_id,
        "llm_used": is_llm_available(),
    }

    return {
        "final_response": final_resp,
        "actions_log": state.actions_log + [log_entry],
    }
