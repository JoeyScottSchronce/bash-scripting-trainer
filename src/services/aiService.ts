import { GoogleGenAI, Type } from "@google/genai";
import { Challenge, GradingResult, Difficulty } from "../types";

const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY || ""});

function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
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
- Using pipes and supporting commands (e.g. cat, sort, uniq, head, tail, tr, xargs, awk, sed, cut, etc.) alongside ${command} is allowed and encouraged when it helps create a more realistic scenario and avoid repetition, so long as the target command is the primary focus.
- Provide a description of the task and a sample input/output context if applicable.${avoidBlock}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Clear description of what the user needs to do." },
          context: { type: Type.STRING, description: "Sample input or environment context (e.g. 'You have a file named data.txt with...') " },
          expectedCommandHint: { type: Type.STRING, description: "A small generic hint about the command structure without providing the answer to the question (e.g. Use 'command -flags file_name', not 'cut -f 4,5,7-9 spreadsheet.ods'.)." },
          difficulty: { type: Type.STRING, enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] }
        },
        required: ["description", "context", "expectedCommandHint", "difficulty"]
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

export async function gradeSubmission(challenge: Challenge, submission: string): Promise<GradingResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `
    Challenge Description: ${challenge.description}
    Context: ${challenge.context}
    User Submission: ${submission}

    Grade this submission. Is it correct? Does it achieve the goal described?
    Provide a gentle explanation if wrong and the correct solution.
    If the user's command is a valid alternative that works, mark it as correct.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          correct: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING, description: "Gentle feedback about the user's attempt." },
          solution: { type: Type.STRING, description: "The ideal one-liner solution." }
        },
        required: ["correct", "feedback", "solution"]
      },
      systemInstruction: "You are an expert Bash scripting tutor. You grade user submissions accurately without executing code. Be encouraging but precise. Accept valid alternative solutions."
    }
  });

  try {
    const cleanedText = cleanJsonResponse(response.text || "{}");
    return JSON.parse(cleanedText) as GradingResult;
  } catch (e) {
    throw new Error("Failed to parse AI response for grading.");
  }
}
