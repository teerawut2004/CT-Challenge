import { Question, questionsData, bossScenariosPool } from '../data/questions';

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Samples N random items from an array without replacement
 */
export function sampleRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Returns the question list for the specified level.
 * - Levels 1-4: Exactly 1 question focusing specifically on that pillar.
 * - Level 5: 1 integrated question requiring the application of all 4 CT pillars.
 */
export function getRandomizedQuestionsForLevel(levelId: number, count: number = 1): Question[] {
  const levelData = questionsData.find(lvl => lvl.id === levelId);
  if (!levelData || !levelData.questions || levelData.questions.length === 0) {
    return [];
  }

  // Boss Stage / Level 5: Pick the integrated scenario question
  if (levelId === 5) {
    if (bossScenariosPool && bossScenariosPool.length > 0) {
      return [...bossScenariosPool[0].questions];
    }
    return [...levelData.questions];
  }

  // Levels 1 to 4: Return representative question for this pillar
  return [...levelData.questions];
}
