/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Briefcase, Plus, Filter, MoreVertical, Calendar, Award, 
  MapPin, CheckCircle, Video, Star, Trash2, ArrowRightLeft, ArrowRight
} from "lucide-react";
import { Application, PipelineStage, ApplicationSource, Priority } from "../types.js";

interface RecruitmentViewProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  onAddCandidate: () => void;
}

export default function RecruitmentView({ 
  applications, 
  setApplications,
  onAddCandidate
}: RecruitmentViewProps) {
  const [selectedJob, setSelectedJob] = useState("Senior Product Designer");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

  const stages: PipelineStage[] = [
    PipelineStage.APPLIED,
    PipelineStage.SCREENING,
    PipelineStage.SHORTLISTED,
    PipelineStage.INTERVIEW,
    PipelineStage.SELECTED,
    PipelineStage.HIRED,
    PipelineStage.REJECTED
  ];

  // Pipeline stage movement helper
  const moveCandidate = (id: string, newStage: PipelineStage) => {
    setApplications(apps => 
      apps.map(app => app.id === id ? { ...app, stage: newStage } : app)
    );
  };

  const deleteCandidate = (id: string) => {
    if (confirm("Are you sure you want to remove this candidate out of the pipeline?")) {
      setApplications(apps => apps.filter(app => app.id !== id));
    }
  };

  const getStageColor = (stage: PipelineStage) => {
    switch (stage) {
      case PipelineStage.APPLIED: return "border-[#004ac6]/30";
      case PipelineStage.SCREENING: return "border-[#c3c6d7]";
      case PipelineStage.SHORTLISTED: return "border-l-4 border-l-[#004ac6] border-[#c3c6d7]";
      case PipelineStage.INTERVIEW: return "border-orange-200";
      case PipelineStage.SELECTED: return "border-green-200";
      case PipelineStage.HIRED: return "border-[#004ac6] bg-blue-50/30";
      case PipelineStage.REJECTED: return "border-red-200 bg-red-50/10";
    }
  };

  // Stats header calculation
  const totalApps = applications.length;
  const inInterviews = applications.filter(a => a.stage === PipelineStage.INTERVIEW).length;
  const selectCount = applications.filter(a => a.stage === PipelineStage.SELECTED || a.stage === PipelineStage.HIRED).length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* KPI Stats block */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Job Openings", num: 24, badge: "+3", isPrimary: true },
          { label: "Applications", num: 1482, badge: "+12%" },
          { label: "Interviews", num: 86, badge: "Today", isNeutral: true },
          { label: "Offers", num: 12, badge: "Pending", isOrange: true },
          { label: "Hired", num: 45, badge: "Target 90%" }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#c3c6d7] p-4 rounded-xl shadow-card">
            <span className="text-xs font-semibold text-[#505f76]">{stat.label}</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-bold text-[#191b23] tracking-tight">{stat.num.toLocaleString()}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stat.isPrimary ? "bg-[#d0e1fb] text-[#004ac6]" : 
                stat.isOrange ? "bg-orange-100 text-orange-700" :
                stat.isNeutral ? "bg-[#f3f3fe] text-[#505f76]" : "bg-green-100 text-green-700"
              }`}>
                {stat.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main dashboard description & action elements */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">Candidate Pipeline</h2>
          <p className="text-xs text-[#505f76] font-medium">
            Managing candidates for <span className="font-bold text-[#004ac6] cursor-pointer underline">{selectedJob}</span>
          </p>
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto justify-end">
          <button 
            id="btn-filter-recruitment"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="bg-white border border-[#c3c6d7] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#f3f3fe] text-xs font-semibold text-[#434655] shadow-sm cursor-pointer"
          >
            <Filter size={15} />
            <span>Filter</span>
          </button>
          <button 
            id="btn-add-candidate-trigger"
            onClick={onAddCandidate}
            className="bg-[#004ac6] text-white hover:bg-[#2563eb] px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1200px]">
          {stages.map((stage) => {
            const stageApps = applications.filter(app => app.stage === stage);
            return (
              <div key={stage} className="flex-1 min-w-[280px] max-w-[320px] bg-[#f3f3fe]/60 border border-[#c3c6d7] p-3 rounded-xl flex flex-col gap-3">
                
                {/* Column header */}
                <div className="flex justify-between items-center pb-2 border-b-2 border-[#ededf9]">
                  <span className="font-bold text-xs text-[#191b23] capitalize">
                    {stage.toLowerCase().replace("_", " ")}
                  </span>
                  <span className="bg-white text-[10px] font-bold text-[#505f76] border border-[#c3c6d7] px-2 py-0.5 rounded-full">
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards holder */}
                <div className="flex flex-col gap-3 min-h-[450px]">
                  {stageApps.map((candidate) => (
                    <div 
                      id={`cand-card-${candidate.id}`}
                      key={candidate.id}
                      className={`bg-white border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden group ${getStageColor(candidate.stage)}`}
                    >
                      {/* Premium watermark for hired members */}
                      {candidate.stage === PipelineStage.HIRED && (
                        <div className="absolute right-0 top-0 opacity-10 font-bold p-1 pointer-events-none">
                          <Award size={48} className="text-[#004ac6]" />
                        </div>
                      )}

                      {/* Top profile segment */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2.5 items-center">
                          <div className="w-10 h-10 rounded-lg bg-[#d0e1fb] text-[#004ac6] font-bold flex items-center justify-center text-xs border border-[#ededf9]">
                            {candidate.candidateName.charAt(0)}{candidate.candidateName.split(" ")[1]?.charAt(0) || ""}
                          </div>
                          <div>
                            <h4 className="font-bold text-[#191b23] text-xs group-hover:text-[#004ac6] transition-colors">
                              {candidate.candidateName}
                            </h4>
                            <p className="text-[10px] text-[#505f76] font-medium">Product Designer</p>
                          </div>
                        </div>
                        
                        {/* Interactive dropdown shift menu for easier testing */}
                        <div className="relative">
                          <button 
                            id={`dropdown-btn-${candidate.id}`}
                            onClick={() => setActiveCandidateId(activeCandidateId === candidate.id ? null : candidate.id)}
                            className="p-1 rounded-md text-[#737686] hover:bg-[#f3f3fe] cursor-pointer"
                          >
                            <MoreVertical size={14} />
                          </button>
                          
                          {activeCandidateId === candidate.id && (
                            <div className="absolute right-0 top-6 w-44 bg-white border border-[#c3c6d7] rounded-lg shadow-modal z-30 p-1 flex flex-col text-left text-[10px] font-semibold text-[#434655]">
                              <span className="p-1.5 text-gray-400 border-b border-[#ededf9]">Move candidate to:</span>
                              {stages.filter(s => s !== candidate.stage).map((stg) => (
                                <button
                                  id={`btn-move-to-${stg}-${candidate.id}`}
                                  key={stg}
                                  onClick={() => {
                                    moveCandidate(candidate.id, stg);
                                    setActiveCandidateId(null);
                                  }}
                                  className="w-full text-left p-1.5 hover:bg-[#f3f3fe] hover:text-[#004ac6] transition-colors rounded"
                                >
                                  &bull; {stg.toLowerCase().replace("_", " ")}
                                </button>
                              ))}
                              <div className="border-t border-[#ededf9] mt-1 pt-1">
                                <button 
                                  id={`btn-del-candidate-${candidate.id}`}
                                  onClick={() => {
                                    deleteCandidate(candidate.id);
                                    setActiveCandidateId(null);
                                  }}
                                  className="w-full text-left p-1.5 hover:bg-red-50 text-red-600 rounded flex items-center gap-1"
                                >
                                  <Trash2 size={11} />
                                  <span>Remove card</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mid tags section */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="bg-[#f3f3fe] border border-[#c3c6d7] text-[#505f76] text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                          {candidate.source}
                        </span>
                        
                        {/* Circular AI Score badge if screened */}
                        {candidate.aiScore && (
                          <span className="bg-[#004ac6]/10 text-[#004ac6] text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                            AI Score: {candidate.aiScore}
                          </span>
                        )}

                        {candidate.priority === Priority.HIGH && (
                          <span className="bg-[#dbe1ff] text-[#00174b] text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <Star size={10} fill="currentColor" />
                            <span>High Priority</span>
                          </span>
                        )}
                      </div>

                      {/* Display live indicator element for Interview stage in detail */}
                      {candidate.stage === PipelineStage.INTERVIEW && (
                        <div className="mt-3.5 pt-2.5 border-t border-[#ededf9] flex flex-col gap-1.5 text-[10px] text-[#505f76]">
                          <div className="flex items-center gap-1 font-semibold text-red-600">
                            <Video size={10} className="animate-pulse" />
                            <span>Google Meet • {candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "10:30 AM"}</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-[#004ac6] h-full w-2/3"></div>
                          </div>
                          <span className="text-[9px] text-[#737686]">Round 2 of 3</span>
                        </div>
                      )}

                      {/* Small inline notes/instructions preview */}
                      {candidate.notes && (
                        <p className="text-[10px] text-[#505f76] mt-2 italic border-l border-slate-300 pl-1.5 line-clamp-1">
                          "{candidate.notes}"
                        </p>
                      )}

                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#c3c6d7] rounded-xl py-8 text-center bg-white/40">
                      <p className="text-[10px] text-[#737686] font-semibold">Drop nodes here</p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Recruitment Velocity visual chart & upcoming events details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual interactive graph representation */}
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-ard">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-sm text-[#191b23] font-bold">Recruitment Velocity</h3>
            <span className="text-xs font-bold text-[#004ac6] cursor-pointer">Full Analytics</span>
          </div>

          <div className="h-44 flex items-end justify-between px-6 border-b border-[#ededf9] relative">
            <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100 border-dashed text-[10px] text-gray-400">120</div>
            <div className="absolute left-0 right-0 top-2/4 border-t border-slate-100 border-dashed text-[10px] text-gray-400">80</div>
            <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100 border-dashed text-[10px] text-gray-400">40</div>

            {[
              { day: "Mon", count: 90, h: "50%" },
              { day: "Tue", count: 145, h: "80%" },
              { day: "Wed", count: 182, h: "100%" },
              { day: "Thu", count: 92, h: "51%" },
              { day: "Fri", count: 110, h: "61%" }
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 font-bold text-[10px] text-[#191b23]">
                  {col.count}
                </span>
                <div 
                  className={`w-10 rounded-t shadow-sm transition-all duration-300 ${
                    idx === 2 ? "bg-[#004ac6]" : "bg-[#d0e1fb]"
                  }`}
                  style={{ height: col.h }}
                ></div>
                <span className="text-[10px] text-[#505f76] font-semibold mt-2">{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action card for interviewing pipelines */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-card">
          <h3 className="text-title-sm text-[#191b23] font-bold mb-4">Interview Schedule</h3>
          <div className="flex flex-col gap-3">
            {[
              { d: "14", type: "Technical Round", info: "Sarah Chen &bull; 11:00 AM", m: "OCT", current: true },
              { d: "15", type: "Culture Fit Review", info: "David Miller &bull; 02:30 PM", m: "OCT" }
            ].map((ev, k) => (
              <div key={k} className="flex items-center gap-3 p-2.5 bg-[#f3f3fe] border border-[#ededf9] rounded-xl">
                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-xs ${
                  ev.current ? "bg-[#004ac6] text-white" : "bg-white text-[#505f76] border border-[#c3c6d7]"
                }`}>
                  <span className="text-[9px] font-semibold tracking-wider">{ev.m}</span>
                  <span className="text-sm font-bold leading-none">{ev.d}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-[#191b23] truncate">{ev.type}</h4>
                  <p className="text-[10px] text-[#505f76]" dangerouslySetInnerHTML={{ __html: ev.info }}></p>
                </div>
                <ArrowRight size={14} className="text-[#737686]" />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
