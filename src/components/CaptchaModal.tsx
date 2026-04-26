import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';

interface CaptchaModalProps {
  isOpen: boolean;
  onVerify: () => void;
  onClose: () => void;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({ isOpen, onVerify, onClose }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [hasCalledVerify, setHasCalledVerify] = useState(false);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      setIsVerified(false);
      setCountdown(3);
      setHasCalledVerify(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerified && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (isVerified && countdown === 0 && !hasCalledVerify) {
      setHasCalledVerify(true);
      onVerify();
    }
    return () => clearTimeout(timer);
  }, [isVerified, countdown, onVerify, hasCalledVerify]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toUpperCase() === captchaText) {
      setIsVerified(true);
    } else {
      setError(true);
      generateCaptcha();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-neutral-900 border border-emerald-green/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-green/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-green/10 text-emerald-green">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Security Verification</h2>
                  <p className="text-sm text-neutral-400">Please verify you are human to continue</p>
                </div>
              </div>

              {!isVerified ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 flex items-center justify-center select-none">
                      <span className="text-3xl font-mono font-bold tracking-[0.5em] text-emerald-green italic opacity-80 blur-[0.5px] skew-x-12">
                        {captchaText}
                      </span>
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        className="absolute right-4 p-2 text-neutral-500 hover:text-emerald-green transition-colors"
                        title="Refresh Captcha"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    <div className="absolute inset-0 pointer-events-none border-2 border-emerald-green/0 group-hover:border-emerald-green/5 rounded-xl transition-all" />
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Enter the code above"
                      className={`w-full bg-neutral-800 border ${error ? 'border-red-500' : 'border-neutral-700'} focus:border-emerald-green rounded-xl px-4 py-3 text-white outline-none transition-all text-center tracking-widest uppercase font-mono`}
                      autoFocus
                    />
                    {error && (
                      <p className="text-xs text-red-500 text-center">
                        Incorrect code. Please try again.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:bg-neutral-800 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-green hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      Verify
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-emerald-green gap-4"
                >
                  <CheckCircle2 size={64} className="animate-bounce" />
                  <div className="text-center">
                    <p className="text-lg font-bold">Verification Successful</p>
                    <p className="text-sm text-neutral-400 mt-2">
                      Redirecting to comparison in <span className="text-emerald-green font-mono font-bold">{countdown}</span> seconds...
                    </p>
                    <button
                      onClick={onVerify}
                      className="mt-4 text-xs text-emerald-green hover:underline font-bold uppercase tracking-widest"
                    >
                      Skip & Continue Now
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
