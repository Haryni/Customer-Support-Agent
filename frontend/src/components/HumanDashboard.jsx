import React, { useState, useEffect } from "react";
import { Users, AlertOctagon, CheckCircle, Clock, ArrowRight, ShieldAlert, Sparkles, Filter } from "lucide-react";
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
      {/* Title Header Card */}
      <div className="clean-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Human Support Escalation Queue & Case Summaries
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time escalation queue populated when AI Triage detects hostile sentiment, 3+ late orders, or manual supervisor intervention requests.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="btn-pill-subtle flex items-center gap-2"
        >
          <Clock className="w-4 h-4" /> Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="clean-card p-12 text-center text-slate-500 font-medium">Loading escalated support tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="clean-card p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Open Escalation Tickets</h3>
          <p className="text-sm text-slate-500 mt-1">
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
                className={`clean-card p-6 space-y-4 border ${
                  isResolved ? "border-emerald-200 bg-emerald-50/30" : "border-orange-200 bg-white"
                }`}
              >
                {/* Ticket Top Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white">
                      {t.ticket_id}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        t.sentiment === "ANGRY"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}
                    >
                      {t.sentiment} SENTIMENT
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      isResolved
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-orange-500 text-white font-bold"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Structured Information */}
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium">Customer Account:</span>{" "}
                    <span className="font-mono text-slate-900 font-bold">{t.customer_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Target Order ID:</span>{" "}
                    <span className="font-mono text-orange-600 font-bold">#{t.order_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Escalation Trigger:</span>{" "}
                    <span className="text-slate-900 font-semibold">{summary.escalation_reason || t.issue_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Actions Attempted by AI:</span>{" "}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-800 mt-1">
                      {t.actions_taken}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">AI Recommended Human Action:</span>{" "}
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200/70 text-orange-900 mt-1 font-semibold">
                      💡 {t.recommended_action}
                    </div>
                  </div>
                </div>

                {/* Supervisor Actions */}
                {!isResolved && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    <button
                      disabled={resolvingId === t.ticket_id}
                      onClick={() => handleResolve(t.ticket_id, "APPROVE_REFUND")}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                    >
                      Approve Refund Exception
                    </button>
                    <button
                      disabled={resolvingId === t.ticket_id}
                      onClick={() => handleResolve(t.ticket_id, "GRANT_25_CREDIT")}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition"
                    >
                      Grant $25 Goodwill Credit
                    </button>
                    <button
                      disabled={resolvingId === t.ticket_id}
                      onClick={() => handleResolve(t.ticket_id, "CONTACT_CARRIER")}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
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
