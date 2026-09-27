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
      {/* Title Header Card */}
      <div className="clean-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            AI Agent Evaluation & Benchmark Runner
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Evaluates resolution rate, escalation accuracy, security guardrails compliance, and inference latency across test scenarios.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={loading}
          className="btn-orange text-sm shadow-md"
        >
          {loading ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-white" />
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

      {/* Benchmark Summary Stat Cards (Steadi "Total Balance" style) */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="clean-card p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Success Rate</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{summary.resolution_rate_pct}%</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">{summary.passed_count} / {summary.total_test_cases} Test Cases Passed</div>
          </div>

          <div className="clean-card p-5 border-l-4 border-l-orange-500">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Escalation Accuracy</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{summary.escalation_accuracy_pct}%</div>
            <div className="text-[11px] text-orange-600 mt-1 font-semibold">Triage & Escalation Precision</div>
          </div>

          <div className="clean-card p-5 border-l-4 border-l-slate-900">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guardrail Compliance</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{summary.guardrail_compliance_pct}%</div>
            <div className="text-[11px] text-slate-600 mt-1 font-semibold">Zero Unauthorized Data Exposure</div>
          </div>

          <div className="clean-card p-5 border-l-4 border-l-amber-500">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Query Latency</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{summary.avg_latency_ms} <span className="text-sm text-slate-400 font-normal">ms</span></div>
            <div className="text-[11px] text-amber-600 mt-1 font-semibold">Sub-10ms Local Execution</div>
          </div>
        </div>
      )}

      {/* Detailed Results Table */}
      {results.length > 0 && (
        <div className="clean-card p-6 overflow-x-auto">
          <h3 className="text-base font-bold text-slate-900 mb-4">Detailed Test Case Breakdown</h3>
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Test Name</th>
                <th className="py-3 px-2">Expected Intent</th>
                <th className="py-3 px-2">Actual Intent</th>
                <th className="py-3 px-2">Escalated?</th>
                <th className="py-3 px-2">Latency</th>
                <th className="py-3 px-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-2 font-mono font-bold text-orange-600">{r.id}</td>
                  <td className="py-3 px-2 font-bold text-slate-900">{r.name}</td>
                  <td className="py-3 px-2 font-mono text-slate-500">{r.expected_intent}</td>
                  <td className="py-3 px-2 font-mono text-slate-900 font-semibold">{r.actual_intent}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${r.actual_escalated ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      {r.actual_escalated ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-700">{r.latency_ms} ms</td>
                  <td className="py-3 px-2 text-right">
                    {r.passed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
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
        <div className="clean-card p-12 text-center text-slate-500">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium">Click "Execute Test Benchmark Suite" above to run the automated test battery across all 10 evaluation scenarios.</p>
        </div>
      )}
    </div>
  );
}
