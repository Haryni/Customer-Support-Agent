from agent.state import AgentState
from mcp_server.tools import get_order, track_shipment, initiate_return

def order_agent_node(state: AgentState) -> dict:
    """
    Order Agent Node:
    - Handles order lookup, tracking verification, and return initiation via MCP server tools.
    - Security Guardrail: Must verify order ID belongs to conversation customer email.
    - Policy Guardrail: Must ensure policy_confirmed is True before calling initiate_return.
    """
    order_id = state.order_id
    if not order_id:
        return {
            "final_response": "Please provide your 5-digit Order ID (e.g. #10245) so I can look up your order details.",
            "actions_log": state.actions_log + [{"step": "Order Agent", "error": "Missing order ID"}]
        }

    user_email = state.customer_email

    # 1. Ownership & Order Lookup via MCP Tool get_order
    order_res = get_order(order_id=order_id, user_email=user_email)
    
    if not order_res["success"]:
        if order_res.get("guardrail_triggered"):
            # Guardrail Violation Response
            resp = (
                f"🛡️ **Security Guardrail Notice**: Access denied. "
                f"Order #{order_id} does not belong to the active email address ({user_email}). "
                f"To protect customer privacy, order details cannot be displayed across different accounts."
            )
            return {
                "final_response": resp,
                "actions_log": state.actions_log + [{"step": "Order Agent", "guardrail_blocked": True}]
            }
        else:
            return {
                "final_response": f"I checked our database, but Order #{order_id} could not be found. Please double-check the order number.",
                "actions_log": state.actions_log + [{"step": "Order Agent", "found": False}]
            }

    order_info = order_res["order"]
    items_info = order_res["items"]
    items_summary = ", ".join([f"{it['quantity']}x {it['product_name']} (${it['price']})" for it in items_info])

    # 2. Process according to intent
    final_resp = ""
    tool_calls = []

    if state.intent == "RETURN_REQUEST":
        # Check Policy Agent Confirmation Constraint
        if not state.policy_confirmed:
            final_resp = (
                f"⚠️ **Policy Pre-Check Constraint**: Return execution requires policy confirmation. "
                f"Order #{order_id} is being evaluated against ApexCart return guidelines..."
            )
        else:
            # Execute initiate_return MCP Tool
            first_item_id = items_info[0]["item_id"] if items_info else "ITEM-1"
            ret_res = initiate_return(
                order_id=order_id,
                item_id=first_item_id,
                reason="Customer requested return via Support Agent",
                user_email=user_email
            )
            
            tool_calls.append("initiate_return")
            
            if ret_res["success"]:
                final_resp = (
                    f"📦 **Return Request Successfully Initiated!**\n\n"
                    f"• **RMA Tracking Code**: `{ret_res['rma_code']}`\n"
                    f"• **Order ID**: #{order_id}\n"
                    f"• **Item**: {ret_res['item_name']}\n"
                    f"• **Refund Amount**: ${ret_res['refund_amount']:.2f}\n"
                    f"• **Policy Citation**: {ret_res['policy_citation']}\n\n"
                    f"**Next Steps**:\n"
                    f"1. Download your prepaid return label: [Download Return Label]({ret_res['return_label_url']})\n"
                    f"2. {ret_res['instructions']}\n"
                    f"3. Your refund of ${ret_res['refund_amount']:.2f} will post to your original payment method within 5-7 business days after drop-off scan."
                )
            else:
                final_resp = f"Return Initiation Failed: {ret_res.get('reason', 'Policy constraint error.')}"

    elif state.intent in ["TRACK_SHIPMENT", "ORDER_STATUS"] or True:
        # Fetch shipment tracking details via MCP Tool track_shipment
        track_res = track_shipment(order_id)
        tool_calls.append("track_shipment")
        
        if track_res["success"]:
            shipment = track_res["shipment"]
            checkpoints = shipment.get("checkpoints", [])
            latest_check = checkpoints[-1] if checkpoints else {"event": shipment["status"], "location": shipment["current_location"]}
            
            final_resp = (
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
                f"• **Latest Movement**: *{latest_check.get('event')}* at {latest_check.get('location')} ({latest_check.get('time', '')})"
            )
        else:
            final_resp = (
                f"📋 **Order Summary for #{order_id}**\n\n"
                f"• **Order Date**: {order_info['order_date']}\n"
                f"• **Status**: `{order_info['status']}`\n"
                f"• **Items**: {items_summary}\n"
                f"• **Total**: ${order_info['total_amount']:.2f}\n"
                f"*(Note: Carrier tracking scan is being prepared)*"
            )

    log_entry = {
        "step": "Order Agent (MCP)",
        "tools_executed": tool_calls or ["get_order"],
        "order_id": order_id
    }

    return {
        "final_response": final_resp,
        "actions_log": state.actions_log + [log_entry]
    }
