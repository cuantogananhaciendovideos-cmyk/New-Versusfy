import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Share2, Download, X, Camera, User, Trash2, Facebook, Twitter, Instagram, MessageCircle, Send, Sparkles } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface HeroStatusShareProps {
  productA: string;
  productB: string;
  savings: string;
  onClose: () => void;
}

export const HeroStatusShare: React.FC<HeroStatusShareProps> = ({ productA, productB, savings, onClose }) => {
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `versusfy-hero-${userName || 'status'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareTicket = async () => {
    if (!ticketRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        quality: 0.95,
      });
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'hero-status.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Versusfy Hero Status',
          text: `I just saved a fortune using Versusfy! Follow my lead and save too!`,
        });
      } else {
        // Fallback: Just download
        downloadTicket();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 max-h-[90vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
          {/* Controls Side */}
          <div className="p-8 lg:p-12 space-y-8">
            <div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">Claim Hero Status</h2>
              <p className="text-neutral-400 text-sm">Become the legend that saved their community a fortune.</p>
            </div>

            <div className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-green">Hero Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    type="text" 
                    placeholder="Enter your name..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-green outline-none transition-all"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-green">Hero Portrait</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-green/10 border border-emerald-green/30 rounded-xl text-emerald-green font-bold hover:bg-emerald-green/20 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </button>
                  {userPhoto && (
                    <button 
                      onClick={() => setUserPhoto(null)}
                      className="p-3 bg-apple-red/10 border border-apple-red/30 rounded-xl text-apple-red hover:bg-apple-red/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
              <button 
                onClick={shareTicket}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-[length:200%_auto] animate-shimmer text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(202,138,4,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                Share Hero Status
              </button>
              <button 
                onClick={downloadTicket}
                className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Ticket
              </button>
              <div className="flex justify-center gap-4 pt-4">
                <Facebook className="w-5 h-5 text-neutral-500 hover:text-blue-500 cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 text-neutral-500 hover:text-sky-400 cursor-pointer transition-colors" />
                <Instagram className="w-5 h-5 text-neutral-500 hover:text-pink-500 cursor-pointer transition-colors" />
                <MessageCircle className="w-5 h-5 text-neutral-500 hover:text-green-500 cursor-pointer transition-colors" />
                <Send className="w-5 h-5 text-neutral-500 hover:text-blue-400 cursor-pointer transition-colors" />
              </div>
            </div>
          </div>

          {/* Ticket Preview Side */}
          <div className="p-4 sm:p-8 lg:p-12 bg-black flex items-center justify-center border-l border-white/5">
            <div 
              ref={ticketRef}
              className="w-full max-w-[280px] sm:max-w-[320px] aspect-[1/1.6] bg-gradient-to-tr from-[#8B6B23] via-[#D4AF37] to-[#8B6B23] p-[2px] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full bg-neutral-950 rounded-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden">
                {/* Background Textures/Gradients */}
                <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-[#D4AF37]/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#D4AF37]/5 blur-[60px] rounded-full" />
                
                {/* Header */}
                <div className="w-full text-center relative z-10">
                  <div className="flex justify-center mb-2">
                    <Trophy className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-1">Versusfy Elite Hero</h3>
                  <div className="h-[1px] w-24 bg-[#D4AF37]/30 mx-auto" />
                </div>

                {/* Hero Profile */}
                <div className="flex flex-col items-center gap-4 relative z-10 w-full">
                  <div className="w-32 h-32 rounded-full border-2 border-[#D4AF37] p-1 shadow-2xl relative">
                    <div className="w-full h-full rounded-full bg-neutral-900 overflow-hidden">
                      {userPhoto ? (
                        <img src={userPhoto} alt="Hero" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                          <User className="w-12 h-12 text-[#D4AF37]/20" />
                        </div>
                      )}
                    </div>
                    {/* Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] p-2 rounded-full shadow-lg">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[240px]">
                      {userName || 'VALUED HERO'}
                    </h4>
                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 italic">Confirmed Community Savior</p>
                  </div>
                </div>

                {/* Achievement */}
                <div className="w-full text-center space-y-4 relative z-10 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div>
                    <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Estimated Family Savings</p>
                    <div className="text-4xl font-black text-white italic tracking-tighter">
                      {savings}%
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-white/10" />
                  <p className="text-[8px] text-neutral-400 font-medium px-2 leading-relaxed">
                    "This hero compared {productA} vs {productB} and prevented waste for their community."
                  </p>
                </div>

                {/* Footer / QR Area */}
                <div className="w-full flex justify-between items-end relative z-10">
                  <div className="text-left">
                    <span className="text-[8px] font-black text-[#D4AF37] uppercase block tracking-tighter">Versusfy AI</span>
                    <span className="text-[6px] text-neutral-500 uppercase block">Auth ID: VF-{Math.floor(Math.random()*90000) + 10000}</span>
                  </div>
                  <div className="w-12 h-12 bg-white p-1 rounded-md opacity-20">
                    <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
                      <div className="text-[6px] font-bold text-white text-center">QR CODE</div>
                    </div>
                  </div>
                </div>

                {/* Branding Stamp */}
                <div className="absolute -right-8 top-12 rotate-45 bg-[#D4AF37] text-black px-10 py-1 text-[8px] font-black uppercase tracking-widest shadow-xl">
                  ELITE SAVER
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
