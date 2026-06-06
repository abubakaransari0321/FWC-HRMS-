/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calendar, Plus, CheckCircle, XCircle, Clock, ShieldCheck, FileText } from "lucide-react";
import { Employee, LeaveRequest, Role, LeaveType, LeaveStatus } from "../types.js";

interface LeaveViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  userRole: Role;
}

export default function LeaveView({ 
  employees, 
  leaves, 
  setLeaves, 
  userRole 
}: LeaveViewProps) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.CASUAL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysCount, setDaysCount] = useState("1");
  const [reason, setReason] = useState("");

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      alert("Please provide the leave dates and explanation.");
      return;
    }

    try {
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: "emp-1", // Sarah Jenkins default demo
          type: leaveType,
          startDate,
          endDate,
          days: Number(daysCount),
          reason
        })
      });

      const data = await response.json();
      if (response.ok) {
        setLeaves(prev => [data, ...prev]);
        setIsSubmitOpen(false);
        setReason("");
        setStartDate("");
        setEndDate("");
        alert("Leave application logged and queued successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewLeave = async (id: string, status: LeaveStatus) => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approvedBy: "emp-1"
        })
      });

      const data = await response.json();
      if (response.ok) {
        setLeaves(prev => prev.map(l => l.id === id ? data : l));
        alert(`Leave request successfully marked as ${status}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPI Calculations
  const pendingRequests = leaves.filter(l => l.status === LeaveStatus.PENDING);
  const activeBalances = [
    { label: "Annual Remaining", val: 15, bg: "bg-blue-50 border-blue-200 text-[#004ac6]" },
    { label: "Sick Remaining", val: 10, bg: "bg-green-50 border-green-200 text-green-700" },
    { label: "Casual Remaining", val: 12, bg: "bg-purple-50 border-purple-200 text-purple-700" }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-xs text-[#434655]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">Leave Management</h2>
          <p className="text-body-md text-[#505f76]">Review active leave balances and verify pending time-off requests</p>
        </div>

        <button 
          id="btn-apply-leave-modal"
          onClick={() => setIsSubmitOpen(true)}
          className="bg-[#004ac6] text-white hover:bg-[#2563eb] px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm shrink-0"
        >
          <Plus size={16} />
          <span>Apply for Time-Off</span>
        </button>
      </div>

      {/* Balance widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {activeBalances.map((bal, i) => (
          <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${bal.bg}`}>
            <div>
              <span className="font-semibold block">{bal.label}</span>
              <span className="text-2xl font-bold mt-1 block">{bal.val} days</span>
            </div>
            <Calendar size={24} className="opacity-40" />
          </div>
        ))}
      </div>

      {/* Grid: Apply section drawer overlay vs Review listing */}
      {isSubmitOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-modal overflow-hidden border border-[#c3c6d7] animate-fade-in">
            <div className="bg-[#faf8ff] p-4 border-b border-[#e1e2ed] flex justify-between items-center">
              <h3 className="font-bold text-title-sm text-[#191b23] flex items-center gap-1.5">
                <Calendar size={16} className="text-[#004ac6]" />
                <span>New Leave Request</span>
              </h3>
              <button 
                onClick={() => setIsSubmitOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Type of Time-Off</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6] font-semibold"
                >
                  <option value={LeaveType.CASUAL}>Casual Leave</option>
                  <option value={LeaveType.SICK}>Sick Leave</option>
                  <option value={LeaveType.ANNUAL}>Annual Vacation</option>
                  <option value={LeaveType.UNPAID}>Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Days Estimated</label>
                <input 
                  type="number"
                  min="1"
                  value={daysCount}
                  onChange={(e) => setDaysCount(e.target.value)}
                  className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Reason / Explanation</label>
                <textarea
                  rows={3}
                  placeholder="State reason here..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                  required
                />
              </div>

              <button 
                id="btn-confirm-leave-submit"
                type="submit"
                className="w-full bg-[#004ac6] hover:bg-[#2563eb] text-white py-2.5 rounded-xl font-bold mt-2"
              >
                Log Time-Off Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review list for Admins / Managers */}
      {userRole !== Role.EMPLOYEE && (
        <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#ededf9] flex justify-between items-center">
            <h3 className="font-bold text-title-sm text-[#191b23]">Approvals Queue Pending Audit</h3>
            <span className="bg-orange-100 text-[10px] px-2 py-1 rounded font-bold border border-orange-200 text-orange-700">
              {pendingRequests.length} pending requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f3fe] border-b border-[#c3c6d7] font-bold text-[#505f76] uppercase">
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Range Duration</th>
                  <th className="px-5 py-3">Days</th>
                  <th className="px-5 py-3">Staged Reason</th>
                  <th className="px-5 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededf9]">
                {pendingRequests.map((req) => {
                  const emp = employees.find(e => e.id === req.employeeId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-[#004ac6] font-bold flex items-center justify-center">
                            {emp?.firstName.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-[#191b23] block">{emp ? `${emp.firstName} ${emp.lastName}` : "Sarah Jenkins"}</span>
                            <span className="text-[10px] text-[#737686] font-medium">{emp?.designation || "Engineering"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-700 capitalize">
                        {req.type.toLowerCase()}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-500">
                        {req.startDate} to {req.endDate}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#004ac6]">
                        {req.days} days
                      </td>
                      <td className="px-5 py-3.5 max-w-[150px] truncate font-medium italic text-[#505f76]">
                        "{req.reason}"
                      </td>
                      <td className="px-5 py-3.5 text-right flex gap-1.5 justify-end mt-1">
                        <button
                          id={`btn-approve-leave-${req.id}`}
                          onClick={() => handleReviewLeave(req.id, LeaveStatus.APPROVED)}
                          className="px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-bold"
                        >
                          Approve
                        </button>
                        <button
                          id={`btn-reject-leave-${req.id}`}
                          onClick={() => handleReviewLeave(req.id, LeaveStatus.REJECTED)}
                          className="px-2.5 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded font-bold"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium bg-slate-50/50">
                      All time-off applications are completely audited.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical audits audit file logs */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#ededf9]">
          <h3 className="font-bold text-title-sm text-[#191b23]">Historical Leave Logs</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leaves.filter(l => l.status !== LeaveStatus.PENDING).map((hist, idx) => {
            const empName = employees.find(e => e.id === hist.employeeId)?.firstName || "Employee";
            return (
              <div key={idx} className="p-3 bg-[#f3f3fe] border border-[#ededf9] rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#191b23] text-xs block">{empName}'s {hist.type.toLowerCase()} request</span>
                  <span className="text-[10px] text-[#737686] font-medium block mt-0.5">{hist.startDate} - {hist.endDate} &bull; {hist.days} days</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  hist.status === LeaveStatus.APPROVED ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {hist.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
