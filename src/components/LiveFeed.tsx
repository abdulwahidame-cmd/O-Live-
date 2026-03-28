import React, { useState, useMemo, useEffect } from 'react';
import { LiveStream } from '../types';
import { MOCK_STREAMS } from '../mockData';
import LiveCard from './LiveCard';
import WatchStreamModal from './WatchStreamModal';
import { Radio, Search, Bell, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const CATEGORIES = ['All', 'Gaming', 'Cooking', 'Travel', 'Fitness', 'Music', 'Art'];

interface LiveFeedProps {
  onGoLive: () => void;
}

export default function LiveFeed({ onGoLive }: LiveFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'live_streams'),
      where('isLive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const streams = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          viewers: data.viewers || 0,
          likes: data.likes || 0,
          title: data.title || 'Untitled Stream',
          username: data.username || 'user'
        };
      }) as LiveStream[];
      setLiveStreams(streams);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live_streams');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const allStreams = useMemo(() => {
    if (liveStreams.length > 0) return liveStreams;
    return MOCK_STREAMS;
  }, [liveStreams]);

  const filteredStreams = useMemo(() => {
    return allStreams.filter((stream) => {
      const matchesSearch = 
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || stream.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, allStreams]);

  return (
    <div className="h-screen w-full overflow-y-auto bg-black p-4 pb-24 no-scrollbar">
      <header className="mb-6 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!isSearchOpen ? (
            <motion.div 
              key="header-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/20">
                <Radio size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Live</h1>
            </motion.div>
          ) : (
            <motion.div 
              key="search-bar"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-1 items-center gap-2"
            >
              <div className="flex flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
                <Search size={18} className="text-white/40" />
                <input 
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search streams or users..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X size={16} className="text-white/40" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 ml-4">
          {!isSearchOpen && (
            <button 
              onClick={onGoLive}
              className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
            >
              <Radio size={14} />
              Go Live
            </button>
          )}
          <button 
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery('');
            }}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isSearchOpen ? <X size={24} /> : <Search size={24} />}
          </button>
        </div>
      </header>

      <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar">
        {['All', 'Gaming', 'Music', 'Art', 'Cooking', 'Travel'].map((cat, index) => (
          <button 
            key={`${cat}-${index}`}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-orange-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredStreams.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filteredStreams.map((stream) => (
            <LiveCard key={stream.id} stream={stream} onClick={() => setSelectedStreamId(stream.id)} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-white/20">
          <Search size={48} className="mb-4" />
          <p className="text-sm font-medium">No streams found</p>
        </div>
      )}

      <AnimatePresence>
        {selectedStreamId && (
          <WatchStreamModal 
            streamId={selectedStreamId} 
            onClose={() => setSelectedStreamId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
