export interface DiffPart {
  added?: boolean;
  removed?: boolean;
  value: string;
}

export function diffWords(oldStr: string, newStr: string): DiffPart[] {
  if (!oldStr) return [{ added: true, value: newStr }];
  if (!newStr) return [{ removed: true, value: oldStr }];

  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  const dp: number[][] = Array(oldWords.length + 1).fill(null).map(() => Array(newWords.length + 1).fill(0));

  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = oldWords.length;
  let j = newWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ added: true, value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ removed: true, value: oldWords[i - 1] });
      i--;
    }
  }

  const optimized: DiffPart[] = [];
  for (const part of result) {
    const last = optimized[optimized.length - 1];
    if (last && last.added === part.added && last.removed === part.removed) {
      last.value += part.value;
    } else {
      optimized.push({ ...part });
    }
  }

  return optimized;
}
