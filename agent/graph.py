from typing import Dict, Any
from agent.state import AgentState
from agent.triage_router import triage_node
from agent.policy_agent import policy_agent_node
from agent.order_agent import order_agent_node
from agent.complaint_agent import complaint_agent_node
from agent.human_handoff import human_handoff_node

class SupportAgentGraph:
    """
    LangGraph StateGraph Workflow Orchestrator for E-Commerce Customer Support.
    Orchestration Flow:
    1. Triage Router classifies intent, sentiment, order verification, and escalation flags.
    2. If escalation criteria met (ANGRY sentiment, 3+ late orders, human request) -> Route to Human Handoff Node.
    3. If intent is POLICY_INQUIRY -> Route to Policy Agent.
    4. If intent is RETURN_REQUEST -> Route to Policy Agent (to confirm eligibility) -> then to Order Agent (to initiate return).
    5. If intent is ORDER_STATUS / TRACK_SHIPMENT -> Route to Order Agent.
    6. If intent is COMPLAINT -> Route to Complaint Agent.
    """
    def __init__(self):
        pass

    def run(self, state_dict: Dict[str, Any]) -> Dict[str, Any]:
        state = AgentState(**state_dict)

        # 1. Triage Node Execution
        triage_res = triage_node(state)
        state.order_id = triage_res.get("order_id", state.order_id)
        state.intent = triage_res.get("intent", state.intent)
        state.sentiment = triage_res.get("sentiment", state.sentiment)
        state.late_count = triage_res.get("late_count", state.late_count)
        state.is_escalated = triage_res.get("is_escalated", state.is_escalated)
        state.actions_log = triage_res.get("actions_log", state.actions_log)

        # 2. Check for Human Handoff Escalation Interrupt
        if state.is_escalated:
            handoff_res = human_handoff_node(state)
            state.handoff_summary = handoff_res.get("handoff_summary")
            state.final_response = handoff_res.get("final_response")
            state.actions_log = handoff_res.get("actions_log")
            return state.dict()

        # 3. Route based on intent
        if state.intent == "POLICY_INQUIRY":
            policy_res = policy_agent_node(state)
            state.final_response = policy_res.get("final_response")
            state.actions_log = policy_res.get("actions_log")

        elif state.intent == "RETURN_REQUEST":
            # Step A: Policy Agent must confirm eligibility FIRST
            policy_res = policy_agent_node(state)
            state.policy_confirmed = policy_res.get("policy_confirmed", False)
            state.actions_log = policy_res.get("actions_log")

            if state.policy_confirmed:
                # Step B: Order Agent executes initiate_return tool
                order_res = order_agent_node(state)
                state.final_response = order_res.get("final_response")
                state.actions_log = order_res.get("actions_log")
            else:
                state.final_response = policy_res.get("final_response")

        elif state.intent in ["ORDER_STATUS", "TRACK_SHIPMENT"]:
            order_res = order_agent_node(state)
            state.final_response = order_res.get("final_response")
            state.actions_log = order_res.get("actions_log")

        elif state.intent == "COMPLAINT":
            complaint_res = complaint_agent_node(state)
            state.final_response = complaint_res.get("final_response")
            state.actions_log = complaint_res.get("actions_log")

        else:
            # Fallback to Policy Agent
            policy_res = policy_agent_node(state)
            state.final_response = policy_res.get("final_response")
            state.actions_log = policy_res.get("actions_log")

        return state.model_dump()

# Instantiated Workflow Engine
support_graph = SupportAgentGraph()

if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print("Testing SupportAgentGraph workflow...")
    # Test sample query: "Where is my order #10245?"
    test_state = {
        "messages": [{"role": "user", "content": "Where is my order #10245?"}],
        "customer_email": "alex.rivera@example.com"
    }
    result = support_graph.run(test_state)
    print("Intent:", result["intent"])
    print("Response:\n", result["final_response"])
