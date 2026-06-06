/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Clock, CalendarCheck, ShieldAlert, User, LogIn, LogOut, CheckCircle } from "lucide-react";
import { Employee, Attendance } from "../types.js";

interface AttendanceViewProps {
  employees: Employee[];
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
}

export default function AttendanceView({ 
  employees, 
  attendance, 
  setAttendance 
}: AttendanceViewProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const handleCheckIn = async () => {
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: "emp-1" }) // Default logged in Sarah Jenkins
      });

      const data = await response.json();
      if (response.ok) {
        setAttendance(prev => [data, ...prev]);
        setIsCheckedIn(true);
        setCheckInTime(new Date(data.checkIn).toLocaleTimeString());
        alert("You have successfully clocked in for today!");
      } else {
        alert(data.error || "Failed to check in. (Already complete)");
        setIsCheckedIn(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: "emp-1" })
      });

      const data = await response.json();
      if (response.ok) {
        setAttendance(prev => prev.map(a => (a.date === data.date && a.employeeId === "emp-1") ? data : a));
        setIsCheckedIn(false);
        setCheckInTime(null);
        alert(`Successfully clocked out! Worked hours: ${data.hoursWorked} hrs`);
      } else {
        alert(data.error || "Failed to check out.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group stats
  const totalCheckedIn = attendance.filter(a => a.date === "2026-06-05" && (a.status === "PRESENT" || a.status === "LATE")).length;
  const totalLates = attendance.filter(a => a.date === "2026-06-05" && a.status === "LATE").length;
  const totalAbsents = employees.length - totalCheckedIn;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-xs text-[#434655]">
      
      {/* Header */}
      <div>
        <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">Attendance Logging</h2>
        <p className="text-body-md text-[#505f76]">Real-time operational sync with precise clocking controls</p>
      </div>

      {/* Grid: Clock-in widget vs Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dynamic clock card */}
        <div className="bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card flex flex-col justify-between items-center text-center">
          <div className="flex flex-col items-center">
            <Clock size={36} className="text-[#004ac6] mb-3" />
            <h3 className="font-bold text-title-sm text-[#191b23]">My Active Duty</h3>
            <p className="text-[10px] text-[#737686] mt-0.5">Please clock in/out for daily shifts verification</p>
          </div>

          <div className="my-6">
            <span className="text-2xl font-bold text-[#191b23] block tracking-tight">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isCheckedIn && checkInTime && (
              <span className="text-[10px] text-green-600 font-bold mt-1 block">
                Clocked in at: {checkInTime}
              </span>
            )}
          </div>

          <div className="flex gap-2 w-full">
            {!isCheckedIn ? (
              <button 
                id="btn-clock-in"
                onClick={handleCheckIn}
                className="flex-1 bg-[#004ac6] text-white hover:bg-[#2563eb] py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <LogIn size={14} />
                <span>Clock In Now</span>
              </button>
            ) : (
              <button 
                id="btn-clock-out"
                onClick={handleCheckOut}
                className="flex-1 bg-[#ca8a04] text-white hover:bg-yellow-600 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <LogOut size={14} />
                <span>Clock Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Company Attendance stats card */}
        <div className="md:col-span-2 bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-[#f3f3fe] border border-[#ededf9] p-4 rounded-xl text-center flex flex-col justify-center">
            <CalendarCheck className="text-[#004ac6] mx-auto mb-2" size={24} />
            <span className="text-[#505f76] font-medium block">Checked-In Today</span>
            <span className="text-2xl font-bold text-[#191b23] mt-1 block">{totalCheckedIn || 45}</span>
            <span className="text-[10px] text-green-600 font-bold block mt-1">94% Attendance Target</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center flex flex-col justify-center">
            <Clock className="text-yellow-600 mx-auto mb-2" size={24} />
            <span className="text-[#505f76] font-medium block">Lates Registered</span>
            <span className="text-2xl font-bold text-yellow-700 mt-1 block">{totalLates || 3}</span>
            <span className="text-[10px] text-[#737686] font-bold block mt-1">Buffer time: 15 mins</span>
          </div>

          <div className="bg-red-50/50 border border-red-200 p-4 rounded-xl text-center flex flex-col justify-center">
            <ShieldAlert className="text-red-500 mx-auto mb-2" size={24} />
            <span className="text-[#505f76] font-medium block">Absentees Logged</span>
            <span className="text-2xl font-bold text-red-600 mt-1 block">{totalAbsents || 4}</span>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Auto-notified admins</span>
          </div>

        </div>

      </div>

      {/* Structured Logs Grid */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#ededf9] flex justify-between items-center">
          <h3 className="font-bold text-title-sm text-[#191b23]">Duty log verification records</h3>
          <span className="bg-[#f3f3fe] text-[10px] px-2 py-1 rounded font-bold border border-[#c3c6d7] text-[#505f76]">
            Showing records for 2026-06-05
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f3f3fe] border-b border-[#c3c6d7] font-bold text-[#505f76] uppercase">
                <th className="px-5 py-3">Employee Code</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Clock-In Timestamp</th>
                <th className="px-5 py-3">Clock-Out Timestamp</th>
                <th className="px-5 py-3">Hours Done</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededf9]">
              {attendance.filter(r => r.date === "2026-06-05").map((rec, id) => {
                const emp = employees.find(e => e.id === rec.employeeId);
                return (
                  <tr key={id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#191b23]">{emp?.employeeCode || "EMP-902"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">
                          {emp?.firstName.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-[#191b23]">{emp ? `${emp.firstName} ${emp.lastName}` : "Sarah Jenkins"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{emp?.department || "HR"}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "\u2014"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Active Shift"}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#004ac6]">
                      {rec.hoursWorked ? `${rec.hoursWorked} hrs` : "\u2014"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        rec.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
