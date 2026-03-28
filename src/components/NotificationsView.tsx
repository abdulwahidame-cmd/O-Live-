import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Trash2, Radio, UserPlus, Heart, MessageCircle, LogIn } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { formatTime } from '../utils/dateUtils';

export default function NotificationsView() {
  const { notifications, markAllAsRead, clearNotifications, markAsRead } = useNotifications();
  const { user, openLoginModal } = useFirebase();

  useEffect(() => {
    if (user) {
      // Mark all as read when viewing the notifications tab
      return () => markAllAsRead();
    }
  }, [markAllAsRead, user]);

  if (!user) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black px-6 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-white/20">
          <Bell size={48} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">Sign in to see notifications</h2>
        <p className="mb-8 text-sm text-white/40 max-w-[280px]">
          Stay updated with likes, comments, and follows from your community.
        </p>
        <button 
          onClick={openLoginModal}
          className="flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-orange-600 py-4 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 active:scale-95"
        >
          <LogIn size={18} />
          Sign in with Google
        </button>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'live': return <Radio size={14} className="text-red-500" />;
      case 'follow': return <UserPlus size={14} className="text-blue-500" />;
      case 'like': return <Heart size={14} className="text-red-500" />;
      case 'comment': return <MessageCircle size={14} className="text-green-500" />;
      default: return <Bell size={14} className="text-orange-500" />;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-black p-4 pb-24 no-scrollbar">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 shadow-lg shadow-orange-600/20">
            <Bell size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Inbox</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Mark all as read"
          >
            <CheckCheck size={18} />
          </button>
          <button 
            onClick={clearNotifications}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-red-500 transition-colors"
            title="Clear all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => markAsRead(notification.id)}
                className={`relative flex items-center gap-4 rounded-2xl p-4 transition-all ${
                  notification.isRead ? 'bg-white/5 opacity-60' : 'bg-white/10 ring-1 ring-white/10'
                }`}
              >
                {!notification.isRead && (
                  <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-orange-500" />
                )}
                
                <div className="relative">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10">
                    <img 
                      src={notification.avatar} 
                      alt={notification.username} 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black ring-2 ring-zinc-900">
                    {getIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className="font-bold">@{notification.username}</span> {notification.message}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 flex-col items-center justify-center text-white/20"
            >
              <Bell size={48} className="mb-4" />
              <p className="text-sm font-medium">No notifications yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
