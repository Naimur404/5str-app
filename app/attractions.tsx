import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getAttractions } from '@/services/api';
import { AttractionListItem } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { Colors } from '@/constants/Colors';
import SmartImage from '@/components/SmartImage';
import { formatDistance } from '@/utils/distanceUtils';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

interface AttractionCardProps {
  attraction: AttractionListItem;
  onPress: () => void;
  colors: any;
}

const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, onPress, colors }) => {
  const formatRating = (rating: string | number) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return '#4CAF50';
      case 'moderate':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return colors.icon;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.attractionCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.attractionRow}>
                <View style={styles.attractionImageContainer}>
          <SmartImage
            source={attraction.cover_image_url}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            type="general"
            showLoadingIndicator={true}
            width={80}
            height={80}
          />
        </View>

        <View style={styles.attractionContent}>
          <View style={styles.attractionMainInfo}>
            <Text style={[styles.attractionName, { color: colors.text }]} numberOfLines={1}>
              {attraction.name}
            </Text>
            <Text style={[styles.categoryName, { color: colors.icon }]} numberOfLines={1}>
              {attraction.category}
            </Text>
          </View>
          
          <View style={styles.attractionMetrics}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {formatRating(attraction.overall_rating)}
              </Text>
              <Text style={[styles.reviewCountText, { color: colors.icon }]}>
                ({attraction.total_reviews || 0})
              </Text>
            </View>
            
            {attraction.distance && (
              <Text style={[styles.distanceText, { color: colors.tint }]}>
                {formatDistance(attraction.distance)}
              </Text>
            )}
          </View>

          <View style={styles.attractionDetails}>
            {attraction.difficulty_level && (
              <View style={styles.difficultyContainer}>
                <Ionicons 
                  name="trail-sign-outline" 
                  size={12} 
                  color={getDifficultyColor(attraction.difficulty_level)} 
                />
                <Text style={[
                  styles.difficultyText, 
                  { color: getDifficultyColor(attraction.difficulty_level) }
                ]}>
                  {attraction.difficulty_level}
                </Text>
              </View>
            )}
            
            {attraction.estimated_duration_minutes > 0 && (
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={12} color={colors.icon} />
                <Text style={[styles.durationText, { color: colors.icon }]}>
                  {Math.round(attraction.estimated_duration_minutes / 60)}h
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.attractionActions}>
          {attraction.is_featured && (
            <View style={[styles.featuredBadge, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[styles.featuredText, { color: colors.tint }]}>
                Featured
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function AttractionsScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI } = useLocation();

  // State
  const [attractions, setAttractions] = useState<AttractionListItem[]>([]);
  const [filteredAttractions, setFilteredAttractions] = useState<AttractionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAttractions();
  }, []);

  // Filter attractions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAttractions(attractions);
    } else {
      const filtered = attractions.filter(attraction =>
        attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAttractions(filtered);
    }
  }, [attractions, searchQuery]);

  const fetchAttractions = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const coordinates = getCoordinatesForAPI();
      const response = await getAttractions(
        coordinates.latitude, 
        coordinates.longitude, 
        1, 
        20
      );

      if (response.success) {
        setAttractions(response.data.data || []);
        if (!searchQuery.trim()) {
          setFilteredAttractions(response.data.data || []);
        }
      } else {
        setError('Failed to load attractions. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching attractions:', error);
      setError('Unable to load attractions. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchAttractions(true);
  };

  const handleAttractionPress = (attraction: AttractionListItem) => {
    router.push(`/attraction/${attraction.id}`);
  };

  const renderAttraction = ({ item }: { item: AttractionListItem }) => (
    <AttractionCard 
      attraction={item} 
      colors={colors}
      onPress={() => handleAttractionPress(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="compass-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Attractions Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        We couldn't find any attractions in your area right now. Try refreshing or check back later.
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.tint }]}
        onPress={() => fetchAttractions()}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Hero Header with Search */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.heroHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Ionicons name="compass" size={32} color="white" style={styles.headerIcon} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Attractions</Text>
              <Text style={styles.headerSubtitle}>
                {filteredAttractions.length > 0 
                  ? `${filteredAttractions.length} ${searchQuery ? 'matching' : ''} attractions found${searchQuery ? '' : ' nearby'}`
                  : searchQuery ? 'No matching attractions found' : 'Discover amazing places around you'
                }
              </Text>
            </View>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Ionicons name="search" size={14} color="white" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search attractions..."
              placeholderTextColor="rgba(255, 255, 255, 0.8)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={14} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
      
      {loading && attractions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Finding attractions near you...
          </Text>
        </View>
      ) : error && attractions.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={filteredAttractions}
          renderItem={renderAttraction}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          ListEmptyComponent={loading ? null : (searchQuery ? renderEmpty : renderEmpty)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 16,
  },
  attractionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  attractionRow: {
    flexDirection: 'row',
    padding: 16,
  },
  attractionImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  attractionImage: {
    width: '100%',
    height: '100%',
  },
  freeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  attractionContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  attractionMainInfo: {
    marginBottom: 4,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 12,
    opacity: 0.7,
  },
  attractionMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 11,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attractionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
  },
  attractionActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  featuredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Hero header styles
  heroHeader: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchContainer: {
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: 'white',
    fontWeight: '400',
  },
  clearButton: {
    marginLeft: 4,
    padding: 1,
  },
});