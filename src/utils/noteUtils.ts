export function getTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return 'a minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return 'an hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (months === 1) return 'a month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return 'a year ago';
  return `${years} years ago`;
}
