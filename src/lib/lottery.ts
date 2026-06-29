export const VRC_NAME_MAX_LENGTH = 40;

export function normalizeVrcName(input: string): string {
  return input.trim().replace(/[\s　]+/g, ' ').normalize('NFKC');
}

export function canonicalVrcName(input: string): string {
  return normalizeVrcName(input).toLocaleLowerCase('ja-JP');
}

export function validateVrcName(input: string): string | null {
  const normalized = normalizeVrcName(input);

  if (!normalized) {
    return 'VRC名を入力してください';
  }

  if (normalized.length > VRC_NAME_MAX_LENGTH) {
    return `VRC名は${VRC_NAME_MAX_LENGTH}文字以内で入力してください`;
  }

  return null;
}

export function duplicateKey(input: string): string {
  let hash = 2166136261;

  for (const character of canonicalVrcName(input)) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return `name-${(hash >>> 0).toString(16)}`;
}

export function validateWinnerCount(count: number, candidates: number): string | null {
  if (!Number.isInteger(count) || count < 1) {
    return '当選人数は1名以上にしてください';
  }

  if (count > candidates) {
    return '当選人数が抽選対象者数を超えています';
  }

  return null;
}

export function pickWinners<T>(items: T[], count: number): T[] {
  const validationError = validateWinnerCount(count, items.length);

  if (validationError) {
    throw new Error(validationError);
  }

  const pool = [...items];
  const winners: T[] = [];

  while (winners.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [winner] = pool.splice(index, 1);
    winners.push(winner);
  }

  return winners;
}
