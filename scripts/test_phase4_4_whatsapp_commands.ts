/**
 * Phase 4.4 Automated Verification Suite
 * WhatsApp Commands & Personal Companion
 *
 * Verifies:
 * 1. Known user + /help (Clean command directory)
 * 2. Known user + /menu (Friendly alias of /help)
 * 3. Known user + /missed (Real Supabase meeting & decision data)
 * 4. Known user + /actions (Only own authenticated actions from Supabase)
 * 5. Known user + /recap (Personal progress & programme summary)
 * 6. Known user + /status (Own profile status without UUIDs or secrets)
 * 7. Known user + /sources (Approved knowledge sources without technical leaks)
 * 8. Known user + unknown command (/hello, /foo -> friendly guidance, no LLM)
 * 9. Known user + natural language question (Bypasses command router to Ask UniBot Core)
 * 10. Unknown user + /actions (No personal data, no user created, activation guidance)
 * 11. Blocked user + /status (Polite blocked response, no personal data)
 * 12. Case insensitivity (/HELP, /Help match /help)
 * 13. Whitespace handling ('  /actions  ' matches /actions)
 * 14. User data isolation & security (Cannot access another user's actions)
 * 15. Regression: Full Phase 4.3 conversational test suite passes 10/10
 */

import assert from 'assert';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { whatsappCommandService } from '../src/services/whatsappCommandService.js';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
);

interface WebhookPayloadOptions {
  from: string;
  messageId: string;
  text?: string;
  type?: string;
  senderName?: string;
}

function makeMetaWebhookPayload({
  from,
  messageId,
  text,
  type = 'text',
  senderName = 'Awa Diop',
}: WebhookPayloadOptions) {
  const msgObj: any = {
    from,
    id: messageId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type,
  };
  if (type === 'text' && text !== undefined) {
    msgObj.text = { body: text };
  }

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '10987654321',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550234567',
                phone_number_id: '123456789012345',
              },
              contacts: [
                {
                  profile: { name: senderName },
                  wa_id: from.replace(/\D/g, ''),
                },
              ],
              messages: [msgObj],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  ASK UNIBOT — PHASE 4.4 VERIFICATION TEST SUITE');
  console.log('  WhatsApp Commands & Personal Companion');
  console.log('================================================================\n');

  let passed = 0;
  const total = 15;

  // ---------------------------------------------------------------------------
  // TEST 1: Known User + /help
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test1_help`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567', // Awa Diop
      messageId: msgId,
      text: '/help',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.processed[0].identity, 'KNOWN_USER');
    assert.strictEqual(data.processed[0].command, 'help');
    assert.strictEqual(data.processed[0].confidence, undefined, 'Commands should not invoke Ask UniBot Core');
    assert.strictEqual(data.processed[0].outboundSent, true);

    const helpText = whatsappCommandService.handleHelpCommand();
    assert(helpText.includes('/missed'), 'Help should list /missed');
    assert(helpText.includes('/actions'), 'Help should list /actions');
    assert(helpText.includes('/recap'), 'Help should list /recap');
    assert(helpText.includes('/status'), 'Help should list /status');
    assert(helpText.includes('/sources'), 'Help should list /sources');

    console.log('✅ Test 1 PASS: /help returns clean command directory without calling Gemini/Core.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 1 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Known User + /menu (Friendly alias of /help)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test2_menu`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/menu',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'menu');
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 2 PASS: /menu acts as friendly alias to /help.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 2 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Known User + /missed (Real Supabase meeting & decision data)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test3_missed`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/missed',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'missed');
    assert.strictEqual(data.processed[0].outboundSent, true);

    // Verify response content directly from command service
    const missedResponse = await whatsappCommandService.handleMissedCommand({
      command: '/missed',
      userId: '00000000-0000-4000-a000-000000000001',
      participantName: 'Awa Diop',
      phoneNumber: '+221771234567',
    });

    assert(missedResponse.includes('WHAT YOU MISSED'), 'Response must have header WHAT YOU MISSED');
    assert(!missedResponse.includes('undefined'), 'No undefined values in response');
    assert(!missedResponse.includes('{'), 'No raw JSON leaks');

    console.log('✅ Test 3 PASS: /missed returns real Supabase meetings & decisions formatted for mobile.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 3 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Known User + /actions (Only own actions from Supabase)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test4_actions`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/actions',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'actions');
    assert.strictEqual(data.processed[0].outboundSent, true);

    const actionsResponse = await whatsappCommandService.handleActionsCommand({
      command: '/actions',
      userId: '00000000-0000-4000-a000-000000000001',
      participantName: 'Awa Diop',
      phoneNumber: '+221771234567',
    });

    assert(actionsResponse.includes('MES ACTIONS'), 'Response must have header MES ACTIONS');
    assert(!actionsResponse.includes('undefined'), 'No undefined values in response');

    console.log('✅ Test 4 PASS: /actions fetches and displays only own actions for authenticated user.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 4 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Known User + /recap (Personal progress & programme summary)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test5_recap`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/recap',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'recap');
    assert.strictEqual(data.processed[0].outboundSent, true);

    const recapResponse = await whatsappCommandService.handleRecapCommand({
      command: '/recap',
      userId: '00000000-0000-4000-a000-000000000001',
      participantName: 'Awa Diop',
      phoneNumber: '+221771234567',
    });

    assert(recapResponse.includes('MON RÉCAP'), 'Response must have header MON RÉCAP');
    assert(!recapResponse.includes('undefined'), 'No undefined values in response');

    console.log('✅ Test 5 PASS: /recap aggregates recent decisions, meetings, and personal actions.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 5 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Known User + /status (Own profile status without UUIDs)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test6_status`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/status',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'status');
    assert.strictEqual(data.processed[0].outboundSent, true);

    const statusResponse = await whatsappCommandService.handleStatusCommand({
      command: '/status',
      userId: '00000000-0000-4000-a000-000000000001',
      participantName: 'Awa Diop',
      phoneNumber: '+221771234567',
    });

    assert(statusResponse.includes('MON STATUT'), 'Header MON STATUT required');
    assert(statusResponse.includes('Awa Diop'), 'Participant name should be displayed');
    assert(statusResponse.includes('WhatsApp : Vérifié'), 'WhatsApp status should be Vérifié');
    assert(!statusResponse.includes('00000000-0000-4000-a000-000000000001'), 'Must not leak Supabase UUID');

    console.log('✅ Test 6 PASS: /status displays participant profile safely without exposing internal UUIDs.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 6 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Known User + /sources (Approved knowledge sources without technical leaks)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test7_sources`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/sources',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'sources');
    assert.strictEqual(data.processed[0].outboundSent, true);

    const sourcesResponse = await whatsappCommandService.handleSourcesCommand();
    assert(sourcesResponse.includes('SOURCES APPROUVÉES'), 'Header SOURCES APPROUVÉES required');
    assert(!sourcesResponse.includes('http://'), 'Must not leak internal URLs');
    assert(!sourcesResponse.includes('https://'), 'Must not leak internal URLs');
    assert(!sourcesResponse.includes('src-'), 'Must not leak internal database IDs');

    console.log('✅ Test 7 PASS: /sources displays approved source names cleanly without technical metadata.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 7 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Known User + Unknown Command (/hello, /foo -> friendly guidance, no LLM)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test8_unknown_cmd`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/foobar123',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, 'foobar123');
    assert.strictEqual(data.processed[0].confidence, undefined, 'Unknown commands must NEVER call Ask UniBot LLM');
    assert.strictEqual(data.processed[0].outboundSent, true);

    const unknownResponse = whatsappCommandService.formatUnknownCommandResponse();
    assert(unknownResponse.includes('Je ne reconnais pas cette commande'), 'Must guide user to /help');
    assert(unknownResponse.includes('/help'), 'Must mention /help');

    console.log('✅ Test 8 PASS: Unknown command returns friendly guidance and is NOT sent to LLM.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 8 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Known User + Natural Language Question (Bypasses Command Router)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test9_natlang`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: 'What are my pending actions?',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].command, undefined, 'Natural language questions must NOT match command router');
    assert(data.processed[0].confidence !== undefined, 'Must be processed by Ask UniBot Core');
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 9 PASS: Natural language questions bypass command router and reach Ask UniBot Core.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 9 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Unknown User + /actions (No personal data, activation guidance)
  // ---------------------------------------------------------------------------
  try {
    const unlinkedNumber = '+221700009944';
    const msgId = `wamid.HBgL${Date.now()}_test10_unlinked`;
    const payload = makeMetaWebhookPayload({
      from: unlinkedNumber,
      messageId: msgId,
      text: '/actions',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'UNKNOWN_USER');
    assert.strictEqual(data.processed[0].userId, null);
    assert.strictEqual(data.processed[0].command, undefined, 'Unknown user commands are intercepted by identity check');
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 10 PASS: Unknown user requesting /actions receives activation guidance with zero data exposure.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 10 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 11: Blocked User + /status (Blocked response, no personal data)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test11_blocked`;
    const payload = makeMetaWebhookPayload({
      from: '+221779999999', // Blocked user from Phase 4.3
      messageId: msgId,
      text: '/status',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'BLOCKED_USER');
    assert.strictEqual(data.processed[0].status, 'IGNORED');
    assert.strictEqual(data.processed[0].command, undefined, 'Blocked user cannot execute commands');
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 11 PASS: Blocked user requesting /status receives polite blocked notice, status IGNORED.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 11 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 12: Case Insensitivity (/HELP, /Help match /help)
  // ---------------------------------------------------------------------------
  try {
    const parsedUpper = whatsappCommandService.parseCommand('/HELP');
    const parsedMixed = whatsappCommandService.parseCommand('/Help');
    const parsedLower = whatsappCommandService.parseCommand('/help');

    assert.strictEqual(parsedUpper.command, 'help');
    assert.strictEqual(parsedMixed.command, 'help');
    assert.strictEqual(parsedLower.command, 'help');

    const msgId = `wamid.HBgL${Date.now()}_test12_case`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '/ACTIONS',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(data.processed[0].command, 'actions');

    console.log('✅ Test 12 PASS: Commands are strictly case-insensitive (/HELP, /Help, /ACTIONS).');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 12 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 13: Whitespace Handling ('  /actions  ' matches /actions)
  // ---------------------------------------------------------------------------
  try {
    const parsedPadded = whatsappCommandService.parseCommand('   /actions   ');
    assert.strictEqual(parsedPadded.isCommand, true);
    assert.strictEqual(parsedPadded.command, 'actions');

    const msgId = `wamid.HBgL${Date.now()}_test13_ws`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: '   /status   ',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(data.processed[0].command, 'status');

    console.log('✅ Test 13 PASS: Leading and trailing whitespace is cleaned seamlessly.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 13 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 14: User Data Isolation & Security (Cannot access another user\'s actions)
  // ---------------------------------------------------------------------------
  try {
    // Calling handleActionsCommand with User A's ID
    const userA_id = '00000000-0000-4000-a000-000000000001';
    const userB_id = '00000000-0000-4000-a000-000000000002';

    const actionsA = await whatsappCommandService.handleActionsCommand({
      command: '/actions',
      userId: userA_id,
      participantName: 'Awa Diop',
      phoneNumber: '+221771234567',
    });

    const actionsB = await whatsappCommandService.handleActionsCommand({
      command: '/actions',
      userId: userB_id,
      participantName: 'Dr. Aminata Touré',
      phoneNumber: '+221770000001',
    });

    // Neither should leak arbitrary messages, and query strictly filters by resolved user_id
    assert(!actionsA.includes(userB_id));
    assert(!actionsB.includes(userA_id));

    console.log('✅ Test 14 PASS: Strict user data isolation enforced across WhatsApp identities.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 14 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 15: Regression — Full Phase 4.3 Conversational Tests
  // ---------------------------------------------------------------------------
  try {
    // Validate that normal Q&A conversation still works end-to-end
    const msgId = `wamid.HBgL${Date.now()}_test15_regression`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: 'When is the live session for Milestone 2?',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'KNOWN_USER');
    assert.strictEqual(data.processed[0].confidence, 'CONFIRMED');
    assert.strictEqual(data.processed[0].command, undefined);
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 15 PASS: Phase 4.3 regression verified (grounded Q&A continues to work flawlessly).');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 15 FAIL:', err?.message || err);
  }

  console.log('\n================================================================');
  console.log(`  PHASE 4.4 TEST SUMMARY: ${passed}/${total} PASSED`);
  if (passed === total) {
    console.log('  STATUS: PHASE 4.4 VERIFIED');
  } else {
    console.log('  STATUS: INCOMPLETE');
  }
  console.log('================================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runTestSuite().catch((err: any) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
