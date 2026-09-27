import React, { useState } from "react";
import { Award, Play, CheckCircle, XCircle, Clock, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { runBenchmarkSuite } from "../utils/api";
import { translations } from "../utils/translations";

export default function BenchmarkRunner({ lang }) {
  const t = translations[lang] || translations.en;
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleRunBenchmark = async () => {
    setLoading(true);
    try {
      const data = await runBenchmarkSuite();
      setReport(data);
    } catch (err) {
      alert("Failed to run benchmark suite. Ensure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const summary = report?.summary;
  const results = report?.detailed_results || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            AI Agent Evaluation & Benchmark Runner
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Evaluates resolution rate, escalation accuracy, security guardrails compliance, and inference latency across test scenarios.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={loading}
          className="btn-primary text-sm shadow-lg shadow-indigo-500/30"
        >
          {loading ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-amber-300" />
              Running Benchmark...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t.runBenchmark}
            </>
          )}
        </button>
      </div>

      {/* Benchmark Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs text-slate-400 uppercase font-semibold">Resolution Success Rate</div>
            <div className="text-3xl font-extrabold text-white mt-1 font-heading">{summary.resolution_rate_pct}%</div>
            <div className="text-[11px] text-emerald-400 mt-1">{summary.passed_count} / {summary.total_test_cases} Test Cases Passed</div>
          </div>

          <div className="glass-panel p-5 border-l-4 border-l-indigo-500">
            <div className="text-xs text-slate-400 uppercase font-semibold">Escalation Accuracy</div>
            <div className="text-3xl font-extrabold text-white mt-1 font-heading">{summary.escalation_accuracy_pct}%</div>
            <div className="text-[11px] text-indigo-300 mt-1">Triage & Escalation Trigger Precision</div>
          </div>

          <div className="glass-panel p-5 border-l-4 border-l-pink-500">
            <div className="text-xs text-slate-400 uppercase font-semibold">Guardrail Compliance</div>
            <div className="text-3xl font-extrabold text-white mt-1 font-heading">{summary.guardrail_compliance_pct}%</div>
            <div className="text-[11px] text-pink-300 mt-1">Zero Unauthorized Data Exposure</div>
          </div>

          <div className="glass-panel p-5 border-l-4 border-l-amber-500">
            <div className="text-xs text-slate-400 uppercase font-semibold">Avg Query Latency</div>
            <div className="text-3xl font-extrabold text-white mt-1 font-heading">{summary.avg_latency_ms} <span className="text-sm text-slate-400 font-normal">ms</span></div>
            <div className="text-[11px] text-amber-300 mt-1">Sub-10ms Local Execution</div>
          </div>
        </div>
      )}

      {/* Detailed Results Table */}
      {results.length > 0 && (
        <div className="glass-panel p-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-white mb-4">Detailed Test Case Breakdown</h3>
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase">
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Test Name</th>
                <th className="py-3 px-2">Expected Intent</th>
                <th className="py-3 px-2">Actual Intent</th>
                <th className="py-3 px-2">Escalated?</th>
                <th className="py-3 px-2">Latency</th>
                <th className="py-3 px-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-2 font-mono font-bold text-indigo-400">{r.id}</td>
                  <td className="py-3 px-2 font-medium text-white">{r.name}</td>
                  <td className="py-3 px-2 font-mono text-slate-400">{r.expected_intent}</td>
                  <td className="py-3 px-2 font-mono text-indigo-300">{r.actual_intent}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded font-semibold ${r.actual_escalated ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-400'}`}>
                      {r.actual_escalated ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-amber-300">{r.latency_ms} ms</td>
                  <td className="py-3 px-2 text-right">
                    {r.passed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" /> FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!report && !loading && (
        <div className="glass-panel p-12 text-center text-slate-400">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p>Click "Execute Test Benchmark Suite" above to run the automated test battery across all 10 evaluation scenarios.</p>
        </div>
      )}
    </div>
  );
}
