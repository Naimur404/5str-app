/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f4fafcff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    tabBackground: '#ffffff',
    tabBorder: '#e2e8f0',
    tabShadow: 'rgba(0, 0, 0, 0.08)',
    tabActiveBackground: '#f1f5f9',
    card: '#fff',
    border: '#e5e5e5',
    headerGradientStart: '#6366f1',
    headerGradientEnd: '#8b5cf6',
    buttonPrimary: '#6366f1',
    buttonText: '#fff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#3b82f6', // Better blue tint for dark mode
    icon: '#9BA1A6',
    tabIconDefault: '#64748b',
    tabIconSelected: '#3b82f6',
    tabBackground: '#1e293b',
    tabBorder: '#334155',
    tabShadow: 'rgba(0, 0, 0, 0.3)',
    tabActiveBackground: '#334155',
    card: '#1f2937',
    border: '#374151',
    headerGradientStart: '#1f2937',
    headerGradientEnd: '#374151',
    buttonPrimary: '#3b82f6',
    buttonText: '#fff',
  },
};
