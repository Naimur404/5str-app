import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Business, SearchResponse, Offering } from '@/types/api';
import { fetchWithJsonValidation } from '@/services/api';
import { useLocation } from '@/contexts/LocationContext';

export default function SearchScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI } = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMinCharsMessage, setShowMinCharsMessage] = useState(false);
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Handle different text lengths
    if (text.length === 0) {
      setSearchResults(null);
      setLoading(false);
      setShowMinCharsMessage(false);
    } else if (text.length === 1) {
      setSearchResults(null);
      setLoading(false);
      setShowMinCharsMessage(true);
    } else if (text.length >= 2) {
      console.log('Setting search timeout for query:', text);
      setShowMinCharsMessage(false);
      setLoading(true);

      // Debounce search
      searchTimeout.current = setTimeout(() => {
        console.log('Search timeout triggered for:', text);
        performSearch(text);
      }, 800);
    }
  };

  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      console.log('Search cancelled - query too short');
      setLoading(false);
      return;
    }

    console.log('Starting API search for:', query);
    setLoading(true);

    try {
      const coordinates = getCoordinatesForAPI();
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SEARCH)}?q=${encodeURIComponent(query)}&type=all&latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&sort=rating&limit=10`;
      console.log('Search URL:', url);
      
      const data: SearchResponse = await fetchWithJsonValidation(url);
      console.log('Search API response:', data);

      if (data.success) {
        setSearchResults(data.data);
        setLoading(false);
      } else {
        Alert.alert('Error', data.message || 'Search failed');
        setSearchResults(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error during search';
      Alert.alert('Error', errorMessage);
      setSearchResults(null);
      setLoading(false);
    }
  };

  const clearSearch = () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    setSearchQuery('');
    setSearchResults(null);
    setLoading(false);
    setShowMinCharsMessage(false);
  };

  const renderBusinessItem = ({ item }: { item: Business }) => {
    if (!item || !item.id) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={[styles.businessItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/business/${item.id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(item.images?.logo || item.logo_image) || getFallbackImageUrl('business') }} 
          style={styles.businessImage} 
        />
        <View style={styles.businessInfo}>
          <View style={styles.businessHeader}>
            <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
              {item.business_name || 'Unknown Business'}
            </Text>
            {item.is_verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
              </View>
            ) : null}
          </View>
          <Text style={[styles.businessCategory, { color: colors.icon }]}>
            {`${item.category?.name || 'Category'} • ${item.subcategory_name || 'Subcategory'}`}
          </Text>
          {item.description ? (
            <Text style={[styles.businessDescription, { color: colors.icon }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#d97706" />
              <Text style={styles.rating}>{item.overall_rating || '0.0'}</Text>
              {item.total_reviews ? (
                <Text style={styles.reviewCount}>
                  ({item.total_reviews})
                </Text>
              ) : null}
            </View>
            {item.distance_km ? (
              <Text style={[styles.distance, { color: colors.tint }]}>
                {item.distance_km} km
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderOfferingItem = ({ item }: { item: Offering }) => {
    if (!item || !item.id) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={[styles.businessItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/offering/${item.business.id}/${item.id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(item.image_url) || getFallbackImageUrl('offering') }} 
          style={styles.businessImage} 
        />
        <View style={styles.businessInfo}>
          <View style={styles.businessHeader}>
            <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
              {item.name || 'Unknown Offering'}
            </Text>
            {item.is_featured ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="star" size={16} color="#d97706" />
              </View>
            ) : null}
          </View>
          <Text style={[styles.businessCategory, { color: colors.icon }]}>
            {`${item.business.business_name} • ${item.business.area}`}
          </Text>
          {item.description ? (
            <Text style={[styles.businessDescription, { color: colors.icon }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Text style={[styles.rating, { color: '#059669' }]}>{item.price_range || `${item.currency} ${item.price}`}</Text>
            </View>
            {item.business.distance_km ? (
              <Text style={[styles.distance, { color: colors.tint }]}>
                {item.business.distance_km} km
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </View>
      </TouchableOpacity>
    );
  };

  console.log('Render called with state:', { 
    searchQuery, 
    hasResults: !!searchResults, 
    loading, 
    showMinCharsMessage,
    businessCount: searchResults?.results?.businesses?.data?.length || 0
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.headerGradientStart, colors.headerGradientEnd]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search businesses..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.tint }]}>Searching...</Text>
          </View>
        ) : showMinCharsMessage ? (
          <View style={[styles.messageContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.messageText, { color: colors.icon }]}>Type at least 2 characters to search</Text>
          </View>
        ) : searchResults && searchResults.results ? (
          <View>
            <View style={[styles.resultsSummary, { backgroundColor: colors.card }]}>
              <Text style={[styles.resultsText, { color: colors.text }]}>
                {searchResults.total_results || 0} results found
              </Text>
            </View>

            {/* Businesses Section */}
            {searchResults.results.businesses.data && searchResults.results.businesses.data.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Businesses</Text>
                <FlatList
                  data={searchResults.results.businesses.data.filter((item: any) => item && item.id)}
                  renderItem={renderBusinessItem}
                  keyExtractor={(item) => `business-${item.id?.toString() || Math.random().toString()}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Offerings Section */}
            {searchResults.results.offerings.data && searchResults.results.offerings.data.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Products & Services</Text>
                <FlatList
                  data={searchResults.results.offerings.data.filter((item: any) => item && item.id)}
                  renderItem={renderOfferingItem}
                  keyExtractor={(item) => `offering-${item.id?.toString() || Math.random().toString()}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* No Results */}
            {(!searchResults.results.businesses.data || searchResults.results.businesses.data.length === 0) &&
             (!searchResults.results.offerings.data || searchResults.results.offerings.data.length === 0) && (
              <View style={[styles.noResults, { backgroundColor: colors.card }]}>
                <Ionicons name="search-outline" size={80} color={colors.icon} />
                <Text style={[styles.noResultsTitle, { color: colors.text }]}>No results found</Text>
                <Text style={[styles.noResultsText, { color: colors.icon }]}>
                  Try searching with different keywords
                </Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={clearSearch}>
                  <Text style={styles.retryButtonText}>Try different search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.initialState, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={80} color={colors.icon} />
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
                    style={[styles.suggestionTag, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => handleSearchChange(tag)}
                    activeOpacity={0.7}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 130,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingTop: 8,
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
    color: '#6366f1',
    fontWeight: '500',
  },
  messageContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  resultsSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
    color: '#1f2937',
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  businessInfo: {
    flex: 1,
    gap: 4,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    color: '#1f2937',
    lineHeight: 20,
  },
  businessCategory: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  businessDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 18,
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
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
  },
  reviewCount: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    color: '#1f2937',
  },
  noResultsText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: '#6b7280',
    marginBottom: 24,
  },
  initialState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  initialTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    color: '#1f2937',
  },
  initialText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: '#6b7280',
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  searchSuggestions: {
    marginTop: 32,
    alignSelf: 'stretch',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#374151',
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  suggestionTag: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  suggestionTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  chevronContainer: {
    padding: 4,
  },
});


