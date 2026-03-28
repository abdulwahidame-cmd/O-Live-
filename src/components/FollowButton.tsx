import React from 'react';
import { useFollow } from '../services/followService';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';

interface FollowButtonProps {
  uid: string;
  className?: string;
}

export default function FollowButton({ uid, className = "" }: FollowButtonProps) {
  const { isFollowing, toggleFollow, loading } = useFollow(uid);
  const { user, openLoginModal } = useFirebase();

  if (user?.uid === uid) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        if (!user) {
          openLoginModal();
          return;
        }
        toggleFollow();
      }}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isFollowing 
          ? 'bg-white/10 text-white hover:bg-white/20' 
          : 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700'
      } ${className}`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </motion.button>
  );
}
