import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface CollectionSkeletonProps {
  variant?: 'card' | 'list' | 'detail';
  count?: number;
}

const CollectionSkeleton: React.FC<CollectionSkeletonProps> = ({
  variant = 'card',
  count = 3
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [opacity]);

  const SkeletonBox = ({ width, height, borderRadius = 8, marginBottom = 0, marginRight = 0 }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    marginBottom?: number;
    marginRight?: number;
  }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          marginBottom,
          marginRight,
        } as any,
        { opacity }
      ]}
    />
  );

  const renderCardSkeleton = () => (
    <View style={[styles.cardContainer, { backgroundColor: colors.card }]}>
      {/* Header section */}
      <View style={styles.cardHeader}>
        <SkeletonBox width="60%" height={20} marginBottom={8} />
        <SkeletonBox width="30%" height={14} />
      </View>
      
      {/* Business images row */}
      <View style={styles.imagesRow}>
        <SkeletonBox width={80} height={80} borderRadius={12} marginRight={8} />
        <SkeletonBox width={80} height={80} borderRadius={12} marginRight={8} />
        <SkeletonBox width={80} height={80} borderRadius={12} />
      </View>
      
      {/* Footer section */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <SkeletonBox width={32} height={32} borderRadius={16} marginRight={8} />
          <View>
            <SkeletonBox width={80} height={14} marginBottom={4} />
            <SkeletonBox width={60} height={12} />
          </View>
        </View>
        <SkeletonBox width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );

  const renderListSkeleton = () => (
    <View style={[styles.listContainer, { backgroundColor: colors.card }]}>
      <View style={styles.listHeader}>
        <SkeletonBox width={60} height={60} borderRadius={12} marginRight={12} />
        <View style={styles.listContent}>
          <SkeletonBox width="70%" height={18} marginBottom={4} />
          <SkeletonBox width="50%" height={14} marginBottom={8} />
          <SkeletonBox width="40%" height={12} />
        </View>
        <SkeletonBox width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );

  const renderDetailSkeleton = () => (
    <View style={styles.detailContainer}>
      {/* Header section */}
      <View style={[styles.detailHeader, { backgroundColor: colors.card }]}>
        <SkeletonBox width="80%" height={24} marginBottom={8} />
        <SkeletonBox width="60%" height={16} marginBottom={12} />
        <View style={styles.statsRow}>
          <SkeletonBox width={60} height={14} marginRight={16} />
          <SkeletonBox width={60} height={14} marginRight={16} />
          <SkeletonBox width={60} height={14} />
        </View>
      </View>
      
      {/* Business items */}
      {[...Array(3)].map((_, index) => (
        <View key={index} style={[styles.businessItem, { backgroundColor: colors.card }]}>
          <SkeletonBox width={80} height={80} borderRadius={12} marginRight={12} />
          <View style={styles.businessContent}>
            <SkeletonBox width="70%" height={18} marginBottom={4} />
            <SkeletonBox width="50%" height={14} marginBottom={4} />
            <SkeletonBox width="60%" height={14} marginBottom={8} />
            <View style={styles.ratingRow}>
              <SkeletonBox width={80} height={16} marginRight={8} />
              <SkeletonBox width={40} height={16} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSkeletonVariant = () => {
    switch (variant) {
      case 'list':
        return renderListSkeleton();
      case 'detail':
        return renderDetailSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  if (variant === 'detail') {
    return renderDetailSkeleton();
  }

  return (
    <View>
      {[...Array(count)].map((_, index) => (
        <View key={index} style={{ marginBottom: 16 }}>
          {renderSkeletonVariant()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBox: {
    // Base skeleton box style
  },
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContainer: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
  },
  detailContainer: {
    gap: 16,
  },
  detailHeader: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  businessContent: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CollectionSkeleton;
