import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bell, TrendingDown, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPriceHistory, createPriceAlert } from '../services/priceService';

interface PriceTrackerProps {
  productName: string;
  currentPrice?: number;
}

export const PriceTracker: React.FC<PriceTrackerProps> = ({ productName, currentPrice = 0 }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(currentPrice * 0.9);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setHistory(getPriceHistory(productName));
  }, [productName]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !targetPrice) return;
    setLoading(true);
    try {
      await createPriceAlert(email, productName, targetPrice, currentPrice);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <TrendingDown className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Price Tracking</h3>
          <p className="text-sm text-gray-400">Monitor price trends and set alerts</p>
        </div>
      </div>

      <div className="h-[250px] w-full mb-8 relative" style={{ minHeight: '250px' }}>
        {isMounted ? (
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <LineChart 
              data={history.length > 0 ? history : [{ date: '', price: currentPrice }]}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#ffffff40" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#ffffff40" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-white/5 rounded-lg" />
        )}
      </div>

      <form onSubmit={handleTrack} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Email Address</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Target Price ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                required
                step="0.01"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            success 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Alert Set Successfully!
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              Set Price Alert
            </>
          )}
        </button>
      </form>
    </div>
  );
};
