/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, Sparkles, Plus, BookOpen, Star, RefreshCw, Layers } from "lucide-react";
import { Employee, PerformanceReview, Role } from "../types.js";

interface PerformanceViewProps {
  employees: Employee[];
  reviews: PerformanceReview[];
  setReviews: React.Dispatch<React.SetStateAction<PerformanceReview[]>>;
  userRole: Role;
}

export default function PerformanceView({ 
  employees, 
  reviews, 
  setReviews, 
  userRole 
}: PerformanceViewProps) {
  const [targetEmployeeId, setTargetEmployeeId] = useState("emp-4"); // Default software engineer
  const [draftReview, setDraftReview] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleGenerateAIDraft = async () => {
    setIsDrafting(true);
    setDraftReview(null);
    try {
      const response = await fetch(`/api/ai/draft-review/${targetEmployeeId}`, {
        method: "POST"
      });

      const data = await response.json();
      if (response.ok) {
        setDraftReview(data.draft);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSaveReview = () => {
    if (!draftReview) return;
    const newRev: PerformanceReview = {
      id: `perf-${Math.random().toString(36).substr(2, 9)}`,
      employeeId: targetEmployeeId,
      period: "Q2-2026",
      score: 88,
      goals: [
        { title: "Optimize HR application performance", target: "Load time < 1.5s", achieved: "Achieved average load time of 1.1s", score: 95 }
      ],
      reviewerNotes: draftReview,
      createdAt: new Date().toISOString()
    };
    setReviews(prev => [newRev, ...prev]);
    setDraftReview(null);
    alert("Review saved and synchronized successfully to core files!");
  };

  const currentReviews = reviews.filter(r => r.employeeId === targetEmployeeId);

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-xs text-[#434655]">
      
      {/* Header */}
      <div>
        <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">System Performance Reviews</h2>
        <p className="text-body-md text-[#505f76]">Track competency scores, define key evaluation goals, and draft performance evaluations with generative AI</p>
      </div>

      {/* Grid: Target Selector & Draft trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Review Controller block */}
        <div className="bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card flex flex-col gap-4">
          <h3 className="font-bold text-title-sm text-[#191b23] flex items-center gap-1.5 border-b border-[#ededf9] pb-2">
            <Award size={16} className="text-[#004ac6]" />
            <span>Generate Evaluative Draft</span>
          </h3>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">Target Employee Profile</label>
            <select
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#004ac6] font-semibold"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.designation})
                </option>
              ))}
            </select>
          </div>

          <button 
            id="btn-draft-performance-review"
            onClick={handleGenerateAIDraft}
            disabled={isDrafting}
            className="w-full bg-[#004ac6] hover:bg-[#2563eb] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {isDrafting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Formulating evaluative text...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>AI Draft Performance Review</span>
              </>
            )}
          </button>
        </div>

        {/* Competency Criteria values */}
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card">
          <h3 className="font-bold text-title-sm text-[#191b23] mb-4">Core HR Competencies</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Technical Delivery", val: 88, status: "EXCEEDS BENCHMARKS", color: "bg-[#004ac6]" },
              { label: "Operational Alignment", val: 92, status: "OUTSTANDING", color: "bg-green-600" },
              { label: "Velocity & Agile Delivery", val: 85, status: "EXCEEDS BENCHMARKS", color: "bg-purple-600" },
              { label: "Collaborative Synergy", val: 90, status: "OUTSTANDING", color: "bg-orange-600" }
            ].map((crit, idx) => (
              <div key={idx} className="bg-[#f3f3fe] border border-[#ededf9] p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#191b23]">{crit.label}</span>
                  <span className="text-[10px] font-bold text-slate-500">{crit.val}/100</span>
                </div>
                <div className="h-1.5 w-full bg-[#ededf9] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${crit.color}`} style={{ width: `${crit.val}%` }}></div>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#004ac6]">{crit.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Render AI Draft review panel if active */}
      {draftReview && (
        <div className="bg-[#faf8ff] border-2 border-dashed border-[#004ac6]/40 p-5 rounded-2xl shadow-card flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[#004ac6]/20 pb-3">
            <h4 className="font-bold text-headline-md text-[#191b23] flex items-center gap-1.5">
              <Sparkles className="text-purple-600 animate-pulse" size={18} />
              <span>Gemini Generative Evaluation Draft</span>
            </h4>
            <div className="flex gap-2">
              <button 
                onClick={() => setDraftReview(null)}
                className="px-3 py-1.5 bg-white border border-[#c3c6d7] rounded-lg text-[#505f76] font-bold hover:bg-[#f3f3fe]"
              >
                Discard Draft
              </button>
              <button 
                id="btn-save-ai-eval"
                onClick={handleSaveReview}
                className="px-3 py-1.5 bg-[#004ac6] text-white hover:bg-[#2563eb] rounded-lg font-bold"
              >
                Publish & Save Evaluation
              </button>
            </div>
          </div>

          <div className="prose text-xs text-[#434655] leading-loose max-w-full font-medium whitespace-pre-wrap bg-white p-4 rounded-xl border border-[#ededf9]">
            {draftReview}
          </div>
        </div>
      )}

      {/* History log block */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#ededf9]">
          <h3 className="font-bold text-title-sm text-[#191b23]">Published Performance Reviews for Target</h3>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {currentReviews.map((rev) => (
            <div key={rev.id} className="p-4 bg-[#f3f3fe] border border-[#ededf9] rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#191b23] text-sm block">Review Period: {rev.period}</span>
                  <span className="text-[10px] text-[#737686] font-medium block mt-0.5">Published on {new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="bg-[#004ac6]/10 border border-[#004ac6]/20 px-3 py-1.5 rounded-xl font-bold text-[#004ac6]">
                  Metrics Score: {rev.score}/100
                </div>
              </div>

              <div className="text-slate-500 whitespace-pre-wrap leading-relaxed text-[11px] font-medium bg-white p-3.5 border border-slate-200 rounded-lg">
                {rev.reviewerNotes}
              </div>
            </div>
          ))}
          {currentReviews.length === 0 && !draftReview && (
            <div className="text-center py-6 text-[#737686] font-semibold bg-slate-50">
              No historical review documents on file for this staff member.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
