import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { isAuthenticated, submitReview, SubmitReviewRequest } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

type ReviewType = 'business' | 'offering';

export default function WriteReviewScreen() {
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
  const [loading, setLoading] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const reviewType = params.type as ReviewType;
  const reviewableId = parseInt(params.id as string);
  const businessName = params.businessName as string;
  const offeringName = params.offeringName as string;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const authenticated = await isAuthenticated();
      setUserAuthenticated(authenticated);
      
      if (!authenticated) {
        Alert.alert(
          'Login Required',
          'You must be logged in to write a review',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Login', onPress: () => router.push('/auth/login' as any) }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.back();
    }
  };

  const renderStarRating = (currentRating: number, onRatingChange: (rating: number) => void, label: string) => (
    <View style={styles.ratingSection}>
      <Text style={[styles.ratingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
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
      Alert.alert('Error', 'Please provide an overall rating');
      return false;
    }
    if (reviewText.length < 10) {
      Alert.alert('Error', 'Review text must be at least 10 characters long');
      return false;
    }
    if (reviewText.length > 2000) {
      Alert.alert('Error', 'Review text must not exceed 2000 characters');
      return false;
    }
    return true;
  };

  const handleSubmitReview = async () => {
    if (!userAuthenticated) {
      Alert.alert('Error', 'You must be logged in to submit a review');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const reviewData: SubmitReviewRequest = {
        reviewable_type: reviewType,
        reviewable_id: reviewableId,
        overall_rating: rating,
        review_text: reviewText,
      };

      // Add optional fields if provided
      if (serviceRating > 0) reviewData.service_rating = serviceRating;
      if (qualityRating > 0) reviewData.quality_rating = qualityRating;
      if (valueRating > 0) reviewData.value_rating = valueRating;
      if (title.trim()) reviewData.title = title.trim();
      if (isRecommended !== null) reviewData.is_recommended = isRecommended;
      if (visitDate) reviewData.visit_date = visitDate;
      if (amountSpent) reviewData.amount_spent = parseFloat(amountSpent);
      if (partySize) reviewData.party_size = parseInt(partySize);

      // Add pros and cons (filter out empty strings)
      const validPros = pros.filter(pro => pro.trim().length > 0);
      const validCons = cons.filter(con => con.trim().length > 0);
      if (validPros.length > 0) reviewData.pros = validPros;
      if (validCons.length > 0) reviewData.cons = validCons;

      const response = await submitReview(reviewData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your review has been submitted successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Checking authentication...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Write a Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business/Offering Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Reviewing: {reviewType === 'business' ? businessName : offeringName}
          </Text>
          {reviewType === 'offering' && businessName && (
            <Text style={[styles.infoSubtitle, { color: colors.icon }]}>
              at {businessName}
            </Text>
          )}
        </View>

        {/* Overall Rating */}
        {renderStarRating(rating, setRating, 'Overall Rating *')}

        {/* Additional Ratings */}
        {renderStarRating(serviceRating, setServiceRating, 'Service Rating')}
        {renderStarRating(qualityRating, setQualityRating, 'Quality Rating')}
        {renderStarRating(valueRating, setValueRating, 'Value Rating')}

        {/* Review Title */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Review Title (Optional)</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: colors.icon 
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your review a title"
            placeholderTextColor={colors.icon}
            maxLength={255}
          />
        </View>

        {/* Review Text */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Review Text * ({reviewText.length}/2000)
          </Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: colors.icon 
            }]}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience (minimum 10 characters)"
            placeholderTextColor={colors.icon}
            multiline
            numberOfLines={5}
            maxLength={2000}
          />
        </View>

        {/* Pros */}
        <View style={styles.inputSection}>
          <View style={styles.prosConsHeader}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Pros (Optional)</Text>
            {pros.length < 5 && (
              <TouchableOpacity onPress={() => addProOrCon('pros')}>
                <Ionicons name="add-circle" size={24} color={colors.tint} />
              </TouchableOpacity>
            )}
          </View>
          {pros.map((pro, index) => (
            <View key={index} style={styles.prosConsItem}>
              <TextInput
                style={[styles.prosConsInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.icon 
                }]}
                value={pro}
                onChangeText={(value) => updateProOrCon('pros', index, value)}
                placeholder={`Pro ${index + 1}`}
                placeholderTextColor={colors.icon}
                maxLength={100}
              />
              {pros.length > 1 && (
                <TouchableOpacity onPress={() => removeProOrCon('pros', index)}>
                  <Ionicons name="remove-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Cons */}
        <View style={styles.inputSection}>
          <View style={styles.prosConsHeader}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Cons (Optional)</Text>
            {cons.length < 5 && (
              <TouchableOpacity onPress={() => addProOrCon('cons')}>
                <Ionicons name="add-circle" size={24} color={colors.tint} />
              </TouchableOpacity>
            )}
          </View>
          {cons.map((con, index) => (
            <View key={index} style={styles.prosConsItem}>
              <TextInput
                style={[styles.prosConsInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.icon 
                }]}
                value={con}
                onChangeText={(value) => updateProOrCon('cons', index, value)}
                placeholder={`Con ${index + 1}`}
                placeholderTextColor={colors.icon}
                maxLength={100}
              />
              {cons.length > 1 && (
                <TouchableOpacity onPress={() => removeProOrCon('cons', index)}>
                  <Ionicons name="remove-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Additional Info */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Additional Information (Optional)</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputSubLabel, { color: colors.icon }]}>Amount Spent ($)</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.icon 
                }]}
                value={amountSpent}
                onChangeText={setAmountSpent}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={[styles.inputSubLabel, { color: colors.icon }]}>Party Size</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.icon 
                }]}
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
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Would you recommend this?</Text>
          <View style={styles.recommendationButtons}>
            <TouchableOpacity
              style={[
                styles.recommendationButton,
                { backgroundColor: colors.background, borderColor: colors.icon },
                isRecommended === true && { backgroundColor: colors.tint, borderColor: colors.tint }
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
                Yes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.recommendationButton,
                { backgroundColor: colors.background, borderColor: colors.icon },
                isRecommended === false && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
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
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.tint },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputSubLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  prosConsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prosConsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  prosConsInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  recommendationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
