# FWC HRMS - Enterprise-Grade AI-Powered Talent Suite

FWC HRMS is a dynamic, full-stack Human Resource Management System and Talent Acquisition Suite. Powered by a responsive client interface, a custom Express backend, and live synchronization with **MongoDB Atlas**, it incorporates advanced generative AI tooling driven by **Gemini 3.5 Flash** to streamline resume screening, automate performance drafts, and provide instant organizational insights.

---

## 🚀 Key Modules & AI Capabilities

### 1. 📄 AI Resume Screening & PDF Key-Skills Parsing
- **Interactive Multi-Format Uploads**: Supports drag-and-drop or manual browses for standard `.pdf` and `.txt` candidate profiles.
- **Intelligent Structured Screening**: Submits the resume binary or text directly to **Gemini 3.5 Flash**. The model extracts candidate metadata, parses their skill spectrum against open job descriptions, and matches them to active requirements.
- **Rich Reports & Cloud Binary Sync**: Stores raw text and matching binary datasets directly into MongoDB Atlas. In-app screening reports feature matched/missing interactive badges and instant download triggers for the candidate's PDF files.

### 2. 💬 Cognitive UI Chat Assistant
- **Live Database Grounding**: Fed with structured active summaries of the operational database (total employee headcount, department splits, pending leave registers, live talent positions).
- **Intelligent Response Engine**: Provides immediate answers to metrics inquiries, drafting evaluation parameters, or answering staffing allocation goals.

### 3. ✍️ Constructive Performance Review Drafter
- Generates high-fidelity constructive evaluations based on employee tenure, position, department, and employment type.
- Delivers a structured markdown draft directly, ensuring consistent feedback and high emotional security.

### 4. 🎙️ NLP Recruiter Navigator (Voice/Text Parsing)
- Accepts keyboard commands or spoken instructions to automatically guide you through the HRMS.
- Instantly processes inputs like *"Show me the designer candidates"* or *"Display leave schedules"* using Gemini to classify actions and navigate viewports smoothly.

---

## 💾 Database Architecture & Cloud Seeding

FWC HRMS features a hybrid cloud-resilient storage engine designed to run seamlessly across local and production environments:

- **Durable Live Synchronization**: Directly connects to **MongoDB Atlas Cluster0** using mongoose schematization. Modifying candidate stages, checking in attendance, drafting evaluations, or logging secure system access writes instantly to the cloud.
- **Granular Collection Seeding**: When connecting to an empty cluster, the backend initiates a custom multi-collection seeding sequence to generate highly detailed datasets across all categories:
  - **`Users`**: Standard auth accounts and security access keys.
  - **`Employees`**: High-fidelity employee directory with department records, join dates, and payroll levels.
  - **`JobOpenings`**: Vacant enterprise recruitment profiles.
  - **`Applications`**: Live pipeline data with loaded credentials (including complete high-fidelity resumes like **Sophia Vance**, **Muhammad Ali**, and **Elena Rostova** along with their evaluated scores and stored PDF binaries).
  - **`Attendance`, `Leaves`, `Payslips`, `PerformanceReviews`, `AuditLogs`**: Complete transactional datasets showing real payroll files and audit traces.
- **Graceful Local Fallback**: If the cluster goes offline, the server silently falls back to local JSON caching (`db_storage.json`) so your application never crashes.

---

## 🗄️ Repository Directory Layout

The codebase has been refactored for modularity, type-safety, and structural cleanliness:

```bash
├── server.ts                 # Full-stack entry point managing express routing and Vite middleware
├── package.json              # Client/Server build targets and external script declarations
├── metadata.json             # App permission matrices and capability markers
├── DEPLOYMENT.md             # Production hosting directions (Render, Vercel, Local)
├── src/
│   ├── main.tsx              # React mounting root
│   ├── App.tsx               # Primary interface orchestrator and view controller
│   ├── types.ts              # Absolute TypeScript interfaces and Pipeline Enums
│   ├── index.css             # Tailwind CSS styles & typography configuration
│   ├── server/
│   │   └── db.ts             # MongoDB Atlas / Mongoose connection schema, models & seeding protocols
│   └── components/
│       ├── Navigation.tsx      # System sidebar, status metrics, and digital UTC clock
│       ├── DashboardView.tsx   # Enterprise executive summary & department ratios
│       ├── EmployeesView.tsx   # Employee directories, creation panels, and filters
│       ├── RecruitmentView.tsx # Interactive recruitment pipelines and interview logs
│       ├── AIScreeningView.tsx # Resume parsing forms, reports lists, and PDF downloaders
│       ├── LeaveManagement.tsx # Unified time-off calendar and approval workflows
│       ├── PayrollView.tsx     # Payslip processing tables and payroll indicators
│       ├── PerformanceView.tsx # Review matrix and Gemini review-drafting consoles
│       ├── AuditLogView.tsx    # Live security ledger tracking system interactions
│       ├── AIChatBot.tsx       # Embedded chat interface grounding model details
│       └── VoiceControl.tsx    # NLP speech parsing recruitment controller
```

---

## 🛠️ Step-by-Step GitHub Synchronization

You do not need to construct a Git environment or run manual terminal commands inside this workspace! The platform provides a secure, single-click automated sync flow.

### Method A: Built-in GitHub Sync (Recommended)
1. On the **Google AI Studio Build** interface, look at the top-right header panel.
2. Click the **Settings (Gear Icon)** or the **Export** menu.
3. Select **Export to GitHub**.
4. Authenticate your GitHub account and authorize AI Studio.
5. Choose **Create New Repository**, enter `fwc-hrms` as your desired repository name, and click sync.
6. The platform will automatically upload the clean repository with perfect styling configurations and your database seeding setup.

### Method B: Manual CLI Push
If you prefer exporting the ZIP file first or want to push from your local computer:
```bash
# Extract the ZIP and open the directory
cd fwc-hrms

# Initialize git repository
git init

# Add all files (the preconfigured .gitignore will automatically skip node_modules and logs)
git add .

# Create initial commit
git commit -m "feat: complete fwc hrms with gemini engine and mongodb atlas synchronization"

# Connect to your GitHub repository
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/FWC_HRMS.git

# Push to your remote repository
git push -u origin main
```

---

## 📃 License

Distributed under the MIT License. Developed for enterprise scale with visual excellence.

