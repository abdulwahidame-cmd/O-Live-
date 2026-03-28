import React, { useState } from 'react';
import { X, Copy, Check, Twitter, Facebook, MessageCircle, Link2, Instagram, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  username: string;
}

export default function ShareModal({ isOpen, onClose, videoUrl, username }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharingToStories, setSharingToStories] = useState(false);

  const shareUrl = window.location.origin + videoUrl; // In a real app, this would be a deep link

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareToStories = () => {
    setSharingToStories(true);
    // Simulate sharing to stories
    setTimeout(() => {
      setSharingToStories(false);
      onClose();
    }, 1500);
  };

  const shareOptions = [
    { 
      name: 'Copy Link', 
      icon: copied ? <Check size={24} className="text-green-500" /> : <Link2 size={24} />, 
      onClick: handleCopy,
      color: 'bg-zinc-800'
    },
    { 
      name: 'Stories', 
      icon: <Instagram size={24} />, 
      onClick: handleShareToStories,
      color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
    },
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle size={24} />, 
      onClick: () => window.open(`https://wa.me/?text=Check out @${username}'s video on TikTok Clone: ${shareUrl}`),
      color: 'bg-green-600'
    },
    { 
      name: 'Twitter', 
      icon: <Twitter size={24} />, 
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=Check out @${username}'s video on TikTok Clone!&url=${shareUrl}`),
      color: 'bg-sky-500'
    },
    { 
      name: 'Facebook', 
      icon: <Facebook size={24} />, 
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`),
      color: 'bg-blue-600'
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-zinc-900 shadow-2xl flex flex-col"
          >
            {sharingToStories && (
              <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white shadow-xl animate-pulse">
                    <Instagram size={32} />
                  </div>
                  <p className="text-sm font-bold text-white uppercase tracking-widest">Sharing to Stories...</p>
                </motion.div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <div className="flex-1" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Share to</h2>
              <div className="flex-1 flex justify-end">
                <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 text-white/60">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-5 gap-4 mb-8">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.onClick}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full ${option.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-active:scale-95`}>
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-medium text-white/60">{option.name}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                  <span className="flex-1 truncate text-xs text-white/40">{shareUrl}</span>
                  <button
                    onClick={handleCopy}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-[10px] font-bold text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                  >
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="h-8 sm:hidden" /> {/* Bottom safe area spacer */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
