import React, { useState } from 'react';
import { Search, TrendingUp, Music, Camera, Film, Gamepad2, Coffee, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORIES = [
  { id: 'trending', name: 'Trending', icon: <TrendingUp size={20} />, color: 'bg-orange-500' },
  { id: 'music', name: 'Music', icon: <Music size={20} />, color: 'bg-blue-500' },
  { id: 'vlog', name: 'Vlog', icon: <Camera size={20} />, color: 'bg-purple-500' },
  { id: 'film', name: 'Film', icon: <Film size={20} />, color: 'bg-red-500' },
  { id: 'gaming', name: 'Gaming', icon: <Gamepad2 size={20} />, color: 'bg-green-500' },
  { id: 'lifestyle', name: 'Lifestyle', icon: <Coffee size={20} />, color: 'bg-yellow-500' },
];

const TRENDING_HASHTAGS = [
  '#dancechallenge', '#vibecheck', '#cookwithme', '#gaminglife', '#travelgram', '#fitnessmotivation'
];

export default function DiscoverView() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full w-full overflow-y-auto bg-black p-4 pb-24 no-scrollbar">
      {/* Header */}
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
          Discover <span className="text-orange-600">New</span>
        </h1>
        <p className="text-xs font-medium uppercase tracking-widest text-white/40">
          Explore the latest trends and creators
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input 
          type="text"
          placeholder="Search for videos or creators..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl bg-white/5 py-4 pl-12 pr-4 text-sm font-medium text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-orange-500/50"
        />
      </div>

      {/* Categories Grid */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/60">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10 transition-all hover:bg-white/10"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.color} text-white shadow-lg`}>
                {category.icon}
              </div>
              <span className="text-sm font-bold text-white">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Trending Hashtags */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">Trending Now</h2>
          <Sparkles size={16} className="text-orange-500" />
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_HASHTAGS.map((tag) => (
            <button 
              key={tag}
              className="rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-white/80 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Creators */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/60">Featured Creators</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-400 p-[2px]">
                <div className="h-full w-full rounded-full border-2 border-black bg-zinc-800" />
              </div>
              <span className="text-[10px] font-bold text-white/60">Creator_{i}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
