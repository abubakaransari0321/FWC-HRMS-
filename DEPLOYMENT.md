# Deployment & Integration Guide (GitHub, MongoDB Atlas, Render, Vercel)

This document provides step-by-step instructions to push this full-stack React + Node (Express) workspace to GitHub, integrate MongoDB Atlas as your persistent database, and deploy to Render or Vercel.

---

## 1. Preparing & Pushing to GitHub

Since `.gitignore` already ignores temporary environment files (`.env*`), node modules, runtime databases (`db_storage.json`), and build folders, your repository is completely clean of secrets.

To push your code to a new GitHub repository, run these commands in your local machine terminal:

```bash
# Initialize local repository
git init

# Add all files (excluding ignored ones)
git add .

# Create initial commit
git commit -m "feat: initial release of HRMS matching engine with criteria configuration"

# Create a main branch and add your remote origin
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push code to GitHub
git push -u origin main
```

---

## 2. Integrating MongoDB Atlas Later

Currently, the server uses a highly reliable file-written JSON backing (`db_storage.json`) for data persistence. To swap this with MongoDB Atlas, complete the following pattern:

### Step 1: Install MongoDB / Mongoose Client on your computer
```bash
npm install mongoose dotenv
```

### Step 2: Set your connection string in `.env`
In your `.env` file on Render or locally, specify:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/hrms_matching_engine?retryWrites=true&w=majority"
```

### Step 3: Example database connector setup (`src/server/mongodb.ts`)
Create a simple mongoose bootstrap connector inside your server logic:
```typescript
import mongoose from "mongoose";

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not defined. Falling back to local storage file.");
    return false;
  }
  
  try {
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB Atlas!");
    return true;
  } catch (error) {
    console.error("MongoDB Atlas connection error:", error);
    return false;
  }
}
```

### Step 4: Map schemas inside `src/server/db.ts`
Map the existing JSON interfaces in `src/types.ts` to Mongoose schemas. Example:
```typescript
import mongoose, { Schema } from "mongoose";

const JobOpeningSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  requirements: [String],
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const JobOpeningModel = mongoose.models.JobOpening || mongoose.model("JobOpening", JobOpeningSchema);
```

---

## 3. Deploying to Render (Best for Full-Stack Node Servers)

Render is excellent for hosting Express applications with Vite static assets because it runs both within a single container successfully.

### Step-by-Step Configuration on Render:

1. Log in to **[Render.com](https://render.com/)** and click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start` (which runs `node dist/server.cjs`)
   - **Plan**: `Free` or custom
4. Go to the **Environment** tab on Render and add your variables:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = `your-live-gemini-key`
   - `MONGODB_URI` = `your-mongodb-atlas-url`

Render handles routing perfectly! It compiles Vite static client assets inside `dist/` and runs the Express API routes directly on port `3000` (mapped automatically in the container).

---

## 4. Deploying to Vercel (Serverless Deployments)

Vercel is optimized for serverless deployments. Since we run a custom Node Express back-end, Vercel requires a serverless endpoint mapping or configuration file.

### Step 1: Create a `vercel.json` config
In your repository root, declare a standard serverless router:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Separate api path server files for serverless execution
For production on Vercel, instead of a long-running Node listener, APIs are split into `/api` serverless files. In contrast, **Render** is recommended for full-stack Node applications with custom REST servers (like `server.ts`) in 1-click deployments because it runs the persistent process.
