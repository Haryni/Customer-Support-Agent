import React, { useState, useEffect } from "react";
import {
  Database,
  BookOpen,
  Cpu,
  Terminal,
  Search,
  Copy,
  Check,
  Code2,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Zap,
  Tag
} from "lucide-react";
import { fetchMCPTools } from "../utils/api";

export default function MCPInspector() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedName, setCopiedName] = useState(null);
  const [policySearch, setPolicySearch] = useState("");
  const [activeTool, setActiveTool] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMCPTools();
        setTools(data.tools || []);
        if (data.tools && data.tools.length > 0) {
          setActiveTool(data.tools[0]);
        }
      } catch (e) {
        setError("Could not load FastMCP tools from API.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopySchema = (tool) => {
    navigator.clipboard.writeText(JSON.stringify(tool, null, 2));
    setCopiedName(tool.name);
    setTimeout(() => setCopiedName(null), 1800);
  };

  const policies = [
    {
      id: "sec-01",
      section: "Section 1: Shipping & Delivery Timelines",
      category: "Fulfillment",
      content:
        "Standard ground delivery is 3–5 business days. Deliveries delayed more than 5 business days past the original carrier estimate qualify for an automatic $10 goodwill store credit. Carrier tracking status updates are pulled in real time via FastMCP.",
      vectorMatch: "0.96 semantic similarity",
      guardrail: "Verify tracking number before citing ETA"
    },
    {
      id: "sec-02",
      section: "Section 2: Returns & Item Eligibility",
      category: "Returns",
      content:
        "Shoppers have a 30 calendar day window from delivery to initiate a return for unworn, unopened merchandise with original tags intact. Custom-made apparel, final clearance, and hygienic items are non-returnable unless defective.",
      vectorMatch: "0.94 semantic similarity",
      guardrail: "Check order date <= 30 days"
    },
    {
      id: "sec-03",
      section: "Section 3: Refund SLAs & Methods",
      category: "Billing",
      content:
        "Approved refunds are automatically returned to the original payment method within 5–7 business days following central warehouse inspection. Store credit can be issued instantly upon customer request with no processing delay.",
      vectorMatch: "0.91 semantic similarity",
      guardrail: "Escalate if warehouse delay > 7 days"
    },
    {
      id: "sec-04",
      section: "Section 4: Electronics & Defect Warranty",
      category: "Warranty",
      content:
        "All certified consumer electronics include a comprehensive 1-year manufacturer warranty against hardware defects. Damaged-on-arrival (DOA) claims reported within 48 hours receive priority expedited RMA replacement without return wait time.",
      vectorMatch: "0.93 semantic similarity",
      guardrail: "Require serial number & photo claim"
    },
  ];

  const filteredPolicies = policies.filter((p) => {
    if (!policySearch.trim()) return true;
    const q = policySearch.toLowerCase();
    return (
      p.section.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Banner Card */}
      <div className="glass-card p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Database className="w-3.5 h-3.5" />
              Tool Registry & RAG Corpus
            </span>
            <span className="text-xs text-slate-400">• Model Context Protocol (FastMCP)</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Cpu className="w-6 h-6 text-orange-500" />
            FastMCP Tools & Policy Vector Store
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Inspect the live tool signatures callable by the LangGraph agent, alongside vectorized company policies retrieved for ground truth verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-mono text-xs font-bold border border-orange-200 dark:border-orange-800">
            {tools.length} Tools Loaded
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            {policies.length} Policy Embeddings
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/40 p-4 text-xs font-semibold text-orange-800 dark:text-orange-300">
          {error}
        </div>
      )}

      {/* Main Grid: Tools (Left) & Policies (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: FastMCP Tools (Col 6) */}
        <div className="lg:col-span-6 glass-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Terminal className="w-5 h-5 text-orange-500" />
              Verified FastMCP Tools
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Python FastMCP v0.4
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => {
                const isSelected = activeTool?.name === tool.name;
                const isCopied = copiedName === tool.name;
                const paramKeys = Object.keys(tool.parameters || {});

                return (
                  <div
                    key={tool.name}
                    onClick={() => setActiveTool(tool)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-sm"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-orange-500" />
                          {tool.name}()
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                          Tool
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySchema(tool);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 flex items-center gap-1 font-mono"
                        title="Copy tool JSON schema"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Schema</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {tool.description}
                    </p>

                    {/* Parameters schema chips */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                      <span className="text-slate-400 text-[10px]">Params:</span>
                      {paramKeys.length === 0 ? (
                        <span className="text-slate-400 text-[10px]">None</span>
                      ) : (
                        paramKeys.map((pKey) => (
                          <span
                            key={pKey}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-800"
                          >
                            {pKey}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Policy RAG Vector Store (Col 6) */}
        <div className="lg:col-span-6 glass-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Policy Knowledge Base (RAG)
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Vector Grounding
            </span>
          </div>

          {/* Search policy bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              placeholder="Search store policies (returns, shipping, refunds)..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
            />
          </div>

          <div className="space-y-3">
            {filteredPolicies.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-xs text-emerald-900 dark:text-emerald-300 font-heading">
                    {p.section}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
                    {p.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {p.content}
                </p>

                <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    Rule: {p.guardrail}
                  </span>
                  <span>{p.vectorMatch}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
