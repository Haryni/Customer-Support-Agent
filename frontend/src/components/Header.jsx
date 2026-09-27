import React from "react";
import { MessageSquare, Users, Award, Database, Globe, RefreshCw, Settings, ChevronDown, Calendar, Activity } from "lucide-react";
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
    <div className="mb-8 space-y-6">
      {/* Top Navbar Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30">
            A
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-heading">
            ApexCart
          </span>
        </div>

        {/* Center Floating Pill Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-full border border-slate-200/80 shadow-sm">
          <button
            onClick={() => setActiveTab("shopper")}
            className={`nav-pill ${activeTab === "shopper" ? "nav-pill-active" : "nav-pill-inactive"}`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t.shopperTab}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("human")}
            className={`nav-pill relative ${activeTab === "human" ? "nav-pill-active" : "nav-pill-inactive"}`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t.humanTab}
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("benchmark")}
            className={`nav-pill ${activeTab === "benchmark" ? "nav-pill-active" : "nav-pill-inactive"}`}
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              {t.benchmarkTab}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("mcp")}
            className={`nav-pill ${activeTab === "mcp" ? "nav-pill-active" : "nav-pill-inactive"}`}
          >
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {t.mcpTab}
            </span>
          </button>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
            title="Refresh App"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Language Selector Capsule */}
          <div className="flex items-center gap-1 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent outline-none cursor-pointer uppercase"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
              <option value="hi">HI</option>
            </select>
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <select
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
            >
              {customers.map((c) => (
                <option key={c.email} value={c.email}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-Header Title Row (Matching Steadi "Financial Overview" row) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Support Agent Operations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time customer query resolution, LangGraph agent execution & automated policy compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200/80 text-xs font-medium text-slate-600 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>This Month</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-2 rounded-full border border-orange-200/60">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Live System Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
