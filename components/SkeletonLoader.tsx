import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  colors: any;
  visible?: boolean;
}

// Optimized skeleton box component with memoization
const SkeletonBox = React.memo(({ width, height, borderRadius = 8, backgroundColor }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  backgroundColor: string;
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    const animate = () => {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600, // Faster animation for better perceived performance
            useNativeDriver: true, // Use native driver for better performance
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      
      animationRef.current.start();
    };
    
    animate();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View 
      style={[
        styles.skeletonBox, 
        { 
          width: width as any, 
          height, 
          borderRadius, 
          backgroundColor,
          opacity 
        }
      ]} 
    />
  );
});

// Business Details Skeleton
export const BusinessDetailsSkeleton = ({ colors }: SkeletonProps) => (
  <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
    {/* Hero Section Skeleton with Gradient Overlay */}
    <View style={styles.heroSkeleton}>
      <SkeletonBox 
        width="100%" 
        height={320} 
        borderRadius={0}
        backgroundColor={colors.icon + '20'} 
      />
      {/* Favorite button skeleton */}
      <View style={styles.favoriteButtonSkeleton}>
        <SkeletonBox 
          width={40} 
          height={40} 
          borderRadius={20}
          backgroundColor={colors.icon + '30'} 
        />
      </View>
      {/* Hero content overlay skeleton */}
      <View style={styles.heroContentSkeleton}>
        <SkeletonBox 
          width="80%" 
          height={24} 
          borderRadius={12}
          backgroundColor="rgba(255,255,255,0.3)" 
        />
        <SkeletonBox 
          width="60%" 
          height={16} 
          borderRadius={8}
          backgroundColor="rgba(255,255,255,0.2)" 
        />
        <View style={styles.heroMetaSkeleton}>
          <View style={styles.ratingBadgeSkeleton}>
            <SkeletonBox 
              width={12} 
              height={12} 
              borderRadius={6}
              backgroundColor="#FFD700" 
            />
            <SkeletonBox 
              width={30} 
              height={14} 
              borderRadius={7}
              backgroundColor="rgba(255,255,255,0.3)" 
            />
            <SkeletonBox 
              width={40} 
              height={14} 
              borderRadius={7}
              backgroundColor="rgba(255,255,255,0.3)" 
            />
          </View>
          <SkeletonBox 
            width={50} 
            height={14} 
            borderRadius={7}
            backgroundColor="rgba(255,255,255,0.2)" 
          />
          <View style={styles.verifiedBadgeSkeleton}>
            <SkeletonBox 
              width={12} 
              height={12} 
              borderRadius={6}
              backgroundColor="#4CAF50" 
            />
            <SkeletonBox 
              width={50} 
              height={14} 
              borderRadius={7}
              backgroundColor="rgba(255,255,255,0.3)" 
            />
          </View>
        </View>
      </View>
    </View>
    
    {/* Quick Actions Skeleton - Compact Design */}
    <View style={[styles.quickActionsSkeleton, { backgroundColor: colors.card }]}>
      {[...Array(4)].map((_, index) => (
        <View key={index} style={styles.actionButtonSkeleton}>
          <SkeletonBox 
            width={36} 
            height={36} 
            borderRadius={18}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width={45} 
            height={10} 
            borderRadius={5}
            backgroundColor={colors.icon + '15'} 
          />
        </View>
      ))}
    </View>
    
    {/* Modern Tab Bar Skeleton */}
    <View style={[styles.modernTabContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.modernTabBar, { backgroundColor: colors.card }]}>
        {[...Array(3)].map((_, index) => (
          <View key={index} style={styles.modernTabItemSkeleton}>
            <View style={[styles.tabIconSkeleton, { backgroundColor: index === 1 ? colors.tint + '20' : colors.icon + '15' }]}>
              <SkeletonBox 
                width={18} 
                height={18} 
                borderRadius={9}
                backgroundColor={index === 1 ? colors.tint : colors.icon + '40'} 
              />
            </View>
            <SkeletonBox 
              width={index === 0 ? 65 : index === 1 ? 75 : 55} 
              height={12} 
              borderRadius={6}
              backgroundColor={index === 1 ? colors.tint + '40' : colors.icon + '20'} 
            />
            {index === 1 && (
              <View style={[styles.activeTabIndicatorSkeleton, { backgroundColor: colors.tint }]} />
            )}
          </View>
        ))}
      </View>
    </View>
    
    {/* Content Skeleton */}
    <View style={styles.contentSkeleton}>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={[styles.section, { backgroundColor: colors.card }]}>
          <SkeletonBox 
            width={120} 
            height={18} 
            borderRadius={9}
            backgroundColor={colors.icon + '20'} 
          />
          <View style={styles.sectionContent}>
            <SkeletonBox 
              width="100%" 
              height={14} 
              borderRadius={7}
              backgroundColor={colors.icon + '15'} 
            />
            <SkeletonBox 
              width="85%" 
              height={14} 
              borderRadius={7}
              backgroundColor={colors.icon + '15'} 
            />
            <SkeletonBox 
              width="70%" 
              height={14} 
              borderRadius={7}
              backgroundColor={colors.icon + '15'} 
            />
          </View>
        </View>
      ))}
    </View>
  </View>
);

// Offer Details Skeleton
export const OfferDetailsSkeleton = ({ colors }: SkeletonProps) => (
  <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
    {/* Hero Section Skeleton */}
    <SkeletonBox 
      width="100%" 
      height={280} 
      borderRadius={0}
      backgroundColor={colors.icon + '20'} 
    />
    
    {/* Business Card Skeleton */}
    <View style={[styles.businessCardSkeleton, { backgroundColor: colors.card }]}>
      <SkeletonBox 
        width={60} 
        height={60} 
        borderRadius={30}
        backgroundColor={colors.icon + '20'} 
      />
      <View style={styles.businessInfo}>
        <SkeletonBox 
          width={150} 
          height={16} 
          borderRadius={8}
          backgroundColor={colors.icon + '20'} 
        />
        <SkeletonBox 
          width={100} 
          height={14} 
          borderRadius={7}
          backgroundColor={colors.icon + '15'} 
        />
      </View>
    </View>
    
    {/* Offer Details Sections */}
    <View style={styles.contentSkeleton}>
      {[...Array(2)].map((_, index) => (
        <View key={index} style={[styles.section, { backgroundColor: colors.card }]}>
          <SkeletonBox 
            width={120} 
            height={18} 
            borderRadius={9}
            backgroundColor={colors.icon + '20'} 
          />
          <View style={styles.detailRows}>
            {[...Array(3)].map((_, rowIndex) => (
              <View key={rowIndex} style={styles.detailRow}>
                <SkeletonBox 
                  width={20} 
                  height={20} 
                  borderRadius={10}
                  backgroundColor={colors.icon + '20'} 
                />
                <View style={styles.detailContent}>
                  <SkeletonBox 
                    width={80} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '15'} 
                  />
                  <SkeletonBox 
                    width={120} 
                    height={14} 
                    borderRadius={7}
                    backgroundColor={colors.icon + '20'} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  </View>
);

// Category Business Skeleton (reusable from existing implementation)
export const CategoryBusinessSkeleton = ({ colors }: SkeletonProps) => (
  <View style={[styles.businessCard, { backgroundColor: colors.card }]}>
    <SkeletonBox 
      width={80} 
      height={80} 
      borderRadius={12}
      backgroundColor={colors.icon + '20'} 
    />
    <View style={styles.businessContent}>
      <SkeletonBox 
        width="70%" 
        height={16} 
        borderRadius={8}
        backgroundColor={colors.icon + '20'} 
      />
      <SkeletonBox 
        width="50%" 
        height={14} 
        borderRadius={7}
        backgroundColor={colors.icon + '15'} 
      />
      <SkeletonBox 
        width="90%" 
        height={12} 
        borderRadius={6}
        backgroundColor={colors.icon + '15'} 
      />
      <View style={styles.businessMeta}>
        <SkeletonBox 
          width={60} 
          height={12} 
          borderRadius={6}
          backgroundColor={colors.icon + '15'} 
        />
        <SkeletonBox 
          width={40} 
          height={12} 
          borderRadius={6}
          backgroundColor={colors.icon + '15'} 
        />
      </View>
    </View>
  </View>
);

// Home Page Skeleton - optimized with memoization
export const HomePageSkeleton = React.memo(({ colors }: SkeletonProps) => (
  <View style={{ paddingBottom: 24 }}>
    {/* Hero Banner Skeleton */}
    <View style={styles.heroBannerSkeleton}>
      <SkeletonBox 
        width="100%" 
        height={200} 
        borderRadius={16}
        backgroundColor={colors.icon + '20'} 
      />
      <View style={styles.bannerDots}>
        {[...Array(3)].map((_, index) => (
          <SkeletonBox 
            key={index}
            width={8} 
            height={8} 
            borderRadius={4}
            backgroundColor={colors.icon + '30'} 
          />
        ))}
      </View>
    </View>
    
    {/* Top Services Grid Skeleton */}
    <View style={styles.sectionSkeleton}>
      <SkeletonBox 
        width={120} 
        height={20} 
        borderRadius={10}
        backgroundColor={colors.icon + '20'} 
      />
      <View style={styles.servicesGridSkeleton}>
        {[...Array(4)].map((_, index) => (
          <View key={index} style={styles.serviceItemSkeleton}>
            <SkeletonBox 
              width={60} 
              height={60} 
              borderRadius={30}
              backgroundColor={colors.icon + '20'} 
            />
            <SkeletonBox 
              width={70} 
              height={12} 
              borderRadius={6}
              backgroundColor={colors.icon + '15'} 
            />
          </View>
        ))}
      </View>
    </View>
    
    {/* Business Cards Sections Skeleton */}
    {[...Array(3)].map((_, sectionIndex) => (
      <View key={sectionIndex} style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <SkeletonBox 
            width={150} 
            height={20} 
            borderRadius={10}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width={60} 
            height={16} 
            borderRadius={8}
            backgroundColor={colors.icon + '15'} 
          />
        </View>
        <View style={styles.horizontalListSkeleton}>
          {[...Array(3)].map((_, cardIndex) => (
            <View key={cardIndex} style={[styles.homeBusinessCardSkeleton, { backgroundColor: colors.card }]}>
              <SkeletonBox 
                width="100%" 
                height={120} 
                borderRadius={12}
                backgroundColor={colors.icon + '20'} 
              />
              <View style={styles.cardContentSkeleton}>
                <SkeletonBox 
                  width="80%" 
                  height={16} 
                  borderRadius={8}
                  backgroundColor={colors.icon + '20'} 
                />
                <SkeletonBox 
                  width="60%" 
                  height={14} 
                  borderRadius={7}
                  backgroundColor={colors.icon + '15'} 
                />
                <View style={styles.cardMetaSkeleton}>
                  <SkeletonBox 
                    width={50} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '15'} 
                  />
                  <SkeletonBox 
                    width={40} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '15'} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
));

// Favourites Page Skeleton
export const FavouritesPageSkeleton = ({ colors }: SkeletonProps) => (
  <View style={styles.contentSkeleton}>
    {/* Filter buttons skeleton */}
    <View style={styles.filtersRowSkeleton}>
      {[...Array(3)].map((_, index) => (
        <SkeletonBox 
          key={index}
          width={80} 
          height={32} 
          borderRadius={16}
          backgroundColor={colors.icon + '20'} 
        />
      ))}
    </View>
    
    {/* Favourite items skeleton */}
    {[...Array(5)].map((_, index) => (
      <View key={index} style={[styles.favouriteCardSkeleton, { backgroundColor: colors.card }]}>
        <SkeletonBox 
          width={80} 
          height={80} 
          borderRadius={12}
          backgroundColor={colors.icon + '20'} 
        />
        <View style={styles.favouriteContentSkeleton}>
          <SkeletonBox 
            width="70%" 
            height={16} 
            borderRadius={8}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width="50%" 
            height={14} 
            borderRadius={7}
            backgroundColor={colors.icon + '15'} 
          />
          <View style={styles.favouriteMetaSkeleton}>
            <SkeletonBox 
              width={60} 
              height={12} 
              borderRadius={6}
              backgroundColor={colors.icon + '15'} 
            />
            <SkeletonBox 
              width={40} 
              height={12} 
              borderRadius={6}
              backgroundColor={colors.icon + '15'} 
            />
          </View>
          <SkeletonBox 
            width="40%" 
            height={12} 
            borderRadius={6}
            backgroundColor={colors.icon + '15'} 
          />
        </View>
        <View style={styles.favouriteActionSkeleton}>
          <SkeletonBox 
            width={60} 
            height={20} 
            borderRadius={10}
            backgroundColor={colors.icon + '20'} 
          />
        </View>
      </View>
    ))}
  </View>
);

// Profile Page Skeleton
export const ProfilePageSkeleton = ({ colors }: SkeletonProps) => (
  <View style={styles.contentSkeleton}>
    {/* User profile section skeleton */}
    <View style={[styles.profileSectionSkeleton, { backgroundColor: colors.card }]}>
      <SkeletonBox 
        width={100} 
        height={100} 
        borderRadius={50}
        backgroundColor={colors.icon + '20'} 
      />
      <View style={styles.profileInfoSkeleton}>
        <SkeletonBox 
          width={150} 
          height={20} 
          borderRadius={10}
          backgroundColor={colors.icon + '20'} 
        />
        <SkeletonBox 
          width={120} 
          height={16} 
          borderRadius={8}
          backgroundColor={colors.icon + '15'} 
        />
        <SkeletonBox 
          width={100} 
          height={14} 
          borderRadius={7}
          backgroundColor={colors.icon + '15'} 
        />
      </View>
    </View>
    
    {/* Stats row skeleton */}
    <View style={[styles.statsRowSkeleton, { backgroundColor: colors.card }]}>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={styles.statItemSkeleton}>
          <SkeletonBox 
            width={40} 
            height={24} 
            borderRadius={12}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width={60} 
            height={12} 
            borderRadius={6}
            backgroundColor={colors.icon + '15'} 
          />
        </View>
      ))}
    </View>
    
    {/* Level section skeleton */}
    <View style={[styles.levelSectionSkeleton, { backgroundColor: colors.card }]}>
      <View style={styles.levelHeaderSkeleton}>
        <SkeletonBox 
          width={40} 
          height={40} 
          borderRadius={20}
          backgroundColor={colors.icon + '20'} 
        />
        <View style={styles.levelInfoSkeleton}>
          <SkeletonBox 
            width={120} 
            height={16} 
            borderRadius={8}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width={100} 
            height={14} 
            borderRadius={7}
            backgroundColor={colors.icon + '15'} 
          />
        </View>
      </View>
      <SkeletonBox 
        width="100%" 
        height={8} 
        borderRadius={4}
        backgroundColor={colors.icon + '15'} 
      />
    </View>
    
    {/* Settings items skeleton */}
    {[...Array(6)].map((_, index) => (
      <View key={index} style={[styles.settingItemSkeleton, { backgroundColor: colors.card }]}>
        <View style={styles.settingLeftSkeleton}>
          <SkeletonBox 
            width={24} 
            height={24} 
            borderRadius={12}
            backgroundColor={colors.icon + '20'} 
          />
          <View style={styles.settingTextSkeleton}>
            <SkeletonBox 
              width={120} 
              height={16} 
              borderRadius={8}
              backgroundColor={colors.icon + '20'} 
            />
            <SkeletonBox 
              width={80} 
              height={12} 
              borderRadius={6}
              backgroundColor={colors.icon + '15'} 
            />
          </View>
        </View>
        <SkeletonBox 
          width={20} 
          height={20} 
          borderRadius={10}
          backgroundColor={colors.icon + '15'} 
        />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonBox: {
    // Removed opacity from here since it's now handled by animation
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentSkeleton: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sectionContent: {
    gap: 8,
  },
  businessCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  businessInfo: {
    flex: 1,
    gap: 8,
  },
  detailRows: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailContent: {
    flex: 1,
    gap: 4,
  },
  businessCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  businessContent: {
    flex: 1,
    gap: 6,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  // Home page skeleton styles
  heroBannerSkeleton: {
    margin: 16,
    marginBottom: 24,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  sectionSkeleton: {
    margin: 16,
    marginBottom: 24,
  },
  servicesGridSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  serviceItemSkeleton: {
    alignItems: 'center',
    gap: 8,
    width: 70,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  horizontalListSkeleton: {
    flexDirection: 'row',
    gap: 16,
  },
  homeBusinessCardSkeleton: {
    width: 200,
    borderRadius: 12,
    padding: 12,
  },
  cardContentSkeleton: {
    marginTop: 12,
    gap: 8,
  },
  cardMetaSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  // Favourites skeleton styles
  filtersRowSkeleton: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  favouriteCardSkeleton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  favouriteContentSkeleton: {
    flex: 1,
    gap: 8,
  },
  favouriteMetaSkeleton: {
    flexDirection: 'row',
    gap: 12,
  },
  favouriteActionSkeleton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile skeleton styles
  profileSectionSkeleton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
  },
  profileInfoSkeleton: {
    alignItems: 'center',
    gap: 8,
  },
  statsRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItemSkeleton: {
    alignItems: 'center',
    gap: 8,
  },
  levelSectionSkeleton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  levelHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelInfoSkeleton: {
    flex: 1,
    gap: 4,
  },
  settingItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeftSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTextSkeleton: {
    gap: 4,
  },
  // Business Details Skeleton - New Modern Styles
  heroSkeleton: {
    position: 'relative',
    height: 320,
  },
  favoriteButtonSkeleton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1,
  },
  heroContentSkeleton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    gap: 8,
  },
  heroMetaSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadgeSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonSkeleton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    gap: 4,
  },
  modernTabContainer: {
    backgroundColor: 'transparent',
  },
  modernTabBar: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modernTabItemSkeleton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
    gap: 8,
  },
  tabIconSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabIndicatorSkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});

// Discovery Page Skeleton
export const DiscoveryPageSkeleton = ({ colors }: SkeletonProps) => (
  <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
    {/* Trending Section Skeleton */}
    <View style={discoverySkeletonStyles.sectionSkeleton}>
      <SkeletonBox 
        width={120} 
        height={20} 
        backgroundColor={colors.icon + '20'} 
      />
      <View style={[discoverySkeletonStyles.horizontalScrollSkeleton, { marginTop: 16 }]}>
        {[...Array(3)].map((_, index) => (
          <View key={index} style={discoverySkeletonStyles.trendingCardSkeleton}>
            <SkeletonBox 
              width={200} 
              height={120} 
              borderRadius={12}
              backgroundColor={colors.icon + '20'} 
            />
          </View>
        ))}
      </View>
    </View>

    {/* Categories Section Skeleton */}
    <View style={discoverySkeletonStyles.sectionSkeleton}>
      <SkeletonBox 
        width={150} 
        height={20} 
        backgroundColor={colors.icon + '20'} 
      />
      <View style={[discoverySkeletonStyles.categoriesGridSkeleton, { marginTop: 16 }]}>
        {[...Array(6)].map((_, index) => (
          <View key={index} style={discoverySkeletonStyles.categoryCardSkeleton}>
            <SkeletonBox 
              width={64} 
              height={64} 
              borderRadius={32}
              backgroundColor={colors.icon + '20'} 
            />
            <SkeletonBox 
              width="80%" 
              height={16} 
              backgroundColor={colors.icon + '20'} 
            />
            <SkeletonBox 
              width="60%" 
              height={12} 
              backgroundColor={colors.icon + '20'} 
            />
          </View>
        ))}
      </View>
    </View>

    {/* Quick Actions Skeleton */}
    <View style={discoverySkeletonStyles.sectionSkeleton}>
      <SkeletonBox 
        width={100} 
        height={20} 
        backgroundColor={colors.icon + '20'} 
      />
      <View style={[discoverySkeletonStyles.quickActionsSkeleton, { marginTop: 16 }]}>
        {[...Array(4)].map((_, index) => (
          <View key={index} style={discoverySkeletonStyles.actionButtonSkeleton}>
            <SkeletonBox 
              width={24} 
              height={24} 
              backgroundColor={colors.icon + '20'} 
            />
            <SkeletonBox 
              width="60%" 
              height={12} 
              backgroundColor={colors.icon + '20'} 
            />
          </View>
        ))}
      </View>
    </View>
  </View>
);

// Additional styles for Discovery page skeleton
const discoverySkeletonStyles = StyleSheet.create({
  sectionSkeleton: {
    paddingHorizontal: 24,
    marginVertical: 20,
  },
  horizontalScrollSkeleton: {
    flexDirection: 'row',
    gap: 16,
  },
  trendingCardSkeleton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesGridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  categoryCardSkeleton: {
    width: (width - 72) / 2,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionsSkeleton: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSkeleton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

// Business List Page Skeleton - optimized with memoization
export const BusinessListSkeleton = React.memo(({ colors }: SkeletonProps) => (
  <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
    {/* Category filters skeleton */}
    <View style={businessListStyles.categoryFiltersContainer}>
      <View style={businessListStyles.categoryFiltersList}>
        {[...Array(4)].map((_, index) => (
          <SkeletonBox 
            key={index}
            width={80 + (index * 20)} 
            height={32} 
            borderRadius={16}
            backgroundColor={colors.icon + '20'} 
          />
        ))}
      </View>
    </View>

    {/* Location info skeleton */}
    <View style={[businessListStyles.locationInfo, { backgroundColor: colors.background }]}>
      <SkeletonBox 
        width={16} 
        height={16} 
        borderRadius={8}
        backgroundColor={colors.buttonPrimary + '40'} 
      />
      <SkeletonBox 
        width={250} 
        height={14} 
        borderRadius={7}
        backgroundColor={colors.icon + '20'} 
      />
    </View>

    {/* Business cards skeleton */}
    <View style={businessListStyles.businessList}>
      {[...Array(6)].map((_, index) => (
        <View key={index} style={[businessListStyles.businessCard, { backgroundColor: colors.card }]}>
          <View style={businessListStyles.businessRow}>
            {/* Business image skeleton */}
            <SkeletonBox 
              width={80} 
              height={80} 
              borderRadius={12}
              backgroundColor={colors.icon + '20'} 
            />
            
            {/* Business content skeleton */}
            <View style={businessListStyles.businessContent}>
              <View style={businessListStyles.businessMainInfo}>
                <SkeletonBox 
                  width="85%" 
                  height={16} 
                  borderRadius={8}
                  backgroundColor={colors.icon + '20'} 
                />
                <SkeletonBox 
                  width="60%" 
                  height={13} 
                  borderRadius={6}
                  backgroundColor={colors.icon + '15'} 
                />
              </View>
              
              <View style={businessListStyles.businessMetrics}>
                <View style={businessListStyles.ratingRow}>
                  <SkeletonBox 
                    width={12} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor="#FFD700" 
                  />
                  <SkeletonBox 
                    width={30} 
                    height={13} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '20'} 
                  />
                  <SkeletonBox 
                    width={40} 
                    height={11} 
                    borderRadius={5}
                    backgroundColor={colors.icon + '15'} 
                  />
                </View>
                <SkeletonBox 
                  width={50} 
                  height={12} 
                  borderRadius={6}
                  backgroundColor={colors.buttonPrimary + '40'} 
                />
              </View>
              
              <View style={businessListStyles.locationContainer}>
                <SkeletonBox 
                  width={12} 
                  height={12} 
                  borderRadius={6}
                  backgroundColor={colors.icon + '30'} 
                />
                <SkeletonBox 
                  width="70%" 
                  height={12} 
                  borderRadius={6}
                  backgroundColor={colors.icon + '15'} 
                />
              </View>
            </View>
            
            {/* Business actions skeleton */}
            <View style={businessListStyles.businessActions}>
              <SkeletonBox 
                width={65} 
                height={20} 
                borderRadius={10}
                backgroundColor={colors.icon + '20'} 
              />
              <SkeletonBox 
                width={36} 
                height={24} 
                borderRadius={12}
                backgroundColor={colors.buttonPrimary + '30'} 
              />
              <SkeletonBox 
                width={20} 
                height={20} 
                borderRadius={10}
                backgroundColor={colors.icon + '30'} 
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
));

// Additional styles for Business List skeleton
const businessListStyles = StyleSheet.create({
  categoryFiltersContainer: {
    paddingVertical: 12,
  },
  categoryFiltersList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 6,
  },
  businessList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  businessCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  businessRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  businessContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  businessMainInfo: {
    gap: 2,
  },
  businessMetrics: {
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
    paddingVertical: 4,
    gap: 4,
  },
});

// Notifications Page Skeleton
export const NotificationPageSkeleton = ({ colors }: SkeletonProps) => (
  <View style={[notificationSkeletonStyles.container, { backgroundColor: colors.background }]}>
    {/* Header skeleton */}
    <View style={[notificationSkeletonStyles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={notificationSkeletonStyles.headerLeft}>
        <SkeletonBox 
          width={24} 
          height={24} 
          borderRadius={12}
          backgroundColor={colors.icon + '20'} 
        />
        <View style={notificationSkeletonStyles.headerTitles}>
          <SkeletonBox 
            width={120} 
            height={24} 
            borderRadius={12}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width={80} 
            height={14} 
            borderRadius={7}
            backgroundColor={colors.icon + '15'} 
          />
        </View>
      </View>
      <View style={notificationSkeletonStyles.headerActions}>
        <SkeletonBox 
          width={90} 
          height={32} 
          borderRadius={16}
          backgroundColor={colors.buttonPrimary + '20'} 
        />
        <SkeletonBox 
          width={70} 
          height={32} 
          borderRadius={16}
          backgroundColor={'#FF3B30' + '20'} 
        />
      </View>
    </View>

    {/* Notification items skeleton */}
    <View style={notificationSkeletonStyles.listContainer}>
      {[...Array(6)].map((_, index) => (
        <View key={index} style={[notificationSkeletonStyles.notificationItem, { backgroundColor: colors.card }]}>
          <View style={notificationSkeletonStyles.notificationContent}>
            {/* Icon and unread dot */}
            <View style={notificationSkeletonStyles.iconContainer}>
              <SkeletonBox 
                width={24} 
                height={24} 
                borderRadius={12}
                backgroundColor={colors.icon + '20'} 
              />
              {index % 3 === 0 && (
                <View style={[notificationSkeletonStyles.unreadDot, { backgroundColor: colors.buttonPrimary }]} />
              )}
            </View>
            
            {/* Content */}
            <View style={notificationSkeletonStyles.notificationBody}>
              <SkeletonBox 
                width="85%" 
                height={16} 
                borderRadius={8}
                backgroundColor={colors.icon + '20'} 
              />
              <SkeletonBox 
                width="95%" 
                height={14} 
                borderRadius={7}
                backgroundColor={colors.icon + '15'} 
              />
              <SkeletonBox 
                width="75%" 
                height={14} 
                borderRadius={7}
                backgroundColor={colors.icon + '15'} 
              />
              <SkeletonBox 
                width={60} 
                height={12} 
                borderRadius={6}
                backgroundColor={colors.icon + '15'} 
              />
            </View>
            
            {/* Actions */}
            <View style={notificationSkeletonStyles.notificationActions}>
              <SkeletonBox 
                width={18} 
                height={18} 
                borderRadius={9}
                backgroundColor={colors.icon + '20'} 
              />
              {index % 3 === 0 && (
                <SkeletonBox 
                  width={18} 
                  height={18} 
                  borderRadius={9}
                  backgroundColor={colors.buttonPrimary + '30'} 
                />
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
);

// Additional styles for Notification skeleton
const notificationSkeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  headerTitles: {
    gap: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listContainer: {
    paddingVertical: 8,
    gap: 4,
  },
  notificationItem: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    flex: 1,
    gap: 6,
  },
  notificationActions: {
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
});

// Special Offers Page Skeleton - optimized for performance
export const SpecialOffersSkeleton = React.memo(({ colors, visible = true }: SkeletonProps & { visible?: boolean }) => {
  if (!visible) return null;
  
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
      {/* Location info skeleton */}
      <View style={[specialOffersStyles.locationInfo, { backgroundColor: colors.background }]}>
        <SkeletonBox 
          width={16} 
          height={16} 
          borderRadius={8}
          backgroundColor={colors.buttonPrimary + '40'}
        />
        <SkeletonBox 
          width={200} 
          height={14} 
          borderRadius={7}
          backgroundColor={colors.icon + '20'}
        />
      </View>

      {/* Offer cards skeleton */}
      <View style={specialOffersStyles.offersList}>
        {[...Array(6)].map((_, index) => (
          <View key={index} style={[specialOffersStyles.offerCard, { backgroundColor: colors.card }]}>
            <View style={specialOffersStyles.offerRow}>
              {/* Offer image container skeleton */}
              <View style={specialOffersStyles.offerImageContainer}>
                <SkeletonBox 
                  width={80} 
                  height={80} 
                  borderRadius={12}
                  backgroundColor={colors.icon + '20'}
                />
                {/* Discount badge skeleton */}
                <View style={specialOffersStyles.discountBadge}>
                  <SkeletonBox 
                    width={30} 
                    height={16} 
                    borderRadius={8}
                    backgroundColor="#FF4444"
                  />
                </View>
              </View>

              {/* Offer content skeleton */}
              <View style={specialOffersStyles.offerContent}>
                <View style={specialOffersStyles.offerMainInfo}>
                  <SkeletonBox 
                    width="90%" 
                    height={16} 
                    borderRadius={8}
                    backgroundColor={colors.icon + '20'}
                  />
                  <SkeletonBox 
                    width="65%" 
                    height={13} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '15'}
                  />
                </View>
                
                <View style={specialOffersStyles.offerMetrics}>
                  <View style={specialOffersStyles.ratingRow}>
                    <SkeletonBox 
                      width={12} 
                      height={12} 
                      borderRadius={6}
                      backgroundColor="#FFD700"
                    />
                    <SkeletonBox 
                      width={30} 
                      height={13} 
                      borderRadius={6}
                      backgroundColor={colors.icon + '20'}
                    />
                    <SkeletonBox 
                      width={35} 
                      height={11} 
                      borderRadius={5}
                      backgroundColor={colors.icon + '15'}
                    />
                  </View>
                  <SkeletonBox 
                    width={45} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.buttonPrimary + '40'}
                  />
                </View>

                <View style={specialOffersStyles.expiryContainer}>
                  <SkeletonBox 
                    width={12} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '30'}
                  />
                  <SkeletonBox 
                    width={120} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.icon + '15'}
                  />
                </View>
              </View>

              {/* Offer actions skeleton */}
              <View style={specialOffersStyles.offerActions}>
                <View style={[specialOffersStyles.savingsBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
                  <SkeletonBox 
                    width={50} 
                    height={12} 
                    borderRadius={6}
                    backgroundColor={colors.buttonPrimary}
                  />
                </View>
                <SkeletonBox 
                  width={20} 
                  height={20} 
                  borderRadius={10}
                  backgroundColor={colors.icon + '30'}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

// Additional styles for Special Offers skeleton
const specialOffersStyles = StyleSheet.create({
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 6,
  },
  offersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  offerCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  offerRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  offerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offerContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  offerMainInfo: {
    gap: 2,
  },
  offerMetrics: {
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
    paddingVertical: 4,
    gap: 8,
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
});
