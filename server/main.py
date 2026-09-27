import sqlite3
import os
import json
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.graph import support_graph
from evaluation.evaluator import Evaluator
from mcp_server.tools import get_order, track_shipment, initiate_return, web_search_disruptions

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "ecommerce.db")

app = FastAPI(
    title="ApexCart E-Commerce Customer Support Agent API",
    description="Multi-Agent Support Architecture with LangGraph, MCP Tools, RAG, and Human Handoff",
    version="1.0.0"
)

# Enable CORS for frontend web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    customer_email: str = "alex.rivera@example.com"
    order_id: Optional[str] = None
    messages_history: Optional[list] = None

class TicketResolveRequest(BaseModel):
    action: str # "APPROVE_REFUND", "GRANT_CREDIT", "RESPOND_CUSTOMER"
    notes: Optional[str] = ""

@app.get("/api/health")
def health_check():
    return {"status": "online", "system": "ApexCart AI Agent Engine v1.0"}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    history = req.messages_history or []
    history.append({"role": "user", "content": req.message})

    state_input = {
        "messages": history,
        "customer_email": req.customer_email,
        "order_id": req.order_id
    }

    output_state = support_graph.run(state_input)
    return output_state

@app.get("/api/orders")
def get_sample_orders(email: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if email:
        cursor.execute("SELECT * FROM orders WHERE customer_email = ? ORDER BY id DESC LIMIT 20", (email,))
    else:
        cursor.execute("SELECT * FROM orders ORDER BY id ASC LIMIT 25")
        
    orders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"orders": orders}

@app.get("/api/tickets")
def get_escalated_tickets():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM escalated_tickets ORDER BY id DESC")
    tickets = []
    for row in cursor.fetchall():
        t_dict = dict(row)
        try:
            t_dict["summary_obj"] = json.loads(t_dict["summary"])
        except Exception:
            t_dict["summary_obj"] = {}
        tickets.append(t_dict)
    conn.close()
    return {"tickets": tickets}

@app.post("/api/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, req: TicketResolveRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE escalated_tickets SET status = 'RESOLVED', recommended_action = ? WHERE ticket_id = ?",
        (f"RESOLVED ({req.action}): {req.notes}", ticket_id)
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Ticket {ticket_id} resolved with action {req.action}"}

@app.post("/api/benchmark/run")
def run_benchmark():
    evaluator = Evaluator()
    report = evaluator.run_evaluations()
    return report

@app.get("/api/mcp/tools")
def get_mcp_tools():
    return {
        "tools": [
            {
                "name": "get_order",
                "description": "Returns order details, items, customer info and status for an order ID. Enforces security guardrails.",
                "parameters": {"order_id": "string", "user_email": "string"}
            },
            {
                "name": "track_shipment",
                "description": "Returns shipment location, carrier, status, estimated delivery date, and tracking checkpoints.",
                "parameters": {"order_id": "string"}
            },
            {
                "name": "initiate_return",
                "description": "Creates a return request RMA if eligible under company policy. Requires policy validation.",
                "parameters": {"order_id": "string", "item_id": "string", "reason": "string", "user_email": "string"}
            },
            {
                "name": "tavily_web_search",
                "description": "Queries courier service disruptions, weather alerts, carrier strikes, and product recall notices.",
                "parameters": {"query": "string"}
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
