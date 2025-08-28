import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { isAuthenticated, submitReview, SubmitReviewRequest } from '@/services/api';
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
    Alert,
} from 'react-native';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { useToastGlobal } from '@/contexts/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Hide development overlays
if (__DEV__) {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('react-devtools')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

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
  const [images, setImages] = useState<string[]>([]);
  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const reviewType = params.type as ReviewType;
  const reviewableId = parseInt(params.id as string);
  const businessName = params.businessName as string;
  const offeringName = params.offeringName as string;

  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showError, showSuccess, showInfo, hideAlert } = useCustomAlert();
  const { showSuccess: showToastSuccess, showError: showToastError, showInfo: showToastInfo } = useToastGlobal();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const authenticated = await isAuthenticated();
      setUserAuthenticated(authenticated);
      
      if (!authenticated) {
        showInfo(
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

  const pickImages = async () => {
    if (images.length >= 5) {
      showError('Error', 'You can upload maximum 5 images');
      return;
    }

    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showError('Permission Required', 'Please allow access to your photo library to upload images');
        return;
      }

      setImagePickerLoading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size (max 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
          showError('Error', 'Image size must be less than 5MB');
          return;
        }

        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Add data URL prefix
        const mimeType = asset.uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${base64}`;

        setImages(prev => [...prev, base64Image]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Error', 'Failed to pick image. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      showError('Error', 'You can upload maximum 5 images');
      return;
    }

    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showError('Permission Required', 'Please allow camera access to take photos');
        return;
      }

      setImagePickerLoading(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Add data URL prefix
        const base64Image = `data:image/jpeg;base64,${base64}`;
        setImages(prev => [...prev, base64Image]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Error', 'Failed to take photo. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImages },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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

  const handleSubmitReview = async () => {
    if (!userAuthenticated) {
      showError('Error', 'You must be logged in to submit a review');
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

      // Add images if any
      if (images.length > 0) {
        reviewData.images = images;
      }

      const response = await submitReview(reviewData);
      
      if (response.success) {
        showSuccess(
          'Success',
          'Your review has been submitted successfully! Thank you for sharing your experience.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        // Check if it's the "already reviewed" error
        if (response.message && response.message.includes('already reviewed')) {
          // Show red toast message for already reviewed error (user stays on page)
          showToastError('You have already reviewed this item. You can edit your existing review instead.', 4000);
        } else {
          // Show alert for other errors
          showError('Error', response.message || 'Failed to submit review. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showError('Error', 'Failed to submit review. Please try again.');
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
            <Text style={styles.headerSubtitle}>Share your experience</Text>
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
                {reviewType === 'business' ? businessName : offeringName}
              </Text>
              {reviewType === 'offering' && businessName && (
                <Text style={[styles.infoSubtitle, { color: colors.icon }]}>
                  at {businessName}
                </Text>
              )}
            </View>
          </View>
        </View>

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

        {/* Photos Card */}
        <View style={[styles.photosCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Photos (Optional)</Text>
          <Text style={[styles.photosDescription, { color: colors.icon }]}>
            Add up to 5 photos to help others understand your experience better
          </Text>
          
          {/* Images Preview */}
          {images.length > 0 && (
            <View style={styles.imagesPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Add Photo Button */}
          {images.length < 5 && (
            <TouchableOpacity
              style={[styles.addPhotoButton, { borderColor: colors.icon }]}
              onPress={showImageOptions}
              disabled={imagePickerLoading}
            >
              {imagePickerLoading ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <>
                  <View style={[styles.addPhotoIcon, { backgroundColor: colors.tint + '20' }]}>
                    <Ionicons name="camera" size={24} color={colors.tint} />
                  </View>
                  <Text style={[styles.addPhotoText, { color: colors.text }]}>
                    Add Photo ({images.length}/5)
                  </Text>
                  <Text style={[styles.addPhotoSubtext, { color: colors.icon }]}>
                    Tap to choose from gallery or take a photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
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

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd]}
            style={styles.submitGradient}
          >
            {loading ? (
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

  // Submit Button
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

  // Photos Card
  photosCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  photosDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  imagesPreview: {
    marginBottom: 16,
  },
  imagesScrollView: {
    paddingVertical: 8,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addPhotoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.02)',
    minHeight: 120,
  },
  addPhotoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addPhotoSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
});
