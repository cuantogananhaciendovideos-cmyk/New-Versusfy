import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Utensils, DollarSign, Loader2, CheckCircle2, XCircle, ShoppingCart, Info } from 'lucide-react';
import { analyzeRecipeBudget } from '../services/geminiService';

import { speak as omniSpeak, stopSpeaking as omniStop } from '../lib/speech';

export const RecipeBudgetConsultant = () => {
  const [recipe, setRecipe] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    omniSpeak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe.trim() || !budget.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRecipeBudget(recipe, ingredients, budget);
      if (result) {
        setReport(result);
      } else {
        setError("Could not analyze recipe. Please try again.");
      }
    } catch (err) {
      setError("Analysis failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 border-t border-neutral-100 dark:border-neutral-800">
      <div className="flex flex-col space-y-4 mb-8">
        <h3 className="text-emerald-green font-black uppercase tracking-[0.2em] text-sm flex items-center gap-2">
          <ChefHat size={16} /> Culinary Budget Consultant
        </h3>
        <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Plan your meals with Walmart Pricing Analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 rounded-3xl shadow-lg">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block">Recipe Name</label>
              <input 
                type="text" 
                placeholder="E.g.: Homemade Lasagna"
                value={recipe}
                onChange={(e) => setRecipe(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-green outline-none transition-all text-neutral-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block">Ingredients You Have (Optional)</label>
              <textarea 
                placeholder="E.g.: Salt, Pepper, Olive Oil..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-green outline-none transition-all text-neutral-900 dark:text-white font-bold h-24"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block">Target Budget for Missing Items ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="number" 
                  placeholder="25.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 p-4 pl-10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-green outline-none transition-all text-neutral-900 dark:text-white font-bold"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-green text-white rounded-xl font-black uppercase tracking-tighter hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Costs...
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Check Walmart Feasibility
                </>
              )}
            </button>
          </form>
        </div>

        {/* Report Section */}
        <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl min-h-[300px] flex flex-col">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-green/20 border-t-emerald-green rounded-full animate-spin" />
                  <Utensils className="absolute inset-0 m-auto text-emerald-green" size={24} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Scanning Walmart Intelligence...</p>
              </motion.div>
            ) : report ? (
              <motion.div 
                key="report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter leading-none">{recipe}</h4>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Walmart Pricing Estimate</p>
                  </div>
                  <div className={`p-2 rounded-xl border ${report.isFeasible ? 'bg-emerald-green/10 border-emerald-green text-emerald-green' : 'bg-apple-red/10 border-apple-red text-apple-red'}`}>
                    {report.isFeasible ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <span className="block text-[10px] font-black uppercase text-neutral-400">Total Est.</span>
                    <span className="text-xl font-black text-neutral-900 dark:text-white">${report.estimatedTotal.toFixed(2)}</span>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <span className="block text-[10px] font-black uppercase text-neutral-400">Your Budget</span>
                    <span className="text-xl font-black text-emerald-green">${parseFloat(budget).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase text-neutral-400">Price Breakdown</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {report.priceBreakdown.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
                        <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'provided' ? 'bg-emerald-green' : 'bg-orange-500'}`} />
                          {item.item}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white">${item.estPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-green/10 rounded-xl border border-emerald-green/20">
                  <h5 className="flex items-center gap-2 font-black text-emerald-green uppercase text-[10px] mb-1">
                    <Info size={12} /> Walmart Efficiency Tip
                  </h5>
                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                    {report.walmartEfficiencyReport}
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 rounded-xl text-white text-center relative group">
                  <p className="text-xs font-bold leading-relaxed">{report.verdict}</p>
                  <button 
                    onClick={() => speak(report.verdict)}
                    className={`absolute -top-3 -right-3 p-2 rounded-full shadow-lg transition-all ${isSpeaking ? 'bg-emerald-green text-white animate-pulse' : 'bg-white text-neutral-500 hover:text-emerald-green'}`}
                  >
                    <Utensils size={14} className={isSpeaking ? 'animate-bounce' : ''} />
                  </button>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow flex flex-col items-center justify-center text-center space-y-2 text-apple-red"
              >
                <XCircle size={32} />
                <p className="text-xs font-black uppercase tracking-widest">{error}</p>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow flex flex-col items-center justify-center text-center space-y-4 text-neutral-400"
              >
                <Utensils size={48} strokeWidth={1} />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Ready for Analysis</p>
                  <p className="text-[10px] uppercase font-bold mt-1 max-w-[200px]">Input your recipe and target budget to see if Walmart deals save the day.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
