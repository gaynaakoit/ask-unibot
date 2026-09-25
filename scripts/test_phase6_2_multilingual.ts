/**
 * Phase 6.2 Verification Test Suite — Multilingual Foundation & Coverage
 * METI UniPods AI Innovation Programme 2026
 */

import assert from 'assert';
import { en } from '../src/i18n/locales/en.js';
import { fr } from '../src/i18n/locales/fr.js';
import { pt } from '../src/i18n/locales/pt.js';
import { ar } from '../src/i18n/locales/ar.js';
import { translate, t } from '../src/i18n/index.js';
import { detectLanguage } from '../src/i18n/languageDetector.js';
import { resolveLanguage, resolveWhatsAppMessageLanguage } from '../src/i18n/languageResolver.js';
import { formatDate, formatNumber, getDirection, getLocale } from '../src/i18n/formatter.js';

function collectKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const full = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(collectKeys(val, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  ASK UNIBOT — PHASE 6.2 MULTILINGUAL VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Dictionary Completeness & No Missing Keys
  try {
    const enKeys = collectKeys(en);
    const frKeys = new Set(collectKeys(fr));
    const ptKeys = new Set(collectKeys(pt));
    const arKeys = new Set(collectKeys(ar));

    const missingInFr = enKeys.filter((k) => !frKeys.has(k));
    const missingInPt = enKeys.filter((k) => !ptKeys.has(k));
    const missingInAr = enKeys.filter((k) => !arKeys.has(k));

    assert.strictEqual(missingInFr.length, 0, `Missing French keys: ${missingInFr.join(', ')}`);
    assert.strictEqual(missingInPt.length, 0, `Missing Portuguese keys: ${missingInPt.join(', ')}`);
    assert.strictEqual(missingInAr.length, 0, `Missing Arabic keys: ${missingInAr.join(', ')}`);

    console.log(`✅ Test 1 PASS: All ${enKeys.length} translation keys exist across en, fr, pt, ar.`);
    passed++;
  } catch (err: any) {
    console.error('❌ Test 1 FAIL:', err?.message || err);
    failed++;
  }

  // TEST 2: Missing Translation Safety & Parameter Interpolation
  try {
    // Non-existent key falls back gracefully without undefined or crashing
    const missingResult = translate('non.existent.key', 'fr');
    assert.strictEqual(missingResult, 'non.existent.key');

    // Interpolation works in all languages
    const enWelcome = translate('dashboard.welcome', 'en', { name: 'Awa' });
    assert.strictEqual(enWelcome, 'Welcome back, Awa');

    const frWelcome = translate('dashboard.welcome', 'fr', { name: 'Awa' });
    assert.strictEqual(frWelcome, 'Bienvenue, Awa');

    const ptWelcome = translate('dashboard.welcome', 'pt', { name: 'Awa' });
    assert.strictEqual(ptWelcome, 'Bem-vindo(a), Awa');

    const arWelcome = translate('dashboard.welcome', 'ar', { name: 'حواء' });
    assert.strictEqual(arWelcome, 'مرحباً بك، حواء');

    console.log('✅ Test 2 PASS: Missing key fallback safe and parameter interpolation verified.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 2 FAIL:', err?.message || err);
    failed++;
  }

  // TEST 3: Deterministic Language Detection
  try {
    // English
    assert.strictEqual(detectLanguage('What are my pending actions for this week?'), 'en');
    assert.strictEqual(detectLanguage('When is the next meeting on MS Teams?'), 'en');

    // French
    assert.strictEqual(detectLanguage('Quelles sont mes actions en attente ?'), 'fr');
    assert.strictEqual(detectLanguage('Bonjour, quand aura lieu la prochaine session ?'), 'fr');

    // Portuguese
    assert.strictEqual(detectLanguage('Quais são minhas ações pendentes?'), 'pt');
    assert.strictEqual(detectLanguage('Olá, quando é a próxima reunião do programa?'), 'pt');

    // Arabic
    assert.strictEqual(detectLanguage('ما هي مهامي المعلقة لهذا الأسبوع؟'), 'ar');
    assert.strictEqual(detectLanguage('متى موعد الجلسة القادمة؟'), 'ar');

    // Ambiguous / Empty
    assert.strictEqual(detectLanguage(''), null);
    assert.strictEqual(detectLanguage('ok'), null);
    assert.strictEqual(detectLanguage('12345'), null);

    console.log('✅ Test 3 PASS: Deterministic language detection across en, fr, pt, ar.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 3 FAIL:', err?.message || err);
    failed++;
  }

  // TEST 4: Language Resolution Priority (Web & WhatsApp)
  try {
    // Web: Explicit > Stored > Default
    assert.strictEqual(
      resolveLanguage({ channel: 'WEB', explicitLanguage: 'fr', userPreferredLanguage: 'en' }),
      'fr'
    );
    assert.strictEqual(
      resolveLanguage({ channel: 'WEB', explicitLanguage: null, userPreferredLanguage: 'pt' }),
      'pt'
    );
    assert.strictEqual(
      resolveLanguage({ channel: 'WEB', explicitLanguage: null, userPreferredLanguage: null }),
      'en'
    );

    // WhatsApp: Explicit command > Stored pref > Detected message > Group > Default
    assert.strictEqual(
      resolveLanguage({
        channel: 'WHATSAPP',
        explicitLanguage: 'ar',
        userPreferredLanguage: 'fr',
        detectedMessageLanguage: 'en',
      }),
      'ar'
    );
    assert.strictEqual(
      resolveLanguage({
        channel: 'WHATSAPP',
        explicitLanguage: null,
        userPreferredLanguage: 'pt',
        detectedMessageLanguage: 'en',
      }),
      'pt'
    );
    assert.strictEqual(
      resolveLanguage({
        channel: 'WHATSAPP',
        explicitLanguage: null,
        userPreferredLanguage: null,
        detectedMessageLanguage: 'fr',
      }),
      'fr'
    );
    assert.strictEqual(
      resolveLanguage({
        channel: 'WHATSAPP',
        explicitLanguage: null,
        userPreferredLanguage: null,
        detectedMessageLanguage: null,
        groupLanguage: 'pt',
      }),
      'pt'
    );

    console.log('✅ Test 4 PASS: Strict resolution priority order strictly preserved.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 4 FAIL:', err?.message || err);
    failed++;
  }

  // TEST 5: RTL Direction & Locale Formatting
  try {
    assert.strictEqual(getDirection('ar'), 'rtl');
    assert.strictEqual(getDirection('en'), 'ltr');
    assert.strictEqual(getDirection('fr'), 'ltr');
    assert.strictEqual(getDirection('pt'), 'ltr');

    const testDate = new Date('2026-09-24T12:00:00Z');
    const formattedEn = formatDate(testDate, 'en');
    const formattedFr = formatDate(testDate, 'fr');
    const formattedAr = formatDate(testDate, 'ar');

    assert(formattedEn.length > 0);
    assert(formattedFr.length > 0);
    assert(formattedAr.length > 0);

    const numEn = formatNumber(1250.5, 'en');
    const numFr = formatNumber(1250.5, 'fr');
    assert(numEn.length > 0);
    assert(numFr.length > 0);

    console.log('✅ Test 5 PASS: RTL direction and locale formatting operate cleanly.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 5 FAIL:', err?.message || err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`PHASE 6.2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
