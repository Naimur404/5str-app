import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { LocationHeader } from '@/components/LocationHeader';
import { AttractionCard } from '@/components/AttractionCard';
import { useAttractionListTracking } from '@/hooks/useAttractionTracking';
import { useCoordinates } from '@/hooks/useCoordinates';
import { FeaturedAttraction } from '@/types/api';

export default function AttractionsScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { coordinates } = useCoordinates();
  const { trackItemView, trackItemClick } = useAttractionListTracking('featured_attractions');

  // State
  const [attractions, setAttractions] = useState<FeaturedAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockAttractions: FeaturedAttraction[] = [
    {
      id: 1,
      name: "Cox's Bazar Beach",
      slug: "coxs-bazar-beach",
      description: "The world's longest natural sandy sea beach",
      type: "Beach",
      category: "Natural",
      subcategory: "Beach",
      city: "Cox's Bazar",
      area: "Cox's Bazar Sadar",
      district: "Cox's Bazar",
      is_free: true,
      entry_fee: "0",
      currency: "BDT",
      overall_rating: 4.6,
      total_reviews: 1547,
      total_views: 25890,
      discovery_score: 9.2,
      estimated_duration_minutes: 480,
      difficulty_level: "Easy",
      cover_image_url: "https://picsum.photos/400/300?random=1",
      google_maps_url: "https://maps.google.com/?q=Cox's+Bazar+Beach",
      distance_km: 0,
      facilities: ["parking", "restaurant", "restroom"],
      best_time_to_visit: {
        months: ["November", "December", "January", "February", "March"]
      },
      is_featured: true,
      recent_reviews_count: 23,
    },
    {
      id: 2,
      name: "Sundarbans Mangrove Forest",
      slug: "sundarbans-mangrove-forest",
      description: "The largest mangrove forest in the world",
      type: "Forest",
      category: "Natural",
      subcategory: "Forest",
      city: "Khulna",
      area: "Sundarbans",
      district: "Khulna",
      is_free: false,
      entry_fee: "500",
      currency: "BDT",
      overall_rating: 4.8,
      total_reviews: 892,
      total_views: 15632,
      discovery_score: 9.8,
      estimated_duration_minutes: 720,
      difficulty_level: "Moderate",
      cover_image_url: "https://picsum.photos/400/300?random=2",
      google_maps_url: "https://maps.google.com/?q=Sundarbans",
      distance_km: 15,
      facilities: ["guide", "boat", "wildlife_viewing"],
      best_time_to_visit: {
        months: ["October", "November", "December", "January", "February"]
      },
      is_featured: true,
      recent_reviews_count: 15,
    },
    {
      id: 3,
      name: "Sylhet Tea Gardens",
      slug: "sylhet-tea-gardens",
      description: "Beautiful tea plantations in the hills of Sylhet",
      type: "Plantation",
      category: "Cultural",
      subcategory: "Agriculture",
      city: "Sylhet",
      area: "Malnichara",
      district: "Sylhet",
      is_free: true,
      entry_fee: "0",
      currency: "BDT",
      overall_rating: 4.5,
      total_reviews: 634,
      total_views: 12890,
      discovery_score: 8.9,
      estimated_duration_minutes: 360,
      difficulty_level: "Easy",
      cover_image_url: "https://picsum.photos/400/300?random=3",
      google_maps_url: "https://maps.google.com/?q=Sylhet+Tea+Garden",
      distance_km: 8,
      facilities: ["tea_tasting", "guided_tour", "photography"],
      best_time_to_visit: {
        months: ["November", "December", "January", "February", "March", "April"]
      },
      is_featured: true,
      recent_reviews_count: 18,
    },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchAttractions();
    }, [])
  );

  const fetchAttractions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAttractions(mockAttractions);
    } catch (error) {
      console.error('Error fetching attractions:', error);
      setError('Failed to load attractions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttractions();
  };

  const handleAttractionPress = (attraction: FeaturedAttraction, index: number) => {
    trackItemClick(attraction.id, index + 1, {
      attraction_name: attraction.name,
      attraction_type: attraction.type,
      distance_km: attraction.distance_km,
    });
    router.push(`/attraction/${attraction.id}`);
  };

  const renderAttraction = ({ item, index }: { item: FeaturedAttraction; index: number }) => {
    // Track item view when rendered
    useEffect(() => {
      trackItemView(item.id, index + 1, {
        attraction_name: item.name,
        attraction_type: item.type,
        distance_km: item.distance_km,
      });
    }, []);

    return (
      <View style={[styles.cardContainer, { marginLeft: index % 2 === 0 ? 0 : 8 }]}>
        <AttractionCard 
          attraction={item} 
          onPress={() => handleAttractionPress(item, index)}
        />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Attractions Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
        Try adjusting your location or check back later
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
        {error}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <LocationHeader />
      
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Featured Attractions</Text>
      </View>
      
      {error ? (
        renderError()
      ) : (
        <FlatList
          data={attractions}
          renderItem={renderAttraction}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          ListEmptyComponent={loading ? null : renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 16,
  },
  cardContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});