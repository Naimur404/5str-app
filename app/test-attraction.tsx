import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AttractionCard } from '@/components/AttractionCard';
import { FeaturedAttraction } from '@/types/api';
import { Colors } from '@/constants/Colors';

// Mock attraction data for testing
const mockAttraction: FeaturedAttraction = {
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
};

export default function AttractionTestScreen() {
  const colors = Colors.light; // Use light theme for testing

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cardContainer}>
          <AttractionCard 
            attraction={mockAttraction} 
            onPress={() => console.log('Test attraction pressed')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  cardContainer: {
    width: '100%',
  },
});