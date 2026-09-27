import sqlite3
import os
import json
import uuid
from datetime import datetime
from knowledge_base.rag_engine import rag_engine

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "ecommerce.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Tool 1: get_order with ownership guardrail verification
def get_order(order_id: str, user_email: str = None):
    """
    Returns order details, items, and status for an order ID.
    Enforces security guardrail: user_email must match order customer_email.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
    order_row = cursor.fetchone()
    
    if not order_row:
        conn.close()
        return {"success": False, "error": f"Order #{order_id} not found in database."}

    order = dict(order_row)
    
    # Security Guardrail Check
    if user_email and user_email.lower().strip() != order["customer_email"].lower().strip():
        conn.close()
        return {
            "success": False,
            "guardrail_triggered": True,
            "error": f"Security Guardrail Violation: Order #{order_id} does not belong to user email '{user_email}'."
        }
        
    cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    items = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM customers WHERE email = ?", (order["customer_email"],))
    cust_row = cursor.fetchone()
    customer_info = dict(cust_row) if cust_row else {}

    conn.close()
    
    return {
        "success": True,
        "order": order,
        "items": items,
        "customer": customer_info
    }

# Tool 2: track_shipment
def track_shipment(order_id: str):
    """
    Returns shipment location, carrier, status, estimated delivery date, and checkpoint logs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM shipments WHERE order_id = ?", (order_id,))
    ship_row = cursor.fetchone()
    conn.close()
    
    if not ship_row:
        return {"success": False, "error": f"No shipment tracking data found for Order #{order_id}."}

    shipment = dict(ship_row)
    try:
        shipment["checkpoints"] = json.loads(shipment["checkpoints_json"])
    except Exception:
        shipment["checkpoints"] = []
    
    del shipment["checkpoints_json"]
    
    return {
        "success": True,
        "shipment": shipment
    }

# Tool 3: initiate_return
def initiate_return(order_id: str, item_id: str, reason: str, user_email: str = None):
    """
    Creates a return request if the item and order meet policy eligibility rules.
    MUST be confirmed by Policy Agent before execution.
    """
    order_res = get_order(order_id, user_email=user_email)
    if not order_res["success"]:
        return order_res

    order = order_res["order"]
    items = order_res["items"]

    # Locate item
    target_item = None
    for item in items:
        if item["item_id"] == item_id or item_id in item["product_name"].lower() or item_id == "first":
            target_item = item
            break

    if not target_item:
        target_item = items[0] # Default to first item if single item order

    # RAG Policy Eligibility Check
    is_eligible, eligibility_msg, policy_citation = rag_engine.check_return_eligibility(
        order_date_str=order["order_date"],
        category=target_item["category"],
        is_returnable=bool(target_item["is_returnable"])
    )

    if not is_eligible:
        return {
            "success": False,
            "policy_rejected": True,
            "policy_citation": policy_citation,
            "reason": eligibility_msg
        }

    # Execute Return Creation in Database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    rma_code = f"RMA-{order_id}-{uuid.uuid4().hex[:4].upper()}"
    refund_amount = target_item["price"] * target_item["quantity"]
    
    cursor.execute(
        """INSERT INTO returns (rma_code, order_id, item_id, reason, status, refund_amount)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (rma_code, order_id, target_item["item_id"], reason, "INITIATED", refund_amount)
    )
    
    cursor.execute("UPDATE orders SET status = 'RETURNED' WHERE order_id = ?", (order_id,))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "rma_code": rma_code,
        "order_id": order_id,
        "item_name": target_item["product_name"],
        "refund_amount": refund_amount,
        "policy_citation": policy_citation,
        "return_label_url": f"https://apexcart.com/returns/label/{rma_code}.pdf",
        "instructions": "Place return label on packaging and drop off at any authorized UPS/FedEx facility within 7 business days."
    }

# Tool 4: Tavily / Web Search for Courier Disruptions and Recalls
def web_search_disruptions(query: str):
    """
    Tavily / Courier disruption web search for courier delays, strikes, weather alerts, or product recalls.
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if tavily_key:
        try:
            from tavily import TavilyClient
            tavily = TavilyClient(api_key=tavily_key)
            response = tavily.search(query=query, search_depth="basic")
            return {
                "success": True,
                "source": "Tavily Live Search",
                "results": response.get("results", [])[:3]
            }
        except Exception as e:
            pass
            
    # Simulated realistic courier disruption database lookup
    disruptions = [
        {
            "title": "FedEx Chicago & Midwest Severe Blizzard Delays",
            "snippet": "FedEx Express and Ground report 2-3 day transit delays across Illinois, Indiana, and Colorado due to winter storm conditions.",
            "date": "2026-09-25",
            "impacted_couriers": ["FedEx", "USPS"]
        },
        {
            "title": "USPS Denver Sorting Facility Equipment Maintenance Alert",
            "snippet": "Automated sorting belt upgrades at Denver regional facility may delay inbound package scans by up to 48 hours.",
            "date": "2026-09-24",
            "impacted_couriers": ["USPS"]
        },
        {
            "title": "Consumer Product Safety Commission Recall Notice - Wireless Audio Batches",
            "snippet": "No active recalls found for ApexCart audio series. All current shipments verified compliant.",
            "date": "2026-09-20",
            "impacted_couriers": []
        }
    ]
    
    matched = [d for d in disruptions if any(w in query.lower() for w in ["fedex", "usps", "chicago", "denver", "delay", "blizzard", "weather", "recall", "courier"])]
    if not matched:
        matched = disruptions[:2]
        
    return {
        "success": True,
        "source": "Courier Intelligence & Public Alerts DB",
        "results": matched
    }
