import { useState, useEffect } from 'react';
import { zxcvbn, ZxcvbnResult } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import { zxcvbnOptions } from '@zxcvbn-ts/core';

// Initialize zxcvbn with dictionaries
zxcvbnOptions.setOptions({
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
});

export const usePasswordStrength = (password: string) => {
  const [result, setResult] = useState<ZxcvbnResult | null>(null);

  useEffect(() => {
    if (password.length === 0) {
      setResult(null);
      return;
    }

    const analysis = zxcvbn(password);
    setResult(analysis);
  }, [password]);

  return {
    score: result?.score ?? 0, // 0-4 (0: very weak, 4: very strong)
    warning: result?.feedback.warning ?? '',
    suggestions: result?.feedback.suggestions ?? [],
    crackTimeDisplay: result?.crackTimesDisplay.offlineSlowHashing1e4PerSecond ?? '',
    hasPatterns: result ? result.score < 3 : false,
  };
};
