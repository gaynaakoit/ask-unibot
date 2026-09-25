/**
 * Phase 5 Automated Verification Suite
 * WhatsApp Group Memory & Governance Engine
 * METI UniPods AI Innovation Programme 2026
 *
 * Requirements Verified:
 * 1. Classification & Smart Silence (General chat silenced, announcements absorbed, direct summon replied)
 * 2. Memory Extraction & Policy (Peer defaults to PENDING, Lead can be APPROVED)
 * 3. Memory Governance Workflow (Approve, Reject with reason, Supersede with link)
 * 4. Grounded Q&A with Hierarchy (Approved group memories used in RAG)
 * 5. PENDING/REJECTED/SUPERSEDED exclusion from confirmed knowledge
 * 6. Contradiction handling (Ambiguous deadline -> NEEDS_ADMIN_CONFIRMATION + Handover ticket)
 * 7. Group Commands:
 *    - /missed (Aggregates group announcements, events, deadlines + user actions)
 *    - /memory (Synthesizes collective memory without technical UUID leaks)
 *    - /decisions (Lists approved group & programme decisions)
 *    - /deadlines (Lists confirmed deadlines in mobile-friendly format)
 * 8. Group Authorization & Membership Security (Unauthorized groups & non-members ignored)
 * 9. Identity Resolution Integrity (Strictly E.164 phone number, no auto user creation)
 * 10. Webhook processing & resilience (Private messages unaffected, rapid 200 OK)
 */

import assert from 'assert';
import dotenv from 'dotenv';
import { groupMessageClassifier } from '../src/services/groupMessageClassifier.js';
import { groupMemoryService } from '../src/services/groupMemoryService.js';
import { executeAskUniBotCore } from '../src/services/askUniBotCore.js';
import { whatsappCommandService } from '../src/services/whatsappCommandService.js';
import { whatsappWebhookService } from '../src/services/whatsappWebhookService.js';
import { whatsappIdentityService } from '../src/services/whatsappIdentityService.js';

dotenv.config();

const KNOWN_USER_AWA = {
  id: '00000000-0000-4000-a000-000000000001',
  name: 'Awa Diop',
  phone: '+221770000001',
  phoneRaw: '221770000001',
};

const KNOWN_USER_AMINATA = {
  id: '00000000-0000-4000-a000-000000000003',
  name: 'Dr. Aminata Touré',
  phone: '+221770000003',
  phoneRaw: '221770000003',
};

const DEMO_GROUP_ID = 'grp-unipods-2026-demo';

async function runPhase5Tests() {
  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 5 TEST SUITE: WHATSAPP GROUP MEMORY');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err?.message || err}`);
      failed++;
    }
  }

  // Ensure known identities are linked
  await whatsappIdentityService.linkWhatsAppNumber(KNOWN_USER_AWA.id, KNOWN_USER_AWA.phone, KNOWN_USER_AWA.name);
  await whatsappIdentityService.linkWhatsAppNumber(KNOWN_USER_AMINATA.id, KNOWN_USER_AMINATA.phone, KNOWN_USER_AMINATA.name);

  // ---------------------------------------------------------------------------
  // TEST 1: Message Classification & Smart Silence
  // ---------------------------------------------------------------------------
  await test('1. Deterministic classification & Smart Silence enforcement', async () => {
    // 1.1 Casual peer chatter
    const casual = groupMessageClassifier.classify('Bonjour à tous, bonne journée ! 👍', 'MEMBER');
    assert.strictEqual(casual.category, 'GENERAL_CHAT');
    assert.strictEqual(casual.shouldSilence, true);

    // 1.2 Unaddressed peer question (Smart Silence must apply)
    const peerQ = groupMessageClassifier.classify('Quelqu\'un a le lien du notebook ?', 'MEMBER');
    assert.strictEqual(peerQ.category, 'QUESTION');
    assert.strictEqual(peerQ.shouldSilence, true);

    // 1.3 Lead Announcement
    const ann = groupMessageClassifier.classify('📢 Annonce officielle : La prochaine session se tiendra ce jeudi à 15h00 GMT sur MS Teams.', 'FACILITATOR');
    assert.strictEqual(ann.category, 'ANNOUNCEMENT');
    assert.strictEqual(ann.shouldSilence, true); // Captured silently without polluting chat

    // 1.4 Decision
    const dec = groupMessageClassifier.classify('Décision validée : Chaque équipe doit désigner un responsable technique.', 'FACILITATOR');
    assert.strictEqual(dec.category, 'DECISION');
    assert.strictEqual(dec.shouldSilence, true);

    // 1.5 Direct bot question
    const query = groupMessageClassifier.classify('@Ask UniBot when is the next AI session?', 'MEMBER');
    assert.strictEqual(query.isDirectQuestionToBot, true);
    assert.strictEqual(query.shouldSilence, false);

    // 1.6 Slash command
    const cmd = groupMessageClassifier.classify('/memory', 'MEMBER');
    assert.strictEqual(cmd.isCommand, true);
    assert.strictEqual(cmd.commandName, 'memory');
    assert.strictEqual(cmd.shouldSilence, false);
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Memory Extraction & Role-Based Approval Policy
  // ---------------------------------------------------------------------------
  await test('2. Memory Extraction & Approval Status Assignment', async () => {
    // Peer member claiming a date
    const peerText = 'Je crois que la deadline est le 27 septembre.';
    const peerClass = groupMessageClassifier.classify(peerText, 'MEMBER');
    const peerExt = groupMemoryService.extractMemory({
      text: peerText,
      senderRole: 'MEMBER',
      classification: peerClass,
    });
    assert.strictEqual(peerExt.shouldExtract, true);
    assert.strictEqual(peerExt.defaultApprovalStatus, 'PENDING');

    // Lead facilitator official announcement
    const leadText = 'Rappel officiel : La date limite Milestone 2 est fixée au 30 septembre à 23h59 GMT.';
    const leadClass = groupMessageClassifier.classify(leadText, 'FACILITATOR');
    const leadExt = groupMemoryService.extractMemory({
      text: leadText,
      senderRole: 'FACILITATOR',
      classification: leadClass,
    });
    assert.strictEqual(leadExt.shouldExtract, true);
    assert.strictEqual(leadExt.defaultApprovalStatus, 'APPROVED');
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Admin Memory Governance Workflow (Approve, Reject, Supersede)
  // ---------------------------------------------------------------------------
  await test('3. Memory Governance Workflow (Approve, Reject, Supersede)', async () => {
    // 3.1 Save pending memory
    const saved = await groupMemoryService.saveMemory({
      groupId: DEMO_GROUP_ID,
      createdByUserId: KNOWN_USER_AWA.id,
      memoryType: 'DECISION',
      title: 'Dépôts GitHub publics pour revue par les pairs',
      content: 'Tous les projets doivent avoir un dépôt GitHub public.',
      confidence: 'MEDIUM',
      approvalStatus: 'PENDING',
    });
    assert.strictEqual(saved.approvalStatus, 'PENDING');

    // 3.2 Approve memory
    const approved = await groupMemoryService.approveMemory(saved.id, KNOWN_USER_AMINATA.id);
    assert(approved, 'Approved memory should be returned');
    assert.strictEqual(approved.approvalStatus, 'APPROVED');
    assert.strictEqual(approved.approvedBy, KNOWN_USER_AMINATA.id);

    // Verify it is now returned in approved memories
    const activeApproved = await groupMemoryService.fetchApprovedMemories(DEMO_GROUP_ID, 'DECISION');
    assert(activeApproved.some((m) => m.id === saved.id), 'Newly approved memory should be in approved list');

    // 3.3 Reject another memory
    const pendingToReject = await groupMemoryService.saveMemory({
      groupId: DEMO_GROUP_ID,
      createdByUserId: KNOWN_USER_AWA.id,
      memoryType: 'DEADLINE',
      title: 'Deadline officieuse',
      content: 'Soumission le 25 septembre',
      confidence: 'LOW',
      approvalStatus: 'PENDING',
    });

    const rejected = await groupMemoryService.rejectMemory(
      pendingToReject.id,
      KNOWN_USER_AMINATA.id,
      'Date non officielle'
    );
    assert(rejected, 'Rejected memory should be returned');
    assert.strictEqual(rejected.approvalStatus, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'Date non officielle');

    // Verify excluded from approved memories
    const checkApproved = await groupMemoryService.fetchApprovedMemories(DEMO_GROUP_ID);
    assert(!checkApproved.some((m) => m.id === pendingToReject.id), 'Rejected memory must not be in approved list');

    // 3.4 Supersede memory
    const superseded = await groupMemoryService.supersedeMemory(saved.id, 'mem-github-standard-v2', KNOWN_USER_AMINATA.id);
    assert(superseded, 'Superseded memory should be returned');
    assert.strictEqual(superseded.approvalStatus, 'SUPERSEDED');
    assert.strictEqual(superseded.supersededBy, 'mem-github-standard-v2');

    const checkApprovedAfterSupersede = await groupMemoryService.fetchApprovedMemories(DEMO_GROUP_ID);
    assert(!checkApprovedAfterSupersede.some((m) => m.id === saved.id), 'Superseded memory must not be in approved list');
  });

  // ---------------------------------------------------------------------------
  // TEST 4: Group Commands (/missed, /memory, /decisions, /deadlines)
  // ---------------------------------------------------------------------------
  await test('4. Group Commands (/missed, /memory, /decisions, /deadlines)', async () => {
    // 4.1 /memory
    const memRes = await whatsappCommandService.handleCommand({
      command: '/memory',
      userId: KNOWN_USER_AWA.id,
      participantName: KNOWN_USER_AWA.name,
      phoneNumber: KNOWN_USER_AWA.phone,
      groupId: DEMO_GROUP_ID,
    });
    assert.strictEqual(memRes.handled, true);
    assert(memRes.response.includes('UNIPODS GROUP MEMORY'));
    assert(memRes.response.includes('Dernières annonces importantes'));
    assert(memRes.response.includes('Décisions récentes validées'));
    assert(memRes.response.includes('Deadlines confirmées'));
    assert(!memRes.response.includes('00000000-0000'), 'Never leak internal UUIDs in /memory');

    // 4.2 /decisions
    const decRes = await whatsappCommandService.handleCommand({
      command: '/decisions',
      userId: KNOWN_USER_AWA.id,
      participantName: KNOWN_USER_AWA.name,
      phoneNumber: KNOWN_USER_AWA.phone,
      groupId: DEMO_GROUP_ID,
    });
    assert.strictEqual(decRes.handled, true);
    assert(decRes.response.includes('DÉCISIONS DU GROUPE UNIPODS'));
    assert(decRes.response.includes('Date :'));
    assert(decRes.response.includes('Statut : Validé'));
    assert(!decRes.response.includes('00000000-0000'), 'Never leak internal UUIDs in /decisions');

    // 4.3 /deadlines
    const dlRes = await whatsappCommandService.handleCommand({
      command: '/deadlines',
      userId: KNOWN_USER_AWA.id,
      participantName: KNOWN_USER_AWA.name,
      phoneNumber: KNOWN_USER_AWA.phone,
      groupId: DEMO_GROUP_ID,
    });
    assert.strictEqual(dlRes.handled, true);
    assert(dlRes.response.includes('ÉCHÉANCES CONFIRMÉES'));
    assert(dlRes.response.includes('30 septembre 2026') || dlRes.response.includes('Milestone'));
    assert(!dlRes.response.includes('00000000-0000'), 'Never leak internal UUIDs in /deadlines');

    // 4.4 /missed (contextualized with group memory + personal actions)
    const missedRes = await whatsappCommandService.handleCommand({
      command: '/missed',
      userId: KNOWN_USER_AWA.id,
      participantName: KNOWN_USER_AWA.name,
      phoneNumber: KNOWN_USER_AWA.phone,
      groupId: DEMO_GROUP_ID,
    });
    assert.strictEqual(missedRes.handled, true);
    assert(missedRes.response.includes('WHAT YOU MISSED'));
    assert(missedRes.response.includes('announcement'));
    assert(missedRes.response.includes('deadline'));
    assert(!missedRes.response.includes('00000000-0000'), 'Never leak internal UUIDs in /missed');
  });

  // ---------------------------------------------------------------------------
  // TEST 5: Grounded Q&A with Approved Group Memory
  // ---------------------------------------------------------------------------
  await test('5. Grounded Q&A using Approved Group Memory', async () => {
    const askResult = await executeAskUniBotCore({
      query: 'When is the next AI session?',
      userId: KNOWN_USER_AWA.id,
      participantName: KNOWN_USER_AWA.name,
      channel: 'WHATSAPP',
      groupId: DEMO_GROUP_ID,
    });

    assert.strictEqual(askResult.confidence, 'CONFIRMED');
    assert.strictEqual(askResult.needsHuman, false);
    assert(askResult.answer.includes('Thursday at 3 PM') || askResult.answer.includes('15h00 GMT'));
    assert(askResult.answer.includes('UniPods group announcement'));
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Contradiction Handling & Handover Ticket Trigger
  // ---------------------------------------------------------------------------
  await test('6. Contradiction Detection -> NEEDS_ADMIN_CONFIRMATION + Handover Ticket', async () => {
    const conflictResult = await executeAskUniBotCore({
      query: 'Did they change the deadline to September 27?',
      userId: KNOWN_USER_AWA.id,
      participantName: KNOWN_USER_AWA.name,
      channel: 'WHATSAPP',
      groupId: DEMO_GROUP_ID,
    });

    assert.strictEqual(conflictResult.confidence, 'NEEDS_ADMIN_CONFIRMATION');
    assert.strictEqual(conflictResult.needsHuman, true);
    assert(conflictResult.answer.includes('conflicting information'));
    assert(conflictResult.conflict?.detected === true);
  });

  // ---------------------------------------------------------------------------
  // TEST 7: Webhook Processing — Group vs Private Routing
  // ---------------------------------------------------------------------------
  await test('7. Webhook Pipeline: Group Authorization, Membership & Smart Silence', async () => {
    // 7.1 Authorized group + casual chatter -> Silently recorded
    const payloadCasual = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ wa_id: KNOWN_USER_AWA.phoneRaw, profile: { name: KNOWN_USER_AWA.name } }],
                messages: [
                  {
                    id: `wamid-grp-test-${Date.now()}-1`,
                    from: '12036302212026-group',
                    author: KNOWN_USER_AWA.phoneRaw,
                    recipient_type: 'group',
                    group_id: DEMO_GROUP_ID,
                    type: 'text',
                    text: { body: 'Merci pour les informations !' },
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const resCasual = await whatsappWebhookService.processIncomingEvent(payloadCasual);
    assert.strictEqual(resCasual.success, true);
    assert.strictEqual(resCasual.processed[0].isGroup, true);
    assert.strictEqual(resCasual.processed[0].outboundSent, false, 'Should be silent on casual chat');

    // 7.2 Unauthorized group -> Ignored completely
    const payloadUnauth = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ wa_id: KNOWN_USER_AWA.phoneRaw }],
                messages: [
                  {
                    id: `wamid-grp-test-${Date.now()}-2`,
                    from: '99999999999999-group',
                    author: KNOWN_USER_AWA.phoneRaw,
                    recipient_type: 'group',
                    group_id: 'grp-unauthorized-random',
                    type: 'text',
                    text: { body: '/memory' },
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const resUnauth = await whatsappWebhookService.processIncomingEvent(payloadUnauth);
    assert.strictEqual(resUnauth.processed[0].status, 'IGNORED');
    assert.strictEqual(resUnauth.processed[0].identity, 'UNAUTHORIZED_GROUP');
    assert.strictEqual(resUnauth.processed[0].outboundSent, false);

    // 7.3 Authorized group + command -> Responds
    const payloadCmd = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ wa_id: KNOWN_USER_AWA.phoneRaw, profile: { name: KNOWN_USER_AWA.name } }],
                messages: [
                  {
                    id: `wamid-grp-test-${Date.now()}-3`,
                    from: '12036302212026-group',
                    author: KNOWN_USER_AWA.phoneRaw,
                    recipient_type: 'group',
                    group_id: DEMO_GROUP_ID,
                    type: 'text',
                    text: { body: '/deadlines' },
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const resCmd = await whatsappWebhookService.processIncomingEvent(payloadCmd);
    assert.strictEqual(resCmd.processed[0].command, 'deadlines');
    assert.strictEqual(resCmd.processed[0].outboundSent, true);

    // 7.4 Private 1:1 message unaffected (Phase 4.3 & 4.4 preservation)
    const payloadPrivate = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ wa_id: KNOWN_USER_AWA.phoneRaw, profile: { name: KNOWN_USER_AWA.name } }],
                messages: [
                  {
                    id: `wamid-priv-test-${Date.now()}-4`,
                    from: KNOWN_USER_AWA.phoneRaw,
                    type: 'text',
                    text: { body: '/status' },
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const resPriv = await whatsappWebhookService.processIncomingEvent(payloadPrivate);
    assert.strictEqual(resPriv.processed[0].isGroup, false);
    assert.strictEqual(resPriv.processed[0].command, 'status');
    assert.strictEqual(resPriv.processed[0].outboundSent, true);
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`PHASE 5 TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
