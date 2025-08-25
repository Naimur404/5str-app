import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export default function BlurTabBarBackground() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        // System chrome material automatically adapts to the system's theme
        // and matches the native tab bar appearance on iOS.
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        intensity={90}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          }
        ]}
      />
      <View 
        style={[
          styles.overlay,
          {
            backgroundColor: colors.tabBackground,
            opacity: 0.7,
          }
        ]} 
      />
    </View>
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
