import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  colors: any;
}

// Base skeleton box component
const SkeletonBox = ({ width, height, borderRadius = 8, backgroundColor }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  backgroundColor: string;
}) => (
  <View 
    style={[
      styles.skeletonBox, 
      { 
        width: width as any, 
        height, 
        borderRadius, 
        backgroundColor 
      }
    ]} 
  />
);

// Business Details Skeleton
export const BusinessDetailsSkeleton = ({ colors }: SkeletonProps) => (
  <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
    {/* Hero Section Skeleton */}
    <SkeletonBox 
      width="100%" 
      height={320} 
      borderRadius={0}
      backgroundColor={colors.icon + '20'} 
    />
    
    {/* Quick Actions Skeleton */}
    <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
      {[...Array(4)].map((_, index) => (
        <View key={index} style={styles.actionButton}>
          <SkeletonBox 
            width={40} 
            height={40} 
            borderRadius={20}
            backgroundColor={colors.icon + '20'} 
          />
          <SkeletonBox 
            width={50} 
            height={12} 
            borderRadius={6}
            backgroundColor={colors.icon + '20'} 
          />
        </View>
      ))}
    </View>
    
    {/* Tab Bar Skeleton */}
    <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
      {[...Array(3)].map((_, index) => (
        <SkeletonBox 
          key={index}
          width={80} 
          height={16} 
          borderRadius={8}
          backgroundColor={colors.icon + '20'} 
        />
      ))}
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
              width="80%" 
              height={14} 
              borderRadius={7}
              backgroundColor={colors.icon + '15'} 
            />
            <SkeletonBox 
              width="60%" 
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

// Home Page Skeleton
export const HomePageSkeleton = ({ colors }: SkeletonProps) => (
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
);

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
    opacity: 0.7,
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

// Business List Page Skeleton (for Open Now, Top Rated, Popular Nearby)
export const BusinessListSkeleton = ({ colors }: SkeletonProps) => (
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
);

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
