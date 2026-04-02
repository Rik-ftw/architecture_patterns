import React from "react"
import { Search, Github, LayoutDashboard, ChevronDown, Filter, FileText, Bell, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Clock, Box, Shield, Network, Database, Cloud, FileBox, LayoutTemplate, Share2 } from "lucide-react"

// --- Fake Data ---

const KPIS = [
  { label: "Total Requests", value: "12", trend: "+2 this week" },
  { label: "Endorsed", value: "9", trend: "+1 this week" },
  { label: "Under Review", value: "5", trend: "Needs attention" },
  { label: "Avg Risk Score", value: "62", trend: "-5 from last month" },
  { label: "Vendors Active", value: "0", trend: "Stable" },
  { label: "Decisions Today", value: "0", trend: "0 pending" },
]

const INTAKE_QUEUE = [
  { id: "IR-2025-012", title: "Customer Data Platform Integration", domain: "Data", risk: "High", riskScore: 85, status: "Under Review", date: "2025-05-10" },
  { id: "IR-2025-011", title: "New ERP Migration - Phase 1", domain: "App & Int", risk: "Medium", riskScore: 45, status: "Draft", date: "2025-05-09" },
  { id: "IR-2025-010", title: "Cloud Firewall Rules Update", domain: "Security", risk: "Critical", riskScore: 92, status: "Under Review", date: "2025-05-08" },
  { id: "IR-2025-009", title: "Supply Chain IoT Sensors", domain: "Network", risk: "Low", riskScore: 12, status: "Endorsed", date: "2025-05-05" },
  { id: "IR-2025-008", title: "Marketing Analytics Dashboard", domain: "Data", risk: "Low", riskScore: 18, status: "Endorsed", date: "2025-05-02" },
]

const DOMAIN_DATA = [
  { name: "App & Integration", count: 10, color: "bg-blue-400" },
  { name: "Security", count: 2, color: "bg-red-400" },
  { name: "Containers", count: 2, color: "bg-teal-400" },
  { name: "Cloud", count: 1, color: "bg-cyan-400" },
  { name: "Data", count: 1, color: "bg-indigo-400" },
  { name: "Network", count: 1, color: "bg-purple-400" },
]

const RECENT_ACTIVITY = [
  { user: "Sarah J.", action: "endorsed pattern AP-004", time: "2h ago" },
  { user: "Mike T.", action: "submitted IR-2025-012", time: "4h ago" },
  { user: "AI Assistant", action: "flagged high risk on IR-2025-010", time: "1d ago" },
  { user: "Elena R.", action: "approved Solution Design SD-99", time: "1d ago" },
  { user: "System", action: "daily sync completed", time: "2d ago" },
]

const RISK_DIST = [
  { label: "Critical", count: 1, color: "text-red-500", border: "border-red-500/30" },
  { label: "High", count: 3, color: "text-orange-500", border: "border-orange-500/30" },
  { label: "Medium", count: 4, color: "text-yellow-500", border: "border-yellow-500/30" },
  { label: "Low", count: 2, color: "text-green-500", border: "border-green-500/30" },
]

const PATTERNS = [
  { id: "AP-001", name: "Microservices Gateway", endorsed: true },
  { id: "AP-002", name: "Event-Driven Data Sync", endorsed: true },
  { id: "AP-003", name: "Zero-Trust Access", endorsed: true },
  { id: "AP-004", name: "Serverless ETL", endorsed: true },
]

const SOLUTIONS = [
  { id: "SD-102", name: "Global HR System", status: "Draft" },
  { id: "SD-101", name: "Factory Floor Network", status: "In Review" },
  { id: "SD-100", name: "Customer Portal V2", status: "Approved" },
  { id: "SD-099", name: "Legacy API Sunsetting", status: "Approved" },
]

// --- Helper Components ---

const RiskBadge = ({ risk, score }: { risk: string; score: number }) => {
  let colors = "bg-green-500/20 text-green-400 border-green-500/30";
  if (risk === "Medium") colors = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (risk === "High") colors = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (risk === "Critical") colors = "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-bold border ${colors}`}>
      {risk} <span className="ml-1.5 opacity-80 font-medium text-xs">({score})</span>
    </div>
  )
}

export function InformationHierarchy() {
  return (
    <div className="min-h-screen bg-[#1a0a2e] text-[#dde4f0] font-sans selection:bg-[#FFD400] selection:text-[#1a0a2e]">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-[#1a0a2e]/95 backdrop-blur border-b border-[#2a1045]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#FFD400] flex items-center justify-center text-[#1a0a2e] font-black tracking-tighter">
              MC
            </div>
            <span className="font-semibold text-lg tracking-tight">EA Platform</span>
          </div>
          
          <nav className="flex items-center gap-1 bg-[#2a1045] p-1 rounded-md">
            <button className="px-3 py-1.5 rounded bg-[#3a1a5e] text-[#dde4f0] text-sm font-medium shadow-sm">
              Dashboard
            </button>
            <button className="px-3 py-1.5 rounded text-[#9b87c0] hover:text-[#dde4f0] text-sm font-medium transition-colors">
              Intake
            </button>
            <button className="px-3 py-1.5 rounded text-[#9b87c0] hover:text-[#dde4f0] text-sm font-medium transition-colors">
              Patterns
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md ml-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b87c0]" />
            <input 
              type="text" 
              placeholder="Search architecture repository..." 
              className="w-full bg-[#2a1045] border border-[#3a1a5e] rounded-md py-1.5 pl-9 pr-4 text-sm text-[#dde4f0] placeholder:text-[#9b87c0] focus:outline-none focus:border-[#FFD400]/50 focus:ring-1 focus:ring-[#FFD400]/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#2a1045] hover:bg-[#3a1a5e] border border-[#FFD400]/20 text-[#FFD400] text-sm font-medium transition-colors">
            <Zap className="w-4 h-4 fill-current" />
            AI Portal
          </button>
          <button className="p-2 rounded-md hover:bg-[#2a1045] text-[#9b87c0] hover:text-[#dde4f0] transition-colors">
            <Github className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#4a2478] flex items-center justify-center font-medium text-sm border border-[#3a1a5e]">
            SJ
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Tertiary: Left Sidebar - Muted, compact */}
        <aside className="w-[220px] shrink-0 border-r border-[#2a1045] p-4 flex flex-col gap-6 opacity-60 hover:opacity-100 transition-opacity">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#9b87c0] mb-3 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Quick Filters
            </h3>
            <div className="flex flex-col gap-0.5">
              <button className="text-left px-2 py-1.5 rounded text-sm bg-[#2a1045] text-[#dde4f0] font-medium">My Dashboard</button>
              <button className="text-left px-2 py-1.5 rounded text-sm text-[#9b87c0] hover:bg-[#2a1045]/50 hover:text-[#dde4f0]">Review Queue</button>
              <button className="text-left px-2 py-1.5 rounded text-sm text-[#9b87c0] hover:bg-[#2a1045]/50 hover:text-[#dde4f0]">Overdue Items</button>
            </div>
          </div>

          <div>
            <button className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#9b87c0] mb-2 group">
              Filter by Domain <ChevronDown className="w-3 h-3 group-hover:text-[#dde4f0]" />
            </button>
          </div>

          <div>
            <button className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#9b87c0] mb-2 group">
              Filter by Status <ChevronDown className="w-3 h-3 group-hover:text-[#dde4f0]" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-57px)]">
          <div className="max-w-[1400px] mx-auto space-y-12">
            
            {/* Primary: KPI Strip - Unambiguous focus */}
            <section>
              <h1 className="text-3xl font-light tracking-tight mb-6 flex items-center gap-3">
                Overview
                <span className="h-px bg-gradient-to-r from-[#FFD400]/50 to-transparent flex-1 ml-4 opacity-50"></span>
              </h1>
              <div className="grid grid-cols-6 gap-6">
                {KPIS.map((kpi, i) => (
                  <div key={i} className="bg-[#2a1045] rounded-xl p-6 border border-[#3a1a5e] shadow-lg flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4a2478] group-hover:bg-[#FFD400] transition-colors"></div>
                    <span className="text-sm font-semibold text-[#9b87c0] uppercase tracking-wider mb-2">{kpi.label}</span>
                    <span className="text-5xl font-light text-white tracking-tight leading-none mb-3">{kpi.value}</span>
                    <span className="text-xs text-[#9b87c0] mt-auto font-medium">{kpi.trend}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Primary Action Surface: Intake Review Queue */}
              <section className="lg:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-medium tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#FFD400]" />
                    Intake Review Queue
                  </h2>
                  <button className="bg-[#FFD400] hover:bg-[#FFD400]/90 text-[#1a0a2e] px-5 py-2.5 rounded-md text-sm font-bold shadow-md transition-colors flex items-center gap-2">
                    <span className="text-lg leading-none">+</span> New Request
                  </button>
                </div>
                
                <div className="bg-[#2a1045] rounded-xl border border-[#3a1a5e] shadow-xl overflow-hidden flex-1 flex flex-col">
                  <table className="w-full text-left border-collapse flex-1">
                    <thead>
                      <tr className="border-b border-[#3a1a5e] bg-[#2a1045]/80">
                        <th className="px-6 py-4 text-xs font-semibold text-[#9b87c0] uppercase tracking-wider">Ref</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#9b87c0] uppercase tracking-wider">Title & Domain</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#9b87c0] uppercase tracking-wider">Risk Assessment</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#9b87c0] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#9b87c0] uppercase tracking-wider text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3a1a5e]/50">
                      {INTAKE_QUEUE.map((item) => (
                        <tr key={item.id} className="hover:bg-[#3a1a5e]/40 transition-colors group">
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-mono text-[#9b87c0] group-hover:text-[#dde4f0] transition-colors">
                            {item.id}
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-base font-medium text-white mb-1.5">{item.title}</div>
                            <div className="text-sm text-[#9b87c0] flex items-center gap-1.5">
                              <Box className="w-3.5 h-3.5" /> {item.domain}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <RiskBadge risk={item.risk} score={item.riskScore} />
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-2 text-sm font-medium ${
                              item.status === 'Endorsed' ? 'text-green-400' : 
                              item.status === 'Under Review' ? 'text-[#FFD400]' : 'text-[#9b87c0]'
                            }`}>
                              {item.status === 'Endorsed' && <CheckCircle2 className="w-4 h-4" />}
                              {item.status === 'Under Review' && <Clock className="w-4 h-4" />}
                              {item.status === 'Draft' && <FileBox className="w-4 h-4" />}
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm text-[#9b87c0]">
                            {item.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 border-t border-[#3a1a5e] bg-[#2a1045]/50 flex justify-center mt-auto">
                    <button className="text-sm text-[#9b87c0] hover:text-[#FFD400] font-medium transition-colors flex items-center gap-2">
                      View all requests →
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                
                <section>
                  <h3 className="text-sm font-semibold tracking-tight text-[#9b87c0] uppercase mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Risk Distribution
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {RISK_DIST.map(r => (
                      <div key={r.label} className={`bg-[#2a1045]/50 border ${r.border} rounded-lg p-4 flex items-center justify-between`}>
                        <span className="text-sm font-medium text-[#9b87c0]">{r.label}</span>
                        <span className={`text-xl font-bold ${r.color}`}>{r.count}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold tracking-tight text-[#9b87c0] uppercase mb-3 flex items-center gap-2">
                    <Box className="w-4 h-4" /> Intake by Domain
                  </h3>
                  <div className="bg-[#2a1045]/50 border border-[#3a1a5e] rounded-lg p-5 space-y-4">
                    {DOMAIN_DATA.map(d => (
                      <div key={d.name} className="flex items-center gap-4">
                        <div className="w-28 text-xs text-[#9b87c0] truncate text-right font-medium">{d.name}</div>
                        <div className="flex-1 h-2 bg-[#1a0a2e] rounded-full overflow-hidden">
                          <div className={`h-full ${d.color} rounded-full`} style={{ width: `${(d.count / 10) * 100}%` }}></div>
                        </div>
                        <div className="w-8 text-xs font-mono text-white text-right">{d.count}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold tracking-tight text-[#9b87c0] uppercase mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Recent Activity
                  </h3>
                  <div className="bg-[#2a1045]/50 border border-[#3a1a5e] rounded-lg p-5">
                    <div className="space-y-5">
                      {RECENT_ACTIVITY.map((act, i) => (
                        <div key={i} className="flex gap-4 text-sm relative">
                          {i !== RECENT_ACTIVITY.length - 1 && (
                            <div className="absolute left-[3.5px] top-4 bottom-[-20px] w-[2px] bg-[#3a1a5e]/50"></div>
                          )}
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4a2478] border-2 border-[#9b87c0] mt-1 shrink-0 z-10"></div>
                          <div className="flex-1 min-w-0 -mt-0.5">
                            <p className="text-[#dde4f0] text-sm leading-snug">
                              <span className="font-semibold text-white">{act.user}</span> {act.action}
                            </p>
                            <p className="text-xs text-[#9b87c0] mt-1">{act.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

              </div>
            </div>

            {/* Bottom Row: Libraries - Visually Subordinate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#3a1a5e]/50 opacity-90">
              
              <section>
                <h3 className="text-xs font-semibold tracking-wider text-[#9b87c0] uppercase mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Pattern Board</span>
                  <button className="text-xs hover:text-[#FFD400] transition-colors">View All</button>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {PATTERNS.map(p => (
                    <div key={p.id} className="bg-[#2a1045]/30 border border-[#3a1a5e]/40 hover:border-[#4a2478] hover:bg-[#2a1045]/60 rounded-md p-3 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#9b87c0] group-hover:text-[#FFD400] transition-colors">{p.id}</span>
                        {p.endorsed && <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />}
                      </div>
                      <h4 className="text-sm font-medium text-[#dde4f0] leading-tight">{p.name}</h4>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold tracking-wider text-[#9b87c0] uppercase mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Solution Designs</span>
                  <button className="text-xs hover:text-[#FFD400] transition-colors">View All</button>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {SOLUTIONS.map(s => (
                    <div key={s.id} className="bg-[#2a1045]/30 border border-[#3a1a5e]/40 hover:border-[#4a2478] hover:bg-[#2a1045]/60 rounded-md p-3 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#9b87c0]">{s.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          s.status === 'Approved' ? 'bg-green-500/10 text-green-400' :
                          s.status === 'In Review' ? 'bg-[#FFD400]/10 text-[#FFD400]' :
                          'bg-white/5 text-[#9b87c0]'
                        }`}>{s.status}</span>
                      </div>
                      <h4 className="text-sm font-medium text-[#dde4f0] leading-tight">{s.name}</h4>
                    </div>
                  ))}
                </div>
              </section>

            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
