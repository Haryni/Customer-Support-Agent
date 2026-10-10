import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  Inbox,
  AlertTriangle,
  Flame,
  CreditCard,
  Truck,
  RotateCcw,
  Check,
  Search,
  Filter,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchEscalatedTickets, resolveTicket } from "../utils/api";
import { translations } from "../utils/translations";

export default function HumanDashboard({ lang }) {
  const t = translations[lang] || translations.en;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, OPEN, RESOLVED
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEscalatedTickets();
      setTickets(data.tickets || []);
    } catch (e) {
      setError("Could not load tickets from the API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleResolve = async (ticketId, actionName) => {
    setResolvingId(ticketId);
    try {
      await resolveTicket(
        ticketId,
        actionName,
        "Supervisor approved VIP resolution per company satisfaction policy."
      );
      triggerConfetti();
      await loadTickets();
    } catch (e) {
      setError("Could not resolve this ticket.");
    } finally {
      setResolvingId(null);
    }
  };

  const openTickets = tickets.filter((t) => t.status !== "RESOLVED");
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED");

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === "OPEN" && ticket.status === "RESOLVED") return false;
    if (filterStatus === "RESOLVED" && ticket.status !== "RESOLVED") return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchEmail = (ticket.customer_email || "").toLowerCase().includes(query);
      const matchId = (ticket.ticket_id || "").toLowerCase().includes(query);
      const matchOrder = (ticket.order_id || "").toLowerCase().includes(query);
      return matchEmail || matchId || matchOrder;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Control Banner Card */}
      <div className="glass-card p-5 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              Human-In-The-Loop Queue
            </span>
            <span className="text-xs text-slate-400">• SLA Target: &lt; 15 mins</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            {t.ticketsHeader || "Escalated Human Support Tickets"}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            High-friction conversations routed by LangGraph when customer sentiment turns hostile, repeated delays occur, or automated policy boundaries are exceeded.
          </p>
        </div>

        {/* Filter Pills and Action Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Segmented Buttons */}
          <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-full transition ${
                filterStatus === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setFilterStatus("OPEN")}
              className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                filterStatus === "OPEN"
                  ? "bg-orange-500 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Pending ({openTickets.length})
            </button>
            <button
              onClick={() => setFilterStatus("RESOLVED")}
              className={`px-3 py-1.5 rounded-full transition ${
                filterStatus === "RESOLVED"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Resolved ({resolvedTickets.length})
            </button>
          </div>

          <button
            onClick={loadTickets}
            className="btn-glass text-xs py-2 px-3.5"
            title="Refresh ticket queue"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer email, Ticket ID (e.g. ESC-10290), or order #..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-xs"
          />
        </div>
      </div>

      {/* Ticket Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="glass-card p-6 h-64 animate-pulse space-y-4">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-card p-14 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
            {searchQuery ? "No matching tickets found" : "Escalation Queue Clean"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? "Try clearing your search query to see all supervisor tickets."
              : "All customer disputes have been handled or resolved. Switch persona to David Miller in Shopper Chat to trigger a live escalation."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTickets.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED";
            const summary = ticket.summary_obj || {};

            return (
              <div
                key={ticket.ticket_id}
                className={`glass-card p-6 space-y-4 transition-all duration-300 relative overflow-hidden ${
                  isResolved
                    ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-orange-200/90 dark:border-orange-800/60 shadow-md"
                }`}
              >
                {/* Header Row: Ticket ID, Sentiment, Status Badge */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs">
                      {ticket.ticket_id}
                    </span>

                    {/* Sentiment Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        ticket.sentiment === "ANGRY"
                          ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                      {ticket.sentiment}
                    </span>

                    {summary.customer_tier && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {summary.customer_tier}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                      isResolved
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-orange-500 text-white shadow-xs animate-pulse"
                    }`}
                  >
                    {isResolved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Resolved
                      </>
                    ) : (
                      "Requires Action"
                    )}
                  </span>
                </div>

                {/* Customer & Order Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 text-xs">
                  <div>
                    <div className="text-slate-400 font-medium mb-0.5">Customer Email</div>
                    <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate" title={ticket.customer_email}>
                      {ticket.customer_email}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-medium mb-0.5">Order ID</div>
                    <div className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                      #{ticket.order_id}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-medium mb-0.5">Order Value</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {summary.order_value || "$189.00"}
                    </div>
                  </div>
                </div>

                {/* Escalation Root Cause */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Escalation Trigger
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
                    {summary.escalation_reason || ticket.issue_type}
                  </div>
                </div>

                {/* AI Actions Trace */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Agent Automated Actions Prior to Handoff
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 dark:bg-black text-zinc-300 font-mono text-[11px] leading-relaxed border border-slate-800">
                    <span className="text-orange-400 font-bold">$ </span>
                    {ticket.actions_taken}
                  </div>
                </div>

                {/* AI Recommended Resolution */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Copilot Recommended Solution
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800/80 text-orange-950 dark:text-orange-200 font-semibold flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{ticket.recommended_action}</span>
                  </div>
                </div>

                {/* Supervisor 1-Click Action Buttons */}
                {!isResolved && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                    <button
                      disabled={resolvingId === ticket.ticket_id}
                      onClick={() => handleResolve(ticket.ticket_id, "APPROVE_REFUND")}
                      className="px-3.5 py-2 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Approve Instant Refund
                    </button>

                    <button
                      disabled={resolvingId === ticket.ticket_id}
                      onClick={() => handleResolve(ticket.ticket_id, "GRANT_25_CREDIT")}
                      className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition active:scale-95"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Issue $25 Credit
                    </button>

                    <button
                      disabled={resolvingId === ticket.ticket_id}
                      onClick={() => handleResolve(ticket.ticket_id, "DISPATCH_REPLACEMENT")}
                      className="px-3.5 py-2 rounded-full text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition active:scale-95"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Dispatch Priority Unit
                    </button>
                  </div>
                )}

                {/* Resolved Status Stamp */}
                {isResolved && (
                  <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Case resolved by supervisor. Follow-up confirmation dispatched to customer.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
