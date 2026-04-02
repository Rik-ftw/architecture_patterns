import React from "react";
import {
  Search,
  LayoutDashboard,
  GitBranch,
  Bot,
  Bell,
  Settings,
  Menu,
  ChevronDown,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  Database,
  Cloud,
  Box,
  Shield,
  Network,
  Plus,
  MoreVertical,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// WarmEmber Theme configuration
const theme = {
  bg: "#12100e",
  surface: "#251d18",
  surfaceHover: "#332720",
  border: "#3d2f25",
  text: "#fef3c7",
  textMuted: "#d4b895",
  accent: "#d97706",
  accentHover: "#b45309",
  accentLight: "rgba(217, 119, 6, 0.15)",
  danger: "#991b1b",
  dangerLight: "rgba(153, 27, 27, 0.15)",
  warning: "#c2410c",
  warningLight: "rgba(194, 65, 12, 0.15)",
  success: "#4d7c0f",
  successLight: "rgba(77, 124, 15, 0.15)",
  info: "#854d0e",
  infoLight: "rgba(133, 77, 14, 0.15)",
};

export function WarmEmber() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Navigation */}
      <header
        className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-10"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center font-serif font-bold text-lg"
              style={{ backgroundColor: theme.accent, color: theme.bg }}
            >
              M
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">
              McCain EA Platform
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: theme.accentLight, color: theme.accent }}
            >
              Dashboard
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: theme.textMuted }}
            >
              Intake
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: theme.textMuted }}
            >
              Solutions
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: theme.textMuted }}
            >
              Patterns
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: theme.textMuted }}
            />
            <input
              type="text"
              placeholder="Search platform..."
              className="w-full h-9 pl-9 pr-4 rounded-md text-sm focus:outline-none transition-colors border"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border"
              style={{
                borderColor: theme.border,
                backgroundColor: "transparent",
                color: theme.text,
              }}
            >
              <Bot className="h-4 w-4" style={{ color: theme.accent }} />
              <span>AI Portal</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border"
              style={{
                borderColor: theme.border,
                backgroundColor: "transparent",
                color: theme.text,
              }}
            >
              <GitBranch className="h-4 w-4" />
              <span>GitHub</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-transparent"
              style={{ color: theme.textMuted }}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 border" style={{ borderColor: theme.border }}>
              <AvatarImage src="" />
              <AvatarFallback
                style={{ backgroundColor: theme.surfaceHover, color: theme.text }}
              >
                EA
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="w-[220px] shrink-0 border-r flex flex-col overflow-y-auto hidden md:flex"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <div className="p-4">
            <Button
              className="w-full justify-start gap-2 mb-6"
              style={{ backgroundColor: theme.accent, color: theme.bg }}
            >
              <Plus className="h-4 w-4" />
              New Request
            </Button>

            <div className="space-y-6">
              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-3 font-serif"
                  style={{ color: theme.textMuted }}
                >
                  Pinned Views
                </h4>
                <div className="space-y-1">
                  <SidebarItem icon={LayoutDashboard} label="My Dashboard" active />
                  <SidebarItem icon={Clock} label="Review Queue" />
                  <SidebarItem icon={AlertTriangle} label="Overdue Items" />
                  <SidebarItem icon={CheckCircle2} label="Approved This Month" />
                </div>
              </div>

              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-3 font-serif"
                  style={{ color: theme.textMuted }}
                >
                  Filter by Domain
                </h4>
                <div className="space-y-1">
                  <SidebarFilter label="All Domains" count={13} active />
                  <SidebarFilter label="Application & Int." count={10} />
                  <SidebarFilter label="Cloud & Platform" count={1} />
                  <SidebarFilter label="Containers" count={2} />
                  <SidebarFilter label="Data" count={1} />
                  <SidebarFilter label="Network" count={1} />
                  <SidebarFilter label="Security" count={2} />
                </div>
              </div>

              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-3 font-serif"
                  style={{ color: theme.textMuted }}
                >
                  Filter by Status
                </h4>
                <div className="space-y-1">
                  <SidebarFilter label="Endorsed" count={2} />
                  <SidebarFilter label="Under Review" count={3} />
                  <SidebarFilter label="Submitted" count={3} />
                  <SidebarFilter label="Draft" count={2} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif font-bold tracking-tight">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: theme.textMuted }}>Last updated:</span>
              <span className="font-medium">Just now</span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Total Requests" value="13" />
            <KpiCard
              label="Endorsed"
              value="9"
              trend="+2"
              trendColor={theme.success}
            />
            <KpiCard
              label="Under Review"
              value="6"
              trend="-1"
              trendColor={theme.textMuted}
            />
            <KpiCard
              label="Avg Risk Score"
              value="60"
              icon={Activity}
              iconColor={theme.warning}
            />
            <KpiCard label="Vendors Active" value="0" />
            <KpiCard label="Decisions Today" value="0" />
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Intake by Domain */}
            <BentoCard className="lg:col-span-2 xl:col-span-2" title="Intake by Domain">
              <div className="space-y-4 mt-2">
                <BarChartItem label="Application & Integration" value={10} max={13} />
                <BarChartItem label="Security" value={2} max={13} />
                <BarChartItem label="Containers" value={2} max={13} />
                <BarChartItem label="Cloud & Platform" value={1} max={13} />
                <BarChartItem label="Data" value={1} max={13} />
                <BarChartItem label="Network" value={1} max={13} />
              </div>
            </BentoCard>

            {/* Risk Distribution */}
            <BentoCard title="Risk Distribution">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <RiskTile label="Critical" value="1" color={theme.danger} />
                <RiskTile label="High" value="3" color={theme.warning} />
                <RiskTile label="Medium" value="5" color={theme.accent} />
                <RiskTile label="Low" value="2" color={theme.success} />
              </div>
              <p className="text-sm mt-4 leading-relaxed" style={{ color: theme.textMuted }}>
                Most risk is concentrated in <strong style={{ color: theme.text }}>Application & Integration</strong> requests. The critical item is an overdue legacy system update.
              </p>
            </BentoCard>

            {/* Recent Activity */}
            <BentoCard title="Recent Activity">
              <div className="space-y-4">
                <ActivityItem
                  title="EAR-1042 Submitted"
                  desc="Cloud migration for HR system"
                  time="2h ago"
                />
                <ActivityItem
                  title="Pattern AP-003 Endorsed"
                  desc="Microservices auth gateway"
                  time="5h ago"
                />
                <ActivityItem
                  title="IR-992 Under Review"
                  desc="Vendor assessment: Datadog"
                  time="1d ago"
                />
                <ActivityItem
                  title="Risk Score Updated"
                  desc="EAR-1039 risk increased to High"
                  time="1d ago"
                />
                <ActivityItem
                  title="Draft Created"
                  desc="New API gateway proposal"
                  time="2d ago"
                />
              </div>
            </BentoCard>

            {/* Intake Review Queue */}
            <BentoCard className="lg:col-span-3 xl:col-span-3" title="Intake Review Queue">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: theme.border, color: theme.textMuted }}
                    >
                      <th className="pb-3 font-medium">Reference</th>
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Risk</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Days Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    <QueueRow
                      id="EAR-1042"
                      title="Cloud migration for HR system"
                      risk="High"
                      status="Submitted"
                      days="2"
                    />
                    <QueueRow
                      id="IR-992"
                      title="Vendor assessment: Datadog"
                      risk="Medium"
                      status="Under Review"
                      days="5"
                    />
                    <QueueRow
                      id="EAR-1039"
                      title="Legacy CRM retirement"
                      risk="Critical"
                      status="Under Review"
                      days="12"
                    />
                    <QueueRow
                      id="IR-988"
                      title="New BI Tool evaluation"
                      risk="Low"
                      status="Endorsed"
                      days="1"
                    />
                    <QueueRow
                      id="EAR-1035"
                      title="Mobile App v3 Architecture"
                      risk="Medium"
                      status="Draft"
                      days="8"
                    />
                  </tbody>
                </table>
              </div>
            </BentoCard>

            {/* Pattern Board */}
            <BentoCard title="Endorsed Patterns">
              <div className="space-y-3">
                <PatternCard id="AP-001" name="Event-Driven Microservices" />
                <PatternCard id="AP-002" name="API Gateway Routing" />
                <PatternCard id="AP-003" name="Zero Trust Access" />
                <PatternCard id="AP-004" name="Data Lakehouse" />
              </div>
            </BentoCard>

            {/* Solution Designs */}
            <BentoCard className="lg:col-span-full" title="Solution Designs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SolutionCard
                  title="Global HRIS Implementation"
                  id="SOL-089"
                  status="Approved"
                />
                <SolutionCard
                  title="Supply Chain Analytics"
                  id="SOL-092"
                  status="Approved"
                />
                <SolutionCard
                  title="Customer Portal Overhaul"
                  id="SOL-094"
                  status="In Review"
                />
                <SolutionCard
                  title="IoT Factory Sensors"
                  id="SOL-095"
                  status="Draft"
                />
              </div>
            </BentoCard>
          </div>
        </main>
      </div>
    </div>
  );
}

// Subcomponents

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left"
      style={{
        backgroundColor: active ? theme.surfaceHover : "transparent",
        color: active ? theme.text : theme.textMuted,
      }}
    >
      <Icon className="h-4 w-4" style={{ color: active ? theme.accent : "inherit" }} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function SidebarFilter({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        backgroundColor: active ? theme.surfaceHover : "transparent",
        color: active ? theme.text : theme.textMuted,
      }}
    >
      <span className="font-medium truncate mr-2">{label}</span>
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: active ? theme.accentLight : theme.surfaceHover,
          color: active ? theme.accent : theme.textMuted,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function KpiCard({
  label,
  value,
  trend,
  trendColor,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string;
  trend?: string;
  trendColor?: string;
  icon?: any;
  iconColor?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border flex flex-col justify-between"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium uppercase tracking-wider font-serif" style={{ color: theme.textMuted }}>
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4" style={{ color: iconColor || theme.textMuted }} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-serif">{value}</span>
        {trend && (
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function BentoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col shadow-sm ${className}`}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-lg tracking-tight">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -mr-2"
          style={{ color: theme.textMuted }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function BarChartItem({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = Math.max((value / max) * 100, 2);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span style={{ color: theme.textMuted }}>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: theme.bg }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${theme.accentHover}, ${theme.accent})`,
          }}
        />
      </div>
    </div>
  );
}

function RiskTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg p-3 border flex flex-col items-center justify-center text-center"
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      <span className="text-2xl font-bold font-serif mb-1" style={{ color }}>{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>
        {label}
      </span>
    </div>
  );
}

function ActivityItem({ title, desc, time }: { title: string; desc: string; time: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
          {desc}
        </p>
      </div>
      <div className="ml-auto">
        <span className="text-xs" style={{ color: theme.textMuted }}>
          {time}
        </span>
      </div>
    </div>
  );
}

function QueueRow({
  id,
  title,
  risk,
  status,
  days,
}: {
  id: string;
  title: string;
  risk: "Critical" | "High" | "Medium" | "Low";
  status: string;
  days: string;
}) {
  const riskColors = {
    Critical: { bg: theme.dangerLight, text: theme.danger },
    High: { bg: theme.warningLight, text: theme.warning },
    Medium: { bg: theme.accentLight, text: theme.accent },
    Low: { bg: theme.successLight, text: theme.success },
  };

  const statusColors: Record<string, any> = {
    Endorsed: { bg: theme.successLight, text: theme.success },
    "Under Review": { bg: theme.infoLight, text: theme.info },
    Submitted: { bg: theme.surfaceHover, text: theme.textMuted },
    Draft: { bg: theme.surfaceHover, text: theme.textMuted },
  };

  const riskStyle = riskColors[risk];
  const statusStyle = statusColors[status] || statusColors.Draft;

  return (
    <tr className="border-b last:border-0" style={{ borderColor: theme.border }}>
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: theme.accent }}>
        {id}
      </td>
      <td className="py-3 pr-4 font-medium">{title}</td>
      <td className="py-3 pr-4">
        <span
          className="px-2 py-1 text-xs font-medium rounded-md inline-block"
          style={{ backgroundColor: riskStyle.bg, color: riskStyle.text }}
        >
          {risk}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span
          className="px-2 py-1 text-xs font-medium rounded-md inline-flex items-center gap-1.5"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
        >
          {status === "Endorsed" && <CheckCircle2 className="w-3 h-3" />}
          {status === "Under Review" && <Clock className="w-3 h-3" />}
          {status === "Submitted" && <FileText className="w-3 h-3" />}
          {status}
        </span>
      </td>
      <td className="py-3 text-right" style={{ color: theme.textMuted }}>
        {days}
      </td>
    </tr>
  );
}

function PatternCard({ id, name }: { id: string; name: string }) {
  return (
    <div
      className="p-3 rounded-lg border flex items-center gap-3 transition-colors cursor-pointer hover:border-amber-700/50"
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: theme.surfaceHover, color: theme.accent }}
      >
        <Zap className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-mono mb-0.5" style={{ color: theme.textMuted }}>
          {id}
        </div>
        <div className="text-sm font-medium truncate">{name}</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
    </div>
  );
}

function SolutionCard({ title, id, status }: { title: string; id: string; status: string }) {
  const statusColors: Record<string, any> = {
    Approved: { bg: theme.successLight, text: theme.success },
    "In Review": { bg: theme.infoLight, text: theme.info },
    Draft: { bg: theme.surfaceHover, text: theme.textMuted },
  };
  const statusStyle = statusColors[status] || statusColors.Draft;

  return (
    <div
      className="p-4 rounded-xl border flex flex-col h-full hover:border-amber-700/50 transition-colors cursor-pointer"
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="font-mono text-xs" style={{ color: theme.textMuted }}>{id}</span>
        <span
          className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
        >
          {status}
        </span>
      </div>
      <h4 className="font-serif font-bold mb-4 flex-1">{title}</h4>
      <div className="flex items-center justify-between text-xs mt-auto" style={{ color: theme.textMuted }}>
        <span>Updated 2 days ago</span>
        <Avatar className="h-6 w-6 border" style={{ borderColor: theme.border }}>
          <AvatarFallback style={{ backgroundColor: theme.surfaceHover, color: theme.text, fontSize: '10px' }}>
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
