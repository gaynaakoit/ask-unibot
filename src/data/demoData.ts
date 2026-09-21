/**
 * Demo Data for Ask UniBot — METI UniPods AI Innovation Programme
 * Realistic mock data set around September 2026.
 */

import {
  Source,
  Meeting,
  ActionItem,
  Announcement,
  RecurringQuestion,
  ConfusionAlert,
  HumanHandoverTicket,
  Poll,
  EventReminder,
  Recap,
  ParticipantProfile,
  UserProfile,
  DecisionTimelineItem,
} from '../types';

export const DEMO_PARTICIPANT: ParticipantProfile = {
  name: 'Awa Diop',
  cohort: 'UniPods AI Cohort 2026',
  role: 'Participant / AI Solutions Track',
  learningTrack: 'Computer Vision & Natural Language for Agriculture',
  interests: ['Local Crop Disease Detection', 'Low-bandwidth RAG', 'Voice AI in Wolof & French'],
  reminderPreferences: {
    dailyRecap: true,
    weeklyRecap: true,
    eventReminders: true,
  },
};

export const INITIAL_SOURCES: Source[] = [
  {
    id: 'src-1',
    title: 'UniPods Official Announcement #12: Milestone 2 & Live Session',
    type: 'organiser_update',
    content:
      'The next UniPods AI Innovation live session will take place on Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams. Agenda includes practical evaluation of Milestone 2 prototypes and MIT mentor Q&A. Attendance is mandatory for lead technical representatives.',
    date: '21 Sep 2026',
    author: 'Dr. Aminata Touré (UniPods Lead Facilitator)',
    status: 'current',
    approved: true,
    tags: ['schedule', 'session', 'milestone', 'mandatory'],
    url: 'https://unipods.meti.org/announcements/12',
    authorityNote: 'Official Programme Organiser Notice (Highest Authority)',
    isDemo: true,
  },
  {
    id: 'src-2',
    title: 'Organiser Clarification: Prototype Submission Extension',
    type: 'organiser_update',
    content:
      'Following mentor feedback from MIT and Wadhwani faculty, the prototype concept submission deadline has been extended from 27 September to Tuesday, 29 September 2026 at 23:59 WAT. Teams must upload their GitHub repo and demo video link to the UniPods portal.',
    date: '21 Sep 2026',
    author: 'Eng. Kwame Mensah (UniPods Academic Director)',
    status: 'current',
    approved: true,
    supersedes: 'src-4',
    tags: ['prototype', 'deadline', 'extension', 'milestone'],
    url: 'https://unipods.meti.org/updates/deadline-ext',
    authorityNote: 'Approved Organiser Notice supersedes earlier 18 Sep deadline',
    isDemo: true,
  },
  {
    id: 'src-3',
    title: 'MIT Learn Module 4 Curriculum Notice',
    type: 'mit_learn',
    content:
      'Module 4: "Context-Aware Retrieval and Multilingual Voice AI" is now active. All participants are required to complete the interactive lab and submission quiz before Thursday, 24 September 2026 at 18:00 WAT. Late submissions will affect milestone scoring.',
    date: '20 Sep 2026',
    author: 'Prof. John Tsitsiklis / MIT Learn Team',
    status: 'current',
    approved: true,
    tags: ['mit_learn', 'curriculum', 'deadline', 'rag'],
    url: 'https://learn.mit.edu/courses/unipods-ai-2026/m4',
    authorityNote: 'MIT Academic Coursework Registry',
    isDemo: true,
  },
  {
    id: 'src-4',
    title: 'Earlier Programme Briefing: Preliminary Prototype Due Date',
    type: 'verified_programme_material',
    content:
      'Preliminary prototype submission date initially scheduled for 27 September 2026 at 17:00 WAT. (NOTE: This has been superseded by Organiser Clarification on 21 Sep moving deadline to 29 Sep).',
    date: '18 Sep 2026',
    author: 'UniPods Programme Coordination Desk',
    status: 'superseded',
    approved: true,
    supersededBy: 'src-2',
    tags: ['prototype', 'deadline', 'superseded'],
    url: 'https://unipods.meti.org/briefings/sep18',
    authorityNote: 'Superseded on 21 Sep 2026 by Dr. Aminata & Eng. Kwame update',
    isDemo: true,
  },
  {
    id: 'src-5',
    title: 'UniPods AI Innovation Session — Meeting Notes (21 Sep)',
    type: 'meeting_note',
    content:
      'Meeting held on 21 September 2026 at 10:00 WAT. Decisions confirmed: 1) Teams must form groups of 3-5 with at least one software lead; 2) Cloud compute credits ($250 Google Cloud & Vertex AI) will be distributed via email; 3) Prototype rubric weights technical soundness (40%), local impact in Africa (35%), and user testing (25%).',
    date: '21 Sep 2026',
    author: 'Secretariat Rapporteur (UniPods Dakar)',
    status: 'current',
    approved: true,
    tags: ['meeting', 'decisions', 'rubric', 'credits'],
    authorityNote: 'Verified Minutes Signed by Rapporteur',
    isDemo: true,
  },
  {
    id: 'src-6',
    title: 'Wadhwani Foundation Venture Framework & Pitch Rubric',
    type: 'wadhwani',
    content:
      'Wadhwani Foundation customer validation criteria: Teams must interview at least 5 target end-users (e.g. smallholder farmers, local clinic administrators) and include recorded insights or quotes in their concept deck. Template available in the UniPods Drive.',
    date: '19 Sep 2026',
    author: 'Wadhwani Entrepreneurship Initiative',
    status: 'current',
    approved: true,
    tags: ['wadhwani', 'market_validation', 'interviews'],
    url: 'https://wadhwanifoundation.org/ventures/unipods-toolkit',
    authorityNote: 'Partner Curriculum Accreditation',
    isDemo: true,
  },
  {
    id: 'src-7',
    title: 'UniPods Live Virtual Room Link (Updated)',
    type: 'official_whatsapp',
    content:
      'Official Meeting Room: All upcoming live sessions will be hosted on Microsoft Teams at https://teams.microsoft.com/l/meetup-join/unipods-2026-room1. The previous Zoom link from 15 Sep is permanently decommissioned due to capacity limits.',
    date: '21 Sep 2026',
    author: 'UniPods IT & Infrastructure',
    status: 'current',
    approved: true,
    tags: ['link', 'teams', 'virtual_room'],
    url: 'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1',
    authorityNote: 'Official IT Infrastructure Broadcast',
    isDemo: true,
  },
  {
    id: 'src-8',
    title: 'Decommissioned Zoom Room (Old)',
    type: 'official_whatsapp',
    content:
      'Meeting room zoom link: https://zoom.us/j/981273910. DO NOT USE. Replaced by Teams room.',
    date: '15 Sep 2026',
    author: 'UniPods IT',
    status: 'superseded',
    approved: true,
    supersededBy: 'src-7',
    tags: ['link', 'zoom', 'superseded'],
    authorityNote: 'Superseded on 21 Sep 2026',
    isDemo: true,
  },
  {
    id: 'src-9',
    title: 'METI Innovation Grant Disbursement Policy',
    type: 'verified_programme_material',
    content:
      'Programme participants are eligible for prototyping reimbursement grants up to $1,500 per team upon successful Milestone 3 verification. Note: There is NO cash prize of $50,000; rumours of direct individual cash awards are false.',
    date: '17 Sep 2026',
    author: 'Ministry of Economy, Telecommunications & Innovation (METI)',
    status: 'current',
    approved: true,
    tags: ['grants', 'budget', 'reimbursement', 'clarification'],
    authorityNote: 'METI Official Policy Statement',
    isDemo: true,
  },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    title: 'UniPods AI Innovation Session — Milestone 2 Briefing',
    date: '21 September 2026',
    time: '10:00 WAT',
    status: 'completed',
    whatWasDiscussed: [
      'Overview of prototype submission expectations and evaluation rubric.',
      'Clarification on cloud compute grant distribution ($250 per team).',
      'Integration of MIT Learn Module 4 context-retrieval techniques.',
      'Community question on submission deadline extension.',
    ],
    decisions: [
      {
        id: 'dec-1',
        title: 'Prototype concept submission deadline extended to 29 September at 23:59 WAT.',
        date: '21 Sep 2026',
        supersedesPrevious: true,
        supersedesNote: 'Supersedes previous 27 Sep deadline announcement.',
        impact: 'Gives teams 48 additional hours for testing and mentor review.',
      },
      {
        id: 'dec-2',
        title: 'Team roster lock: Teams must maintain 3-5 participants with one designated tech lead.',
        date: '21 Sep 2026',
        impact: 'Ensures accountability for project repository and deliverables.',
      },
      {
        id: 'dec-3',
        title: 'Virtual room standardized on MS Teams; Zoom room decommissioned.',
        date: '21 Sep 2026',
        supersedesPrevious: true,
        supersedesNote: 'Supersedes Zoom link distributed on 15 September.',
        impact: 'Accommodates up to 500 participants without disconnection limits.',
      },
    ],
    actionItems: [
      {
        title: 'Submit updated team concept title and GitHub link',
        assignee: 'Team Technical Leads',
        deadline: '24 Sep 2026, 18:00 WAT',
      },
      {
        title: 'Complete MIT Learn Module 4 coursework',
        assignee: 'All Participants',
        deadline: '24 Sep 2026, 18:00 WAT',
      },
      {
        title: 'Review customer validation interviews with Wadhwani mentors',
        assignee: 'Product / Venture Leads',
        deadline: '26 Sep 2026, 15:00 WAT',
      },
    ],
    resources: [
      {
        title: 'Milestone 2 Evaluation Deck & Rubric',
        url: 'https://unipods.meti.org/slides/milestone2-deck.pdf',
        type: 'slides',
      },
      {
        title: 'Session Recording (21 Sep)',
        url: 'https://unipods.meti.org/recordings/session-21sep',
        type: 'recording',
      },
      {
        title: 'Prototype Concept Template (Markdown & PPT)',
        url: 'https://unipods.meti.org/templates/prototype-concept',
        type: 'template',
      },
    ],
    nextSession: 'Tuesday, 22 September 2026 at 10:00 WAT (Mentorship breakout)',
    sourceId: 'src-5',
    sourceTitle: 'UniPods AI Innovation Session — Meeting Notes (21 Sep)',
  },
  {
    id: 'meet-2',
    title: 'MIT Learn Deep Dive: Embeddings & Context Retrieval',
    date: '19 September 2026',
    time: '14:00 WAT',
    status: 'completed',
    whatWasDiscussed: [
      'Technical architecture of Retrieval Augmented Generation (RAG).',
      'Optimizing vector index size for constrained local device environments.',
      'Handling multilingual prompts (French, Wolof, Yoruba) in African agricultural datasets.',
    ],
    decisions: [
      {
        id: 'dec-4',
        title: 'All teams must demonstrate source ground-truth provenance in their AI workflows.',
        date: '19 Sep 2026',
        impact: 'Hallucinated outputs in submitted prototypes will incur severe penalties.',
      },
    ],
    actionItems: [
      {
        title: 'Run sample vector retrieval notebook on Google Colab',
        assignee: 'Technical Participants',
        deadline: '22 Sep 2026',
      },
    ],
    resources: [
      {
        title: 'MIT RAG Architecture Whitepaper',
        url: 'https://learn.mit.edu/docs/rag-whitepaper.pdf',
        type: 'doc',
      },
    ],
    nextSession: 'Completed',
    sourceId: 'src-3',
    sourceTitle: 'MIT Learn Module 4 Curriculum Notice',
  },
  {
    id: 'meet-3',
    title: 'Wadhwani Market Validation Workshop',
    date: '16 September 2026',
    time: '11:00 WAT',
    status: 'completed',
    whatWasDiscussed: [
      'Customer discovery methods for emerging African markets.',
      'Translating technical AI capabilities into clear value propositions for local cooperatives.',
    ],
    decisions: [
      {
        id: 'dec-5',
        title: 'Minimum 5 customer validation interviews required for venture track eligibility.',
        date: '16 Sep 2026',
        impact: 'Mandatory attachment in Milestone 2 concept deck.',
      },
    ],
    actionItems: [
      {
        title: 'Conduct user interviews with agricultural cooperatives',
        assignee: 'All Venture Teams',
        deadline: '25 Sep 2026',
      },
    ],
    resources: [
      {
        title: 'Customer Interview Questionnaire Template',
        url: 'https://wadhwanifoundation.org/templates/interview-guide',
        type: 'template',
      },
    ],
    nextSession: 'Completed',
    sourceId: 'src-6',
    sourceTitle: 'Wadhwani Foundation Venture Framework & Pitch Rubric',
  },
];

export const INITIAL_TIMELINE: DecisionTimelineItem[] = [
  {
    id: 'time-1',
    date: '18 Sep 2026',
    type: 'official_update',
    title: 'Initial Milestone 2 Notice',
    description: 'Preliminary deadline set for 27 September 2026 by Programme Desk.',
  },
  {
    id: 'time-2',
    date: '19 Sep 2026',
    type: 'meeting',
    title: 'MIT RAG Technical Workshop',
    description: 'Ground-truth evidence requirement adopted into prototype rubric.',
  },
  {
    id: 'time-3',
    date: '21 Sep 2026 10:00 WAT',
    type: 'meeting',
    title: 'UniPods AI Innovation Session',
    description: 'Full cohort sync reviewed prototype challenges and mentor schedules.',
  },
  {
    id: 'time-4',
    date: '21 Sep 2026 11:30 WAT',
    type: 'decision_confirmed',
    title: 'Deadline Extension Confirmed',
    description: 'Organiser official announcement moves deadline to 29 Sep at 23:59 WAT.',
    supersedesNote: 'Supersedes earlier 27 Sep date from 18 Sep notice.',
  },
  {
    id: 'time-5',
    date: '22 Sep 2026',
    type: 'participant_action',
    title: 'Participant Live Mentorship Session',
    description: 'Interactive breakout session with MIT mentors on MS Teams at 10:00 WAT.',
  },
  {
    id: 'time-6',
    date: '24 Sep 2026',
    type: 'participant_action',
    title: 'MIT Learn Module 4 Coursework Deadline',
    description: 'All participants must submit interactive quiz and RAG notebook.',
  },
];

export const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'act-1',
    title: 'Complete MIT Learn Module 4 (Context-Aware Retrieval)',
    dueDate: '24 Sep 2026',
    status: 'pending',
    sourceTitle: 'MIT Learn Module 4 Curriculum Notice',
    sourceId: 'src-3',
    resourceLink: 'https://learn.mit.edu/courses/unipods-ai-2026/m4',
    resourceName: 'Open MIT Learn Module',
    priority: 'high',
    notes: 'Requires completing lab notebook and 10-question evaluation.',
  },
  {
    id: 'act-2',
    title: 'Submit prototype concept deck & GitHub repo',
    dueDate: '29 Sep 2026',
    status: 'in_progress',
    sourceTitle: 'Organiser Clarification: Prototype Submission Extension',
    sourceId: 'src-2',
    resourceLink: 'https://unipods.meti.org/portal/submissions',
    resourceName: 'UniPods Submission Portal',
    priority: 'high',
    notes: 'Deadline extended to 29 Sep 23:59 WAT. Need 5 customer interview summaries.',
  },
  {
    id: 'act-3',
    title: 'Attend UniPods AI Innovation Session (Live Mentorship)',
    dueDate: '22 Sep 2026',
    status: 'pending',
    sourceTitle: 'UniPods Official Announcement #12',
    sourceId: 'src-1',
    resourceLink: 'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1',
    resourceName: 'Join MS Teams Room',
    priority: 'high',
    notes: 'Starts at 10:00 WAT. Mentor breakouts for Agriculture Track.',
  },
  {
    id: 'act-4',
    title: 'Conduct 5 farmer interviews for Wadhwani validation',
    dueDate: '26 Sep 2026',
    status: 'in_progress',
    sourceTitle: 'Wadhwani Foundation Venture Framework',
    sourceId: 'src-6',
    resourceLink: 'https://wadhwanifoundation.org/templates/interview-guide',
    resourceName: 'Download Interview Guide',
    priority: 'normal',
    notes: '3 of 5 interviews completed with Thiès Peanut Cooperative.',
  },
  {
    id: 'act-5',
    title: 'Setup team GitHub repository with Apache 2.0 license',
    dueDate: '20 Sep 2026',
    status: 'completed',
    sourceTitle: 'UniPods Innovation Session (21 Sep)',
    sourceId: 'src-5',
    resourceLink: 'https://github.com/awadiop/agro-rag-unipods',
    resourceName: 'View Team GitHub Repo',
    priority: 'normal',
    notes: 'Repository initialized with MIT/UniPods template.',
  },
  {
    id: 'act-6',
    title: 'Claim $250 Google Cloud & Vertex AI credits voucher',
    dueDate: '23 Sep 2026',
    status: 'pending',
    sourceTitle: 'UniPods Official Announcement #12',
    sourceId: 'src-1',
    resourceLink: 'https://unipods.meti.org/cloud-voucher',
    resourceName: 'Redeem Voucher Code',
    priority: 'normal',
    notes: 'Check registered email for redemption token.',
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Next Live Session: Tuesday 22 Sep at 10:00 WAT',
    date: '21 Sep 2026',
    summary: 'Join the mandatory session on MS Teams with MIT mentors for Milestone 2 feedback.',
    content:
      'All team leads and technical members must attend tomorrow’s interactive session at 10:00 WAT. We will conduct deep-dive reviews of initial prototypes and answer RAG architecture questions.',
    priority: 'high',
    sourceTitle: 'UniPods Official Announcement #12',
    sourceId: 'src-1',
    requiredAction: 'Mark calendar and join MS Teams room at 09:55 WAT',
    deadline: '22 Sep 2026, 10:00 WAT',
    category: 'schedule',
  },
  {
    id: 'ann-2',
    title: 'Prototype Concept Deadline Extended to 29 Sep',
    date: '21 Sep 2026',
    summary: 'Organisers granted a 48-hour extension following mentor sync.',
    content:
      'To allow thorough customer validation and integration of Module 4 learnings, teams now have until Tuesday, 29 September 2026 at 23:59 WAT to submit their concept decks.',
    priority: 'high',
    sourceTitle: 'Organiser Clarification: Prototype Submission Extension',
    sourceId: 'src-2',
    requiredAction: 'Finalize concept deck with customer interview recordings',
    deadline: '29 Sep 2026, 23:59 WAT',
    category: 'hackathon',
  },
  {
    id: 'ann-3',
    title: 'MIT Learn Module 4 Coursework Active',
    date: '20 Sep 2026',
    summary: 'Lab notebook on multilingual RAG due Thursday 24 Sep at 18:00 WAT.',
    content:
      'Module 4 covers context grounding, embeddings, and hallucination prevention. Ensure your Colab exercises are submitted on time.',
    priority: 'normal',
    sourceTitle: 'MIT Learn Module 4 Curriculum Notice',
    sourceId: 'src-3',
    requiredAction: 'Complete Module 4 interactive notebook',
    deadline: '24 Sep 2026, 18:00 WAT',
    category: 'curriculum',
  },
  {
    id: 'ann-4',
    title: 'Important: Zoom Room Retired — Use MS Teams Link',
    date: '21 Sep 2026',
    summary: 'Previous Zoom links are obsolete. Use the official Teams room.',
    content:
      'Due to participant capacity, the Zoom room has been permanently decommissioned. Bookmark the MS Teams link in the Sources directory.',
    priority: 'high',
    sourceTitle: 'UniPods Live Virtual Room Link (Updated)',
    sourceId: 'src-7',
    category: 'logistics',
  },
  {
    id: 'ann-5',
    title: 'Google Cloud & Vertex AI Credits Available',
    date: '21 Sep 2026',
    summary: '$250 vouchers dispatched to registered team email inboxes.',
    content:
      'Check your inbox for your unique redemption voucher code. Contact admin if not received by 22 Sep 12:00 WAT.',
    priority: 'normal',
    sourceTitle: 'UniPods Meeting Notes (21 Sep)',
    sourceId: 'src-5',
    category: 'logistics',
  },
];

export const INITIAL_RECURRING_QUESTIONS: RecurringQuestion[] = [
  {
    id: 'rq-1',
    question: 'When is the next live session and where is the link?',
    frequency: 24,
    lastAsked: '12 mins ago',
    status: 'answered',
    suggestedClarification: 'Tuesday, 22 September 2026 at 10:00 WAT on MS Teams (Source: Announcement #12).',
    officialAnswer:
      'The next live session is on Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams (https://teams.microsoft.com/l/meetup-join/unipods-2026-room1).',
  },
  {
    id: 'rq-2',
    question: 'What is the official deadline for the prototype concept submission?',
    frequency: 19,
    lastAsked: '25 mins ago',
    status: 'conflicting',
    suggestedClarification:
      'Initially 27 Sep, but officially extended to Tuesday, 29 September 2026 at 23:59 WAT per Eng. Kwame announcement on 21 Sep.',
    officialAnswer:
      'The official deadline is Tuesday, 29 September 2026 at 23:59 WAT. This supersedes the earlier 27 September date.',
  },
  {
    id: 'rq-3',
    question: 'Where do I find the MIT Learn Module 4 coursework and deadline?',
    frequency: 15,
    lastAsked: '1 hour ago',
    status: 'answered',
    suggestedClarification: 'Module 4 is hosted on learn.mit.edu and is due Thursday, 24 September 2026 at 18:00 WAT.',
    officialAnswer:
      'Module 4 is available on MIT Learn. Deadline for interactive notebook submission is 24 September at 18:00 WAT.',
  },
  {
    id: 'rq-4',
    question: 'Is there an individual cash prize of $50,000 for winning teams?',
    frequency: 9,
    lastAsked: '2 hours ago',
    status: 'answered',
    suggestedClarification:
      'No. Rumours of $50,000 cash prizes are false. Teams are eligible for prototyping grants up to $1,500 under METI policy.',
    officialAnswer:
      'No cash prize of $50,000 exists. Approved teams receive up to $1,500 in milestone prototyping reimbursements from METI.',
  },
  {
    id: 'rq-5',
    question: 'How do we request human organiser assistance or escalation?',
    frequency: 8,
    lastAsked: '3 hours ago',
    status: 'answered',
    suggestedClarification: 'Use Ask UniBot "Human Handover" button or contact secretariat@unipods.meti.org.',
    officialAnswer:
      'You can click the Human Handover button in any uncertain UniBot response to route your query directly to Dr. Touré or Eng. Mensah.',
  },
];

export const INITIAL_CONFUSION_ALERT: ConfusionAlert = {
  id: 'conf-1',
  topic: 'Prototype submission deadline (27 Sep vs 29 Sep)',
  participantCount: 19,
  reason:
    'Two conflicting dates appear in recent programme messages. The 18 Sep briefing stated 27 Sep, while the 21 Sep announcement extended it to 29 Sep.',
  sources: [
    INITIAL_SOURCES.find((s) => s.id === 'src-4')!, // 18 Sep
    INITIAL_SOURCES.find((s) => s.id === 'src-2')!, // 21 Sep
  ],
  status: 'needs_admin_confirmation',
  resolutionNote:
    'Eng. Kwame Mensah approved the 29 Sep extension on 21 Sep to allow MIT mentor feedback integration.',
};

export const INITIAL_HANDOVER_TICKETS: HumanHandoverTicket[] = [
  {
    id: 'tkt-1',
    question: 'Can teams in the Agriculture track use proprietary hardware sensors instead of mobile phone cameras?',
    sourcesChecked: ['UniPods Announcement #12', 'MIT Learn Module 4', 'Wadhwani Toolkit'],
    conflictOrMissing:
      'No official hardware policy document found regarding proprietary sensor reimbursement limits.',
    participantContext: 'Awa Diop (Team AgroVision Senegal, UniPods AI Cohort 2026)',
    recommendedAdmin: 'Dr. Aminata Touré (Lead Facilitator)',
    status: 'open',
    timestamp: '21 Sep 2026, 09:40 WAT',
  },
  {
    id: 'tkt-2',
    question: 'Is it possible to request an extension for the MIT Learn quiz if internet in Bamako is disrupted?',
    sourcesChecked: ['MIT Learn Module 4 Notice'],
    conflictOrMissing: 'Standard policy specifies strict 24 Sep deadline; regional exceptions require admin waiver.',
    participantContext: 'Moussa Traoré (Mali Cohort, Energy Track)',
    recommendedAdmin: 'Eng. Kwame Mensah (Academic Director)',
    status: 'open',
    timestamp: '21 Sep 2026, 08:15 WAT',
  },
];

export const INITIAL_POLL: Poll = {
  id: 'poll-1',
  question: 'Will you attend tomorrow’s UniPods AI Innovation Session at 10:00 WAT?',
  options: [
    { id: 'opt-yes', text: 'Yes, definitely attending', votes: 34 },
    { id: 'opt-no', text: 'No, unable to attend', votes: 3 },
    { id: 'opt-maybe', text: 'Not sure / Pending schedule check', votes: 5 },
  ],
  totalResponses: 42,
  totalParticipants: 62,
  closesAt: '22 Sep 2026, 09:00 WAT',
};

export const INITIAL_EVENT_REMINDERS: EventReminder[] = [
  {
    id: 'rem-1',
    eventTitle: 'UniPods AI Innovation Session — Milestone 2 Mentorship',
    eventDate: '22 Sep 2026',
    timeWAT: '10:00 WAT',
    purpose: 'Live prototype evaluation and direct breakout coaching with MIT and Wadhwani faculty.',
    audience: 'All UniPods 2026 Cohort Participants & Technical Leads',
    linkVenue: 'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1 (MS Teams)',
    preparation: 'Have your GitHub repo link, Colab notebook, and 2-minute demo clip ready.',
    schedule: [
      {
        label: '7 days before',
        daysBefore: 7,
        dateStr: '15 Sep 2026',
        timeWAT: '10:00 WAT',
        status: 'sent',
        message: 'Reminder: Live AI Innovation session scheduled for 22 Sep. Mark your calendars.',
      },
      {
        label: '3 days before',
        daysBefore: 3,
        dateStr: '19 Sep 2026',
        timeWAT: '10:00 WAT',
        status: 'sent',
        message: 'Reminder: 3 days until live mentorship session. Review Module 4 prerequisites.',
      },
      {
        label: '1 day before',
        daysBefore: 1,
        dateStr: '21 Sep 2026',
        timeWAT: '16:00 WAT',
        status: 'sent',
        message: 'Tomorrow at 10:00 WAT: UniPods Live Session on MS Teams. Test your audio/video.',
      },
      {
        label: 'Event day (2 hours before)',
        daysBefore: 0,
        dateStr: '22 Sep 2026',
        timeWAT: '08:00 WAT',
        status: 'scheduled',
        message: 'Starting in 2 hours: UniPods Live Session. Link: teams.microsoft.com/unipods-room1',
      },
    ],
  },
  {
    id: 'rem-2',
    eventTitle: 'MIT Learn Module 4 Coursework Submission Cutoff',
    eventDate: '24 Sep 2026',
    timeWAT: '18:00 WAT',
    purpose: 'Evaluation of RAG architecture notebooks and context accuracy scores.',
    audience: 'All Registered Participants',
    linkVenue: 'https://learn.mit.edu/courses/unipods-ai-2026/m4',
    preparation: 'Complete all 4 coding cells and submit the verification hash.',
    schedule: [
      {
        label: '4 days before',
        daysBefore: 4,
        dateStr: '20 Sep 2026',
        timeWAT: '12:00 WAT',
        status: 'sent',
        message: 'Module 4 opened today. Deadline is Thursday 24 Sep at 18:00 WAT.',
      },
      {
        label: '2 days before',
        daysBefore: 2,
        dateStr: '22 Sep 2026',
        timeWAT: '12:00 WAT',
        status: 'scheduled',
        message: '48 hours remaining for MIT Module 4 submission. 38% of cohort completed.',
      },
      {
        label: 'Event day',
        daysBefore: 0,
        dateStr: '24 Sep 2026',
        timeWAT: '09:00 WAT',
        status: 'scheduled',
        message: 'Final reminder: Module 4 cutoff is 18:00 WAT today. No automatic extensions.',
      },
    ],
  },
];

export const INITIAL_RECAPS: Recap[] = [
  {
    id: 'rec-daily-21sep',
    type: 'daily',
    title: "Today's UniPods Brief — 21 Sep 2026",
    date: '21 September 2026',
    announcements: [
      'Next live session confirmed for Tuesday 22 Sep at 10:00 WAT on MS Teams.',
      'Prototype concept submission deadline extended to Tuesday 29 Sep 23:59 WAT.',
      'Zoom room link decommissioned; replaced with MS Teams room.',
    ],
    events: [
      'UniPods AI Innovation Session completed at 10:00 WAT with 58 attendees.',
      'Google Cloud vouchers distributed to registered participant inboxes.',
    ],
    keyDiscussions: [
      'RAG grounding: Dr. Touré emphasized that prototypes must reference verified sources.',
      'Customer validation: Wadhwani mentors reviewed the 5-interview requirement.',
    ],
    actions: [
      'Complete MIT Learn Module 4 by 24 Sep at 18:00 WAT.',
      'Test your MS Teams login before tomorrow’s 10:00 WAT session.',
      'Claim your $250 Vertex AI voucher.',
    ],
    links: [
      { title: 'MS Teams Room', url: 'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1' },
      { title: 'Milestone 2 Evaluation Deck', url: 'https://unipods.meti.org/slides/milestone2-deck.pdf' },
      { title: 'MIT Learn Module 4', url: 'https://learn.mit.edu/courses/unipods-ai-2026/m4' },
    ],
  },
  {
    id: 'rec-weekly-w3',
    type: 'weekly',
    title: 'This Week in UniPods — Week 3 Progress & Decisions',
    date: '15 - 21 September 2026',
    announcements: [
      'Full cohort successfully kicked off Milestone 2 (Proof of Concept phase).',
      'Prototype submission extension to 29 Sep approved by academic committee.',
      'METI clarified grant policies: prototyping reimbursement up to $1,500/team.',
    ],
    events: [
      '16 Sep: Wadhwani Market Validation Workshop',
      '19 Sep: MIT Learn RAG Deep Dive',
      '21 Sep: Milestone 2 Cohort Briefing & Rubric Reveal',
    ],
    keyDiscussions: [
      'High cohort confusion on deadline resolved in favour of 29 September.',
      'Transition from exploratory chatbots to verifiable memory companions.',
    ],
    actions: [
      'Lock in team git repositories.',
      'Conduct minimum 5 local customer discovery interviews.',
      'Submit Module 4 lab by 24 Sep.',
    ],
    completedMilestones: [
      'Milestone 1: Problem Definition & Domain Framing (100% cohort completion)',
      'Git Repository Infrastructure Setup (92% cohort completion)',
    ],
    links: [
      { title: 'Week 3 Resource Bundle', url: 'https://unipods.meti.org/resources/week3' },
      { title: 'Full Meeting Recordings Archive', url: 'https://unipods.meti.org/recordings' },
    ],
  },
];

export const INITIAL_USER: UserProfile = {
  name: 'Awa Diop',
  email: 'awa.diop@ucad.edu.sn',
  cohort: 'UniPods AI Cohort 2026 (Group 3)',
  unipod: 'UCAD Dakar UniPod Innovation Center',
  track: 'Computer Vision & Voice AI for Agriculture',
  team: 'SunuAgri AI (Team #14)',
  role: 'Participant / AI Lead',
  preferences: {
    smartSilenceActive: true,
    plainLanguageExplanationPreferred: true,
    digestFrequency: 'daily',
  },
};

export const INITIAL_CONFUSION_ALERTS: ConfusionAlert[] = [INITIAL_CONFUSION_ALERT];
export const INITIAL_DECISION_TIMELINE: DecisionTimelineItem[] = INITIAL_TIMELINE;
export const LATEST_ANNOUNCEMENT = INITIAL_ANNOUNCEMENTS[0];
export const INITIAL_REMINDERS = [
  {
    id: 'rem-1',
    title: 'UniPods AI Innovation Session — Milestone 2 Mentorship',
    targetDate: 'Tuesday, 22 Sep 2026, 10:00 WAT',
    daysUntil: 1,
    type: 'meeting',
    scheduledDaysBefore: [7, 3, 1, 0],
    sourceTitle: 'UniPods Official Announcement #12',
  },
  {
    id: 'rem-2',
    title: 'MIT Learn Module 4 Interactive Quiz & Lab Cutoff',
    targetDate: 'Thursday, 24 Sep 2026, 18:00 WAT',
    daysUntil: 3,
    type: 'deadline',
    scheduledDaysBefore: [7, 3, 1, 0],
    sourceTitle: 'MIT Learn Module 4 Notice',
  },
  {
    id: 'rem-3',
    title: 'Prototype Concept Submission & GitHub Repository Upload',
    targetDate: 'Tuesday, 29 Sep 2026, 23:59 WAT',
    daysUntil: 8,
    type: 'deadline',
    scheduledDaysBefore: [7, 3, 1, 0],
    sourceTitle: 'Organiser Clarification (Eng. Kwame)',
  },
];
