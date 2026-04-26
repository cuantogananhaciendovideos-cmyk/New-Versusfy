import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit } from "firebase/firestore";

const PRICE_ALERTS_COLLECTION = "price_alerts";

export interface PriceAlert {
  id?: string;
  email: string;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: any;
  status: 'active' | 'triggered' | 'cancelled';
}

export const createPriceAlert = async (email: string, productName: string, targetPrice: number, currentPrice: number) => {
  if (!db || (typeof db.collection !== 'function' && !db.type)) {
    console.warn("PriceService: Firestore instance not valid. Alert not saved.");
    return "mock-id";
  }
  try {
    const alert: PriceAlert = {
      email,
      productName,
      targetPrice,
      currentPrice,
      createdAt: serverTimestamp(),
      status: 'active'
    };
    const docRef = await addDoc(collection(db, PRICE_ALERTS_COLLECTION), alert);
    return docRef.id;
  } catch (error) {
    console.error("Error creating price alert:", error);
    throw error;
  }
};

// Mock function to simulate price history for charts
export const getPriceHistory = (productName: string) => {
  const basePrice = 100 + Math.random() * 500;
  const history = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: basePrice + (Math.random() - 0.5) * 50
    });
  }
  return history;
};
