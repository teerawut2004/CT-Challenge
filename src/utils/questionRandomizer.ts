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
 * Returns a fresh randomized list of questions for the specified level.
 * - For Levels 1-4: Selects 5 random questions from the level's question pool.
 * - For Level 5 (Boss Challenge): Randomly picks 1 full scenario (4 pillar questions) or draws 1 question from each CT pillar.
 */
export function getRandomizedQuestionsForLevel(levelId: number, count: number = 5): Question[] {
  const levelData = questionsData.find(lvl => lvl.id === levelId);
  if (!levelData || !levelData.questions || levelData.questions.length === 0) {
    return [];
  }

  // Boss Stage / Level 5: Pick 1 from each pillar or a full coherent randomized scenario
  if (levelId === 5) {
    if (bossScenariosPool && bossScenariosPool.length > 0) {
      // Pick a random scenario from pool
      const randomScenario = bossScenariosPool[Math.floor(Math.random() * bossScenariosPool.length)];
      return [...randomScenario.questions];
    }
    // Fallback: shuffle questions from level 5
    return sampleRandomItems(levelData.questions, 4);
  }

  // Levels 1 to 4: Sample 5 questions randomly from the rich question pool
  return sampleRandomItems(levelData.questions, count);
}
