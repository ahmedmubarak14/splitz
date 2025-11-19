/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching subscription names
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
};

/**
 * Calculate similarity percentage between two strings
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  return ((maxLength - distance) / maxLength) * 100;
};

export interface DuplicateMatch {
  subscription: any;
  similarity: number;
  reason: string;
}

/**
 * Detect potential duplicate subscriptions
 */
export const detectDuplicates = (
  newName: string,
  existingSubscriptions: any[],
  threshold: number = 70 // 70% similarity threshold
): DuplicateMatch[] => {
  const duplicates: DuplicateMatch[] = [];

  existingSubscriptions.forEach((sub) => {
    const nameSimilarity = calculateSimilarity(newName, sub.name);
    
    if (nameSimilarity >= threshold) {
      let reason = `Name is ${nameSimilarity.toFixed(0)}% similar`;
      
      // Check if it's an exact match
      if (nameSimilarity === 100) {
        reason = 'Exact name match';
      }
      
      duplicates.push({
        subscription: sub,
        similarity: nameSimilarity,
        reason,
      });
    }
  });

  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Common subscription name variations
 */
const commonVariations: Record<string, string[]> = {
  'netflix': ['netflix', 'netflix premium', 'netflix basic', 'netflix standard'],
  'spotify': ['spotify', 'spotify premium', 'spotify family', 'spotify duo'],
  'youtube': ['youtube premium', 'youtube', 'yt premium', 'youtube music'],
  'amazon': ['amazon prime', 'prime video', 'amazon', 'prime'],
  'apple music': ['apple music', 'apple music family', 'itunes'],
  'disney': ['disney+', 'disney plus', 'disney', 'disneyplus'],
  'hbo': ['hbo max', 'hbo', 'hbo go'],
};

/**
 * Normalize subscription name to detect common variations
 */
export const normalizeSubscriptionName = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  
  for (const [base, variations] of Object.entries(commonVariations)) {
    if (variations.some(v => normalized.includes(v))) {
      return base;
    }
  }
  
  return normalized;
};

/**
 * Enhanced duplicate detection with normalized names
 */
export const detectDuplicatesEnhanced = (
  newName: string,
  existingSubscriptions: any[],
  threshold: number = 70
): DuplicateMatch[] => {
  const normalizedNew = normalizeSubscriptionName(newName);
  const duplicates: DuplicateMatch[] = [];

  existingSubscriptions.forEach((sub) => {
    const normalizedExisting = normalizeSubscriptionName(sub.name);
    
    // Check normalized names for exact match
    if (normalizedNew === normalizedExisting) {
      duplicates.push({
        subscription: sub,
        similarity: 100,
        reason: 'Same service detected (e.g., Netflix, Netflix Premium)',
      });
      return;
    }
    
    // Check regular similarity
    const nameSimilarity = calculateSimilarity(newName, sub.name);
    
    if (nameSimilarity >= threshold) {
      duplicates.push({
        subscription: sub,
        similarity: nameSimilarity,
        reason: `Name is ${nameSimilarity.toFixed(0)}% similar`,
      });
    }
  });

  return duplicates.sort((a, b) => b.similarity - a.similarity);
};