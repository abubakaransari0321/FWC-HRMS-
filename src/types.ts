/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  MANAGEMENT_ADMIN = "MANAGEMENT_ADMIN",
  SENIOR_MANAGER = "SENIOR_MANAGER",
  HR_RECRUITER = "HR_RECRUITER",
  EMPLOYEE = "EMPLOYEE"
}

export enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  TERMINATED = "TERMINATED"
}

export enum EmploymentType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERN = "INTERN"
}

export enum JobStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  ON_HOLD = "ON_HOLD",
  FILLED = "FILLED"
}

export enum PipelineStage {
  APPLIED = "APPLIED",
  SCREENING = "SCREENING",
  SHORTLISTED = "SHORTLISTED",
  INTERVIEW = "INTERVIEW",
  SELECTED = "SELECTED",
  HIRED = "HIRED",
  REJECTED = "REJECTED"
}

export enum ApplicationSource {
  LINKEDIN = "LINKEDIN",
  INDEED = "INDEED",
  REFERRAL = "REFERRAL",
  GOOGLE = "GOOGLE",
  DIRECT = "DIRECT",
  GLASSDOOR = "GLASSDOOR"
}

export enum Priority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH"
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  HALF_DAY = "HALF_DAY",
  HOLIDAY = "HOLIDAY",
  WEEKEND = "WEEKEND"
}

export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  CASUAL = "CASUAL",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  UNPAID = "UNPAID"
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export enum PayrollStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  PAID = "PAID"
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joinDate: string;
  salary?: number;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  status: JobStatus;
  createdAt: string;
}

export interface Application {
  id: string;
  jobOpeningId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl?: string;
  resumeText?: string;
  resumeBase64?: string;
  source: ApplicationSource;
  stage: PipelineStage;
  aiScore?: number; // 0-100
  aiSummary?: string;
  aiSkillMatch?: {
    matched: string[];
    missing: string[];
  };
  priority: Priority;
  notes?: string;
  interviewDate?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO date-time
  checkOut?: string; // ISO date-time
  status: AttendanceStatus;
  hoursWorked?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  processedAt?: string;
}

export interface Goal {
  title: string;
  target: string;
  achieved: string;
  score: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  period: string;
  score: number;
  goals: Goal[];
  reviewerNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: any;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
