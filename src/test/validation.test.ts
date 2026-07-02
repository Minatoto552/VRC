import { describe, expect, it } from 'vitest';

import {
  MAX_VRC_NAME_LENGTH,
  isBlank,
  normalizeVrcName,
  normalizeWhitespace,
  validateWinnerCount,
} from '../../shared/validation';

describe('validation helpers', () => {
  it('normalizes VRC names by trimming and lowercasing', () => {
    expect(normalizeVrcName('  VRC   Name  ')).toBe('vrc name');
  });

  it('detects blank values after trimming', () => {
    expect(isBlank('   ')).toBe(true);
    expect(isBlank(' VRC ')).toBe(false);
  });

  it('collapses repeated spaces', () => {
    expect(normalizeWhitespace('A   B    C')).toBe('A B C');
  });

  it('enforces the winner count upper bound', () => {
    expect(validateWinnerCount(4, 3)).toEqual({
      ok: false,
      message: '候補者数を超える人数は指定できません',
    });
  });

  it('keeps the configured VRC name limit stable', () => {
    expect(MAX_VRC_NAME_LENGTH).toBe(32);
  });
});
