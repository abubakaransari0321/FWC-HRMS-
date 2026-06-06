/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, Grid, List, Search, Plus, Mail, Phone, Calendar, 
  ChevronRight, Circle, Download, Filter, Landmark, User, ShieldCheck, Clock
} from "lucide-react";
import { Employee, Role, EmployeeStatus, EmploymentType } from "../types.js";

interface EmployeesViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  userRole: Role;
  onAddEmployee: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function EmployeesView({ 
  employees, 
  setEmployees, 
  userRole,
  onAddEmployee,
  setCurrentTab
}: EmployeesViewProps) {
  const [viewType, setViewType] = useState<"grid" | "table">("grid");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "metrics" | "payroll">("overview");

  const departments = ["All", "Engineering", "Marketing", "Sales", "Operations", "HR", "Finance", "Legal", "Design"];

  // Filtering Logic
  const filtered = employees.filter((emp) => {
    const matchDept = selectedDept === "All" || emp.department === selectedDept;
    const matchStatus = selectedStatus === "All" || emp.status === selectedStatus;
    const matchSearch = 
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchStatus && matchSearch;
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative min-h-[calc(100vh-120px)]">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">Employee Directory</h2>
          <p className="text-body-md text-[#505f76]">{employees.length} employees synchronized across departments</p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {userRole !== Role.EMPLOYEE && (
            <button 
              id="btn-add-emp-card"
              onClick={onAddEmployee}
              className="bg-[#004ac6] text-white hover:bg-[#2563eb] px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          )}
          <button 
            id="btn-export-directory"
            className="border border-[#c3c6d7] text-[#434655] hover:bg-[#f3f3fe] p-2.5 rounded-lg transition-colors shadow-sm"
            title="Export CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Switch controls */}
      <div className="bg-white border border-[#c3c6d7] p-4 rounded-xl shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737686]">
            <Search size={18} />
          </span>
          <input 
            type="text"
            placeholder="Search candidate name, credentials, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6]"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-[#505f76]" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-transparent border-none font-semibold text-[#434655] focus:outline-none"
            >
              <option disabled>Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl px-3 py-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-transparent border-none font-semibold text-[#434655] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="h-6 w-[1PX] bg-[#c3c6d7]"></div>

          {/* Grid/Table Switchers */}
          <div className="flex bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg p-1">
            <button 
              id="grid-view-toggle"
              onClick={() => setViewType("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewType === "grid" ? "bg-[#d0e1fb] text-[#004ac6]" : "text-[#505f76] hover:bg-white"
              }`}
            >
              <Grid size={15} />
            </button>
            <button 
              id="table-view-toggle"
              onClick={() => setViewType("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewType === "table" ? "bg-[#d0e1fb] text-[#004ac6]" : "text-[#505f76] hover:bg-white"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid rendering */}
      {viewType === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((emp) => (
            <div 
              id={`emp-card-${emp.id}`}
              key={emp.id} 
              className="bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card hover:border-[#004ac6] hover:shadow-card-hover transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  {emp.avatarUrl ? (
                    <img 
                      src={emp.avatarUrl} 
                      alt={emp.firstName} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#d0e1fb]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold text-xl uppercase border-2 border-[#d0e1fb]">
                      {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-1 border-2 border-white rounded-full">
                    <Circle 
                      size={12} 
                      fill={emp.status === "ACTIVE" ? "#16a34a" : emp.status === "ON_LEAVE" ? "#ca8a04" : "#94a3b8"} 
                      className={emp.status === "ACTIVE" ? "text-green-600" : emp.status === "ON_LEAVE" ? "text-yellow-600" : "text-gray-400"}
                    />
                  </span>
                </div>

                <h3 className="font-bold text-[#191b23] text-sm group-hover:text-[#004ac6] transition-colors">
                  {emp.firstName} {emp.lastName}
                </h3>
                <p className="text-xs text-[#505f76] font-medium mt-0.5">{emp.designation}</p>
                
                <span className="bg-[#ededf9] text-[#004ac6] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase mt-2.5">
                  {emp.department}
                </span>

                <div className="w-full border-t border-[#ededf9] my-4 pt-3 flex flex-col gap-2 text-xs text-[#505f76]">
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail size={13} className="shrink-0" />
                    <span className="truncate max-w-[170px]">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Phone size={13} />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                id={`btn-inspect-emp-${emp.id}`}
                onClick={() => setSelectedEmployeeId(emp.id)}
                className="w-full text-center text-xs font-semibold text-[#004ac6] py-2 bg-[#f3f3fe] hover:bg-[#d0e1fb] rounded-xl border border-[#ededf9] transition-colors"
              >
                Inspect Profile
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full bg-white border border-[#c3c6d7] py-12 text-center rounded-2xl">
              <Users size={32} className="mx-auto text-[#737686] mb-3 opacity-60" />
              <p className="text-sm text-[#505f76] font-medium">No employees found matched the criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* Table rendering */
        <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f3fe] border-b border-[#c3c6d7] text-xs font-bold text-[#505f76] uppercase">
                  <th className="px-5 py-4">Employee ID</th>
                  <th className="px-5 py-4">Photo</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Designation</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Join Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededf9] text-xs text-[#434655]">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#f3f3fe] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#191b23]">{emp.employeeCode}</td>
                    <td className="px-5 py-4">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[#c3c6d7]" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold uppercase border border-[#c3c6d7]">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#191b23]">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-[#f3f3fe] border border-[#c3c6d7] px-2 py-0.5 rounded text-[10px] font-bold text-[#004ac6]">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium">{emp.designation}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          emp.status === "ACTIVE" ? "bg-green-500" : emp.status === "ON_LEAVE" ? "bg-yellow-500" : "bg-gray-400"
                        }`}></span>
                        <span className="font-semibold text-[11px] capitalize">{emp.status.toLowerCase().replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium">{emp.joinDate}</td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        id={`btn-table-inspect-${emp.id}`}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className="text-[#004ac6] hover:underline font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-out Detailed Profile Inspector Drawer / Overlay Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div onClick={() => setSelectedEmployeeId(null)} className="absolute inset-0"></div>
          
          <div className="bg-white w-full max-w-lg h-full shadow-modal overflow-y-auto relative flex flex-col justify-between border-l border-[#c3c6d7] animate-slide-in">
            {/* Inspector Header */}
            <div>
              <div className="flex justify-between items-center border-b border-[#e1e2ed] p-5">
                <h3 className="font-bold text-headline-md text-[#191b23]">Detailed Profile</h3>
                <button 
                  id="btn-close-inspector"
                  onClick={() => setSelectedEmployeeId(null)}
                  className="p-1 rounded-full hover:bg-[#f3f3fe] text-[#737686]"
                >
                  &times; Close
                </button>
              </div>

              {/* Identity Banner */}
              <div className="p-5 flex gap-4 items-center border-b border-[#f3f3fe] bg-[#faf8ff]">
                {selectedEmployee.avatarUrl ? (
                  <img src={selectedEmployee.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#004ac6]" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold text-xl uppercase border-2 border-[#004ac6]">
                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-[#191b23] text-sm">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                  <p className="text-xs text-[#505f76] font-medium">{selectedEmployee.designation} &bull; {selectedEmployee.employeeCode}</p>
                  <p className="text-xs font-semibold text-[#004ac6] uppercase mt-1">{selectedEmployee.department}</p>
                </div>
              </div>

              {/* Sub tabs in drawer */}
              <div className="flex border-b border-[#e1e2ed] text-xs font-semibold">
                {[
                  { id: "overview", label: "Overview", icon: User },
                  { id: "metrics", label: "Attendance Log", icon: Clock },
                  { id: "payroll", label: "Salary info", icon: Landmark }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      id={`tab-inspect-${tab.id}`}
                      key={tab.id}
                      onClick={() => setInspectorTab(tab.id as any)}
                      className={`flex-1 flex justify-center items-center gap-1.5 py-3 border-b-2 transition-all ${
                        inspectorTab === tab.id 
                          ? "border-[#004ac6] text-[#004ac6] font-bold" 
                          : "border-transparent text-[#737686] hover:text-[#191b23]"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="p-5 text-xs text-[#434655]">
                
                {inspectorTab === "overview" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#f3f3fe] p-3 rounded-xl border border-[#ededf9]">
                        <span className="text-[#737686] font-medium block">Mail ID</span>
                        <span className="font-bold text-[#191b23] mt-0.5 block">{selectedEmployee.email}</span>
                      </div>
                      <div className="bg-[#f3f3fe] p-3 rounded-xl border border-[#ededf9]">
                        <span className="text-[#737686] font-medium block">Phone number</span>
                        <span className="font-bold text-[#191b23] mt-0.5 block">{selectedEmployee.phone || "Not Spec."}</span>
                      </div>
                      <div className="bg-[#f3f3fe] p-3 rounded-xl border border-[#ededf9]">
                        <span className="text-[#737686] font-medium block">Hired date</span>
                        <span className="font-bold text-[#191b23] mt-0.5 block">{selectedEmployee.joinDate}</span>
                      </div>
                      <div className="bg-[#f3f3fe] p-3 rounded-xl border border-[#ededf9]">
                        <span className="text-[#737686] font-medium block">Employment contract</span>
                        <span className="font-bold text-[#191b23] mt-0.5 block capitalize">{selectedEmployee.employmentType?.toLowerCase().replace("_", " ")}</span>
                      </div>
                    </div>
                    <div className="bg-green-100/50 p-4 rounded-xl border border-green-200 flex gap-3 items-start">
                      <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={16} />
                      <div>
                        <span className="font-bold text-green-900">Background Checked & Verified</span>
                        <p className="text-green-800 font-medium text-[11px] mt-0.5">This staff member possesses fully authenticated certifications aligning with criteria.</p>
                      </div>
                    </div>
                  </div>
                )}

                {inspectorTab === "metrics" && (
                  <div className="flex flex-col gap-4">
                    <h5 className="font-bold text-[#191b23]">Detailed Attendance History</h5>
                    <div className="flex flex-col gap-2.5">
                      {[
                        { date: "2026-06-05", status: "PRESENT", clockIn: "08:52 AM", clockOut: "05:35 PM" },
                        { date: "2026-06-04", status: "PRESENT", clockIn: "08:48 AM", clockOut: "05:30 PM" },
                        { date: "2026-06-03", status: "LATE", clockIn: "09:35 AM", clockOut: "05:42 PM" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between p-3 bg-[#f3f3fe] rounded-xl items-center border border-[#ededf9]">
                          <div>
                            <span className="font-bold text-[#191b23] block">{item.date}</span>
                            <span className="text-[10px] text-[#505f76] font-medium">{item.clockIn} to {item.clockOut}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inspectorTab === "payroll" && (
                  <div className="flex flex-col gap-4">
                    <h5 className="font-bold text-[#191b23]">Strategic Salary Records</h5>
                    <div className="bg-[#f3f3fe] p-4 rounded-xl border border-[#ededf9] flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#505f76]">Annual Basic Salary</span>
                        <span className="font-bold text-[#191b23] text-sm">₹ {(selectedEmployee.salary || 60000).toLocaleString()}/month</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#505f76]">State Provident Fund Allocation</span>
                        <span className="font-semibold text-[#191b23]">₹ {((selectedEmployee.salary || 60000) * 0.12).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#505f76]">Allowances & Bonuses</span>
                        <span className="font-semibold text-green-600">₹ {((selectedEmployee.salary || 60000) * 0.20).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-[#c3c6d7] pt-2 mt-2 flex justify-between items-center text-sm font-bold text-[#191b23]">
                        <span>Staged Monthly Net Pay</span>
                        <span className="text-[#004ac6]">₹ {((selectedEmployee.salary || 60000) * 1.08).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-[#e1e2ed] p-5 flex gap-2">
              <button 
                id="btn-msg-emp"
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setCurrentTab("ai-assistant");
                }}
                className="flex-1 text-center font-bold text-xs py-2.5 bg-[#004ac6] text-white rounded-lg hover:bg-[#2563eb] transition-colors"
              >
                Send Message
              </button>
              <button 
                id="btn-edit-emp-status"
                onClick={() => {
                  if (confirm("Promote/modify employee status?")) {
                    const nextStatus = selectedEmployee.status === "ACTIVE" ? EmployeeStatus.ON_LEAVE : EmployeeStatus.ACTIVE;
                    setEmployees(employees.map(e => e.id === selectedEmployee.id ? { ...e, status: nextStatus } : e));
                  }
                }}
                className="text-center font-bold text-xs py-2.5 px-4 bg-[#f3f3fe] border border-[#c3c6d7] text-[#434655] rounded-lg hover:bg-[#ededf9] transition-colors"
                title="Toggle On Leave Status"
              >
                Toggle Status
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
