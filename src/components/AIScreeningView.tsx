/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Brain, UploadCloud, FileText, CheckCircle2, AlertCircle, 
  HelpCircle, Sparkles, User, FileSignature, RefreshCw, Layers,
  Edit, Trash2, Plus, Check, X
} from "lucide-react";
import { Application, JobOpening, PipelineStage } from "../types.js";

interface AIScreeningViewProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  jobs: JobOpening[];
  setJobs: React.Dispatch<React.SetStateAction<JobOpening[]>>;
}

export default function AIScreeningView({ 
  applications, 
  setApplications, 
  jobs,
  setJobs
}: AIScreeningViewProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>("job-1");
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReportApp, setActiveReportApp] = useState<Application | null>(null);

  // Criteria editing states
  const [isEditingCriteria, setIsEditingCriteria] = useState(false);
  const [editedRequirements, setEditedRequirements] = useState<string[]>([]);
  const [newRequirementText, setNewRequirementText] = useState("");
  const [isSavingCriteria, setIsSavingCriteria] = useState(false);

  // Input mechanism state: "file" (real uploads) or "text" (paste code patterns)
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const screenedApps = applications.filter(app => app.jobOpeningId === selectedJobId && app.aiScore !== undefined);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.type === "text/plain" || file.name.endsWith(".txt")) {
        setResumeFile(file);
        if (!candidateName) {
          const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
          setCandidateName(baseName.replace(/\b\w/g, c => c.toUpperCase()));
        }
      } else {
        alert("Please upload a PDF or TXT resume file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      if (!candidateName) {
        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
        setCandidateName(baseName.replace(/\b\w/g, c => c.toUpperCase()));
      }
    }
  };

  const clearFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes("base64,") ? result.split("base64,")[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const convertToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const executeScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail) {
      alert("Please provide the candidate name and email address.");
      return;
    }

    if (inputMode === "file" && !resumeFile) {
      alert("Please choose or drag a resume file (PDF or TXT) first.");
      return;
    }

    if (inputMode === "text" && !pastedText.trim()) {
      alert("Please enter candidate's resume/CV details in the text area first.");
      return;
    }

    setIsProcessing(true);
    try {
      let b64 = "";
      let txt = "";

      if (inputMode === "file" && resumeFile) {
        b64 = await convertToBase64(resumeFile);
        if (resumeFile.name.endsWith(".txt")) {
          txt = await convertToText(resumeFile);
        }
      } else if (inputMode === "text") {
        txt = pastedText;
      }

      const response = await fetch("/api/ai/screen-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName,
          candidateEmail,
          resumeBase64: b64,
          resumeText: txt,
          jobOpeningId: selectedJobId
        })
      });

      const data = await response.json();
      if (data.success && data.application) {
        setApplications(apps => [data.application, ...apps]);
        setCandidateName("");
        setCandidateEmail("");
        setResumeFile(null);
        setPastedText("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        alert(`Successfully screened candidate ${data.application.candidateName} with an AI Score of ${data.application.aiScore}%!`);
      } else {
        alert("Failed to screen resume. Invalid server response.");
      }
    } catch (err) {
      console.error(err);
      alert("Screening failed. Please ensure your backend is up & running.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-xs text-[#434655]">
      
      {/* Visual top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">AI Resume Screening</h2>
          <p className="text-body-md text-[#505f76]">
            Automated candidate evaluation powered by Gemini 3.5 structural analysis or rule-matching fallback
          </p>
        </div>

        {/* Selected Job config details */}
        <div className="flex items-center gap-2 bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl px-3 py-1.5 self-stretch sm:self-auto justify-end">
          <span className="font-bold text-[#505f76]">Screening Criteria:</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="text-xs bg-transparent border-none font-bold text-[#004ac6] focus:outline-none"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Upload Block vs Live Requirements Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CV Screen Input Drawer */}
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-title-sm text-[#191b23] flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#004ac6]" />
              <span>Screen New Candidate</span>
            </h3>

            {/* Input choices */}
            <div className="flex border border-[#c3c6d7] rounded-lg overflow-hidden bg-[#f3f3fe]">
              <button
                id="btn-mode-file"
                type="button"
                onClick={() => setInputMode("file")}
                className={`px-3 py-1 text-[10px] font-bold transition-all ${
                  inputMode === "file" ? "bg-[#004ac6] text-white" : "text-[#505f76] hover:bg-[#c3c6d7]/30"
                }`}
              >
                File Upload
              </button>
              <button
                id="btn-mode-text"
                type="button"
                onClick={() => setInputMode("text")}
                className={`px-3 py-1 text-[10px] font-bold transition-all ${
                  inputMode === "text" ? "bg-[#004ac6] text-white" : "text-[#505f76] hover:bg-[#c3c6d7]/30"
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          <form onSubmit={executeScreening} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Email Address</label>
                <input 
                  type="email"
                  placeholder="elena@example.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 focus:outline-none focus:border-[#004ac6]"
                  required
                />
              </div>
            </div>

            {inputMode === "file" ? (
              <div>
                {resumeFile ? (
                  <div className="border border-green-200 bg-green-50/50 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-green-600 shrink-0" size={24} />
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-xs">{resumeFile.name}</p>
                        <p className="text-[10px] text-green-700 font-semibold">Size: {(resumeFile.size / 1024).toFixed(1)} KB &bull; PDF / TXT Verified</p>
                      </div>
                    </div>
                    <button
                      id="btn-remove-selected-file"
                      type="button"
                      onClick={clearFile}
                      className="text-[10px] font-bold text-red-600 hover:underline px-2.5 py-1.5 border border-red-200 rounded-lg bg-white shadow-sm"
                    >
                      Clear File
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive ? "border-[#004ac6] bg-blue-50/40" : "border-[#c3c6d7] bg-[#f3f3fe] hover:border-[#004ac6]/50"
                    }`}
                  >
                    <UploadCloud size={32} className="mx-auto text-[#004ac6] mb-2 animate-bounce" />
                    <p className="font-bold text-slate-800">Drag & drop resume PDF or TXT here or click to browse</p>
                    <p className="text-[10px] text-[#737686] mt-1">Accepts plain-text or PDF schemas for Gemini screening</p>
                    
                    <div className="mt-3 flex justify-center">
                      <span className="text-[10px] font-bold bg-[#d0e1fb] text-[#004ac6] px-3 py-1 rounded">
                        Active Local Scanner Backing
                      </span>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.txt" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Paste Plain Resume Content</label>
                <textarea
                  rows={5}
                  placeholder={`e.g.
Technical Skills: React, TypeScript, Node.js, Tailwind CSS, API Integration
Experience: 3 Years as Senior Frontend Engineer
Achievements: Rebuilt complex dashboards, migrated to single-page structures.`}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-2 px-3 font-mono text-[10px] leading-relaxed focus:outline-none focus:border-[#004ac6]"
                />
                <span className="text-[9px] text-[#737686] font-semibold text-right">
                  Matches key requirement tags locally or using live Gemini models
                </span>
              </div>
            )}

            <button 
              id="btn-process-screening"
              type="submit"
              disabled={isProcessing}
              className={`w-full text-center font-bold text-xs py-2.5 rounded-xl text-white transition-opacity cursor-pointer ${
                isProcessing ? "bg-[#004ac6]/50 cursor-not-allowed" : "bg-[#004ac6] hover:bg-[#2563eb]"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Scanning Candidate Credentials...</span>
                </span>
              ) : "Analyze & Process Resume with AI"}
            </button>
          </form>
        </div>

        {/* Dynamic Criteria checklist */}
        {!isEditingCriteria ? (
          <div className="bg-white border border-[#c3c6d7] p-5 rounded-2xl shadow-card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-title-sm text-[#191b23]">Job Requirements Criteria</h3>
                <button
                  type="button"
                  id="btn-edit-criteria"
                  onClick={() => {
                    setEditedRequirements([...(currentJob?.requirements || [])]);
                    setIsEditingCriteria(true);
                    setNewRequirementText("");
                  }}
                  className="flex items-center gap-1 text-[10px] bg-[#f3f3fe] hover:bg-[#c3c6d7]/30 text-[#004ac6] border border-[#c3c6d7] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                >
                  <Edit size={10} />
                  <span>Modify Criteria</span>
                </button>
              </div>
              
              <p className="text-[10px] text-[#737686] mb-4">Gemini or fallback keyword matrix compares CVs against these tags:</p>

              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {currentJob?.requirements.map((req, k) => (
                  <div key={k} className="flex gap-2 p-2.5 bg-[#f3f3fe] border border-[#ededf9] rounded-xl items-center">
                    <CheckCircle2 size={14} className="text-[#004ac6] shrink-0" />
                    <span className="font-semibold text-slate-700">{req}</span>
                  </div>
                ))}
                {(!currentJob || currentJob.requirements.length === 0) && (
                  <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4">No specific criteria established. Click Modify to add requirements.</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                {currentJob?.requirements.length || 0} active constraints
              </span>
              <span className="text-[9px] text-[#737686] font-medium">Auto-scanned locally</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-[#004ac6] p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-title-sm text-[#004ac6] flex items-center gap-1">
                  <span>Update Requirements</span>
                </h3>
                <button
                  type="button"
                  id="btn-cancel-edit-criteria"
                  onClick={() => setIsEditingCriteria(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1"
                  title="Cancel Changes"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-[#737686] mb-4">
                Add or remove specific credential keywords matching this role:
              </p>

              {/* List with deletes */}
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 mb-4">
                {editedRequirements.map((req, k) => (
                  <div key={k} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-2 pl-3 group hover:border-[#004ac6]/30 transition-all">
                    <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[85%]">{req}</span>
                    <button
                      type="button"
                      onClick={() => setEditedRequirements(editedRequirements.filter((_, idx) => idx !== k))}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-lg"
                      title="Remove item"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {editedRequirements.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-bold italic">No requirements tags defined yet.</p>
                  </div>
                )}
              </div>

              {/* Add requirement input/button */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newRequirementText.trim()) {
                    if (!editedRequirements.includes(newRequirementText.trim())) {
                      setEditedRequirements([...editedRequirements, newRequirementText.trim()]);
                    }
                    setNewRequirementText("");
                  }
                }}
                className="flex gap-2 items-center mb-4"
              >
                <input
                  type="text"
                  value={newRequirementText}
                  onChange={(e) => setNewRequirementText(e.target.value)}
                  placeholder="Add constraint (e.g. AWS, Python)"
                  className="flex-1 bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg py-1.5 px-3 focus:outline-none focus:border-[#004ac6] text-[11px]"
                />
                <button
                  type="submit"
                  className="bg-[#004ac6] hover:bg-[#2563eb] text-white p-2 rounded-lg cursor-pointer shrink-0 transition-all"
                  title="Add item to checklist"
                >
                  <Plus size={14} />
                </button>
              </form>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-cancel-criteria"
                onClick={() => setIsEditingCriteria(false)}
                className="flex-1 text-center font-bold text-[10px] py-1.5 rounded-lg border border-[#c3c6d7] text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                id="btn-save-criteria"
                disabled={isSavingCriteria}
                onClick={async () => {
                  if (editedRequirements.length === 0) {
                    alert("Please specify at least one requirement/criterion tag.");
                    return;
                  }
                  setIsSavingCriteria(true);
                  try {
                    const res = await fetch(`/api/jobs/${currentJob.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ requirements: editedRequirements })
                    });
                    if (res.ok) {
                      const updatedJob = await res.json();
                      setJobs(prevJobs => prevJobs.map(job => job.id === updatedJob.id ? updatedJob : job));
                      setIsEditingCriteria(false);
                      alert(`Requirements criteria updated successfully for ${updatedJob.title}!`);
                    } else {
                      alert("Failed to update criteria on the backend.");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failed to update criteria due to a network error.");
                  } finally {
                    setIsSavingCriteria(false);
                  }
                }}
                className="flex-1 text-center font-bold text-[10px] py-1.5 rounded-lg bg-[#004ac6] text-white hover:bg-[#2563eb] disabled:opacity-50 cursor-pointer transition-opacity animate-pulse-short"
              >
                {isSavingCriteria ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Structured results table */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-card overflow-hidden mt-4">
        <div className="p-4 border-b border-[#ededf9] flex justify-between items-center">
          <h3 className="font-bold text-title-sm text-[#191b23]">Evaluation Outcomes</h3>
          <span className="text-[10px] bg-[#f3f3fe] px-2 py-1 rounded border border-[#c3c6d7] font-bold text-[#505f76]">
            {screenedApps.length} screened candidates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f3f3fe] border-b border-[#c3c6d7] font-bold text-[#505f76] uppercase">
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">AI Score</th>
                <th className="px-5 py-3">Matching Skills</th>
                <th className="px-5 py-3">Missing Tags</th>
                <th className="px-5 py-3">Summary Preview</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededf9]">
              {screenedApps.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#004ac6]/10 text-[#004ac6] font-bold flex items-center justify-center">
                        {candidate.candidateName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-[#191b23] block">{candidate.candidateName}</span>
                        <span className="text-[10px] text-[#737686]">{candidate.candidateEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded font-bold border ${getScoreColor(candidate.aiScore || 0)}`}>
                      {candidate.aiScore}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {candidate.aiSkillMatch?.matched.slice(0, 3).map((sk, id) => (
                        <span key={id} className="bg-green-100 text-green-800 text-[9px] px-1.5 py-0.5 rounded font-medium">
                          {sk}
                        </span>
                      ))}
                      {(candidate.aiSkillMatch?.matched.length || 0) > 3 && (
                        <span className="text-[9px] text-[#737686] font-bold">+{candidate.aiSkillMatch!.matched.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {candidate.aiSkillMatch?.missing.slice(0, 2).map((sk, id) => (
                        <span key={id} className="bg-red-50 text-red-700 text-[9px] px-1.5 py-0.5 border border-red-200 rounded font-medium">
                          {sk}
                        </span>
                      )) || <span className="text-gray-400 font-bold">&mdash;</span>}
                      {(candidate.aiSkillMatch?.missing.length || 0) > 2 && (
                        <span className="text-[9px] text-red-600 font-bold">+{candidate.aiSkillMatch!.missing.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="max-w-[220px] truncate text-[#505f76] font-medium" title={candidate.aiSummary}>
                      {candidate.aiSummary || "Awaiting evaluation summary."}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button 
                      id={`btn-full-report-${candidate.id}`}
                      onClick={() => setActiveReportApp(candidate)}
                      className="text-[#004ac6] hover:underline font-bold"
                    >
                      View Full Audit
                    </button>
                  </td>
                </tr>
              ))}
              {screenedApps.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium bg-slate-50/50">
                    No evaluated resumes logged yet. Use the Screen form above to query the Gemini parser.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Score Detail / Report Modal Popup */}
      {activeReportApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-modal overflow-hidden border border-[#c3c6d7] animate-fade-in">
            {/* Header */}
            <div className="bg-[#faf8ff] p-5 border-b border-[#e1e2ed] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="text-[#004ac6]" size={20} />
                <h4 className="font-bold text-headline-md text-[#191b23]">Gemini Evaluation Assessment</h4>
              </div>
              <button 
                onClick={() => setActiveReportApp(null)}
                className="text-slate-400 hover:text-slate-800 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Assessment Body */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-xl bg-[#004ac6]/10 text-[#004ac6] font-bold text-lg flex items-center justify-center">
                  {activeReportApp.candidateName.charAt(0)}
                </div>
                <div>
                  <h5 className="font-bold text-[#191b23] text-sm">{activeReportApp.candidateName}</h5>
                  <p className="text-[11px] text-[#505f76] font-medium">{activeReportApp.candidateEmail} &bull; Screened against {currentJob.title}</p>
                </div>
                <div className={`ml-auto px-4 py-2 rounded-xl text-center border font-bold text-lg ${getScoreColor(activeReportApp.aiScore || 0)}`}>
                  {activeReportApp.aiScore}%
                </div>
              </div>

              {/* Summary Text block */}
              <div className="bg-[#f3f3fe] p-4 rounded-xl border border-[#ededf9]">
                <h6 className="font-bold text-[#191b23] mb-1">AI Match Summary</h6>
                <p className="leading-relaxed text-[#434655] font-medium">{activeReportApp.aiSummary}</p>
              </div>

              {/* Two Column details: Matched vs missing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <h6 className="font-bold text-green-800 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    <span>Key Matched Skills</span>
                  </h6>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReportApp.aiSkillMatch?.matched.map((sk, k) => (
                      <span key={k} className="bg-green-50 text-green-800 px-2.5 py-1 border border-green-200 rounded-full font-semibold text-[10px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h6 className="font-bold text-red-800 flex items-center gap-1">
                    <AlertCircle size={14} />
                    <span>Missing/Partial Gaps</span>
                  </h6>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReportApp.aiSkillMatch?.missing.map((sk, k) => (
                      <span key={k} className="bg-red-50 text-red-800 px-2.5 py-1 border border-red-200 rounded-full font-semibold text-[10px]">
                        {sk}
                      </span>
                    )) || <span className="text-gray-400 font-bold">&mdash;</span>}
                  </div>
                </div>
              </div>

              {/* Assessment detailed reasoning */}
              {activeReportApp.notes && (
                <div className="border-t border-[#ededf9] pt-4">
                  <h6 className="font-bold text-[#191b23] mb-1.5">Detailed Recruiter Reasoning</h6>
                  <p className="leading-loose text-slate-500 whitespace-pre-line text-[11px]">
                    {activeReportApp.notes}
                  </p>
                </div>
              )}

              {/* Uploaded Resume Details */}
              {(activeReportApp.resumeText || activeReportApp.resumeBase64) && (
                <div className="border-t border-[#ededf9] pt-4">
                  <h6 className="font-bold text-[#191b23] mb-1.5 flex items-center justify-between">
                    <span>Uploaded Resume (Stored on MongoDB Atlas)</span>
                    {activeReportApp.resumeBase64 && (
                      <a
                        href={activeReportApp.resumeBase64.startsWith("data:") ? activeReportApp.resumeBase64 : `data:application/pdf;base64,${activeReportApp.resumeBase64}`}
                        download={`${activeReportApp.candidateName.replace(/\s+/g, "_")}_Resume.pdf`}
                        className="text-[10px] text-[#004ac6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        Download PDF File
                      </a>
                    )}
                  </h6>
                  {activeReportApp.resumeText ? (
                    <div className="bg-[#fcfcff] border border-[#e8e9f3] p-3 rounded-lg max-h-40 overflow-y-auto font-mono text-[9px] text-[#63667a] whitespace-pre-line leading-relaxed">
                      {activeReportApp.resumeText}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#737686] italic">
                      PDF Document binary data successfully synchronized and stored on Cluster0. Click "Download PDF File" to view.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer triggers */}
            <div className="bg-[#faf8ff] p-4 border-t border-[#e1e2ed] flex justify-end gap-2 text-xs font-semibold">
              <button 
                onClick={() => setActiveReportApp(null)}
                className="px-4 py-2 bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Close Report
              </button>
              <button 
                id="btn-confirm-shortlist"
                onClick={() => {
                  setApplications(apps => apps.map(app => app.id === activeReportApp.id ? { ...app, stage: PipelineStage.SHORTLISTED } : app));
                  alert(`${activeReportApp.candidateName} has been immediately advanced to SHORTLISTED stage!`);
                  setActiveReportApp(null);
                }}
                className="px-4 py-2 bg-[#004ac6] text-white hover:bg-[#2563eb] rounded-lg shadow-sm"
              >
                Confirm & Shortlist Candidate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
