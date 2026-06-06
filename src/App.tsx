/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.js";
import DashboardView from "./components/DashboardView.js";
import EmployeesView from "./components/EmployeesView.js";
import RecruitmentView from "./components/RecruitmentView.js";
import AIScreeningView from "./components/AIScreeningView.js";
import AttendanceView from "./components/AttendanceView.js";
import LeaveView from "./components/LeaveView.js";
import PayrollView from "./components/PayrollView.js";
import PerformanceView from "./components/PerformanceView.js";
import AIAssistantView from "./components/AIAssistantView.js";

import { 
  User, Employee, JobOpening, Application, Attendance, 
  LeaveRequest, Payslip, PerformanceReview, Role, EmploymentType, 
  JobStatus, PipelineStage, ApplicationSource, Priority, AttendanceStatus 
} from "./types.js";
import { Sparkles, HelpCircle, ShieldCheck, UserCheck, RefreshCw, X } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeUser, setActiveUser] = useState<User>({
    id: "u-admin",
    email: "admin@fwc.co.in",
    role: Role.MANAGEMENT_ADMIN,
    createdAt: new Date().toISOString()
  });

  // DB States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [performance, setPerformance] = useState<PerformanceReview[]>([]);
  const [mongoConnected, setMongoConnected] = useState(false);

  // Modals States
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Switch Roles
  const rolesSeedList = [
    { email: "admin@fwc.co.in", label: "Admin Sarah", role: Role.MANAGEMENT_ADMIN },
    { email: "manager@fwc.co.in", label: "Manager Mark", role: Role.SENIOR_MANAGER },
    { email: "hr@fwc.co.in", label: "HR Recruiter Rhea", role: Role.HR_RECRUITER },
    { email: "employee@fwc.co.in", label: "Employee Aman", role: Role.EMPLOYEE }
  ];

  // Load backend states
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [empRes, jobRes, appRes, leaveRes, attRes, payRes, perfRes, dbRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/jobs"),
        fetch("/api/applications"),
        fetch("/api/leaves"),
        fetch("/api/attendance"),
        fetch("/api/payroll"),
        fetch("/api/performance"),
        fetch("/api/db-status")
      ]);

      setEmployees(await empRes.json());
      setJobs(await jobRes.json());
      setApplications(await appRes.json());
      setLeaves(await leaveRes.json());
      setAttendance(await attRes.json());
      setPayslips(await payRes.json());
      setPerformance(await perfRes.json());
      
      const dbStatus = await dbRes.json();
      setMongoConnected(dbStatus.connected);
    } catch (err) {
      console.error("Failed to load backend configurations. Reverting to fallback.", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRoleChange = async (email: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok) {
        setActiveUser(data.user);
        
        // Auto navigate if the current tab is restricted under the new role
        const restrictedTabs: Record<Role, string[]> = {
          [Role.MANAGEMENT_ADMIN]: [],
          [Role.SENIOR_MANAGER]: [],
          [Role.HR_RECRUITER]: ["payroll", "performance"],
          [Role.EMPLOYEE]: ["employees", "recruitment", "ai-screening"]
        };

        if (restrictedTabs[data.user.role as Role].includes(currentTab)) {
          setCurrentTab("dashboard");
        }
        
        alert(`Successfully switched test shell identity to: ${data.user.email} (${data.user.role})`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Employee Submission action handler
  const [newEmpCode, setNewEmpCode] = useState("");
  const [newEmpFirst, setNewEmpFirst] = useState("");
  const [newEmpLast, setNewEmpLast] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpDept, setNewEmpDept] = useState("Engineering");
  const [newEmpDesig, setNewEmpDesig] = useState("Software Engineer");
  const [newEmpSalary, setNewEmpSalary] = useState("75000");

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: newEmpCode,
          firstName: newEmpFirst,
          lastName: newEmpLast,
          email: newEmpEmail,
          department: newEmpDept,
          designation: newEmpDesig,
          salary: Number(newEmpSalary)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEmployees(prev => [...prev, data]);
        setIsAddEmployeeOpen(false);
        // Clear forms
        setNewEmpCode("");
        setNewEmpFirst("");
        setNewEmpLast("");
        setNewEmpEmail("");
        alert(`Employee ${data.firstName} created and dispatched to active directory!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Candidate Pipeline application card handler
  const [newCandName, setNewCandName] = useState("");
  const [newCandEmail, setNewCandEmail] = useState("");
  const [newCandSource, setNewCandSource] = useState<ApplicationSource>(ApplicationSource.LINKEDIN);
  const [newCandPriority, setNewCandPriority] = useState<Priority>(Priority.NORMAL);

  const saveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: newCandName,
          candidateEmail: newCandEmail,
          source: newCandSource,
          priority: newCandPriority,
          jobOpeningId: "job-1"
        })
      });

      const data = await response.json();
      if (response.ok) {
        setApplications(prev => [data, ...prev]);
        setIsAddCandidateOpen(false);
        setNewCandName("");
        setNewCandEmail("");
        alert(`${data.candidateName} has been queued into APPLIED stage of Kanban board!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Switch rendered tabs
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs font-bold text-slate-500 animate-pulse">
          <RefreshCw className="animate-spin text-[#004ac6]" size={28} />
          <span>Synchronizing enterprise registers...</span>
        </div>
      );
    }

    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardView 
            userRole={activeUser.role} 
            employees={employees} 
            applications={applications} 
            setCurrentTab={setCurrentTab}
            onQuickAction={() => setIsAddEmployeeOpen(true)}
          />
        );
      case "employees":
        return (
          <EmployeesView 
            employees={employees} 
            setEmployees={setEmployees}
            userRole={activeUser.role} 
            onAddEmployee={() => setIsAddEmployeeOpen(true)}
            setCurrentTab={setCurrentTab}
          />
        );
      case "recruitment":
        return (
          <RecruitmentView 
            applications={applications} 
            setApplications={setApplications} 
            onAddCandidate={() => setIsAddCandidateOpen(true)}
          />
        );
      case "ai-screening":
        return (
          <AIScreeningView 
            applications={applications} 
            setApplications={setApplications} 
            jobs={jobs} 
            setJobs={setJobs}
          />
        );
      case "attendance":
        return (
          <AttendanceView 
            employees={employees} 
            attendance={attendance} 
            setAttendance={setAttendance} 
          />
        );
      case "leave":
        return (
          <LeaveView 
            employees={employees} 
            leaves={leaves} 
            setLeaves={setLeaves} 
            userRole={activeUser.role} 
          />
        );
      case "payroll":
        return (
          <PayrollView 
            employees={employees} 
            payslips={payslips} 
            setPayslips={setPayslips} 
            userRole={activeUser.role} 
          />
        );
      case "performance":
        return (
          <PerformanceView 
            employees={employees} 
            reviews={performance} 
            setReviews={setPerformance} 
            userRole={activeUser.role} 
          />
        );
      case "ai-assistant":
        return <AIAssistantView />;
      default:
        return <div>Component Not Loaded.</div>;
    }
  };

  return (
    <div id="fwc-app-root" className="min-h-screen bg-[#faf8ff] text-[#191b23] flex font-sans leading-normal">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        userRole={activeUser.role}
        mongoConnected={mongoConnected}
      />

      {/* Main Container Wrapper */}
      <main 
        id="main-app"
        className={`flex-1 transition-all duration-300 min-h-screen flex flex-col p-6 overflow-x-hidden ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        {/* Top Header Section */}
        <header id="top-bar-header" className="flex flex-col md:flex-row justify-between items-stretch md:items-center border-b border-[#c3c6d7] pb-4 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-[#1e293b] uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              FWC Workspace
            </h2>
          </div>

          {/* Test Platform Identity Toggle Hub */}
          <div className="flex flex-wrap items-center gap-2 bg-[#f3f3fe] border border-[#c3c6d7] p-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-[#505f76] px-1 bg-yellow-100 rounded">TEST ROLE:</span>
            {rolesSeedList.map((seed, idx) => {
              const isActive = activeUser.role === seed.role;
              return (
                <button
                  id={`role-btn-${idx}`}
                  key={idx}
                  onClick={() => handleRoleChange(seed.email)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    isActive 
                      ? "bg-[#004ac6] text-white shadow-sm" 
                      : "text-[#505f76] hover:bg-white"
                  }`}
                >
                  {seed.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Tab Module Renderer */}
        <section id="rendering-panel-block" className="flex-1">
          {renderTabContent()}
        </section>

        {/* Add Employee Form Drawer Overlay Dialog */}
        {isAddEmployeeOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-modal overflow-hidden border border-[#c3c6d7] animate-fade-in">
              <div className="bg-[#faf8ff] p-4 border-b border-[#e1e2ed] flex justify-between items-center">
                <h3 className="font-bold text-title-sm text-[#191b23] flex items-center gap-1.5">
                  <UserCheck size={16} className="text-[#004ac6]" />
                  <span>Enroll Employee</span>
                </h3>
                <button 
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveEmployee} className="p-5 flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Employee Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. EMP-101"
                      value={newEmpCode}
                      onChange={(e) => setNewEmpCode(e.target.value)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Basic Annual Pay</label>
                    <input 
                      type="number"
                      placeholder="e.g. 75000"
                      value={newEmpSalary}
                      onChange={(e) => setNewEmpSalary(e.target.value)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">First Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Elena"
                      value={newEmpFirst}
                      onChange={(e) => setNewEmpFirst(e.target.value)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Last Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Rostova"
                      value={newEmpLast}
                      onChange={(e) => setNewEmpLast(e.target.value)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Mail ID</label>
                  <input 
                    type="email"
                    placeholder="elena@fwc.co.in"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Department</label>
                    <select
                      value={newEmpDept}
                      onChange={(e) => setNewEmpDept(e.target.value)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="HR">HR</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Designation</label>
                    <input 
                      type="text"
                      placeholder="e.g. Senior Architect"
                      value={newEmpDesig}
                      onChange={(e) => setNewEmpDesig(e.target.value)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 py px-3 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button 
                  id="btn-submit-employee"
                  type="submit"
                  className="w-full bg-[#004ac6] hover:bg-[#2563eb] text-white py-2.5 rounded-xl font-bold mt-2"
                >
                  Confirm & Dispatch Enrollment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Candidate Form Drawer Overlay Dialog */}
        {isAddCandidateOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-modal overflow-hidden border border-[#c3c6d7] animate-fade-in">
              <div className="bg-[#faf8ff] p-4 border-b border-[#e1e2ed] flex justify-between items-center">
                <h3 className="font-bold text-title-sm text-[#191b23] flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#004ac6]" />
                  <span>Add Candidate</span>
                </h3>
                <button 
                  onClick={() => setIsAddCandidateOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveCandidate} className="p-5 flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Candidate Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={newCandName}
                    onChange={(e) => setNewCandName(e.target.value)}
                    className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Candidate Mail ID</label>
                  <input 
                    type="email"
                    placeholder="alex@gmail.com"
                    value={newCandEmail}
                    onChange={(e) => setNewCandEmail(e.target.value)}
                    className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Channel Source</label>
                    <select
                      value={newCandSource}
                      onChange={(e) => setNewCandSource(e.target.value as ApplicationSource)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value={ApplicationSource.LINKEDIN}>LinkedIn</option>
                      <option value={ApplicationSource.REFERRAL}>Referral</option>
                      <option value={ApplicationSource.INDEED}>Indeed</option>
                      <option value={ApplicationSource.DIRECT}>Direct Application</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Priority Staging</label>
                    <select
                      value={newCandPriority}
                      onChange={(e) => setNewCandPriority(e.target.value as Priority)}
                      className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value={Priority.NORMAL}>Normal</option>
                      <option value={Priority.HIGH}>High Priority</option>
                      <option value={Priority.LOW}>Low Priority</option>
                    </select>
                  </div>
                </div>

                <button 
                  id="btn-submit-candidate"
                  type="submit"
                  className="w-full bg-[#004ac6] hover:bg-[#2563eb] text-white py-2.5 rounded-xl font-bold mt-2"
                >
                  Disburse to Kanban Board
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
