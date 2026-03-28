import React, { useState, useEffect } from 'react';
import { Video } from '../types';
import { Play, Heart, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRecommendations, getTrendingVideos, UserPreferences } from '../services/recommendationService';
import { useFirebase } from '../contexts/FirebaseContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function HomeFeed() {
  const { user } = useFirebase();
  const [feedType, setFeedType] = useState<'foryou' | 'trending'>('foryou');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      
      let preferences: UserPreferences = {
        likedVideoIds: [],
        followedUsernames: [],
        viewHistory: []
      };

      if (user) {
        // Fetch liked videos
        const likesQuery = query(collection(db, 'likes'), where('userId', '==', user.uid));
        const likesSnapshot = await getDocs(likesQuery);
        preferences.likedVideoIds = likesSnapshot.docs.map(doc => doc.data().targetId);

        // Fetch followed users
        const followsQuery = query(collection(db, 'follows'), where('followerUid', '==', user.uid));
        const followsSnapshot = await getDocs(followsQuery);
        // Note: We need the usernames of the followed users, but we only have UIDs.
        // For now, we'll just use the UIDs as a placeholder, or we'd need to fetch user profiles.
        preferences.followedUsernames = followsSnapshot.docs.map(doc => doc.data().followingUid);
      }

      let newVideos: Video[] = [];
      if (feedType === 'foryou') {
        newVideos = getRecommendations(preferences);
      } else {
        newVideos = getTrendingVideos();
      }
      
      // Ensure uniqueness
      const uniqueVideos = Array.from(new Map(newVideos.map(v => [v.id, v])).values());
      setVideos(uniqueVideos);
      setIsLoading(false);
    };

    fetchRecommendations();
  }, [feedType, user]);

  return (
    <div className="h-full w-full overflow-y-auto bg-black p-4 pb-24 no-scrollbar">
      {/* Header & Tabs */}
      <div className="mb-8 mt-12 flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Discovery</h1>
          <p className="text-sm text-white/40 uppercase tracking-widest">Find your next vibe</p>
        </div>

        <div className="flex gap-2 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10 w-fit">
          <button
            onClick={() => setFeedType('foryou')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              feedType === 'foryou' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Sparkles size={14} />
            <span>For You</span>
          </button>
          <button
            onClick={() => setFeedType('trending')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              feedType === 'trending' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <TrendingUp size={14} />
            <span>Trending</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Skeleton Loading
            Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={`skeleton-${i}`}
                className="aspect-[9/16] animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
              />
            ))
          ) : (
            videos.map((video) => (
              <motion.div
                key={`home-${feedType}-${video.id}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-zinc-900 shadow-xl ring-1 ring-white/10"
              >
                <img
                  src={video.thumbnail}
                  alt={video.description}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="line-clamp-1 text-[10px] font-bold text-white mb-1">@{video.username}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-white/60">
                      <Heart size={10} className="text-red-500" fill="currentColor" />
                      <span>{(video.likes / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg">
                      <Play size={12} fill="currentColor" />
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                {video.category && (
                  <div className="absolute top-3 left-3 rounded-full bg-orange-600/80 px-2 py-0.5 backdrop-blur-md border border-white/10">
                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">{video.category}</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 rounded-full bg-black/40 px-2 py-1 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-white uppercase tracking-widest">
                    <Play size={8} fill="currentColor" />
                    <span>{(Math.random() * 100).toFixed(1)}k</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
