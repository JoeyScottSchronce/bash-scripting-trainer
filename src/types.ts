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

export interface ProgressEvaluationResult {
  correct: boolean;
  summary: string;
  issues: string[];
  hints: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type AppState = 'DASHBOARD' | 'LOADING_CHALLENGE' | 'PRACTICE' | 'GRADING' | 'FEEDBACK';

export type CommandDifficultyKey = `${string}|${Difficulty}`;

export interface SessionState {
  trainerMode: boolean;
  selectedCommand: string | null;
  currentChallenge: Challenge | null;
  lastResult: GradingResult | null;
  history: { challenge: Challenge; result: GradingResult; submission: string }[];
  /**
   * Stores the most recent challenges shown to the user within the current
   * session, scoped by `command|difficulty`. Used to steer generation away from
   * exact repeats.
   */
  recentChallengesByKey: Record<CommandDifficultyKey, Pick<Challenge, "description" | "context">[]>;
  /**
   * Tracks generated challenge fingerprints within the current session,
   * scoped by `command|difficulty`.
   */
  seenChallengeFingerprintsByKey: Record<CommandDifficultyKey, string[]>;
}
