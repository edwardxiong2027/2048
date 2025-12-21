import { GoogleGenAI, Type } from "@google/genai";
import { AIHintResponse } from "../types";

// Prefer Vite env keys, fall back to process for safety
const apiKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof import.meta !== "undefined" && import.meta.env?.GEMINI_API_KEY) ||
  // process is undefined in the browser unless Vite replaces it; guard to avoid ReferenceErrors
  (typeof process !== "undefined" ? (process.env.API_KEY as string | undefined) : undefined);

// Only initialize the client when a key exists to avoid crashing the app in dev.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = "gemini-2.5-flash";

export const getBestMove = async (matrix: number[][]): Promise<AIHintResponse> => {
  if (!ai) {
    return { direction: "UP", reason: "AI key missing; showing a safe default." };
  }

  const boardString = JSON.stringify(matrix);
  
  const prompt = `
    You are an expert at the game 2048. 
    Here is the current board state as a 4x4 matrix (0 represents empty):
    ${boardString}
    
    Analyze the board. Determine the single best move (UP, DOWN, LEFT, RIGHT) to maximize score and keep the board organized.
    Return ONLY a JSON object with the best direction and a short strategic reason (max 15 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            direction: {
              type: Type.STRING,
              enum: ["UP", "DOWN", "LEFT", "RIGHT"],
              description: "The optimal direction to move."
            },
            reason: {
              type: Type.STRING,
              description: "A very short explanation of why this move is best."
            }
          },
          required: ["direction", "reason"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIHintResponse;
  } catch (error) {
    console.error("AI Hint Error:", error);
    // Fallback if AI fails
    return { direction: "UP", reason: "AI is sleeping... try any move!" };
  }
};

export const getGameCommentary = async (score: number, won: boolean): Promise<string> => {
  if (!ai) return won ? "You are a legend!" : "Good effort, try again!";

  const style = won ? "celebratory and epic" : "witty, slightly sarcastic but encouraging";
  const prompt = `
    I just finished playing a game of 2048.
    My score: ${score}.
    Result: ${won ? "WON (Reached 2048!)" : "Game Over"}.
    
    Give me a one-sentence reaction to my performance. Make it ${style}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Nice game!";
  } catch (error) {
    return won ? "You are a legend!" : "Good effort, try again!";
  }
};
