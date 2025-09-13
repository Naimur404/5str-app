import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { addTrackingToPress } from '@/hooks/useFlatListTracking';
import { getNationalBusinesses, NationalBusinessResponse } from '@/services/api';
import { handleApiError } from '@/services/errorHandler';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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

  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showToast } = useToastGlobal();
  const scrollIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBusinesses();
  }, [activeTab]);

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
    <View style={styles.headerContainer}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.headerIcon, { backgroundColor: colors.tint }]}>
            <Ionicons name="flag" size={20} color="white" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Top National Brands
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              Leading brands across Bangladesh
            </Text>
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContainer}
        >
          {CATEGORY_TABS.map((tab, index) => {
            const isActive = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: tab.color + '15' }
                ]}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.tabIcon,
                  { backgroundColor: isActive ? tab.color : colors.card }
                ]}>
                  <Ionicons 
                    name={tab.icon} 
                    size={18} 
                    color={isActive ? 'white' : colors.icon} 
                  />
                </View>
                <Text style={[
                  styles.tabText,
                  { color: isActive ? tab.color : colors.text }
                ]}>
                  {tab.name}
                </Text>
                {isActive && (
                  <View style={[styles.activeTabIndicator, { backgroundColor: tab.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Category Description */}
      <View style={[styles.categoryDescription, { backgroundColor: colors.card }]}>
        <Text style={[styles.categoryDescriptionText, { color: colors.icon }]}>
          {getActiveCategory().description}
        </Text>
        {pagination.total > 0 && (
          <Text style={[styles.resultCount, { color: colors.text }]}>
            {pagination.total} brands found
          </Text>
        )}
      </View>
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
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border + '20' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.text }]}>
          National Brands
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  listContainer: {
    paddingBottom: 24,
  },
  headerContainer: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsScrollContainer: {
    paddingHorizontal: 4,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    minWidth: 80,
    position: 'relative',
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  },
  categoryDescription: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  businessCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
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
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nationalBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    padding: 12,
  },
  businessName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 12,
    marginBottom: 6,
  },
  businessDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 10,
    marginLeft: 2,
  },
  coverageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coverageBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  businessModel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessModelText: {
    fontSize: 10,
    marginLeft: 4,
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