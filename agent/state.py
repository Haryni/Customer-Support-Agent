from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentState(BaseModel):
    """
    Central state object passed between nodes in the LangGraph workflow.
    """
    messages: List[Dict[str, str]] = Field(default_factory=list)
    customer_email: str = "alex.rivera@example.com"
    order_id: Optional[str] = None
    intent: str = "UNKNOWN"
    sentiment: str = "NEUTRAL"
    late_count: int = 0
    repeated_complaint: bool = False
    policy_confirmed: bool = False
    is_escalated: bool = False
    handoff_summary: Optional[Dict[str, Any]] = None
    actions_log: List[Dict[str, Any]] = Field(default_factory=list)
    final_response: str = ""
