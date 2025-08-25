import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Mock data for categories
const categories = [
  { id: 1, name: 'Restaurants', icon: 'restaurant', color: '#FF6B6B', count: 150 },
  { id: 2, name: 'Shopping', icon: 'bag', color: '#4ECDC4', count: 89 },
  { id: 3, name: 'Services', icon: 'construct', color: '#45B7D1', count: 234 },
  { id: 4, name: 'Entertainment', icon: 'game-controller', color: '#F7DC6F', count: 67 },
  { id: 5, name: 'Health & Wellness', icon: 'medical', color: '#BB8FCE', count: 45 },
  { id: 6, name: 'Education', icon: 'school', color: '#85C1E9', count: 78 },
  { id: 7, name: 'Automotive', icon: 'car', color: '#F8C471', count: 56 },
  { id: 8, name: 'Real Estate', icon: 'home', color: '#82E0AA', count: 92 },
];

const trending = [
  { id: 1, title: 'Pizza Places', subtitle: 'Trending now', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop' },
  { id: 2, title: 'Coffee Shops', subtitle: 'Popular today', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop' },
  { id: 3, title: 'Beauty Salons', subtitle: 'Most searched', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop' },
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.card }]}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={32} color={item.color} />
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.categoryCount, { color: colors.icon }]}>{item.count} businesses</Text>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

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
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.categoriesContainer}
          />
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
    paddingBottom: 12,
    paddingHorizontal: 24,
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
});
