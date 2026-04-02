import React, { useState } from "react";
import { 
  Search, 
  Bell, 
  ChevronRight, 
  Plus, 
  LayoutDashboard, 
  ListTodo, 
  Clock, 
  ChevronDown, 
  ExternalLink,
  ShieldAlert,
  Server,
  Database,
  Cloud,
  Layers,
  Network,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AffordanceVisibility() {
  return (
    <div className="min-h-screen bg-[#1a0a2e] text-[#dde4f0] font-sans selection:bg-[#FFD400] selection:text-[#1a0a2e]">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[#3a1a5e] bg-[#1a0a2e]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a0a2e]/80">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" role="button">
            <div className="w-8 h-8 rounded bg-[#FFD400] flex items-center justify-center font-bold text-[#1a0a2e]">M</div>
            <span className="font-semibold text-lg text-white">McCain EA Platform</span>
          </div>
          
          <nav className="flex items-center gap-1">
            <Button variant="ghost" className="bg-[#2a1045] text-white hover:bg-[#3a1a5e] hover:text-white border-b-2 border-[#FFD400] rounded-none px-4 h-10">
              Dashboard
            </Button>
            <Button variant="ghost" className="text-[#9b87c0] hover:bg-[#2a1045] hover:text-white rounded-md px-4 h-10 transition-colors">
              Patterns
            </Button>
            <Button variant="ghost" className="text-[#9b87c0] hover:bg-[#2a1045] hover:text-white rounded-md px-4 h-10 transition-colors">
              Solutions
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b87c0] group-focus-within:text-[#FFD400] transition-colors" />
            <Input 
              placeholder="Search..." 
              className="w-64 pl-9 bg-[#2a1045] border-[#3a1a5e] text-white placeholder:text-[#9b87c0] focus-visible:ring-[#FFD400] focus-visible:ring-1 focus-visible:border-[#FFD400] transition-all hover:border-[#4a2478]"
            />
          </div>
          
          <Button variant="outline" className="border-[#3a1a5e] bg-transparent text-[#dde4f0] hover:bg-[#2a1045] hover:border-[#4a2478] transition-all group">
            AI Portal <ExternalLink className="w-3 h-3 ml-2 text-[#9b87c0] group-hover:text-[#FFD400]" />
          </Button>
          <Button variant="outline" className="border-[#3a1a5e] bg-transparent text-[#dde4f0] hover:bg-[#2a1045] hover:border-[#4a2478] transition-all group">
            GitHub <ExternalLink className="w-3 h-3 ml-2 text-[#9b87c0] group-hover:text-[#FFD400]" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-[#9b87c0] hover:text-white hover:bg-[#2a1045] relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FFD400] rounded-full"></span>
          </Button>
        </div>
      </header>

      {/* KPI Strip */}
      <div className="px-6 py-4 border-b border-[#2a1045] bg-[#1a0a2e] flex gap-4 overflow-x-auto">
        {[
          { label: "Total Requests", value: "12" },
          { label: "Endorsed", value: "9" },
          { label: "Under Review", value: "5" },
          { label: "Avg Risk Score", value: "62" },
          { label: "Vendors Active", value: "0" },
          { label: "Decisions Today", value: "0" }
        ].map((kpi, i) => (
          <div 
            key={i} 
            className="flex-1 min-w-[140px] bg-[#2a1045] border border-[#3a1a5e] rounded-lg p-3 hover:border-[#FFD400] hover:bg-[#3a1a5e] hover:-translate-y-0.5 transition-all cursor-pointer group shadow-sm hover:shadow-md"
            role="button"
            tabIndex={0}
          >
            <div className="text-xs text-[#9b87c0] mb-1 flex items-center justify-between">
              {kpi.label}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#FFD400] transition-opacity" />
            </div>
            <div className="text-2xl font-semibold text-white group-hover:text-[#FFD400] transition-colors">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar Filters */}
        <aside className="w-[240px] shrink-0 border-r border-[#2a1045] overflow-y-auto p-4 flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[#9b87c0] uppercase tracking-wider mb-3 px-2">Quick Views</h3>
            <Button variant="ghost" className="w-full justify-start bg-[#2a1045] text-white hover:bg-[#3a1a5e] hover:text-white border border-[#4a2478]">
              <LayoutDashboard className="w-4 h-4 mr-2 text-[#FFD400]" />
              My Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-[#dde4f0] hover:bg-[#2a1045] hover:text-white group">
              <ListTodo className="w-4 h-4 mr-2 text-[#9b87c0] group-hover:text-white" />
              Review Queue
            </Button>
            <Button variant="ghost" className="w-full justify-start text-[#dde4f0] hover:bg-[#2a1045] hover:text-white group">
              <Clock className="w-4 h-4 mr-2 text-[#9b87c0] group-hover:text-white" />
              Overdue Items
            </Button>
          </div>

          <Accordion type="multiple" defaultValue={["domain", "status"]} className="w-full">
            <AccordionItem value="domain" className="border-[#3a1a5e]">
              <AccordionTrigger className="text-sm font-semibold hover:text-white py-3 hover:bg-[#2a1045] px-2 rounded-md transition-colors">
                Filter by Domain
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3 px-2">
                {["Application & Integration", "Cloud", "Containers", "Data", "Network", "Security"].map((domain) => (
                  <label key={domain} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox className="border-[#9b87c0] data-[state=checked]:bg-[#FFD400] data-[state=checked]:border-[#FFD400] data-[state=checked]:text-[#1a0a2e] transition-colors group-hover:border-white" />
                    <span className="text-sm text-[#dde4f0] group-hover:text-white transition-colors">{domain}</span>
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="status" className="border-[#3a1a5e]">
              <AccordionTrigger className="text-sm font-semibold hover:text-white py-3 hover:bg-[#2a1045] px-2 rounded-md transition-colors">
                Filter by Status
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3 px-2">
                {["Draft", "In Review", "Endorsed", "Rejected"].map((status) => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox className="border-[#9b87c0] data-[state=checked]:bg-[#FFD400] data-[state=checked]:border-[#FFD400] data-[state=checked]:text-[#1a0a2e] transition-colors group-hover:border-white" />
                    <span className="text-sm text-[#dde4f0] group-hover:text-white transition-colors">{status}</span>
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          
          <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto pb-24">
            
            {/* Top Row */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Intake by Domain */}
              <Card className="bg-[#2a1045] border-[#3a1a5e] hover:border-[#4a2478] transition-colors group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-base">Intake by Domain</CardTitle>
                    <CardDescription className="text-[#9b87c0]">Current distribution</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-[#9b87c0] hover:text-[#FFD400] hover:bg-[#3a1a5e]">
                    View Report <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "App & Int.", val: 10, max: 12, color: "bg-blue-500", icon: Layers },
                    { label: "Security", val: 2, max: 12, color: "bg-red-500", icon: ShieldAlert },
                    { label: "Containers", val: 2, max: 12, color: "bg-purple-500", icon: Server },
                    { label: "Cloud", val: 1, max: 12, color: "bg-cyan-500", icon: Cloud },
                    { label: "Data", val: 1, max: 12, color: "bg-green-500", icon: Database },
                    { label: "Network", val: 1, max: 12, color: "bg-orange-500", icon: Network },
                  ].map((item, i) => (
                    <div key={i} className="group/item cursor-pointer p-1 -mx-1 rounded hover:bg-[#3a1a5e] transition-colors flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-[#1a0a2e] flex items-center justify-center shrink-0 group-hover/item:text-white text-[#9b87c0]">
                        <item.icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#dde4f0] group-hover/item:text-white transition-colors">{item.label}</span>
                          <span className="text-[#9b87c0] group-hover/item:text-white font-medium">{item.val}</span>
                        </div>
                        <div className="h-1.5 bg-[#1a0a2e] rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} group-hover/item:opacity-100 opacity-80 transition-opacity`} style={{ width: `${(item.val / item.max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card className="bg-[#2a1045] border-[#3a1a5e] hover:border-[#4a2478] transition-colors">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-white text-base">Risk Distribution</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-[#9b87c0] hover:text-[#FFD400] hover:bg-[#3a1a5e]">
                    Details <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Critical", count: 1, color: "text-red-400", border: "border-red-500/30", bg: "hover:bg-red-500/10" },
                      { label: "High", count: 3, color: "text-orange-400", border: "border-orange-500/30", bg: "hover:bg-orange-500/10" },
                      { label: "Medium", count: 4, color: "text-yellow-400", border: "border-yellow-500/30", bg: "hover:bg-yellow-500/10" },
                      { label: "Low", count: 2, color: "text-green-400", border: "border-green-500/30", bg: "hover:bg-green-500/10" },
                    ].map((risk, i) => (
                      <div key={i} className={`p-3 rounded-lg border bg-[#1a0a2e]/50 cursor-pointer transition-all ${risk.border} ${risk.bg} hover:border-opacity-100 hover:-translate-y-0.5`} role="button">
                        <div className="text-xs text-[#9b87c0] mb-1">{risk.label}</div>
                        <div className={`text-xl font-bold ${risk.color}`}>{risk.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              {/* Intake Review Queue */}
              <Card className="bg-[#2a1045] border-[#3a1a5e] hover:border-[#4a2478] transition-colors flex-1">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-base">Intake Review Queue</CardTitle>
                    <CardDescription className="text-[#9b87c0]">Items pending your action</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-[#4a2478] bg-[#3a1a5e] text-white hover:bg-[#4a2478] hover:text-white group">
                    View Queue <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-[#1a0a2e]/50 border-y border-[#3a1a5e]">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-[#9b87c0] font-medium">Ref</TableHead>
                        <TableHead className="text-[#9b87c0] font-medium">Title</TableHead>
                        <TableHead className="text-[#9b87c0] font-medium">Risk</TableHead>
                        <TableHead className="text-[#9b87c0] font-medium text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { ref: "IR-2025-042", title: "SAP HANA Migration", risk: "High", score: 85, color: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" },
                        { ref: "IR-2025-043", title: "New API Gateway Setup", risk: "Medium", score: 45, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30" },
                        { ref: "IR-2025-044", title: "Internal Tooling Update", risk: "Low", score: 12, color: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" },
                        { ref: "IR-2025-045", title: "Customer Portal Auth Refactor", risk: "Critical", score: 92, color: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" },
                      ].map((row, i) => (
                        <TableRow key={i} className="border-[#3a1a5e] hover:bg-[#3a1a5e] cursor-pointer transition-colors group">
                          <TableCell className="font-mono text-xs text-[#9b87c0] group-hover:text-white transition-colors">{row.ref}</TableCell>
                          <TableCell className="font-medium text-[#dde4f0] group-hover:text-white transition-colors">{row.title}</TableCell>
                          <TableCell>
                            <button className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${row.color}`}>
                              {row.risk} ({row.score})
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 bg-[#1a0a2e] border border-[#4a2478] text-[#9b87c0] group-hover:bg-[#FFD400] group-hover:text-[#1a0a2e] group-hover:border-[#FFD400] transition-all">
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card className="bg-[#2a1045] border-[#3a1a5e] hover:border-[#4a2478] transition-colors">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-base">Recent Activity</CardTitle>
                    <CardDescription className="text-[#9b87c0]">Latest system actions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-[#4a2478] bg-[#3a1a5e] text-white hover:bg-[#4a2478] hover:text-white group">
                    Activity Log <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Endorsed Pattern", item: "AP-004 Event Streaming", time: "10 mins ago", color: "text-green-400" },
                      { action: "Updated Risk", item: "IR-2025-042 HANA Migration", time: "1 hour ago", color: "text-orange-400" },
                      { action: "Submitted Intake", item: "New Vendor Evaluation", time: "2 hours ago", color: "text-[#dde4f0]" },
                      { action: "Approved Solution", item: "Global Supply Chain Sync", time: "3 hours ago", color: "text-green-400" },
                      { action: "Comment Added", item: "IR-2025-045 Auth Refactor", time: "5 hours ago", color: "text-blue-400" },
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-4 items-start group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-[#3a1a5e] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#1a0a2e] border border-[#3a1a5e] group-hover:border-[#FFD400] flex items-center justify-center shrink-0 transition-colors">
                          <Activity className="w-4 h-4 text-[#9b87c0] group-hover:text-[#FFD400] transition-colors" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-[#dde4f0] group-hover:text-white transition-colors">{activity.action}</span>
                            {" "}on{" "}
                            <span className={`font-medium ${activity.color} group-hover:underline underline-offset-4 decoration-current`}>{activity.item}</span>
                          </p>
                          <p className="text-xs text-[#9b87c0]">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
              {/* Pattern Board */}
              <Card className="bg-[#2a1045] border-[#3a1a5e] hover:border-[#4a2478] transition-colors h-full">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-base">Pattern Board</CardTitle>
                    <CardDescription className="text-[#9b87c0]">Top endorsed patterns</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-[#4a2478] bg-[#3a1a5e] text-white hover:bg-[#4a2478] hover:text-white group">
                    Browse All <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {["AP-001", "AP-002", "AP-003", "AP-004"].map((pattern) => (
                      <div key={pattern} className="p-3 rounded-lg border border-[#3a1a5e] bg-[#1a0a2e]/50 hover:bg-[#3a1a5e] hover:border-[#4a2478] cursor-pointer transition-all group hover:-translate-y-0.5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-mono text-xs text-[#FFD400] px-1.5 py-0.5 bg-[#FFD400]/10 rounded border border-[#FFD400]/20">{pattern}</div>
                          <ExternalLink className="w-3 h-3 text-[#9b87c0] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <div className="text-sm font-medium text-[#dde4f0] group-hover:text-white mb-1">Standard Web API</div>
                        <div className="text-xs text-[#9b87c0]">Application & Int.</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
              {/* Solution Designs */}
              <Card className="bg-[#2a1045] border-[#3a1a5e] hover:border-[#4a2478] transition-colors h-full">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-base">Solution Designs</CardTitle>
                    <CardDescription className="text-[#9b87c0]">Recent solution architecture documents</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-[#4a2478] bg-[#3a1a5e] text-white hover:bg-[#4a2478] hover:text-white group">
                    All Solutions <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Global Supply Chain Sync", status: "Approved", statusColor: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" },
                    { name: "IoT Edge Processing", status: "In Review", statusColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30" },
                    { name: "Legacy ERP Decommission", status: "Draft", statusColor: "bg-[#9b87c0]/20 text-[#dde4f0] border-[#9b87c0]/30 hover:bg-[#9b87c0]/30" },
                    { name: "Customer Identity V2", status: "Draft", statusColor: "bg-[#9b87c0]/20 text-[#dde4f0] border-[#9b87c0]/30 hover:bg-[#9b87c0]/30" },
                  ].map((sol, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#3a1a5e] bg-[#1a0a2e]/50 hover:bg-[#3a1a5e] hover:border-[#4a2478] cursor-pointer transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#2a1045] border border-[#4a2478] flex items-center justify-center text-[#9b87c0] group-hover:text-[#FFD400] transition-colors">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-[#dde4f0] group-hover:text-white transition-colors">{sol.name}</span>
                      </div>
                      <button className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${sol.statusColor}`}>
                        {sol.status}
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>

      {/* Floating Action Button for New Request - Extremely prominent */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button 
          size="lg" 
          className="bg-[#FFD400] text-[#1a0a2e] hover:bg-white font-bold shadow-lg shadow-[#FFD400]/20 hover:shadow-[#FFD400]/40 hover:-translate-y-1 transition-all flex items-center gap-2 rounded-full px-6 h-14"
        >
          <Plus className="w-5 h-5" />
          <span className="text-base">New Request</span>
        </Button>
      </div>
    </div>
  );
}
