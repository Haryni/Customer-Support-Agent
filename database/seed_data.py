import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "ecommerce.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def seed_database():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        cursor.executescript(f.read())

    # Today base date
    today = datetime(2026, 9, 27)

    customers = [
        ("CUST-101", "Alex Rivera", "alex.rivera@example.com", "+1-555-0145"),
        ("CUST-102", "Jordan Lee", "jordan.lee@example.com", "+1-555-0182"),
        ("CUST-103", "Maria Garcia", "maria.garcia@example.com", "+1-555-0199"),
        ("CUST-104", "David Miller", "david.miller@example.com", "+1-555-0211"),
        ("CUST-105", "Sam Wilson", "sam.wilson@example.com", "+1-555-0234"),
        ("CUST-106", "Lisa Chen", "lisa.chen@example.com", "+1-555-0255"),
        ("CUST-107", "Emma Watson", "emma.watson@example.com", "+1-555-0277"),
        ("CUST-108", "James Smith", "james.smith@example.com", "+1-555-0299"),
        ("CUST-109", "Sophia Taylor", "sophia.taylor@example.com", "+1-555-0311"),
        ("CUST-110", "Michael Brown", "michael.brown@example.com", "+1-555-0333"),
    ]

    for c in customers:
        cursor.execute(
            "INSERT INTO customers (customer_id, name, email, phone) VALUES (?, ?, ?, ?)",
            c
        )

    # Specific sample query test orders + general generated orders
    specific_orders = [
        # Order #10245 - Where is my order #10245?
        {
            "order_id": "10245",
            "customer_email": "alex.rivera@example.com",
            "order_date": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
            "status": "IN_TRANSIT",
            "total_amount": 149.99,
            "shipping_address": "742 Evergreen Terrace, Springfield, IL",
            "late_count": 0,
            "items": [
                ("ITEM-10245-1", "Wireless Noise-Canceling Headphones", "Electronics", "AUDIO-NC-001", 1, 149.99, True)
            ],
            "shipment": {
                "carrier": "FedEx",
                "tracking_number": "FX-99823411",
                "status": "IN_TRANSIT",
                "current_location": "Chicago Regional Hub, IL",
                "estimated_delivery": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
                "checkpoints": [
                    {"time": (today - timedelta(days=3)).strftime("%Y-%m-%d 10:00"), "location": "Warehouse, Austin, TX", "event": "Package Picked Up"},
                    {"time": (today - timedelta(days=2)).strftime("%Y-%m-%d 18:30"), "location": "Dallas Transit Center, TX", "event": "In Transit"},
                    {"time": (today - timedelta(days=1)).strftime("%Y-%m-%d 06:15"), "location": "Chicago Regional Hub, IL", "event": "Arrived at Sort Facility"}
                ]
            }
        },
        # Order #10240 - Return shoes bought last week
        {
            "order_id": "10240",
            "customer_email": "jordan.lee@example.com",
            "order_date": (today - timedelta(days=7)).strftime("%Y-%m-%d"),
            "status": "DELIVERED",
            "total_amount": 119.99,
            "shipping_address": "123 Maple St, Seattle, WA",
            "late_count": 0,
            "items": [
                ("ITEM-10240-1", "Apex Pro Ultra Running Shoes", "Footwear", "SHOES-RUN-42", 1, 119.99, True)
            ],
            "shipment": {
                "carrier": "UPS",
                "tracking_number": "UPS-8837192",
                "status": "DELIVERED",
                "current_location": "Front Porch, Seattle, WA",
                "estimated_delivery": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "checkpoints": [
                    {"time": (today - timedelta(days=7)).strftime("%Y-%m-%d 09:00"), "location": "Warehouse, Portland, OR", "event": "Shipped"},
                    {"time": (today - timedelta(days=5)).strftime("%Y-%m-%d 14:22"), "location": "Seattle, WA", "event": "Delivered to Front Door"}
                ]
            }
        },
        # Order #10215 - Refund still hasn't arrived after 10 days
        {
            "order_id": "10215",
            "customer_email": "maria.garcia@example.com",
            "order_date": (today - timedelta(days=20)).strftime("%Y-%m-%d"),
            "status": "REFUND_PENDING",
            "total_amount": 89.50,
            "shipping_address": "456 Oak Ave, Miami, FL",
            "late_count": 0,
            "items": [
                ("ITEM-10215-1", "Ergonomic Mesh Office Chair", "Furniture", "FURN-CHAIR-09", 1, 89.50, True)
            ],
            "shipment": {
                "carrier": "DHL Express",
                "tracking_number": "DHL-3392817",
                "status": "RETURN_DELIVERED",
                "current_location": "Return Processing Hub, Atlanta, GA",
                "estimated_delivery": (today - timedelta(days=10)).strftime("%Y-%m-%d"),
                "checkpoints": [
                    {"time": (today - timedelta(days=12)).strftime("%Y-%m-%d 11:00"), "location": "Miami, FL", "event": "Return Picked Up"},
                    {"time": (today - timedelta(days=10)).strftime("%Y-%m-%d 16:00"), "location": "Atlanta Warehouse", "event": "Return Inspected and Approved"}
                ]
            },
            "return_record": {
                "rma_code": "RMA-10215-RET",
                "reason": "Defective height adjustment arm",
                "status": "REFUND_PENDING",
                "refund_amount": 89.50
            }
        },
        # Order #10290 - 3rd time my order is late, want to speak to a manager
        {
            "order_id": "10290",
            "customer_email": "david.miller@example.com",
            "order_date": (today - timedelta(days=12)).strftime("%Y-%m-%d"),
            "status": "IN_TRANSIT",
            "total_amount": 349.00,
            "shipping_address": "88 Pine Road, Denver, CO",
            "late_count": 3,
            "items": [
                ("ITEM-10290-1", "4K Ultra HD Gaming Monitor 27-inch", "Electronics", "MONITOR-4K-27", 1, 349.00, True)
            ],
            "shipment": {
                "carrier": "USPS",
                "tracking_number": "940011120249",
                "status": "DELAYED",
                "current_location": "Denver Sorting Center, CO (Weather Delay)",
                "estimated_delivery": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "checkpoints": [
                    {"time": (today - timedelta(days=12)).strftime("%Y-%m-%d 08:00"), "location": "Fulfillment Hub, San Jose, CA", "event": "Picked Up"},
                    {"time": (today - timedelta(days=7)).strftime("%Y-%m-%d 12:00"), "location": "Denver, CO", "event": "Severe Weather Severe Blizzard Delay"}
                ]
            }
        },
        # Order #10100 - Past 30 days window return attempt (60 days ago)
        {
            "order_id": "10100",
            "customer_email": "sam.wilson@example.com",
            "order_date": (today - timedelta(days=60)).strftime("%Y-%m-%d"),
            "status": "DELIVERED",
            "total_amount": 45.00,
            "shipping_address": "555 Cedar St, Boston, MA",
            "late_count": 0,
            "items": [
                ("ITEM-10100-1", "Genuine Italian Leather Bifold Wallet", "Accessories", "ACC-WLT-01", 1, 45.00, True)
            ],
            "shipment": {
                "carrier": "FedEx",
                "tracking_number": "FX-7761209",
                "status": "DELIVERED",
                "current_location": "Mailroom, Boston, MA",
                "estimated_delivery": (today - timedelta(days=56)).strftime("%Y-%m-%d"),
                "checkpoints": [
                    {"time": (today - timedelta(days=56)).strftime("%Y-%m-%d 15:00"), "location": "Boston, MA", "event": "Delivered"}
                ]
            }
        },
        # Order #10300 - Non-returnable customized item
        {
            "order_id": "10300",
            "customer_email": "lisa.chen@example.com",
            "order_date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
            "status": "DELIVERED",
            "total_amount": 65.00,
            "shipping_address": "900 Birch Way, San Francisco, CA",
            "late_count": 0,
            "items": [
                ("ITEM-10300-1", "Custom Monogrammed Stainless Steel Flask", "Custom", "CUST-FLSK-99", 1, 65.00, False)
            ],
            "shipment": {
                "carrier": "UPS",
                "tracking_number": "UPS-4491823",
                "status": "DELIVERED",
                "current_location": "Front Desk, San Francisco, CA",
                "estimated_delivery": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                "checkpoints": [
                    {"time": (today - timedelta(days=2)).strftime("%Y-%m-%d 13:10"), "location": "San Francisco, CA", "event": "Delivered"}
                ]
            }
        }
    ]

    for ord_data in specific_orders:
        cursor.execute(
            """INSERT INTO orders (order_id, customer_email, order_date, status, total_amount, shipping_address, late_count)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (ord_data["order_id"], ord_data["customer_email"], ord_data["order_date"], ord_data["status"],
             ord_data["total_amount"], ord_data["shipping_address"], ord_data["late_count"])
        )
        
        for item in ord_data["items"]:
            cursor.execute(
                """INSERT INTO order_items (item_id, order_id, product_name, category, sku, quantity, price, is_returnable)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (item[0], ord_data["order_id"], item[1], item[2], item[3], item[4], item[5], item[6])
            )
            
        ship = ord_data["shipment"]
        cursor.execute(
            """INSERT INTO shipments (order_id, carrier, tracking_number, status, current_location, estimated_delivery, checkpoints_json)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (ord_data["order_id"], ship["carrier"], ship["tracking_number"], ship["status"],
             ship["current_location"], ship["estimated_delivery"], json.dumps(ship["checkpoints"]))
        )

        if "return_record" in ord_data:
            ret = ord_data["return_record"]
            cursor.execute(
                """INSERT INTO returns (rma_code, order_id, item_id, reason, status, refund_amount)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (ret["rma_code"], ord_data["order_id"], ord_data["items"][0][0], ret["reason"], ret["status"], ret["refund_amount"])
            )

    # Generate additional 70 synthetic mock orders across various customers
    categories = ["Electronics", "Apparel", "Home & Kitchen", "Fitness", "Beauty"]
    carriers = ["FedEx", "UPS", "USPS", "DHL"]
    statuses = ["DELIVERED", "IN_TRANSIT", "SHIPPED", "PROCESSING"]
    
    for idx in range(10301, 10371):
        order_id = str(idx)
        cust = customers[idx % len(customers)]
        cust_email = cust[2]
        days_ago = (idx - 10300) % 45 + 1
        order_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        status = statuses[idx % len(statuses)]
        total = round(25.0 + (idx % 15) * 18.5, 2)
        late_count = 1 if (idx % 7 == 0) else 0
        
        cursor.execute(
            """INSERT INTO orders (order_id, customer_email, order_date, status, total_amount, shipping_address, late_count)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (order_id, cust_email, order_date, status, total, f"{100 + idx} Park Ave, City, State", late_count)
        )

        item_id = f"ITEM-{order_id}-1"
        prod_name = f"Premium {categories[idx % len(categories)]} Item #{idx}"
        cat = categories[idx % len(categories)]
        sku = f"SKU-{cat[:3].upper()}-{idx}"
        is_ret = 0 if (idx % 10 == 0) else 1
        
        cursor.execute(
            """INSERT INTO order_items (item_id, order_id, product_name, category, sku, quantity, price, is_returnable)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (item_id, order_id, prod_name, cat, sku, 1, total, is_ret)
        )

        carrier = carriers[idx % len(carriers)]
        track_num = f"{carrier[:2].upper()}-{idx}9923"
        est_del = (today + timedelta(days=(2 if status == 'IN_TRANSIT' else -days_ago+3))).strftime("%Y-%m-%d")
        checkpoints = [
            {"time": order_date + " 08:00", "location": "Warehouse Hub", "event": "Order Processed"},
            {"time": order_date + " 18:00", "location": "Transit Center", "event": "In Transit"}
        ]
        
        cursor.execute(
            """INSERT INTO shipments (order_id, carrier, tracking_number, status, current_location, estimated_delivery, checkpoints_json)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (order_id, carrier, track_num, status, "Regional Logistics Center", est_del, json.dumps(checkpoints))
        )

    conn.commit()
    conn.close()
    print(f"Successfully seeded database at {DB_PATH} with 76 mock orders!")

if __name__ == "__main__":
    seed_database()
