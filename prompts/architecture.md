You are the lead software architect for my hackathon project called **NEXORA (Network of Engaged eXperts for Operations And Rapid Action)**.

Your task is to **refactor and improve the project architecture** before implementing features.

## Goal

Create a clean, scalable, enterprise-grade architecture suitable for a production-ready AI-powered civic issue resolution platform built for a Google AI hackathon.

Do NOT implement business logic yet unless necessary. Focus on creating the project structure, reusable modules, placeholder files, exports, and clean organization.

---

## Tech Stack

* Next.js 15 (App Router)
* React
* TypeScript
* Tailwind CSS
* Supabase
* Google Gemini API
* PostgreSQL

---

## Project Theme

NEXORA is an AI-powered civic issue resolution platform that enables citizens to report community problems while multiple AI agents collaborate to analyze, prioritize, route, and resolve issues.

The UI follows:

* Dark theme (#141414)
* Orange accent (#E8621A)
* Professional government/institution dashboard
* Responsive design
* Reusable components

---

## Refactor Requirements

### Rename

Rename:

component/

to:

components/

---

### Create folders

Create these folders if they do not exist:

components/
dashboard/
issues/
report/
layout/
common/
hooks/
services/
utils/
config/
agents/

---

### Dashboard Components

Move dashboard UI into reusable components.

Examples:

* StatCard
* PriorityIssueCard
* ResolutionRate
* AreaAssessment
* DashboardCharts

---

### Issue Components

Create reusable components for issues.

Examples:

* IssueCard
* IssueTimeline
* DecayBar
* IssueStatusBadge
* IssueHeader

---

### Report Components

Create reusable report components.

Examples:

* UploadBox
* AIAnalysis
* LocationPicker
* ReportStepper

---

### Layout Components

Move navigation components into:

components/layout/

Examples:

Navbar

Sidebar

Topnav

Footer

---

### Common Components

Create:

Loader

EmptyState

ErrorCard

Modal

ConfirmDialog

---

### Hooks

Create:

useIssues

useGemini

useDashboard

useAuth

---

### Services

Move business logic into services.

Create:

issue.service.ts

gemini.service.ts

authority.service.ts

decay.service.ts

resolution.service.ts

rti.service.ts

---

### Utils

Create:

constants.ts

helpers.ts

date.ts

colors.ts

decayCalculator.ts

---

### Config

Create:

theme.ts

navigation.ts

api.ts

constants.ts

---

### Types

Split types into individual files instead of a single index.

Examples:

issue.ts

user.ts

authority.ts

dashboard.ts

gemini.ts

api.ts

---

## AI Agent Architecture

This is extremely important.

Create a dedicated agents module.

agents/

Inside it create:

vision/

duplicate/

decay/

authority/

resolution/

rti/

Each agent should contain:

index.ts

service.ts

prompt.ts

types.ts

Create:

agents/orchestrator.ts

The orchestrator should coordinate all agents in the following order:

1. Vision Agent
2. Duplicate Detection Agent
3. Decay Scoring Agent
4. Authority Finder Agent
5. Resolution Planning Agent
6. RTI Generator Agent

Each agent should expose a clean interface but contain placeholder implementations for now.

---

## API

Ensure the API routes align with the services and agent architecture.

Use route handlers only for request validation and orchestration.

Business logic belongs inside services or agents.

---

## App Router

Keep App Router clean.

Pages should mostly assemble reusable components.

Avoid large page files.

---

## Code Standards

* Strict TypeScript
* Modular architecture
* Reusable components
* Server/client separation where appropriate
* No duplicated logic
* Proper barrel exports where useful
* Clear folder naming
* Production-quality code
* Placeholder implementations where functionality is not yet built

---

## Deliverables

1. Refactor the project structure.
2. Move files into appropriate folders.
3. Create placeholder files where required.
4. Update imports automatically.
5. Explain every architectural decision after the refactor.
6. Do not delete existing work unless replacing it with a better structure.

Treat this as the foundation for a large-scale production application while keeping it practical for a hackathon.
