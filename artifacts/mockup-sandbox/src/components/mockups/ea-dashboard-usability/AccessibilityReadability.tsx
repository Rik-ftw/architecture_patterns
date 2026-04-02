import React from "react";
import { 
  Search, 
  Bell, 
  Menu, 
  Home, 
  ListTodo, 
  Clock, 
  Server, 
  Cloud, 
  Box, 
  Database, 
  Network, 
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Activity,
  Plus,
  FileText,
  Github,
  Bot
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Reusable components
const KpiCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) => (
  <Card className="bg-[#2a1045] border-[#4a2478] p-6 shadow-md rounded-xl">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-[#3a1a5e] rounded-lg">
        <Icon className="h-8 w-8 text-[#FFD400]" />
      </div>
      <div>
        <p className="text-[#dde4f0] text-lg font-medium">{title}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  </Card>
);

const RiskBadge = ({ level, score }: { level: 'Low' | 'Medium' | 'High' | 'Critical', score?: number }) => {
  const config = {
    Low: { color: "bg-green-900 text-green-100 border-green-700", icon: CheckCircle2 },
    Medium: { color: "bg-yellow-900 text-yellow-100 border-yellow-700", icon: AlertTriangle },
    High: { color: "bg-orange-900 text-orange-100 border-orange-700", icon: AlertCircle },
    Critical: { color: "bg-red-900 text-red-100 border-red-700", icon: AlertOctagon },
  };
  
  const { color, icon: Icon } = config[level];
  
  return (
    <Badge variant="outline" className={`text-base py-1 px-3 flex items-center gap-2 ${color}`}>
      <Icon className="h-4 w-4" />
      <span>{level} {score ? `(${score})` : ''}</span>
    </Badge>
  );
};

export function AccessibilityReadability() {
  return (
    <div className="min-h-screen bg-[#1a0a2e] text-[#ffffff] font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-20 items-center gap-6 border-b border-[#4a2478] bg-[#2a1045] px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#FFD400] rounded-md flex items-center justify-center">
            <span className="text-[#1a0a2e] font-bold text-xl">M</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">McCain EA Platform</span>
        </div>
        
        <nav className="flex items-center gap-8 ml-8">
          <a href="#" className="text-lg font-semibold text-[#FFD400] border-b-2 border-[#FFD400] pb-1">Dashboard</a>
          <a href="#" className="text-lg font-medium text-[#dde4f0] hover:text-white pb-1">Intake</a>
          <a href="#" className="text-lg font-medium text-[#dde4f0] hover:text-white pb-1">Patterns</a>
          <a href="#" className="text-lg font-medium text-[#dde4f0] hover:text-white pb-1">Solutions</a>
        </nav>
        
        <div className="ml-auto flex items-center gap-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9b87c0]" />
            <Input 
              type="search" 
              placeholder="Search architecture..." 
              className="w-full bg-[#1a0a2e] border-[#4a2478] pl-10 h-12 text-base rounded-md focus-visible:ring-[#FFD400] text-white"
            />
          </div>
          <Button variant="outline" className="h-12 border-[#4a2478] bg-[#3a1a5e] text-white hover:bg-[#4a2478] hover:text-white text-base gap-2">
            <Bot className="h-5 w-5 text-[#FFD400]" /> AI Portal
          </Button>
          <Button variant="outline" className="h-12 border-[#4a2478] bg-[#3a1a5e] text-white hover:bg-[#4a2478] hover:text-white text-base gap-2">
            <Github className="h-5 w-5" /> GitHub
          </Button>
          <Avatar className="h-12 w-12 border-2 border-[#4a2478]">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-[#3a1a5e] text-lg">EA</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-[#4a2478] bg-[#2a1045] flex flex-col overflow-y-auto hidden md:flex shrink-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Quick Filters</h2>
            <nav className="space-y-3">
              <a href="#" className="flex items-center gap-4 px-4 py-3 bg-[#3a1a5e] text-white rounded-lg font-medium text-lg border-l-4 border-[#FFD400]">
                <Home className="h-6 w-6 text-[#FFD400]" />
                My Dashboard
              </a>
              <a href="#" className="flex items-center gap-4 px-4 py-3 text-[#dde4f0] hover:bg-[#3a1a5e] hover:text-white rounded-lg font-medium text-lg transition-colors">
                <ListTodo className="h-6 w-6" />
                Review Queue
              </a>
              <a href="#" className="flex items-center gap-4 px-4 py-3 text-[#dde4f0] hover:bg-[#3a1a5e] hover:text-white rounded-lg font-medium text-lg transition-colors">
                <Clock className="h-6 w-6" />
                Overdue Items
              </a>
            </nav>

            <Separator className="my-8 bg-[#4a2478]" />
            
            <Accordion type="multiple" defaultValue={["domain", "status"]} className="w-full">
              <AccordionItem value="domain" className="border-b-0">
                <AccordionTrigger className="text-xl font-bold text-white hover:no-underline py-2 mb-4">
                  Filter by Domain
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {[
                      { icon: Server, label: "App & Integration", count: 10 },
                      { icon: Cloud, label: "Cloud", count: 1 },
                      { icon: Box, label: "Containers", count: 2 },
                      { icon: Database, label: "Data", count: 1 },
                      { icon: Network, label: "Network", count: 1 },
                      { icon: ShieldCheck, label: "Security", count: 2 }
                    ].map((item, i) => (
                      <label key={i} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-[#3a1a5e] rounded-md">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="h-5 w-5 rounded border-[#4a2478] bg-[#1a0a2e] text-[#FFD400] focus:ring-[#FFD400]" />
                          <item.icon className="h-5 w-5 text-[#9b87c0] group-hover:text-white" />
                          <span className="text-lg text-[#dde4f0] group-hover:text-white">{item.label}</span>
                        </div>
                        <Badge variant="secondary" className="bg-[#4a2478] text-white text-sm">{item.count}</Badge>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <Separator className="my-6 bg-[#4a2478]" />
              
              <AccordionItem value="status" className="border-b-0">
                <AccordionTrigger className="text-xl font-bold text-white hover:no-underline py-2 mb-4">
                  Filter by Status
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {[
                      { label: "Draft", count: 3 },
                      { label: "In Review", count: 5 },
                      { label: "Endorsed", count: 9 },
                      { label: "Rejected", count: 0 }
                    ].map((item, i) => (
                      <label key={i} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-[#3a1a5e] rounded-md">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="h-5 w-5 rounded border-[#4a2478] bg-[#1a0a2e] text-[#FFD400] focus:ring-[#FFD400]" />
                          <span className="text-lg text-[#dde4f0] group-hover:text-white">{item.label}</span>
                        </div>
                        <Badge variant="secondary" className="bg-[#4a2478] text-white text-sm">{item.count}</Badge>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <KpiCard title="Total Requests" value={12} icon={FileText} />
              <KpiCard title="Endorsed" value={9} icon={CheckCircle2} />
              <KpiCard title="Under Review" value={5} icon={Clock} />
              <KpiCard title="Avg Risk Score" value={62} icon={Activity} />
              <KpiCard title="Vendors Active" value={0} icon={Box} />
              <KpiCard title="Decisions Today" value={0} icon={ListTodo} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Column 1: Intake by Domain & Risk */}
              <div className="space-y-8 xl:col-span-1">
                <Card className="bg-[#2a1045] border-[#4a2478]">
                  <CardHeader className="p-6 border-b border-[#4a2478]">
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <Database className="h-6 w-6 text-[#FFD400]" />
                      Intake by Domain
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {[
                        { label: "App & Integration", value: 10, max: 12, color: "bg-[#FFD400]" },
                        { label: "Security", value: 2, max: 12, color: "bg-[#9b87c0]" },
                        { label: "Containers", value: 2, max: 12, color: "bg-[#9b87c0]" },
                        { label: "Cloud", value: 1, max: 12, color: "bg-[#9b87c0]" },
                        { label: "Data", value: 1, max: 12, color: "bg-[#9b87c0]" },
                        { label: "Network", value: 1, max: 12, color: "bg-[#9b87c0]" },
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-lg text-[#dde4f0] font-medium">
                            <span>{item.label}</span>
                            <span>{item.value}</span>
                          </div>
                          <div className="h-4 bg-[#1a0a2e] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.color}`} 
                              style={{ width: `${(item.value / item.max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a1045] border-[#4a2478]">
                  <CardHeader className="p-6 border-b border-[#4a2478]">
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-[#FFD400]" />
                      Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-[#3a1a5e] border border-[#4a2478] p-6 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-5xl font-bold text-red-400 mb-2">1</span>
                      <span className="text-lg font-medium text-[#dde4f0] flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-red-400" /> Critical</span>
                    </div>
                    <div className="bg-[#3a1a5e] border border-[#4a2478] p-6 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-5xl font-bold text-orange-400 mb-2">3</span>
                      <span className="text-lg font-medium text-[#dde4f0] flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-400" /> High</span>
                    </div>
                    <div className="bg-[#3a1a5e] border border-[#4a2478] p-6 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-5xl font-bold text-yellow-400 mb-2">4</span>
                      <span className="text-lg font-medium text-[#dde4f0] flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-400" /> Medium</span>
                    </div>
                    <div className="bg-[#3a1a5e] border border-[#4a2478] p-6 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-5xl font-bold text-green-400 mb-2">2</span>
                      <span className="text-lg font-medium text-[#dde4f0] flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /> Low</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column 2 & 3: Main Tables & Content */}
              <div className="space-y-8 xl:col-span-2">
                
                <Card className="bg-[#2a1045] border-[#4a2478]">
                  <CardHeader className="p-6 border-b border-[#4a2478] flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <ListTodo className="h-6 w-6 text-[#FFD400]" />
                      Intake Review Queue
                    </CardTitle>
                    <Button className="bg-[#FFD400] text-[#1a0a2e] hover:bg-[#e6be00] font-bold text-lg h-12 px-6 gap-2">
                      <Plus className="h-5 w-5" /> New Request
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-[#3a1a5e]">
                        <TableRow className="border-[#4a2478] hover:bg-transparent">
                          <TableHead className="text-[#dde4f0] text-lg font-bold py-5 px-6">Ref</TableHead>
                          <TableHead className="text-[#dde4f0] text-lg font-bold py-5 px-6 w-1/2">Title</TableHead>
                          <TableHead className="text-[#dde4f0] text-lg font-bold py-5 px-6 text-right">Risk Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: "IR-2025-012", title: "Global ERP Cloud Migration Strategy", risk: "High", score: 85 },
                          { id: "IR-2025-011", title: "Customer Portal Identity Access Management", risk: "Critical", score: 92 },
                          { id: "IR-2025-010", title: "Factory IoT Sensor Data Lake", risk: "Medium", score: 45 },
                          { id: "IR-2025-009", title: "Internal Employee Directory Mobile App", risk: "Low", score: 15 },
                          { id: "IR-2025-008", title: "Supply Chain Vendor API Gateway", risk: "High", score: 78 },
                        ].map((row, i) => (
                          <TableRow key={row.id} className={`border-[#4a2478] ${i % 2 === 0 ? 'bg-[#2a1045]' : 'bg-[#3a1a5e]/50'} hover:bg-[#4a2478] transition-colors cursor-pointer`}>
                            <TableCell className="font-mono text-[#FFD400] text-lg py-5 px-6">{row.id}</TableCell>
                            <TableCell className="text-white text-lg font-medium py-5 px-6 leading-relaxed">{row.title}</TableCell>
                            <TableCell className="py-5 px-6 text-right">
                              <RiskBadge level={row.risk as any} score={row.score} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pattern Board */}
                  <Card className="bg-[#2a1045] border-[#4a2478]">
                    <CardHeader className="p-6 border-b border-[#4a2478]">
                      <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <Box className="h-6 w-6 text-[#FFD400]" />
                        Top Endorsed Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {[
                          { id: "AP-001", name: "Microservices with Spring Boot" },
                          { id: "AP-002", name: "Event-Driven Async Messaging" },
                          { id: "AP-003", name: "Data Lakehouse Analytics" },
                          { id: "AP-004", name: "Zero Trust Network Access" }
                        ].map(pattern => (
                          <div key={pattern.id} className="bg-[#3a1a5e] border border-[#4a2478] p-5 rounded-xl hover:border-[#FFD400] transition-colors cursor-pointer flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                              <span className="text-[#FFD400] font-mono text-lg">{pattern.id}</span>
                              <span className="text-white font-medium text-lg leading-tight">{pattern.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="text-[#9b87c0] hover:text-white hover:bg-[#4a2478]">
                              <ChevronDown className="h-6 w-6 -rotate-90" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Solution Designs */}
                  <Card className="bg-[#2a1045] border-[#4a2478]">
                    <CardHeader className="p-6 border-b border-[#4a2478]">
                      <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="h-6 w-6 text-[#FFD400]" />
                        Solution Designs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {[
                          { title: "Azure Cloud Landing Zone v2", status: "Approved" },
                          { title: "SAP S/4HANA Integration Hub", status: "In Review" },
                          { title: "Retail Store POS Modernization", status: "Draft" },
                          { title: "Workday HR Data Sync", status: "Approved" }
                        ].map((solution, i) => (
                          <div key={i} className="bg-[#3a1a5e] border border-[#4a2478] p-5 rounded-xl flex flex-col gap-4">
                            <span className="text-white font-medium text-lg leading-tight">{solution.title}</span>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`text-base py-1 px-3 ${
                                solution.status === 'Approved' ? 'bg-green-900 text-green-100 border-green-700' : 
                                solution.status === 'In Review' ? 'bg-blue-900 text-blue-100 border-blue-700' :
                                'bg-slate-700 text-slate-100 border-slate-500'
                              }`}>
                                {solution.status}
                              </Badge>
                              <span className="text-[#9b87c0] text-sm font-medium">Updated 2d ago</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="bg-[#2a1045] border-[#4a2478]">
                  <CardHeader className="p-6 border-b border-[#4a2478]">
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <Clock className="h-6 w-6 text-[#FFD400]" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#4a2478] before:to-transparent">
                      {[
                        { time: "2 hours ago", user: "John Doe", action: "endorsed pattern", target: "AP-002 Event-Driven Async Messaging" },
                        { time: "4 hours ago", user: "Jane Smith", action: "submitted review for", target: "IR-2025-010 Factory IoT" },
                        { time: "Yesterday", user: "System", action: "flagged high risk on", target: "IR-2025-011 Customer Portal" },
                        { time: "Yesterday", user: "Mike Johnson", action: "created new solution", target: "SAP S/4HANA Integration Hub" },
                        { time: "2 days ago", user: "Sarah Williams", action: "approved", target: "Azure Cloud Landing Zone v2" }
                      ].map((item, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#2a1045] bg-[#3a1a5e] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-[#FFD400] text-[#1a0a2e] font-bold text-lg">
                                {item.user === 'System' ? 'SY' : item.user.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-[#4a2478] bg-[#3a1a5e] shadow">
                            <div className="flex flex-col gap-1">
                              <div className="text-white text-lg leading-relaxed">
                                <span className="font-bold text-[#FFD400]">{item.user}</span> {item.action} <span className="font-semibold">{item.target}</span>
                              </div>
                              <time className="text-[#9b87c0] font-medium text-base">{item.time}</time>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
