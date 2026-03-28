import React, { useState, useRef, useEffect } from 'react';
import { X, Radio, Users, MessageCircle, Heart, Share2, StopCircle, Camera, Mic, MicOff, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

interface LiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  color: string;
}

const CHAT_COLORS = ['text-blue-400', 'text-green-400', 'text-purple-400', 'text-pink-400', 'text-yellow-400', 'text-orange-400'];

export default function LiveModal({ isOpen, onClose }: LiveModalProps) {
  const { user, profile } = useFirebase();
  const [step, setStep] = useState<'setup' | 'streaming'>('setup');
  const [streamId, setStreamId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isAudienceMuted, setIsAudienceMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [analytics, setAnalytics] = useState({
    viewers: 0,
    avgViewers: 0,
    likes: 0,
    watchTime: 0, // in seconds
    totalViewersSum: 0,
    dataPointsCount: 0
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (step === 'streaming') {
      scrollToBottom();
    }
  }, [messages, step]);

  // Real-time Chat from Firestore
  useEffect(() => {
    if (step !== 'streaming' || !streamId) return;

    const q = query(
      collection(db, 'live_chats'),
      where('streamId', '==', streamId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle null server timestamp by using current time as fallback
          // but only if it's truly null (not yet synced)
          timestamp: data.createdAt?.toMillis?.() || Date.now()
        };
      }) as ChatMessage[];
      setMessages(fetchedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live_chats');
    });

    return () => unsubscribe();
  }, [step, streamId]);

  // Update analytics from Firestore
  useEffect(() => {
    if (step !== 'streaming' || !streamId) return;

    const streamRef = doc(db, 'live_streams', streamId);
    const unsubscribe = onSnapshot(streamRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setAnalytics(prev => ({
          ...prev,
          viewers: data.viewers || 0,
          likes: data.likes || 0
        }));
      }
    });

    const watchTimeInterval = setInterval(() => {
      setAnalytics(prev => {
        const newTotalViewersSum = prev.totalViewersSum + prev.viewers;
        const newDataPointsCount = prev.dataPointsCount + 1;
        return { 
          ...prev, 
          watchTime: prev.watchTime + 1,
          totalViewersSum: newTotalViewersSum,
          dataPointsCount: newDataPointsCount,
          avgViewers: Math.round(newTotalViewersSum / newDataPointsCount)
        };
      });
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(watchTimeInterval);
    };
  }, [step, streamId]);

  const formatWatchTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentMessage.trim() || !user || !streamId) return;

    try {
      await addDoc(collection(db, 'live_chats'), {
        streamId,
        uid: user.uid,
        username: profile?.username || user.displayName || 'user',
        text: currentMessage,
        createdAt: serverTimestamp(),
        color: 'text-orange-500'
      });
      setCurrentMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'live_chats');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setStep('setup');
      setIsEnding(false);
      setIsAudienceMuted(false);
    }
    return () => stopCamera();
  }, [isOpen]);

  const handleGoLive = async () => {
    if (!user) return;

    try {
      const streamRef = await addDoc(collection(db, 'live_streams'), {
        uid: user.uid,
        username: profile?.username || user.displayName || 'user',
        title: title || 'Untitled Stream',
        category,
        viewers: 0,
        likes: 0,
        isLive: true,
        thumbnail: profile?.avatar || user.photoURL || `https://picsum.photos/seed/${user.uid}/400/600`,
        createdAt: serverTimestamp()
      });
      setStreamId(streamRef.id);
      setStep('streaming');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'live_streams');
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleAudienceMute = () => {
    setIsAudienceMuted(!isAudienceMuted);
    const systemMsg: ChatMessage = {
      id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: 'System',
      text: isAudienceMuted ? 'Audience unmuted. Chat is now active.' : 'Audience muted. Chat is now restricted.',
      timestamp: Date.now(),
      color: 'text-white/40'
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const handleEndStream = () => {
    setIsEnding(true);
  };

  const confirmEndStream = async () => {
    if (streamId) {
      try {
        const streamRef = doc(db, 'live_streams', streamId);
        await updateDoc(streamRef, { isLive: false });
      } catch (error) {
        console.error('Error ending stream:', error);
      }
    }
    stopCamera();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative h-full w-full max-w-md overflow-hidden bg-black"
          >
            {/* Camera Preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover transition-opacity ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <CameraOff size={64} className="text-white/20" />
              </div>
            )}

            {/* Setup Overlay */}
            {step === 'setup' && (
              <div className="absolute inset-0 flex flex-col justify-between bg-black/40 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Go Live Setup</h2>
                  <button onClick={onClose} className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">Stream Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What are you streaming today?"
                      className="w-full rounded-xl bg-white/10 p-4 text-white outline-none ring-1 ring-white/20 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">Category</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {['Gaming', 'Music', 'Chatting', 'Art', 'Cooking'].map((cat, index) => (
                        <button
                          key={`${cat}-${index}`}
                          onClick={() => setCategory(cat)}
                          className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${category === cat ? 'bg-orange-600 text-white' : 'bg-white/10 text-white/60'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={toggleMute}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-bold transition-all ${isMuted ? 'bg-red-600/20 text-red-500' : 'bg-white/10 text-white'}`}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      {isMuted ? 'Muted' : 'Mic On'}
                    </button>
                    <button 
                      onClick={toggleCamera}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-bold transition-all ${isCameraOff ? 'bg-red-600/20 text-red-500' : 'bg-white/10 text-white'}`}
                    >
                      {isCameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
                      {isCameraOff ? 'Cam Off' : 'Cam On'}
                    </button>
                  </div>

                  <button
                    onClick={handleGoLive}
                    className="w-full rounded-xl bg-orange-600 py-4 text-lg font-bold text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-transform"
                  >
                    Start Live Stream
                  </button>
                </div>
              </div>
            )}

            {/* Streaming Overlay */}
            {step === 'streaming' && (
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        <Radio size={12} className="animate-pulse" />
                        Live
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                        <Users size={12} />
                        {analytics.viewers.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-xl bg-black/40 p-3 backdrop-blur-md flex-1">
                        <h3 className="text-sm font-bold text-white">{title || "Untitled Stream"}</h3>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest">{category}</p>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl bg-black/40 p-2 backdrop-blur-md min-w-[80px] justify-center text-center">
                        <div className="flex items-center justify-center gap-1 text-red-500">
                          <Heart size={10} fill="currentColor" />
                          <span className="text-[10px] font-bold">{analytics.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-white/60">
                          <Users size={10} />
                          <span className="text-[10px] font-bold">{analytics.avgViewers.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-white/60">
                          <StopCircle size={10} className="rotate-90" />
                          <span className="text-[10px] font-bold font-mono">{formatWatchTime(analytics.watchTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleEndStream}
                      className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-95 transition-transform"
                    >
                      <StopCircle size={16} />
                      End
                    </button>
                    <button 
                      onClick={toggleAudienceMute}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold backdrop-blur-md transition-all ${isAudienceMuted ? 'bg-orange-600 text-white' : 'bg-black/40 text-white/60'}`}
                    >
                      {isAudienceMuted ? <MicOff size={14} /> : <Mic size={14} />}
                      {isAudienceMuted ? 'Unmute' : 'Mute All'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Real-time Chat */}
                  <div className="flex h-64 flex-col gap-2 overflow-y-auto no-scrollbar p-2">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-2 rounded-lg bg-black/20 p-2 backdrop-blur-sm"
                        >
                          <div className={`h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white`}>
                            {msg.username[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold ${msg.color}`}>{msg.username}</span>
                            <p className="text-xs text-white leading-tight">{msg.text}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={toggleMute}
                        className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}
                      >
                        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                      <button 
                        onClick={toggleCamera}
                        className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${isCameraOff ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}
                      >
                        {isCameraOff ? <CameraOff size={18} /> : <Camera size={18} />}
                      </button>
                    </div>

                    <form 
                      onSubmit={handleSendMessage}
                      className="flex-1 rounded-full bg-white/10 px-4 py-3 backdrop-blur-md flex items-center gap-2"
                    >
                      <input 
                        type="text" 
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder={isAudienceMuted ? "Chat is muted..." : "Say something..."}
                        disabled={isAudienceMuted && step === 'streaming'}
                        className="w-full bg-transparent text-sm text-white outline-none disabled:opacity-50"
                      />
                      <button 
                        type="submit"
                        disabled={isAudienceMuted && step === 'streaming'}
                        className="text-orange-500 font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                    <button 
                      onClick={() => setMessages(prev => [...prev, {
                        id: `like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        username: 'System',
                        text: '❤️ Liked the stream!',
                        timestamp: Date.now(),
                        color: 'text-red-500'
                      }])}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
                    >
                      <Heart size={24} className="hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* End Stream Confirmation */}
            <AnimatePresence>
              {isEnding && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-xs space-y-6 rounded-3xl bg-zinc-900 p-8 text-center shadow-2xl ring-1 ring-white/10"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 text-red-500">
                      <StopCircle size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">End Stream?</h3>
                      <p className="text-sm text-white/60">Are you sure you want to end your live stream? This action cannot be undone.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={confirmEndStream}
                        className="w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
                      >
                        Yes, End Stream
                      </button>
                      <button
                        onClick={() => setIsEnding(false)}
                        className="w-full rounded-xl bg-white/5 py-3 font-bold text-white hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
