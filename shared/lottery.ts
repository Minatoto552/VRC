import type { LotteryEntry } from './models.js';

import { validateWinnerCount } from './validation.js';

type RandomIndexProvider = (maxExclusive: number) => number;

export const selectEligibleEntries = (entries: LotteryEntry[]): LotteryEntry[] =>
  entries.filter((entry) => entry.eligible);

export const drawWinners = (
  entries: LotteryEntry[],
  requestedCount: number,
  getRandomIndex: RandomIndexProvider,
): LotteryEntry[] => {
  const eligibleEntries = selectEligibleEntries(entries);
  const validation = validateWinnerCount(requestedCount, eligibleEntries.length);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const pool = [...eligibleEntries];
  const winners: LotteryEntry[] = [];

  while (winners.length < requestedCount) {
    const pickedIndex = getRandomIndex(pool.length);
    const [winner] = pool.splice(pickedIndex, 1);

    if (!winner) {
      throw new Error('抽選対象者の取得に失敗しました');
    }

    winners.push(winner);
  }

  return winners;
};
