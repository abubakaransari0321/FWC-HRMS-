/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutDashboard, Users, Briefcase, Brain, CalendarRange, 
  CalendarMinus, DollarSign, Award, GraduationCap, BarChart3, 
  Bot, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Role } from "../types.js";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  userRole: Role;
  mongoConnected?: boolean;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  collapsed, 
  setCollapsed,
  userRole,
  mongoConnected = false
}: SidebarProps) {
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.EMPLOYEE] },
    { id: "employees", label: "Employees", icon: Users, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.HR_RECRUITER] },
    { id: "recruitment", label: "Recruitment", icon: Briefcase, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.HR_RECRUITER] },
    { id: "ai-screening", label: "AI Resume Screening", icon: Brain, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.HR_RECRUITER] },
    { id: "attendance", label: "Attendance", icon: CalendarRange, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.HR_RECRUITER, Role.EMPLOYEE] },
    { id: "leave", label: "Leave Management", icon: CalendarMinus, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.HR_RECRUITER, Role.EMPLOYEE] },
    { id: "payroll", label: "Payroll", icon: DollarSign, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.EMPLOYEE] },
    { id: "performance", label: "Performance", icon: Award, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.EMPLOYEE] },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot, roles: [Role.MANAGEMENT_ADMIN, Role.SENIOR_MANAGER, Role.HR_RECRUITER, Role.EMPLOYEE] }
  ];

  // Filter items by user role
  const allowedItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside 
      id="sidebar" 
      className={`fixed left-0 top-0 h-screen transition-all duration-300 border-r border-[#c3c6d7] bg-[#faf8ff] z-50 flex flex-col p-4 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Brand Header */}
      <div className="flex flex-col gap-2 mb-8 px-2">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-bold text-[#004ac6] tracking-tight">FWC HRMS</h1>
              <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Enterprise Suite</p>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-[#004ac6]/10 flex items-center justify-center text-[#004ac6] font-black text-sm">
              F
            </div>
          )}
          <button 
            id="sidebar-toggle-btn"
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1 rounded-lg hover:bg-[#f3f3fe] text-[#505f76] transition-colors self-center ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* MongoDB Status Banner */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-1 w-fit mt-1 self-start shadow-[0_1px_2px_rgba(16,185,129,0.05)] animate-fade-in">
            <span className={`w-1.5 h-1.5 rounded-full ${mongoConnected ? "bg-emerald-500 animate-pulse-slow" : "bg-slate-400"} shrink-0`} />
            <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
              {mongoConnected ? "MongoDB Connected" : "Local database"}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mt-2">
            <span 
              className={`w-2.5 h-2.5 rounded-full border-2 border-white ${mongoConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"} shadow-sm`} 
              title={mongoConnected ? "Cloud Database Connection: Live" : "Local File Backup Mode"}
            />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {allowedItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-3 py-3 px-4 transition-all ${
                isActive 
                  ? "bg-[#d0e1fb] text-[#004ac6] border-l-4 border-[#004ac6] rounded-xl font-medium shadow-sm" 
                  : "text-[#505f76] hover:bg-[#f3f3fe] rounded-xl"
              }`}
              title={collapsed ? item.label : ""}
            >
              <Icon size={20} className={isActive ? "text-[#004ac6]" : "text-[#505f76]"} />
              {!collapsed && (
                <span className="text-[14px] leading-none text-left">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto flex flex-col gap-2">
        <button 
          id="btn-help-center"
          className={`flex items-center justify-center gap-2 bg-[#004ac6] text-white py-3 px-4 rounded-xl font-medium text-sm transition-transform active:scale-[0.98] ${
            collapsed ? "w-10 h-10 p-0 rounded-full" : "w-full"
          }`}
          title="Help Center"
        >
          <HelpCircle size={18} />
          {!collapsed && <span>Help Center</span>}
        </button>
        <button 
          id="btn-sidebar-logout"
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 text-[#505f76] hover:bg-[#f3f3fe] px-4 py-3 rounded-xl transition-all w-full text-left"
          title="Log Out"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-[14px]">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
