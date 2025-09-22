import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchWithJsonValidation } from '@/services/api';
import { AttractionListItem, Business, Offering, SearchResponse } from '@/types/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';

export default function SearchScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI, getCurrentLocationInfo, location, manualLocation } = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMinCharsMessage, setShowMinCharsMessage] = useState(false);
  const [searchWholeBangladesh, setSearchWholeBangladesh] = useState(false);
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleAnimation = useRef(new Animated.Value(0)).current;

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

    console.log('Starting API search for:', query, 'Whole Bangladesh:', searchWholeBangladesh);
    
    try {
      const baseParams = `q=${encodeURIComponent(query)}&type=all&sort=rating&limit=10`;
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.SEARCH)}?${baseParams}`;
      
      // Only add coordinates if not searching whole Bangladesh
      if (!searchWholeBangladesh) {
        const coordinates = getCoordinatesForAPI();
        url += `&latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`;
        console.log('Search URL (with location):', url);
      } else {
        console.log('Search URL (whole Bangladesh):', url);
      }
      
      const data: SearchResponse = await fetchWithJsonValidation(url);
      console.log('Search API response:', data);
      console.log('Parsed response data:', data.data);

      if (data.success) {
        console.log('Attractions found:', data.data.results.attractions?.data?.length || 0);
        console.log('Businesses found:', data.data.results.businesses?.data?.length || 0);
        console.log('Offerings found:', data.data.results.offerings?.data?.length || 0);
        setSearchResults(data.data);
      } else {
        Alert.alert('Error', data.message || 'Search failed');
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error during search';
      Alert.alert('Error', errorMessage);
      setSearchResults(null);
    } finally {
      // Always set loading to false in finally block
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

  const handleLocationToggle = () => {
    const newValue = !searchWholeBangladesh;
    setSearchWholeBangladesh(newValue);
    
    // Animate toggle
    Animated.timing(toggleAnimation, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    // If there's an active search query, re-trigger the search with new location setting
    if (searchQuery.length >= 2) {
      setLoading(true);
      // Clear existing timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      // Trigger new search with updated location setting
      searchTimeout.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    }
  };

  const getDetailedLocationInfo = () => {
    const locationInfo = getCurrentLocationInfo();
    
    if (manualLocation) {
      // Manual location selected
      return manualLocation.division 
        ? `${manualLocation.name}, ${manualLocation.division}`
        : manualLocation.name;
    } else if (location && location.address) {
      // GPS location with address
      return location.address;
    } else if (locationInfo.name !== 'Current Location') {
      // Fallback to location context name
      return locationInfo.name;
    } else {
      // Default fallback
      return "Current Location";
    }
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

  const renderAttractionItem = ({ item }: { item: AttractionListItem }) => {
    if (!item || !item.id) {
      return null;
    }
    
    const formatDistance = (distanceData: any) => {
      // Handle new distance_formatted structure
      if (distanceData?.distance_formatted?.formatted) {
        return distanceData.distance_formatted.formatted;
      }
      // Handle legacy distance_km
      if (distanceData?.distance_km) {
        const distance = parseFloat(distanceData.distance_km);
        if (distance < 1) {
          return `${Math.round(distance * 1000)}m`;
        }
        return `${distance.toFixed(1)}km`;
      }
      // Handle direct distance field
      if (typeof distanceData === 'number') {
        if (distanceData < 1) {
          return `${Math.round(distanceData * 1000)}m`;
        }
        return `${distanceData.toFixed(1)}km`;
      }
      return null;
    };

    // Get the best available image URL
    const getAttractionImage = (item: any) => {
      return item.cover_image_url || item.image_url || item.logo_url;
    };

    // Get rating value - try different fields
    const getRating = (item: any) => {
      return item.average_rating || item.overall_rating || '0';
    };
    
    return (
      <TouchableOpacity 
        style={[styles.businessItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/attraction/${item.id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(getAttractionImage(item)) || getFallbackImageUrl('general') }} 
          style={styles.businessImage} 
        />
        <View style={styles.businessInfo}>
          <View style={styles.businessHeader}>
            <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
              {item.name || 'Unknown Attraction'}
            </Text>
            <View style={styles.attractionBadges}>
              {item.is_featured ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="star" size={14} color="#d97706" />
                </View>
              ) : null}
              {item.is_verified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                </View>
              ) : null}
            </View>
          </View>
          <Text style={[styles.businessCategory, { color: colors.icon }]}>
            {`${item.category} • ${item.city}${item.area ? `, ${item.area}` : ''}`}
          </Text>
          {item.description ? (
            <Text style={[styles.businessDescription, { color: colors.icon }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#d97706" />
              <Text style={styles.rating}>{parseFloat(getRating(item)).toFixed(1)}</Text>
              {item.total_reviews ? (
                <Text style={styles.reviewCount}>
                  ({item.total_reviews})
                </Text>
              ) : null}
            </View>
            {formatDistance(item) && (
              <Text style={[styles.distance, { color: colors.tint }]}>
                {formatDistance(item)}
              </Text>
            )}
          </View>
          {/* Additional attraction info */}
          <View style={styles.attractionInfo}>
            {item.is_free ? (
              <View style={[styles.attractionBadge, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={[styles.attractionBadgeText, { color: '#10B981' }]}>Free Entry</Text>
              </View>
            ) : item.entry_fee && parseFloat(item.entry_fee) > 0 ? (
              <View style={[styles.attractionBadge, { backgroundColor: colors.tint + '20' }]}>
                <Text style={[styles.attractionBadgeText, { color: colors.tint }]}>
                  {item.currency} {item.entry_fee}
                </Text>
              </View>
            ) : null}
            {item.difficulty_level && (
              <View style={[styles.attractionBadge, { backgroundColor: colors.icon + '20' }]}>
                <Text style={[styles.attractionBadgeText, { color: colors.icon }]}>
                  {item.difficulty_level}
                </Text>
              </View>
            )}
            {item.estimated_duration_minutes && (
              <View style={[styles.attractionBadge, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Text style={[styles.attractionBadgeText, { color: '#8B5CF6' }]}>
                  {Math.round(item.estimated_duration_minutes / 60)}h
                </Text>
              </View>
            )}
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

      {/* Location Search Scope */}
      <View style={[styles.locationSection, { backgroundColor: colors.background }]}>
        <View style={[styles.locationCard, { backgroundColor: colors.card }]}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIconContainer}>
              <Ionicons 
                name={searchWholeBangladesh ? "globe" : "location"} 
                size={20} 
                color={searchWholeBangladesh ? "#10B981" : colors.tint} 
              />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={[styles.locationTitle, { color: colors.text }]}>
                Search Location
              </Text>
              <Text style={[styles.locationSubtitle, { color: colors.icon }]}>
                {searchWholeBangladesh ? "All of Bangladesh" : getDetailedLocationInfo()}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.modernToggle, { 
                backgroundColor: searchWholeBangladesh ? "#10B981" : colors.border 
              }]}
              onPress={handleLocationToggle}
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.modernToggleThumb, 
                { 
                  backgroundColor: colors.card,
                  transform: [{ 
                    translateX: toggleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [3, 27]
                    })
                  }]
                }
              ]} />
            </TouchableOpacity>
          </View>
          
          {/* Location Details */}
          <View style={styles.locationDetails}>
            <View style={[styles.scopeIndicator, { 
              backgroundColor: searchWholeBangladesh ? "#F0FDF4" : colors.tint + "10" 
            }]}>
              <Ionicons 
                name={searchWholeBangladesh ? "earth" : "navigate-circle"} 
                size={14} 
                color={searchWholeBangladesh ? "#10B981" : colors.tint} 
              />
              <Text style={[styles.scopeText, { 
                color: searchWholeBangladesh ? "#10B981" : colors.tint 
              }]}>
                {searchWholeBangladesh ? "National search active" : "Local search active"}
              </Text>
            </View>
          </View>
        </View>
      </View>

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

            {/* Attractions Section */}
            {searchResults.results.attractions?.data && searchResults.results.attractions.data.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Attractions</Text>
                <FlatList
                  data={searchResults.results.attractions.data.filter((item: any) => item && item.id)}
                  renderItem={renderAttractionItem}
                  keyExtractor={(item) => `attraction-${item.id?.toString() || Math.random().toString()}`}
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
             (!searchResults.results.attractions?.data || searchResults.results.attractions.data.length === 0) &&
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
  locationToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  locationSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  locationCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  modernToggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  modernToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  locationDetails: {
    marginTop: 8,
  },
  scopeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Attraction-specific styles
  attractionInfo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  attractionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attractionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  attractionBadges: {
    flexDirection: 'row',
    gap: 4,
  },
});


