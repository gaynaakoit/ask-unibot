# 🤖 Ask UniBot

> **AI-powered university guidance, knowledge, and participation assistant**

Ask UniBot is an AI-powered assistant designed to help participants navigate university, innovation, and collaborative programs by turning high-volume conversations and information sources into structured, searchable, and actionable knowledge.

The platform helps users quickly understand:

* What happened?
* What did I miss?
* What was decided?
* What do I need to do?
* What are the upcoming deadlines?
* Where does this information come from?

Ask UniBot follows an **evidence-first approach**: it prioritizes trusted and approved sources and avoids inventing program information.

---

# 🎯 Vision

Modern university and innovation programs generate a large amount of information through:

* WhatsApp groups
* meetings
* announcements
* documents
* emails
* shared resources
* project discussions
* deadlines
* decisions
* action items

When information volume increases, participants can easily miss important updates.

Ask UniBot transforms these fragmented conversations and resources into an intelligent knowledge layer that allows participants to retrieve relevant information through natural language.

---

# 🚀 Core Features

## 1. Ask UniBot

Users can ask questions using natural language.

Examples:

```text
What is the next deadline?

What are the next steps in the program?

What was decided during the last meeting?

What documents do I need to prepare?

What are my current action items?
```

Ask UniBot retrieves relevant information from the available knowledge sources and generates contextual answers.

---

## 2. What Did I Miss?

The **What Did I Miss?** feature helps users quickly understand important information they may have missed.

Example:

```text
What did I miss since yesterday?
```

The system can identify:

* new announcements
* decisions
* action items
* deadlines
* important changes
* events
* relevant resources
* information requiring user action

---

## 3. Meeting Memory

Ask UniBot provides structured memory for meetings.

A meeting can be represented as:

```text
Meeting
├── Summary
├── Decisions
├── Action Items
├── Participants
├── Important Information
└── References
```

The goal is to transform conversations into structured, reusable knowledge.

---

## 4. My Actions

Users can access the actions assigned to them.

Example:

```text
My Actions

1. Finalize the prototype
   Deadline: September 25

2. Prepare the presentation
   Deadline: September 28

3. Submit the specification document
   Deadline: September 30
```

---

## 5. Approved Sources

Ask UniBot distinguishes between trusted sources and unverified information.

Potential approved sources include:

* official program documents
* official announcements
* meeting minutes
* validated administrative information
* approved program resources
* administrator-provided information

This approach helps reduce hallucinations and unsupported answers.

---

## 6. Recaps & Reminders

Ask UniBot can generate different types of summaries:

```text
Daily Recap
Weekly Recap
Meeting Recap
Missed Information Recap
Action Recap
```

Reminders can be associated with deadlines and action items.

---

## 7. WhatsApp Simulator

The project includes a WhatsApp-style simulation interface to demonstrate how Ask UniBot can process high-volume group conversations.

Conceptual flow:

```text
WhatsApp Conversation
        ↓
Message Ingestion
        ↓
Information Extraction
        ↓
Knowledge Processing
        ↓
Evidence Retrieval
        ↓
Ask UniBot
```

The simulator is intended for demonstration and prototyping purposes.

---

## 8. Admin Command

Administrative functionality can be used to manage important information within the system.

Administrators may manage:

* approved sources
* official information
* decisions
* events
* knowledge items
* program information

---

## 9. Smart Silence

**Smart Silence** is designed to reduce unnecessary notifications.

The system should notify users when information is relevant to them rather than generating excessive notifications.

Example:

```text
New important deadline
        ↓
Notification

General information without action
        ↓
No notification

New action assigned to the user
        ↓
Notification
```

---

# 🧠 Evidence-First Architecture

Ask UniBot follows a simple principle:

> **Never invent program information.**

When trusted evidence exists, it should be prioritized.

The system should distinguish between:

```text
Verified / Available Information
        ↓
Grounded Answer
```

and:

```text
Information Not Available
        ↓
Clearly state that the information is unavailable
```

The AI model should not be treated as the sole source of truth.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │        User         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Ask UniBot UI    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Application Backend │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
           ┌────────────┐   ┌────────────┐   ┌──────────────┐
           │   Gemini   │   │  Supabase  │   │  Knowledge   │
           │     AI     │   │            │   │   Sources    │
           └────────────┘   └────────────┘   └──────────────┘
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Evidence / Decision │
                         │      Services       │
                         └─────────────────────┘
```

---

# ☁️ Infrastructure

## Google Cloud Run

Ask UniBot is designed to run on Google Cloud Run.

Current service:

```text
Service:
ask-unibot

Current Region:
europe-west3
```

The service can be redeployed to a Cloud Run region that supports the required custom-domain architecture.

---

# 🗄️ Supabase

Ask UniBot uses Supabase as its backend and data platform.

### Supabase Project

```text
https://zggrtpjnvxvxeuybejzy.supabase.co
```

Supabase can provide:

* PostgreSQL database
* Authentication
* Storage
* Knowledge management
* User data
* Actions
* Meetings
* Sources
* Documents
* Metadata
* Semantic/vector search where required

### Supabase URL

```env
VITE_SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
```

---

# 🔐 Environment Variables

Create the required environment variables in your local development environment and deployment platform.

Example:

```env
VITE_SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key

KNOWLEDGE_SOURCE=supabase
```

The exact variables depend on the application implementation.

## Security

Never commit secrets to Git.

Never commit:

```text
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
Passwords
Access tokens
Private credentials
```

Use:

* `.env`
* Google Cloud Secret Manager
* Cloud Run environment variables
* secure CI/CD secrets

for sensitive configuration.

---

# 🧩 Technology Stack

## Frontend

```text
React
Vite
TypeScript
Tailwind CSS
```

## Backend

```text
Node.js
TypeScript
```

The backend is organized around dedicated services such as:

```text
Gemini Service
Evidence Service
Decision Service
Knowledge Service
Supabase Service
```

## AI

Google Gemini is used for AI capabilities including:

```text
Natural Language Understanding
Question Answering
Summarization
Meeting Summaries
Information Extraction
Action Extraction
Contextual Responses
```

---

# 📁 Project Structure

Recommended structure:

```text
ask-unibot/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
│
├── server/
│   ├── services/
│   │   ├── geminiService.ts
│   │   ├── evidenceService.ts
│   │   ├── decisionService.ts
│   │   └── knowledgeService.ts
│   │
│   └── server.ts
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── ...
```

The exact structure may evolve as the application develops.

---

# 🔄 Question Processing Flow

When a user asks a question:

```text
User
 │
 ▼
Ask UniBot
 │
 ▼
Question Analysis
 │
 ▼
Knowledge Retrieval
 │
 ▼
Evidence Collection
 │
 ▼
Evidence Validation
 │
 ▼
Context / Decision Processing
 │
 ▼
Gemini
 │
 ▼
Grounded Response
 │
 ▼
User
```

The system should prioritize available and validated information instead of generating unsupported information.

---

# 📚 Knowledge Management

Knowledge can be organized into several categories:

```text
Knowledge
│
├── Program Information
├── Announcements
├── Meetings
├── Decisions
├── Actions
├── Deadlines
├── Documents
├── Resources
└── FAQs
```

Important knowledge items should ideally contain metadata such as:

```text
source
timestamp
author
category
validation status
reference
```

---

# 🗃️ Data Model

A possible Supabase data model includes:

```text
users
profiles
sources
documents
knowledge_items
messages
meetings
meeting_notes
decisions
actions
deadlines
notifications
approved_sources
```

Conceptual relationships:

```text
users
  │
  ├── actions
  ├── notifications
  └── meetings

meetings
  │
  ├── meeting_notes
  ├── decisions
  └── actions

sources
  │
  └── knowledge_items
```

The schema may evolve according to product requirements.

---

# 🧪 Demo Mode

Ask UniBot can operate with demonstration data to showcase its main features without requiring a complete production WhatsApp integration.

Example demo context:

```text
Awa Diop
AI Track
UniPods AI Innovation Programme 2026
```

Demo data can include:

* simulated messages
* meetings
* decisions
* action items
* deadlines
* approved sources

Demo data should always be clearly identified as demonstration content.

---

# 💬 WhatsApp Integration

A future WhatsApp integration can connect conversations directly to Ask UniBot.

Proposed architecture:

```text
WhatsApp
    │
    ▼
WhatsApp API / Provider
    │
    ▼
Webhook
    │
    ▼
Ask UniBot Backend
    │
    ▼
Message Processing
    │
    ▼
Knowledge Base
```

The system can then extract:

* summaries
* decisions
* action items
* deadlines
* relevant information

---

# 🔎 Retrieval-Augmented Generation

Ask UniBot can use a Retrieval-Augmented Generation architecture.

```text
Documents / Messages
        │
        ▼
Knowledge Processing
        │
        ▼
Embeddings / Index
        │
        ▼
Semantic Search
        │
        ▼
Relevant Evidence
        │
        ▼
Gemini
        │
        ▼
Grounded Answer
```

The objective is to provide answers grounded in available evidence.

---

# 🛡️ Security

Ask UniBot may process private program information and user data.

The following principles should be followed.

## Secrets

Never commit:

```text
API keys
Service role keys
Passwords
Access tokens
Private credentials
```

## Supabase

Row Level Security (RLS) should be enabled for tables containing private or user-specific data.

## Backend

Privileged operations must remain server-side.

The Supabase Service Role key must never be exposed in frontend code.

## Logging

Avoid logging:

```text
passwords
API keys
access tokens
private user information
sensitive credentials
```

---

# 🚀 Local Development

## 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd ask-unibot
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create:

```text
.env
```

from:

```text
.env.example
```

Example:

```env
VITE_SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
VITE_SUPABASE_ANON_KEY=your_key

SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
SUPABASE_ANON_KEY=your_key

GEMINI_API_KEY=your_key

KNOWLEDGE_SOURCE=supabase
```

## 4. Start the development server

```bash
npm run dev
```

---

# 🏗️ Production Build

Build the application:

```bash
npm run build
```

For Vite-based applications, the production output is typically generated in:

```text
dist/
```

---

# ☁️ Cloud Run Deployment

Ask UniBot is designed to run on Google Cloud Run.

Example:

```bash
gcloud run deploy ask-unibot \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated
```

The deployment region should be selected according to the application's infrastructure and custom-domain requirements.

---

# 🌐 Custom Domain

The intended public domain for Ask UniBot is:

```text
https://ask.gaynaakoit.com
```

Two deployment architectures can be used.

## Option 1 — Cloud Run Domain Mapping

```text
ask.gaynaakoit.com
        │
        ▼
Cloud Run Domain Mapping
        │
        ▼
ask-unibot
```

This requires the Cloud Run service to be deployed in a supported region.

## Option 2 — Global External Application Load Balancer

```text
ask.gaynaakoit.com
        │
        ▼
Global External Application Load Balancer
        │
        ▼
Serverless NEG
        │
        ▼
Cloud Run
```

This architecture allows the application to remain in a region where native Cloud Run Domain Mapping is unavailable.

---

# 🔐 HTTPS / TLS

The production application should be accessible through HTTPS:

```text
https://ask.gaynaakoit.com
```

TLS certificates can be managed by Google Cloud.

The certificate must be fully provisioned before considering the custom domain production-ready.

---

# 📊 Observability

The following components should be monitored:

```text
Cloud Run logs
Cloud Run revisions
HTTP errors
Request latency
Gemini API errors
Supabase errors
Authentication errors
Database errors
```

When an error occurs, identify the responsible layer:

```text
User
 ↓
Frontend
 ↓
Backend
 ↓
Gemini / Supabase
```

---

# 🧪 Testing Checklist

## Frontend

```text
[ ] Application loads
[ ] Navigation works
[ ] Responsive layout
[ ] Authentication works
```

## Ask UniBot

```text
[ ] Basic question
[ ] Evidence-based question
[ ] Missing information handling
[ ] Summary generation
[ ] What Did I Miss
[ ] Meeting Memory
[ ] My Actions
[ ] Approved Sources
```

## Backend

```text
[ ] API available
[ ] Gemini available
[ ] Supabase available
[ ] Error handling
```

## Security

```text
[ ] RLS enabled
[ ] Secrets are not exposed
[ ] Service Role key remains server-side
[ ] Logs do not contain sensitive data
```

## Production

```text
[ ] Cloud Run deployment
[ ] HTTPS
[ ] Custom domain
[ ] DNS
[ ] TLS certificate
[ ] Monitoring
```

---

# 🧭 Roadmap

## Phase 1 — Prototype

```text
[x] Ask UniBot interface
[x] Natural language questions
[x] Knowledge source
[x] Supabase integration
[x] Gemini integration
[x] Meeting Memory
[x] My Actions
[x] What Did I Miss
[x] Approved Sources
[x] WhatsApp Simulator
```

## Phase 2 — Intelligence

```text
[ ] Improved RAG
[ ] Semantic search
[ ] Evidence ranking
[ ] Automatic action extraction
[ ] Automatic decision extraction
[ ] Improved summaries
[ ] Personalized notifications
```

## Phase 3 — Integrations

```text
[ ] WhatsApp integration
[ ] Email ingestion
[ ] Calendar integration
[ ] Document ingestion
[ ] Additional knowledge sources
```

## Phase 4 — Production

```text
[ ] Production authentication
[ ] Role management
[ ] Admin dashboard
[ ] Monitoring
[ ] Security audit
[ ] Performance optimization
[ ] Production domain
```

---

# 🧑‍💻 Development Principles

## Evidence First

Answers should be based on available and verifiable information whenever possible.

## No Hallucination

When information is unavailable, the system should clearly state that it does not have sufficient information rather than inventing an answer.

## Separation of Concerns

The application should maintain clear boundaries between:

```text
UI
 ↓
Services
 ↓
Backend
 ↓
Knowledge
 ↓
AI
```

## Security by Design

Sensitive operations and credentials must remain server-side.

## Human Control

AI should assist users with information and organization while keeping users in control of decisions and actions.

---

# 📦 Environment Example

Create a `.env.example` file containing placeholders only:

```env
VITE_SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
VITE_SUPABASE_ANON_KEY=

SUPABASE_URL=https://zggrtpjnvxvxeuybejzy.supabase.co
SUPABASE_ANON_KEY=

GEMINI_API_KEY=

KNOWLEDGE_SOURCE=supabase
```

Never commit the actual `.env` file.

Add it to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

---

# 🏢 Organization

## GAYNAAKO IT

Ask UniBot is developed by **GAYNAAKO IT**.

Website:

```text
https://gaynaakoit.com
```

Product:

```text
https://ask.gaynaakoit.com
```

Supabase project:

```text
https://zggrtpjnvxvxeuybejzy.supabase.co
```

---

# 📌 Project Information

| Property         | Value                     |
| ---------------- | ------------------------- |
| Project          | Ask UniBot                |
| Organization     | GAYNAAKO IT               |
| Frontend         | React / Vite / TypeScript |
| Backend          | Node.js / TypeScript      |
| AI               | Google Gemini             |
| Database         | Supabase / PostgreSQL     |
| Cloud Platform   | Google Cloud              |
| Runtime          | Cloud Run                 |
| Current Service  | `ask-unibot`              |
| Current Region   | `europe-west3`            |
| Target Region    | `europe-west1`            |
| Public Domain    | `ask.gaynaakoit.com`      |
| Supabase Project | `zggrtpjnvxvxeuybejzy`    |
| Architecture     | Evidence-first / RAG      |
| Status           | Prototype / Development   |

---

# ⚠️ Security Notice

The following values must **never** be committed to the repository:

```text
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
Database passwords
Access tokens
Private credentials
```

Use environment variables, Google Cloud Secret Manager, or secure deployment configuration for sensitive values.

---

# 📄 License

Developed by **GAYNAAKO IT**.

```text
© 2026 GAYNAAKO IT
All rights reserved.
```

Licensing and distribution terms may be defined separately for future releases.

---

# 🤖 Ask UniBot

> **Turning conversations into trusted knowledge and actionable guidance.**
