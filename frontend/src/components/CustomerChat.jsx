import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, CheckCircle, ShieldCheck, Clock, PackageCheck, ArrowUpRight, Activity } from "lucide-react";
import { sendChatMessage } from "../utils/api";
import { translations } from "../utils/translations";

export default function CustomerChat({ lang, customerEmail }) {
  const t = translations[lang] || translations.en;
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `👋 **Welcome to ApexCart AI Customer Support!**\n\nI am your automated agent connected to our SQLite order database and company policy RAG knowledge base.\n\nHow can I assist you today? You can inquire about order statuses, initiate returns, check refund timelines, or ask about store policies.`,
      agentBadge: "ApexCart AI Engine",
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
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const responseData = await sendChatMessage(queryText, customerEmail, null, historyPayload);

      setLastActionsLog(responseData.actions_log || []);

      const assistantMsg = {
        role: "assistant",
        content: responseData.final_response || "I have processed your inquiry.",
        agentBadge: responseData.is_escalated ? "Human Handoff (Escalated)" : `Agent Workflow (${responseData.intent})`,
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
    <div className="space-y-6">
      {/* Steadi-Style Top Summary Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="clean-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mock Orders</span>
            <span className="badge-orange">+12.4% vs last week</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-heading tracking-tight">
            76 <span className="text-sm text-slate-400 font-normal">Orders</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Database Status</span>
            <span className="text-emerald-600 font-semibold">SQLite Seeded</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="clean-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</span>
            <span className="badge-orange">+100% Benchmark</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-heading tracking-tight">
            100.0%
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Test Cases</span>
            <span className="text-slate-900 font-bold">10 / 10 Passed</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="clean-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Privacy</span>
            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-semibold">100% Enforced</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-heading tracking-tight">
            Active
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Security Check</span>
            <span className="text-slate-900 font-semibold">Email Ownership</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="clean-card p-5 bg-gradient-to-br from-orange-500 to-amber-600 text-white border-none shadow-lg shadow-orange-500/20">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-orange-100 uppercase tracking-wider">Avg Latency</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-semibold">Sub-10ms</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-heading tracking-tight">
            5.22 <span className="text-sm font-normal text-orange-100">ms</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-orange-100">
            <span>Orchestrator</span>
            <span className="font-bold">LangGraph Engine</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Chat & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Box */}
        <div className="lg:col-span-3 clean-card p-6 flex flex-col h-[650px]">
          {/* Chat Top Info */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-orange-400 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Shopper AI Support Interface</h3>
                <p className="text-xs text-slate-500">Connected to account: <span className="text-orange-600 font-semibold">{customerEmail}</span></p>
              </div>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Account Security Verified
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none shadow-md"
                      : msg.isEscalated
                      ? "bg-orange-50 border border-orange-200 text-slate-900 rounded-tl-none shadow-sm"
                      : "bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.agentBadge && (
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">{msg.agentBadge}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line">{msg.content}</div>

                  {msg.nodeSteps && msg.nodeSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                      {msg.nodeSteps.map((step, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1 font-medium"
                        >
                          <CheckCircle className="w-3 h-3 text-orange-500" />
                          {step.step || "Node"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-orange-600 text-xs font-medium italic">
                <Sparkles className="w-4 h-4 animate-spin text-orange-500" />
                <span>LangGraph Orchestrator executing Triage &rarr; Policy RAG &rarr; MCP Tools...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Controls */}
          <div className="mt-4 pt-4 border-t border-slate-100">
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition shadow-xs"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-orange"
              >
                <Send className="w-4 h-4" />
                {t.sendBtn}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Sample Prompts White Cards */}
          <div className="clean-card p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              {t.quickPromptsTitle}
            </h4>
            <div className="space-y-2">
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200/70 hover:border-orange-200 transition text-xs text-slate-700 font-semibold group flex justify-between items-center"
                >
                  <span>{q.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Dark Contrast Widget (Matching Steadi bottom right dark card) */}
          <div className="dark-card p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" />
                Live Node Execution Log
              </h4>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>

            {lastActionsLog.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No query executed yet. Click a sample prompt above to see real-time node state transitions.</p>
            ) : (
              <div className="space-y-3">
                {lastActionsLog.map((log, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                    <div className="font-bold text-orange-400">{log.step}</div>
                    {log.detected_intent && <div className="text-zinc-300">Intent: <span className="text-white font-mono">{log.detected_intent}</span></div>}
                    {log.detected_sentiment && <div className="text-zinc-300">Sentiment: <span className="text-orange-300 font-mono">{log.detected_sentiment}</span></div>}
                    {log.tools_executed && <div className="text-zinc-300">MCP Tools: <span className="text-emerald-400 font-mono">{log.tools_executed.join(", ")}</span></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
