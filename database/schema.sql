-- E-Commerce Customer Support Agent Database Schema

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL, -- DELIVERED, IN_TRANSIT, PROCESSING, SHIPPED, RETURNED, REFUND_PENDING
    total_amount REAL NOT NULL,
    shipping_address TEXT NOT NULL,
    late_count INTEGER DEFAULT 0,
    FOREIGN KEY(customer_email) REFERENCES customers(email)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    is_returnable BOOLEAN DEFAULT 1,
    FOREIGN KEY(order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    carrier TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    status TEXT NOT NULL,
    current_location TEXT NOT NULL,
    estimated_delivery DATE NOT NULL,
    checkpoints_json TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rma_code TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL, -- INITIATED, RECEIVED, REFUNDED, REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS escalated_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    order_id TEXT,
    sentiment TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    actions_taken TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN', -- OPEN, RESOLVED, IN_PROGRESS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
