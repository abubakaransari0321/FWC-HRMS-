/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, UserPlus, Briefcase, CalendarCheck, 
  CreditCard, Calendar, Play, Video, ChevronRight, MessageSquare 
} from "lucide-react";
import { Employee, Application, Role } from "../types.js";

interface DashboardViewProps {
  userRole: Role;
  employees: Employee[];
  applications: Application[];
  setCurrentTab: (tab: string) => void;
  onQuickAction: () => void;
}

export default function DashboardView({ 
  userRole, 
  employees, 
  applications, 
  setCurrentTab,
  onQuickAction
}: DashboardViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState("Last 6 Months");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === "ACTIVE").length;
  const newHires = employees.filter(e => {
    const joinYear = new Date(e.joinDate).getFullYear();
    return joinYear >= 2023;
  }).length;
  
  const openPositionsCount = 12; // Static high-fidelity target from FWC requirements
  const attendanceRate = "94%";
  const payrollStatus = "Processed";

  const kpis = [
    { id: "tot-emp", title: "Total Employees", value: totalEmployees, icon: Users, color: "text-[#004ac6]", trend: "↑ 4%", bg: "bg-[#004ac6]/10" },
    { id: "act-emp", title: "Active Employees", value: activeEmployees, icon: UserCheck, color: "text-green-600", trend: "✓ Stable", bg: "bg-green-100" },
    { id: "new-hires", title: "New Hires", value: newHires, icon: UserPlus, color: "text-purple-600", trend: `+${newHires - 4} this year`, bg: "bg-purple-100" },
    { id: "open-pos", title: "Open Positions", value: openPositionsCount, icon: Briefcase, color: "text-orange-600", trend: "Urgent", bg: "bg-orange-100" },
    { id: "att-rate", title: "Attendance Rate", value: attendanceRate, icon: CalendarCheck, color: "text-[#004ac6]", trend: "⚡ High", bg: "bg-[#004ac6]/10" },
    { id: "payroll-stat", title: "Payroll Status", value: payrollStatus, icon: CreditCard, color: "text-emerald-600", trend: "DONE", bg: "bg-emerald-100" }
  ];

  const recentActivities = [
    { id: "act-1", icon: UserPlus, text: "David Chen was onboarded to", boldText: "Engineering", time: "2 hours ago", color: "bg-[#004ac6] text-white" },
    { id: "act-2", icon: UserCheck, text: "Leave request approved for", boldText: "Elena Rodriguez", time: "5 hours ago", color: "bg-green-600 text-white" },
    { id: "act-3", icon: MessageSquare, text: "Compliance training completed by", boldText: "Sales Team", time: "Yesterday, 4:30 PM", color: "bg-purple-600 text-white" },
    { id: "act-4", icon: Briefcase, text: "System Audit completed for", boldText: "Stitch Payroll", time: "Yesterday, 1:15 PM", color: "bg-orange-600 text-white" }
  ];

  const upcomingInterviews = [
    { id: "int-1", name: "Marcus Wright", role: "Senior Product Designer", time: "10:30 AM", location: "Room 4B", type: "in-person" },
    { id: "int-2", name: "Sarah Al-Farsi", role: "Data Analyst", time: "02:15 PM", location: "Video Call", type: "video" },
    { id: "int-3", name: "James Sullivan", role: "HR Specialist", time: "04:00 PM", location: "Lobby", type: "in-person" }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">Admin Dashboard</h2>
          <p className="text-body-md text-[#505f76]">
            Good morning. Today is {currentTime.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-[#c3c6d7] rounded-xl text-sm font-medium text-[#434655] shadow-sm">
            <Calendar size={16} className="text-[#505f76]" />
            <span>Feb 24, 2024</span>
          </div>
          {userRole !== Role.EMPLOYEE && (
            <button 
              id="btn-quick-action"
              onClick={onQuickAction}
              className="bg-[#004ac6] text-white hover:bg-[#2563eb] px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <UserPlus size={16} />
              <span>Quick Action</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div 
              id={`kpi-${kpi.id}`}
              key={kpi.id} 
              className="bg-white border border-[#c3c6d7] p-4 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  kpi.trend.includes("↑") || kpi.trend.includes("Stable") || kpi.trend === "DONE" || kpi.trend.includes("High")
                    ? "bg-green-100 text-green-700" 
                    : "bg-blue-100 text-[#004ac6]"
                }`}>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-[#505f76] text-xs font-medium">{kpi.title}</p>
              <p className="text-2xl font-bold text-[#191b23] mt-1 tracking-tight">
                {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content (Grid layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Trend Chart (SVG render to prevent canvas resizing issues) */}
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-title-sm text-[#191b23] font-bold">Attendance Trend</h3>
              <p className="text-xs text-[#505f76]">Monthly average percentage</p>
            </div>
            <select 
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="text-xs bg-white border border-[#c3c6d7] rounded-lg px-2.5 py-1.5 font-medium text-[#434655]"
            >
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>

          {/* SVG bar representation */}
          <div className="h-56 flex items-end justify-between px-4 pb-2 pt-6 relative border-b border-[#e1e2ed]">
            {/* Guide lines */}
            <div className="absolute left-0 right-0 top-1/4 b-0 border-t border-[#ededf9] border-dashed text-[10px] text-[#737686] pl-2">75%</div>
            <div className="absolute left-0 right-0 top-2/4 b-0 border-t border-[#ededf9] border-dashed text-[10px] text-[#737686] pl-2">50%</div>
            <div className="absolute left-0 right-0 top-3/4 b-0 border-t border-[#ededf9] border-dashed text-[10px] text-[#737686] pl-2">25%</div>

            {/* Individual Bars representing months */}
            {[
              { month: "Sep", val: 88, highlight: false },
              { month: "Oct", val: 82, highlight: false },
              { month: "Nov", val: 94, highlight: false },
              { month: "Dec", val: 91, highlight: false },
              { month: "Jan", val: 93, highlight: false },
              { month: "Feb", val: 96, highlight: true }
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group relative">
                <div 
                  className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-bold shadow z-10"
                >
                  {bar.val}%
                </div>
                <div 
                  className={`w-12 sm:w-16 rounded-t-lg transition-all duration-300 ${
                    bar.highlight 
                      ? "bg-[#004ac6] hover:bg-[#2563eb]" 
                      : "bg-[#004ac6]/30 hover:bg-[#004ac6]/50"
                  }`}
                  style={{ height: `${bar.val * 1.6}px` }}
                ></div>
                <span className="text-[11px] font-semibold text-[#505f76] mt-2">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring Pipeline Stage Progression Card */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-title-sm text-[#191b23] font-bold">Hiring Pipeline</h3>
            <p className="text-xs text-[#505f76] mb-5">Current candidate staging</p>
          </div>
          
          <div className="flex flex-col gap-4">
            {[
              { stage: "Sourcing", val: 42, color: "bg-[#004ac6]" },
              { stage: "Screening", val: 28, color: "bg-[#2563eb]" },
              { stage: "Interviewing", val: 15, color: "bg-purple-500" },
              { stage: "Offer Staged", val: 8, color: "bg-green-500" }
            ].map((p, i) => {
              const percentage = (p.val / 42) * 100;
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#434655]">{p.stage}</span>
                    <span className="text-[#191b23]">{p.val} applicants</span>
                  </div>
                  <div className="h-2 w-full bg-[#ededf9] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${p.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            id="link-recruitment-portal"
            onClick={() => setCurrentTab("recruitment")}
            className="text-sm font-semibold text-[#004ac6] hover:underline flex items-center justify-center gap-1.5 mt-6 border-t border-[#e1e2ed] pt-4"
          >
            <span>View Recruitment Portal</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>

      {/* Bottom Row - Activity Feed, Department Distribution Donut, Upcoming Interviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-card">
          <h3 className="text-title-sm text-[#191b23] font-bold mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex gap-3 items-start text-xs">
                  <div className={`p-2 rounded-lg ${act.color} shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#434655] leading-relaxed">
                      {act.text} <span className="font-semibold text-[#191b23]">{act.boldText}</span>
                    </p>
                    <span className="text-[10px] text-[#737686] font-medium block mt-1">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Donut representation using manual high fidelity pure styling/SVG */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-card">
          <h3 className="text-title-sm text-[#191b23] font-bold mb-4">Department Distribution</h3>
          
          <div className="flex justify-center items-center h-40 relative">
            {/* Simple visual custom SVG donut chart */}
            <svg className="w-36 h-36 transform -rotate-90">
              {/* Engineering Segment 45% */}
              <circle cx="72" cy="72" r="54" fill="transparent" stroke="#004ac6" strokeWidth="18" strokeDasharray="339.29" strokeDashoffset="152.68" />
              {/* Marketing Segment 20% */}
              <circle cx="72" cy="72" r="54" fill="transparent" stroke="#2563eb" strokeWidth="18" strokeDasharray="339.29" strokeDashoffset="288.40" transform="rotate(162 72 72)" />
              {/* Sales Segment 25% */}
              <circle cx="72" cy="72" r="54" fill="transparent" stroke="#505f76" strokeWidth="18" strokeDasharray="339.29" strokeDashoffset="254.47" transform="rotate(234 72 72)" />
              {/* Operations Segment 10% */}
              <circle cx="72" cy="72" r="54" fill="transparent" stroke="#c3c6d7" strokeWidth="18" strokeDasharray="339.29" strokeDashoffset="305.36" transform="rotate(324 72 72)" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold text-[#191b23]">{totalEmployees || "1.2k"}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#505f76] font-bold">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-medium text-[#434655]">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#004ac6] rounded-full"></div><span>Engineering (45%)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#2563eb] rounded-full"></div><span>Marketing (20%)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#505f76] rounded-full"></div><span>Sales (25%)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#c3c6d7] rounded-full"></div><span>Operations (10%)</span></div>
          </div>
        </div>

        {/* Upcoming Interviews Card */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-sm text-[#191b23] font-bold">Upcoming Interviews</h3>
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">3 Today</span>
          </div>

          <div className="flex flex-col gap-3">
            {upcomingInterviews.map((int) => (
              <div key={int.id} className="flex gap-3 p-2.5 bg-[#f3f3fe] rounded-xl items-center border border-[#ededf9]">
                <div className="w-9 h-9 rounded-full bg-[#004ac6] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {int.name.charAt(0)}{int.name.split(" ")[1]?.charAt(0) || ""}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-xs font-bold text-[#191b23] truncate">{int.name}</h4>
                  <p className="text-[10px] text-[#505f76] truncate">{int.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-[#004ac6] block">{int.time}</span>
                  <span className="text-[9px] text-[#505f76] font-medium">{int.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
