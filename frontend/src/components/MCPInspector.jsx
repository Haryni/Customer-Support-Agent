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
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            MCP Protocol Server Tools & RAG Policy Registry
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Standardized Model Context Protocol (MCP) server tools exposed for agent execution alongside RAG policy documentation.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MCP Tools Column */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Registered MCP Server Tools
          </h3>

          {loading ? (
            <p className="text-xs text-slate-400">Loading tools from FastMCP Server...</p>
          ) : (
            <div className="space-y-3">
              {tools.map((t, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-indigo-300">{t.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">MCP Tool</span>
                  </div>
                  <p className="text-xs text-slate-300">{t.description}</p>
                  <div className="pt-2 border-t border-white/5 flex gap-2 font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500">Params:</span> {Object.keys(t.parameters || {}).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RAG Knowledge Base Column */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            RAG Knowledge Base Policy Sections
          </h3>

          <div className="space-y-3">
            {policies.map((p, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5">
                <div className="font-semibold text-xs text-emerald-400">{p.section}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
