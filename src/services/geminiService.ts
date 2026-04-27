import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

// Lazy initialization function to ensure runtimeConfig is ready
let aiInstance: GoogleGenAI | null = null;
function getAi() {
  const runtimeConfig = (window as any).VERSUSFY_RUNTIME_CONFIG || {};
  const apiKey = runtimeConfig.geminiApiKey === 'HIDDEN_PRESENT' ? "" : (runtimeConfig.geminiApiKey || process.env.GEMINI_API_KEY || "");
  
  if (!apiKey && runtimeConfig.geminiApiKey !== 'HIDDEN_PRESENT') {
    console.warn("Versusfy Gemini: API Key is missing. Check Railway environment variables.");
    return null;
  }
  
  if (!aiInstance && apiKey) {
    console.log(`Versusfy: Engine initialized with key ending in: ...${apiKey.slice(-4)}`);
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Unified generation helper that detects if it should use SDK or Proxy
 */
async function generateSmartContent(options: { 
  model: string, 
  contents: any, 
  systemInstruction?: string,
  responseMimeType?: string 
}) {
  const ai = getAi();
  const runtimeConfig = (window as any).VERSUSFY_RUNTIME_CONFIG || {};
  
  const payload = {
    model: options.model,
    contents: options.contents,
    config: {
      responseMimeType: options.responseMimeType || "application/json",
      systemInstruction: options.systemInstruction
    }
  };

  if (!ai && runtimeConfig.geminiApiKey === 'HIDDEN_PRESENT') {
    const response = await callAiProxy(payload);
    return response.text;
  } else if (ai) {
    const response = await callWithRetry(() => ai.models.generateContent(payload));
    return response.text;
  } else {
    throw new Error("AI Engine not available. Check your Railway Variable GEMINI_API_KEY.");
  }
}

// Helper to call server proxy
async function callAiProxy(payload: any) {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI Proxy request failed");
  }

  return response.json();
}

/**
 * Exponential backoff helper for quota errors (429)
 */
async function callWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000, modelOverride?: string): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isQuotaError = error?.status === 429 || 
                         errorStr.includes("429") || 
                         errorStr.toLowerCase().includes("quota") ||
                         errorStr.toLowerCase().includes("resource_exhausted");
                         
    if (isQuotaError && retries > 0) {
      console.warn(`Versusfy: Quota exceeded. Retrying in ${delay/1000}s... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay + (Math.random() * 1000))); // Add jitter
      return callWithRetry(fn, retries - 1, delay * 2, modelOverride);
    }
    throw error;
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const runtimeConfig = (window as any).VERSUSFY_RUNTIME_CONFIG || {};
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
        serverVersion: runtimeConfig.serverVersion
    }
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const compareProducts = async (productA: string, productB: string, location?: { lat: number; lng: number }, category: string = 'standard') => {
  const cacheKey = btoa(unescape(encodeURIComponent(`${productA}_${productB}_${category}_${location ? JSON.stringify(location) : 'noloc'}`))).replace(/=/g, '');
  
  if (db && (typeof db.collection === 'function' || db.type)) {
    const docRef = doc(db, "comparisons", cacheKey);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("Serving comparison from cache:", cacheKey);
        return docSnap.data();
      }
    } catch (error) {
      console.warn("Cache read error:", error);
    }
  }

  const prompt = `Compare ${productB} with ${productA}.
  
  CATEGORY CONTEXT: ${category === 'standard' ? 'Standard Product Comparison' : category.toUpperCase()}
  
  OMNI-MODE DETECTION: If the input contains "[OMNI-MODE]" or is from a specialized category, compare non-standard entities.
  
  SPECIFIC INSTRUCTIONS BY CATEGORY:
  - If Category is "PROMPTS": Compare two AI prompts based on structure, potential output quality, clarity, and token efficiency.
  - If Category is "WEBSITES": Compare two websites based on UI/UX, page speed (estimated), authority, and content quality.
  - If Category is "AI_MODELS": Compare two Large Language Models (LLMs) or Image Generators based on benchmarks, specialized capabilities (reasoning, coding, creative), and cost.
  - If Category is "RESTAURANTS": Compare two dining establishments based on menu diversity, price point, reputation, and localized factors for ${location ? JSON.stringify(location) : 'unknown'}.
  - If Category is "MECHANIC": Focus on automotive engineering, vehicle specs, and performance parts.
  - If Category is "ELECTRICIAN": Analyze home appliances for energy efficiency.
  
  Return detailed metrics, a scoring system (0-100), key differences, and a special "Marketing Package".
  For location context (${location ? JSON.stringify(location) : 'unknown'}), mention specific benefits for that region.
  
  MANDATORY PRODUCT SUGGESTION: Every comparison MUST include a 1-2 sentence "Smart Suggestion" in the marketing field for a related physical product available at Walmart, eBay, Amazon, Best Buy, or Home Depot.
  
  INCLUDE SUPREME ANALYTICS: Evaluate "Resale Value" (or Longevity), "Future-Proofing" (or Relevance), and "Build Quality" (or Reliability).`;
  
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      systemInstruction: `You are the Versusfy Supreme Engine. You are a world-class expert in comparing ANYTHING.
      Analyze technical data, user sentiment, stats, and global trends.
      Return ONLY a JSON object with this structure:
      {
        "title": "A vs B Comparison",
        "scoreA": 85,
        "scoreB": 78,
        "summary": "Expert summary",
        "differences": ["diff 1"],
        "table": [{"feature": "Metric", "valueA": "A", "valueB": "B"}],
        "verdict": "Winner",
        "index": {
           "performance": {"a": 90, "b": 85},
           "value": {"a": 92, "b": 80}
        },
        "marketing": { "exclusiveOffer": "offer", "couponCode": "VERSUSFY", "geoAlert": "report" }
      }`
    });
    
    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const result = JSON.parse(cleanText);

    if (db && (typeof db.collection === 'function' || db.type)) {
      try {
        const docRef = doc(db, "comparisons", cacheKey);
        await setDoc(docRef, result);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "comparisons/" + cacheKey);
      }
    }
    
    return result;
  } catch (error: any) {
    if (JSON.stringify(error).includes("429")) {
      throw new Error("LÍMITE DE GOOGLE: El cupo de esta API Key se ha agotado.");
    }
    console.error("Gemini API error:", error);
    throw error;
  }
};
;

export const getSimilarProducts = async (product: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: `List 10 similar products to ${product} sorted from A to Z.`,
      systemInstruction: "You are a specialized product comparison assistant. Return ONLY a JSON array of 10 similar product names sorted A-Z."
    });
    
    const cleanText = (text || '[]').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in getSimilarProducts:", error);
    return [];
  }
};

export const getEventSuggestions = async (event: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: `User event/request: ${event}. Provide 5 product suggestions.`,
      systemInstruction: "You are a shopping expert specialized in events and products. Respond as a JSON array of items."
    });
    
    const cleanText = (text || '[]').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in getEventSuggestions:", error);
    return [];
  }
};

export const identifyProduct = async (base64Content: string, mimeType: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: "Identify the product" }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "Identify model/brand and return JSON: { \"productName\": \"...\" }"
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const result = JSON.parse(cleanText);
    return result.productName || null;
  } catch (error) {
    console.error("Error identifying product:", error);
    return null;
  }
};

export const analyzePersonalStyle = async (base64Content: string, mimeType: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: "Analyze person in image" }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "You are the Supreme Stylist. Analyze features and return style JSON object."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzePersonalStyle:", error);
    return null;
  }
};

export const analyzeSpaceContext = async (base64Content: string, mimeType: string, budget?: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: `Analyze space. Budget: ${budget}` }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "You are the Space Architect. Analyze decoration and return JSON."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzeSpaceContext:", error);
    return null;
  }
};

export const analyzeGardeningContext = async (base64Content: string, mimeType: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: "Analyze terrain" }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "You are the Gardening Expert. Analyze terrain/soil and return JSON."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzeGardeningContext:", error);
    return null;
  }
};

export const analyzeMechanicContext = async (base64Content: string, mimeType: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: "Analyze vehicle issue" }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "You are the Mechanical Expert. Diagnose issue and return JSON."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzeMechanicContext:", error);
    return null;
  }
};

export const analyzeBuilderContext = async (base64Content: string, mimeType: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: "Analyze construction" }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "You are the Master Builder. Analyze structural phase and return JSON."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzeBuilderContext:", error);
    return null;
  }
};

export const analyzeOfficeContext = async (base64Content: string, mimeType: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: "Analyze office setup" }, { inlineData: { data: base64Content, mimeType } }] }],
      systemInstruction: "You are the Productivity Architect. Suggest improvements and return JSON."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzeOfficeContext:", error);
    return null;
  }
};

export const analyzeRecipeBudget = async (recipe: string, ingredients: string, budget: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: `Recipe: ${recipe}, Ingredients: ${ingredients}, Budget: ${budget}`,
      systemInstruction: "You are the Budget Consultant. Analyze feasibility at Walmart USA and return JSON."
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in analyzeRecipeBudget:", error);
    return null;
  }
};

export const chatWithOmniAssistant = async (query: string) => {
  try {
    const text = await generateSmartContent({
      model: "gemini-1.5-flash",
      contents: `User Query: ${query}`,
      systemInstruction: "You are the Versusfy Supreme Omni-Assistant. You represent the Pulsating Sphere of Intelligence. Personality: Sweet, Soft, and Tactical. Return ONLY JSON structure: { \"response\": \"...\", \"action\": \"none|compare\", \"suggestions\": [] }"
    });

    const cleanText = (text || '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error in chatWithOmniAssistant:", error);
    return { response: "Encountered a tactical error, dear.", action: "none", suggestions: [] };
  }
};
