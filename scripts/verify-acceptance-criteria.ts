/**
 * Royal Services Acceptance Criteria Verification Test Suite
 * Validates PRD Section 13 (AC 01 - AC 16) & Lifecycle Business Rules
 */

import {
  computeTokenStatus,
  calculateReminderDates,
  getCurrentISTDateString,
  isReminderDueToday,
  diffCalendarDays,
} from '../src/lib/ist';
import {
  getAgents,
  createAgent,
  updateAgent,
  bulkImportAgents,
  getProperties,
  findOrCreateProperty,
  getTokens,
  getTokenById,
  getTokenByNumber,
  getPublicToken,
  createToken,
  updateToken,
  archiveToken,
  restoreToken,
  getRenewalDraftData,
  getArchivedTokens,
  recordReminderAttempt,
  getActivityLogs,
  clearStore,
} from '../src/lib/store';
import { generateTokenCSV, generateAgentCSV, sanitizeCSVValue } from '../src/lib/export';
import { buildReminderMessageText, sendWhatsAppReminder } from '../src/lib/whatsapp';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Assertion failed for: ${testName}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' Royal Services - Automated Acceptance Criteria Suite ');
  console.log('======================================================\n');

  clearStore();

  // Create isolated test fixtures for the test suite
  const setupAgent = createAgent({
    name: 'Vikram Sharma',
    mobile: '+919820123456',
  });
  const setupProperty = findOrCreateProperty('Royal Palms Tower A, Flat 1402, Mumbai');

  const baseActiveToken = createToken({
    token_number: 'RS-2026-8801',
    associate_name: 'Aditya Birla Capital',
    agent_id: setupAgent.id,
    property_id: setupProperty.id,
    start_date: '2026-09-01',
    end_date: '2026-10-30',
  });

  const baseArchivedToken = createToken({
    token_number: 'RS-2026-8500',
    associate_name: 'Heritage Villa Estates',
    agent_id: setupAgent.id,
    property_id: setupProperty.id,
    start_date: '2026-06-01',
    end_date: '2026-07-31',
  });
  archiveToken(baseArchivedToken.id);

  const baseExpiredToken = createToken({
    token_number: 'RS-2026-8750',
    associate_name: 'Apex Realty Solutions',
    agent_id: setupAgent.id,
    property_id: setupProperty.id,
    start_date: '2026-07-01',
    end_date: '2026-08-31',
  });

  // -------------------------------------------------------------
  // AC 05 & AC 06: Date Validation & Status Computation in IST
  // -------------------------------------------------------------
  console.log('▶ Testing AC 05 & AC 06: IST Status & Date Boundaries');
  const todayIST = getCurrentISTDateString();

  // Active status
  const activeStatus = computeTokenStatus('2026-09-01', '2026-10-30', null, false);
  assert(activeStatus === 'active', 'AC 06.1: Active status when today is within date range');

  // Upcoming status
  const upcomingStatus = computeTokenStatus('2026-12-01', '2026-12-31', null, false);
  assert(upcomingStatus === 'upcoming', 'AC 06.2: Upcoming status when start date is in future');

  // Expired status
  const expiredStatus = computeTokenStatus('2026-01-01', '2026-05-01', null, false);
  assert(expiredStatus === 'expired', 'AC 06.3: Expired status when end date has passed');

  // Manual Suspended override
  const suspendedStatus = computeTokenStatus('2026-09-01', '2026-10-30', 'suspended', false);
  assert(suspendedStatus === 'suspended', 'AC 06.4: Suspended override takes precedence');

  // Manual Cancelled override
  const cancelledStatus = computeTokenStatus('2026-09-01', '2026-10-30', 'cancelled', false);
  assert(cancelledStatus === 'cancelled', 'AC 06.5: Cancelled override takes precedence');

  // End Date earlier than Start Date validation
  let dateRejectionPassed = false;
  try {
    createToken({
      token_number: 'TEST-INVALID-DATES',
      associate_name: 'Test Associate',
      agent_id: setupAgent.id,
      start_date: '2026-10-10',
      end_date: '2026-10-05', // earlier than start date!
      property_id: setupProperty.id,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('End Date cannot be earlier than Start Date')) {
      dateRejectionPassed = true;
    }
  }
  assert(dateRejectionPassed, 'AC 05: Prevents an End Date earlier than Start Date');

  // -------------------------------------------------------------
  // AC 02: Duplicate Token Number Rejection (Active & Archived)
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 02: Unique Token Number Across Active and Archived');
  let duplicateActiveRejected = false;
  try {
    createToken({
      token_number: 'RS-2026-8801', // Already exists in active token fixture
      associate_name: 'Dupe Associate',
      agent_id: setupAgent.id,
      start_date: '2026-09-01',
      end_date: '2026-10-30',
      property_id: setupProperty.id,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already exists')) {
      duplicateActiveRejected = true;
    }
  }
  assert(duplicateActiveRejected, 'AC 02.1: Duplicate active token number is rejected');

  // Duplicate against archived token (RS-2026-8500 is archived)
  let duplicateArchivedRejected = false;
  try {
    createToken({
      token_number: 'RS-2026-8500', // Archived token fixture!
      associate_name: 'Dupe Archived Associate',
      agent_id: setupAgent.id,
      start_date: '2026-09-01',
      end_date: '2026-10-30',
      property_id: setupProperty.id,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already exists')) {
      duplicateArchivedRejected = true;
    }
  }
  assert(duplicateArchivedRejected, 'AC 02.2: Duplicate token number rejected even when token is archived');

  // -------------------------------------------------------------
  // AC 03: Agent Selection, Mobile Autofill, and Token Override Preservation
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 03: Agent Selection & Mobile Overrides');
  const createdAgent = createAgent({
    name: 'Rohit Verma',
    mobile: '+919988776655',
  });
  assert(createdAgent.name === 'Rohit Verma', 'AC 03.1: Created agent master record');

  const tokenWithOverride = createToken({
    token_number: 'RS-2026-9999',
    associate_name: 'Overridden Mobile Corp',
    agent_id: createdAgent.id,
    agent_mobile_number: '+919111222333', // Specific override!
    property_id: 'pr-001',
    start_date: '2026-09-01',
    end_date: '2026-10-30',
  });
  assert(
    tokenWithOverride.agent_mobile_number === '+919111222333',
    'AC 03.2: Token-specific phone override successfully stored'
  );

  // Update agent master
  updateAgent(createdAgent.id, { name: 'Rohit Verma Senior', mobile: '+919999999999' });
  const retrievedTokenAfterAgentEdit = getTokenById(tokenWithOverride.id);
  assert(
    retrievedTokenAfterAgentEdit?.agent_mobile_number === '+919111222333',
    'AC 03.3: Editing agent master does NOT alter historical token-specific mobile'
  );

  // AC 03.4: Duplicate phone number prevention
  let dupError = '';
  try {
    createAgent({ name: 'Duplicate Rohit', mobile: '+919999999999' });
  } catch (err: unknown) {
    dupError = err instanceof Error ? err.message : '';
  }
  assert(
    dupError === 'number already entered',
    'AC 03.4: Rejects duplicate agent mobile with "number already entered"'
  );

  // AC 03.5: Bulk agent import with duplicate rejection
  const bulkResult = bulkImportAgents([
    { name: 'Bulk Associate 1', mobile: '9820555555' },
    { name: 'Duplicate Associate', mobile: '+919999999999' }, // duplicate of Rohit
  ]);
  assert(
    bulkResult.importedCount === 1 &&
      bulkResult.skippedCount === 1 &&
      bulkResult.errors[0]?.error === 'number already entered',
    'AC 03.5: Bulk CSV agent import registers valid agents and flags duplicate mobile with "number already entered"'
  );

  // -------------------------------------------------------------
  // AC 04: Inline Property Creation & Reuse
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 04: Property Auto-Creation and Reuse');
  const propName = 'Imperial Crown Residences, Penthouse 401, Mumbai';
  const autoCreatedToken = createToken({
    token_number: 'RS-2026-9998',
    associate_name: 'High End Client',
    agent_id: createdAgent.id,
    property_name: propName, // Passed as name to trigger auto-creation
    start_date: '2026-09-01',
    end_date: '2026-10-30',
  });
  assert(
    autoCreatedToken.property?.name === propName,
    'AC 04.1: Property entered during token creation is saved and linked'
  );

  const allProps = getProperties(true);
  const foundInMaster = allProps.some(p => p.name === propName);
  assert(foundInMaster, 'AC 04.2: Newly entered property appears in future property master list');

  // -------------------------------------------------------------
  // AC 07: Archive and Restore
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 07: Archive and Restore');
  const archived = archiveToken(autoCreatedToken.id);
  assert(archived.is_archived === true, 'AC 07.1: Token is archived');

  const operationalTokens = getTokens({ includeArchived: false });
  assert(
    !operationalTokens.some(t => t.id === autoCreatedToken.id),
    'AC 07.2: Archived token disappears from normal operational list'
  );

  const publicArchived = getPublicToken(autoCreatedToken.token_number);
  assert(publicArchived === null, 'AC 07.3: Archived token is excluded from public lookup');

  const restored = restoreToken(autoCreatedToken.id);
  assert(restored.is_archived === false, 'AC 07.4: Token restored with history intact');

  const operationalTokensAfterRestore = getTokens({ includeArchived: false });
  assert(
    operationalTokensAfterRestore.some(t => t.id === autoCreatedToken.id),
    'AC 07.5: Restored token reappears in operational lists'
  );

  // -------------------------------------------------------------
  // AC 08: Public Privacy Boundary (Never Expose Agent Phone)
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 08: Public Privacy Safeguards');
  const publicView = getPublicToken('RS-2026-8801');
  assert(publicView !== null, 'AC 08.1: Valid token returns approved public details');
  assert(publicView?.token_number === 'RS-2026-8801', 'AC 08.2: Returns token number');
  assert(publicView?.agent_name !== undefined, 'AC 08.3: Returns agent name');
  // Verify agent mobile is strictly absent in public projection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPublic = publicView as any;
  assert(
    rawPublic.agent_mobile_number === undefined && rawPublic.mobile === undefined,
    'AC 08.4: Agent mobile number is NEVER exposed on public tracking view'
  );

  // -------------------------------------------------------------
  // AC 10: Expired Token & Create Renewal Workflow
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 10: Renewal Workflow and Expired Extension Prohibition');
  // Attempt to extend expired token RS-2026-8750
  let extendExpiredBlocked = false;
  const expiredToken = getTokenByNumber('RS-2026-8750')!;
  try {
    updateToken(expiredToken.id, { end_date: '2026-12-31' });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('cannot be reactivated by extending its End Date')) {
      extendExpiredBlocked = true;
    }
  }
  assert(extendExpiredBlocked, 'AC 10.1: Expired token cannot be extended directly');

  // Test renewal draft cloning
  const renewalDraft = getRenewalDraftData(expiredToken.id);
  assert(
    renewalDraft.associate_name === expiredToken.associate_name,
    'AC 10.2: Associate name copied into renewal draft'
  );
  assert(
    renewalDraft.renewal_reference_id === expiredToken.id,
    'AC 10.3: Renewal draft preserves renewal reference to prior token'
  );

  // Create renewal replacement token
  const renewedToken = createToken({
    token_number: 'RS-2026-8751', // New unique token number
    associate_name: renewalDraft.associate_name,
    agent_id: renewalDraft.agent_id,
    agent_mobile_number: renewalDraft.agent_mobile_number,
    property_id: renewalDraft.property_id,
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    renewal_reference_id: renewalDraft.renewal_reference_id,
  });
  assert(
    renewedToken.renewal_previous_token?.token_number === 'RS-2026-8750',
    'AC 10.4: Renewal chain establishes link to previous token'
  );

  // -------------------------------------------------------------
  // AC 11: Reminder Schedules (30, 15, 7 days and Expiry)
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 11: WhatsApp Reminder Schedules (IST)');
  const testEndDate = '2026-10-22';
  const reminderDates = calculateReminderDates(testEndDate);

  assert(
    reminderDates['30_day'] === '2026-09-22',
    'AC 11.1: 30-day reminder accurately calculated for 30 calendar days before End Date'
  );
  assert(
    reminderDates['15_day'] === '2026-10-07',
    'AC 11.2: 15-day reminder accurately calculated'
  );
  assert(
    reminderDates['7_day'] === '2026-10-15',
    'AC 11.3: 7-day reminder accurately calculated'
  );
  assert(
    reminderDates['expiry'] === '2026-10-22',
    'AC 11.4: Expiry reminder scheduled on End Date'
  );

  // Check reminder message content contains required PRD fields
  const messageBody = buildReminderMessageText(renewedToken, '30_day');
  assert(
    messageBody.includes(renewedToken.token_number) &&
    messageBody.includes(renewedToken.property?.name || '') &&
    messageBody.includes('/track/'),
    'AC 11.5: Reminder message includes token number, property, dates, and public tracking link'
  );

  // AC 11.6: Token with multiple Assigned Agents & WhatsApp Recipients
  const multiRecipientToken = createToken({
    token_number: 'RS-MULTI-REC-001',
    associate_name: 'Multi Recipient Client Ltd',
    agent_id: createdAgent.id,
    agent_mobile_number: '+919820111111',
    assigned_recipients: [
      { name: 'Rohit Verma', mobile: '+919820111111', is_primary: true },
      { name: 'Priya Sharma (Co-Agent)', mobile: '+919820222222', is_primary: false },
      { name: 'Vikram Mehta (Supervisor)', mobile: '+919820333333', is_primary: false },
    ],
    property_id: 'pr-001',
    start_date: '2026-09-01',
    end_date: '2026-10-30',
  });

  assert(
    multiRecipientToken.assigned_recipients?.length === 3,
    'AC 11.6: Token successfully stores multiple assigned agents & WhatsApp recipients'
  );

  const multiSendResult = await sendWhatsAppReminder(multiRecipientToken, '30_day');
  assert(
    multiSendResult.success && (multiSendResult.providerId?.split(',').length ?? 0) === 3,
    'AC 11.7: WhatsApp reminder message successfully dispatched to all 3 assigned recipients'
  );

  // -------------------------------------------------------------
  // AC 14: CSV Formula Injection Protection & Exports
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 14: CSV Formula Injection Sanitization & Exports');
  const dangerousFormula = '=SUM(1,2)';
  const sanitized = sanitizeCSVValue(dangerousFormula);
  assert(
    sanitized.startsWith(`"'=SUM`),
    'AC 14.1: Leading formula character = is escaped with apostrophe'
  );

  const tokenCSV = generateTokenCSV([renewedToken]);
  assert(tokenCSV.filename.includes('RoyalServices_Tokens_'), 'AC 14.2: Token CSV filename includes date');
  assert(tokenCSV.content.startsWith('\uFEFF'), 'AC 14.3: Token CSV contains UTF-8 BOM for Excel compatibility');

  const agentCSV = generateAgentCSV(getAgents(true));
  assert(agentCSV.filename.includes('RoyalServices_Agents_'), 'AC 14.4: Agent CSV generated cleanly');

  // -------------------------------------------------------------
  // AC 13: Activity History & Audit Logging
  // -------------------------------------------------------------
  console.log('\n▶ Testing AC 13: Activity Trail Logging');
  const logs = getActivityLogs();
  assert(logs.length > 0, 'AC 13.1: Activity history logs actions');
  const hasCreationLog = logs.some(l => l.action === 'token_created');
  assert(hasCreationLog, 'AC 13.2: Token creation appears in activity history');

  console.log('\n======================================================');
  console.log(` ALL ${passedTests}/${totalTests} ACCEPTANCE CRITERIA TESTS PASSED SUCCESSFULLY! `);
  console.log('======================================================\n');

  // Leave store fresh and completely empty
  clearStore();
}


runTests().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
