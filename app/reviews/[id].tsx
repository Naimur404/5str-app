import CustomAlert from '@/components/CustomAlert';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { fetchWithJsonValidation } from '@/services/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Chart component for rating visualization
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ReviewData {
  id: number;
  overall_rating: number;
  service_rating?: number | null;
  quality_rating?: number | null;
  value_rating?: number | null;
  title?: string | null;
  review_text: string;
  pros?: string | null;
  cons?: string | null;
  visit_date?: string | null;
  amount_spent?: string | null;
  party_size?: number | null;
  is_recommended: boolean;
  is_verified_visit: boolean;
  helpful_count: number;
  not_helpful_count: number;
  status: string;
  images: string[];
  reviewable: {
    type: string;
    id: number;
    business_name: string;
    slug: string;
    category_name: string;
    logo_image: string;
  };
  created_at: string;
  updated_at: string;
}

interface ReviewResponse {
  success: boolean;
  data: {
    review: ReviewData;
  };
}

export default function ReviewDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showSuccess, showError } = useToastGlobal();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReviewDetails();
    }
  }, [id]);

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SUBMIT_REVIEW)}/show/${id}`;
      const response: ReviewResponse = await fetchWithJsonValidation(url);
      
      if (response.success) {
        setReview(response.data.review);
      } else {
        showError('Failed to load review details');
      }
    } catch (error) {
      console.error('Error fetching review details:', error);
      showError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#22C55E'; // Green
    if (rating >= 3.5) return '#EAB308'; // Yellow
    if (rating >= 2.5) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderRatingChart = () => {
    if (!review) return null;

    const chartData = [
      {
        name: '5 Stars',
        population: review.overall_rating === 5 ? 1 : 0,
        color: '#22C55E',
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
      {
        name: '4 Stars',
        population: review.overall_rating === 4 ? 1 : 0,
        color: '#84CC16',
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
      {
        name: '3 Stars',
        population: review.overall_rating === 3 ? 1 : 0,
        color: '#EAB308',
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
      {
        name: '2 Stars',
        population: review.overall_rating === 2 ? 1 : 0,
        color: '#F97316',
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
      {
        name: '1 Star',
        population: review.overall_rating === 1 ? 1 : 0,
        color: '#EF4444',
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
    ].filter(item => item.population > 0);

    if (chartData.length === 0) {
      chartData.push({
        name: 'No Rating',
        population: 1,
        color: colors.icon,
        legendFontColor: colors.text,
        legendFontSize: 12,
      });
    }

    // return (
    //   <View style={styles.chartContainer}>
    //     <Text style={[styles.chartTitle, { color: colors.text }]}>Rating Visualization</Text>
    //     <PieChart
    //       data={chartData}
    //       width={width - 48}
    //       height={200}
    //       chartConfig={{
    //         backgroundColor: colors.background,
    //         backgroundGradientFrom: colors.background,
    //         backgroundGradientTo: colors.background,
    //         color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    //       }}
    //       accessor="population"
    //       backgroundColor="transparent"
    //       paddingLeft="15"
    //       center={[0, 0]}
    //       absolute
    //     />
    //   </View>
    // );
  };

  const renderRatingBar = (label: string, rating: number) => (
    <View style={styles.ratingBarContainer}>
      <Text style={[styles.ratingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.ratingBarWrapper}>
        <View style={[styles.ratingBarBackground, { backgroundColor: colors.background }]}>
          <View 
            style={[
              styles.ratingBarFill, 
              { 
                backgroundColor: getRatingColor(rating),
                width: `${(rating / 5) * 100}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.ratingValue, { color: colors.text }]}>{rating}/5</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
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
          <Text style={styles.headerTitle}>Review Details</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading review details...</Text>
        </View>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
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
          <Text style={styles.headerTitle}>Review Details</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.icon} />
          <Text style={[styles.errorText, { color: colors.text }]}>Review not found</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Review Details</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Business Info Header */}
        <View style={[styles.businessHeader, { backgroundColor: colors.card }]}>
          <Image 
            source={{ uri: getImageUrl(review.reviewable.logo_image) || getFallbackImageUrl('business') }}
            style={styles.businessLogo}
          />
          <View style={styles.businessInfo}>
            <Text style={[styles.businessName, { color: colors.text }]}>{review.reviewable.business_name}</Text>
            <Text style={[styles.businessCategory, { color: colors.icon }]}>{review.reviewable.category_name}</Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Rating</Text>
          <View style={styles.overallRatingContainer}>
            <View style={styles.ratingDisplay}>
              <Text style={[styles.ratingNumber, { color: getRatingColor(review.overall_rating) }]}>
                {review.overall_rating}
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.overall_rating ? 'star' : 'star-outline'}
                    size={20}
                    color={star <= review.overall_rating ? '#FFD700' : colors.icon}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Rating Chart */}
        {renderRatingChart()}

        {/* Detailed Ratings */}
        {(review.service_rating || review.quality_rating || review.value_rating) && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Detailed Ratings</Text>
            {review.service_rating && renderRatingBar('Service', review.service_rating)}
            {review.quality_rating && renderRatingBar('Quality', review.quality_rating)}
            {review.value_rating && renderRatingBar('Value', review.value_rating)}
          </View>
        )}

        {/* Review Content */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Review</Text>
          
          {review.title && (
            <Text style={[styles.reviewTitle, { color: colors.text }]}>{review.title}</Text>
          )}
          
          <Text style={[styles.reviewText, { color: colors.text }]}>{review.review_text}</Text>

          {review.pros && (
            <View style={styles.prosConsContainer}>
              <Text style={[styles.prosConsTitle, { color: '#22C55E' }]}>Pros:</Text>
              <Text style={[styles.prosConsText, { color: colors.text }]}>{review.pros}</Text>
            </View>
          )}

          {review.cons && (
            <View style={styles.prosConsContainer}>
              <Text style={[styles.prosConsTitle, { color: '#EF4444' }]}>Cons:</Text>
              <Text style={[styles.prosConsText, { color: colors.text }]}>{review.cons}</Text>
            </View>
          )}
        </View>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesContainer}>
                {review.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: getImageUrl(image) }}
                    style={styles.reviewImage}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Additional Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Reviewed on {formatDate(review.created_at)}
            </Text>
          </View>

          {review.visit_date && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Visited on {formatDate(review.visit_date)}
              </Text>
            </View>
          )}

          {review.amount_spent && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Amount spent: {review.amount_spent}
              </Text>
            </View>
          )}

          {review.party_size && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={16} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Party size: {review.party_size} people
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons 
              name={review.is_recommended ? "thumbs-up" : "thumbs-down"} 
              size={16} 
              color={review.is_recommended ? '#22C55E' : '#EF4444'} 
            />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {review.is_recommended ? 'Recommends this business' : 'Does not recommend this business'}
            </Text>
          </View>

          {review.is_verified_visit && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Verified visit
              </Text>
            </View>
          )}
        </View>

        {/* Helpfulness */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Feedback</Text>
          
          <View style={styles.helpfulnessContainer}>
            <View style={styles.helpfulnessItem}>
              <Ionicons name="thumbs-up" size={20} color="#22C55E" />
              <Text style={[styles.helpfulnessText, { color: colors.text }]}>
                {review.helpful_count} found this helpful
              </Text>
            </View>
            
            <View style={styles.helpfulnessItem}>
              <Ionicons name="thumbs-down" size={20} color="#EF4444" />
              <Text style={[styles.helpfulnessText, { color: colors.text }]}>
                {review.not_helpful_count} found this not helpful
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  businessInfo: {
    marginLeft: 16,
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  overallRatingContainer: {
    alignItems: 'center',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingBarContainer: {
    marginBottom: 12,
  },
  ratingBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 30,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  prosConsContainer: {
    marginBottom: 12,
  },
  prosConsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  prosConsText: {
    fontSize: 14,
    lineHeight: 18,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  helpfulnessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  helpfulnessItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulnessText: {
    marginLeft: 8,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 32,
  },
});