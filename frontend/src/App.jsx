import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import CustomerChat from "./components/CustomerChat";
import HumanDashboard from "./components/HumanDashboard";
import BenchmarkRunner from "./components/BenchmarkRunner";
import MCPInspector from "./components/MCPInspector";
import { checkApiHealth } from "./utils/api";
import { Sparkles, Terminal, Shield, Cpu, ExternalLink } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("shopper");
  const [lang, setLang] = useState("en");
  const [customerEmail, setCustomerEmail] = useState("alex.rivera@example.com");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("apexcart_theme") === "dark" ||
      (!("apexcart_theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [apiStatus, setApiStatus] = useState({ online: false, mode: "SIMULATOR" });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("apexcart_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("apexcart_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  useEffect(() => {
    checkApiHealth().then((status) => {
      setApiStatus(status);
    });
  }, []);

  return (
    <div className="app-shell min-h-screen text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      <div>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          setLang={setLang}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          apiStatus={apiStatus}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
          {activeTab === "shopper" && (
            <CustomerChat lang={lang} customerEmail={customerEmail} />
          )}
          {activeTab === "human" && <HumanDashboard lang={lang} />}
          {activeTab === "benchmark" && <BenchmarkRunner lang={lang} />}
          {activeTab === "mcp" && <MCPInspector />}
        </main>
      </div>

      <footer className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center flex-wrap gap-2 text-center md:text-left">
            <span className="font-bold text-slate-700 dark:text-slate-300">ApexCart AI Support</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="w-3 h-3 text-orange-500" /> LangGraph Multi-Agent
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Terminal className="w-3 h-3 text-amber-500" /> FastMCP Tools
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" /> Policy RAG Guardrails
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Haryni/Customer-Support-Agent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 font-semibold shadow-xs transition"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {apiStatus.online ? "FastAPI Live" : "Simulator Engine"}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
