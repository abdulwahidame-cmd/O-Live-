import { useState } from 'react';
import Navbar from './components/Navbar';
import VideoFeed from './components/VideoFeed';
import LiveFeed from './components/LiveFeed';
import HomeFeed from './components/HomeFeed';
import DiscoverView from './components/DiscoverView';
import ProfileView from './components/ProfileView';
import NotificationsView from './components/NotificationsView';
import UploadModal from './components/UploadModal';
import LiveModal from './components/LiveModal';
import LoginModal from './components/LoginModal';
import { NotificationProvider } from './contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'live' | 'discover' | 'notifications' | 'profile'>('shorts');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const { user, loading, isAuthReady, isLoginModalOpen, openLoginModal, closeLoginModal } = useFirebase();

  const handleUploadClick = () => {
    if (!user) {
      openLoginModal();
    } else {
      setIsUploadOpen(true);
    }
  };

  if (loading || !isAuthReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
          <p className="text-sm font-medium text-white/40 uppercase tracking-widest">TikTok Clone Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Background Atmosphere */}
      <div className="atmosphere" />

      {/* Content Area */}
      <main className="h-full w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full w-full"
            >
              <HomeFeed />
            </motion.div>
          )}

          {activeTab === 'shorts' && (
            <motion.div
              key="shorts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full w-full"
            >
              <VideoFeed />
            </motion.div>
          )}

          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full w-full"
            >
              <LiveFeed onGoLive={() => setIsLiveOpen(true)} />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full w-full"
            >
              <NotificationsView />
            </motion.div>
          )}

          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full w-full"
            >
              <DiscoverView />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full w-full"
            >
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <LiveModal isOpen={isLiveOpen} onClose={() => setIsLiveOpen(false)} />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />

      {/* Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onUploadClick={handleUploadClick}
      />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </FirebaseProvider>
  );
}


