import { GoogleGenAI, Type } from "@google/genai";
import {
  CanonicalEvaluationPayload,
  Challenge,
  Difficulty,
  GradingResult,
  ProgressEvaluationResult,
} from "../types";

const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY || ""});

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
}

function looksLikeCodeOrSolution(text: string): boolean {
  // Block fenced code, inline code, and common full-command patterns.
  if (/```/m.test(text)) return true;
  if (/`[^`]+`/m.test(text)) return true;
  // Heuristic: lines that look like full shell commands with pipes/redirects/flags.
  if (/^\s*\$?\s*\w[\w-]*(\s+-{1,2}[\w-]+|\s+\S+)+(?:\s*[|>]\s*\S+)+/m.test(text)) return true;
  if (/^\s*\$?\s*\w[\w-]*\s+-{1,2}[\w-]+/m.test(text)) return true;
  return false;
}

function sanitizeProgressEvaluation(result: ProgressEvaluationResult): ProgressEvaluationResult {
  const combined = [result.summary, ...(result.issues ?? []), ...(result.hints ?? [])].join("\n");

  if (looksLikeCodeOrSolution(combined)) {
    return {
      correct: false,
      summary:
        "I can’t show a full command or a complete solution here, but I can still help you spot what to improve.",
      issues: [
        "Your current attempt is missing one or more key pieces required by the prompt (or has a logical mismatch).",
      ],
      hints: [
        "Re-read the challenge and verify the output requirement matches exactly.",
        "Check whether you need a specific flag, a regex/pattern, or correct input source (file vs stdin).",
        "If the command supports it, consider whether piping a helper tool into/out of it is needed—but keep the target command as the primary focus.",
      ],
      confidence: "LOW",
    };
  }

  if (result.correct) {
    return {
      ...result,
      summary:
        result.summary?.trim().length > 0
          ? result.summary
          : "Your command looks correct. Go ahead and submit it.",
      issues: [],
      hints: [],
    };
  }

  return result;
}

type AvoidChallenge = Pick<Challenge, "description" | "context">;

export async function generateChallenge(
  command: string,
  difficulty: Difficulty = "BEGINNER",
  options?: {
    avoidExactChallenges?: AvoidChallenge[];
  }
): Promise<Challenge> {
  const avoidBlock =
    options?.avoidExactChallenges && options.avoidExactChallenges.length > 0
      ? `\n\nDo NOT repeat any of the following challenges exactly (same task/wording). Generate a different task:\n${options.avoidExactChallenges
          .slice(0, 5)
          .map(
            (c, idx) =>
              `${idx + 1}. Description: ${c.description}\n   Context: ${c.context}`
          )
          .join("\n")}`
      : "";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Generate a Bash one-liner challenge where the target command is: ${command}.
Difficulty Level: ${difficulty}.

Requirements:
- The challenge must be solvable with a single line of bash.
- The target command (${command}) MUST be the primary focus/learning objective of the task.
- Using pipes and supporting commands (e.g. cat, sort, uniq, head, tail, tr, xargs, awk, sed, cut, etc.) alongside ${command} is allowed and encouraged when it helps create a more realistic scenario and avoids repetition, so long as the target command is the primary focus.
- Provide a description of the task and a sample input/output context if applicable.
- Also provide a canonical expected command one-liner that correctly solves the exact generated scenario.
- The canonical expected command must be specific to the generated context and keep ${command} as the primary learning objective.
- Description and context must not require behavior stricter than what the canonical expected command achieves (wording must align with that solution).${avoidBlock}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Clear description of what the user needs to do." },
          context: { type: Type.STRING, description: "Sample input or environment context (e.g. 'You have a file named data.txt with...') " },
          expectedCommand: { type: Type.STRING, description: "Canonical expected one-liner solution for the generated challenge context." },
          expectedCommandHint: { type: Type.STRING, description: "A small generic hint about the command structure without providing the answer to the question (e.g. Use 'command -flags file_name', not 'cut -f 4,5,7-9 spreadsheet.ods'.)." },
          difficulty: { type: Type.STRING, enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] }
        },
        required: ["description", "context", "expectedCommand", "expectedCommandHint", "difficulty"]
      },
      systemInstruction: "You are an expert Bash scripting tutor. You generate concise, educational one-liner challenges for specific Linux commands. Focus on practical, real-world scenarios."
    }
  });

  try {
    const cleanedText = cleanJsonResponse(response.text || "{}");
    return JSON.parse(cleanedText) as Challenge;
  } catch (e) {
    throw new Error("Failed to parse AI response for challenge generation.");
  }
}

const CONFIDENCE_LEVELS = new Set<CanonicalEvaluationPayload["confidence"]>(["LOW", "MEDIUM", "HIGH"]);

function normalizeCanonicalEvaluationPayload(raw: unknown): CanonicalEvaluationPayload {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const confidence =
    CONFIDENCE_LEVELS.has(o.confidence as CanonicalEvaluationPayload["confidence"])
      ? (o.confidence as CanonicalEvaluationPayload["confidence"])
      : "MEDIUM";
  return {
    correct: Boolean(o.correct),
    feedback: typeof o.feedback === "string" ? o.feedback : "",
    summary: typeof o.summary === "string" ? o.summary : "",
    issues: Array.isArray(o.issues) ? o.issues.filter((x): x is string => typeof x === "string") : [],
    hints: Array.isArray(o.hints) ? o.hints.filter((x): x is string => typeof x === "string") : [],
    confidence,
  };
}

async function evaluateAgainstCanonical(
  challenge: Challenge,
  submission: string
): Promise<CanonicalEvaluationPayload> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `
Challenge Description: ${challenge.description}
Context: ${challenge.context}
Canonical Expected Command (authoritative reference; do not show to the user): ${challenge.expectedCommand}

User Submission:
${submission}

You are evaluating a Bash one-liner for this single scenario.

Correctness rules:
- Correctness is defined ONLY against the Canonical Expected Command plus the stated description/context. If the user submission is semantically equivalent Bash for this scenario (same practical outcome), set correct=true.
- Do NOT require extra flags, pipes, quoting, verbosity, or steps beyond what the Canonical Expected Command uses. Never ask the user to add details that the canonical solution does not include.
- If the submission matches the canonical solution's behavior for the described task, set correct=true and use empty issues and empty hints.
- If correct=false, explain gaps only relative to what the canonical command achieves for this task.

Output fields:
- feedback: Gentle, conversational explanation for a submit/results screen. Do not paste the full canonical command here.
- summary, issues, hints: For a progress/hint UI. You MUST NOT include full shell commands, code blocks, or backticks in summary, issues, or hints. Use concept-level wording only (e.g. "the right flag family", "input source").
- If correct=true: summary should affirm success and suggest submitting; issues MUST be []; hints MUST be [].
`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          correct: { type: Type.BOOLEAN },
          feedback: {
            type: Type.STRING,
            description: "Gentle feedback for submit UI; no full canonical command.",
          },
          summary: {
            type: Type.STRING,
            description: "1–3 sentences; no commands or backticks.",
          },
          issues: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Problems with the attempt; no commands or backticks.",
          },
          hints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Concept-level hints; no commands or backticks.",
          },
          confidence: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
        },
        required: ["correct", "feedback", "summary", "issues", "hints", "confidence"],
      },
      systemInstruction:
        "You are an expert Bash tutor. Grade without executing code. The Canonical Expected Command is the only gold standard for what is required; accept valid equivalents; never demand extras the canonical line does not use. Never put full commands or backticks in summary, issues, or hints. Be brief and precise.",
    },
  });

  try {
    const cleanedText = cleanJsonResponse(response.text || "{}");
    return normalizeCanonicalEvaluationPayload(JSON.parse(cleanedText));
  } catch {
    throw new Error("Failed to parse AI response for canonical evaluation.");
  }
}

export async function gradeSubmission(challenge: Challenge, submission: string): Promise<GradingResult> {
  const payload = await evaluateAgainstCanonical(challenge, submission);
  return {
    correct: payload.correct,
    feedback: payload.feedback,
    solution: challenge.expectedCommand,
  };
}

export async function evaluateProgress(
  challenge: Challenge,
  submission: string,
  options?: { compactWhenCorrect?: boolean }
): Promise<ProgressEvaluationResult> {
  const compactWhenCorrect = options?.compactWhenCorrect ?? true;
  const payload = await evaluateAgainstCanonical(challenge, submission);
  const progress: ProgressEvaluationResult = {
    correct: payload.correct,
    summary: payload.summary,
    issues: payload.issues,
    hints: payload.hints,
    confidence: payload.confidence,
  };
  const sanitized = sanitizeProgressEvaluation(progress);
  if (compactWhenCorrect && sanitized.correct) {
    return { ...sanitized, issues: [], hints: [] };
  }
  return sanitized;
}
