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
Grounded
```
