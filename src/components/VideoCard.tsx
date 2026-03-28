import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Heart, MessageCircle, Share2, Music, Play, Volume2, VolumeX, ClosedCaption, Download, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, VideoQuality } from '../types';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';
import FollowButton from './FollowButton';
import { useNotifications } from '../contexts/NotificationContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

interface VideoCardProps {
  video: Video;
  onTagClick?: (tag: string) => void;
}

export default function VideoCard({ video, onTagClick }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadToast, setShowDownloadToast] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(video.url);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');
  const { user, profile, openLoginModal } = useFirebase();
  const { addNotification } = useNotifications();

  const { ref, inView } = useInView({
    threshold: 0.6,
  });

  // Check if user has liked this video
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !video.id) return;
      try {
        const q = query(
          collection(db, 'likes'),
          where('userId', '==', user.uid),
          where('targetId', '==', video.id),
          where('type', '==', 'video')
        );
        const querySnapshot = await getDocs(q);
        setIsLiked(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [user, video.id]);

  useEffect(() => {
    if (inView && !isCommentsOpen && !isShareOpen) {
      videoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [inView, isCommentsOpen, isShareOpen]);

  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const triggerControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowPauseIcon(true);
        setTimeout(() => setShowPauseIcon(false), 500);
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
      triggerControls();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) setVolume(1);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    
    setIsDownloading(true);
    setShowDownloadToast(true);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => setShowDownloadToast(false), 3000);

    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setShowDownloadToast(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      if (newLikedState) {
        // Add like
        await addDoc(collection(db, 'likes'), {
          userId: user.uid,
          targetId: video.id,
          type: 'video',
          createdAt: serverTimestamp()
        });
        
        // Increment like count on video if it exists in Firestore
        const videoRef = doc(db, 'videos', video.id);
        try {
          await updateDoc(videoRef, {
            likes: increment(1)
          });
        } catch (error: any) {
          // If document doesn't exist (mock data), we can ignore the error
          if (error.code !== 'not-found') {
            console.error('Error updating video likes:', error);
          }
        }

        // Send notification to video owner
        if (video.uid && video.uid !== user.uid) {
          await addNotification({
            recipientUid: video.uid,
            type: 'like',
            senderUid: user.uid,
            username: profile?.username || user.displayName || 'user',
            message: 'liked your video',
            avatar: profile?.avatar || user.photoURL || undefined
          });
        }
      } else {
        // Remove like
        const q = query(
          collection(db, 'likes'),
          where('userId', '==', user.uid),
          where('targetId', '==', video.id),
          where('type', '==', 'video')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await deleteDoc(doc(db, 'likes', document.id));
        });
        
        // Decrement like count on video if it exists in Firestore
        const videoRef = doc(db, 'videos', video.id);
        try {
          await updateDoc(videoRef, {
            likes: increment(-1)
          });
        } catch (error: any) {
          // If document doesn't exist (mock data), we can ignore the error
          if (error.code !== 'not-found') {
            console.error('Error updating video likes:', error);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'likes');
      // Revert UI state on error
      setIsLiked(!newLikedState);
      setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    setIsCommentsOpen(true);
  };

  const handleShare = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    try {
      // Increment share count on video if it exists in Firestore
      const videoRef = doc(db, 'videos', video.id);
      try {
        await updateDoc(videoRef, {
          shares: increment(1)
        });
      } catch (error: any) {
        // If document doesn't exist (mock data), we can ignore the error
        if (error.code !== 'not-found') {
          console.error('Error updating video shares:', error);
        }
      }
      setIsShareOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'videos');
    }
  };

  const handleQualityChange = (quality: VideoQuality | 'Auto') => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      
      if (quality === 'Auto') {
        setCurrentUrl(video.url);
        setCurrentQuality('Auto');
      } else {
        setCurrentUrl(quality.url);
        setCurrentQuality(quality.label);
      }
      
      // After URL changes, we need to restore the time
      // The video element will reload when the src changes
      const handleLoadedData = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          if (wasPlaying) {
            videoRef.current.play().catch(() => {});
          }
          videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        }
      };
      
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
      setShowQualityMenu(false);
    }
  };

  const currentCaption = video.captions?.find(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );

  return (
    <div ref={ref} className="relative h-screen w-full snap-start overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={currentUrl}
        loop
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        className="h-full w-full object-cover"
        onClick={() => { togglePlay(); triggerControls(); }}
        poster={video.thumbnail}
      />

      <AnimatePresence>
        {/* Play/Pause Button Overlay */}
        {showControls && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={togglePlay}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/20"
          >
            {isPlaying ? (
              <div className="flex gap-2 rounded-full bg-black/40 p-6 backdrop-blur-sm">
                <div className="h-10 w-3 bg-white opacity-80 rounded-full" />
                <div className="h-10 w-3 bg-white opacity-80 rounded-full" />
              </div>
            ) : (
              <div className="rounded-full bg-black/40 p-6 backdrop-blur-sm">
                <Play size={48} className="text-white opacity-80" fill="white" />
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quality Selection Menu */}
      <AnimatePresence>
        {showQualityMenu && (
          <motion.div
            key="quality-menu"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="absolute right-16 bottom-64 z-50 w-32 overflow-hidden rounded-2xl glass-card border border-white/10"
          >
            <div className="flex flex-col p-1">
              <button
                onClick={() => handleQualityChange('Auto')}
                className={`flex items-center justify-between rounded-xl px-4 py-2 text-xs font-bold transition-colors ${currentQuality === 'Auto' ? 'bg-orange-600 text-white' : 'text-white/60 hover:bg-white/10'}`}
              >
                Auto
                {currentQuality === 'Auto' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </button>
              {video.qualities?.map((q, index) => (
                <button
                  key={`${q.label}-${index}`}
                  onClick={() => handleQualityChange(q)}
                  className={`flex items-center justify-between rounded-xl px-4 py-2 text-xs font-bold transition-colors ${currentQuality === q.label ? 'bg-orange-600 text-white' : 'text-white/60 hover:bg-white/10'}`}
                >
                  {q.label}
                  {currentQuality === q.label && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Toast */}
      <AnimatePresence>
        {showDownloadToast && (
          <motion.div
            key="download-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-10 left-1/2 z-[60] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full bg-orange-600 px-6 py-3 text-white shadow-xl backdrop-blur-md">
              <Download size={20} className="animate-bounce" />
              <span className="text-sm font-bold">Download started...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captions Display */}
      <AnimatePresence mode="wait">
        {showCaptions && currentCaption && (
          <motion.div
            key={`caption-${currentCaption.startTime}-${currentCaption.text.slice(0, 5)}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-32 left-1/2 z-40 -translate-x-1/2 px-4 py-2"
          >
            <div className="rounded-lg bg-black/60 px-4 py-2 text-center backdrop-blur-md border border-white/10">
              <p className="text-sm font-medium text-white shadow-sm">
                {currentCaption.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seekable Progress Bar */}
      <div 
        ref={progressBarRef}
        onClick={handleSeek}
        className="absolute bottom-[88px] left-0 right-0 z-30 h-1.5 cursor-pointer bg-white/10 transition-all hover:h-2"
      >
        <motion.div 
          className="h-full bg-orange-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Overlay Controls */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 pb-24">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/20 shadow-lg">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.username}`} 
                  alt={video.username} 
                  referrerPolicy="no-referrer" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">@{video.username}</span>
                  <FollowButton uid={video.uid || ''} />
                </div>
                {video.category && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                    {video.category}
                  </span>
                )}
              </div>
            </div>
            
            <p className="line-clamp-2 text-sm text-white/90">{video.description}</p>
            
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <button
                    key={`${tag}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    className="text-xs font-bold text-orange-500 hover:text-orange-400"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-white/80">
              <Music size={14} className="animate-spin-slow" />
              <span className="text-xs truncate max-w-[200px]">{video.musicName}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={handleLike}
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full glass-card transition-colors duration-300 ${isLiked ? 'text-red-500' : 'text-white'}`}
                >
                  <motion.div
                    animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
                  </motion.div>
                </motion.button>
                
                {/* Burst Effect */}
                <AnimatePresence mode="wait">
                  {isLiked && (
                    <motion.div
                      key="burst-container"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={`particle-${i}`}
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ 
                            scale: 1.5, 
                            opacity: 0,
                            x: Math.cos((i * 60) * Math.PI / 180) * 40,
                            y: Math.sin((i * 60) * Math.PI / 180) * 40
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="relative h-4 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={likesCount}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block text-xs font-medium text-white"
                  >
                    {likesCount.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={handleCommentClick}
                className="flex h-12 w-12 items-center justify-center rounded-full glass-card text-white"
              >
                <MessageCircle size={28} />
              </button>
              <span className="text-xs font-medium text-white">{video.comments}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={handleShare}
                className="flex h-12 w-12 items-center justify-center rounded-full glass-card text-white"
              >
                <Share2 size={28} />
              </button>
              <span className="text-xs font-medium text-white">{video.shares}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`flex h-12 w-12 items-center justify-center rounded-full glass-card transition-all ${showQualityMenu ? 'bg-orange-600 text-white' : 'text-white'}`}
              >
                <Settings size={28} className={showQualityMenu ? 'animate-spin-slow' : ''} />
              </motion.button>
              <span className="text-xs font-medium text-white">{currentQuality}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex h-12 w-12 items-center justify-center rounded-full glass-card text-white ${isDownloading ? 'opacity-50' : ''}`}
              >
                <Download size={28} className={isDownloading ? 'animate-bounce' : ''} />
              </motion.button>
              <span className="text-xs font-medium text-white">{isDownloading ? '...' : 'Save'}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => setShowCaptions(!showCaptions)}
                className={`flex h-12 w-12 items-center justify-center rounded-full glass-card ${showCaptions ? 'text-orange-500' : 'text-white'}`}
              >
                <ClosedCaption size={28} />
              </button>
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Captions</span>
            </div>

            <div 
              className="relative flex flex-col items-center gap-1"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    key="volume-slider"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-14 flex h-32 w-10 items-center justify-center rounded-full bg-black/40 p-2 backdrop-blur-md"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="h-24 w-1 cursor-pointer appearance-none bg-white/20 accent-orange-500"
                      style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <button 
                onClick={toggleMute}
                className="flex h-12 w-12 items-center justify-center rounded-full glass-card text-white"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>

            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="h-10 w-10 rounded-full border-2 border-white/20 p-1"
            >
              <div className="h-full w-full rounded-full bg-gradient-to-br from-orange-500 to-red-600" />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPauseIcon && (
          <motion.div
            key="pause-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="rounded-full bg-black/20 p-6 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="h-10 w-3 bg-white opacity-80 rounded-full" />
                <div className="h-10 w-3 bg-white opacity-80 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommentsModal 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        videoId={video.id} 
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        videoUrl={video.url}
        username={video.username}
      />
    </div>
  );
}



