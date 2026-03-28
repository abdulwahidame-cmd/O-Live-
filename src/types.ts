export interface Caption {
  text: string;
  startTime: number;
  endTime: number;
}

export interface VideoQuality {
  label: string;
  url: string;
}

export interface Video {
  id: string;
  uid?: string;
  url: string;
  thumbnail: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  musicName: string;
  captions?: Caption[];
  tags?: string[];
  category?: string;
  qualities?: VideoQuality[];
}

export interface LiveStream {
  id: string;
  uid?: string;
  username: string;
  title: string;
  viewers: number;
  likes: number;
  thumbnail: string;
  isLive: boolean;
  category: string;
}

export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Notification {
  id: string;
  recipientUid: string;
  type: 'live' | 'follow' | 'like' | 'comment';
  senderUid?: string;
  username: string;
  message: string;
  timestamp: any;
  isRead: boolean;
  avatar?: string;
}
