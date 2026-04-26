import React, { useState, useEffect } from 'react';
import { Ticket, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCouponsForProduct, Coupon } from '../services/couponService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface CouponTrackerProps {
  productName: string;
}

export const CouponTracker: React.FC<CouponTrackerProps> = ({ productName }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      const data = await getCouponsForProduct(productName);
      setCoupons(data);
    };
    fetchCoupons();
  }, [productName]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (coupon: Coupon) => {
    try {
      const element = document.getElementById(`coupon-${coupon.id || coupon.code}`);
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1a1a',
        scale: 2
      });
      
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("html2canvas did not return a valid canvas");
      }

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`coupon-${coupon.store}-${coupon.code}.pdf`);
    } catch (error) {
      console.error("Failed to generate coupon PDF:", error);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Ticket className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Coupon Tracker</h3>
          <p className="text-sm text-gray-400">Exclusive deals and promo codes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coupons.map((coupon, idx) => (
          <motion.div
            key={coupon.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            id={`coupon-${coupon.id || coupon.code}`}
            className="relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-4 overflow-hidden group"
          >
            {/* Ticket Cutouts */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a0a0a] rounded-full border-r border-white/10" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a0a0a] rounded-full border-l border-white/10" />
            
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">{coupon.store}</span>
              <span className="text-xs text-gray-500">Exp: {coupon.expiryDate}</span>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-1">{coupon.discount}</h4>
            <p className="text-xs text-gray-400 mb-4 line-clamp-1">{coupon.description}</p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-dashed border-white/20 rounded-lg px-3 py-2 flex items-center justify-between">
                <code className="text-sm font-mono text-white tracking-wider">{coupon.code}</code>
                <button 
                  onClick={() => handleCopy(coupon.code, coupon.id || coupon.code)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {copiedId === (coupon.id || coupon.code) ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={() => handleDownload(coupon)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
