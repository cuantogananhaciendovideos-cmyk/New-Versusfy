import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, QrCode, Link, Copy, Check, Facebook, Twitter, Instagram, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareToolsProps {
  productA: string;
  productB: string;
  comparisonText: string;
}

export const ShareTools: React.FC<ShareToolsProps> = ({ productA, productB, comparisonText }) => {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const shareUrl = window.location.href;
  const shareTitle = `Versusfy: ${productA} vs ${productB} Comparison`;
  const shareText = `Check out this product comparison on Versusfy: ${productA} vs ${productB}!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    { icon: Facebook, color: 'text-blue-500', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { icon: Twitter, color: 'text-sky-400', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
    { icon: MessageCircle, color: 'text-green-500', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
    { icon: Send, color: 'text-blue-400', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <Share2 className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Share Comparison</h3>
          <p className="text-sm text-gray-400">Spread the word with friends</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {socialLinks.map((social, idx) => (
          <a
            key={idx}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
          >
            <social.icon className={`w-5 h-5 ${social.color} group-hover:scale-110 transition-transform`} />
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link className="w-4 h-4" />}
          <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className={`p-3 border rounded-xl transition-all ${
            showQR ? 'bg-pink-600 border-pink-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <QrCode className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-6 overflow-hidden"
          >
            <QRCodeSVG 
              value={shareUrl} 
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/favicon.ico",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
            <p className="text-xs text-gray-400 mt-4 font-mono uppercase tracking-widest">Scan to view on mobile</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
