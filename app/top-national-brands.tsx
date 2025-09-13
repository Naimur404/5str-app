import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { addTrackingToPress } from '@/hooks/useFlatListTracking';
import { getNationalBusinesses } from '@/services/api';
import { handleApiError } from '@/services/errorHandler';
import { getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

type ItemType = 'ice_cream' | 'biscuits_snacks' | 'beverages' | 'food_processing';

interface CategoryTab {
  id: ItemType;
  name: string;
  displayName: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'ice_cream',
    name: 'Ice Cream',
    displayName: 'Ice Cream & Dairy',
    icon: 'ice-cream',
    color: '#FF6B9D',
    description: 'Premium ice cream brands and dairy products'
  },
  {
    id: 'biscuits_snacks',
    name: 'Biscuits',
    displayName: 'Biscuits & Snacks',
    icon: 'fast-food',
    color: '#FFA726',
    description: 'Popular biscuits and snack manufacturers'
  },
  {
    id: 'beverages',
    name: 'Beverages',
    displayName: 'Beverages',
    icon: 'wine',
    color: '#42A5F5',
    description: 'Leading beverage companies and brands'
  },
  {
    id: 'food_processing',
    name: 'Food Processing',
    displayName: 'Food Processing',
    icon: 'restaurant',
    color: '#66BB6A',
    description: 'Major food processing and manufacturing companies'
  }
];

interface Business {
  id: number;
  business_name: string;
  name: string;
  slug: string;
  description: string;
  overall_rating: string;
  total_reviews: number;
  category: {
    id: number;
    name: string;
    slug: string;
    color_code: string | null;
  };
  logo_image: {
    id: number;
    business_id: number;
    image_url: string;
    image_type: string;
    sort_order: number;
    is_primary: boolean;
  } | null;
  image_url: string | null;
  service_coverage: string;
  business_model: string;
  product_tags: string[];
  business_tags: string[];
  is_featured: boolean;
  is_verified: boolean;
  website_url: string | null;
  business_phone: string;
  full_address: string;
}

export default function TopNationalBrandsScreen() {
  const [activeTab, setActiveTab] = useState<ItemType>('ice_cream');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    has_more: false
  });
  const [availableFilters, setAvailableFilters] = useState<{
    item_types: Record<string, string>;
    business_models: string[];
    sort_options: string[];
  } | null>(null);

  // Animation for skeleton shimmer effect
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showToast } = useToastGlobal();
  const scrollIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBusinesses();
  }, [activeTab]);

  // Start shimmer animation for skeleton
  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      ).start();
    };

    if (loading && businesses.length === 0) {
      startShimmer();
    }

    return () => {
      shimmerAnimation.stopAnimation();
    };
  }, [loading, businesses.length, shimmerAnimation]);

  const fetchBusinesses = async (page: number = 1, isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (page === 1) {
      setLoading(true);
    }

    try {
      const response = await getNationalBusinesses(activeTab, page, 20, 'featured');
      
      if (response.success) {
        const newBusinesses = response.data.businesses;
        
        if (page === 1) {
          setBusinesses(newBusinesses);
        } else {
          setBusinesses(prev => [...prev, ...newBusinesses]);
        }
        
        setPagination(response.data.pagination);
        setAvailableFilters(response.data.available_filters);
      } else {
        showToast({ message: 'Failed to load national brands', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching national businesses:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTabPress = (tabId: ItemType) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      setBusinesses([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        has_more: false
      });

      // Animate tab indicator
      const tabIndex = CATEGORY_TABS.findIndex(tab => tab.id === tabId);
      Animated.spring(scrollIndicator, {
        toValue: tabIndex * (width / CATEGORY_TABS.length),
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  };

  const handleLoadMore = () => {
    if (pagination.has_more && !loading) {
      fetchBusinesses(pagination.current_page + 1);
    }
  };

  const onRefresh = () => {
    fetchBusinesses(1, true);
  };

  const getActiveCategory = () => {
    return CATEGORY_TABS.find(tab => tab.id === activeTab) || CATEGORY_TABS[0];
  };

  const renderBusinessCard = ({ item, index }: { item: Business, index: number }) => {
    const originalOnPress = () => {
      router.push(`/business/${item.id}` as any);
    };

    const onPressWithTracking = addTrackingToPress(
      originalOnPress, 
      item.id, 
      index, 
      `top_national_brands_${activeTab}`
    );

    const hasValidImage = item.logo_image?.image_url || item.image_url;

    return (
      <TouchableOpacity 
        style={[styles.businessCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}
        onPress={onPressWithTracking}
        activeOpacity={0.7}
      >
        {/* Business Image */}
        <View style={styles.imageContainer}>
          {hasValidImage ? (
            <Image 
              source={{ uri: getImageUrl(item.logo_image?.image_url || item.image_url) }} 
              style={styles.businessImage}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
              <Ionicons name="business-outline" size={32} color={colors.text + '40'} />
            </View>
          )}
          
          {/* National Badge */}
          <View style={[styles.nationalBadge, { backgroundColor: colors.tint }]}>
            <Ionicons name="flag" size={8} color="white" />
            <Text style={styles.nationalBadgeText}>National</Text>
          </View>
          
          {/* Verified Badge */}
          {item.is_verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={12} color="white" />
            </View>
          )}
        </View>

        {/* Business Info */}
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.business_name || item.name}
          </Text>
          
          <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
            {item.category.name}
          </Text>
          
          <Text style={[styles.businessDescription, { color: colors.icon }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Tags */}
          {item.business_tags && item.business_tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.business_tags.slice(0, 2).map((tag, tagIndex) => (
                <View key={tagIndex} style={[styles.tag, { backgroundColor: getActiveCategory().color + '15' }]}>
                  <Text style={[styles.tagText, { color: getActiveCategory().color }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Rating and Coverage */}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>{item.overall_rating}</Text>
              <Text style={[styles.reviewCount, { color: colors.icon }]}>({item.total_reviews})</Text>
            </View>
            
            <View style={[styles.coverageBadge, { backgroundColor: colors.tint + '15' }]}>
              <Text style={[styles.coverageBadgeText, { color: colors.tint }]}>
                {item.service_coverage === 'national' ? 'Nationwide' : item.service_coverage}
              </Text>
            </View>
          </View>
          
          {/* Business Model */}
          <View style={styles.businessModel}>
            <Ionicons 
              name={item.business_model === 'manufacturing' ? 'construct' : 'storefront'} 
              size={12} 
              color={colors.icon} 
            />
            <Text style={[styles.businessModelText, { color: colors.icon }]}>
              {item.business_model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
      {getActiveCategory().description && (
        <View style={[
          {
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            marginBottom: 8,
          }
        ]}>
          <Text style={[
            {
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 8,
              color: colors.text
            }
          ]}>
            {getActiveCategory().description}
          </Text>
          <Text style={[
            {
              fontSize: 12,
              fontWeight: '600',
              color: colors.tint
            }
          ]}>
            {businesses.length} national brands
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
        <Ionicons name={getActiveCategory().icon} size={48} color={colors.icon + '40'} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No {getActiveCategory().displayName} Found
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.icon }]}>
        We're working to add more national brands in this category.
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.tint }]}
        onPress={() => fetchBusinesses(1, true)}
      >
        <Ionicons name="refresh" size={16} color="white" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || businesses.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <Text style={[styles.footerLoaderText, { color: colors.icon }]}>
          Loading more brands...
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Enhanced LinearGradient Header with Hero Section */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.enhancedGradientHeader}
      >
        {/* Decorative Background Elements */}
        <View style={styles.heroBackground}>
          <View style={[styles.decorativeCircle1, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
          <View style={[styles.decorativeCircle2, { backgroundColor: getActiveCategory().color + '20' }]} />
          <View style={[styles.decorativeCircle3, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
        </View>

        <View style={styles.headerContent}>
          {/* Top Header Row */}
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={[styles.heroIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="flag" size={20} color="white" />
              <View style={[styles.iconGlow, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Top National Brands</Text>
              <Text style={styles.headerSubtitle}>
                Discover Bangladesh's leading companies in {getActiveCategory().displayName}
              </Text>
            </View>
          </View>

          {/* Hero Badges */}
          <View style={styles.heroBadgeContainer}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name={getActiveCategory().icon} size={10} color="white" />
              <Text style={[styles.heroBadgeText, { color: 'white' }]}>
                {getActiveCategory().displayName}
              </Text>
            </View>
            {pagination.total > 0 && (
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons name="business" size={10} color="white" />
                <Text style={[styles.heroBadgeText, { color: 'white' }]}>
                  {pagination.total} brands
                </Text>
              </View>
            )}
          </View>

          {/* Interactive Category Selection */}
          <View style={styles.categorySelectionContainer}>
            {CATEGORY_TABS.map((tab, index) => (
              <TouchableOpacity 
                key={tab.id}
                style={[
                  styles.categorySelectionTab, 
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                  activeTab === tab.id && { 
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1,
                    transform: [{ scale: 1.02 }]
                  }
                ]}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categorySelectionIcon, 
                  { 
                    backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                  }
                ]}>
                  <Ionicons 
                    name={tab.icon} 
                    size={16} 
                    color="white"
                  />
                </View>
                <Text style={[
                  styles.categorySelectionLabel, 
                  { 
                    color: 'white',
                    fontWeight: activeTab === tab.id ? '700' : '600',
                    opacity: activeTab === tab.id ? 1 : 0.85
                  }
                ]} numberOfLines={2}>
                  {tab.displayName}
                </Text>
                {activeTab === tab.id && (
                  <View style={[styles.activeCategoryIndicator, { backgroundColor: 'white' }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Show skeleton when loading and no businesses yet */}
      {loading && businesses.length === 0 ? (
        <View style={styles.listContainer}>
          {/* Category description skeleton */}
          <View style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <View style={[
              {
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }
            ]}>
              <Animated.View style={{
                height: 14,
                backgroundColor: colors.icon + '20',
                borderRadius: 7,
                marginBottom: 8,
                width: '85%',
                opacity: shimmerAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.7, 0.3],
                }),
              }} />
              <Animated.View style={{
                height: 12,
                backgroundColor: colors.tint + '40',
                borderRadius: 6,
                width: '40%',
                opacity: shimmerAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.7, 0.3],
                }),
              }} />
            </View>
          </View>
          
          {/* Create skeleton data and render using FlatList structure */}
          <FlatList
            data={[1, 2, 3, 4, 5, 6]} // 6 skeleton items
            renderItem={({ item, index }) => (
              <Animated.View 
                style={[
                  styles.businessCard,
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border + '20',
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.4, 0.8, 0.4],
                    }),
                  }
                ]}
              >
                {/* Image skeleton */}
                <View style={[
                  styles.imageContainer,
                  { backgroundColor: colors.icon + '15' }
                ]}>
                  <Animated.View style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    backgroundColor: colors.tint + '60',
                    paddingHorizontal: 5,
                    paddingVertical: 3,
                    borderRadius: 6,
                    width: 45,
                    height: 18,
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 0.9, 0.5],
                    }),
                  }} />
                  <Animated.View style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    backgroundColor: '#4CAF50',
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 0.9, 0.5],
                    }),
                  }} />
                </View>
                
                {/* Content skeleton */}
                <View style={styles.businessInfo}>
                  {/* Business name */}
                  <Animated.View style={{
                    height: 14,
                    backgroundColor: colors.icon + '25',
                    borderRadius: 7,
                    marginBottom: 4,
                    width: '80%',
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.7, 0.3],
                    }),
                  }} />
                  
                  {/* Category */}
                  <Animated.View style={{
                    height: 11,
                    backgroundColor: colors.icon + '20',
                    borderRadius: 5,
                    marginBottom: 5,
                    width: '60%',
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.7, 0.3],
                    }),
                  }} />
                  
                  {/* Description lines */}
                  <Animated.View style={{
                    height: 10,
                    backgroundColor: colors.icon + '15',
                    borderRadius: 5,
                    marginBottom: 2,
                    width: '90%',
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.7, 0.3],
                    }),
                  }} />
                  <Animated.View style={{
                    height: 10,
                    backgroundColor: colors.icon + '15',
                    borderRadius: 5,
                    marginBottom: 7,
                    width: '70%',
                    opacity: shimmerAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.7, 0.3],
                    }),
                  }} />
                  
                  {/* Tags */}
                  <View style={styles.tagsContainer}>
                    <Animated.View style={{
                      backgroundColor: colors.tint + '20',
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 4,
                      marginRight: 4,
                      width: 30,
                      height: 16,
                      opacity: shimmerAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.8, 0.4],
                      }),
                    }} />
                    <Animated.View style={{
                      backgroundColor: colors.icon + '20',
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 4,
                      width: 25,
                      height: 16,
                      opacity: shimmerAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.8, 0.4],
                      }),
                    }} />
                  </View>
                  
                  {/* Meta info */}
                  <View style={styles.businessMeta}>
                    <View style={styles.ratingContainer}>
                      <Animated.View style={{
                        width: 11,
                        height: 11,
                        backgroundColor: '#FFD700',
                        borderRadius: 5,
                        marginRight: 2,
                        opacity: shimmerAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.5, 0.9, 0.5],
                        }),
                      }} />
                      <Animated.View style={{
                        width: 30,
                        height: 11,
                        backgroundColor: colors.icon + '25',
                        borderRadius: 5,
                        marginLeft: 2,
                        opacity: shimmerAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.3, 0.7, 0.3],
                        }),
                      }} />
                      <Animated.View style={{
                        width: 25,
                        height: 9,
                        backgroundColor: colors.icon + '20',
                        borderRadius: 4,
                        marginLeft: 2,
                        opacity: shimmerAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.3, 0.7, 0.3],
                        }),
                      }} />
                    </View>
                    <Animated.View style={{
                      backgroundColor: colors.tint + '30',
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 6,
                      width: 35,
                      height: 16,
                      opacity: shimmerAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.8, 0.4],
                      }),
                    }} />
                  </View>
                  
                  {/* Business model */}
                  <View style={styles.businessModel}>
                    <Animated.View style={{
                      width: 12,
                      height: 12,
                      backgroundColor: colors.icon + '30',
                      borderRadius: 6,
                      marginRight: 3,
                      opacity: shimmerAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.8, 0.4],
                      }),
                    }} />
                    <Animated.View style={{
                      width: 40,
                      height: 9,
                      backgroundColor: colors.icon + '20',
                      borderRadius: 4,
                      opacity: shimmerAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.7, 0.3],
                      }),
                    }} />
                  </View>
                </View>
              </Animated.View>
            )}
            keyExtractor={(item, index) => `skeleton-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingHorizontal: 0 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <FlatList
          data={businesses}
          renderItem={renderBusinessCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!loading && businesses.length === 0 ? renderEmptyState : null}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Enhanced LinearGradient Header with Hero Section
  enhancedGradientHeader: {
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative Background Elements
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -40,
    right: -40,
    opacity: 0.6,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: -20,
    left: -20,
    opacity: 0.4,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 5,
    left: 5,
    opacity: 0.3,
  },

  headerContent: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  heroIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -5,
    left: -5,
    zIndex: -1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },

  // Hero Badges
  heroBadgeContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Category Selection in Header
  categorySelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categorySelectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
    maxWidth: 120,
    position: 'relative',
    minHeight: 44,
  },
  categorySelectionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  categorySelectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    lineHeight: 12,
    textAlign: 'center',
  },
  activeCategoryIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    height: 2,
    borderRadius: 1,
  },

  listContainer: {
    paddingBottom: 24,
    paddingTop: 20,
  },
  
  // Smaller Business Cards
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  businessCard: {
    width: (width - 36) / 2,
    marginBottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 110,
    backgroundColor: '#f5f5f5',
  },
  businessImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nationalBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nationalBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    padding: 10,
  },
  businessName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 11,
    marginBottom: 5,
  },
  businessDescription: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 7,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '600',
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 9,
    marginLeft: 2,
  },
  coverageBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverageBadgeText: {
    fontSize: 8,
    fontWeight: '600',
  },
  businessModel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessModelText: {
    fontSize: 9,
    marginLeft: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  footerLoaderText: {
    fontSize: 14,
  },
});