import React, { useState, useEffect } from "react";
import { Users, AlertOctagon, CheckCircle, Clock, FileText, ArrowRight, ShieldAlert } from "lucide-react";
import { fetchEscalatedTickets, resolveTicket } from "../utils/api";
import { translations } from "../utils/translations";

export default function HumanDashboard({ lang }) {
  const t = translations[lang] || translations.en;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await fetchEscalatedTickets();
      setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleResolve = async (ticketId, actionName) => {
    setResolvingId(ticketId);
    try {
      await resolveTicket(ticketId, actionName, "Human Manager overriding standard bot protocol per policy.");
      await loadTickets();
    } catch (e) {
      alert("Error resolving ticket.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-500" />
            Human Support Escalation Queue & Case Summaries
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time handoff queue populated when AI Triage detects hostile sentiment, 3+ late orders, or manual intervention requests.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <Clock className="w-4 h-4" /> Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400">Loading escalated tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Open Escalation Tickets</h3>
          <p className="text-sm text-slate-400 mt-1">
            All customer queries are currently resolved autonomously by AI Order & Policy agents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((t) => {
            const isResolved = t.status === "RESOLVED";
            const summary = t.summary_obj || {};

            return (
              <div
                key={t.ticket_id}
                className={`glass-panel p-6 space-y-4 border ${
                  isResolved ? "border-emerald-500/30 bg-emerald-950/10" : "border-pink-500/40 bg-pink-950/10"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-pink-400 border border-pink-500/30">
                      {t.ticket_id}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        t.sentiment === "ANGRY"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {t.sentiment} SENTIMENT
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded ${
                      isResolved
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-pink-500/20 text-pink-400 border border-pink-500/30 animate-pulse"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Content Breakdown */}
                <div className="space-y-2 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500">Customer Account:</span>{" "}
                    <span className="font-mono text-indigo-300 font-semibold">{t.customer_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Target Order ID:</span>{" "}
                    <span className="font-mono text-white font-semibold">#{t.order_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Escalation Trigger:</span>{" "}
                    <span className="text-pink-300">{summary.escalation_reason || t.issue_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Actions Attempted by AI:</span>{" "}
                    <div className="p-2 rounded bg-slate-900/80 border border-white/5 font-mono text-[11px] text-slate-300 mt-1">
                      {t.actions_taken}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">AI Recommended Human Action:</span>{" "}
                    <div className="p-2.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 mt-1 font-medium">
                      💡 {t.recommended_action}
                    </div>
                  </div>
                </div>

                {/* Supervisor Action Buttons */}
                {!isResolved && (
                  <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    <button
                      disabled={resolvingId === t.ticket_id}
                      onClick={() => handleResolve(t.ticket_id, "APPROVE_REFUND")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                    >
                      Approve Refund Exception
                    </button>
                    <button
                      disabled={resolvingId === t.ticket_id}
                      onClick={() => handleResolve(t.ticket_id, "GRANT_25_CREDIT")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                    >
                      Grant $25 Goodwill Credit
                    </button>
                    <button
                      disabled={resolvingId === t.ticket_id}
                      onClick={() => handleResolve(t.ticket_id, "CONTACT_CARRIER")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition"
                    >
                      Contact Carrier Liaison
                    </button>
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
