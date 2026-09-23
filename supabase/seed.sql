-- ==============================================================================
-- ASK UNIBOT: Supabase Seed Data (Phase 3.1)
-- METI UniPods AI Innovation Programme 2026
-- Populates initial verified programme knowledge, decisions, actions, and users
-- ==============================================================================

-- 1. SEED USERS
INSERT INTO users (id, email, name, role, track) VALUES
  ('user-1', 'awa.diop@unipods.example.org', 'Awa Diop', 'participant', 'Computer Vision & Natural Language for Agriculture'),
  ('admin-1', 'aminata.toure@meti.gov.sn', 'Dr. Aminata Touré', 'admin', 'UniPods Programme Facilitation'),
  ('admin-2', 'kwame.mensah@unipods.org', 'Eng. Kwame Mensah', 'admin', 'UniPods Academic Directorate')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  track = EXCLUDED.track;

-- 2. SEED SOURCES (Preserving existing IDs & relationships)
INSERT INTO sources (id, title, type, publisher, author, url, content, date, status, trust_level, approved, version, supersedes_source_id, authority_note, is_demo, tags) VALUES
  (
    'src-1',
    'UniPods Official Announcement #12: Milestone 2 & Live Session',
    'organiser_update',
    'Dr. Aminata Touré (UniPods Lead Facilitator)',
    'Dr. Aminata Touré (UniPods Lead Facilitator)',
    'https://unipods.meti.org/announcements/12',
    'The next UniPods AI Innovation live session will take place on Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams. Agenda includes practical evaluation of Milestone 2 prototypes and MIT mentor Q&A. Attendance is mandatory for lead technical representatives.',
    '21 Sep 2026',
    'current',
    'official',
    TRUE,
    '1.0',
    NULL,
    'Official Programme Organiser Notice (Highest Authority)',
    TRUE,
    ARRAY['schedule', 'session', 'milestone', 'mandatory']
  ),
  (
    'src-2',
    'Organiser Clarification: Prototype Submission Extension',
    'organiser_update',
    'Eng. Kwame Mensah (UniPods Academic Director)',
    'Eng. Kwame Mensah (UniPods Academic Director)',
    'https://unipods.meti.org/updates/deadline-ext',
    'Following mentor feedback from MIT and Wadhwani faculty, the prototype concept submission deadline has been extended from 27 September to Tuesday, 29 September 2026 at 23:59 WAT. Teams must upload their GitHub repo and demo video link to the UniPods portal.',
    '21 Sep 2026',
    'current',
    'official',
    TRUE,
    '1.1',
    'src-4',
    'Approved Organiser Notice supersedes earlier 18 Sep deadline',
    TRUE,
    ARRAY['prototype', 'deadline', 'extension', 'milestone']
  ),
  (
    'src-3',
    'MIT Learn Module 4 Curriculum Notice',
    'mit_learn',
    'Prof. John Tsitsiklis / MIT Learn Team',
    'Prof. John Tsitsiklis / MIT Learn Team',
    'https://learn.mit.edu/courses/unipods-ai-2026/m4',
    'Module 4: "Context-Aware Retrieval and Multilingual Voice AI" is now active. All participants are required to complete the interactive lab and submission quiz before Thursday, 24 September 2026 at 18:00 WAT. Late submissions will affect milestone scoring.',
    '20 Sep 2026',
    'current',
    'official',
    TRUE,
    '1.0',
    NULL,
    'MIT Academic Coursework Registry',
    TRUE,
    ARRAY['mit_learn', 'curriculum', 'deadline', 'rag']
  ),
  (
    'src-4',
    'Earlier Programme Briefing: Preliminary Prototype Due Date',
    'verified_programme_material',
    'UniPods Programme Coordination Desk',
    'UniPods Programme Coordination Desk',
    'https://unipods.meti.org/briefings/sep18',
    'Preliminary prototype submission date initially scheduled for 27 September 2026 at 17:00 WAT. (NOTE: This has been superseded by Organiser Clarification on 21 Sep moving deadline to 29 Sep).',
    '18 Sep 2026',
    'superseded',
    'verified',
    TRUE,
    '0.9',
    NULL,
    'Superseded on 21 Sep 2026 by Dr. Aminata & Eng. Kwame update',
    TRUE,
    ARRAY['prototype', 'deadline', 'superseded']
  ),
  (
    'src-5',
    'Wadhwani Foundation Customer Discovery Guidelines',
    'wadhwani',
    'Wadhwani Entrepreneurship Faculty',
    'Wadhwani Entrepreneurship Faculty',
    'https://wadhwanifoundation.org/ventures/unipods-toolkit',
    'For Milestone 2 validation, each team must complete and document at least 5 structured customer discovery interviews using the Wadhwani problem-solution interview template before demo day.',
    '19 Sep 2026',
    'current',
    'official',
    TRUE,
    '1.0',
    NULL,
    'Partner Curriculum Accreditation',
    TRUE,
    ARRAY['wadhwani', 'market_validation', 'interviews']
  ),
  (
    'src-6',
    'Mentor Office Hours Schedule (Week 3)',
    'organiser_update',
    'Programme Coordination Office',
    'Programme Coordination Office',
    'https://unipods.meti.org/mentorship/office-hours',
    'MIT faculty office hours are scheduled on Wednesday, 23 September from 14:00 to 17:00 WAT. Teams may book 15-minute 1-on-1 technical advisory slots via the UniPods dashboard booking calendar.',
    '21 Sep 2026',
    'current',
    'official',
    TRUE,
    '1.0',
    NULL,
    'Weekly Mentorship Dispatch',
    TRUE,
    ARRAY['mentorship', 'office_hours', 'advisory']
  ),
  (
    'src-7',
    'UniPods Live Virtual Room Link (Updated)',
    'official_whatsapp',
    'UniPods IT & Infrastructure',
    'UniPods IT & Infrastructure',
    'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1',
    'Official Meeting Room: All upcoming live sessions will be hosted on Microsoft Teams at https://teams.microsoft.com/l/meetup-join/unipods-2026-room1. The previous Zoom link from 15 Sep is permanently decommissioned due to capacity limits.',
    '21 Sep 2026',
    'current',
    'official',
    TRUE,
    '2.0',
    'src-8',
    'Official IT Infrastructure Broadcast',
    TRUE,
    ARRAY['link', 'teams', 'virtual_room']
  ),
  (
    'src-8',
    'Decommissioned Zoom Room (Old)',
    'official_whatsapp',
    'UniPods IT',
    'UniPods IT',
    NULL,
    'Meeting room zoom link: https://zoom.us/j/981273910. DO NOT USE. Replaced by Teams room.',
    '15 Sep 2026',
    'superseded',
    'verified',
    TRUE,
    '1.0',
    NULL,
    'Superseded on 21 Sep 2026',
    TRUE,
    ARRAY['link', 'zoom', 'superseded']
  ),
  (
    'src-9',
    'METI Innovation Grant Disbursement Policy',
    'verified_programme_material',
    'Ministry of Economy, Telecommunications & Innovation (METI)',
    'Ministry of Economy, Telecommunications & Innovation (METI)',
    'https://meti.gouv.sn/programmes/unipods-grants-2026',
    'Programme participants are eligible for prototyping reimbursement grants up to $1,500 per team upon successful Milestone 3 verification. Note: There is NO cash prize of $50,000; rumours of direct individual cash awards are false.',
    '17 Sep 2026',
    'current',
    'official',
    TRUE,
    '1.0',
    NULL,
    'METI Official Policy Statement',
    TRUE,
    ARRAY['grants', 'budget', 'reimbursement', 'clarification']
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  publisher = EXCLUDED.publisher,
  author = EXCLUDED.author,
  url = EXCLUDED.url,
  content = EXCLUDED.content,
  date = EXCLUDED.date,
  status = EXCLUDED.status,
  trust_level = EXCLUDED.trust_level,
  approved = EXCLUDED.approved,
  version = EXCLUDED.version,
  supersedes_source_id = EXCLUDED.supersedes_source_id,
  authority_note = EXCLUDED.authority_note,
  is_demo = EXCLUDED.is_demo,
  tags = EXCLUDED.tags;

-- 3. SEED KNOWLEDGE CHUNKS (For RAG retrieval)
INSERT INTO knowledge_chunks (id, source_id, text, title, tags, published_at, effective_from, trust_level, approved) VALUES
  ('chk-src-1-main', 'src-1', 'The next UniPods AI Innovation live session will take place on Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams. Agenda includes practical evaluation of Milestone 2 prototypes and MIT mentor Q&A. Attendance is mandatory for lead technical representatives.', 'UniPods Official Announcement #12: Milestone 2 & Live Session', ARRAY['schedule', 'session', 'milestone', 'mandatory', 'teams'], '21 Sep 2026', '21 Sep 2026', 'official', TRUE),
  ('chk-src-2-main', 'src-2', 'Following mentor feedback from MIT and Wadhwani faculty, the prototype concept submission deadline has been extended from 27 September to Tuesday, 29 September 2026 at 23:59 WAT. Teams must upload their GitHub repo and demo video link to the UniPods portal.', 'Organiser Clarification: Prototype Submission Extension', ARRAY['prototype', 'deadline', 'extension', 'milestone', 'github'], '21 Sep 2026', '21 Sep 2026', 'official', TRUE),
  ('chk-src-3-main', 'src-3', 'Module 4: "Context-Aware Retrieval and Multilingual Voice AI" is now active. All participants are required to complete the interactive lab and submission quiz before Thursday, 24 September 2026 at 18:00 WAT. Late submissions will affect milestone scoring.', 'MIT Learn Module 4 Curriculum Notice', ARRAY['mit_learn', 'curriculum', 'deadline', 'rag'], '20 Sep 2026', '20 Sep 2026', 'official', TRUE),
  ('chk-src-4-main', 'src-4', 'Preliminary prototype submission date initially scheduled for 27 September 2026 at 17:00 WAT. (NOTE: This has been superseded by Organiser Clarification on 21 Sep moving deadline to 29 Sep).', 'Earlier Programme Briefing: Preliminary Prototype Due Date', ARRAY['prototype', 'deadline', 'superseded'], '18 Sep 2026', '18 Sep 2026', 'verified', TRUE),
  ('chk-src-5-main', 'src-5', 'For Milestone 2 validation, each team must complete and document at least 5 structured customer discovery interviews using the Wadhwani problem-solution interview template before demo day.', 'Wadhwani Foundation Customer Discovery Guidelines', ARRAY['wadhwani', 'market_validation', 'interviews'], '19 Sep 2026', '19 Sep 2026', 'official', TRUE),
  ('chk-src-6-main', 'src-6', 'MIT faculty office hours are scheduled on Wednesday, 23 September from 14:00 to 17:00 WAT. Teams may book 15-minute 1-on-1 technical advisory slots via the UniPods dashboard booking calendar.', 'Mentor Office Hours Schedule (Week 3)', ARRAY['mentorship', 'office_hours', 'advisory'], '21 Sep 2026', '21 Sep 2026', 'official', TRUE),
  ('chk-src-7-main', 'src-7', 'Official Meeting Room: All upcoming live sessions will be hosted on Microsoft Teams at https://teams.microsoft.com/l/meetup-join/unipods-2026-room1. The previous Zoom link from 15 Sep is permanently decommissioned due to capacity limits.', 'UniPods Live Virtual Room Link (Updated)', ARRAY['link', 'teams', 'virtual_room'], '21 Sep 2026', '21 Sep 2026', 'official', TRUE),
  ('chk-src-8-main', 'src-8', 'Meeting room zoom link: https://zoom.us/j/981273910. DO NOT USE. Replaced by Teams room.', 'Decommissioned Zoom Room (Old)', ARRAY['link', 'zoom', 'superseded'], '15 Sep 2026', '15 Sep 2026', 'verified', TRUE),
  ('chk-src-9-main', 'src-9', 'Programme participants are eligible for prototyping reimbursement grants up to $1,500 per team upon successful Milestone 3 verification. Note: There is NO cash prize of $50,000; rumours of direct individual cash awards are false.', 'METI Innovation Grant Disbursement Policy', ARRAY['grants', 'budget', 'reimbursement', 'clarification'], '17 Sep 2026', '17 Sep 2026', 'official', TRUE)
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  title = EXCLUDED.title,
  tags = EXCLUDED.tags,
  approved = EXCLUDED.approved;

-- 4. SEED DECISIONS
INSERT INTO decisions (id, topic, decision, title, status, source_id, supersedes_decision_id, supersedes_previous, supersedes_note, impact, effective_from, confirmed_by, notes, is_demo) VALUES
  (
    'dec-proto-29',
    'Prototype Submission Deadline',
    'Prototype concept submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.',
    'Prototype concept submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.',
    'active',
    'src-2',
    'dec-proto-27',
    TRUE,
    'Officially supersedes preliminary 27 September date from 18 Sep.',
    'Gives all 62 teams a 48-hour buffer for rural customer interviews.',
    '21 Sep 2026',
    'Dr. Aminata Touré & Eng. Kwame Mensah',
    'Confirmed in 21 Sep Cohort Briefing.',
    TRUE
  ),
  (
    'dec-proto-27',
    'Prototype Submission Deadline',
    'Preliminary prototype submission date scheduled for 27 September 2026 at 17:00 WAT.',
    'Preliminary prototype submission date scheduled for 27 September 2026 at 17:00 WAT.',
    'superseded',
    'src-4',
    NULL,
    FALSE,
    'Superseded by dec-proto-29 on 21 Sep 2026.',
    'Initial target deadline established during kickoff.',
    '18 Sep 2026',
    'Programme Coordination Desk',
    'Superseded by Dr. Aminata Touré announcement.',
    TRUE
  ),
  (
    'dec-team-lock',
    'Team Roster Lock',
    'Team roster lock: Teams must maintain 3-5 participants with one designated technical lead.',
    'Team roster lock: Teams must maintain 3-5 participants with one designated technical lead.',
    'active',
    'src-1',
    NULL,
    FALSE,
    NULL,
    'Ensures accountability for project repository and deliverables.',
    '21 Sep 2026',
    'UniPods Academic Directorate',
    'No further team changes permitted without written coordinator consent.',
    TRUE
  ),
  (
    'dec-platform-teams',
    'Virtual Meeting Platform Migration',
    'Microsoft Teams is the sole official platform for cohort live sessions; Zoom is retired.',
    'Microsoft Teams is the sole official platform for cohort live sessions; Zoom is retired.',
    'active',
    'src-7',
    NULL,
    TRUE,
    'Supersedes previous Zoom meeting links.',
    'Consolidates all 62 teams in a single institutional license with transcription.',
    '21 Sep 2026',
    'UniPods IT & Infrastructure',
    'Meeting link: https://teams.microsoft.com/l/meetup-join/unipods-2026-room1',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  topic = EXCLUDED.topic,
  decision = EXCLUDED.decision,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  supersedes_decision_id = EXCLUDED.supersedes_decision_id,
  supersedes_previous = EXCLUDED.supersedes_previous,
  supersedes_note = EXCLUDED.supersedes_note,
  confirmed_by = EXCLUDED.confirmed_by;

-- 5. SEED MEETINGS & JUNCTION
INSERT INTO meetings (id, title, meeting_date, time_wat, status, summary, what_was_discussed, action_items, resources, next_session, source_id, source_title, is_demo) VALUES
  (
    'meet-1',
    'UniPods AI Innovation Session — Milestone 2 Briefing',
    '21 September 2026',
    '10:00 WAT',
    'completed',
    'Orientation on Milestone 2 expectations, cloud computing grants, and Q&A on prototype submission criteria.',
    '["Overview of prototype submission expectations and evaluation rubric.", "Clarification on cloud compute grant distribution ($250 per team).", "Integration of MIT Learn Module 4 context-retrieval techniques.", "Community question on submission deadline extension."]'::jsonb,
    '[{"title": "Complete MIT Learn Module 4 Lab", "assignee": "All Team Tech Leads", "deadline": "24 Sep 2026"}, {"title": "Submit 5 Customer Discovery Interview Transcripts", "assignee": "All Teams", "deadline": "29 Sep 2026"}]'::jsonb,
    '[{"title": "Session Recording (Teams Stream)", "url": "https://teams.microsoft.com/recordings/unipods-m2-briefing", "type": "recording"}, {"title": "Milestone 2 Slide Deck (PDF)", "url": "https://unipods.meti.org/resources/m2-deck.pdf", "type": "slides"}]'::jsonb,
    'Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams',
    'src-1',
    'UniPods Official Announcement #12',
    TRUE
  ),
  (
    'meet-2',
    'MIT Learn Deep Dive: Embeddings & Context Retrieval',
    '19 September 2026',
    '14:00 WAT',
    'completed',
    'Technical architecture of Retrieval Augmented Generation, vector index optimization, and multilingual prompting.',
    '["Technical architecture of Retrieval Augmented Generation (RAG).", "Optimizing vector index size for constrained local device environments.", "Handling multilingual prompts (French, Wolof, Yoruba) in African agricultural datasets."]'::jsonb,
    '[{"title": "Fork MIT RAG Colab Starter", "assignee": "Tech Leads", "deadline": "20 Sep 2026"}]'::jsonb,
    '[{"title": "Lecture Slides (PDF)", "url": "https://learn.mit.edu/courses/unipods-ai-2026/m4-slides.pdf", "type": "slides"}, {"title": "Colab Notebook", "url": "https://colab.research.google.com/github/mit-learn/unipods-rag", "type": "doc"}]'::jsonb,
    'Completed',
    'src-3',
    'MIT Learn Module 4 Curriculum Notice',
    TRUE
  ),
  (
    'meet-3',
    'Wadhwani Market Validation Workshop',
    '16 September 2026',
    '11:00 WAT',
    'completed',
    'Customer discovery methods for emerging African markets and translating technical AI capabilities into value propositions.',
    '["Customer discovery methods for emerging African markets.", "Translating technical AI capabilities into clear value propositions for local cooperatives."]'::jsonb,
    '[{"title": "Complete 5 Customer Discovery Interviews", "assignee": "Venture Leads", "deadline": "27 Sep 2026"}]'::jsonb,
    '[{"title": "Interview Guide & Rubric (PDF)", "url": "https://wadhwanifoundation.org/ventures/unipods-toolkit", "type": "template"}]'::jsonb,
    'Completed',
    'src-5',
    'Wadhwani Foundation Customer Discovery Guidelines',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  meeting_date = EXCLUDED.meeting_date,
  time_wat = EXCLUDED.time_wat,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  what_was_discussed = EXCLUDED.what_was_discussed,
  action_items = EXCLUDED.action_items,
  resources = EXCLUDED.resources,
  next_session = EXCLUDED.next_session,
  source_id = EXCLUDED.source_id,
  source_title = EXCLUDED.source_title,
  is_demo = EXCLUDED.is_demo;

INSERT INTO meeting_decisions (meeting_id, decision_id) VALUES
  ('meet-1', 'dec-proto-29'),
  ('meet-1', 'dec-team-lock'),
  ('meet-1', 'dec-platform-teams')
ON CONFLICT (meeting_id, decision_id) DO NOTHING;

-- 6. SEED ACTIONS
INSERT INTO actions (id, user_id, title, description, due_date, status, priority, source_id, source_title, resource_link, resource_name, notes, is_demo) VALUES
  (
    'act-1',
    'user-1',
    'Complete MIT Learn Module 4 Quiz & Colab Lab',
    'Hands-on retrieval-augmented generation and multilingual prompt engineering notebook.',
    '24 Sep 2026',
    'pending',
    'high',
    'src-3',
    'MIT Learn Module 4 Curriculum Notice',
    'https://learn.mit.edu/courses/unipods-ai-2026/m4',
    'MIT Learn Module 4 Portal',
    'Quiz closes promptly at 18:00 WAT on Thursday.',
    TRUE
  ),
  (
    'act-2',
    'user-1',
    'Submit prototype concept deck & GitHub repo',
    'Upload pitch presentation, architecture diagram, and repository link to UniPods portal.',
    '29 Sep 2026',
    'in_progress',
    'high',
    'src-2',
    'Organiser Clarification: Prototype Submission Extension',
    'https://unipods.meti.org/portal/submissions',
    'UniPods Submission Portal',
    'Deadline extended to 29 Sep 23:59 WAT. Need 5 customer interview summaries.',
    TRUE
  ),
  (
    'act-3',
    'user-1',
    'Attend UniPods AI Innovation Session (Live Mentorship)',
    'Live prototype evaluation and mentor Q&A session on Microsoft Teams.',
    '22 Sep 2026',
    'pending',
    'high',
    'src-1',
    'UniPods Official Announcement #12',
    'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1',
    'Join MS Teams Room',
    'Starts at 10:00 WAT. Mentor breakouts for Agriculture Track.',
    TRUE
  ),
  (
    'act-4',
    'user-1',
    'Conduct 5 user discovery interviews (Wadhwani template)',
    'Document problem-solution fit with smallholder farmers and agricultural cooperatives.',
    '27 Sep 2026',
    'pending',
    'normal',
    'src-5',
    'Wadhwani Foundation Customer Discovery Guidelines',
    'https://wadhwanifoundation.org/ventures/unipods-toolkit',
    'Wadhwani Interview Template',
    'Use standardized feedback questions from Section 3.',
    TRUE
  ),
  (
    'act-5',
    'user-1',
    'Setup team GitHub repository with Apache 2.0 license',
    'Initialize repository with UniPods RAG starter kit and MIT/UniPods template.',
    '20 Sep 2026',
    'completed',
    'normal',
    'src-1',
    'UniPods Official Announcement #12',
    'https://github.com/awadiop/agro-rag-unipods',
    'View Team GitHub Repo',
    'Repository initialized with MIT/UniPods template.',
    TRUE
  ),
  (
    'act-6',
    'user-1',
    'Claim $250 Google Cloud & Vertex AI credits voucher',
    'Redeem unique cloud computing token sent to registered email.',
    '23 Sep 2026',
    'pending',
    'normal',
    'src-1',
    'UniPods Official Announcement #12',
    'https://unipods.meti.org/cloud-voucher',
    'Redeem Voucher Code',
    'Check registered email for redemption token.',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  due_date = EXCLUDED.due_date,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  source_id = EXCLUDED.source_id,
  source_title = EXCLUDED.source_title,
  resource_link = EXCLUDED.resource_link,
  resource_name = EXCLUDED.resource_name,
  notes = EXCLUDED.notes,
  is_demo = EXCLUDED.is_demo;

-- 7. SEED INITIAL HANDOVER TICKETS
INSERT INTO handover_tickets (id, question_id, participant_id, participant_context, question, status, detected_conflict, conflict_or_missing, recommended_admin, is_demo) VALUES
  (
    'ticket-1',
    NULL,
    'user-1',
    'Team AgriVision (Senegal Hub) asking regarding cloud credits',
    'Can our team allocate Google Cloud Run credits to private external API proxies?',
    'in_review',
    NULL,
    'Policy not covered in standard FAQ. Requires cloud grant administrator clarification.',
    'Dr. Aminata Touré (Lead Facilitator)',
    TRUE
  ),
  (
    'ticket-2',
    NULL,
    'user-1',
    'Team HealthPulse (Ghana Hub) asking regarding mentor scheduling',
    'Who is our assigned MIT technical mentor for federated learning in hospital records?',
    'open',
    NULL,
    'Individual mentor team pairings have not yet been published.',
    'Dr. Aminata Touré (Lead Facilitator)',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  question = EXCLUDED.question,
  participant_context = EXCLUDED.participant_context,
  conflict_or_missing = EXCLUDED.conflict_or_missing,
  recommended_admin = EXCLUDED.recommended_admin,
  is_demo = EXCLUDED.is_demo;

-- 8. SEED NOTIFICATIONS
INSERT INTO notifications (id, user_id, type, title, message, read, scheduled_for, created_at) VALUES
  (
    'notif-1',
    'user-1',
    'announcement',
    'Deadline Extended: Prototype Submission (29 Sep)',
    'Official notice: Prototype concept submission deadline has been extended to Tuesday, 29 September at 23:59 WAT.',
    FALSE,
    NULL,
    '2026-09-21T11:00:00Z'
  ),
  (
    'notif-2',
    'user-1',
    'reminder',
    'Tomorrow: Live Mentorship Session (10:00 WAT)',
    'Live cohort session on Microsoft Teams tomorrow morning. Attendance is mandatory for technical leads.',
    FALSE,
    NULL,
    '2026-09-21T16:00:00Z'
  ),
  (
    'notif-3',
    'user-1',
    'action',
    'MIT Learn Module 4 Due in 3 Days',
    'Remember to complete the RAG quiz and Colab notebook before Thursday 24 Sep at 18:00 WAT.',
    TRUE,
    NULL,
    '2026-09-21T09:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  read = EXCLUDED.read;

-- 9. SEED CANONICAL QUESTIONS (Demonstrating verified RAG & conflict resolution)
INSERT INTO questions (id, user_id, participant_name, question, answer, confidence, needs_human, next_step, grounding_method, conflict_detected, conflict_resolved, conflict_topic, freshness_status, explanation_simple) VALUES
  (
    'q-seed-1',
    'user-1',
    'Awa Diop',
    'When is the prototype submission deadline?',
    'The official prototype submission deadline is Tuesday, 29 September 2026 at 23:59 WAT. This official extension was confirmed by Eng. Kwame Mensah following MIT and Wadhwani faculty review. Note: The previous 27 September deadline was officially superseded.',
    'CONFIRMED',
    FALSE,
    'Submit GitHub repo and video link via UniPods portal before 29 Sep 23:59 WAT.',
    'deterministic-rag',
    TRUE,
    TRUE,
    'Prototype Submission Deadline',
    'current',
    'Your prototype and presentation are due on Tuesday, 29 September by 11:59 PM West Africa Time.'
  ),
  (
    'q-seed-2',
    'user-1',
    'Awa Diop',
    'When is the next live session?',
    'Your next live session is Tuesday, 22 September 2026 at 10:00 WAT. The session will be conducted exclusively on Microsoft Teams at https://teams.microsoft.com/l/meetup-join/unipods-2026-room1. Attendance is mandatory for team technical representatives.',
    'CONFIRMED',
    FALSE,
    'Join Microsoft Teams room at 10:00 WAT on Tuesday.',
    'deterministic-rag',
    FALSE,
    FALSE,
    NULL,
    'current',
    'Our next live online class is on Tuesday, 22 September at 10:00 AM WAT using Microsoft Teams, not Zoom.'
  ),
  (
    'q-seed-3',
    'user-1',
    'Awa Diop',
    'Is there a $50,000 cash prize for winning teams?',
    'No. Rumours of a $50,000 direct cash award are inaccurate. According to the METI Innovation Grant Disbursement Policy, eligible teams receive prototyping reimbursement grants up to $1,500 following Milestone 3 verification.',
    'CONFIRMED',
    FALSE,
    'Refer to the METI Innovation Grant Policy document for reimbursement criteria.',
    'deterministic-rag',
    FALSE,
    FALSE,
    NULL,
    'current',
    'There is no 50k cash prize. Teams can get up to $1,500 in approved prototype expense reimbursements.'
  )
ON CONFLICT (id) DO UPDATE SET
  answer = EXCLUDED.answer,
  confidence = EXCLUDED.confidence,
  explanation_simple = EXCLUDED.explanation_simple;

INSERT INTO question_sources (question_id, source_id, evidence, relevance) VALUES
  ('q-seed-1', 'src-2', 'Prototype submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.', 1.0),
  ('q-seed-1', 'src-4', 'Preliminary prototype submission date initially scheduled for 27 September (superseded).', 0.8),
  ('q-seed-2', 'src-1', 'Live session on Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams.', 1.0),
  ('q-seed-2', 'src-7', 'Official Meeting Room on Microsoft Teams. Zoom link permanently decommissioned.', 1.0),
  ('q-seed-3', 'src-9', 'Participants eligible for prototyping reimbursement grants up to $1,500. No cash prize of $50,000.', 1.0)
ON CONFLICT DO NOTHING;

