import { describe, expect, it } from 'vitest';
import {
  canonicalVrcName,
  duplicateKey,
  normalizeVrcName,
  pickWinners,
  validateVrcName,
  validateWinnerCount,
} from './lottery';

describe('lottery utilities', () => {
  it('normalizes VRC names', () => {
    expect(normalizeVrcName('  Cafe　　User  ')).toBe('Cafe User');
  });

  it('detects blank names', () => {
    expect(validateVrcName('   ')).toBe('VRC名を入力してください');
  });

  it('limits name length', () => {
    expect(validateVrcName('あ'.repeat(41))).toContain('40文字以内');
  });

  it('generates duplicate keys case-insensitively', () => {
    expect(duplicateKey('CafeUser')).toBe(duplicateKey(' cafeuser '));
  });

  it('canonicalizes names', () => {
    expect(canonicalVrcName('ＡＢＣ')).toBe('abc');
  });

  it('validates winner count', () => {
    expect(validateWinnerCount(4, 3)).toContain('超えています');
  });

  it('does not duplicate winners in a draw', () => {
    const winners = pickWinners(['a', 'b', 'c'], 3);
    expect(new Set(winners).size).toBe(3);
  });

  it('rejects drawing over candidates', () => {
    expect(() => pickWinners(['a'], 2)).toThrow();
  });
});
