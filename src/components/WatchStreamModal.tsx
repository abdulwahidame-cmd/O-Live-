import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Heart, Share2, MessageCircle } from 'lucide-react';
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
  increment,
  getDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';
import { LiveStream } from '../types';

interface WatchStreamModalProps {
  streamId: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  color: string;
}

export default function WatchStreamModal({ streamId, onClose }: WatchStreamModalProps) {
  const { user, profile, openLoginModal } = useFirebase();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Stream Data & Increment Viewers
  useEffect(() => {
    if (!streamId) return;

    const streamRef = doc(db, 'live_streams', streamId);
    
    // Increment viewers when joining
    const joinStream = async () => {
      try {
        await updateDoc(streamRef, { viewers: increment(1) });
      } catch (error) {
        console.error("Error joining stream:", error);
      }
    };
    joinStream();

    // Listen to stream updates
    const unsubscribeStream = onSnapshot(streamRef, (doc) => {
      if (doc.exists()) {
        setStream({ id: doc.id, ...doc.data() } as LiveStream);
      } else {
        // Stream ended
        onClose();
      }
    });

    return () => {
      unsubscribeStream();
      // Decrement viewers when leaving
      updateDoc(streamRef, { viewers: increment(-1) }).catch(console.error);
    };
  }, [streamId, onClose]);

  // Real-time Chat
  useEffect(() => {
    if (!streamId) return;

    const q = query(
      collection(db, 'live_chats'),
      where('streamId', '==', streamId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeChat = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.createdAt?.toMillis?.() || Date.now()
        };
      }) as ChatMessage[];
      setMessages(fetchedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live_chats');
    });

    return () => unsubscribeChat();
  }, [streamId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentMessage.trim() || !streamId) return;
    
    if (!user) {
      openLoginModal();
      return;
    }

    try {
      await addDoc(collection(db, 'live_chats'), {
        streamId,
        uid: user.uid,
        username: profile?.username || user.displayName || 'user',
        text: currentMessage,
        createdAt: serverTimestamp(),
        color: 'text-white'
      });
      setCurrentMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'live_chats');
    }
  };

  const handleLike = async () => {
    if (!user) {
      openLoginModal();
      return;
    }

    setIsLiked(true);
    try {
      const streamRef = doc(db, 'live_streams', streamId);
      await updateDoc(streamRef, { likes: increment(1) });
      
      // Add a visual like to the chat
      await addDoc(collection(db, 'live_chats'), {
        streamId,
        uid: user.uid,
        username: profile?.username || user.displayName || 'user',
        text: '❤️ Liked the stream!',
        createdAt: serverTimestamp(),
        color: 'text-red-500'
      });
      
      setTimeout(() => setIsLiked(false), 1000);
    } catch (error) {
      console.error("Error liking stream:", error);
      setIsLiked(false);
    }
  };

  if (!stream) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="relative h-full w-full max-w-md overflow-hidden bg-black"
      >
        {/* Stream Background (Thumbnail) */}
        <img 
          src={stream.thumbnail} 
          alt={stream.title} 
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/40">
          
          {/* Header */}
          <div className="flex items-start justify-between mt-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/20">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.username}`} 
                  alt={stream.username} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white shadow-black drop-shadow-md">{stream.username}</h3>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Live</span>
                  <div className="flex items-center gap-1 text-xs text-white shadow-black drop-shadow-md font-bold">
                    <Users size={12} />
                    {stream.viewers?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md">
              <X size={20} />
            </button>
          </div>

          {/* Title & Category */}
          <div className="absolute top-24 left-4 right-4">
            <h2 className="text-lg font-bold text-white shadow-black drop-shadow-md">{stream.title}</h2>
            <span className="text-xs font-bold text-orange-400 shadow-black drop-shadow-md uppercase tracking-wider">{stream.category}</span>
          </div>

          {/* Bottom Section: Chat & Controls */}
          <div className="flex flex-col gap-4">
            {/* Chat Messages */}
            <div className="flex h-64 flex-col gap-2 overflow-y-auto no-scrollbar p-2 mask-image-to-top">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 rounded-lg bg-black/40 p-2 backdrop-blur-sm"
                  >
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold ${msg.color || 'text-white/60'}`}>{msg.username}</span>
                      <p className="text-xs text-white leading-tight">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <form 
                onSubmit={handleSendMessage}
                className="flex-1 rounded-full bg-black/40 px-4 py-3 backdrop-blur-md flex items-center gap-2 border border-white/10"
              >
                <input 
                  type="text" 
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Chat..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
                <button 
                  type="submit"
                  className="text-orange-500 font-bold text-xs uppercase tracking-widest"
                >
                  Send
                </button>
              </form>
              
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={handleLike}
                className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-colors ${isLiked ? 'bg-red-600/20 text-red-500' : 'bg-black/40 text-white hover:bg-white/20'}`}
              >
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
