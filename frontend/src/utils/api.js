const API_BASE = "http://127.0.0.1:8000/api";

export async function sendChatMessage(message, customerEmail, orderId, history = []) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      customer_email: customerEmail,
      order_id: orderId,
      messages_history: history
    })
  });
  if (!response.ok) {
    throw new Error("Failed to communicate with AI Agent API backend.");
  }
  return response.json();
}

export async function fetchEscalatedTickets() {
  const res = await fetch(`${API_BASE}/tickets`);
  return res.json();
}

export async function resolveTicket(ticketId, action, notes) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, notes })
  });
  return res.json();
}

export async function runBenchmarkSuite() {
  const res = await fetch(`${API_BASE}/benchmark/run`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchMCPTools() {
  const res = await fetch(`${API_BASE}/mcp/tools`);
  return res.json();
}

export async function fetchSampleOrders(email) {
  const url = email ? `${API_BASE}/orders?email=${encodeURIComponent(email)}` : `${API_BASE}/orders`;
  const res = await fetch(url);
  return res.json();
}
