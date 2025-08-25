import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Animated, View, StyleSheet } from 'react-native';
import { useRef, useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (props.accessibilityState?.selected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [props.accessibilityState?.selected]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.activeBackground,
          {
            backgroundColor: colors.tabActiveBackground,
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <PlatformPressable
          {...props}
          style={[props.style, styles.pressable]}
          onPressIn={(ev) => {
            if (process.env.EXPO_OS === 'ios') {
              // Add a soft haptic feedback when pressing down on the tabs.
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            
            // Add press animation
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: props.accessibilityState?.selected ? 1.1 : 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]).start();
            
            props.onPressIn?.(ev);
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBackground: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
});
