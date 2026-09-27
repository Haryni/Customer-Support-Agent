import os
from fastmcp import FastMCP
from mcp_server.tools import get_order, track_shipment, initiate_return, web_search_disruptions

# Initialize FastMCP Server
mcp = FastMCP("ApexCart E-Commerce Support MCP Server")

@mcp.tool()
def mcp_get_order(order_id: str, user_email: str = None) -> dict:
    """Returns order details, items and status for an order ID. Enforces ownership verification."""
    return get_order(order_id, user_email)

@mcp.tool()
def mcp_track_shipment(order_id: str) -> dict:
    """Returns shipment location, carrier tracking status, and estimated delivery date."""
    return track_shipment(order_id)

@mcp.tool()
def mcp_initiate_return(order_id: str, item_id: str, reason: str, user_email: str = None) -> dict:
    """Creates a return request if the item is eligible under store policy."""
    return initiate_return(order_id, item_id, reason, user_email)

@mcp.tool()
def mcp_web_search(query: str) -> dict:
    """Searches courier service disruptions and product recall notices that explain delays."""
    return web_search_disruptions(query)

if __name__ == "__main__":
    mcp.run()
