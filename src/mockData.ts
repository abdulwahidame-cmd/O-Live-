import { Video, LiveStream } from './types';

export const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40030-large.mp4',
    thumbnail: 'https://picsum.photos/seed/neon/1080/1920',
    username: 'neon_dancer',
    description: 'Feeling the vibes tonight! ✨ #neon #dance #vibes',
    tags: ['dance', 'neon', 'vibes'],
    category: 'Dance',
    likes: 12400,
    comments: 456,
    shares: 89,
    musicName: 'Original Sound - Neon Vibes',
    captions: [
      { text: "Dancing in the neon lights...", startTime: 0, endTime: 3 },
      { text: "Feel the rhythm of the night!", startTime: 3, endTime: 6 },
      { text: "Let's keep the energy high! ✨", startTime: 6, endTime: 10 }
    ],
    qualities: [
      { label: '1080p', url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40030-large.mp4' },
      { label: '720p', url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40030-large.mp4' },
      { label: '480p', url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40030-large.mp4' }
    ]
  },
  {
    id: '2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-1881-large.mp4',
    thumbnail: 'https://picsum.photos/seed/nature/1080/1920',
    username: 'nature_lover',
    description: 'Autumn is finally here! 🍂 #autumn #nature #peace',
    tags: ['nature', 'autumn', 'peace'],
    category: 'Nature',
    likes: 8900,
    comments: 234,
    shares: 45,
    musicName: 'Nature Sounds - Autumn Breeze',
    captions: [
      { text: "The golden leaves of autumn...", startTime: 0, endTime: 4 },
      { text: "A gentle breeze in the trees 🍂", startTime: 4, endTime: 8 },
      { text: "Nature's peaceful transition.", startTime: 8, endTime: 12 }
    ],
    qualities: [
      { label: '1080p', url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-1881-large.mp4' },
      { label: '720p', url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-1881-large.mp4' },
      { label: '480p', url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-1881-large.mp4' }
    ]
  },
  {
    id: '3',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-the-shore-4112-large.mp4',
    thumbnail: 'https://picsum.photos/seed/ocean/1080/1920',
    username: 'ocean_breeze',
    description: 'The ocean is calling... 🌊 #ocean #beach #summer',
    tags: ['ocean', 'beach', 'summer'],
    category: 'Nature',
    likes: 15600,
    comments: 678,
    shares: 123,
    musicName: 'Ocean Waves - Relaxing',
    captions: [
      { text: "Listen to the crashing waves 🌊", startTime: 0, endTime: 5 },
      { text: "The endless blue horizon...", startTime: 5, endTime: 10 },
      { text: "Serenity by the shore.", startTime: 10, endTime: 15 }
    ],
    qualities: [
      { label: '1080p', url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-the-shore-4112-large.mp4' },
      { label: '720p', url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-the-shore-4112-large.mp4' },
      { label: '480p', url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-the-shore-4112-large.mp4' }
    ]
  },
  {
    id: '4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-long-exposure-4112-large.mp4',
    thumbnail: 'https://picsum.photos/seed/city/1080/1920',
    username: 'urban_explorer',
    description: 'City lights and long nights. 🌃 #city #night #urban',
    likes: 21000,
    comments: 890,
    shares: 210,
    musicName: 'City Lights - Urban Beats',
    category: 'Lifestyle',
    tags: ['city', 'night', 'urban'],
    qualities: [
      { label: '1080p', url: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-long-exposure-4112-large.mp4' },
      { label: '720p', url: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-long-exposure-4112-large.mp4' },
      { label: '480p', url: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-long-exposure-4112-large.mp4' }
    ]
  },
  {
    id: '5',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-cup-4112-large.mp4',
    thumbnail: 'https://picsum.photos/seed/coffee/1080/1920',
    username: 'coffee_addict',
    description: 'Morning fuel. ☕ #coffee #morning #aesthetic',
    likes: 18500,
    comments: 560,
    shares: 145,
    musicName: 'Morning Brew - Chill Lo-fi',
    category: 'Lifestyle',
    tags: ['coffee', 'morning', 'aesthetic'],
    qualities: [
      { label: '1080p', url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-cup-4112-large.mp4' },
      { label: '720p', url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-cup-4112-large.mp4' },
      { label: '480p', url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-cup-4112-large.mp4' }
    ]
  },
  {
    id: '6',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-mountain-landscape-with-a-lake-at-sunset-4112-large.mp4',
    thumbnail: 'https://picsum.photos/seed/mountain/1080/1920',
    username: 'nature_lover',
    description: 'Sunset at the lake. 🏔️ #mountains #sunset #nature',
    likes: 32000,
    comments: 1200,
    shares: 450,
    musicName: 'Mountain Echo - Nature',
    category: 'Nature',
    tags: ['mountains', 'sunset', 'nature'],
    qualities: [
      { label: '1080p', url: 'https://assets.mixkit.co/videos/preview/mixkit-mountain-landscape-with-a-lake-at-sunset-4112-large.mp4' },
      { label: '720p', url: 'https://assets.mixkit.co/videos/preview/mixkit-mountain-landscape-with-a-lake-at-sunset-4112-large.mp4' },
      { label: '480p', url: 'https://assets.mixkit.co/videos/preview/mixkit-mountain-landscape-with-a-lake-at-sunset-4112-large.mp4' }
    ]
  }
];

export const MOCK_STREAMS: LiveStream[] = [
  {
    id: '1',
    username: 'gamer_pro',
    title: 'Ranked Push! 🎮🔥',
    viewers: 12400,
    likes: 4500,
    thumbnail: 'https://picsum.photos/seed/gaming/600/800',
    isLive: true,
    category: 'Gaming'
  },
  {
    id: '2',
    username: 'chef_mario',
    title: 'Cooking Italian Classics 🍝',
    viewers: 8900,
    likes: 3200,
    thumbnail: 'https://picsum.photos/seed/cooking/600/800',
    isLive: true,
    category: 'Cooking'
  },
  {
    id: '3',
    username: 'travel_vlog',
    title: 'Exploring Tokyo at Night 🇯🇵',
    viewers: 15600,
    likes: 7800,
    thumbnail: 'https://picsum.photos/seed/tokyo/600/800',
    isLive: true,
    category: 'Travel'
  },
  {
    id: '4',
    username: 'fitness_guru',
    title: 'Morning Yoga Session 🧘‍♀️',
    viewers: 5600,
    likes: 2100,
    thumbnail: 'https://picsum.photos/seed/yoga/600/800',
    isLive: true,
    category: 'Fitness'
  },
  {
    id: '5',
    username: 'music_live',
    title: 'Acoustic Covers Night 🎸',
    viewers: 3400,
    likes: 1500,
    thumbnail: 'https://picsum.photos/seed/music/600/800',
    isLive: true,
    category: 'Music'
  },
  {
    id: '6',
    username: 'art_corner',
    title: 'Digital Painting Tutorial 🎨',
    viewers: 2100,
    likes: 980,
    thumbnail: 'https://picsum.photos/seed/art/600/800',
    isLive: true,
    category: 'Art'
  },
  {
    id: '7',
    username: 'nature_lover',
    title: 'Bird Watching in the Amazon 🦜',
    viewers: 1200,
    likes: 450,
    thumbnail: 'https://picsum.photos/seed/amazon/600/800',
    isLive: true,
    category: 'Travel'
  },
  {
    id: '8',
    username: 'tech_talk',
    title: 'New Gadgets Review 📱',
    viewers: 7800,
    likes: 2900,
    thumbnail: 'https://picsum.photos/seed/tech/600/800',
    isLive: true,
    category: 'Gaming'
  }
];

export interface ProfileUser {
  id: string;
  uid: string;
  name: string;
  username: string;
  avatar: string;
  followersCount: number;
}

export const MOCK_USERS: ProfileUser[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `u${i}`,
  uid: `uid-${i}`,
  name: `User ${i + 1}`,
  username: `user_${i + 1}`,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
  followersCount: Math.floor(Math.random() * 10000),
}));

export const MOCK_STREAM_STATS = {
  isStreamer: true,
  totalStreams: 42,
  totalViewHours: 1250,
  avgConcurrentViewers: 156,
  peakViewers: 890,
};

export const MOCK_LIKED_VIDEOS: Video[] = [
  {
    id: 'l1',
    url: '',
    thumbnail: 'https://picsum.photos/seed/l1/400/600',
    username: 'neon_dancer',
    description: 'Dancing all night!',
    likes: 45000,
    comments: 1200,
    shares: 450,
    musicName: 'Techno Beat'
  },
  {
    id: 'l2',
    url: '',
    thumbnail: 'https://picsum.photos/seed/l2/400/600',
    username: 'nature_lover',
    description: 'Beautiful sunset',
    likes: 32000,
    comments: 800,
    shares: 200,
    musicName: 'Sunset Melodies'
  }
];
