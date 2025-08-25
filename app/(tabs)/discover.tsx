import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getCategories } from '@/services/api';
import { Category } from '@/types/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';

// Mock data for trending (keeping this for now)
const trending = [
  { id: 1, title: 'Pizza Places', subtitle: 'Trending now', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop' },
  { id: 2, title: 'Coffee Shops', subtitle: 'Popular today', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop' },
  { id: 3, title: 'Beauty Salons', subtitle: 'Most searched', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop' },
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getCategories(1, 50); // Get up to 50 categories

      if (response.success) {
        setCategories(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load categories. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Unable to load categories. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const handleCategoryPress = (category: Category) => {
    router.push(`/category/${category.id}?name=${encodeURIComponent(category.name)}&color=${encodeURIComponent(category.color_code)}`);
  };

  const getServiceIcon = (slug: string): any => {
    const iconMap: { [key: string]: any } = {
      'restaurants': 'restaurant',
      'shopping': 'bag',
      'services': 'construct',
      'entertainment': 'game-controller',
      'health-wellness': 'medical',
      'education': 'school',
      'automotive': 'car',
      'real-estate': 'home',
      'beauty': 'cut',
      'fitness': 'fitness',
      'technology': 'laptop',
      'travel': 'airplane',
    };
    return iconMap[slug] || 'business';
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={[styles.categoryCard, { backgroundColor: colors.card }]}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color_code + '20' }]}>
        <Ionicons name={getServiceIcon(item.slug)} size={32} color={item.color_code} />
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.categoryCount, { color: colors.icon }]}>{item.total_businesses} businesses</Text>
    </TouchableOpacity>
  );

  const renderTrendingItem = ({ item }: { item: typeof trending[0] }) => (
    <TouchableOpacity style={styles.trendingCard}>
      <Image source={{ uri: item.image }} style={styles.trendingImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.trendingOverlay}
      >
        <Text style={styles.trendingTitle}>{item.title}</Text>
        <Text style={styles.trendingSubtitle}>{item.subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Fixed Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Explore categories and find what you need</Text>
        
        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchContainer}
          onPress={() => router.push('/search' as any)}
          activeOpacity={1}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <Text style={[styles.searchPlaceholder, { color: colors.icon }]}>
              Search categories, businesses...
            </Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >

        {/* Trending Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Now</Text>
          <FlatList
            data={trending}
            renderItem={renderTrendingItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingContainer}
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Categories</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.icon }]}>Loading categories...</Text>
            </View>
          ) : categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No categories available at the moment.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="location-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Nearby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="star-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Top Rated</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="time-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Open Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="pricetag-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Offers</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 165,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  trendingContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  trendingCard: {
    width: 200,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  trendingTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trendingSubtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
