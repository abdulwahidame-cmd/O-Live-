import React, { useState, useEffect } from 'react';
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
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

export const useFollow = (targetUid: string) => {
  const { user, profile } = useFirebase();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !targetUid || user.uid === targetUid) return;
      try {
        const q = query(
          collection(db, 'follows'),
          where('followerUid', '==', user.uid),
          where('followingUid', '==', targetUid)
        );
        const querySnapshot = await getDocs(q);
        setIsFollowing(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user, targetUid]);

  const toggleFollow = async () => {
    if (!user || !targetUid || user.uid === targetUid || loading) return;
    
    setLoading(true);
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    try {
      if (newFollowingState) {
        await addDoc(collection(db, 'follows'), {
          followerUid: user.uid,
          followingUid: targetUid,
          createdAt: serverTimestamp()
        });

        // Send notification to followed user
        await addDoc(collection(db, 'notifications'), {
          recipientUid: targetUid,
          type: 'follow',
          senderUid: user.uid,
          username: profile?.username || user.displayName || 'user',
          message: 'started following you',
          isRead: false,
          createdAt: serverTimestamp(),
          avatar: profile?.avatar || user.photoURL || undefined
        });
      } else {
        const q = query(
          collection(db, 'follows'),
          where('followerUid', '==', user.uid),
          where('followingUid', '==', targetUid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await deleteDoc(doc(db, 'follows', document.id));
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'follows');
      setIsFollowing(!newFollowingState);
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, toggleFollow, loading };
};
