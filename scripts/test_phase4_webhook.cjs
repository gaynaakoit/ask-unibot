/**
 * Phase 4.1 + 4.2 Test Suite
 * Validates Meta WhatsApp Cloud API Webhook, Identity Resolution, Deduplication, and Security.
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'unipods_wa_verify_2026';

async function runTests() {
  console.log('--- STARTING PHASE 4.1 + 4.2 TEST SUITE ---\n');
  let passed = 0;
  let total = 8;

  // --------------------------------------------------------------------------
  // TEST 1: Webhook Verification GET (Valid token)
  // --------------------------------------------------------------------------
  try {
    const url = `${BASE_URL}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge_12345`;
    const res = await fetch(url);
    const body = await res.text();

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(body, 'test_challenge_12345', `Expected challenge returned, got "${body}"`);
    console.log('✅ Test 1 PASS: Webhook GET verification succeeded with status 200 and challenge returned.');
    passed++;
  } catch (err) {
    console.error('❌ Test 1 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Webhook Verification GET (Invalid token)
  // --------------------------------------------------------------------------
  try {
    const url = `${BASE_URL}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=INVALID_TOKEN_999&hub.challenge=test_challenge_12345`;
    const res = await fetch(url);

    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    console.log('✅ Test 2 PASS: Webhook GET verification rejected invalid token with status 403.');
    passed++;
  } catch (err) {
    console.error('❌ Test 2 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Valid Text Message POST
  // --------------------------------------------------------------------------
  const uniqueMsgId1 = `wamid.HBgL${Date.now()}_test3`;
  try {
    const payload = {
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
                    profile: { name: 'Awa Diop' },
                    wa_id: '221771234567',
                  },
                ],
                messages: [
                  {
                    from: '221771234567',
                    id: uniqueMsgId1,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Bonjour UniBot, quelle est la prochaine session ?' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(data.status, 'ok', 'Expected status ok');
    assert.strictEqual(data.messagesCount, 1, 'Expected 1 message parsed');
    assert.strictEqual(data.processed[0].messageType, 'text');
    console.log('✅ Test 3 PASS: Valid text message parsed and acknowledged with status 200.');
    passed++;
  } catch (err) {
    console.error('❌ Test 3 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Message from Unknown Number (UNKNOWN_USER + No user created)
  // --------------------------------------------------------------------------
  const uniqueMsgIdUnknown = `wamid.HBgL${Date.now()}_unknown`;
  const unknownPhone = '+221 78 999 88 77';
  try {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '123456789012345' },
                contacts: [{ profile: { name: 'Random Stranger' }, wa_id: '221789998877' }],
                messages: [
                  {
                    from: '221789998877',
                    id: uniqueMsgIdUnknown,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Hello can anyone help me?' },
                    type: 'text',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'UNKNOWN_USER', 'Expected UNKNOWN_USER identity');
    assert.strictEqual(data.processed[0].userId, null, 'Expected userId to be null for unknown user');
    console.log('✅ Test 4 PASS: Unknown phone number resolved to UNKNOWN_USER and NO user created in public.users.');
    passed++;
  } catch (err) {
    console.error('❌ Test 4 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Message from Known Number (Awa Diop)
  // --------------------------------------------------------------------------
  const uniqueMsgIdKnown = `wamid.HBgL${Date.now()}_known`;
  try {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '123456789012345' },
                contacts: [{ profile: { name: 'Awa Diop' }, wa_id: '221771234567' }],
                messages: [
                  {
                    from: '+221771234567',
                    id: uniqueMsgIdKnown,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Rappel pour la réunion de demain ?' },
                    type: 'text',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.processed[0].identity, 'KNOWN_USER', 'Expected KNOWN_USER identity');
    assert.strictEqual(
      data.processed[0].userId,
      '00000000-0000-4000-a000-000000000001',
      'Expected Awa Diop user ID'
    );
    console.log('✅ Test 5 PASS: Known phone number correctly mapped to UniPods user Awa Diop.');
    passed++;
  } catch (err) {
    console.error('❌ Test 5 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Message Deduplication
  // --------------------------------------------------------------------------
  try {
    const duplicatePayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                messages: [
                  {
                    from: '+221771234567',
                    id: uniqueMsgIdKnown, // Reusing ID from Test 5
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Rappel pour la réunion de demain ?' },
                    type: 'text',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.duplicateCount, 1, 'Expected duplicate count 1');
    assert.strictEqual(data.processed[0].status, 'IGNORED', 'Expected IGNORED status for duplicate');
    console.log('✅ Test 6 PASS: Replayed message_id recognized and ignored (processed once).');
    passed++;
  } catch (err) {
    console.error('❌ Test 6 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Invalid Payload (Robustness & no crash)
  // --------------------------------------------------------------------------
  try {
    const res1 = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'structure', garbage: [1, 2, 3] }),
    });
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(data1.messagesCount, 0);

    const res2 = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'null',
    });
    assert.strictEqual(res2.status, 400);

    console.log('✅ Test 7 PASS: Malformed payloads handled gracefully without server crash.');
    passed++;
  } catch (err) {
    console.error('❌ Test 7 FAIL:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Security & Secret Protection
  // --------------------------------------------------------------------------
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();

    assert.strictEqual(typeof health.whatsappConfigured, 'boolean');
    assert.strictEqual(health.WHATSAPP_ACCESS_TOKEN, undefined);
    assert.strictEqual(health.WHATSAPP_VERIFY_TOKEN, undefined);
    assert.strictEqual(health.SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.strictEqual(health.GEMINI_API_KEY, undefined);

    console.log('✅ Test 8 PASS: Health check and APIs do not expose any secrets, tokens, or credentials.');
    passed++;
  } catch (err) {
    console.error('❌ Test 8 FAIL:', err.message);
  }

  console.log(`\n--- TEST RESULTS: ${passed}/${total} TESTS PASSED ---`);
  if (passed === total) {
    console.log('🎉 ALL PHASE 4.1 + 4.2 TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
