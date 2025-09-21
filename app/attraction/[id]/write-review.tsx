import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { useToast } from '../../../hooks/useToast';
import { getAttractionDetails, isAuthenticated, submitAttractionReview } from '../../../services/api';
import { AttractionDetailResponse, AttractionReviewSubmissionRequest } from '../../../types/api';

const { width } = Dimensions.get('window');

export default function WriteReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showSuccess, showError } = useToast();
  const { showAlert, hideAlert } = useCustomAlert();

  const [attraction, setAttraction] = useState<AttractionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [experienceTags, setExperienceTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Visit info state
  const [durationHours, setDurationHours] = useState('');
  const [companions, setCompanions] = useState('');
  const [transportation, setTransportation] = useState('');
  const [weather, setWeather] = useState('');
  const [crowdLevel, setCrowdLevel] = useState('');

  const availableTags = [
    'Amazing Views', 'Great for Families', 'Romantic', 'Adventure',
    'Educational', 'Historical', 'Cultural', 'Nature Lover',
    'Photography', 'Peaceful', 'Exciting', 'Value for Money'
  ];

  const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Foggy', 'Windy'];
  const crowdOptions = ['Very Quiet', 'Quiet', 'Moderate', 'Busy', 'Very Busy'];
  const transportOptions = ['Walking', 'Car', 'Public Transport', 'Bicycle', 'Tour Bus'];

  const checkAuthAndFetchData = async () => {
    try {
      // Check authentication first
      const authStatus = await isAuthenticated();
      setIsUserAuthenticated(authStatus);

      if (!authStatus) {
        showAlert({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please sign in to write a review',
          buttons: [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Sign In', onPress: () => router.push('/welcome' as any) }
          ]
        });
        return;
      }

      // Fetch attraction details
      if (id) {
        const attractionData = await getAttractionDetails(parseInt(id));
        setAttraction(attractionData);
      }
    } catch (error) {
      console.error('Error checking auth or fetching data:', error);
      showError('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkAuthAndFetchData();
    }, [id])
  );

  const toggleExperienceTag = (tag: string) => {
    setExperienceTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmitReview = async () => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to write a review',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }

    if (rating === 0) {
      showAlert({
        type: 'warning',
        title: 'Rating Required',
        message: 'Please select a rating before submitting your review',
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
      return;
    }

    if (comment.trim().length < 10) {
      showAlert({
        type: 'warning',
        title: 'Review Too Short',
        message: 'Please write at least 10 characters in your review',
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
      return;
    }

    setSubmitting(true);

    try {
      const reviewData: AttractionReviewSubmissionRequest = {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        visit_date: visitDate || undefined,
        experience_tags: experienceTags.length > 0 ? experienceTags : undefined,
        visit_info: {
          duration_hours: durationHours ? parseInt(durationHours) : undefined,
          companions: companions ? parseInt(companions) : undefined,
          transportation: transportation || undefined,
          weather: weather || undefined,
          crowd_level: crowdLevel || undefined,
        },
        is_anonymous: isAnonymous,
      };

      const response = await submitAttractionReview(parseInt(id!), reviewData);

      if (response.success) {
        showSuccess('Review submitted successfully! Thank you for sharing your experience.');
        
        // Navigate back after a short delay to allow user to see the success message
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        showAlert({
          type: 'error',
          title: 'Submission Failed',
          message: response.message || 'Failed to submit your review. Please try again.',
          buttons: [{ text: 'OK', onPress: hideAlert }]
        });
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      if (error.response?.status === 401) {
        showAlert({
          type: 'error',
          title: 'Authentication Required',
          message: 'Your session has expired. Please sign in again.',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/welcome' as any) }
          ]
        });
        setIsUserAuthenticated(false);
      } else {
        showError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Write Review</Text>
            <Text style={styles.headerSubtitle}>Share your attraction experience</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {attraction && (
            <View style={[styles.attractionInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.attractionName, { color: colors.text }]}>
                {attraction.data.name}
              </Text>
              <Text style={[styles.attractionAddress, { color: colors.icon }]}>
                {attraction.data.address}
              </Text>
            </View>
          )}

          {/* Rating Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rating *</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name="star"
                    size={32}
                    color={star <= rating ? "#FFD700" : colors.icon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={[styles.ratingText, { color: colors.icon }]}>
                {rating} star{rating !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Title Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Title (Optional)</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Give your review a title..."
              placeholderTextColor={colors.icon}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Review Comment Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Review *</Text>
            <TextInput
              style={[styles.commentInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Share your experience..."
              placeholderTextColor={colors.icon}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={[styles.charCount, { color: colors.icon }]}>
              {comment.length}/1000 characters
            </Text>
          </View>

          {/* Experience Tags Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience Tags</Text>
            <View style={styles.tagsContainer}>
              {availableTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleExperienceTag(tag)}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor: experienceTags.includes(tag) ? colors.tint : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.tagButtonText,
                      {
                        color: experienceTags.includes(tag) ? 'white' : colors.text
                      }
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visit Details Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Visit Details (Optional)</Text>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Visit Date:</Text>
              <TextInput
                style={[styles.detailInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.icon}
                value={visitDate}
                onChangeText={setVisitDate}
              />
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Duration (hours):</Text>
              <TextInput
                style={[styles.detailInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="2"
                placeholderTextColor={colors.icon}
                value={durationHours}
                onChangeText={setDurationHours}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Number of People:</Text>
              <TextInput
                style={[styles.detailInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="2"
                placeholderTextColor={colors.icon}
                value={companions}
                onChangeText={setCompanions}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Privacy Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setIsAnonymous(!isAnonymous)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: isAnonymous ? colors.tint : 'transparent' }]}>
                {isAnonymous && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Post anonymously
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            onPress={handleSubmitReview}
            disabled={submitting}
          >
            <LinearGradient
              colors={[colors.headerGradientStart, colors.headerGradientEnd]}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  attractionInfo: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  attractionName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  attractionAddress: {
    fontSize: 14,
  },
  section: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    marginTop: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  detailInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Card Styles
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
  },
  ratingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratingDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  contentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  textAreaContainer: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  textArea: {
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  tagsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tagsDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailsHalf: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  detailsInput: {
    flex: 1,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});