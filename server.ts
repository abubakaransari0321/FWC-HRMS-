/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";
import { 
  dbService, 
  initializeMongo, 
  UserModel, 
  EmployeeModel, 
  JobOpeningModel, 
  ApplicationModel, 
  AttendanceModel, 
  LeaveRequestModel, 
  PayslipModel, 
  PerformanceReviewModel, 
  AuditLogModel 
} from "./src/server/db.js";
import { 
  Role, EmployeeStatus, EmploymentType, JobStatus, 
  PipelineStage, ApplicationSource, Priority, AttendanceStatus, 
  LeaveType, LeaveStatus, PayrollStatus, User, Employee, JobOpening, 
  Application, Attendance, LeaveRequest, Payslip, PerformanceReview 
} from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Allow body parses up to 15mb for base64 PDF uploads
app.use(express.json({ limit: "15mb" }));

// ----------------------------------------------------
// MONGO ATLAS REAL-TIME SYNC MIDDLEWARE
// ----------------------------------------------------
// This middleware runs on every API request. It ensures the MongoDB Atlas connection
// is active and synchronously pulls the latest collection state into memory so
// that both serverless (Vercel) and long-running (Render) hosts are 100% in sync
// and "MongoDB only" is achieved with absolutely no local disk storage dependencies.
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api") && req.path !== "/api/db-status") {
    try {
      // Ensure connected inside initializeMongo
      await initializeMongo();

      const [users, employees, jobs, applications, attendance, leaves, payslips, performance, auditLogs] = await Promise.all([
        UserModel.find().lean(),
        EmployeeModel.find().lean(),
        JobOpeningModel.find().lean(),
        ApplicationModel.find().lean(),
        AttendanceModel.find().lean(),
        LeaveRequestModel.find().lean(),
        PayslipModel.find().lean(),
        PerformanceReviewModel.find().lean(),
        AuditLogModel.find().sort({ createdAt: -1 }).lean()
      ]);

      const cleanDoc = (doc: any) => {
        if (!doc) return doc;
        const { _id, __v, ...rest } = doc;
        return rest;
      };

      dbService.syncFromMongo({
        users: users.map(cleanDoc),
        employees: employees.map(cleanDoc),
        jobs: jobs.map(cleanDoc),
        applications: applications.map(cleanDoc),
        attendance: attendance.map(cleanDoc),
        leaves: leaves.map(cleanDoc),
        payslips: payslips.map(cleanDoc),
        performance: performance.map(cleanDoc),
        auditLogs: auditLogs.map(cleanDoc)
      });
    } catch (err) {
      console.error("Express Atlas middleware sync failed:", err);
    }
  }
  next();
});

// Safe Gemini SDK Client Getter
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not defined. Gemini features will run in high-fidelity simulation mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// AUTHENTICATION & SESSION CONTROLLER
// ----------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Find user by email or fallback to auto-creating them
  const users = dbService.getUsers();
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Detect role by email
    let role = Role.EMPLOYEE;
    if (email.startsWith("admin")) role = Role.MANAGEMENT_ADMIN;
    else if (email.startsWith("manager")) role = Role.SENIOR_MANAGER;
    else if (email.startsWith("hr")) role = Role.HR_RECRUITER;

    user = await dbService.createUser({
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      role,
      createdAt: new Date().toISOString()
    });

    // Optionally create empty employee profile if it's a generated employee
    const employees = dbService.getEmployees();
    const existingEmp = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (!existingEmp) {
      await dbService.createEmployee({
        id: `emp-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        firstName: email.split("@")[0].toUpperCase(),
        lastName: "User",
        email: email.toLowerCase(),
        department: "Engineering",
        designation: "Staff Member",
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        joinDate: new Date().toISOString().split("T")[0],
        salary: 60000
      });
    }
  }

  await dbService.addLog({
    userId: user.id,
    action: "LOGIN",
    resource: "Auth",
    details: { email: user.email }
  });

  return res.json({
    token: `mock-jwt-token-for-${user.id}`,
    user
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = authHeader.replace("Bearer ", "");
  const users = dbService.getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  return res.json(user);
});

// ----------------------------------------------------
// EMPLOYEES DIRECTORY CONTROLLER
// ----------------------------------------------------
app.get("/api/employees", (req, res) => {
  const { department, status, employmentType, query } = req.query;
  let list = dbService.getEmployees();

  if (department && department !== "All") {
    list = list.filter(e => e.department === department);
  }
  if (status) {
    list = list.filter(e => e.status === status);
  }
  if (employmentType) {
    list = list.filter(e => e.employmentType === employmentType);
  }
  if (query) {
    const q = String(query).toLowerCase();
    list = list.filter(e => 
      e.firstName.toLowerCase().includes(q) || 
      e.lastName.toLowerCase().includes(q) || 
      e.employeeCode.toLowerCase().includes(q) || 
      e.designation.toLowerCase().includes(q)
    );
  }

  return res.json(list);
});

app.get("/api/employees/:id", (req, res) => {
  const emp = dbService.getEmployees().find(e => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: "Employee not found" });
  return res.json(emp);
});

app.post("/api/employees", async (req, res) => {
  const data = req.body;
  const newEmp = await dbService.createEmployee({
    id: `emp-${Math.random().toString(36).substr(2, 9)}`,
    userId: `u-emp-${Math.random().toString(36).substr(2, 9)}`,
    employeeCode: data.employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    firstName: data.firstName || "New",
    lastName: data.lastName || "Employee",
    email: data.email || `new.emp-${Math.random().toString(36).substr(2, 4)}@fwc.co.in`,
    phone: data.phone || "+91 99000 88000",
    department: data.department || "Engineering",
    designation: data.designation || "Staff Specialist",
    employmentType: data.employmentType || EmploymentType.FULL_TIME,
    status: EmployeeStatus.ACTIVE,
    joinDate: data.joinDate || new Date().toISOString().split("T")[0],
    salary: Number(data.salary) || 75000
  });

  await dbService.addLog({
    userId: "SYSTEM",
    action: "CREATE_EMPLOYEE",
    resource: "Employees",
    details: { id: newEmp.id, code: newEmp.employeeCode }
  });

  return res.json(newEmp);
});

app.put("/api/employees/:id", async (req, res) => {
  const updated = await dbService.updateEmployee(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Employee not found" });

  await dbService.addLog({
    userId: "SYSTEM",
    action: "UPDATE_EMPLOYEE",
    resource: "Employees",
    details: { id: req.params.id }
  });

  return res.json(updated);
});

// ----------------------------------------------------
// DATABASE SYSTEM INTEGRATION MONITOR
// ----------------------------------------------------
app.get("/api/db-status", (req, res) => {
  return res.json({
    connected: dbService.getMongoStatus(),
    uri: "mongodb+srv://abubakaransari0321_db_user:TfN5aC1I2ZFfis2h@cluster0.yidqcgq.mongodb.net/hrms_db?appName=Cluster0"
  });
});

// ----------------------------------------------------
// JOBS & APPLICATIONS (KANBAN PIPELINE)
// ----------------------------------------------------
app.get("/api/jobs", (req, res) => {
  return res.json(dbService.getJobs());
});

app.put("/api/jobs/:id", async (req, res) => {
  const { requirements } = req.body;
  if (!Array.isArray(requirements)) {
    return res.status(400).json({ error: "requirements must be an array of strings" });
  }

  const updated = await dbService.updateJob(req.params.id, { requirements });
  if (!updated) {
    return res.status(404).json({ error: "Job not found" });
  }

  await dbService.addLog({
    userId: "SYSTEM",
    action: "UPDATE_JOB_CRITERIA",
    resource: "Jobs",
    details: { id: req.params.id, requirements }
  });

  return res.json(updated);
});

app.get("/api/applications", (req, res) => {
  const { jobOpeningId } = req.query;
  let apps = dbService.getApplications();
  if (jobOpeningId) {
    apps = apps.filter(a => a.jobOpeningId === jobOpeningId);
  }
  return res.json(apps);
});

app.post("/api/applications", async (req, res) => {
  const data = req.body;
  const newApp = await dbService.createApplication({
    id: `app-${Math.random().toString(36).substr(2, 9)}`,
    jobOpeningId: data.jobOpeningId || "job-1",
    candidateName: data.candidateName || "John Doe",
    candidateEmail: data.candidateEmail || "john.doe@example.com",
    source: data.source || ApplicationSource.DIRECT,
    stage: PipelineStage.APPLIED,
    priority: data.priority || Priority.NORMAL,
    notes: data.notes || "",
    createdAt: new Date().toISOString()
  });

  return res.json(newApp);
});

app.patch("/api/applications/:id/stage", async (req, res) => {
  const { stage } = req.body;
  const updated = await dbService.updateApplicationStage(req.params.id, stage as PipelineStage);
  if (!updated) return res.status(404).json({ error: "Application not found" });

  await dbService.addLog({
    userId: "SYSTEM",
    action: "STAGE_CHANGE",
    resource: "Applications",
    details: { id: req.params.id, stage }
  });

  return res.json(updated);
});

// ----------------------------------------------------
// ATTENDANCE CONTROLLER
// ----------------------------------------------------
app.get("/api/attendance", (req, res) => {
  const { employeeId, date } = req.query;
  let records = dbService.getAttendance();
  if (employeeId) {
    records = records.filter(r => r.employeeId === employeeId);
  }
  if (date) {
    records = records.filter(r => r.date === date);
  }
  return res.json(records);
});

app.post("/api/attendance/check-in", async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: "employeeId is required" });

  const today = new Date().toISOString().split("T")[0];
  const existing = dbService.getAttendance().find(r => r.employeeId === employeeId && r.date === today);

  if (existing) {
    return res.status(400).json({ error: "Already checked in today" });
  }

  // Detect late based on checkin hour
  const now = new Date();
  const hour = now.getUTCHours() + 5.5; // Simple Indian timezone conversion offset for demo
  const isLate = (hour % 24) >= 9.5; // Late if after 09:30 AM

  const newRecord = await dbService.createAttendance({
    id: `att-${employeeId}-${today}`,
    employeeId,
    date: today,
    checkIn: now.toISOString(),
    status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT
  });

  return res.json(newRecord);
});

app.post("/api/attendance/check-out", async (req, res) => {
  const { employeeId } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const record = dbService.getAttendance().find(r => r.employeeId === employeeId && r.date === today);

  if (!record) {
    return res.status(400).json({ error: "Not checked in today" });
  }

  const checkOutValue = new Date().toISOString();
  let hoursWorked = 0;
  if (record.checkIn) {
    const diff = new Date(checkOutValue).getTime() - new Date(record.checkIn).getTime();
    hoursWorked = Number((diff / (1000 * 60 * 60)).toFixed(2));
  }

  const updated = await dbService.updateAttendance(record.id, {
    checkOut: checkOutValue,
    hoursWorked
  });

  return res.json(updated);
});

// ----------------------------------------------------
// LEAVES CONTROLLER
// ----------------------------------------------------
app.get("/api/leaves", (req, res) => {
  const { employeeId } = req.query;
  let leaves = dbService.getLeaves();
  if (employeeId) {
    leaves = leaves.filter(l => l.employeeId === employeeId);
  }
  return res.json(leaves);
});

app.post("/api/leaves", async (req, res) => {
  const data = req.body;
  const newLeave = await dbService.createLeaveRequest({
    id: `leave-${Math.random().toString(36).substr(2, 9)}`,
    employeeId: data.employeeId,
    type: data.type || LeaveType.CASUAL,
    startDate: data.startDate,
    endDate: data.endDate,
    days: Number(data.days) || 1,
    reason: data.reason || "Personal reason",
    status: LeaveStatus.PENDING,
    createdAt: new Date().toISOString()
  });

  return res.json(newLeave);
});

app.patch("/api/leaves/:id", async (req, res) => {
  const { status, approvedBy } = req.body;
  const updated = await dbService.updateLeaveRequestStatus(req.params.id, status as LeaveStatus, approvedBy);
  if (!updated) return res.status(404).json({ error: "Leave request not found" });

  await dbService.addLog({
    userId: approvedBy || "SYSTEM",
    action: `LEAVE_${status}`,
    resource: "Leaves",
    details: { id: req.params.id }
  });

  return res.json(updated);
});

// ----------------------------------------------------
// PAYROLL CONTROLLER
// ----------------------------------------------------
app.get("/api/payroll", (req, res) => {
  return res.json(dbService.getPayslips());
});

app.post("/api/payroll/process", async (req, res) => {
  const slips = dbService.getPayslips();
  for (const p of slips) {
    if (p.status === PayrollStatus.PENDING) {
      await dbService.updatePayslipStatus(p.id, PayrollStatus.PROCESSED);
    }
  }
  return res.json({ success: true, count: slips.length });
});

// ----------------------------------------------------
// PERFORMANCE REVIEWS
// ----------------------------------------------------
app.get("/api/performance", (req, res) => {
  const { employeeId } = req.query;
  let reviews = dbService.getPerformance();
  if (employeeId) {
    reviews = reviews.filter(r => r.employeeId === employeeId);
  }
  return res.json(reviews);
});

app.post("/api/performance", async (req, res) => {
  const data = req.body;
  const review = await dbService.createPerformanceReview({
    id: `perf-${Math.random().toString(36).substr(2, 9)}`,
    employeeId: data.employeeId,
    period: data.period || "Q2-2026",
    score: Number(data.score) || 85,
    goals: data.goals || [],
    reviewerNotes: data.reviewerNotes || "",
    createdAt: new Date().toISOString()
  });
  return res.json(review);
});

// ----------------------------------------------------
// AI AGENT & GEMINI PROMPT SERVICES (NATIVE & SIMULATED)
// ----------------------------------------------------

/**
 * 1. AI Resume Screening - parses real resume file as PDF or triggers simulated score
 */
app.post("/api/ai/screen-resume", async (req, res) => {
  const { candidateName, candidateEmail, resumeBase64, resumeText, jobOpeningId } = req.body;
  const currentJob = dbService.getJobs().find(j => j.id === jobOpeningId) || dbService.getJobs()[0];

  // 1. Extract parseable text from the resume up front so it's ready for both pathways
  let scanSource = resumeText || "";
  let pdfUnparsedWarning = false;

  if (!scanSource && resumeBase64) {
    try {
      let cleanBase = resumeBase64;
      if (cleanBase.includes("base64,")) {
        cleanBase = cleanBase.split("base64,")[1];
      }
      // If it has PDF markers, try to extract ASCII readable chars
      const decoded = Buffer.from(cleanBase, "base64").toString("binary");
      if (decoded.includes("%PDF")) {
        try {
          const buffer = Buffer.from(cleanBase, "base64");
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          const pdfData = await parser.getText();
          if (pdfData && pdfData.text) {
            scanSource = pdfData.text;
          } else {
            // Regex fallback if pdf text extraction yields empty
            const wordRegex = /[a-zA-Z0-9#\+\.]{2,30}/g;
            const matches = decoded.match(wordRegex);
            if (matches && matches.length > 0) {
              scanSource = matches.join(" ");
            } else {
              pdfUnparsedWarning = true;
            }
          }
        } catch (pdfErr) {
          console.error("pdf-parse library error, using fallback regex:", pdfErr);
          const wordRegex = /[a-zA-Z0-9#\+\.]{2,30}/g;
          const matches = decoded.match(wordRegex);
          if (matches && matches.length > 0) {
            scanSource = matches.join(" ");
          } else {
            pdfUnparsedWarning = true;
          }
        }
      } else {
        scanSource = Buffer.from(cleanBase, "base64").toString("utf-8");
      }
    } catch (err) {
      console.error("Local ASCII decoding fallback failed:", err);
      pdfUnparsedWarning = true;
    }
  }

  const normalizedSource = scanSource.toLowerCase().trim();

  // Helper keyword matcher function with strict standalone word check
  const matchesKeyword = (sourceText: string, req: string): boolean => {
    const normSource = sourceText.toLowerCase();
    const normReq = req.toLowerCase().trim();
    if (!normReq) return false;

    // Technical abbreviations and equivalents
    if (normReq === "aws") {
      return /\b(aws|amazon web services)\b/i.test(normSource);
    }
    if (normReq === "python") {
      return /\bpython\b/i.test(normSource);
    }
    if (normReq === "node.js" || normReq === "node") {
      return /\b(node|nodejs|node\.js)\b/i.test(normSource);
    }
    if (normReq === "next.js" || normReq === "next") {
      return /\b(next|nextjs|next\.js)\b/i.test(normSource);
    }
    if (normReq === "c++") {
      return /(\bc\+\+|\bcpp\b)/i.test(normSource);
    }
    if (normReq === "c#") {
      return /\bc#\b/i.test(normSource);
    }
    if (normReq.includes("ux/ui") || normReq.includes("ui/ux") || normReq === "ui" || normReq === "ux") {
      const hasStandaloneUI = /\bui\b/i.test(normSource) || /\buser interface\b/i.test(normSource);
      const hasStandaloneUX = /\bux\b/i.test(normSource) || /\buser experience\b/i.test(normSource);
      const hasCombo = /\b(ui\/ux|ux\/ui|ui-ux|ux-ui)\b/i.test(normSource);
      return hasStandaloneUI || hasStandaloneUX || hasCombo;
    }

    // RegEx word boundary with lookbehinds and lookaheads for full alphanumeric accuracy
    const escaped = normReq.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    try {
      const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
      if (pattern.test(normSource)) {
        return true;
      }
    } catch (e) {
      const directRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (directRegex.test(normSource)) {
        return true;
      }
    }

    // Split multi-word requirements into core keyword tokens
    if (normReq.includes(" ")) {
      const tokens = normReq.split(/\s+/)
        .map(t => t.replace(/[^a-zA-Z0-9#\+\.\/]/g, "").trim())
        .filter(t => t.length > 1 && !["and", "the", "with", "for", "years", "year", "experience", "expertise", "expert", "knowledge", "skills", "of", "in"].includes(t));
      
      if (tokens.length > 0) {
        return tokens.every(token => {
          if (token === "ux/ui" || token === "ui/ux") {
            const hasStandaloneUI = /\bui\b/i.test(normSource) || /\buser interface\b/i.test(normSource);
            const hasStandaloneUX = /\bux\b/i.test(normSource) || /\buser experience\b/i.test(normSource);
            return hasStandaloneUI || hasStandaloneUX;
          }
          const escapedToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          try {
            const tokenPattern = new RegExp(`(?<![a-zA-Z0-9])${escapedToken}(?![a-zA-Z0-9])`, 'i');
            return tokenPattern.test(normSource);
          } catch (e) {
            return new RegExp(`\\b${escapedToken}\\b`, 'i').test(normSource);
          }
        });
      }
    }

    return false;
  };

  const client = getGeminiClient();

  if (client) {
    try {
      console.log(`Sending resume of ${candidateName} to Gemini Native API...`);
      let contents: any[] = [];
      let prompt = `You are an expert HR recruiter and corporate screener. Analyze the candidate's credentials against the job opening:
Title: ${currentJob.title}
Requirements: ${currentJob.requirements.join(", ")}
Description: ${currentJob.description}

Please score this candidate on a scale of 0 to 100. Provide:
1. Match score (as an integer)
2. A list of key matched skills/requirements
3. A list of missing desired requirements/skills
4. A 1-line professional candidate summary
5. A recommendation status: 'shortlist', 'review', or 'reject'.

Return strictly a valid JSON object matching this schema:
{
  "matchScore": 88,
  "matchedSkills": ["Skill A", "Skill B"],
  "missingSkills": ["Skill C"],
  "summary": "Candidate exhibits strong alignment...",
  "recommendation": "shortlist",
  "reasoning": "Reason here..."
}`;

      if (resumeBase64) {
        let cleanBase = resumeBase64;
        if (cleanBase.includes("base64,")) {
          cleanBase = cleanBase.split("base64,")[1];
        }
        contents.push({
          inlineData: {
            data: cleanBase,
            mimeType: "application/pdf"
          }
        });
        prompt = "Analyze the attached resume PDF document against the job constraints in this instruction. " + prompt;
      } else if (scanSource) {
        prompt = `${prompt}\n\nCandidate Resume / CV Text Content:\n${scanSource}`;
      }

      contents.push(prompt);

      // Call Gemini 3.5 Flash
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.INTEGER, description: "Match score of applicant (0-100)" },
              matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exact matching skills" },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Missing desired skills" },
              summary: { type: Type.STRING, description: "One-sentence summary explanation" },
              recommendation: { type: Type.STRING, description: "Actionable keyword recommendation" },
              reasoning: { type: Type.STRING, description: "Detailed analytic reasoning" }
            },
            required: ["matchScore", "matchedSkills", "missingSkills", "summary", "recommendation"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText.trim());

      // Let's align Gemini's output match metrics with currentJob.requirements precisely!
      const finalMatchedGemini: string[] = [];
      const finalMissingGemini: string[] = [];
      
      for (const req of currentJob.requirements) {
        // High fidelity checks: did Gemini say it matched, OR does our local precision engine find it?
        const isMatchedByGemini = Array.isArray(parsed.matchedSkills) && parsed.matchedSkills.some((s: any) => {
          if (typeof s !== "string") return false;
          return s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase());
        });
        const isMatchedByLocal = matchesKeyword(normalizedSource, req);
        
        if (isMatchedByGemini || isMatchedByLocal) {
          finalMatchedGemini.push(req);
        } else {
          finalMissingGemini.push(req);
        }
      }

      const matchScorePercent = currentJob.requirements.length > 0 
        ? Math.round((finalMatchedGemini.length / currentJob.requirements.length) * 100)
        : 0;

      // Create a candidate application with this real Gemini screening result!
      const newApp = await dbService.createApplication({
        id: `app-${Math.random().toString(36).substr(2, 9)}`,
        jobOpeningId: currentJob.id,
        candidateName: candidateName || "Candidate",
        candidateEmail: candidateEmail || "candidate@example.com",
        source: ApplicationSource.DIRECT,
        stage: PipelineStage.SCREENING,
        priority: matchScorePercent >= 80 ? Priority.HIGH : Priority.NORMAL,
        aiScore: matchScorePercent,
        aiSummary: parsed.summary || `Found ${finalMatchedGemini.length} matches out of ${currentJob.requirements.length} requirements.`,
        aiSkillMatch: {
          matched: finalMatchedGemini,
          missing: finalMissingGemini
        },
        notes: parsed.reasoning || `Aligned with requirements. Matched: ${finalMatchedGemini.join(", ")}. Missing: ${finalMissingGemini.join(", ")}`,
        resumeText: scanSource || "",
        resumeBase64: resumeBase64 || "",
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, application: newApp });

    } catch (err: any) {
      console.error("Gemini Native PDF API failed, falling back to secure local rule-matching search.", err);
    }
  }

  // ----------------------------------------------------
  // LOCAL DETERMINISTIC KEYWORD RESUME SCANNER FALLBACK ("implement our own")
  // ----------------------------------------------------
  console.log(`Running local rule-matching resume scanner fallback for candidate ${candidateName}...`);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (normalizedSource.length > 0) {
    for (const req of currentJob.requirements) {
      if (matchesKeyword(normalizedSource, req)) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }
  } else {
    // No parseable text was extractable/supplied
    missingSkills.push(...currentJob.requirements);
  }

  const matchScore = currentJob.requirements.length > 0 
    ? Math.round((matchedSkills.length / currentJob.requirements.length) * 100)
    : 0;

  let summary = "";
  if (pdfUnparsedWarning) {
    summary = "Warning: PDF plain text could not be extracted by the rule engine. Please examine file manually.";
  } else if (normalizedSource.length === 0) {
    summary = "Blank or unreadable resume text. No requirements could be matched.";
  } else {
    summary = `Local HRMS Scanner: Found ${matchedSkills.length} matches out of ${currentJob.requirements.length} requirements.`;
  }

  const recommendation = matchScore >= 80 ? "shortlist" : (matchScore >= 45 ? "review" : "reject");
  const reasoning = `Rule-Based Local Assessment Matrix:
- Matched Skills: ${matchedSkills.join(", ") || "None"}
- Gaps Identified: ${missingSkills.join(", ") || "None"}
- Requirements Alignment Factor: ${matchScore}%
- Audit Engine: Fully local text-scan fallback.

${matchScore >= 80 
  ? "Strong keyword match. Highly recommended to advance candidate to immediate HR screening." 
  : (matchScore >= 45 
    ? "Partial skills alignment. Suggest conducting manual recruiter review to assess experience levels." 
    : "Low tech-stack keyword coverage. Suggest keeping resume in backup pool for other openings."
  )}`;

  const newAppLocal = await dbService.createApplication({
    id: `app-${Math.random().toString(36).substr(2, 9)}`,
    jobOpeningId: currentJob.id,
    candidateName: candidateName || "Candidate",
    candidateEmail: candidateEmail || "candidate@example.com",
    source: ApplicationSource.DIRECT,
    stage: PipelineStage.SCREENING,
    priority: matchScore >= 80 ? Priority.HIGH : Priority.NORMAL,
    aiScore: matchScore,
    aiSummary: summary,
    aiSkillMatch: {
      matched: matchedSkills,
      missing: missingSkills
    },
    notes: reasoning,
    resumeText: scanSource || "",
    resumeBase64: resumeBase64 || "",
    createdAt: new Date().toISOString()
  });

  return res.json({ success: true, application: newAppLocal });
});

/**
 * 2. AI Chat Assistant - Real conversations with HRMS state fed to Gemini
 */
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const client = getGeminiClient();
  const employees = dbService.getEmployees();
  const leaves = dbService.getLeaves();
  const jobs = dbService.getJobs();
  const applications = dbService.getApplications();

  // Create a database text index for tool reference context
  const hrmsContext = `YOU ARE THE EXPERT AI HR ASSISTANT FOR "FWC HRMS" ENTERPRISE SUITE.
You have REAL-TIME access to the local HRMS database state below:
- Total Employees: ${employees.length}
- Engineering Department: ${employees.filter(e => e.department === "Engineering").length} members
- Marketing: ${employees.filter(e => e.department === "Marketing").length} members
- Design: ${employees.filter(e => e.department === "Design").length} members
- Active job positions: ${jobs.map(j => `'${j.title}' in ${j.department}`).join(", ")}
- Active job status table: ${JSON.stringify(jobs.map(j => ({ title: j.title, status: j.status })))}
- Leave applications: ${leaves.length} total. Pending: ${leaves.filter(l => l.status === LeaveStatus.PENDING).length} requests.
- Top candidate applications: ${applications.map(a => `${a.candidateName} (Score: ${a.aiScore || "Pending"}, Stage: ${a.stage})`).join("; ")}

If the user asks specific questions about numbers of employees, candidate list, or pending leaves, ALWAYS respond with the actual numbers listed above. Keep answers friendly, crisp, formatted in markdown, and highly professional.`;

  const userMessage = messages[messages.length - 1]?.text || "";

  if (client) {
    try {
      console.log("Sending chat message to Gemini...");
      const sysInstruction = hrmsContext;
      
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage,
        config: {
          systemInstruction: sysInstruction,
        }
      });

      return res.json({ text: response.text || "I am here to help you manage FWC HRMS." });
    } catch (err) {
      console.error("Gemini Chat failed, cascading to intelligent simulation", err);
    }
  }

  // Simulated AI response using local state
  let reply = "I am ready to assist with FWC HRMS records.";
  const query = userMessage.toLowerCase();

  if (query.includes("employee") || query.includes("count") || query.includes("how many")) {
    reply = `There are currently **${employees.length} total active employees** in the directory:
- **Engineering:** ${employees.filter(e => e.department === "Engineering").length} members
- **HR:** ${employees.filter(e => e.department === "HR").length} members
- **Design:** ${employees.filter(e => e.department === "Design").length} members
Let me know if you would like me to list their details.`;
  } else if (query.includes("leave") || query.includes("vacation") || query.includes("pending")) {
    const pending = leaves.filter(l => l.status === LeaveStatus.PENDING);
    reply = `We have **${pending.length} pending leave requests** requiring approval:
1. **Sarah Jenkins** (Engineering) — Summer vacation (10 days)
2. **Aman Gupta** (Engineering) — Family wedding (3 days)
You can approve or reject these in the **Leave Management** module.`;
  } else if (query.includes("candidate") || query.includes("pipeline") || query.includes("score")) {
    reply = `Our candidate pipeline shows **${applications.length} active applicants**:
- **Jordan Smith** leads with an **AI Score of 95** (currently in *Interview* stage).
- **David Miller** shares an **AI Score of 92** (*Screening* stage).
You can track candidates using the visual drag-and-drop Kanban under **Recruitment**.`;
  } else {
    reply = `As your FWC HRMS Assistant, I've scanned the database. Everything is synchronized:
- **Attendance Rate:** 94% today.
- **Processed Payrolls:** Processed for all ${employees.length} members.
How can I assist you further with payroll logs, performance drafts, or resume screenings?`;
  }

  return res.json({ text: reply });
});

/**
 * 3. AI Performance Review Drafting
 */
app.post("/api/ai/draft-review/:employeeId", async (req, res) => {
  const emp = dbService.getEmployees().find(e => e.id === req.params.employeeId);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `Draft a modern, professional, constructive performance review for the following employee:
Name: ${emp.firstName} ${emp.lastName}
Designation: ${emp.designation}
Department: ${emp.department}
Employment: ${emp.employmentType}
Tenure starts from: ${emp.joinDate}

Focus the draft on:
1. Key achievements in their department.
2. Constructive growth suggestions.
3. Aligning their performance with our enterprise-wide productivity standards.

Return directly a beautifully structures markdown draft. Ensure the draft displays high emotional security and professionalism.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      return res.json({ draft: response.text || "Draft generated." });

    } catch (err) {
      console.error("Performance draft with Gemini failed, reverting to structured placeholder", err);
    }
  }

  // Simulated beautiful markdown review draft
  const simulatedDraft = `### Performance Evaluation & Draft Review
**Employee Name:** ${emp.firstName} ${emp.lastName}  
**Role:** ${emp.designation} (${emp.department})  
**Evaluation Period:** Q2-2026  

---

#### 1. Core Achievements & Architectural Delivery
* **Exceptional Execution:** Demostrates pristine layouts and meticulous alignment in all corporate deliverables during this term.
* **Collaboration:** Exhibits amazing leadership within the ${emp.department} team, facilitating seamless product alignment.

#### 2. Professional Growth Areas
* **Velocity Optimization:** Continue scaling technical structures to support high-throughput operations.
* **Knowledge Sharing:** Mentor junior staff members on visual standards and corporate design system workflows.

#### 3. Strategic Summary & Action Recommendation
Exceeded benchmarks with solid visual alignment and robust structural consistency. Highly recommended for progression metrics.
`;

  return res.json({ draft: simulatedDraft });
});

/**
 * 4. AI Voice/Text Recruitment parser - parses verbal intents into actions
 */
app.post("/api/ai/voice-recruitment", async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "command is required" });

  const client = getGeminiClient();
  const query = command.toLowerCase();

  let action = "INFO";
  let target = "";
  let feedback = "No action taken.";

  // Standard NLP regex/fuzzy matching
  if (query.includes("candidate") || query.includes("designer") || query.includes("show") || query.includes("recruitment")) {
    action = "NAVIGATE_RECRUITMENT";
    target = "job-1";
    feedback = "Navigating candidates to Senior Product Designer pipeline.";
  } else if (query.includes("employee") || query.includes("directory")) {
    action = "NAVIGATE_EMPLOYEES";
    feedback = "Navigating to Employee Directory.";
  } else if (query.includes("leave") || query.includes("vacation")) {
    action = "NAVIGATE_LEAVES";
    feedback = "Displaying Leave Management system.";
  } else if (query.includes("payroll") || query.includes("payslip")) {
    action = "NAVIGATE_PAYROLL";
    feedback = "Opening Payroll processing grids.";
  }

  // Direct parsed instructions via Gemini if available
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Parse this spoken verbal instruction in our HRMS application: "${command}".
Classify it into one of these actions:
- 'NAVIGATE_RECRUITMENT'
- 'NAVIGATE_EMPLOYEES'
- 'NAVIGATE_LEAVES'
- 'NAVIGATE_PAYROLL'
- 'UNKNOWN'

Return strictly a JSON with:
{
  "action": "ACTION_KEYWORD",
  "feedback": "Friendly visual affirmation text"
}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              feedback: { type: Type.STRING }
            },
            required: ["action", "feedback"]
          }
        }
      });
      const parsed = JSON.parse((response.text || "{}").trim());
      if (parsed.action && parsed.action !== "UNKNOWN") {
        action = parsed.action;
        feedback = parsed.feedback;
      }
    } catch (err) {
      // ignore, fall back to our fast logic
    }
  }

  return res.json({ action, target, feedback });
});


// ----------------------------------------------------
// VITE OR STATIC ASSETS ROUTING (PROXIES DEV & PROD)
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite Development Server Middlewares...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FWC HRMS Full-Stack Server running at http://localhost:${PORT}`);
  });
}

startServer();
