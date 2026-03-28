import React, { useState, useEffect } from 'react';
import { Settings, Grid, Heart, Bookmark, Lock, LogOut, Edit2, Share2, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Video {
  id: string;
  thumbnail: string;
  likes: number;
  views: number;
  description: string;
}

export default function ProfileView() {
  const { user, profile, logout } = useFirebase();
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'videos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVideos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Video[];
      setVideos(fetchedVideos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user videos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Lock size={32} className="text-white/20" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Login to view profile</h2>
        <p className="mb-8 text-sm text-white/40">Keep track of your videos, likes, and more.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-black pb-24 no-scrollbar">
      {/* Profile Header */}
      <header className="relative px-4 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-orange-500 p-1">
                <img 
                  src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Profile" 
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white ring-4 ring-black">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black italic uppercase tracking-tight text-white">
                {profile?.username || user.displayName || 'User'}
              </h1>
              <p className="text-xs font-medium text-white/40">@{profile?.username?.toLowerCase().replace(/\s+/g, '_') || 'user_' + user.uid.slice(0, 5)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition-all hover:bg-white/10">
              <Share2 size={18} />
            </button>
            <button 
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-red-500 ring-1 ring-white/10 transition-all hover:bg-white/10"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 flex justify-center gap-12 border-y border-white/5 py-6">
          <div className="text-center">
            <p className="text-lg font-black text-white">0</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Following</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-white">0</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-white">0</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Likes</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">
            {profile?.bio || 'No bio yet. Click edit to add one! ✨'}
          </p>
          <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-orange-500" />
              <span>Earth</span>
            </div>
            <div className="flex items-center gap-1">
              <LinkIcon size={12} className="text-orange-500" />
              <span className="text-orange-500 lowercase">linktr.ee/user</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-orange-500" />
              <span>Joined March 2024</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-10 flex border-b border-white/10 bg-black/80 backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-4 flex justify-center transition-colors ${activeTab === 'videos' ? 'text-orange-500' : 'text-white/40'}`}
        >
          <Grid size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('liked')}
          className={`flex-1 py-4 flex justify-center transition-colors ${activeTab === 'liked' ? 'text-orange-500' : 'text-white/40'}`}
        >
          <Heart size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-4 flex justify-center transition-colors ${activeTab === 'saved' ? 'text-orange-500' : 'text-white/40'}`}
        >
          <Bookmark size={20} />
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse bg-white/5" />
          ))
        ) : videos.length > 0 ? (
          videos.map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-[3/4] overflow-hidden bg-zinc-900"
            >
              <img 
                src={video.thumbnail} 
                alt={video.description} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold text-white drop-shadow-md">
                <Heart size={10} fill="currentColor" className="text-white" />
                <span>{(video.likes / 1000).toFixed(1)}k</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Grid size={24} className="text-white/20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">No videos yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
