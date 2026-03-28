import React, { useState, useEffect } from 'react';
import { Users, Radio, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { LiveStream } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, increment, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

interface LiveCardProps {
  stream: LiveStream;
  key?: string;
  onClick?: () => void;
}

export default function LiveCard({ stream, onClick }: LiveCardProps) {
  const { user } = useFirebase();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(stream.likes);

  useEffect(() => {
    if (!user) return;

    const checkLikeStatus = async () => {
      const q = query(
        collection(db, 'likes'),
        where('userId', '==', user.uid),
        where('targetId', '==', stream.id),
        where('type', '==', 'live_stream')
      );
      const querySnapshot = await getDocs(q);
      setIsLiked(!querySnapshot.empty);
    };

    checkLikeStatus();
  }, [user, stream.id]);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      const streamRef = doc(db, 'live_streams', stream.id);
      if (newLikedState) {
        await addDoc(collection(db, 'likes'), {
          userId: user.uid,
          targetId: stream.id,
          type: 'live_stream',
          createdAt: new Date()
        });
        await updateDoc(streamRef, { likes: increment(1) });
      } else {
        const q = query(
          collection(db, 'likes'),
          where('userId', '==', user.uid),
          where('targetId', '==', stream.id),
          where('type', '==', 'live_stream')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        await updateDoc(streamRef, { likes: increment(-1) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'live_streams');
      // Rollback
      setIsLiked(!newLikedState);
      setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative aspect-[3/4] overflow-hidden rounded-2xl glass-card group cursor-pointer"
    >
      <img 
        src={stream.thumbnail} 
        alt={stream.title} 
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/40">
            <Radio size={10} className="animate-pulse" />
            Live
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
              <Users size={10} className="text-red-500" />
              {formatCount(stream.viewers)}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
              <Heart size={10} className={isLiked ? "text-red-500 fill-current" : "text-white"} />
              {formatCount(likesCount)}
            </div>
            <div className="rounded-full bg-orange-600/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter text-white backdrop-blur-sm">
              {stream.category}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="line-clamp-1 text-sm font-bold text-white">{stream.title}</h3>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/20 shadow-lg">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.username}`} 
                  alt={stream.username} 
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-white">@{stream.username}</span>
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className={`flex h-8 w-8 items-center justify-center rounded-full glass-card border border-white/10 ${isLiked ? 'text-red-500' : 'text-white'}`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
