import React, { useState, useEffect } from "react";
import { Database, ShieldCheck, Terminal, BookOpen, Cpu } from "lucide-react";
import { fetchMCPTools } from "../utils/api";

export default function MCPInspector() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMCPTools();
        setTools(data.tools || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const policies = [
    { section: "1. Shipping & Timelines", content: "Standard Ground takes 3-5 business days. Delayed >5 days past estimate qualifies for $10 Store Credit." },
    { section: "2. Returns & Eligibility", content: "30-day return window for unwashed/original condition items. Custom & hygiene items non-returnable." },
    { section: "3. Refunds & Payment Processing", content: "Funds processed 5-7 business days back to original payment method after warehouse inspection." },
    { section: "5. Electronics Warranty", content: "All electronics backed by 1-Year Manufacturer Warranty against defects." }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="clean-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Database className="w-6 h-6 text-orange-500" />
            MCP Protocol Server Tools & RAG Policy Registry
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Standardized Model Context Protocol (MCP) server tools exposed for agent execution alongside RAG policy documentation.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MCP Tools Column */}
        <div className="clean-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-5 h-5 text-orange-500" />
            Registered MCP Server Tools
          </h3>

          {loading ? (
            <p className="text-xs text-slate-500">Loading tools from FastMCP Server...</p>
          ) : (
            <div className="space-y-3">
              {tools.map((t, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-900">{t.name}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">MCP Tool</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                  <div className="pt-2 border-t border-slate-200/60 flex gap-2 font-mono text-[11px] text-slate-500">
                    <span className="text-slate-400">Params:</span> {Object.keys(t.parameters || {}).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RAG Knowledge Base Column */}
        <div className="clean-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            RAG Knowledge Base Policy Sections
          </h3>

          <div className="space-y-3">
            {policies.map((p, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="font-bold text-xs text-emerald-700">{p.section}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
