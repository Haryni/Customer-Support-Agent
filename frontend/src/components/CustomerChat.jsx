import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Package,
  Percent,
  Lock,
  Zap,
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Truck,
  Clock,
  ExternalLink,
  Cpu,
  Layers,
  Search,
  AlertCircle
} from "lucide-react";
import { sendChatMessage } from "../utils/api";
import { translations } from "../utils/translations";

function renderRichText(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-xs text-orange-600 dark:text-orange-400 font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export default function CustomerChat({ lang, customerEmail }) {
  const t = translations[lang] || translations.en;
  const [messages, setMessages] = useState([
    {
      id: "initial-msg",
      role: "assistant",
      timestamp: "Just now",
      content:
        "**Welcome to ApexCart AI Concierge.** I am your autonomous customer support copilot.\n\nI can retrieve real-time order tracking from **FastMCP couriers**, validate return eligibility against **Policy RAG**, manage refunds, and escalate complex disputes to human managers.\n\n*Choose a suggested prompt on the right or type your inquiry below.*",
      agentBadge: "Autonomous Agent",
      nodeSteps: ["triage_node", "policy_rag_node", "mcp_tools_node"],
      orderData: null
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastActionsLog, setLastActionsLog] = useState([
    { step: "Triage Node", detected_intent: "READY", detected_sentiment: "NEUTRAL" },
    { step: "Policy RAG Node", policy_retrieved: "ApexCart Standard Terms" },
    { step: "MCP Tool Node", tools_executed: ["get_order", "track_shipment"] }
  ]);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleFeedback = (msgIdx, type) => {
    setFeedback((prev) => ({ ...prev, [msgIdx]: type }));
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "msg-reset",
        role: "assistant",
        timestamp: "Just now",
        content:
          "Conversation cleared. How can I assist you today with orders, returns, or store policies?",
        agentBadge: "Autonomous Agent",
        nodeSteps: ["session_initialized"],
        orderData: null
      }
    ]);
    setLastActionsLog([]);
  };

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: queryText
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const responseData = await sendChatMessage(queryText, customerEmail, null, historyPayload);

      setLastActionsLog(responseData.actions_log || []);

      const assistantMsg = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: responseData.final_response || "I have processed your inquiry.",
        agentBadge: responseData.is_escalated
          ? "🚨 Human Supervisor Escalated"
          : `⚡ LangGraph · ${responseData.intent || "RESOLVED"}`,
        isEscalated: responseData.is_escalated,
        nodeSteps: responseData.actions_log || [],
        orderData: responseData.order_data || null
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content:
            "**Notice**: Operating in fallback mode. The query could not be completed via FastAPI backend.",
          agentBadge: "System Fallback",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    {
      category: "Order Tracking",
      icon: Truck,
      label: t.orderStatusLabel || "Where is order #10245?",
      text: "Where is my order #10245? Can you give me the courier tracking details?",
      badge: "FastMCP"
    },
    {
      category: "Returns & RMA",
      icon: RotateCcw,
      label: t.returnLabel || "Return Shoes (#10240)",
      text: "I want to return the shoes I bought last week for order #10240.",
      badge: "Policy RAG"
    },
    {
      category: "Refunds",
      icon: Clock,
      label: t.refundLabel || "Pending Refund (#10215)",
      text: "My refund for order #10215 still hasn't arrived after 10 days.",
      badge: "SLA Check"
    },
    {
      category: "Supervisor Escalation",
      icon: AlertCircle,
      label: t.escalationLabel || "3rd Late Order (#10290)",
      text: "This is the third time my order is late for #10290. I am furious, transfer me to a manager immediately!",
      badge: "Sentiment Alert"
    },
    {
      category: "Store Policy",
      icon: Layers,
      label: t.policyLabel || "Return & Refund Policy FAQ",
      text: "What is your refund processing time and return policy window?",
      badge: "Knowledge Base"
    },
  ];

  const metrics = [
    {
      label: "Mock DB Orders",
      value: "76",
      trend: "SQLite Seeded",
      icon: Package,
      gradient: "from-blue-500/10 to-indigo-500/10",
      accentColor: "text-blue-500 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-900/50"
    },
    {
      label: "Autonomous Resolution",
      value: "100%",
      trend: "10/10 Test Battery",
      icon: Percent,
      gradient: "from-emerald-500/10 to-teal-500/10",
      accentColor: "text-emerald-500 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-900/50"
    },
    {
      label: "Zero-Trust Guardrail",
      value: "Enforced",
      trend: "Email Auth Verification",
      icon: Lock,
      gradient: "from-violet-500/10 to-purple-500/10",
      accentColor: "text-violet-500 dark:text-violet-400",
      borderColor: "border-violet-200 dark:border-violet-900/50"
    },
    {
      label: "Avg Graph Latency",
      value: "5.12 ms",
      trend: "Multi-Agent Graph",
      icon: Zap,
      gradient: "from-orange-500/10 to-amber-500/10",
      accentColor: "text-orange-500 dark:text-orange-400",
      borderColor: "border-orange-200 dark:border-orange-900/50"
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top 4 Premium Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`glass-card glass-card-hover p-5 border ${m.borderColor} relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${m.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-110`} />

              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {m.label}
                </span>
                <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700 ${m.accentColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-extrabold mt-3 text-slate-900 dark:text-white font-heading tracking-tight">
                {m.value}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {m.trend}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chat & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Chat Interface (Col 8) */}
        <div className="lg:col-span-8 glass-card p-5 md:p-6 flex flex-col h-[70vh] min-h-[520px] max-h-[750px] relative">
          
          {/* Chat Card Header */}
          <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-orange-500 dark:to-amber-500 text-orange-400 dark:text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base font-heading">
                    Autonomous Support Chat
                  </h3>
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Online
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Authenticated: <span className="text-orange-600 dark:text-orange-400 font-mono font-semibold">{customerEmail}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetChat}
                className="btn-glass text-xs py-1.5 px-3"
                title="Restart chat history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>

              <span className="hidden md:inline-flex text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Guardrail Verified
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar */}
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white rounded-tr-sm shadow-md"
                      : msg.isEscalated
                      ? "bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 border border-orange-300 dark:border-orange-800 text-slate-900 dark:text-slate-100 rounded-tl-sm shadow-sm"
                      : "bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-xs"
                  }`}
                >
                  {/* Assistant Header Badge & Timestamp */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between gap-3 mb-2 border-b border-slate-100 dark:border-slate-700/50 pb-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        msg.isEscalated
                          ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                          : "bg-orange-100/80 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60"
                      }`}>
                        {msg.agentBadge || "ApexCart AI"}
                      </span>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-line space-y-1">
                    {renderRichText(msg.content)}
                  </div>

                  {/* Interactive Order Status Progress Timeline (If response contains order info) */}
                  {msg.orderData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-orange-500" />
                          Order #{msg.orderData.order_id} Tracker
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200 dark:border-emerald-800">
                          {msg.orderData.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${msg.orderData.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>Courier: {msg.orderData.carrier}</span>
                        <span>{msg.orderData.eta}</span>
                      </div>
                    </div>
                  )}

                  {/* Node Steps execution breadcrumb */}
                  {msg.nodeSteps && msg.nodeSteps.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {msg.nodeSteps.map((step, sIdx) => {
                          const stepLabel = typeof step === "string" ? step : step.step || "Step";
                          return (
                            <span
                              key={sIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-medium flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-orange-500" />
                              {stepLabel}
                            </span>
                          );
                        })}
                      </div>

                      {/* Feedback buttons */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <button
                            onClick={() => handleFeedback(idx, "like")}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              feedback[idx] === "like" ? "text-emerald-500 font-bold" : ""
                            }`}
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(idx, "dislike")}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              feedback[idx] === "dislike" ? "text-red-500 font-bold" : ""
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 pl-11">
                <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <span className="animate-pulse">
                  Triage Node ➔ Policy RAG ➔ FastMCP Verification...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full pl-5 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white dark:focus:bg-slate-900 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{t.sendBtn}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Quick Scenarios & Live Telemetry Graph (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quick Scenario Prompts */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                {t.quickPromptsTitle}
              </h4>
              <span className="text-[10px] font-semibold text-slate-400 font-mono">1-Click Test</span>
            </div>

            <div className="space-y-2">
              {sampleQueries.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.text}
                    onClick={() => handleSend(q.text)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-300 dark:hover:border-orange-600 transition group flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-orange-500" />
                        {q.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {q.badge}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                      <span className="truncate pr-2">{q.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LangGraph Live Node Pipeline Visualizer */}
          <div className="dark-glass-card p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                LangGraph Execution Trace
              </h4>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2.5 py-0.5 rounded-full font-bold border border-orange-500/30">
                Live State
              </span>
            </div>

            {/* Visual Node Graph Pipeline */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Graph Pipeline Flow
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono gap-1 text-center">
                <div className="p-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 flex-1">
                  Triage
                </div>
                <span className="text-zinc-600">→</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex-1">
                  Policy RAG
                </div>
                <span className="text-zinc-600">→</span>
                <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 flex-1">
                  FastMCP
                </div>
              </div>
            </div>

            {/* Step execution details */}
            {lastActionsLog.length === 0 ? (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click any sample query or ask a question to visualize active nodes, sentiment classification, and tool invocations.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto no-scrollbar">
                {lastActionsLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-black/35 border border-white/10 text-xs space-y-1"
                  >
                    <div className="font-bold text-orange-400 flex items-center justify-between">
                      <span>{log.step}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Node #{idx + 1}</span>
                    </div>

                    {log.detected_intent && (
                      <div className="text-zinc-300 flex items-center justify-between">
                        <span className="text-zinc-500">Intent:</span>
                        <span className="text-orange-200 font-mono font-semibold bg-white/5 px-2 py-0.5 rounded">
                          {log.detected_intent}
                        </span>
                      </div>
                    )}

                    {log.detected_sentiment && (
                      <div className="text-zinc-300 flex items-center justify-between">
                        <span className="text-zinc-500">Sentiment:</span>
                        <span className="text-amber-300 font-mono font-semibold">
                          {log.detected_sentiment}
                        </span>
                      </div>
                    )}

                    {log.tools_executed && (
                      <div className="text-zinc-300 pt-1 border-t border-white/5">
                        <span className="text-zinc-500 block mb-1">MCP Tools Called:</span>
                        <div className="flex flex-wrap gap-1">
                          {log.tools_executed.map((tName, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold"
                            >
                              {tName}()
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
