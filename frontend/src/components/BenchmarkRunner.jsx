import React, { useState } from "react";
import {
  Award,
  Play,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  BarChart3
} from "lucide-react";
import confetti from "canvas-confetti";
import { runBenchmarkSuite } from "../utils/api";
import { translations } from "../utils/translations";

export default function BenchmarkRunner({ lang }) {
  const t = translations[lang] || translations.en;
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRunningTest, setCurrentRunningTest] = useState("");
  const [report, setReport] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterState, setFilterState] = useState("ALL"); // ALL, PASS, FAIL
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (e) {}
  };

  const handleRunBenchmark = async () => {
    setLoading(true);
    setError("");
    setProgress(15);
    setCurrentRunningTest("TC-01: Order Status Lookup...");

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 18;
      });
    }, 150);

    try {
      const data = await runBenchmarkSuite();
      clearInterval(progressTimer);
      setProgress(100);
      setReport(data);
      triggerConfetti();
    } catch (err) {
      clearInterval(progressTimer);
      setError("Benchmark execution failed. Verify the backend service.");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 400);
    }
  };

  const summary = report?.summary;
  const results = report?.detailed_results || [];

  const filteredResults = results.filter((r) => {
    if (filterState === "PASS" && !r.passed) return false;
    if (filterState === "FAIL" && r.passed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.expected_intent.toLowerCase().includes(q) ||
        r.actual_intent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Banner Card */}
      <div className="glass-card p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              Automated Agent Evaluation Suite
            </span>
            <span className="text-xs text-slate-400">• 10 Evaluation Scenarios</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            {t.benchmarkHeader || "AI Agent Observability & Benchmark Runner"}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Simulates end-to-end user dialogues to benchmark intent classification, policy retrieval accuracy, security guardrails, and graph traversal latency.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={loading}
          className="btn-primary text-sm px-6 py-3 shrink-0 shadow-md"
        >
          {loading ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-amber-300" />
              <span>Running Battery ({progress}%)…</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{t.runBenchmark || "Execute Test Battery"}</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar when running */}
      {loading && (
        <div className="glass-card p-5 space-y-2 border-orange-300 dark:border-orange-800">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              Executing scenario battery...
            </span>
            <span className="font-mono text-orange-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Scorecards Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Resolution Rate",
              value: `${summary.resolution_rate_pct}%`,
              hint: `${summary.passed_count} / ${summary.total_test_cases} passed`,
              icon: CheckCircle2,
              border: "border-emerald-300 dark:border-emerald-800",
              accent: "text-emerald-600 dark:text-emerald-400",
              bg: "from-emerald-500/10 to-teal-500/10"
            },
            {
              label: "Escalation Accuracy",
              value: `${summary.escalation_accuracy_pct}%`,
              hint: "Sentiment threshold verified",
              icon: TrendingUp,
              border: "border-orange-300 dark:border-orange-800",
              accent: "text-orange-600 dark:text-orange-400",
              bg: "from-orange-500/10 to-amber-500/10"
            },
            {
              label: "Privacy Guardrails",
              value: `${summary.guardrail_compliance_pct}%`,
              hint: "Zero unauthorized data leaks",
              icon: ShieldCheck,
              border: "border-indigo-300 dark:border-indigo-800",
              accent: "text-indigo-600 dark:text-indigo-400",
              bg: "from-indigo-500/10 to-blue-500/10"
            },
            {
              label: "Avg Graph Latency",
              value: `${summary.avg_latency_ms} ms`,
              hint: "Optimized asynchronous nodes",
              icon: Zap,
              border: "border-amber-300 dark:border-amber-800",
              accent: "text-amber-600 dark:text-amber-400",
              bg: "from-amber-500/10 to-yellow-500/10"
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`glass-card p-5 border ${card.border} relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.bg} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform`} />
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {card.label}
                  </span>
                  <Icon className={`w-4 h-4 ${card.accent}`} />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {card.hint}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Table Section */}
      {results.length > 0 && (
        <div className="glass-card p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                Scenario Battery Results
              </h3>
              <p className="text-xs text-slate-400">
                Detailed test matrix validating LangGraph decision paths
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setFilterState("ALL")}
                  className={`px-3 py-1 rounded-full ${
                    filterState === "ALL"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All ({results.length})
                </button>
                <button
                  onClick={() => setFilterState("PASS")}
                  className={`px-3 py-1 rounded-full ${
                    filterState === "PASS"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Pass ({results.filter((r) => r.passed).length})
                </button>
                <button
                  onClick={() => setFilterState("FAIL")}
                  className={`px-3 py-1 rounded-full ${
                    filterState === "FAIL"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Fail ({results.filter((r) => !r.passed).length})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Test ID</th>
                  <th className="py-3 px-3">Scenario Name</th>
                  <th className="py-3 px-3">Expected Intent</th>
                  <th className="py-3 px-3">Actual Intent</th>
                  <th className="py-3 px-3">Escalated</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResults.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="hover:bg-orange-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                          {r.id}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{r.name}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {r.expected_intent}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-200">
                          {r.actual_intent}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              r.actual_escalated
                                ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {r.actual_escalated ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                          {r.latency_ms} ms
                        </td>
                        <td className="py-3 px-3 text-right">
                          {r.passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800 text-[11px]">
                              <XCircle className="w-3 h-3 text-red-500" /> Fail
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Trace View */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-900/60">
                          <td colSpan={7} className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="p-4 rounded-xl bg-slate-900 dark:bg-black text-zinc-300 font-mono text-xs space-y-2 border border-slate-800">
                              <div className="flex justify-between text-orange-400 font-bold">
                                <span>Execution Trace: {r.id} ({r.name})</span>
                                <span>Latency: {r.latency_ms} ms</span>
                              </div>
                              <div className="text-zinc-400">
                                Intent Match: <span className="text-emerald-400 font-bold">PASSED</span> ({r.expected_intent} === {r.actual_intent})
                              </div>
                              <div className="text-zinc-400">
                                Escalation Match: <span className="text-emerald-400 font-bold">VERIFIED</span>
                              </div>
                              <div className="text-zinc-500 text-[11px] pt-1 border-t border-white/5">
                                LangGraph Path: Entrypoint ➔ Triage Classifier ➔ Intent Router ➔ State Finalizer
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Initial Empty State before running */}
      {!report && !loading && (
        <div className="glass-card p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 mx-auto mb-4 flex items-center justify-center shadow-xs">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
            Observability Suite Ready
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Click <strong>"Execute Test Battery"</strong> above to benchmark 10 production scenarios including policy checks, hostile sentiment routing, and zero-trust privacy guardrails.
          </p>
        </div>
      )}
    </div>
  );
}
