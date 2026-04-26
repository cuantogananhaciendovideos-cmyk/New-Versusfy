import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit } from "firebase/firestore";

const COUPONS_COLLECTION = "coupons";

export interface Coupon {
  id?: string;
  code: string;
  description: string;
  discount: string;
  store: string;
  expiryDate: string;
  createdAt: any;
}

export const getCouponsForProduct = async (productName: string): Promise<Coupon[]> => {
  try {
    if (!db || (typeof db.collection !== 'function' && !db.type)) throw new Error("Firebase not initialized");
    // In a real app, we'd search by product keywords. 
    // For now, we'll fetch all and filter or return some mock ones if empty.
    const q = query(collection(db, COUPONS_COLLECTION), limit(10));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
    }
  } catch (error) {
    console.warn("Error fetching coupons:", error);
  }

  // Fallback mock coupons
  return [
    {
      code: "SAVE20",
      description: "20% off on your next purchase",
      discount: "20%",
      store: "Amazon",
      expiryDate: "2026-12-31",
      createdAt: new Date().toISOString()
    },
    {
      code: "FREESHIP",
      description: "Free shipping on orders over $50",
      discount: "Free Shipping",
      store: "Walmart",
      expiryDate: "2026-06-30",
      createdAt: new Date().toISOString()
    },
    {
      code: "VERSUSFY10",
      description: "Exclusive Versusfy discount",
      discount: "$10 Off",
      store: "Best Buy",
      expiryDate: "2026-09-15",
      createdAt: new Date().toISOString()
    }
  ];
};
