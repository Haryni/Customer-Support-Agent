import React, { useState } from "react";
import Header from "./components/Header";
import CustomerChat from "./components/CustomerChat";
import HumanDashboard from "./components/HumanDashboard";
import BenchmarkRunner from "./components/BenchmarkRunner";
import MCPInspector from "./components/MCPInspector";

export default function App() {
  const [activeTab, setActiveTab] = useState("shopper");
  const [lang, setLang] = useState("en");
  const [customerEmail, setCustomerEmail] = useState("alex.rivera@example.com");

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
      />

      <main>
        {activeTab === "shopper" && (
          <CustomerChat lang={lang} customerEmail={customerEmail} />
        )}
        {activeTab === "human" && <HumanDashboard lang={lang} />}
        {activeTab === "benchmark" && <BenchmarkRunner lang={lang} />}
        {activeTab === "mcp" && <MCPInspector />}
      </main>

      <footer className="mt-12 text-center text-xs text-slate-500 border-t border-white/5 pt-6">
        <p>ApexCart E-Commerce Customer Support Agent • Built with LangGraph, FastMCP, SQLite & RAG • System Status: 100% Operational</p>
      </footer>
    </div>
  );
}
