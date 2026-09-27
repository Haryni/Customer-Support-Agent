import React from "react";
import { MessageSquare, Users, Award, Database, Globe, ShieldCheck } from "lucide-react";
import { translations } from "../utils/translations";

export default function Header({ 
  activeTab, 
  setActiveTab, 
  lang, 
  setLang, 
  customerEmail, 
  setCustomerEmail 
}) {
  const t = translations[lang] || translations.en;

  const customers = [
    { email: "alex.rivera@example.com", name: "Alex Rivera (#10245)" },
    { email: "jordan.lee@example.com", name: "Jordan Lee (#10240 Shoes)" },
    { email: "maria.garcia@example.com", name: "Maria Garcia (#10215 Refund)" },
    { email: "david.miller@example.com", name: "David Miller (3 Late Orders!)" },
    { email: "sam.wilson@example.com", name: "Sam Wilson (#10100 Past 60 Days)" },
    { email: "lisa.chen@example.com", name: "Lisa Chen (#10300 Custom Item)" }
  ];

  return (
    <header className="glass-panel mb-6 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-indigo-500/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            ApexCart AI
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LangGraph Engine | SQLite DB | MCP Protocol</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveTab("shopper")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "shopper"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t.shopperTab}
        </button>

        <button
          onClick={() => setActiveTab("human")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
            activeTab === "human"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          {t.humanTab}
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
        </button>

        <button
          onClick={() => setActiveTab("benchmark")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "benchmark"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Award className="w-4 h-4" />
          {t.benchmarkTab}
        </button>

        <button
          onClick={() => setActiveTab("mcp")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "mcp"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Database className="w-4 h-4" />
          {t.mcpTab}
        </button>
      </div>

      {/* Language & Account Selectors */}
      <div className="flex items-center gap-3">
        {/* Multilingual Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
          >
            <option value="en" className="bg-slate-900">🇺🇸 EN</option>
            <option value="es" className="bg-slate-900">🇪🇸 ES</option>
            <option value="fr" className="bg-slate-900">🇫🇷 FR</option>
            <option value="de" className="bg-slate-900">🇩🇪 DE</option>
            <option value="hi" className="bg-slate-900">🇮🇳 HI</option>
          </select>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
          <span className="text-slate-400">{t.selectAccount}</span>
          <select
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="bg-transparent text-indigo-300 font-semibold outline-none cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.email} value={c.email} className="bg-slate-900 text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
