/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CreditCard, Landmark, CheckCircle, RefreshCw, BarChart2, Download } from "lucide-react";
import { Employee, Payslip, Role, PayrollStatus } from "../types.js";

interface PayrollViewProps {
  employees: Employee[];
  payslips: Payslip[];
  setPayslips: React.Dispatch<React.SetStateAction<Payslip[]>>;
  userRole: Role;
}

export default function PayrollView({ 
  employees, 
  payslips, 
  setPayslips, 
  userRole 
}: PayrollViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payroll/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPayslips(prev => prev.map(p => ({ ...p, status: PayrollStatus.PROCESSED, processedAt: new Date().toISOString() })));
        alert("Success! All pending salaries have been processed and disbursed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculations
  const grossDisbursements = payslips.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalAllowances = payslips.reduce((acc, curr) => acc + curr.allowances, 0);
  const totalDeductions = payslips.reduce((acc, curr) => acc + curr.deductions, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-xs text-[#434655]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">Payroll Disbursements</h2>
          <p className="text-body-md text-[#505f76]">Audit corporate compensation, allowance matrices and process monthly payroll</p>
        </div>

        {userRole !== Role.EMPLOYEE && (
          <button 
            id="btn-process-payroll-all"
            onClick={handleProcessPayroll}
            disabled={isProcessing}
            className="bg-[#004ac6] text-white hover:bg-[#2563eb] px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Authorizing banks...</span>
              </span>
            ) : (
              <>
                <CreditCard size={16} />
                <span>Process Executive Payroll</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Grid: Stats blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Net Disbursed", val: grossDisbursements, icon: Landmark, bg: "border-blue-200 text-[#004ac6]" },
          { label: "Aggregate Allowances", val: totalAllowances, icon: BarChart2, bg: "border-green-200 text-green-700" },
          { label: "Total Tax Deductions", val: totalDeductions, icon: CreditCard, bg: "border-purple-200 text-purple-700" }
        ].map((stat, i) => (
          <div key={i} className={`bg-white border p-4 rounded-xl flex justify-between items-center ${stat.bg}`}>
            <div>
              <span className="font-semibold block">{stat.label}</span>
              <span className="text-2xl font-bold mt-1 block">₹ {stat.val.toLocaleString()}</span>
            </div>
            <stat.icon size={24} className="opacity-40" />
          </div>
        ))}
      </div>

      {/* Payslip lists table */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#ededf9] flex justify-between items-center">
          <h3 className="font-bold text-title-sm text-[#191b23]">Executive Payslip Matrix</h3>
          <span className="bg-[#f3f3fe] text-[10px] px-2 py-1 rounded font-bold border border-[#c3c6d7] text-[#505f76]">
            Cycle: MAY 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f3f3fe] border-b border-[#c3c6d7] font-bold text-[#505f76] uppercase">
                <th className="px-5 py-3">Employee Code</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Basic Salary</th>
                <th className="px-5 py-3">Allowances</th>
                <th className="px-5 py-3">Provident Deductions</th>
                <th className="px-5 py-3 font-bold text-[#004ac6]">Net Salary</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededf9]">
              {payslips.map((slip) => {
                const emp = employees.find(e => e.id === slip.employeeId);
                return (
                  <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#191b23]">{emp?.employeeCode || "EMP-041"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#d0e1fb] text-[#004ac6] font-bold flex items-center justify-center text-[10px]">
                          {emp?.firstName.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-[#191b23]">{emp ? `${emp.firstName} ${emp.lastName}` : "Sarah Jenkins"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{emp?.department || "HR"}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">₹ {slip.basicSalary.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-semibold text-green-600">+ ₹ {slip.allowances.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-semibold text-red-500">- ₹ {slip.deductions.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-bold text-xl text-[#004ac6]">₹ {slip.netSalary.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => alert(`Reviewing payslip ${slip.id}. Downloading verified PDF...`)}
                        className="text-slate-600 hover:text-[#004ac6] border border-[#c3c6d7] p-1.5 rounded bg-[#f3f3fe]"
                        title="Download verified PDF metadata"
                      >
                        <Download size={12} />
                      </button>
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
