import React, { Component } from 'react';
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
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Business, SearchResponse } from '@/types/api';
import { fetchWithJsonValidation } from '@/services/api';

interface SearchState {
  searchQuery: string;
  searchResults: SearchResponse['data'] | null;
  loading: boolean;
  location: { latitude: number; longitude: number } | null;
  showMinCharsMessage: boolean;
}

class SearchScreen extends Component<{}, SearchState> {
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      searchQuery: '',
      searchResults: null,
      loading: false,
      location: null,
      showMinCharsMessage: false,
    };
  }

  componentDidMount() {
    this.getCurrentLocation();
  }

  componentWillUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      this.setState({
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
      });
    } catch (error) {
      this.setState({
        location: { latitude: 22.3569, longitude: 91.7832 },
      });
    }
  };

  handleSearchChange = (text: string) => {
    this.setState({ searchQuery: text });

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Handle different text lengths
    if (text.length === 0) {
      this.setState({
        searchResults: null,
        loading: false,
        showMinCharsMessage: false,
      });
    } else if (text.length === 1) {
      this.setState({
        searchResults: null,
        loading: false,
        showMinCharsMessage: true,
      });
    } else if (text.length >= 2) {
      this.setState({
        showMinCharsMessage: false,
        loading: true,
      });

      // Debounce search
      this.searchTimeout = setTimeout(() => {
        this.performSearch(text);
      }, 800);
    }
  };

  performSearch = async (query: string) => {
    const { location } = this.state;

    if (!query || query.length < 2 || !location) {
      this.setState({ loading: false });
      return;
    }

    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SEARCH)}?q=${encodeURIComponent(query)}&type=all&latitude=${location.latitude}&longitude=${location.longitude}&sort=rating&limit=10`;
      
      const data: SearchResponse = await fetchWithJsonValidation(url);

      if (data.success) {
        this.setState({
          searchResults: data.data,
          loading: false,
        });
      } else {
        Alert.alert('Error', data.message || 'Search failed');
        this.setState({
          searchResults: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error during search';
      Alert.alert('Error', errorMessage);
      this.setState({
        searchResults: null,
        loading: false,
      });
    }
  };

  clearSearch = () => {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.setState({
      searchQuery: '',
      searchResults: null,
      loading: false,
      showMinCharsMessage: false,
    });
  };

  renderBusinessItem = ({ item }: { item: Business }) => {
    return (
      <TouchableOpacity style={styles.businessItem}>
        <Image 
          source={{ uri: getImageUrl(item.logo_image) || getFallbackImageUrl('business') }} 
          style={styles.businessImage} 
        />
        <View style={styles.businessInfo}>
          <View style={styles.businessHeader}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.business_name || 'Unknown Business'}
            </Text>
            {item.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              </View>
            )}
          </View>
          <Text style={styles.businessCategory}>
            {item.category?.name || 'Category'} • {item.subcategory_name || 'Subcategory'}
          </Text>
          {item.description && (
            <Text style={styles.businessDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{item.overall_rating || '0.0'}</Text>
              {item.total_reviews && (
                <Text style={styles.reviewCount}>
                  ({item.total_reviews})
                </Text>
              )}
            </View>
            {item.distance_km && (
              <Text style={styles.distance}>{item.distance_km} km away</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  render() {
    const { searchQuery, searchResults, loading, showMinCharsMessage } = this.state;

    return (
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search businesses..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={this.handleSearchChange}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={this.clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : showMinCharsMessage ? (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>Type at least 2 characters to search</Text>
            </View>
          ) : searchResults?.results?.businesses ? (
            <View>
              <View style={styles.resultsSummary}>
                <Text style={styles.resultsText}>
                  {searchResults.total_results || 0} results for "{searchResults.search_term || ''}"
                </Text>
              </View>

              {searchResults.results.businesses.data && searchResults.results.businesses.data.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Businesses</Text>
                  <FlatList
                    data={searchResults.results.businesses.data}
                    renderItem={this.renderBusinessItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                </View>
              ) : (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={80} color="#e0e0e0" />
                  <Text style={styles.noResultsTitle}>No businesses found</Text>
                  <Text style={styles.noResultsText}>
                    Try searching with different keywords
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={this.clearSearch}>
                    <Text style={styles.retryButtonText}>Try different search</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.initialState}>
              <Ionicons name="search-outline" size={80} color="#e0e0e0" />
              <Text style={styles.initialTitle}>Search for businesses</Text>
              <Text style={styles.initialText}>
                Find restaurants, shops, services and more near you
              </Text>
              <View style={styles.searchSuggestions}>
                <Text style={styles.suggestionsTitle}>Popular searches:</Text>
                <View style={styles.suggestionTags}>
                  {['Restaurant', 'Coffee', 'Shopping', 'Beauty'].map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.suggestionTag}
                      onPress={() => this.handleSearchChange(tag)}
                    >
                      <Text style={styles.suggestionTagText}>{tag}</Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  messageContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultsSummary: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
    color: '#333',
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'white',
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
    color: '#333',
  },
  businessCategory: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  businessDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: '#666',
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
    color: '#333',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#333',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
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
    color: '#333',
  },
  initialText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
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
    color: '#333',
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionTag: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
});

export default SearchScreen;
