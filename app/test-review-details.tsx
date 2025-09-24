import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TestReviewDetailsScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  // Sample review ID from the API response user mentioned (/api/v1/reviews/show/164)
  const testReviewId = 164;

  const testReviewData = {
    id: 164,
    overall_rating: 4.5,
    service_rating: 4,
    quality_rating: 5,
    value_rating: 4,
    title: "Great Experience!",
    review_text: "Had an amazing time at this business. The service was excellent and the quality exceeded my expectations. Definitely worth the money spent.",
    pros: "Excellent service, high quality products, friendly staff",
    cons: "A bit pricey, but you get what you pay for",
    visit_date: "2024-01-15",
    amount_spent: "$120",
    party_size: 2,
    is_recommended: true,
    is_verified_visit: true,
    helpful_count: 15,
    not_helpful_count: 2,
    status: "published",
    images: [
      "https://via.placeholder.com/300x200/4CAF50/white?text=Review+Image+1",
      "https://via.placeholder.com/300x200/2196F3/white?text=Review+Image+2"
    ],
    reviewable: {
      type: "business",
      id: 123,
      business_name: "Sample Restaurant & Cafe",
      slug: "sample-restaurant-cafe",
      category_name: "Restaurant",
      logo_image: "https://via.placeholder.com/100x100/FF9800/white?text=Logo"
    },
    created_at: "2024-01-16T10:30:00Z",
    updated_at: "2024-01-16T10:30:00Z"
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Review Details</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Review Details Page Demo</Text>
          <Text style={[styles.infoText, { color: colors.icon }]}>
            This page demonstrates the review details functionality. Click the button below to view a sample review with charts and detailed information.
          </Text>
        </View>

        {/* Sample Data Display */}
        <View style={[styles.sampleCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sampleTitle, { color: colors.text }]}>Sample Review Data</Text>
          <Text style={[styles.sampleText, { color: colors.icon }]}>Business: {testReviewData.reviewable.business_name}</Text>
          <Text style={[styles.sampleText, { color: colors.icon }]}>Rating: {testReviewData.overall_rating}/5 ⭐</Text>
          <Text style={[styles.sampleText, { color: colors.icon }]}>Category: {testReviewData.reviewable.category_name}</Text>
          <Text style={[styles.sampleText, { color: colors.icon }]}>Review ID: {testReviewData.id}</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.testButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push(`/reviews/${testReviewId}` as any)}
        >
          <Ionicons name="eye" size={24} color="white" />
          <Text style={styles.testButtonText}>View Review Details</Text>
        </TouchableOpacity>

        {/* Features List */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Review Details Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Overall rating with star display</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Detailed ratings (Service, Quality, Value)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Rating visualization with pie chart</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Review content with pros/cons</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Review images gallery</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Additional information (visit date, party size, etc.)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Community feedback (helpful votes)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={[styles.featureText, { color: colors.text }]}>Business info header with logo</Text>
          </View>
        </View>

        {/* API Info */}
        <View style={[styles.apiCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.apiTitle, { color: colors.text }]}>API Endpoint</Text>
          <Text style={[styles.apiText, { color: colors.icon }]}>
            GET /api/v1/reviews/show/{testReviewId}
          </Text>
          <Text style={[styles.apiNote, { color: colors.icon }]}>
            The review details page fetches data from this API endpoint and displays it with charts and rich formatting.
          </Text>
        </View>

        {/* Navigation Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.tint }]}>
          <Ionicons name="information-circle" size={24} color={colors.tint} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>Navigation Integration</Text>
            <Text style={[styles.noteText, { color: colors.icon }]}>
              All review cards in the app are now clickable and will navigate to the detailed review page. This includes:
            </Text>
            <Text style={[styles.noteText, { color: colors.icon }]}>• Business details page reviews</Text>
            <Text style={[styles.noteText, { color: colors.icon }]}>• Review listing pages</Text>
            <Text style={[styles.noteText, { color: colors.icon }]}>• ReviewCard component instances</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sampleCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sampleText: {
    fontSize: 14,
    marginBottom: 4,
  },
  testButton: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
  apiCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  apiTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  apiText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  apiNote: {
    fontSize: 12,
    lineHeight: 16,
  },
  noteCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteContent: {
    marginLeft: 12,
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  bottomSpacing: {
    height: 32,
  },
});