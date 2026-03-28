import { Video } from '../types';
import { MOCK_VIDEOS } from '../mockData';

// Mock data for the recommendation engine
export interface UserPreferences {
  likedVideoIds: string[];
  followedUsernames: string[];
  viewHistory: string[]; // IDs of videos watched
}

export const getRecommendations = (preferences: UserPreferences): Video[] => {
  // 1. Extract preferred categories and tags from liked videos
  const likedVideos = MOCK_VIDEOS.filter(v => preferences.likedVideoIds.includes(v.id));
  const preferredCategories = new Set(likedVideos.map(v => v.category).filter(Boolean));
  const preferredTags = new Set(likedVideos.flatMap(v => v.tags || []));

  // 2. Score each video based on preferences
  const scoredVideos = MOCK_VIDEOS.map(video => {
    let score = 0;

    // Boost if user follows the creator
    if (preferences.followedUsernames.includes(video.username)) {
      score += 10;
    }

    // Boost if video is in a preferred category
    if (video.category && preferredCategories.has(video.category)) {
      score += 5;
    }

    // Boost based on matching tags
    video.tags?.forEach(tag => {
      if (preferredTags.has(tag)) {
        score += 2;
      }
    });

    // Penalize slightly if already watched
    if (preferences.viewHistory.includes(video.id)) {
      score -= 3;
    }

    // Add some randomness for discovery
    score += Math.random() * 2;

    return { video, score };
  });

  // 3. Sort by score and return the videos
  return scoredVideos
    .sort((a, b) => b.score - a.score)
    .map(item => item.video);
};

export const getTrendingVideos = (): Video[] => {
  return [...MOCK_VIDEOS].sort((a, b) => b.likes - a.likes);
};
