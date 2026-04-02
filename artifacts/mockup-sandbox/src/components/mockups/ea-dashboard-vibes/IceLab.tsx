import React from "react";
import { 
  Search, 
  Bot, 
  Github, 
  LayoutDashboard, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ChevronRight, 
  Server, 
  Database, 
  Cloud, 
  Box, 
  Network, 
  Shield, 
  Plus 
} from "lucide-react";

export function IceLab() {
  return (
    <div className="min-h-screen bg-[#080d14] text-[#F1F5F9] font-sans selection:bg-[#06B6D4]/30">
      {/* Top Nav */}
      <header className="h-14 border-b border-[#1d4ed8]/30 bg-[#111827] flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#06B6D4] rounded-sm flex items-center justify-center">
              <span className="text-[#080d14] font-bold text-xs tracking-tighter">EA</span>
            </div>
            <span className="font-semibold tracking-tight text-sm uppercase text-[#F1F5F9]">McCain EA Platform</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="#" className="text-[#06B6D4] text-xs font-semibold uppercase tracking-widest flex items-center gap-2 border-b-2 border-[#06B6D4] h-14">
              <LayoutDashboard size={14} />
              Dashboard
            </a>
            <a href="#" className="text-[#64748B] hover:text-[#F1F5F9] text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2 h-14">
              <Inbox size={14} />
              Intake
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH..." 
              className="bg-[#080d14] border border-[#1d4ed8]/30 rounded-sm text-xs pl-8 pr-4 py-1.5 focus:outline-none focus:border-[#06B6D4] text-[#F1F5F9] placeholder:text-[#64748B] w-64 uppercase tracking-wider"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-[#080d14] border border-[#1d4ed8]/30 hover:border-[#06B6D4] px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider text-[#F1F5F9] transition-colors">
              <Bot size={14} className="text-[#06B6D4]" />
              AI Portal
            </button>
            <button className="flex items-center gap-2 bg-[#080d14] border border-[#1d4ed8]/30 hover:border-[#06B6D4] px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider text-[#F1F5F9] transition-colors">
              <Github size={14} />
              GitHub
            </button>
          </div>
        </div>
      </header>

      {/* KPI Strip */}
      <div className="border-b border-[#1d4ed8]/30 bg-[#0a0f1a]">
        <div className="grid grid-cols-6 divide-x divide-[#1d4ed8]/30">
          {[
            { label: "Total Requests", value: "13" },
            { label: "Endorsed", value: "9" },
            { label: "Under Review", value: "6" },
            { label: "Avg Risk Score", value: "60" },
            { label: "Vendors Active", value: "0" },
            { label: "Decisions Today", value: "0" }
          ].map((kpi, i) => (
            <div key={i} className="px-6 py-4 flex flex-col gap-1 hover:bg-[#111827] transition-colors">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">{kpi.label}</span>
              <span className="font-mono text-2xl text-[#06B6D4]">{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)] overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[220px] border-r border-[#1d4ed8]/30 bg-[#080d14] overflow-y-auto shrink-0 flex flex-col p-4 gap-6">
          
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] px-2">Pinned Views</h3>
            <div className="space-y-1">
              {[
                { label: "My Dashboard", icon: LayoutDashboard, active: true },
                { label: "Review Queue", icon: Inbox },
                { label: "Overdue Items", icon: Clock },
                { label: "Approved This Month", icon: CheckCircle2 }
              ].map((item, i) => (
                <button key={i} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs text-left transition-colors ${item.active ? 'bg-[#111827] text-[#06B6D4] border border-[#1d4ed8]/30' : 'text-[#F1F5F9] hover:bg-[#111827]'}`}>
                  <item.icon size={14} className={item.active ? "text-[#06B6D4]" : "text-[#64748B]"} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] px-2">Filter by Domain</h3>
            <div className="space-y-1">
              {[
                { label: "All Domains", count: "13", icon: Box },
                { label: "App & Integration", count: "10", icon: Server },
                { label: "Cloud & Platform", count: "1", icon: Cloud },
                { label: "Containers", count: "2", icon: Box },
                { label: "Data", count: "1", icon: Database },
                { label: "Network", count: "1", icon: Network },
                { label: "Security", count: "2", icon: Shield }
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-xs text-left text-[#F1F5F9] hover:bg-[#111827] transition-colors">
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className="text-[#64748B]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#64748B]">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] px-2">Filter by Status</h3>
            <div className="space-y-1">
              {[
                { label: "Endorsed", count: "2" },
                { label: "Under Review", count: "3" },
                { label: "Submitted", count: "3" },
                { label: "Draft", count: "2" }
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-xs text-left text-[#F1F5F9] hover:bg-[#111827] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#64748B]">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0a0f1a]">
          <div className="grid grid-cols-12 gap-6 max-w-[1400px] mx-auto">
            
            {/* Intake by Domain */}
            <div className="col-span-8 bg-[#111827] border border-[#1d4ed8]/30 rounded-sm p-5 flex flex-col">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-6 flex items-center gap-2">
                <Activity size={12} className="text-[#06B6D4]" />
                Intake by Domain
              </h2>
              <div className="flex-1 space-y-4">
                {[
                  { domain: "Application & Integration", val: 10, max: 13 },
                  { domain: "Cloud & Platform", val: 1, max: 13 },
                  { domain: "Containers", val: 2, max: 13 },
                  { domain: "Data", val: 1, max: 13 },
                  { domain: "Network", val: 1, max: 13 },
                  { domain: "Security", val: 2, max: 13 }
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-40 text-xs text-[#F1F5F9] truncate text-right uppercase tracking-wider">{d.domain}</div>
                    <div className="flex-1 h-1.5 bg-[#080d14] rounded-sm overflow-hidden flex items-center border border-[#1d4ed8]/20">
                      <div 
                        className="h-full bg-gradient-to-r from-[#06B6D4]/40 to-[#06B6D4] shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                        style={{ width: `${(d.val / d.max) * 100}%` }}
                      />
                    </div>
                    <div className="w-6 font-mono text-xs text-[#06B6D4]">{d.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="col-span-4 bg-[#111827] border border-[#1d4ed8]/30 rounded-sm p-5 flex flex-col">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-6">Risk Distribution</h2>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="bg-[#080d14] border border-red-500/30 rounded-sm p-3 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-red-400">Critical</span>
                  <span className="font-mono text-2xl text-red-500">1</span>
                </div>
                <div className="bg-[#080d14] border border-amber-500/30 rounded-sm p-3 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-amber-400">High</span>
                  <span className="font-mono text-2xl text-amber-500">3</span>
                </div>
                <div className="bg-[#080d14] border border-[#1d4ed8]/30 rounded-sm p-3 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-[#64748B]">Medium</span>
                  <span className="font-mono text-2xl text-[#F1F5F9]">5</span>
                </div>
                <div className="bg-[#080d14] border border-teal-500/30 rounded-sm p-3 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-teal-400">Low</span>
                  <span className="font-mono text-2xl text-teal-500">2</span>
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-4 uppercase tracking-wider">Most risks concentrated in App & Integration layer.</p>
            </div>

            {/* Intake Review Queue */}
            <div className="col-span-8 bg-[#111827] border border-[#1d4ed8]/30 rounded-sm p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">Intake Review Queue</h2>
                <button className="flex items-center gap-1.5 text-[#080d14] bg-[#06B6D4] hover:bg-[#0EA5E9] px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors">
                  <Plus size={12} />
                  New Request
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1d4ed8]/30">
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">REF</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">Title</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">Risk</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">Status</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-widest text-[#64748B] text-right">Days Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1d4ed8]/10 font-mono text-xs">
                    {[
                      { ref: "IR-1042", title: "SAP HANA Migration", risk: "CRITICAL", rColor: "text-red-500", status: "UNDER REVIEW", days: "14" },
                      { ref: "IR-1043", title: "AWS Landing Zone Expansion", risk: "HIGH", rColor: "text-amber-500", status: "UNDER REVIEW", days: "9" },
                      { ref: "EAR-2051", title: "New CRM Evaluation", risk: "MEDIUM", rColor: "text-[#F1F5F9]", status: "SUBMITTED", days: "3" },
                      { ref: "IR-1045", title: "Legacy DB Decommission", risk: "LOW", rColor: "text-teal-500", status: "DRAFT", days: "1" },
                      { ref: "EAR-2052", title: "O365 Tenant Consolidation", risk: "MEDIUM", rColor: "text-[#F1F5F9]", status: "UNDER REVIEW", days: "7" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#080d14] transition-colors group cursor-pointer">
                        <td className="py-3 text-[#06B6D4]">{row.ref}</td>
                        <td className="py-3 font-sans text-[#F1F5F9]">{row.title}</td>
                        <td className="py-3"><span className={`${row.rColor}`}>{row.risk}</span></td>
                        <td className="py-3 text-[#64748B]">{row.status}</td>
                        <td className="py-3 text-right text-[#64748B]">{row.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pattern Board & Recent Activity Stack */}
            <div className="col-span-4 space-y-6 flex flex-col">
              
              {/* Pattern Board */}
              <div className="bg-[#111827] border border-[#1d4ed8]/30 rounded-sm p-5">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">Pattern Board</h2>
                <div className="space-y-2">
                  {[
                    { id: "AP-001", name: "Microservices Auth" },
                    { id: "AP-002", name: "Data Lakehouse" },
                    { id: "AP-003", name: "Event-Driven Async" },
                    { id: "AP-004", name: "Edge Caching" }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#080d14] border border-[#1d4ed8]/20 rounded-sm hover:border-[#06B6D4]/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-[#06B6D4]">{p.id}</span>
                        <span className="text-xs text-[#F1F5F9]">{p.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-[#64748B] group-hover:text-[#06B6D4]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[#111827] border border-[#1d4ed8]/30 rounded-sm p-5 flex-1">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">Recent Activity</h2>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#1d4ed8]/30 before:to-transparent">
                  {[
                    { time: "10:42 AM", action: "Decision Logged", target: "IR-1042" },
                    { time: "09:15 AM", action: "Status Changed", target: "IR-1043" },
                    { time: "YESTERDAY", action: "New Submission", target: "EAR-2051" },
                    { time: "YESTERDAY", action: "Review Completed", target: "IR-1041" },
                    { time: "OCT 24", action: "Pattern Endorsed", target: "AP-005" }
                  ].map((act, i) => (
                    <div key={i} className="flex items-start gap-3 relative z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] mt-1.5 shrink-0 shadow-[0_0_4px_#06B6D4]" />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#F1F5F9]"><span className="text-[#64748B] mr-1">{act.action}</span> {act.target}</span>
                        <span className="font-mono text-[10px] text-[#64748B] mt-0.5">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Solution Designs */}
            <div className="col-span-12 bg-[#111827] border border-[#1d4ed8]/30 rounded-sm p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-6">Solution Designs</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { title: "Customer Portal V2", status: "IN REVIEW", color: "text-amber-500", borderColor: "border-amber-500/30", type: "Web App" },
                  { title: "ERP Integration Hub", status: "APPROVED", color: "text-teal-500", borderColor: "border-teal-500/30", type: "API" },
                  { title: "IoT Pipeline", status: "DRAFT", color: "text-[#64748B]", borderColor: "border-[#1d4ed8]/30", type: "Streaming" },
                  { title: "Supplier Data Lake", status: "APPROVED", color: "text-teal-500", borderColor: "border-teal-500/30", type: "Data" }
                ].map((sol, i) => (
                  <div key={i} className="bg-[#080d14] border border-[#1d4ed8]/30 rounded-sm p-4 hover:border-[#06B6D4]/50 transition-colors cursor-pointer group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded-sm ${sol.color} ${sol.borderColor}`}>{sol.status}</span>
                      <Box size={14} className="text-[#64748B] group-hover:text-[#06B6D4]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">{sol.title}</h3>
                    <span className="text-xs text-[#64748B] uppercase tracking-wider">{sol.type}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
