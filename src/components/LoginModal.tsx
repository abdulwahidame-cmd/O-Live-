import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, ShieldCheck, UserPlus, Globe } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] glass-card shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <h2 className="text-xl font-bold text-white">Sign In</h2>
              <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-white/40 hover:bg-white/10 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-orange-600/20 p-6 text-orange-500">
                  <UserPlus size={48} />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Join VibeStream</h3>
                <p className="text-sm text-white/40 max-w-[280px]">
                  Create your profile, follow your favorite creators, and share your own videos.
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-95"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                  Continue with Google
                </button>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">or</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <button 
                  disabled
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/5 py-4 text-sm font-bold text-white/40 transition-all cursor-not-allowed"
                >
                  <LogIn size={18} />
                  Email or Phone (Coming Soon)
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                  <ShieldCheck className="text-green-500" size={20} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Secure Login</span>
                    <span className="text-[10px] text-white/40">Your data is protected by Firebase Auth</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                  <Globe className="text-blue-500" size={20} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Global Community</span>
                    <span className="text-[10px] text-white/40">Connect with creators worldwide</span>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-[10px] text-white/20 leading-relaxed">
                By continuing, you agree to VibeStream's <br />
                <span className="text-white/40 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-white/40 hover:underline cursor-pointer">Privacy Policy</span>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
