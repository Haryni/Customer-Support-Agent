from agent.state import AgentState
from knowledge_base.rag_engine import rag_engine
from mcp_server.tools import get_order

def policy_agent_node(state: AgentState) -> dict:
    """
    Policy Agent Node:
    - Queries RAG Knowledge Base for company policies & FAQs.
    - Validates return eligibility prior to allowing Order Agent to execute initiate_return.
    - Provides authoritative, policy-cited responses.
    """
    last_user_msg = ""
    for msg in reversed(state.messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    # RAG Retrieval
    rag_results = rag_engine.search_policy(last_user_msg, top_k=3)
    citations = [f"[{r['title']}]" for r in rag_results]

    policy_confirmed = False
    policy_response = ""

    # Check Return Eligibility if order_id is present and intent is RETURN_REQUEST
    if state.intent == "RETURN_REQUEST" and state.order_id:
        order_res = get_order(state.order_id, user_email=state.customer_email)
        
        if not order_res["success"]:
            if order_res.get("guardrail_triggered"):
                policy_response = f"🛡️ **Security Guardrail Notice**: Access denied. Order #{state.order_id} does not belong to your verified email address ({state.customer_email}). Under our privacy policy, details cannot be shared."
            else:
                policy_response = f"I retrieved our return policies {citations[0]}, but I could not locate Order #{state.order_id} under your account."
        else:
            order = order_res["order"]
            items = order_res["items"]
            item = items[0] if items else {}
            item_name = item.get("product_name", "Purchased Item")
            
            is_eligible, reason, citation = rag_engine.check_return_eligibility(
                order_date_str=order["order_date"],
                category=item.get("category", "General"),
                is_returnable=bool(item.get("is_returnable", 1))
            )
            
            if is_eligible:
                policy_confirmed = True
                policy_response = (
                    f"✅ **Return Eligibility Confirmed** ({citation}):\n\n"
                    f"Your item **{item_name}** (Order #{state.order_id}, purchased on {order['order_date']}) "
                    f"is fully eligible for return within our 30-day policy window.\n\n"
                    f"Proceeding to generate your prepaid return label now..."
                )
            else:
                policy_response = (
                    f"❌ **Return Eligibility Decision** ({citation}):\n\n"
                    f"Unfortunately, your return request for **{item_name}** (Order #{state.order_id}) cannot be automatically processed:\n"
                    f"• **Reason**: {reason}\n"
                    f"• **Policy Guidelines**: Non-Returnable Items & Return Window policies apply.\n\n"
                    f"Per company policy, our standard system cannot issue return labels past the authorized limits. "
                    f"If you believe an exception should be reviewed, I can connect you with a human support manager."
                )

    else:
        # Standard Policy Inquiry Answer
        body_snippets = "\n\n".join([f"### {r['title']}\n{r['content']}" for r in rag_results])
        policy_response = (
            f"Here is the relevant policy information from our ApexCart Knowledge Base:\n\n"
            f"{body_snippets}\n\n"
            f"*(Citations: {', '.join(citations)})*"
        )

    log_entry = {
        "step": "Policy Agent (RAG)",
        "policy_citations": citations,
        "policy_confirmed": policy_confirmed,
        "response_summary": policy_response[:100] + "..."
    }

    return {
        "policy_confirmed": policy_confirmed,
        "final_response": policy_response,
        "actions_log": state.actions_log + [log_entry]
    }
