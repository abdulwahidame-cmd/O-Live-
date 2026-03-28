import { Home, Play, PlusSquare, User, Radio, Bell, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { useNotifications } from '../contexts/NotificationContext';
import { useFirebase } from '../contexts/FirebaseContext';

interface NavbarProps {
  activeTab: 'home' | 'shorts' | 'live' | 'discover' | 'notifications' | 'profile';
  setActiveTab: (tab: 'home' | 'shorts' | 'live' | 'discover' | 'notifications' | 'profile') => void;
  onUploadClick: () => void;
}

export default function Navbar({ activeTab, setActiveTab, onUploadClick }: NavbarProps) {
  const { unreadCount } = useNotifications();
  const { profile, user } = useFirebase();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-3 glass-card border-t border-white/10">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-orange-500' : 'text-white/60'}`}
      >
        <Home size={20} />
        <span className="text-[8px] font-medium uppercase tracking-wider">Home</span>
      </button>

      <button 
        onClick={() => setActiveTab('shorts')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'shorts' ? 'text-orange-500' : 'text-white/60'}`}
      >
        <Play size={20} />
        <span className="text-[8px] font-medium uppercase tracking-wider">Shorts</span>
      </button>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={onUploadClick}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 shadow-lg shadow-orange-600/20"
      >
        <PlusSquare size={24} className="text-white" />
      </motion.button>

      <button 
        onClick={() => setActiveTab('live')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'live' ? 'text-orange-500' : 'text-white/60'}`}
      >
        <Radio size={20} />
        <span className="text-[8px] font-medium uppercase tracking-wider">Live</span>
      </button>

      <button 
        onClick={() => setActiveTab('notifications')}
        className={`relative flex flex-col items-center gap-1 transition-colors ${activeTab === 'notifications' ? 'text-orange-500' : 'text-white/60'}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white ring-2 ring-zinc-900">
            {unreadCount}
          </span>
        )}
        <span className="text-[8px] font-medium uppercase tracking-wider">Inbox</span>
      </button>

      <button 
        onClick={() => setActiveTab('discover')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'discover' ? 'text-orange-500' : 'text-white/60'}`}
      >
        <Compass size={20} />
        <span className="text-[8px] font-medium uppercase tracking-wider">Discover</span>
      </button>

      <button 
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-orange-500' : 'text-white/60'}`}
      >
        {user ? (
          profile?.avatar ? (
            <div className={`h-5 w-5 overflow-hidden rounded-full border ${activeTab === 'profile' ? 'border-orange-500' : 'border-white/20'}`}>
              <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border ${activeTab === 'profile' ? 'border-orange-500' : 'border-white/20'}`}>
              <User size={12} />
            </div>
          )
        ) : (
          <User size={20} />
        )}
        <span className="text-[8px] font-medium uppercase tracking-wider">Profile</span>
      </button>
    </nav>
  );
}
