import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateQuiz(topic: string): Promise<QuizQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Génère un quiz médical de 5 questions sur le sujet suivant : ${topic}. 
    Le quiz doit être en français, précis et pédagogique.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "4 options de réponse"
            },
            correctAnswer: { 
              type: Type.INTEGER,
              description: "Index de la réponse correcte (0-3)"
            },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse quiz response", e);
    return [];
  }
}

export async function getMedicalExplanation(structure: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Fournis une explication médicale concise et précise pour la structure anatomique suivante : ${structure}. 
    L'explication doit être en français, adaptée à un étudiant en médecine, et inclure sa fonction principale. 
    Limite-toi à 3-4 phrases.`,
  });

  return response.text || "Explication non disponible.";
}
