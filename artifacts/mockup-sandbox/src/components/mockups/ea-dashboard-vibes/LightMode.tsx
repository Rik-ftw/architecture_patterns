import React from "react";
import { Search, Bell, LayoutDashboard, Star, Clock, CheckCircle2, FileText, Activity, AlertTriangle, Box, Database, Cloud, Shield, Server, ArrowRight, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLORS = {
  bg: "#f8f5ff",
  navBar: "#ffffff",
  border: "#e2d9f3",
  sidebar: "#f0ebff",
  card: "#ffffff",
  textMain: "#1a0a2e",
  textMuted: "#6b5a9e",
  accent: "#FFD400",
  purpleDark: "#4a2478",
  purpleMedium: "#3a1a5e",
  risk: {
    critical: "#e74c3c",
    high: "#e67e22",
    medium: "#f39c12",
    low: "#2ecc71"
  }
};

export function LightMode() {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: COLORS.bg, color: COLORS.textMain }}>
      {/* Top Navigation */}
      <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-10" style={{ backgroundColor: COLORS.navBar, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-lg" style={{ backgroundColor: COLORS.purpleDark, color: COLORS.accent }}>
              EA
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: COLORS.textMain }}>McCain EA Platform</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <Button variant="ghost" className="relative h-16 rounded-none font-semibold px-4 hover:bg-transparent" style={{ color: COLORS.textMain }}>
              Dashboard
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: COLORS.accent }}></div>
            </Button>
            <Button variant="ghost" className="h-16 rounded-none font-medium px-4 hover:bg-transparent" style={{ color: COLORS.textMuted }}>
              Requests
            </Button>
            <Button variant="ghost" className="h-16 rounded-none font-medium px-4 hover:bg-transparent" style={{ color: COLORS.textMuted }}>
              Patterns
            </Button>
            <Button variant="ghost" className="h-16 rounded-none font-medium px-4 hover:bg-transparent" style={{ color: COLORS.textMuted }}>
              Solutions
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.textMuted }} />
            <Input 
              placeholder="Search components..." 
              className="pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-1" 
              style={{ borderColor: COLORS.border, color: COLORS.textMain }}
            />
          </div>
          <Button className="font-semibold" style={{ backgroundColor: COLORS.accent, color: COLORS.textMain }}>
            AI PORTAL
          </Button>
          <Button variant="outline" className="font-medium" style={{ borderColor: COLORS.border, color: COLORS.textMain }}>
            GitHub
          </Button>
          <Avatar className="w-9 h-9 border" style={{ borderColor: COLORS.border }}>
            <AvatarFallback style={{ backgroundColor: COLORS.sidebar, color: COLORS.purpleDark }}>JD</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0 overflow-y-auto border-r" style={{ backgroundColor: COLORS.sidebar, borderColor: COLORS.border }}>
          <div className="p-5 space-y-8">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: COLORS.textMain }}>Pinned Views</h2>
              <ul className="space-y-1">
                <li>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/50" style={{ color: COLORS.textMain }}>
                    <Star className="w-4 h-4" style={{ color: COLORS.accent }} />
                    My Dashboard
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/50" style={{ color: COLORS.textMuted }}>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4" /> Review Queue
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white">5</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/50" style={{ color: COLORS.textMuted }}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4" /> Overdue Items
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white">4</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/50" style={{ color: COLORS.textMuted }}>
                    <CheckCircle2 className="w-4 h-4" /> Approved This Month
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: COLORS.textMain }}>Filter by Domain</h2>
              <ul className="space-y-1">
                {[
                  { name: "All Domains", count: 12, icon: LayoutDashboard },
                  { name: "Application & Integration", count: 10, icon: Box },
                  { name: "Cloud & Platform", count: 1, icon: Cloud },
                  { name: "Containers & Kubernetes", count: 2, icon: Box },
                  { name: "Data & Storage", count: 1, icon: Database },
                  { name: "Network & Connectivity", count: 1, icon: Server },
                  { name: "Security & Controls", count: 2, icon: Shield },
                ].map((item, i) => (
                  <li key={i}>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/50" style={{ color: item.name === "All Domains" ? COLORS.textMain : COLORS.textMuted }}>
                      <div className="flex items-center gap-3 truncate">
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white">{item.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: COLORS.textMain }}>Filter by Status</h2>
              <ul className="space-y-1">
                {[
                  { name: "Endorsed", count: 2 },
                  { name: "Under Review", count: 3 },
                  { name: "Submitted", count: 2 },
                  { name: "Draft", count: 2 },
                ].map((item, i) => (
                  <li key={i}>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/50" style={{ color: COLORS.textMuted }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.purpleDark, opacity: 0.5 }}></div>
                        {item.name}
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white">{item.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { label: "Total Requests", value: "12" },
                { label: "Endorsed", value: "9" },
                { label: "Under Review", value: "5" },
                { label: "Avg Risk Score", value: "62" },
                { label: "Vendors Active", value: "0" },
                { label: "Decisions Today", value: "0" }
              ].map((kpi, i) => (
                <Card key={i} className="relative overflow-hidden shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: i === 0 ? COLORS.accent : "transparent" }}></div>
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textMuted }}>{kpi.label}</p>
                    <p className="text-3xl font-bold tracking-tight" style={{ color: COLORS.textMain }}>{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Intake by Domain */}
              <Card className="shadow-sm lg:col-span-1" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.textMain }}>Intake by Domain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mt-4">
                    {[
                      { name: "Application & Integration", val: 10, width: "100%" },
                      { name: "Security & Controls", val: 2, width: "20%" },
                      { name: "Containers & Kubernetes", val: 2, width: "20%" },
                      { name: "Cloud & Platform", val: 1, width: "10%" },
                      { name: "Data & Storage", val: 1, width: "10%" },
                      { name: "Network & Connectivity", val: 1, width: "10%" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium" style={{ color: COLORS.textMain }}>
                          <span className="truncate pr-4">{item.name}</span>
                          <span>{item.val}</span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: COLORS.sidebar }}>
                          <div className="h-full rounded-full" style={{ width: item.width, backgroundColor: COLORS.purpleDark }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Distribution & Recent Activity Wrapper */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <Card className="shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.textMain }}>Risk Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-4 rounded-lg flex flex-col justify-center items-center text-center" style={{ backgroundColor: COLORS.bg }}>
                        <span className="text-3xl font-bold" style={{ color: COLORS.risk.critical }}>1</span>
                        <span className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: COLORS.textMuted }}>Critical</span>
                      </div>
                      <div className="p-4 rounded-lg flex flex-col justify-center items-center text-center" style={{ backgroundColor: COLORS.bg }}>
                        <span className="text-3xl font-bold" style={{ color: COLORS.risk.high }}>3</span>
                        <span className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: COLORS.textMuted }}>High</span>
                      </div>
                      <div className="p-4 rounded-lg flex flex-col justify-center items-center text-center" style={{ backgroundColor: COLORS.bg }}>
                        <span className="text-3xl font-bold" style={{ color: COLORS.risk.medium }}>4</span>
                        <span className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: COLORS.textMuted }}>Medium</span>
                      </div>
                      <div className="p-4 rounded-lg flex flex-col justify-center items-center text-center" style={{ backgroundColor: COLORS.bg }}>
                        <span className="text-3xl font-bold" style={{ color: COLORS.risk.low }}>2</span>
                        <span className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: COLORS.textMuted }}>Low</span>
                      </div>
                    </div>
                    <p className="text-center text-xs mt-4 font-medium" style={{ color: COLORS.textMuted }}>12 requests assessed</p>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.textMain }}>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mt-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: COLORS.purpleDark }}></div>
                          <div>
                            <p className="text-sm font-medium leading-tight" style={{ color: COLORS.textMain }}>Architecture request updated</p>
                            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>REQ-00{i} • 19h ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pattern Board */}
              <Card className="shadow-sm lg:col-span-1" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.textMain }}>Pattern Board</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" style={{ color: COLORS.purpleDark }}>View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    {[
                      { id: "AP-001", name: "API Gateway" },
                      { id: "AP-002", name: "Service Mesh" },
                      { id: "AP-003", name: "BFF" },
                      { id: "AP-004", name: "Event-Driven" },
                    ].map((pattern) => (
                      <div key={pattern.id} className="p-3 rounded-md border flex items-center justify-between group hover:bg-gray-50/50 transition-colors" style={{ borderColor: COLORS.border }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white border flex items-center justify-center text-xs font-bold" style={{ borderColor: COLORS.border, color: COLORS.purpleDark }}>
                            {pattern.id.split('-')[1]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.textMain }}>{pattern.name}</p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>{pattern.id}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide border-0" style={{ backgroundColor: COLORS.accent, color: COLORS.textMain }}>
                          Endorsed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Intake Review Queue */}
              <Card className="shadow-sm lg:col-span-2 flex flex-col" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between border-b px-6 py-4" style={{ borderColor: COLORS.border }}>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.textMain }}>Intake Review Queue</CardTitle>
                  <Button size="sm" className="font-semibold gap-1.5 h-8" style={{ backgroundColor: COLORS.accent, color: COLORS.textMain }}>
                    <Plus className="w-4 h-4" /> New Request
                  </Button>
                </CardHeader>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50/50 border-b" style={{ color: COLORS.textMuted, borderColor: COLORS.border }}>
                      <tr>
                        <th className="px-6 py-3 font-semibold">Reference</th>
                        <th className="px-6 py-3 font-semibold">Title</th>
                        <th className="px-6 py-3 font-semibold">Submitter</th>
                        <th className="px-6 py-3 font-semibold">Risk</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">Days Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                      {[
                        { ref: "REQ-101", title: "New Payment Gateway", sub: "Jane Doe", risk: "High", rColor: COLORS.risk.high, stat: "Under Review", days: 12 },
                        { ref: "REQ-102", title: "Customer Mobile App", sub: "John Smith", risk: "Medium", rColor: COLORS.risk.medium, stat: "Submitted", days: 5 },
                        { ref: "REQ-103", title: "Data Warehouse Migration", sub: "Alice Johnson", risk: "Critical", rColor: COLORS.risk.critical, stat: "Under Review", days: 18 },
                        { ref: "REQ-104", title: "Internal Wiki Setup", sub: "Bob Williams", risk: "Low", rColor: COLORS.risk.low, stat: "Draft", days: 2 },
                        { ref: "REQ-105", title: "Vendor Portal Upgrade", sub: "Charlie Brown", risk: "Medium", rColor: COLORS.risk.medium, stat: "Endorsed", days: 24 },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-opacity-50 transition-colors" style={{ color: COLORS.textMain }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.sidebar} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td className="px-6 py-4 font-medium whitespace-nowrap">{row.ref}</td>
                          <td className="px-6 py-4">{row.title}</td>
                          <td className="px-6 py-4" style={{ color: COLORS.textMuted }}>{row.sub}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.rColor }}></span>
                              {row.risk}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS.sidebar, color: COLORS.purpleDark }}>
                              {row.stat}
                            </span>
                          </td>
                          <td className="px-6 py-4" style={{ color: COLORS.textMuted }}>{row.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Solution Designs */}
              <Card className="shadow-sm lg:col-span-3" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.textMain }}>Solution Designs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      { name: "Supplier Portal", status: "Draft" },
                      { name: "Enterprise MLOps", status: "In Review" },
                      { name: "Azure Landing Zone", status: "Approved" },
                      { name: "Customer Data Platform", status: "Approved" },
                    ].map((sol, i) => (
                      <div key={i} className="p-5 rounded-lg border flex flex-col justify-between group cursor-pointer hover:border-purple-300 transition-colors" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: COLORS.purpleMedium }}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider bg-white border" style={{ color: sol.status === "Approved" ? COLORS.risk.low : COLORS.textMuted, borderColor: COLORS.border }}>
                            {sol.status}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold text-base mb-1" style={{ color: COLORS.textMain }}>{sol.name}</h3>
                          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: COLORS.textMuted }}>
                            <span>View Details</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
