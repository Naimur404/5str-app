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
});
