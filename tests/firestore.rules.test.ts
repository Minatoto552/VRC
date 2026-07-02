/**
 * @vitest-environment node
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { describe, beforeAll, afterAll, it } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('firestore security rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'event-cafe-2026',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, 'activities', 'public-activity'), {
        title: 'Cafe Night Preview',
        isPublic: true,
      });

      await setDoc(doc(db, 'lotteryEntries', 'entry-01'), {
        displayName: '部員01',
        eligible: true,
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('allows anonymous users to read a public activity', async () => {
    const anonymousDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(anonymousDb, 'activities', 'public-activity')));
  });

  it('prevents anonymous users from reading lottery entries', async () => {
    const anonymousDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(anonymousDb, 'lotteryEntries', 'entry-01')));
  });

  it('prevents anonymous users from writing lottery entries directly', async () => {
    const anonymousDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(anonymousDb, 'lotteryEntries', 'entry-02'), {
        displayName: '部員02',
        eligible: true,
      }),
    );
  });

  it('allows admins with a custom claim to read lottery entries', async () => {
    const adminDb = testEnv.authenticatedContext('admin-user', { admin: true }).firestore();

    await assertSucceeds(getDoc(doc(adminDb, 'lotteryEntries', 'entry-01')));
  });
});
