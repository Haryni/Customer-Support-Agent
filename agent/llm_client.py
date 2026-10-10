"""
LLM Client — Google Gemini Integration
=======================================
Provides a thin wrapper around google-generativeai so that all agent
nodes can call an actual LLM for response generation.

Falls back gracefully to template-based responses if:
  - GOOGLE_API_KEY is not set in the environment / .env file.
  - The API call fails (network error, quota, etc.).

Usage:
    from agent.llm_client import llm_generate

    response = llm_generate(
        system_prompt="You are a helpful customer support agent...",
        user_content="Where is my order?",
        context={"order_id": "10245", "status": "IN_TRANSIT"},
    )
"""
import os
import json
import logging
from typing import Optional

# Load .env if python-dotenv is available (recommended for local dev)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

_GEMINI_AVAILABLE = False
_gemini_model = None

# ---------------------------------------------------------------------------
# Attempt to initialise Google Gemini
# ---------------------------------------------------------------------------
_api_key = os.getenv("GOOGLE_API_KEY")
if _api_key:
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=_api_key)
        _gemini_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.4,
                "top_p": 0.95,
                "max_output_tokens": 1024,
            },
            system_instruction=(
                "You are ApexCart AI — a professional, empathetic e-commerce customer "
                "support agent. Always respond concisely and helpfully. Cite policy "
                "sections when relevant. Use Markdown formatting."
            ),
        )
        _GEMINI_AVAILABLE = True
        logger.info("Google Gemini LLM initialised successfully.")
    except Exception as exc:
        logger.warning(f"Could not initialise Gemini: {exc}. Running in template-only mode.")
else:
    logger.info("GOOGLE_API_KEY not set — running in template-only mode (no LLM calls).")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def is_llm_available() -> bool:
    """Returns True if the Gemini LLM is configured and ready."""
    return _GEMINI_AVAILABLE


def llm_generate(
    system_prompt: str,
    user_content: str,
    context: Optional[dict] = None,
    fallback: Optional[str] = None,
) -> str:
    """
    Generate an LLM response using Google Gemini.

    Parameters
    ----------
    system_prompt : str
        Role / task description prepended to the conversation.
    user_content : str
        The customer's message or the agent's internal reasoning prompt.
    context : dict, optional
        Structured context (order info, policy snippets, etc.) serialised
        to JSON and appended to the prompt so the LLM can reference it.
    fallback : str, optional
        Pre-built template response returned verbatim if Gemini is
        unavailable or the API call fails. If None, a generic message is used.

    Returns
    -------
    str
        LLM-generated response text, or `fallback` on error.
    """
    if not _GEMINI_AVAILABLE or _gemini_model is None:
        return fallback or user_content  # degrade to template

    try:
        parts = [f"**System Context:**\n{system_prompt}\n"]
        if context:
            parts.append(f"**Structured Data:**\n```json\n{json.dumps(context, indent=2)}\n```\n")
        parts.append(f"**Customer Message:**\n{user_content}")

        full_prompt = "\n".join(parts)
        response = _gemini_model.generate_content(full_prompt)
        return response.text.strip()
    except Exception as exc:
        logger.warning(f"Gemini API call failed: {exc}. Returning template fallback.")
        return fallback or user_content
