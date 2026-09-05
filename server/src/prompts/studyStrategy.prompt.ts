/**
 * StudyPal Pedagogical Strategies & Cognitive Science Models
 */

export interface LearningTechnique {
  name: string;
  shortDescription: string;
  recommendedUse: string;
  steps: string[];
}

export const PEDAGOGICAL_FRAMEWORKS: Record<string, LearningTechnique> = {
  ACTIVE_RECALL: {
    name: 'Active Recall Testing',
    shortDescription: 'Retrieval practice that strengthens neural pathways faster than passive reading.',
    recommendedUse: 'Use after completing any concept learning session.',
    steps: [
      'Close your notes/book immediately after reading a section.',
      'Write down or explain out loud everything you remember without looking.',
      'Check back to identify gaps and errors in your mental model.'
    ]
  },
  FEYNMAN_TECHNIQUE: {
    name: 'Feynman Technique',
    shortDescription: 'Simplify complex formulas and concepts until a 10-year-old could understand them.',
    recommendedUse: 'Use for HARD or WEAK confidence subjects.',
    steps: [
      'Pick the core concept or theorem.',
      'Explain it in plain English using simple analogies.',
      'Whenever you hit jargon or a hand-wavy step, go back to source material.',
      'Refine the explanation into a crisp 3-sentence summary.'
    ]
  },
  SPACED_REPETITION: {
    name: 'Spaced Repetition Intervals',
    shortDescription: 'Revisit material at mathematically increasing intervals (Day 1, Day 3, Day 7, Day 14).',
    recommendedUse: 'Used by StudyPal scheduler for revision tasks.',
    steps: [
      'Day 1: Initial deep learning and problem solving.',
      'Day 3: 20-minute active recall drill.',
      'Day 7: Past exam question practice.',
      'Day 14+: Sectional mock test simulation.'
    ]
  },
  POMODORO_FLOW: {
    name: '50/10 Focus Cycles',
    shortDescription: '50 minutes of deep uninterrupted study followed by 10 minutes of complete cognitive rest.',
    recommendedUse: 'Recommended for all 60-90 minute study blocks.',
    steps: [
      'Turn off all phone notifications and close irrelevant browser tabs.',
      'Set a 50-minute timer and focus strictly on one task.',
      'Take a 10-minute screen-free break (walk, drink water, stretch).'
    ]
  }
};
