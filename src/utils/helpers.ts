export const CATEGORIES = [
  'Daily Conversation',
  'Interview Practice',
  'IELTS',
  'Business English',
  'Pronunciation',
  'Debate',
  'Travel English',
  'Kids'
] as const;

export type CategoryType = typeof CATEGORIES[number];

export const DIFFICULTIES = [
  'Beginner',
  'Intermediate',
  'Advanced'
] as const;

export type DifficultyType = typeof DIFFICULTIES[number];

// Generates a random alphanumeric room ID
export function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Formats Supabase ISO timestamp to a human-readable duration since creation
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

// Generate random aesthetic colors for user avatars based on user name
export function getAvatarGradient(name: string): string {
  const colors = [
    'from-purple-600 to-indigo-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-pink-600 to-rose-600',
    'from-amber-600 to-orange-600',
    'from-violet-600 to-fuchsia-600'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
