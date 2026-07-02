import { describe, expect, it } from 'vitest';

import type { LotteryEntry } from '../../shared/models';
import { drawWinners, selectEligibleEntries } from '../../shared/lottery';

const entries: LotteryEntry[] = [
  {
    id: 'entry-1',
    displayName: '部員01',
    normalizedName: '部員01',
    eligible: true,
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'entry-2',
    displayName: '部員02',
    normalizedName: '部員02',
    eligible: true,
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
  {
    id: 'entry-3',
    displayName: '部員03',
    normalizedName: '部員03',
    eligible: false,
    createdAt: '2026-06-29T00:00:00.000Z',
    updatedAt: '2026-06-29T00:00:00.000Z',
  },
];

describe('lottery helpers', () => {
  it('filters only eligible entries', () => {
    expect(selectEligibleEntries(entries).map((entry) => entry.id)).toEqual(['entry-1', 'entry-2']);
  });

  it('never selects the same winner twice in one draw', () => {
    const winners = drawWinners(entries, 2, () => 0);

    expect(winners).toHaveLength(2);
    expect(new Set(winners.map((entry) => entry.id)).size).toBe(2);
  });

  it('rejects drawing more winners than candidates', () => {
    expect(() => drawWinners(entries, 3, () => 0)).toThrow(
      '候補者数を超える人数は指定できません',
    );
  });
});
