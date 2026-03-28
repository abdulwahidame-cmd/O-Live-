import { useState, useEffect, useRef, useCallback } from 'react';
import { Video } from '../types';
import { MOCK_VIDEOS } from '../mockData';
import VideoCard from './VideoCard';
import UploadModal from './UploadModal';
import { Loader2, Plus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const CATEGORIES = ['All', 'Dance', 'Nature', 'Lifestyle', 'Comedy', 'DIY'];

export default function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'videos'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVideos = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Video[];
      
      if (fetchedVideos.length > 0) {
        setVideos(fetchedVideos);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        // Fallback to initial videos if Firestore is empty
        setVideos(MOCK_VIDEOS.slice(0, 3));
        setHasMore(false);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
      setVideos(MOCK_VIDEOS.slice(0, 3));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredVideos = videos.filter(v => {
    const matchesTag = selectedTag ? v.tags?.includes(selectedTag) : true;
    const matchesCategory = selectedCategory === 'All' ? true : v.category === selectedCategory;
    return matchesTag && matchesCategory;
  });

  const lastVideoRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || !hasMore || selectedTag || selectedCategory !== 'All') return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreVideos();
      }
    }, {
      threshold: 0.1
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, selectedTag, selectedCategory]);

  const loadMoreVideos = async () => {
    if (!lastDoc || !hasMore) return;
    setLoading(true);
    
    try {
      const q = query(
        collection(db, 'videos'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const moreVideos = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Video[];
        
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueMoreVideos = moreVideos.filter(v => !existingIds.has(v.id));
          return [...prev, ...uniqueMoreVideos];
        });
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar bg-black">
      {/* Top Navigation / Filter Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col gap-4 p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={`${cat}-${idx}`}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/20 active:scale-90 transition-all ml-4 flex-shrink-0"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {selectedTag && (
        <div className="fixed top-24 left-1/2 z-50 -translate-x-1/2">
          <button 
            onClick={() => setSelectedTag(null)}
            className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/20"
          >
            <span>Tag: {selectedTag}</span>
            <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[10px]">✕</span>
            </div>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {filteredVideos.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen w-full items-center justify-center text-white/40"
          >
            <div className="flex flex-col items-center gap-4">
              <Filter size={48} className="opacity-20" />
              <p className="text-sm font-medium uppercase tracking-widest">No videos in this category</p>
              <button 
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-bold text-orange-500 underline underline-offset-4"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        ) : (
          filteredVideos.map((video, index) => {
            const isLast = filteredVideos.length === index + 1;
            return (
              <div 
                key={video.id} 
                ref={isLast ? lastVideoRef : null} 
                className="h-screen w-full snap-start"
              >
                <VideoCard 
                  video={video} 
                  onTagClick={(tag) => setSelectedTag(tag)} 
                />
              </div>
            );
          })
        )}
      </AnimatePresence>
      
      {loading && !selectedTag && selectedCategory === 'All' && (
        <div className="flex h-screen w-full snap-start items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Loading more vibes...</p>
          </div>
        </div>
      )}

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
}
