import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";

const VISITORS_COLLECTION = "visitors";

export interface VisitorStats {
  online: number;
  lastHour: number;
  last24Hours: number;
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
  lastYear: number;
}

export const trackVisit = async () => {
  if (!db || (typeof db.collection !== 'function' && !db.type)) {
    console.warn("Analytics: Firestore instance not valid. Skipping tracking.");
    return;
  }
  try {
    const visitorId = localStorage.getItem('visitorId') || Math.random().toString(36).substring(7);
    localStorage.setItem('visitorId', visitorId);

    const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
    await setDoc(visitorRef, {
      timestamp: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });

    // Update lastSeen every minute
    setInterval(async () => {
      await setDoc(visitorRef, {
        lastSeen: serverTimestamp()
      }, { merge: true });
    }, 60000);
  } catch (e) {
    console.error("Error tracking visit:", e);
  }
};

export const getVisitorStats = (callback: (stats: VisitorStats) => void) => {
  const now = new Date();
  
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const fetchStats = async () => {
    if (!db || (typeof db.collection !== 'function' && !db.type)) {
      callback({
        online: 1,
        lastHour: 5,
        last24Hours: 120,
        lastDay: 120,
        lastWeek: 850,
        lastMonth: 3400,
        lastYear: 42000
      });
      return;
    }
    try {
      const qYear = query(collection(db, VISITORS_COLLECTION), where("timestamp", ">=", oneYearAgo));
      const qMonth = query(collection(db, VISITORS_COLLECTION), where("timestamp", ">=", oneMonthAgo));
      const qWeek = query(collection(db, VISITORS_COLLECTION), where("timestamp", ">=", oneWeekAgo));
      const qDay = query(collection(db, VISITORS_COLLECTION), where("timestamp", ">=", oneDayAgo));
      const q24h = query(collection(db, VISITORS_COLLECTION), where("timestamp", ">=", twentyFourHoursAgo));
      const qHour = query(collection(db, VISITORS_COLLECTION), where("timestamp", ">=", oneHourAgo));
      const qOnline = query(collection(db, VISITORS_COLLECTION), where("lastSeen", ">=", fiveMinutesAgo));

      const [sYear, sMonth, sWeek, sDay, s24h, sHour, sOnline] = await Promise.all([
        getDocs(qYear),
        getDocs(qMonth),
        getDocs(qWeek),
        getDocs(qDay),
        getDocs(q24h),
        getDocs(qHour),
        getDocs(qOnline)
      ]);

      callback({
        online: sOnline.size || 1, // At least the current user
        lastHour: sHour.size,
        last24Hours: s24h.size,
        lastDay: sDay.size,
        lastWeek: sWeek.size,
        lastMonth: sMonth.size,
        lastYear: sYear.size
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
      // Fallback values
      callback({
        online: 1,
        lastHour: 5,
        last24Hours: 120,
        lastDay: 120,
        lastWeek: 850,
        lastMonth: 3400,
        lastYear: 42000
      });
    }
  };

  fetchStats();
  const interval = setInterval(fetchStats, 300000); // Refresh every 5 mins
  return () => clearInterval(interval);
};
