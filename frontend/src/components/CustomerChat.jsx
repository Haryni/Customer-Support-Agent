import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, CheckCircle, AlertTriangle, ShieldCheck, Clock, PackageCheck } from "lucide-react";
import { sendChatMessage } from "../utils/api";
import { translations } from "../utils/translations";

export default function CustomerChat({ lang, customerEmail }) {
  const t = translations[lang] || translations.en;
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `👋 **Welcome to ApexCart AI Customer Support!**\n\nI am your automated agent connected to our SQLite order system and company policy RAG knowledge base.\n\nHow can I help you today? You can inquire about an order status, request a return, check refund status, or ask about store policies.`,
      agentBadge: "ApexCart AI Bot",
      nodeSteps: []
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastActionsLog, setLastActionsLog] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg = { role: "user", content: queryText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // Build history for backend API
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const responseData = await sendChatMessage(queryText, customerEmail, null, historyPayload);

      setLastActionsLog(responseData.actions_log || []);

      const assistantMsg = {
        role: "assistant",
        content: responseData.final_response || "I have processed your inquiry.",
        agentBadge: responseData.is_escalated ? "Human Handoff [Escalated]" : `Agent Workflow (${responseData.intent})`,
        isEscalated: responseData.is_escalated,
        nodeSteps: responseData.actions_log || []
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ **Error**: Failed to connect to AI Agent API backend. Make sure the FastAPI server is running on port 8000.",
          agentBadge: "System Error"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    { label: t.orderStatusLabel, text: "Where is my order #10245?" },
    { label: t.returnLabel, text: "I want to return the shoes I bought last week for order #10240." },
    { label: t.refundLabel, text: "My refund for order #10215 still hasn't arrived after 10 days." },
    { label: t.escalationLabel, text: "This is the third time my order is late for #10290. I want to speak to a manager!" },
    { label: t.policyLabel, text: "What is your refund processing time and return policy window?" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Chat Panel */}
      <div className="lg:col-span-3 glass-panel p-6 flex flex-col h-[700px]">
        {/* Chat Window Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Interactive Shopper AI Agent</h2>
              <p className="text-xs text-slate-400">Logged in as: <span className="text-indigo-300 font-mono">{customerEmail}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Security Guardrail Active
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                  AI
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20"
                    : msg.isEscalated
                    ? "bg-pink-950/40 border border-pink-500/40 text-pink-100 rounded-tl-none"
                    : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none"
                }`}
              >
                {msg.agentBadge && (
                  <div className="flex items-center gap-2 mb-2 text-xs opacity-75 font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/10">{msg.agentBadge}</span>
                  </div>
                )}

                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Render Workflow Nodes execution chips if available */}
                {msg.nodeSteps && msg.nodeSteps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {msg.nodeSteps.map((step, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {step.step || "Agent Node"}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-indigo-400 text-xs italic">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>LangGraph Orchestrator executing Triage &rarr; Policy RAG &rarr; MCP Tools...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary"
            >
              <Send className="w-4 h-4" />
              {t.sendBtn}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar Sample Query Chips & Real-Time Agent Execution Inspector */}
      <div className="space-y-6">
        {/* Sample Queries Chips */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {t.quickPromptsTitle}
          </h3>
          <div className="space-y-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.text)}
                className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-600/10 transition text-xs text-slate-300 font-medium"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Agent Execution Log Inspector */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Live State Execution Log
          </h3>

          {lastActionsLog.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No query executed yet. Click a sample prompt above to see real-time node transitions.</p>
          ) : (
            <div className="space-y-2.5">
              {lastActionsLog.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-white/10 text-xs">
                  <div className="font-semibold text-indigo-300 mb-1">{log.step}</div>
                  {log.detected_intent && <div>Intent: <span className="text-emerald-400 font-mono">{log.detected_intent}</span></div>}
                  {log.detected_sentiment && <div>Sentiment: <span className="text-amber-400 font-mono">{log.detected_sentiment}</span></div>}
                  {log.tools_executed && <div>MCP Tools: <span className="text-pink-400 font-mono">{log.tools_executed.join(", ")}</span></div>}
                  {log.policy_citations && <div>RAG Citations: <span className="text-indigo-400 font-mono">{log.policy_citations.join(", ")}</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
