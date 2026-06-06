/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import mongoose, { Schema } from "mongoose";
import { 
  User, Employee, JobOpening, Application, Attendance, LeaveRequest, 
  Payslip, PerformanceReview, AuditLog, Role, EmployeeStatus, 
  EmploymentType, JobStatus, PipelineStage, ApplicationSource, Priority, 
  AttendanceStatus, LeaveType, LeaveStatus, PayrollStatus 
} from "../types.js";

const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");

// Define Mongoose Schemas for Mongo Atlas
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const EmployeeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  employeeCode: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  avatarUrl: { type: String },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  employmentType: { type: String, required: true },
  status: { type: String, required: true },
  joinDate: { type: String, required: true },
  salary: { type: Number, required: true }
});

const JobOpeningSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String], required: true },
  salaryMin: { type: Number, required: true },
  salaryMax: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const ApplicationSkillMatchSchema = new Schema({
  matched: { type: [String], default: [] },
  missing: { type: [String], default: [] }
}, { _id: false });

const ApplicationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  jobOpeningId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  source: { type: String, required: true },
  stage: { type: String, required: true },
  priority: { type: String, required: true },
  aiScore: { type: Number },
  aiSummary: { type: String },
  aiSkillMatch: { type: ApplicationSkillMatchSchema },
  notes: { type: String },
  interviewDate: { type: String },
  resumeText: { type: String },
  resumeBase64: { type: String },
  createdAt: { type: String, required: true }
});

const AttendanceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  date: { type: String, required: true },
  checkIn: { type: String },
  checkOut: { type: String },
  status: { type: String, required: true },
  hoursWorked: { type: Number, required: true }
});

const LeaveRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  type: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, required: true },
  approvedBy: { type: String },
  createdAt: { type: String, required: true }
});

const PayslipSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, required: true },
  deductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: { type: String, required: true },
  processedAt: { type: String }
});

const GoalSchema = new Schema({
  title: { type: String, required: true },
  target: { type: String, required: true },
  achieved: { type: String },
  score: { type: Number }
}, { _id: false });

const PerformanceReviewSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  period: { type: String, required: true },
  score: { type: Number, required: true },
  goals: { type: [GoalSchema], default: [] },
  reviewerNotes: { type: String },
  createdAt: { type: String, required: true }
});

const AuditLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: String, required: true }
});

// Configure Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export const EmployeeModel = mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
export const JobOpeningModel = mongoose.models.JobOpening || mongoose.model("JobOpening", JobOpeningSchema);
export const ApplicationModel = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
export const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
export const LeaveRequestModel = mongoose.models.LeaveRequest || mongoose.model("LeaveRequest", LeaveRequestSchema);
export const PayslipModel = mongoose.models.Payslip || mongoose.model("Payslip", PayslipSchema);
export const PerformanceReviewModel = mongoose.models.PerformanceReview || mongoose.model("PerformanceReview", PerformanceReviewSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

// Connection state export indicator
export let isMongoConnected = false;

interface DBStorage {
  users: User[];
  employees: Employee[];
  jobs: JobOpening[];
  applications: Application[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  payslips: Payslip[];
  performance: PerformanceReview[];
  auditLogs: AuditLog[];
}

let db: DBStorage = {
  users: [],
  employees: [],
  jobs: [],
  applications: [],
  attendance: [],
  leaves: [],
  payslips: [],
  performance: [],
  auditLogs: []
};

// Seed Initial Data Helper
function generateSeedData(): DBStorage {
  const users: User[] = [
    { id: "u-admin", email: "admin@fwc.co.in", role: Role.MANAGEMENT_ADMIN, createdAt: new Date().toISOString() },
    { id: "u-manager", email: "manager@fwc.co.in", role: Role.SENIOR_MANAGER, createdAt: new Date().toISOString() },
    { id: "u-hr", email: "hr@fwc.co.in", role: Role.HR_RECRUITER, createdAt: new Date().toISOString() },
    { id: "u-emp", email: "employee@fwc.co.in", role: Role.EMPLOYEE, createdAt: new Date().toISOString() },
  ];

  const departments = ["Engineering", "Marketing", "Sales", "Operations", "HR", "Finance", "Legal", "Design"];

  const employees: Employee[] = [
    {
      id: "emp-1",
      userId: "u-admin",
      employeeCode: "EMP-001",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "admin@fwc.co.in",
      phone: "+91 98765 43210",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBauT1stCiMNWzmxCEwlotXRMadoWFEtMOCehMK6RoCGPcpuczjPvUqD9OgK0_LSXneBBuLcya157QVK-yzBf7JqhvLhwNBAWPa1HybKCQ0dC5WfON_FcusAQuZ1gzk0h6KKsPepTEtGHadlmHz9iNM30phR1teucHRQsaJXUfkGU5CgURmNPFoOxL9f_lpJWCBGQHqWvwu8B1NSbw4iKwkJ-vTvBSrD2bVfcqcqxaWCEmfPZg_F4cUK4V8kW969klVZhXlctzHrA",
      department: "HR",
      designation: "Admin Director",
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joinDate: "2022-01-15",
      salary: 145000
    },
    {
      id: "emp-2",
      userId: "u-manager",
      employeeCode: "EMP-002",
      firstName: "Mark",
      lastName: "Ruffalo",
      email: "manager@fwc.co.in",
      phone: "+91 98765 43211",
      department: "Engineering",
      designation: "Senior Manager",
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joinDate: "2021-06-10",
      salary: 180000
    },
    {
      id: "emp-3",
      userId: "u-hr",
      employeeCode: "EMP-003",
      firstName: "Rhea",
      lastName: "Kapoor",
      email: "hr@fwc.co.in",
      phone: "+91 98765 43212",
      department: "HR",
      designation: "Talent Acquisition Lead",
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joinDate: "2023-03-20",
      salary: 95000
    },
    {
      id: "emp-4",
      userId: "u-emp",
      employeeCode: "EMP-004",
      firstName: "Aman",
      lastName: "Gupta",
      email: "employee@fwc.co.in",
      phone: "+91 98765 43213",
      department: "Engineering",
      designation: "Software Engineer",
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joinDate: "2024-02-01",
      salary: 85000
    }
  ];

  // Generate 45 additional realistic employees to total 49
  const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Vikram", "Raj", "Neha", "Anita", "Deepak", "Anjali", "Kabir", "Meera", "Rohan", "Sonal", "Arjun", "Pooja", "Preeti", "Rahul", "Karan"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Sharma", "Verma", "Patel", "Reddy", "Mehta", "Malhotra", "Kapoor", "Joshi", "Bose", "Nair", "Ansari", "Dubey", "Gupta", "Sen", "Roy", "Chawla", "Bhardwaj", "Kumar", "Iyer", "Rao"];

  for (let i = 5; i <= 49; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[(i * 3) % lastNames.length];
    const dept = departments[i % departments.length];
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@fwc.co.in`;
    const userId = `u-gen-${i}`;

    users.push({
      id: userId,
      email,
      role: i % 15 === 0 ? Role.SENIOR_MANAGER : i % 20 === 0 ? Role.HR_RECRUITER : Role.EMPLOYEE,
      createdAt: new Date().toISOString()
    });

    employees.push({
      id: `emp-${i}`,
      userId,
      employeeCode: `EMP-${String(i).padStart(3, "0")}`,
      firstName: fName,
      lastName: lName,
      email,
      phone: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
      department: dept,
      designation: dept === "Engineering" ? "Software Engineer" : dept === "Design" ? "UX Architect" : "Specialist",
      employmentType: i % 10 === 0 ? EmploymentType.CONTRACT : EmploymentType.FULL_TIME,
      status: i % 12 === 0 ? EmployeeStatus.ON_LEAVE : EmployeeStatus.ACTIVE,
      joinDate: `2023-${String((i % 11) + 1).padStart(2, "0")}-${String((i % 25) + 1).padStart(2, "0")}`,
      salary: 60000 + (i % 10) * 12000
    });
  }

  const jobs: JobOpening[] = [
    {
      id: "job-1",
      title: "Senior Product Designer",
      department: "Design",
      description: "We are looking for a Senior Product Designer to drive our design system and design the enterprise-grade Stitch HRMS application.",
      requirements: ["5+ years UX/UI design experience", "Design systems expertise", "Figma", "Interaction Design", "Prototyping"],
      salaryMin: 90000,
      salaryMax: 140000,
      status: JobStatus.OPEN,
      createdAt: "2024-01-10T08:00:00Z"
    },
    {
      id: "job-2",
      title: "Full-Stack Engineer (Node/React)",
      department: "Engineering",
      description: "Join our core platforms team to build AI integrations and high-concurrency Node.js endpoints.",
      requirements: ["TypeScript", "Node.js (Express)", "React / Next.js", "MongoDB", "AI model prompt engineering"],
      salaryMin: 110000,
      salaryMax: 160000,
      status: JobStatus.OPEN,
      createdAt: "2024-01-15T09:30:00Z"
    },
    {
      id: "job-3",
      title: "Talent Acquisition Executive",
      department: "HR",
      description: "Drive recruitment pipelines, manage candidate onboarding, and operate the AI recruitment assistants.",
      requirements: ["2+ years HR recruiting experience", "Excellent communication", "ATS systems experience"],
      salaryMin: 50000,
      salaryMax: 75000,
      status: JobStatus.OPEN,
      createdAt: "2024-02-01T11:00:00Z"
    }
  ];

  const applications: Application[] = [
    {
      id: "app-1",
      jobOpeningId: "job-1",
      candidateName: "Alex Rivera",
      candidateEmail: "alex.rivera@example.com",
      source: ApplicationSource.LINKEDIN,
      stage: PipelineStage.APPLIED,
      priority: Priority.LOW,
      notes: "Portfolio looks solid with modern dashboards. Needs code test check.",
      createdAt: "2024-02-22T10:00:00Z"
    },
    {
      id: "app-2",
      jobOpeningId: "job-1",
      candidateName: "Sarah Chen",
      candidateEmail: "sarah.chen@example.com",
      source: ApplicationSource.REFERRAL,
      stage: PipelineStage.APPLIED,
      priority: Priority.HIGH,
      notes: "Referred by head of marketing. Highly technical designer.",
      createdAt: "2024-02-24T03:00:00Z"
    },
    {
      id: "app-3",
      jobOpeningId: "job-1",
      candidateName: "David Miller",
      candidateEmail: "david.miller@example.com",
      source: ApplicationSource.INDEED,
      stage: PipelineStage.SCREENING,
      priority: Priority.NORMAL,
      aiScore: 92,
      aiSummary: "Outstanding candidate with 6 years UX experience, strong team leadership, and expertise in clean typography, spacing, and micro-interactions.",
      aiSkillMatch: {
        matched: ["Figma", "UX/UI design experience", "Interaction Design", "Prototyping"],
        missing: ["Design systems expertise"]
      },
      notes: "Strong candidate from AI screen. Recommended for immediate interview.",
      createdAt: "2024-02-15T14:15:00Z"
    },
    {
      id: "app-4",
      jobOpeningId: "job-1",
      candidateName: "Emily Watson",
      candidateEmail: "emily.watson@example.com",
      source: ApplicationSource.INDEED,
      stage: PipelineStage.SHORTLISTED,
      priority: Priority.HIGH,
      aiScore: 88,
      aiSummary: "Senior UX architect with 7+ years design experience, expert knowledge of Design Systems, and direct experience designing enterprise B2B tools.",
      aiSkillMatch: {
        matched: ["5+ years UX/UI design experience", "Design systems expertise", "Figma", "Interaction Design"],
        missing: ["Prototyping"]
      },
      notes: "Direct candidate with incredible product design style.",
      createdAt: "2024-02-12T09:00:00Z"
    },
    {
      id: "app-5",
      jobOpeningId: "job-1",
      candidateName: "Jordan Smith",
      candidateEmail: "jordan.smith@example.com",
      source: ApplicationSource.GOOGLE,
      stage: PipelineStage.INTERVIEW,
      priority: Priority.HIGH,
      aiScore: 95,
      aiSummary: "Exceptional design resume matching 100% of the job criteria. Extensive experience building and hosting complex collaborative design system frameworks.",
      aiSkillMatch: {
        matched: ["5+ years UX/UI design experience", "Design systems expertise", "Figma", "Interaction Design", "Prototyping"],
        missing: []
      },
      notes: "Currently in Round 2 interview. Very promising conversationalist.",
      interviewDate: "2024-02-24T10:30:00Z",
      createdAt: "2024-02-10T11:20:00Z"
    },
    {
      id: "app-6",
      jobOpeningId: "job-1",
      candidateName: "Nina Vance",
      candidateEmail: "nina.vance@example.com",
      source: ApplicationSource.DIRECT,
      stage: PipelineStage.SELECTED,
      priority: Priority.NORMAL,
      notes: "Selected from previous design listings. Offer extended and pending candidate's signature.",
      createdAt: "2024-02-05T15:00:00Z"
    },
    {
      id: "app-7",
      jobOpeningId: "job-1",
      candidateName: "Marcus Thorne",
      candidateEmail: "marcus.thorne@example.com",
      source: ApplicationSource.LINKEDIN,
      stage: PipelineStage.HIRED,
      priority: Priority.HIGH,
      notes: "Hired on 15 Feb. Onboarding sequence in progress.",
      createdAt: "2024-02-01T09:15:00Z"
    },
    {
      id: "app-seed-sophia",
      jobOpeningId: "job-1",
      candidateName: "Sophia Vance",
      candidateEmail: "sophia.vance@example.com",
      source: ApplicationSource.DIRECT,
      stage: PipelineStage.SCREENING,
      priority: Priority.HIGH,
      aiScore: 94,
      aiSummary: "Sophia is an exceptional Product Designer with a brilliant portfolio showcasing advanced high-fidelity dashboard design, custom component blueprints, and design system governance.",
      aiSkillMatch: {
        matched: ["Figma", "Design systems expertise", "Prototyping", "5+ years UX/UI design experience"],
        missing: ["Interaction Design"]
      },
      notes: "High potential designer. Real-time resume text and mock binary verified on MongoDB Atlas.",
      resumeText: `SOPHIA VANCE - SENIOR PRODUCT DESIGNER\nEmail: sophia.vance@example.com | Phone: +1 415 555 2390\n\nPROFESSIONAL SUMMARY:\nCreative and detail-oriented Senior Product Designer with 6+ years of experience crafting beautiful, user-centered enterprise SaaS applications. Leading designer on scale systems using Figma and modern prototyping tools.\n\nTECHNICAL SKILLS:\n- Design: Figma, Adobe XD, Sketch, Principle, Mockups\n- Methodologies: Design Systems Engineering, Prototyping, UX Research, Wireframing\n- Front-end: HTML, CSS, Storybook`,
      resumeBase64: `data:application/pdf;base64,JVBERi0xLjQKJSDi48clN0YXJ0b2ZmaWxlCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAogIC9Gb250IDw8CiAgICAvRjEgNCAwIFIKICBfPgogPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDgwCj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZAooU29waGlhIFZhbmNlIC0gU2VuaW9yIFByb2R1Y3QgRGVzaWduZXIgcmVzdW1lIHN0b3JlZCBvbiBNb25nb0RCIEF0bGFzKSBUagogCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIyNiAwMDAwMCBuIAowMDAwMDAwMzEwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQwCgolRU9GCg==`,
      createdAt: "2026-06-06T11:51:00Z"
    },
    {
      id: "app-seed-ali",
      jobOpeningId: "job-2",
      candidateName: "Muhammad Ali",
      candidateEmail: "muhammad.ali@example.com",
      source: ApplicationSource.REFERRAL,
      stage: PipelineStage.SCREENING,
      priority: Priority.HIGH,
      aiScore: 96,
      aiSummary: "Superb Full-Stack Developer matching Node, React, TypeScript, and MongoDB. Wrote production APIs and scaled real-time websockets on cloud infrastructure.",
      aiSkillMatch: {
        matched: ["TypeScript", "Node.js (Express)", "React / Next.js", "MongoDB"],
        missing: ["AI model prompt engineering"]
      },
      notes: "Internal candidate. Real-time resume text and mock binary verified on MongoDB Atlas.",
      resumeText: `MUHAMMAD ALI - FULL STACK DEVELOPER\nEmail: muhammad.ali@example.com | Phone: +91 91122 33445\n\nEXPERIENCE OVERVIEW:\nPassionate developer with highly performant React SPA creation skills, custom Express router design, and deep database structures inside SQL and NoSQL environments.\n\nCORE SKILLS:\n- Languages: JavaScript, TypeScript, HTML/CSS\n- Libraries: React, Node.js, Express, Mongoose, Drizzle`,
      resumeBase64: `data:application/pdf;base64,JVBERi0xLjQKJSDi48clN0YXJ0b2ZmaWxlCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAogIC9Gb250IDw8CiAgICAvRjEgNCAwIFIKICBfPgogPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDgwCj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZAooTXVoYW1tYWQgQWxpIC0gRnVsbC1TdGFjayBFbmdpbmVlciByZXN1bWUgZGF0YSBvbiBNb25nb0RCIEF0bGFzKSBUagogCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIyNiAwMDAwMCBuIAowMDAwMDAwMzEwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQwCgolRU9GCg==`,
      createdAt: "2026-06-06T11:52:00Z"
    },
    {
      id: "app-seed-elena",
      jobOpeningId: "job-3",
      candidateName: "Elena Rostova",
      candidateEmail: "elena.rostova@example.com",
      source: ApplicationSource.INDEED,
      stage: PipelineStage.SCREENING,
      priority: Priority.NORMAL,
      aiScore: 86,
      aiSummary: "Experienced HR Recruiter with solid understanding of corporate screening, onboarding, and ATS pipelines. Strong interpersonal communication skillset.",
      aiSkillMatch: {
        matched: ["2+ years HR recruiting experience", "Excellent communication"],
        missing: ["ATS systems experience"]
      },
      notes: "Highly energetic recruiter. Real-time resume text and mock binary verified on MongoDB Atlas.",
      resumeText: `ELENA ROSTOVA - TALENT ACQUISITION EXECUTIVE\nEmail: elena.rostova@example.com | Phone: +7 920 112 3456\n\nWORK HISTORY:\n- Talent Acquisition Specialist (2022-Present): Sourced, screened, and placed over 40+ engineering candidates annually.\n- HR Coordinator (2020-2022)\n\nKEY TALENTS:\n- Candidate Onboarding, Behavioral Interviewing, Employer Branding, CRM / ATS utilities.`,
      resumeBase64: `data:application/pdf;base64,JVBERi0xLjQKJSDi48clN0YXJ0b2ZmaWxlCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAogIC9Gb250IDw8CiAgICAvRjEgNCAwIFIKICBfPgogPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDgwCj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZAooRWxlbmEgUm9zdG92YSAtIEhSIFJlY3J1aXRlciByZXN1bWUgZGF0YSBvbiBNb25nb0RCIEF0bGFzKSBUagogCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIyNiAwMDAwMCBuIAowMDAwMDAwMzEwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQwCgolRU9GCg==`,
      createdAt: "2026-06-06T11:53:00Z"
    }
  ];

  // Daily seed attendance for the last 3 days
  const attendance: Attendance[] = [];
  const days = ["2026-06-03", "2026-06-04", "2026-06-05"];
  employees.forEach((emp) => {
    days.forEach((day, index) => {
      // Simulate that 95% of people are present, 3% late, and others on leave/absent
      const rand = Math.random();
      if (rand < 0.90) {
        attendance.push({
          id: `att-${emp.id}-${day}`,
          employeeId: emp.id,
          date: day,
          checkIn: `${day}T08:52:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}Z`,
          checkOut: `${day}T17:35:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}Z`,
          status: AttendanceStatus.PRESENT,
          hoursWorked: 8.5
        });
      } else if (rand < 0.96) {
        attendance.push({
          id: `att-${emp.id}-${day}`,
          employeeId: emp.id,
          date: day,
          checkIn: `${day}T09:35:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}Z`,
          checkOut: `${day}T17:42:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}Z`,
          status: AttendanceStatus.LATE,
          hoursWorked: 8.1
        });
      } else {
        // Absent or on leave
        attendance.push({
          id: `att-${emp.id}-${day}`,
          employeeId: emp.id,
          date: day,
          status: AttendanceStatus.ABSENT,
          hoursWorked: 0
        });
      }
    });
  });

  const leaves: LeaveRequest[] = [
    {
      id: "leave-1",
      employeeId: "emp-4",
      type: LeaveType.CASUAL,
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      days: 3,
      reason: "Family wedding celebration",
      status: LeaveStatus.PENDING,
      createdAt: "2026-06-04T12:00:00Z"
    },
    {
      id: "leave-2",
      employeeId: "emp-2",
      type: LeaveType.ANNUAL,
      startDate: "2026-06-15",
      endDate: "2026-06-25",
      days: 10,
      reason: "Summer vacation with family",
      status: LeaveStatus.PENDING,
      createdAt: "2026-06-05T09:00:00Z"
    }
  ];

  const payslips: Payslip[] = employees.map((emp) => ({
    id: `pay-${emp.id}-05-2026`,
    employeeId: emp.id,
    month: 5,
    year: 2026,
    basicSalary: emp.salary ? emp.salary * 0.7 : 50000,
    allowances: emp.salary ? emp.salary * 0.2 : 12000,
    deductions: emp.salary ? emp.salary * 0.05 : 3000,
    netSalary: emp.salary ? emp.salary * 0.85 : 59000,
    status: PayrollStatus.PROCESSED,
    processedAt: "2026-05-31T17:00:00Z"
  }));

  const performance: PerformanceReview[] = [
    {
      id: "perf-1",
      employeeId: "emp-4",
      period: "Q1-2026",
      score: 91,
      goals: [
        { title: "Optimize HR application performance", target: "Load time < 1.5s", achieved: "Achieved average load time of 1.1s", score: 95 },
        { title: "Review AI screening prompt parameters", target: "Implement screen resume interface", achieved: "Wrote high-quality server-side screens", score: 88 }
      ],
      reviewerNotes: "Aman is a diligent software engineer who exhibits tremendous visual intuition. His execution and alignment are flawless.",
      createdAt: "2026-04-10T11:00:00Z"
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "log-1",
      userId: "u-admin",
      action: "LOGIN",
      resource: "Auth",
      details: { ip: "127.0.0.1" },
      createdAt: new Date().toISOString()
    }
  ];

  return { users, employees, jobs, applications, attendance, leaves, payslips, performance, auditLogs };
}

// Ensure db state is loaded/saved
export function loadDB() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, "utf-8");
      db = JSON.parse(data);
    } else {
      db = generateSeedData();
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load local DB state. Using initial mock.", err);
    db = generateSeedData();
  }
}

export function saveDB() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local DB state.", err);
  }
}

// Initial DB charge of local data
loadDB();

// Initialize MongoDB Connection function
export async function initializeMongo() {
  const DEFAULT_MONGO_URI = "mongodb+srv://abubakaransari0321_db_user:TfN5aC1I2ZFfis2h@cluster0.yidqcgq.mongodb.net/?appName=Cluster0";
  let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  // Gracefully handle accidental copy-paste brackets around password
  if (MONGODB_URI.includes(":<TfN5aC1I2ZFfis2h>@")) {
    MONGODB_URI = MONGODB_URI.replace(":<TfN5aC1I2ZFfis2h>@", ":TfN5aC1I2ZFfis2h@");
  } else if (MONGODB_URI.includes(":<HOqvrXVXKDbzYQMI>@")) {
    MONGODB_URI = MONGODB_URI.replace(":<HOqvrXVXKDbzYQMI>@", ":HOqvrXVXKDbzYQMI@");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    // Limit connection attempts so the startup is fast even if Atlas credentials change
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    isMongoConnected = true;
    console.log("MongoDB Connected Successfully to Cluster0!");

    // Granular collection-by-collection checks and seeding
    console.log("Checking and seeding each collection in MongoDB Atlas individually...");
    const seeded = generateSeedData();

    // 1. Users
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log("MongoDB is missing Users. Seeding users list...");
      await UserModel.insertMany(seeded.users as any[]);
    }

    // 2. Employees
    const empCount = await EmployeeModel.countDocuments();
    if (empCount === 0) {
      console.log("MongoDB is missing Employees. Seeding employee directory...");
      await EmployeeModel.insertMany(seeded.employees as any[]);
    }

    // 3. Jobs
    const jobCount = await JobOpeningModel.countDocuments();
    if (jobCount === 0) {
      console.log("MongoDB is missing Jobs. Seeding opening positions...");
      await JobOpeningModel.insertMany(seeded.jobs as any[]);
    }

    // 4. Applications
    const appCount = await ApplicationModel.countDocuments();
    if (appCount === 0) {
      console.log("MongoDB is missing Applications. Seeding default pipeline...");
      await ApplicationModel.insertMany(seeded.applications as any[]);
    } else {
      // Guarantee our high-fidelity resume-screening items exist
      const specialAppIds = ["app-seed-sophia", "app-seed-ali", "app-seed-elena"];
      for (const appId of specialAppIds) {
        const found = await ApplicationModel.findOne({ id: appId } as any);
        if (!found) {
          const originalApp = seeded.applications.find(a => a.id === appId);
          if (originalApp) {
            console.log(`Guaranteed Insertion: Seeding special resume candidate ${originalApp.candidateName} on MongoDB Atlas...`);
            await ApplicationModel.create(originalApp);
          }
        }
      }
    }

    // 5. Attendance
    const attCount = await AttendanceModel.countDocuments();
    if (attCount === 0) {
      console.log("MongoDB is missing Attendance. Seeding clock logs...");
      await AttendanceModel.insertMany(seeded.attendance as any[]);
    }

    // 6. Leaves
    const leaveCount = await LeaveRequestModel.countDocuments();
    if (leaveCount === 0) {
      console.log("MongoDB is missing Leaves. Seeding balance lists...");
      await LeaveRequestModel.insertMany(seeded.leaves as any[]);
    }

    // 7. Payslips
    const payCount = await PayslipModel.countDocuments();
    if (payCount === 0) {
      console.log("MongoDB is missing Payslips. Seeding payroll matrices...");
      await PayslipModel.insertMany(seeded.payslips as any[]);
    }

    // 8. Performance Reviews
    const perfCount = await PerformanceReviewModel.countDocuments();
    if (perfCount === 0) {
      console.log("MongoDB is missing Performance reviews. Seeding evaluations...");
      await PerformanceReviewModel.insertMany(seeded.performance as any[]);
    }

    // 9. Audit Logs
    const logCount = await AuditLogModel.countDocuments();
    if (logCount === 0) {
      console.log("MongoDB is missing Logs. Seeding initial server footprints...");
      await AuditLogModel.insertMany(seeded.auditLogs as any[]);
    }

    console.log("Seeding audits executed successfully! Pulling remote cloud entities into memory stream...");
    
    // Read final state from MongoDB Atlas to synchronize our memory representation
    const users = await UserModel.find();
    const employees = await EmployeeModel.find();
    const jobs = await JobOpeningModel.find();
    const applications = await ApplicationModel.find();
    const attendance = await AttendanceModel.find();
    const leaves = await LeaveRequestModel.find();
    const payslips = await PayslipModel.find();
    const performance = await PerformanceReviewModel.find();
    const auditLogs = await AuditLogModel.find().sort({ createdAt: -1 });

    db = {
      users: users.map(doc => doc.toObject()),
      employees: employees.map(doc => doc.toObject()),
      jobs: jobs.map(doc => doc.toObject()),
      applications: applications.map(doc => doc.toObject()),
      attendance: attendance.map(doc => doc.toObject()),
      leaves: leaves.map(doc => doc.toObject()),
      payslips: payslips.map(doc => doc.toObject()),
      performance: performance.map(doc => doc.toObject()),
      auditLogs: auditLogs.map(doc => doc.toObject())
    };
    
    console.log(`Atlas sync complete! Loaded ${employees.length} employees, ${jobs.length} jobs, and ${applications.length} candidate files.`);
    // Set local file as a cached copy
    saveDB();
  } catch (err) {
    console.error("MongoDB Atlas connection timed out/failed. Falling back to persistent files.", err);
    isMongoConnected = false;
    // Keep local db
  }
}

// Fire off connection asynchronously right away
initializeMongo().catch(e => console.error("Async MongoDB initiator error:", e));

export const dbService = {
  getUsers: () => db.users,
  getEmployees: () => db.employees,
  getJobs: () => db.jobs,
  getApplications: () => db.applications,
  getAttendance: () => db.attendance,
  getLeaves: () => db.leaves,
  getPayslips: () => db.payslips,
  getPerformance: () => db.performance,
  getLogs: () => db.auditLogs,
  saveDB: () => saveDB(),
  getMongoStatus: () => isMongoConnected,

  // Setters/mutations
  createUser: (user: User) => {
    db.users.push(user);
    saveDB();
    if (isMongoConnected) {
      UserModel.create(user).catch(err => console.error("Error saving user to MongoDB:", err));
    }
    return user;
  },

  createEmployee: (emp: Employee) => {
    db.employees.push(emp);
    saveDB();
    if (isMongoConnected) {
      EmployeeModel.create(emp).catch(err => console.error("Error saving employee to MongoDB:", err));
    }
    return emp;
  },

  updateEmployee: (id: string, updates: Partial<Employee>) => {
    const idx = db.employees.findIndex(e => e.id === id);
    if (idx !== -1) {
      db.employees[idx] = { ...db.employees[idx], ...updates };
      saveDB();
      if (isMongoConnected) {
        EmployeeModel.updateOne({ id }, { $set: updates }).catch(err => console.error("Error updating employee on MongoDB:", err));
      }
      return db.employees[idx];
    }
    return null;
  },

  updateJob: (id: string, updates: Partial<JobOpening>) => {
    const idx = db.jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      db.jobs[idx] = { ...db.jobs[idx], ...updates };
      saveDB();
      if (isMongoConnected) {
        JobOpeningModel.updateOne({ id }, { $set: updates }).catch(err => console.error("Error updating job criteria on MongoDB:", err));
      }
      return db.jobs[idx];
    }
    return null;
  },

  createApplication: (app: Application) => {
    db.applications.push(app);
    saveDB();
    if (isMongoConnected) {
      ApplicationModel.create(app).catch(err => console.error("Error saving candidate application to MongoDB:", err));
    }
    return app;
  },

  updateApplicationStage: (id: string, stage: PipelineStage) => {
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.applications[idx].stage = stage;
      saveDB();
      if (isMongoConnected) {
        ApplicationModel.updateOne({ id }, { $set: { stage } }).catch(err => console.error("Error updating candidate stage on MongoDB:", err));
      }
      return db.applications[idx];
    }
    return null;
  },

  updateApplication: (id: string, updates: Partial<Application>) => {
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.applications[idx] = { ...db.applications[idx], ...updates };
      saveDB();
      if (isMongoConnected) {
        ApplicationModel.updateOne({ id }, { $set: updates }).catch(err => console.error("Error updating candidate file on MongoDB:", err));
      }
      return db.applications[idx];
    }
    return null;
  },

  createAttendance: (att: Attendance) => {
    db.attendance.push(att);
    saveDB();
    if (isMongoConnected) {
      AttendanceModel.create(att).catch(err => console.error("Error saving daily clock state to MongoDB:", err));
    }
    return att;
  },

  createLeaveRequest: (req: LeaveRequest) => {
    db.leaves.push(req);
    saveDB();
    if (isMongoConnected) {
      LeaveRequestModel.create(req).catch(err => console.error("Error creating leave application on MongoDB:", err));
    }
    return req;
  },

  updateLeaveRequestStatus: (id: string, status: LeaveStatus, approvedBy?: string) => {
    const idx = db.leaves.findIndex(l => l.id === id);
    if (idx !== -1) {
      db.leaves[idx].status = status;
      if (approvedBy) db.leaves[idx].approvedBy = approvedBy;
      saveDB();
      if (isMongoConnected) {
        const setQuery: any = { status };
        if (approvedBy) setQuery.approvedBy = approvedBy;
        LeaveRequestModel.updateOne({ id }, { $set: setQuery }).catch(err => console.error("Error updating leave request status on MongoDB:", err));
      }
      return db.leaves[idx];
    }
    return null;
  },

  createPayslip: (slip: Payslip) => {
    db.payslips.push(slip);
    saveDB();
    if (isMongoConnected) {
      PayslipModel.create(slip).catch(err => console.error("Error creating financial payslip on MongoDB:", err));
    }
    return slip;
  },

  updatePayslipStatus: (id: string, status: PayrollStatus) => {
    const idx = db.payslips.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.payslips[idx].status = status;
      const processedAt = new Date().toISOString();
      db.payslips[idx].processedAt = processedAt;
      saveDB();
      if (isMongoConnected) {
        PayslipModel.updateOne({ id }, { $set: { status, processedAt } }).catch(err => console.error("Error updating payslip status on MongoDB:", err));
      }
      return db.payslips[idx];
    }
    return null;
  },

  createPerformanceReview: (review: PerformanceReview) => {
    db.performance.push(review);
    saveDB();
    if (isMongoConnected) {
      PerformanceReviewModel.create(review).catch(err => console.error("Error submitting performance rating to MongoDB:", err));
    }
    return review;
  },

  addLog: (log: Omit<AuditLog, "id" | "createdAt">) => {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog); // Prepend new logs
    saveDB();
    if (isMongoConnected) {
      AuditLogModel.create(newLog).catch(err => console.error("Error logging security event to MongoDB:", err));
    }
    return newLog;
  }
};
