import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, Search, Sparkles, Loader2 } from 'lucide-react';
import { getEventSuggestions } from '../services/geminiService';

const HOLIDAYS = [
  { name: "New Year's Day", month: 0, day: 1 },
  { name: "Valentine's Day", month: 1, day: 14 },
  { name: "Children's Day", month: 3, day: 30 },
  { name: "Mother's Day", month: 4, day: 10 },
  { name: "Father's Day", month: 5, day: 15 },
  { name: "Halloween", month: 9, day: 31 },
  { name: "Day of the Dead", month: 10, day: 2 },
  { name: "Christmas", month: 11, day: 25 },
];

export const EventSuggestions = () => {
  const [currentHoliday, setCurrentHoliday] = useState<{ name: string; recommendations: any[] } | null>(null);
  const [personalEvent, setPersonalEvent] = useState('');
  const [personalRecs, setPersonalRecs] = useState<any[]>([]);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [loadingHoliday, setLoadingHoliday] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  useEffect(() => {
    const detectHoliday = async () => {
      setLoadingHoliday(true);
      const now = new Date();
      
      // Find the closest upcoming holiday
      let closest = HOLIDAYS[0];
      let minDiff = Infinity;

      HOLIDAYS.forEach(h => {
        const holidayDate = new Date(now.getFullYear(), h.month, h.day);
        if (holidayDate < now) {
          holidayDate.setFullYear(now.getFullYear() + 1);
        }
        const diff = holidayDate.getTime() - now.getTime();
        if (diff < minDiff) {
          minDiff = diff;
          closest = h;
        }
      });

      const recs = await getEventSuggestions(closest.name);
      setCurrentHoliday({ name: closest.name, recommendations: recs });
      setLoadingHoliday(false);
    };

    detectHoliday();
  }, []);

  const handlePersonalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalEvent.trim()) return;
    setLoadingPersonal(true);
    setPersonalError(null);
    const result = await getEventSuggestions(personalEvent);
    
    if (result && !Array.isArray(result) && result.error) {
      setPersonalError(result.error);
      setPersonalRecs([]);
    } else {
      setPersonalRecs(Array.isArray(result) ? result : []);
    }
    setLoadingPersonal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Holiday Section */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-emerald-green font-black uppercase tracking-[0.2em] text-sm flex items-center gap-2">
            <Calendar size={16} /> Upcoming Special Date
          </h3>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between">
            {loadingHoliday ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="animate-spin text-emerald-green" size={32} />
                <p className="text-neutral-500 font-medium text-xs tracking-widest uppercase">Consulting AI...</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-3xl font-black text-neutral-900 dark:text-white uppercase leading-none tracking-tighter mb-2">
                    {currentHoliday?.name}
                  </h4>
                  <p className="text-neutral-500 text-sm">Smart suggestions for this celebration.</p>
                </div>
                
                <ul className="space-y-4">
                  {currentHoliday?.recommendations.map((item, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group"
                    >
                      <div className="font-bold text-neutral-900 dark:text-white group-hover:text-emerald-green transition-colors">{item.name}</div>
                      <div className="text-xs text-neutral-500 italic">{item.reason}</div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </div>

        {/* Personal Event Section */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-emerald-green font-black uppercase tracking-[0.2em] text-sm flex items-center gap-2">
            <Gift size={16} /> Your Special Events
          </h3>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] h-full">
            <form onSubmit={handlePersonalSearch} className="mb-6">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="E.g.: Wedding, XV Years, Birthday..." 
                  value={personalEvent}
                  onChange={(e) => setPersonalEvent(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border-none p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-green outline-none transition-all pr-12 text-neutral-900 dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={loadingPersonal}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-green text-white rounded-lg hover:scale-105 transition active:scale-95 disabled:opacity-50"
                >
                  {loadingPersonal ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>
            </form>

            <AnimatePresence mode="wait">
              {personalError ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center"
                >
                  <p className="text-red-500 text-xs font-bold leading-relaxed">
                    {personalError}
                  </p>
                </motion.div>
              ) : personalRecs.length > 0 ? (
                <motion.ul 
                  key="recs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {personalRecs.map((item, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="font-bold text-neutral-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-neutral-500 italic">{item.reason}</div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-32 flex flex-col items-center justify-center text-center text-neutral-400 space-y-2"
                >
                  <Sparkles size={32} strokeWidth={1} />
                  <p className="text-xs font-medium tracking-widest uppercase">Describe your event and Versusfy will help you</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
