import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabBarBackground() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  return (
    <View 
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.tabBackground,
          shadowColor: colors.tabShadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 10,
        }
      ]} 
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
