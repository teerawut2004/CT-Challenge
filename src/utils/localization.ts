import { Question } from '../data/questions';

/**
 * Localizes a question object by replacing default character placeholder names
 * ("กวิน", "พอใจ") with the student's custom character nickname.
 */
export function localizeQuestion(q: Question, name: string): Question {
  if (!name || name.trim() === '') return q;
  const targetName = name.trim();
  
  const replaceNames = (str?: string): string => {
    if (!str) return '';
    // Replace both กวิน and พอใจ with the custom character name
    return str.replace(/กวิน/g, targetName).replace(/พอใจ/g, targetName);
  };

  return {
    ...q,
    question: replaceNames(q.question),
    description: q.description ? replaceNames(q.description) : undefined,
    options: q.options ? q.options.map(o => replaceNames(o)) : undefined,
    items: q.items ? q.items.map(i => replaceNames(i)) : undefined,
    matchingLeft: q.matchingLeft ? q.matchingLeft.map(l => replaceNames(l)) : undefined,
    matchingRight: q.matchingRight ? q.matchingRight.map(r => replaceNames(r)) : undefined,
    categorizeItems: q.categorizeItems ? q.categorizeItems.map(ci => ({
      ...ci,
      text: replaceNames(ci.text)
    })) : undefined,
    hint: replaceNames(q.hint)
  };
}
