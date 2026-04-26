import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, updateDoc, onSnapshot } from "firebase/firestore";

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

export interface ShoppingDesire {
  id?: string;
  userId: string;
  rawInput: string;
  category: string;
  features: string[];
  style: string;
  maxBudget: number;
  location: string;
  whatsapp?: string;
  email?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface PersonalBuyerAlert {
  id?: string;
  desireId: string;
  userId: string;
  productName: string;
  price: number;
  storeName: string;
  location: string;
  matchReason: string;
  link: string;
  createdAt: string;
  read: boolean;
}

const DESIRES_COLLECTION = "shopping_desires";
const ALERTS_COLLECTION = "personal_buyer_alerts";

export const parseDesire = async (input: string, userId: string) => {
  console.log("PersonalBuyer: Parsing desire:", input);
  const prompt = `You are "My Personal Buyer", a highly intelligent shopping assistant.
  Parse the following user desire into a structured JSON object.
  User Input: "${input}"
  
  CRITICAL RULE:
  - You ONLY support the following integrated stores: Amazon, Walmart, eBay, Home Depot, and Best Buy.
  - If the user specifically asks for a store NOT in this list, you MUST include a polite message in the "confirmationMessage" field saying: "I'm sorry, I don't have that store on my system yet. I can only help you find products at Amazon, Walmart, eBay, Home Depot, and Best Buy."
  - If the desire is generic (no store mentioned), proceed normally but keep in mind you only search these 5 stores.
  
  Rules:
  - Identify category, features (array), style, maxBudget (number), and location.
  - If budget is not mentioned, set it to 0.
  - If location is not mentioned, set it to "Unknown".
  - Provide a friendly confirmation message in English.
  
  Return JSON:
  {
    "category": "string",
    "features": ["string"],
    "style": "string",
    "maxBudget": number,
    "location": "string",
    "confirmationMessage": "string",
    "unsupportedStore": boolean
  }`;

  try {
    const response = await callAiProxy({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are My Personal Buyer. You only work with Amazon, Walmart, eBay, Home Depot, and Best Buy. Default to English responses."
      }
    });

    console.log("PersonalBuyer: AI Response received:", response.text);
    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    console.error("PersonalBuyer: Error parsing desire:", error);
    throw error;
  }
};

export const saveDesire = async (desireData: any, userId: string, rawInput: string) => {
  if (!db) throw new Error("Firebase not initialized");
  
  const desire: ShoppingDesire = {
    userId,
    rawInput,
    category: desireData.category || "General",
    features: desireData.features || [],
    style: desireData.style || "Generic",
    maxBudget: desireData.maxBudget || 0,
    location: desireData.location || "Unknown",
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, DESIRES_COLLECTION), desire);
  return { id: docRef.id, ...desire };
};

export const getUserDesires = async (userId: string): Promise<ShoppingDesire[]> => {
  if (!db) return [];
  const q = query(collection(db, DESIRES_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingDesire));
};

export const getDesireAlerts = (userId: string, callback: (alerts: PersonalBuyerAlert[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, ALERTS_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalBuyerAlert));
    callback(alerts);
  });
};

export const markAlertAsRead = async (alertId: string) => {
  if (!db) return;
  const docRef = doc(db, ALERTS_COLLECTION, alertId);
  await updateDoc(docRef, { read: true });
};

// Simulation of a match (for demo purposes)
export const simulateMatch = async (desire: ShoppingDesire) => {
  if (!db) return;
  
  const prompt = `You are My Personal Buyer. A user has an active desire: ${JSON.stringify(desire)}.
  Simulate finding a perfect match (85% or higher).
  
  CRITICAL RULE:
  - You MUST ONLY choose from these stores: Amazon, Walmart, eBay, Home Depot, or Best Buy.
  - Generate a hyper-personalized alert in English.
  
  Return JSON:
  {
    "productName": "string",
    "price": number,
    "storeName": "string",
    "location": "string",
    "matchReason": "string",
    "alertText": "string",
    "link": "string"
  }`;

  try {
    const response = await callAiProxy({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are My Personal Buyer. You only find deals at Amazon, Walmart, eBay, Home Depot, and Best Buy."
      }
    });

    const match = JSON.parse(response.text || '{}');
    
    const alert: PersonalBuyerAlert = {
      desireId: desire.id!,
      userId: desire.userId,
      productName: match.productName,
      price: match.price,
      storeName: match.storeName,
      location: match.location,
      matchReason: match.matchReason,
      link: match.link || "#",
      createdAt: new Date().toISOString(),
      read: false
    };

    await addDoc(collection(db, ALERTS_COLLECTION), alert);

    // Send Real Email Notification via Gmail Proxy
    if (desire.email) {
      fetch("/api/notify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: desire.email,
          subject: `🛍️ Shopping Alert: ${alert.productName} found!`,
          text: `I found a match for your desire: "${desire.rawInput}"\n\nProduct: ${alert.productName}\nPrice: $${alert.price}\nStore: ${alert.storeName}\n\nLink: ${alert.link}`,
          html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Shopping Alert Found!</h2>
            <p>I found a match for your desire: <strong>"${desire.rawInput}"</strong></p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Product:</strong> ${alert.productName}</p>
              <p><strong>Price:</strong> $${alert.price}</p>
              <p><strong>Store:</strong> ${alert.storeName}</p>
            </div>
            <a href="${alert.link}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product Now</a>
          </div>`
        })
      }).catch(err => console.error("Failed to send Email:", err));
    }

    return alert;
  } catch (error) {
    console.error("Error simulating match:", error);
  }
};
