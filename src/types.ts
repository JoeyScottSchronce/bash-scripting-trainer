export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Challenge {
  description: string;
  context: string;
  expectedCommandHint: string;
  difficulty: Difficulty;
}

export interface GradingResult {
  correct: boolean;
  feedback: string;
  solution: string;
}

export type AppState = 'DASHBOARD' | 'LOADING_CHALLENGE' | 'PRACTICE' | 'GRADING' | 'FEEDBACK';

export interface SessionState {
  selectedCommand: string | null;
  currentChallenge: Challenge | null;
  lastResult: GradingResult | null;
  history: { challenge: Challenge; result: GradingResult; submission: string }[];
}
