import React from "react";
import {
  MessageSquare,
  Users,
  Award,
  Database,
  Globe,
  RefreshCw,
  ChevronDown,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  Zap,
  Radio
} from "lucide-react";
import { translations } from "../utils/translations";

const PAGE_METADATA = {
  shopper: {
    heading: "Shopper Support Hub",
    badge: "Autonomous Tier-1 Resolution",
    sub: "Resolve orders, initiate policy-checked returns, verify tracking checkpoints, and query store knowledge.",
  },
  human: {
    heading: "Human Escalation Operations",
    badge: "Supervisor Intervention Required",
    sub: "Review real-time AI case summaries, sentiment risk indicators, and execute single-click supervisor resolutions.",
  },
  benchmark: {
    heading: "Evaluation & Observability Suite",
    badge: "10-Scenario Test Suite",
    sub: "Execute comprehensive end-to-end evaluations for resolution rate, escalation accuracy, and security guardrails.",
  },
  mcp: {
    heading: "FastMCP & Policy RAG Registry",
    badge: "Tool Protocol v1.4",
    sub: "Inspect verified FastMCP tools, schema signatures, and semantic retrieval policy vector sections.",
  },
};

export default function Header({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  customerEmail,
  setCustomerEmail,
  darkMode,
  setDarkMode,
  apiStatus = { online: false, mode: "SIMULATOR" }
}) {
  const t = translations[lang] || translations.en;

  const customers = [
    { email: "alex.rivera@example.com", name: "Alex Rivera", hint: "Order #10245 Delivered", role: "Active Shopper" },
    { email: "jordan.lee@example.com", name: "Jordan Lee", hint: "Order #10240 Shoes Return", role: "Return Pending" },
    { email: "maria.garcia@example.com", name: "Maria Garcia", hint: "Order #10215 Delayed Refund", role: "Refund SLA Breach" },
    { email: "david.miller@example.com", name: "David Miller", hint: "Order #10290 3x Late (Escalated)", role: "Hostile Sentiment" },
    { email: "sam.wilson@example.com", name: "Sam Wilson", hint: "Order #10100 Security Check", role: "Guardrail Test" },
    { email: "lisa.chen@example.com", name: "Lisa Chen", hint: "Order #10300 General Inquiry", role: "Standard Tier" },
  ];

  const languages = [
    { code: "en", label: "EN", flag: "🇺🇸", name: "English" },
    { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
    { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
    { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch" },
    { code: "hi", label: "HI", flag: "🇮🇳", name: "हिन्दी" },
  ];

  const page = PAGE_METADATA[activeTab] || PAGE_METADATA.shopper;
  const activeCustomer = customers.find((c) => c.email === customerEmail) || customers[0];
  const initials = activeCustomer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tabs = [
    { id: "shopper", icon: MessageSquare, label: t.shopperTab, tag: "AI Bot" },
    { id: "human", icon: Users, label: t.humanTab, count: 3, alert: true },
    { id: "benchmark", icon: Award, label: t.benchmarkTab, badge: "100%" },
    { id: "mcp", icon: Database, label: t.mcpTab, tag: "4 Tools" },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab("shopper")}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 ring-2 ring-emerald-500/20" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white font-heading leading-tight">
                  ApexCart
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 uppercase tracking-wider font-mono">
                  Agent v2.4
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Multi-Agent System</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {apiStatus.online ? "FastAPI Live" : "Smart Simulation"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Pill Center Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative nav-pill ${
                    active ? "nav-pill-active" : "nav-pill-inactive"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-orange-400 dark:text-orange-500" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white leading-none animate-pulse">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && !active && (
                    <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 leading-none">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Persona Dropdown, Language, Dark Mode, Refresh */}
          <div className="flex items-center gap-2">
            
            {/* Active Customer Persona Selector */}
            <div className="relative group">
              <label className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:border-orange-300 dark:hover:border-orange-500 pl-1.5 pr-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs shadow-sm cursor-pointer transition">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-orange-500 dark:to-amber-500 text-amber-300 dark:text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1">
                    {activeCustomer.name.split(" ")[0]}
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-medium">
                      ({activeCustomer.hint.split(" ")[1] || "Active"})
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                <select
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Switch customer account"
                >
                  {customers.map((c) => (
                    <option key={c.email} value={c.email}>
                      {c.name} — {c.hint} [{c.role}]
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Language Selector */}
            <div className="relative group">
              <label className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer transition">
                <span className="text-sm">
                  {languages.find((l) => l.code === lang)?.flag || "🌐"}
                </span>
                <span className="uppercase text-[11px] font-mono font-bold">
                  {lang}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Select language"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.label})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm transition"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Refresh / Reset demo */}
            <button
              onClick={() => window.location.reload()}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm transition"
              title="Reset application session"
            >
              <RefreshCw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden px-4 pb-2.5 overflow-x-auto no-scrollbar flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nav-pill text-xs py-1 px-3 ${
                  active ? "nav-pill-active" : "nav-pill-inactive"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Hero Section Banner */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-7 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/50">
              <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
              {page.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Thread: #{customerEmail.split("@")[0]}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
            {page.heading}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {page.sub}
          </p>
        </div>

        {/* Status Callout Banner */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>99.98% SLA</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-orange-600 dark:text-orange-400 font-mono">5.1ms avg</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Trust Privacy</span>
          </div>
        </div>
      </section>
    </>
  );
}
