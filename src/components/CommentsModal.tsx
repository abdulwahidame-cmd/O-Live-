import React, { useState, useEffect } from 'react';
import { X, Send, Heart, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Comment } from '../types';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, signInWithGoogle } from '../firebase';
import { useNotifications } from '../contexts/NotificationContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { formatTime } from '../utils/dateUtils';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

export default function CommentsModal({ isOpen, onClose, videoId }: CommentsModalProps) {
  const { user, profile } = useFirebase();
  const { addNotification } = useNotifications();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !videoId) return;

    setLoading(true);
    const q = query(
      collection(db, 'comments'),
      where('videoId', '==', videoId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username,
          text: data.text,
          timestamp: data.createdAt,
          likes: data.likes || 0,
        };
      }) as Comment[];
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, videoId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addDoc(collection(db, 'comments'), {
        videoId,
        uid: user.uid,
        username: profile?.username || user.displayName || 'user',
        text: newComment,
        createdAt: serverTimestamp(),
        likes: 0
      });

      // Increment comment count on video if it exists in Firestore
      const videoRef = doc(db, 'videos', videoId);
      try {
        await updateDoc(videoRef, {
          comments: increment(1)
        });
      } catch (error: any) {
        // If document doesn't exist (mock data), we can ignore the error
        if (error.code !== 'not-found') {
          console.error('Error updating video comments count:', error);
        }
      }

      // Fetch video owner to send notification
      const videoDoc = await getDoc(videoRef);
      if (videoDoc.exists()) {
        const videoData = videoDoc.data();
        if (videoData.uid && videoData.uid !== user.uid) {
          await addNotification({
            recipientUid: videoData.uid,
            type: 'comment',
            senderUid: user.uid,
            username: profile?.username || user.displayName || 'user',
            message: `commented: ${newComment.substring(0, 30)}${newComment.length > 30 ? '...' : ''}`,
            avatar: profile?.avatar || user.photoURL || undefined
          });
        }
      }

      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div
            key="comments-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            key="comments-modal-content"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg h-[70vh] sm:h-[600px] overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-zinc-900 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <div className="flex-1" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Comments</h2>
              <div className="flex-1 flex justify-end">
                <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 text-white/60">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-white/20">
                  <p className="text-sm font-medium">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} 
                        alt={comment.username} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/60">@{comment.username}</span>
                        <span className="text-[10px] text-white/20">{formatTime(comment.timestamp)}</span>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">{comment.text}</p>
                      <div className="flex items-center gap-4 pt-1">
                        <button className="flex items-center gap-1 text-[10px] font-bold text-white/40 hover:text-red-500 transition-colors">
                          <Heart size={12} />
                          {comment.likes}
                        </button>
                        <button className="text-[10px] font-bold text-white/40 hover:text-white transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-zinc-900/50 backdrop-blur-md">
              {user ? (
                <form onSubmit={handlePostComment} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full rounded-full bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:scale-90 transition-all active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center py-2">
                  <button 
                    onClick={signInWithGoogle}
                    className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Sign in to comment
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
