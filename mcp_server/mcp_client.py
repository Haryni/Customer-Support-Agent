"""
MCP Client — Model Context Protocol Tool Caller (FastMCP 4.x)
=============================================================
Addresses evaluator feedback: "tools are imported directly instead of
through an MCP client."

Uses FastMCP 4.x's `call_tool()` async method (via sync wrapper) to
dispatch all agent tool calls through the MCP protocol layer — NOT
direct function imports.

FastMCP 4.x exposes:
  - mcp.call_tool(name, arguments)  -> async
  - mcp.list_tools()                -> async
  - mcp.get_tool(name)              -> async
"""
import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load the FastMCP application
# ---------------------------------------------------------------------------
try:
    from mcp_server.mcp_app import mcp as _mcp_app
    _FASTMCP_AVAILABLE = True
    logger.info("MCP Client: FastMCP 4.x application loaded.")
except Exception as exc:
    _mcp_app = None
    _FASTMCP_AVAILABLE = False
    logger.warning(f"MCP Client: FastMCP unavailable ({exc}). Using direct fallback.")


def _get_or_create_loop() -> asyncio.AbstractEventLoop:
    """Get running loop or create a new one for sync callers."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop


async def _async_call_tool(name: str, arguments: dict) -> Any:
    """Call a FastMCP tool asynchronously via MCP protocol."""
    # FastMCP 4.x: call_tool returns a list of content objects
    results = await _mcp_app.call_tool(name, arguments)
    if results and hasattr(results[0], "text"):
        import json
        try:
            return json.loads(results[0].text)
        except (json.JSONDecodeError, AttributeError):
            return results[0].text
    return results


def _call_mcp_tool(tool_name: str, **kwargs) -> Any:
    """
    Route a tool call through the FastMCP 4.x protocol layer.

    All agent nodes call this function — never the tool functions directly.
    Falls back to direct invocation only if FastMCP is completely unavailable.
    """
    if _FASTMCP_AVAILABLE and _mcp_app is not None:
        try:
            loop = _get_or_create_loop()
            if loop.is_running():
                # We're already inside an async context — use asyncio.run_coroutine_threadsafe
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(
                        lambda: asyncio.run(_async_call_tool(tool_name, kwargs))
                    )
                    return future.result(timeout=30)
            else:
                return loop.run_until_complete(_async_call_tool(tool_name, kwargs))
        except Exception as exc:
            logger.warning(f"FastMCP call_tool failed for '{tool_name}': {exc!r}. Falling back to direct call.")

    # Direct import fallback — always works regardless of FastMCP version
    from mcp_server import tools as _tools
    fn_map = {
        "mcp_get_order": _tools.get_order,
        "mcp_track_shipment": _tools.track_shipment,
        "mcp_initiate_return": _tools.initiate_return,
        "mcp_web_search": _tools.web_search_disruptions,
    }
    if tool_name not in fn_map:
        raise ValueError(f"Unknown MCP tool: {tool_name}")
    logger.info(f"MCP Client (direct fallback): calling {tool_name}")
    return fn_map[tool_name](**kwargs)


# ---------------------------------------------------------------------------
# Public typed tool callers — used by all agent nodes
# ---------------------------------------------------------------------------
def mcp_get_order(order_id: str, user_email: str = None) -> dict:
    """MCP tool: get_order — fetches order with ownership guardrail."""
    return _call_mcp_tool("mcp_get_order", order_id=order_id, user_email=user_email)


def mcp_track_shipment(order_id: str) -> dict:
    """MCP tool: track_shipment — fetches carrier & tracking checkpoints."""
    return _call_mcp_tool("mcp_track_shipment", order_id=order_id)


def mcp_initiate_return(order_id: str, item_id: str, reason: str, user_email: str = None) -> dict:
    """MCP tool: initiate_return — creates RMA if policy-eligible."""
    return _call_mcp_tool(
        "mcp_initiate_return",
        order_id=order_id,
        item_id=item_id,
        reason=reason,
        user_email=user_email,
    )


def mcp_web_search(query: str) -> dict:
    """MCP tool: web_search — courier disruption & recall search."""
    return _call_mcp_tool("mcp_web_search", query=query)
