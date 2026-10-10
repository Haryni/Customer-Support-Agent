"""
Policy Agent Node
=================
Queries the RAG Knowledge Base for company policies and FAQs.
Validates return eligibility before allowing the Order Agent to execute initiate_return.

Improvements:
- Order lookup uses the MCP client (not direct import).
- RAG retrieval now uses TF-IDF vector similarity (see knowledge_base/rag_engine.py).
- LLM (Gemini) generates natural-language policy answers when available.
"""
from agent.state import AgentState
from agent.llm_client import llm_generate, is_llm_available
from knowledge_base.rag_engine import rag_engine
from mcp_server.mcp_client import mcp_get_order


def policy_agent_node(state: AgentState) -> dict:
    """
    Policy Agent Node:
    1. Vector-search RAG knowledge base (TF-IDF cosine similarity).
    2. For RETURN_REQUEST: validate eligibility via rag_engine.check_return_eligibility().
    3. Generate final policy response via LLM or structured template.
    """
    last_user_msg = ""
    for msg in reversed(state.messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    # RAG vector retrieval (TF-IDF cosine similarity)
    rag_results = rag_engine.search_policy(last_user_msg, top_k=3)
    citations = [f"[{r['title']}]" for r in rag_results]

    policy_confirmed = False
    policy_response = ""

    # ------------------------------------------------------------------
    # Return eligibility validation path
    # ------------------------------------------------------------------
    if state.intent == "RETURN_REQUEST" and state.order_id:
        order_res = mcp_get_order(state.order_id, user_email=state.customer_email)

        if not order_res["success"]:
            if order_res.get("guardrail_triggered"):
                policy_response = (
                    f"🛡️ **Security Guardrail Notice**: Access denied. "
                    f"Order #{state.order_id} does not belong to your verified email address "
                    f"({state.customer_email}). Under our privacy policy, details cannot be shared."
                )
            else:
                policy_response = (
                    f"I retrieved our return policies {citations[0] if citations else ''}, "
                    f"but I could not locate Order #{state.order_id} under your account."
                )
        else:
            order = order_res["order"]
            items = order_res["items"]
            item = items[0] if items else {}
            item_name = item.get("product_name", "Purchased Item")

            is_eligible, reason, citation = rag_engine.check_return_eligibility(
                order_date_str=order["order_date"],
                category=item.get("category", "General"),
                is_returnable=bool(item.get("is_returnable", 1)),
            )

            if is_eligible:
                policy_confirmed = True
                template = (
                    f"✅ **Return Eligibility Confirmed** ({citation}):\n\n"
                    f"Your item **{item_name}** (Order #{state.order_id}, purchased on {order['order_date']}) "
                    f"is fully eligible for return within our 30-day policy window.\n\n"
                    f"Proceeding to generate your prepaid return label now..."
                )
                if is_llm_available():
                    policy_response = llm_generate(
                        system_prompt=(
                            "You are an ApexCart policy agent. Confirm return eligibility clearly "
                            "and reassure the customer. Cite the policy section. Be concise."
                        ),
                        user_content=last_user_msg,
                        context={
                            "item": item_name,
                            "order_id": state.order_id,
                            "order_date": order["order_date"],
                            "policy_citation": citation,
                            "eligible": True,
                        },
                        fallback=template,
                    )
                else:
                    policy_response = template
            else:
                template = (
                    f"❌ **Return Eligibility Decision** ({citation}):\n\n"
                    f"Unfortunately, your return request for **{item_name}** (Order #{state.order_id}) "
                    f"cannot be automatically processed:\n"
                    f"• **Reason**: {reason}\n"
                    f"• **Policy Guidelines**: Non-Returnable Items & Return Window policies apply.\n\n"
                    f"Per company policy, our standard system cannot issue return labels past the authorized limits. "
                    f"If you believe an exception should be reviewed, I can connect you with a human support manager."
                )
                if is_llm_available():
                    policy_response = llm_generate(
                        system_prompt=(
                            "You are an ApexCart policy agent. Politely explain why the return is ineligible, "
                            "cite the exact policy section, and offer the human escalation option."
                        ),
                        user_content=last_user_msg,
                        context={
                            "item": item_name,
                            "order_id": state.order_id,
                            "reason": reason,
                            "policy_citation": citation,
                            "eligible": False,
                        },
                        fallback=template,
                    )
                else:
                    policy_response = template

    else:
        # ------------------------------------------------------------------
        # Standard policy inquiry answer
        # ------------------------------------------------------------------
        body_snippets = "\n\n".join(
            [f"### {r['title']}\n{r['content']}" for r in rag_results]
        )
        template = (
            f"Here is the relevant policy information from our ApexCart Knowledge Base:\n\n"
            f"{body_snippets}\n\n"
            f"*(Citations: {', '.join(citations)})*"
        )
        if is_llm_available():
            policy_response = llm_generate(
                system_prompt=(
                    "You are an ApexCart policy expert. Answer the customer's question using ONLY "
                    "the policy excerpts provided in the context. Be accurate, cite section names, "
                    "and keep your answer under 200 words."
                ),
                user_content=last_user_msg,
                context={"policy_excerpts": [{"title": r["title"], "content": r["content"]} for r in rag_results]},
                fallback=template,
            )
        else:
            policy_response = template

    log_entry = {
        "step": "Policy Agent (TF-IDF RAG + LLM)",
        "policy_citations": citations,
        "policy_confirmed": policy_confirmed,
        "llm_used": is_llm_available(),
        "response_summary": policy_response[:100] + "...",
    }

    return {
        "policy_confirmed": policy_confirmed,
        "final_response": policy_response,
        "actions_log": state.actions_log + [log_entry],
    }
