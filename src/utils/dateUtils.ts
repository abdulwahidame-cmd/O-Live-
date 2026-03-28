/**
 * Formats a timestamp into a human-readable relative time string.
 */
export const formatTime = (timestamp: any): string => {
  if (!timestamp) return 'Just now';
  
  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'Just now';
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (isNaN(diff)) return 'Just now';
  
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};
