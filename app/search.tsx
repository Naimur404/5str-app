import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Business, SearchResponse } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (params.q) {
      setSearchQuery(params.q as string);
    }
    getCurrentLocation();
  }, [params.q]);

  useEffect(() => {
    if (searchQuery && location) {
      performSearch();
    }
  }, [searchQuery, location]);

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      // Use default location if permission denied
      setLocation({ latitude: 22.3569, longitude: 91.7832 });
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim() || !location) return;

    setLoading(true);
    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SEARCH)}?q=${encodeURIComponent(searchQuery)}&type=all&latitude=${location.latitude}&longitude=${location.longitude}&sort=rating&limit=10`;
      
      const response = await fetch(url);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        Alert.alert('Error', 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Network error during search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch();
    }
  };

  const renderBusinessItem = ({ item }: { item: Business }) => (
    <TouchableOpacity style={[styles.businessItem, { backgroundColor: colors.background }]}>
      <Image 
        source={{ uri: getImageUrl(item.logo_image) || getFallbackImageUrl('business') }} 
        style={styles.businessImage} 
      />
      <View style={styles.businessInfo}>
        <View style={styles.businessHeader}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.business_name}
          </Text>
          {item.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
        </View>
        <Text style={[styles.businessCategory, { color: colors.icon }]}>
          {item.category?.name} • {item.subcategory_name}
        </Text>
        {item.description && (
          <Text style={[styles.businessDescription, { color: colors.icon }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.businessMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.rating, { color: colors.text }]}>{item.overall_rating}</Text>
            {item.total_reviews && (
              <Text style={[styles.reviewCount, { color: colors.icon }]}>
                ({item.total_reviews})
              </Text>
            )}
          </View>
          {item.distance_km && (
            <Text style={[styles.distance, { color: colors.tint }]}>{item.distance_km} km away</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.icon} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search businesses, services..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Search Results */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Searching...</Text>
          </View>
        ) : searchResults ? (
          <View>
            {/* Results Summary */}
            <View style={styles.resultsSummary}>
              <Text style={[styles.resultsText, { color: colors.text }]}>
                {searchResults.total_results} results for "{searchResults.search_term}"
              </Text>
            </View>

            {/* Business Results */}
            {searchResults.results.businesses.data.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Businesses</Text>
                <FlatList
                  data={searchResults.results.businesses.data}
                  renderItem={renderBusinessItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <View style={styles.noResults}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="search-outline" size={80} color="#e0e0e0" />
                </View>
                <Text style={[styles.noResultsTitle, { color: colors.text }]}>No businesses found</Text>
                <Text style={[styles.noResultsText, { color: colors.icon }]}>
                  Try searching with different keywords or check your spelling
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.retryButtonText}>Try different search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.initialState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="search-outline" size={80} color="#e0e0e0" />
            </View>
            <Text style={[styles.initialTitle, { color: colors.text }]}>Search for businesses</Text>
            <Text style={[styles.initialText, { color: colors.icon }]}>
              Find restaurants, shops, services and more near you
            </Text>
            <View style={styles.searchSuggestions}>
              <Text style={[styles.suggestionsTitle, { color: colors.text }]}>Popular searches:</Text>
              <View style={styles.suggestionTags}>
                {['Restaurant', 'Coffee', 'Shopping', 'Beauty'].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.suggestionTag, { borderColor: colors.tint + '30' }]}
                    onPress={() => setSearchQuery(tag)}
                  >
                    <Text style={[styles.suggestionTagText, { color: colors.tint }]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsSummary: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  businessInfo: {
    flex: 1,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  businessCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
  initialState: {
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  initialTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  initialText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchSuggestions: {
    marginTop: 32,
    alignSelf: 'stretch',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionTag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
