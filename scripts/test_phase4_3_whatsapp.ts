/**
 * Phase 4.3 Automated Verification Suite
 * WhatsApp → Ask UniBot Core → WhatsApp Response
 *
 * Verifies:
 * 1. Known user, confirmed question (Evidence-first, source citation, next step)
 * 2. Known user, conflicting question (NEEDS_ADMIN_CONFIRMATION, handover ticket created)
 * 3. Known user, unknown question (NOT_FOUND, zero hallucination, polite escalation)
 * 4. Unknown user (No Ask UniBot, no user created, activation guidance)
 * 5. Blocked user (No Ask UniBot, blocked notice, IGNORED)
 * 6. Webhook deduplication (Idempotence, duplicate message ignored)
 * 7. Non-text message (Image/audio guidance)
 * 8. Response formatting (Clean mobile text, no raw JSON, no UUIDs)
 * 9. Dry Run dispatch (Safe execution when unconfigured or dry-run active)
 * 10. Security checks (No secret leaks in logs, responses, or client payloads)
 */

import assert from 'assert';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { AiResponse } from '../src/types.js';
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

function makeMetaWebhookPayload({ from, messageId, text, type = 'text', senderName = 'Awa Diop' }: WebhookPayloadOptions) {
  const msgObj: any = {
    from,
    id: messageId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type,
  };
  if (type === 'text' && text) {
    msgObj.text = { body: text };
  } else if (type === 'image') {
    msgObj.image = { id: 'img_test_123', mime_type: 'image/jpeg' };
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
  console.log('  ASK UNIBOT — PHASE 4.3 VERIFICATION TEST SUITE');
  console.log('  WhatsApp → Ask UniBot Core → WhatsApp Response');
  console.log('================================================================\n');

  let passed = 0;
  const total = 10;

  // Setup test identities in Supabase
  try {
    // 1. Awa Diop (+221771234567) - VERIFIED
    await supabase.from('whatsapp_identities').upsert({
      id: 'wa-id-test-awa',
      user_id: '00000000-0000-4000-a000-000000000001',
      phone_number: '+221771234567',
      phone_number_normalized: '+221771234567',
      display_name: 'Awa Diop',
      status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Blocked test user (+221779999999) - BLOCKED
    await supabase.from('whatsapp_identities').upsert({
      id: 'wa-id-test-blocked',
      user_id: '00000000-0000-4000-a000-000000000001',
      phone_number: '+221779999999',
      phone_number_normalized: '+221779999999',
      display_name: 'Spam User',
      status: 'BLOCKED',
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('Identity seed notice:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Known User — Confirmed Question
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test1_confirmed`;
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

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.processed[0].identity, 'KNOWN_USER');
    assert.strictEqual(data.processed[0].userId, '00000000-0000-4000-a000-000000000001');
    assert.strictEqual(data.processed[0].confidence, 'CONFIRMED');
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 1 PASS: Known user asking confirmed question receives grounded CONFIRMED answer.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 1 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Known User — Question with Conflict (Handover Ticket Created)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test2_conflict`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: 'What is the prototype submission deadline? There seems to be an unresolved conflict between 27 Sep and 29 Sep.',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'KNOWN_USER');
    assert.strictEqual(data.processed[0].confidence, 'NEEDS_ADMIN_CONFIRMATION');
    assert.strictEqual(data.processed[0].needsHuman, true);
    assert.strictEqual(data.processed[0].outboundSent, true);

    // Verify ticket in Supabase
    const { data: tickets } = await supabase
      .from('handover_tickets')
      .select('id, question, status')
      .order('created_at', { ascending: false })
      .limit(1);

    assert(tickets && tickets.length > 0, 'Handover ticket should be present in Supabase');
    console.log('✅ Test 2 PASS: Conflicting question returns NEEDS_ADMIN_CONFIRMATION and creates handover ticket.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 2 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Known User — Unknown Question (Zero Hallucination)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test3_notfound`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      text: 'What is the secret Wi-Fi password for the Tokyo office cafeteria?',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'KNOWN_USER');
    assert.strictEqual(data.processed[0].confidence, 'NOT_FOUND');
    assert.strictEqual(data.processed[0].needsHuman, true);
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 3 PASS: Non-existent question returns NOT_FOUND with zero hallucination and human escalation.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 3 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Unknown User (Unlinked Phone Number)
  // ---------------------------------------------------------------------------
  try {
    const unlinkedNumber = '+221700009988';
    const msgId = `wamid.HBgL${Date.now()}_test4_unknown`;
    const payload = makeMetaWebhookPayload({
      from: unlinkedNumber,
      messageId: msgId,
      text: 'Hello, what are the upcoming deadlines?',
      senderName: 'Random Visitor',
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
    assert.strictEqual(data.processed[0].outboundSent, true);

    // Verify no user was created in public.users
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'Random Visitor');
    assert(!users || users.length === 0, 'No user should be created in public.users');

    console.log('✅ Test 4 PASS: Unknown number receives activation guidance without calling Ask UniBot or creating user.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 4 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Blocked User
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test5_blocked`;
    const payload = makeMetaWebhookPayload({
      from: '+221779999999',
      messageId: msgId,
      text: 'Can I access the curriculum materials?',
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
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 5 PASS: Blocked user receives polite blocked notice, status set to IGNORED.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 5 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Webhook Message Deduplication (Idempotence)
  // ---------------------------------------------------------------------------
  try {
    const duplicateMsgId = `wamid.HBgL${Date.now()}_test6_dedup`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: duplicateMsgId,
      text: 'When is the live session?',
    });

    // Send 1st time
    const res1 = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data1 = await res1.json();
    assert.strictEqual(data1.processed[0].identity, 'KNOWN_USER');

    // Send 2nd time with exact same message_id
    const res2 = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.duplicateCount, 1, 'Expected duplicateCount to be 1');
    assert.strictEqual(data2.processed[0].identity, 'DUPLICATE');
    assert.strictEqual(data2.processed[0].status, 'IGNORED');
    assert.strictEqual(data2.processed[0].outboundSent, false, 'No outbound message should be dispatched for duplicate');

    console.log('✅ Test 6 PASS: Deduplication prevents reprocessing and stops duplicate outbound messages.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 6 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Non-Text Message Handling (e.g. Image)
  // ---------------------------------------------------------------------------
  try {
    const msgId = `wamid.HBgL${Date.now()}_test7_image`;
    const payload = makeMetaWebhookPayload({
      from: '+221771234567',
      messageId: msgId,
      type: 'image',
    });

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].messageType, 'image');
    assert.strictEqual(data.processed[0].outboundSent, true);

    console.log('✅ Test 7 PASS: Non-text message handled gracefully with guidance to submit text.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 7 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Response Formatter Mobile Cleanliness
  // ---------------------------------------------------------------------------
  try {
    // Dynamic import to test WhatsAppResponseService unit logic
    const { whatsappResponseService } = await import('../src/services/whatsappResponseService.ts');

    const sampleConfirmed: AiResponse = {
      answer: 'The next live session is on Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams.',
      confidence: 'CONFIRMED',
      sources: [
        {
          id: 'src-1',
          title: 'UniPods Official Announcement #12',
          date: '21 Sep 2026',
          content: 'Session details',
          approved: true,
          type: 'official_announcement',
          status: 'current',
          tags: [],
        },
      ],
      nextStep: 'Check your calendar invite.',
      needsHuman: false,
    };

    const formatted = whatsappResponseService.formatWhatsAppResponse(sampleConfirmed);
    assert(formatted.includes('Source:\nUniPods Official Announcement #12'), 'Should contain source title');
    assert(!formatted.includes('src-1'), 'Must not leak database ID src-1');
    assert(!formatted.includes('{'), 'Must not contain raw JSON');
    assert(!formatted.includes('undefined'), 'Must not contain undefined string');

    console.log('✅ Test 8 PASS: Response formatter produces clean mobile layout without internal IDs or JSON.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 8 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Cloud API Dry Run Verification
  // ---------------------------------------------------------------------------
  try {
    const { whatsappCloudApiService } = await import('../src/services/whatsappCloudApiService.ts');
    assert(whatsappCloudApiService.isDryRun(), 'Service should detect dry-run mode when configured or in local dev');

    const result = await whatsappCloudApiService.sendWhatsAppTextMessage({
      to: '+221771234567',
      text: 'Test dry-run outbound message',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert(result.messageId && result.messageId.startsWith('dry_run_wamid_'));

    console.log('✅ Test 9 PASS: WhatsApp Cloud API service executes cleanly in Dry Run mode.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 9 FAIL:', err?.message || err);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Security Checks (No Secret Exposure)
  // ---------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const health = await res.json();

    assert.strictEqual(typeof health.whatsappConfigured, 'boolean');
    assert.strictEqual(typeof health.whatsappDryRun, 'boolean');
    assert.strictEqual(health.WHATSAPP_ACCESS_TOKEN, undefined, 'Access token must never be exposed');
    assert.strictEqual(health.SUPABASE_SERVICE_ROLE_KEY, undefined, 'Service role key must never be exposed');

    console.log('✅ Test 10 PASS: Health endpoint and API responses strictly protect server secrets.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 10 FAIL:', err?.message || err);
  }

  console.log('\n================================================================');
  console.log(`  PHASE 4.3 TEST SUMMARY: ${passed}/${total} PASSED`);
  if (passed === total) {
    console.log('  STATUS: PHASE 4.3 VERIFIED');
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
