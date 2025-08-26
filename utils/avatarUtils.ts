import { Ionicons } from '@expo/vector-icons';

// Array of human-related icons from Ionicons
const humanIcons = [
  'person',
  'person-circle',
  'happy',
  'man',
  'woman',
  'people',
  'accessibility',
  'body',
  'person-add',
  'people-circle',
  'person-outline',
  'people-outline',
  'happy-outline',
  'man-outline',
  'woman-outline',
] as const;

// Array of nice colors for the icons
const iconColors = [
  '#667eea', // Purple-blue
  '#764ba2', // Purple
  '#f093fb', // Pink
  '#f5576c', // Red-pink
  '#4facfe', // Blue
  '#00f2fe', // Cyan
  '#43e97b', // Green
  '#38ef7d', // Light green
  '#ffecd2', // Yellow-orange
  '#fcb69f', // Orange
  '#a8edea', // Turquoise
  '#fed6e3', // Light pink
  '#d299c2', // Mauve
  '#fef9d7', // Light yellow
  '#89f7fe', // Light blue
];

export const getRandomHumanIcon = (seed?: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  // Use a seed (like user ID or email) to ensure consistent randomness for the same user
  let seedNumber = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      seedNumber += seed.charCodeAt(i);
    }
  } else {
    seedNumber = Math.floor(Math.random() * 1000);
  }
  
  const iconIndex = seedNumber % humanIcons.length;
  const colorIndex = seedNumber % iconColors.length;
  
  return {
    name: humanIcons[iconIndex],
    color: iconColors[colorIndex],
  };
};
