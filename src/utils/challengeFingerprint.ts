import type { Challenge, CommandDifficultyKey, Difficulty } from "../types";

export function makeCommandDifficultyKey(command: string, difficulty: Difficulty): CommandDifficultyKey {
  return `${command}|${difficulty}` as CommandDifficultyKey;
}

function normalizeForFingerprint(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function fingerprintChallenge(challenge: Pick<Challenge, "description" | "context">): string {
  const description = normalizeForFingerprint(challenge.description);
  const context = normalizeForFingerprint(challenge.context);
  return `${description}\n${context}`;
}

