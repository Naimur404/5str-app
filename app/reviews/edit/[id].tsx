import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  getReviewForEdit, 
  updateReview, 
  UpdateReviewRequest,
  isAuthenticated 
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { useToastGlobal } from '@/contexts/ToastContext';
import { ReviewFormSkeleton } from '@/components/SkeletonLoader';

const { width } = Dimensions.get('window');

export default function EditReviewScreen() {
  const [rating, setRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [amountSpent, setAmountSpent] = useState('');
  const [partySize, setPartySize] = useState('');
  const [isRecommended, setIsRecommended] = useState<boolean | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const reviewId = parseInt(params.id as string);

  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showError, showSuccess, showInfo, hideAlert } = useCustomAlert();
  const { showSuccess: showToastSuccess, showError: showToastError } = useToastGlobal();

  useEffect(() => {
    checkAuthenticationAndLoadReview();
  }, []);

  const checkAuthenticationAndLoadReview = async () => {
    try {
      const authenticated = await isAuthenticated();
      setUserAuthenticated(authenticated);
      
      if (!authenticated) {
        showInfo(
          'Login Required',
          'You must be logged in to edit reviews',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Login', onPress: () => router.push('/auth/login' as any) }
          ]
        );
        return;
      }

      await loadReview();
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.back();
    }
  };

  const loadReview = async () => {
    try {
      setLoading(true);
      const response = await getReviewForEdit(reviewId);
      
      if (response.success) {
        const review = response.data.review;
        setReviewData(review);
        
        // Populate form fields
        setRating(review.overall_rating);
        setServiceRating(review.service_rating || 0);
        setQualityRating(review.quality_rating || 0);
        setValueRating(review.value_rating || 0);
        setTitle(review.title || '');
        setReviewText(review.review_text);
        setPros(review.pros && review.pros.length > 0 ? review.pros : ['']);
        setCons(review.cons && review.cons.length > 0 ? review.cons : ['']);
        setAmountSpent(review.amount_spent ? review.amount_spent.toString() : '');
        setPartySize(review.party_size ? review.party_size.toString() : '');
        setIsRecommended(review.is_recommended ?? null);
        setVisitDate(review.visit_date || '');
      } else {
        showError('Error', response.message || 'Failed to load review data');
        router.back();
      }
    } catch (error) {
      console.error('Error loading review:', error);
      showError('Error', 'Failed to load review data. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const renderCompactRating = (currentRating: number, onRatingChange: (rating: number) => void, label: string, iconName: any) => (
    <View style={styles.compactRatingSection}>
      <View style={styles.compactRatingHeader}>
        <Ionicons name={iconName} size={16} color={colors.icon} />
        <Text style={[styles.compactRatingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.compactStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.compactStarButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={18}
              color={star <= currentRating ? '#FFD700' : colors.icon}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const addProOrCon = (type: 'pros' | 'cons') => {
    if (type === 'pros' && pros.length < 5) {
      setPros([...pros, '']);
    } else if (type === 'cons' && cons.length < 5) {
      setCons([...cons, '']);
    }
  };

  const updateProOrCon = (type: 'pros' | 'cons', index: number, value: string) => {
    if (type === 'pros') {
      const newPros = [...pros];
      newPros[index] = value;
      setPros(newPros);
    } else {
      const newCons = [...cons];
      newCons[index] = value;
      setCons(newCons);
    }
  };

  const removeProOrCon = (type: 'pros' | 'cons', index: number) => {
    if (type === 'pros' && pros.length > 1) {
      setPros(pros.filter((_, i) => i !== index));
    } else if (type === 'cons' && cons.length > 1) {
      setCons(cons.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (rating === 0) {
      showError('Error', 'Please provide an overall rating');
      return false;
    }
    if (reviewText.length < 10) {
      showError('Error', 'Review text must be at least 10 characters long');
      return false;
    }
    if (reviewText.length > 2000) {
      showError('Error', 'Review text must not exceed 2000 characters');
      return false;
    }
    return true;
  };

  const handleUpdateReview = async () => {
    if (!userAuthenticated) {
      showError('Error', 'You must be logged in to update a review');
      return;
    }

    if (!validateForm()) return;

    setUpdateLoading(true);
    try {
      const updateData: UpdateReviewRequest = {
        overall_rating: rating,
        review_text: reviewText,
      };

      // Add optional fields if provided
      if (serviceRating > 0) updateData.service_rating = serviceRating;
      if (qualityRating > 0) updateData.quality_rating = qualityRating;
      if (valueRating > 0) updateData.value_rating = valueRating;
      if (title.trim()) updateData.title = title.trim();
      if (isRecommended !== null) updateData.is_recommended = isRecommended;
      if (visitDate) updateData.visit_date = visitDate;
      if (amountSpent) updateData.amount_spent = parseFloat(amountSpent);
      if (partySize) updateData.party_size = parseInt(partySize);

      // Add pros and cons (filter out empty strings)
      const validPros = pros.filter(pro => pro.trim().length > 0);
      const validCons = cons.filter(con => con.trim().length > 0);
      if (validPros.length > 0) updateData.pros = validPros;
      if (validCons.length > 0) updateData.cons = validCons;

      const response = await updateReview(reviewId, updateData);
      
      if (response.success) {
        showToastSuccess('Review updated successfully!');
        // Navigate back after showing success
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        showError('Error', response.message || 'Failed to update review. Please try again.');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      showError('Error', 'Failed to update review. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" backgroundColor="transparent" translucent={true} />
        <ReviewFormSkeleton colors={colors} />
      </View>
    );
  }

  if (!userAuthenticated || !reviewData) {
    return null;
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
            <Text style={styles.headerTitle}>Edit Review</Text>
            <Text style={styles.headerSubtitle}>Update your experience</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business/Offering Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIcon, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="business" size={24} color={colors.tint} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {reviewData.reviewable.name}
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.icon }]}>
                {reviewData.reviewable.type}
              </Text>
            </View>
          </View>
        </View>

        {/* Images Display (Read-only for editing) */}
        {reviewData.images && reviewData.images.length > 0 && (
          <View style={[styles.imagesCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Review Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
              {reviewData.images.map((imageUri: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: imageUri }}
                  style={styles.reviewImage}
                />
              ))}
            </ScrollView>
            <Text style={[styles.imageNote, { color: colors.icon }]}>
              Note: Images cannot be edited. Contact support if you need to modify photos.
            </Text>
          </View>
        )}

        {/* Rating Cards */}
        <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Rating & Experience</Text>
          
          {/* Overall Rating */}
          <View style={styles.ratingSection}>
            <Text style={[styles.ratingLabel, { color: colors.text }]}>Overall Rating *</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? '#FFD700' : colors.icon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingDescription, { color: colors.icon }]}>
              {rating === 0 ? 'Tap to rate' : 
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
          </View>

          {/* Additional Ratings */}
          <View style={styles.additionalRatings}>
            {renderCompactRating(serviceRating, setServiceRating, 'Service', 'restaurant')}
            {renderCompactRating(qualityRating, setQualityRating, 'Quality', 'star')}
            {renderCompactRating(valueRating, setValueRating, 'Value', 'pricetag')}
          </View>
        </View>

        {/* Review Content Card */}
        <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your Review</Text>
          
          {/* Review Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Title (Optional)</Text>
            <View style={[styles.inputContainer, { borderColor: colors.icon }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Give your review a catchy title"
                placeholderTextColor={colors.icon}
                maxLength={255}
              />
            </View>
          </View>

          {/* Review Text */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Your Experience * 
              <Text style={[styles.charCount, { color: colors.icon }]}> ({reviewText.length}/2000)</Text>
            </Text>
            <View style={[styles.textAreaContainer, { borderColor: colors.icon }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Tell us about your experience in detail..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={6}
                maxLength={2000}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Pros & Cons Card */}
        <View style={[styles.prosConsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Pros & Cons (Optional)</Text>
          
          {/* Pros */}
          <View style={styles.prosConsSection}>
            <View style={styles.prosConsHeader}>
              <View style={styles.prosConsLabelContainer}>
                <Ionicons name="thumbs-up" size={20} color="#10b981" />
                <Text style={[styles.prosConsLabel, { color: colors.text }]}>What you liked</Text>
              </View>
              {pros.length < 5 && (
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: '#10b981' + '20' }]}
                  onPress={() => addProOrCon('pros')}
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>
            {pros.map((pro, index) => (
              <View key={index} style={styles.prosConsItem}>
                <View style={[styles.prosConsInputContainer, { borderColor: '#10b981' }]}>
                  <TextInput
                    style={[styles.prosConsInput, { color: colors.text }]}
                    value={pro}
                    onChangeText={(value) => updateProOrCon('pros', index, value)}
                    placeholder={`Pro ${index + 1}`}
                    placeholderTextColor={colors.icon}
                    maxLength={100}
                  />
                  {pros.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeProOrCon('pros', index)}
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Cons */}
          <View style={styles.prosConsSection}>
            <View style={styles.prosConsHeader}>
              <View style={styles.prosConsLabelContainer}>
                <Ionicons name="thumbs-down" size={20} color="#ef4444" />
                <Text style={[styles.prosConsLabel, { color: colors.text }]}>Areas for improvement</Text>
              </View>
              {cons.length < 5 && (
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: '#ef4444' + '20' }]}
                  onPress={() => addProOrCon('cons')}
                >
                  <Ionicons name="add" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            {cons.map((con, index) => (
              <View key={index} style={styles.prosConsItem}>
                <View style={[styles.prosConsInputContainer, { borderColor: '#ef4444' }]}>
                  <TextInput
                    style={[styles.prosConsInput, { color: colors.text }]}
                    value={con}
                    onChangeText={(value) => updateProOrCon('cons', index, value)}
                    placeholder={`Con ${index + 1}`}
                    placeholderTextColor={colors.icon}
                    maxLength={100}
                  />
                  {cons.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeProOrCon('cons', index)}
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Additional Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Additional Details (Optional)</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailsHalf}>
              <Text style={[styles.detailsLabel, { color: colors.text }]}>Amount Spent</Text>
              <View style={[styles.detailsInputContainer, { borderColor: colors.icon }]}>
                <Text style={[styles.currencySymbol, { color: colors.icon }]}>$</Text>
                <TextInput
                  style={[styles.detailsInput, { color: colors.text }]}
                  value={amountSpent}
                  onChangeText={setAmountSpent}
                  placeholder="0.00"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.detailsHalf}>
              <Text style={[styles.detailsLabel, { color: colors.text }]}>Party Size</Text>
              <View style={[styles.detailsInputContainer, { borderColor: colors.icon }]}>
                <Ionicons name="people" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.detailsInput, { color: colors.text }]}
                  value={partySize}
                  onChangeText={setPartySize}
                  placeholder="1"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Recommendation */}
          <View style={styles.recommendationSection}>
            <Text style={[styles.recommendationTitle, { color: colors.text }]}>
              Would you recommend this?
            </Text>
            <View style={styles.recommendationButtons}>
              <TouchableOpacity
                style={[
                  styles.recommendationButton,
                  { borderColor: colors.icon },
                  isRecommended === true && styles.recommendationButtonActive
                ]}
                onPress={() => setIsRecommended(true)}
              >
                <Ionicons 
                  name="thumbs-up" 
                  size={20} 
                  color={isRecommended === true ? 'white' : colors.icon} 
                />
                <Text style={[
                  styles.recommendationText,
                  { color: isRecommended === true ? 'white' : colors.text }
                ]}>
                  Yes, Recommend
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.recommendationButton,
                  { borderColor: colors.icon },
                  isRecommended === false && styles.recommendationButtonNo
                ]}
                onPress={() => setIsRecommended(false)}
              >
                <Ionicons 
                  name="thumbs-down" 
                  size={20} 
                  color={isRecommended === false ? 'white' : colors.icon} 
                />
                <Text style={[
                  styles.recommendationText,
                  { color: isRecommended === false ? 'white' : colors.text }
                ]}>
                  No, Don't Recommend
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.updateButton, updateLoading && { opacity: 0.7 }]}
          onPress={handleUpdateReview}
          disabled={updateLoading}
        >
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd]}
            style={styles.updateGradient}
          >
            {updateLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.updateButtonText}>Update Review</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingTop: 20,
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

  // Images Card
  imagesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imagesScrollView: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  imageNote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Rating Card
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
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  additionalRatings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  compactRatingSection: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  compactRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  compactRatingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactStarsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  compactStarButton: {
    padding: 1,
  },

  // Content Card
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
  charCount: {
    fontSize: 12,
    fontWeight: 'normal',
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

  // Pros & Cons Card
  prosConsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  prosConsSection: {
    marginBottom: 20,
  },
  prosConsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prosConsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prosConsLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prosConsItem: {
    marginBottom: 8,
  },
  prosConsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  prosConsInput: {
    flex: 1,
    fontSize: 14,
    paddingRight: 8,
  },
  removeButton: {
    padding: 4,
  },

  // Details Card
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
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsInput: {
    flex: 1,
    fontSize: 16,
  },

  // Recommendation
  recommendationSection: {
    marginTop: 20,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationButtons: {
    gap: 12,
  },
  recommendationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  recommendationButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  recommendationButtonNo: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Update Button
  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  updateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
