import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SubmitOfferingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: OfferingSubmissionData) => void;
  initialData?: {
    business_id?: number;
    business_name?: string;
    business_address?: string;
  };
}

export interface OfferingSubmissionData {
  business_id?: number | null;
  business_name: string;
  business_address: string;
  offering_name: string;
  offering_description: string;
  offering_category: string;
  price?: number | null;
  price_type?: 'fixed' | 'range' | 'negotiable' | 'free';
  availability?: string;
  contact_info?: string;
  images?: string[];
  additional_info?: string;
}

const PRICE_TYPES = [
  { id: 'fixed', label: 'Fixed Price', icon: 'pricetag-outline' },
  { id: 'range', label: 'Price Range', icon: 'swap-horizontal-outline' },
  { id: 'negotiable', label: 'Negotiable', icon: 'chatbubbles-outline' },
  { id: 'free', label: 'Free', icon: 'gift-outline' },
];

const CATEGORY_SUGGESTIONS = [
  'Food & Dining',
  'Health & Wellness',
  'Beauty & Spa',
  'Professional Services',
  'Home Services',
  'Education & Training',
  'Sports & Fitness',
  'Entertainment',
  'Products & Retail',
  'Technology Services',
  'Automotive Services',
  'Travel & Tourism',
];

export default function SubmitOfferingModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: SubmitOfferingModalProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [offeringName, setOfferingName] = useState('');
  const [offeringDescription, setOfferingDescription] = useState('');
  const [offeringCategory, setOfferingCategory] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'range' | 'negotiable' | 'free'>('fixed');
  const [availability, setAvailability] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setBusinessId(initialData.business_id || null);
      setBusinessName(initialData.business_name || '');
      setBusinessAddress(initialData.business_address || '');
    }
  }, [visible, initialData]);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  }, [visible]);

  const resetForm = () => {
    setBusinessId(null);
    setBusinessName('');
    setBusinessAddress('');
    setOfferingName('');
    setOfferingDescription('');
    setOfferingCategory('');
    setPrice('');
    setPriceType('fixed');
    setAvailability('');
    setContactInfo('');
    setAdditionalInfo('');
    setImages([]);
    setSubmitting(false);
    setShowCategorySuggestions(false);
  };

  const handleSelectImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImages([...images, base64Image]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSelectCategory = (category: string) => {
    setOfferingCategory(category);
    setShowCategorySuggestions(false);
  };

  const validateForm = (): boolean => {
    if (!businessName.trim()) {
      Alert.alert('Required Field', 'Please enter the business name');
      return false;
    }
    if (businessName.length > 255) {
      Alert.alert('Validation Error', 'Business name must not exceed 255 characters');
      return false;
    }
    if (!businessAddress.trim()) {
      Alert.alert('Required Field', 'Please enter the business address');
      return false;
    }
    if (businessAddress.length > 500) {
      Alert.alert('Validation Error', 'Business address must not exceed 500 characters');
      return false;
    }
    if (!offeringName.trim()) {
      Alert.alert('Required Field', 'Please enter the offering name');
      return false;
    }
    if (offeringName.length > 255) {
      Alert.alert('Validation Error', 'Offering name must not exceed 255 characters');
      return false;
    }
    if (!offeringDescription.trim()) {
      Alert.alert('Required Field', 'Please enter the offering description');
      return false;
    }
    if (offeringDescription.length > 1000) {
      Alert.alert('Validation Error', 'Offering description must not exceed 1000 characters');
      return false;
    }
    if (!offeringCategory.trim()) {
      Alert.alert('Required Field', 'Please select or enter a category');
      return false;
    }
    if (offeringCategory.length > 100) {
      Alert.alert('Validation Error', 'Category must not exceed 100 characters');
      return false;
    }
    if (price && isNaN(parseFloat(price))) {
      Alert.alert('Invalid Input', 'Price must be a valid number');
      return false;
    }
    if (price && parseFloat(price) < 0) {
      Alert.alert('Invalid Input', 'Price cannot be negative');
      return false;
    }
    if (availability && availability.length > 255) {
      Alert.alert('Validation Error', 'Availability must not exceed 255 characters');
      return false;
    }
    if (contactInfo && contactInfo.length > 255) {
      Alert.alert('Validation Error', 'Contact info must not exceed 255 characters');
      return false;
    }
    if (additionalInfo && additionalInfo.length > 1000) {
      Alert.alert('Validation Error', 'Additional info must not exceed 1000 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const submissionData: OfferingSubmissionData = {
      business_id: businessId,
      business_name: businessName.trim(),
      business_address: businessAddress.trim(),
      offering_name: offeringName.trim(),
      offering_description: offeringDescription.trim(),
      offering_category: offeringCategory.trim(),
      price_type: priceType,
    };

    // Add optional fields
    if (price && priceType !== 'free') {
      submissionData.price = parseFloat(price);
    }
    if (availability.trim()) {
      submissionData.availability = availability.trim();
    }
    if (contactInfo.trim()) {
      submissionData.contact_info = contactInfo.trim();
    }
    if (images.length > 0) {
      submissionData.images = images;
    }
    if (additionalInfo.trim()) {
      submissionData.additional_info = additionalInfo.trim();
    }

    try {
      await onSubmit(submissionData);
      resetForm();
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = CATEGORY_SUGGESTIONS.filter(cat =>
    cat.toLowerCase().includes(offeringCategory.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} disabled={submitting} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Submit Offering</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Business Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Information</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
              {businessId ? 'Pre-filled from current business' : 'Enter business details'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Business Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
                placeholderTextColor={colors.icon}
                maxLength={255}
              />
              <Text style={[styles.charCount, { color: colors.icon }]}>
                {businessName.length}/255
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Business Address <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Enter full business address"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={2}
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: colors.icon }]}>
                {businessAddress.length}/500
              </Text>
            </View>
          </View>

          {/* Offering Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Offering Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Offering Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={offeringName}
                onChangeText={setOfferingName}
                placeholder="e.g., Premium Coffee Blend, Massage Therapy"
                placeholderTextColor={colors.icon}
                maxLength={255}
              />
              <Text style={[styles.charCount, { color: colors.icon }]}>
                {offeringName.length}/255
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={offeringDescription}
                onChangeText={setOfferingDescription}
                placeholder="Describe the offering in detail"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
              <Text style={[styles.charCount, { color: colors.icon }]}>
                {offeringDescription.length}/1000
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={offeringCategory}
                onChangeText={(text) => {
                  setOfferingCategory(text);
                  setShowCategorySuggestions(text.length > 0);
                }}
                placeholder="Select or enter category"
                placeholderTextColor={colors.icon}
                maxLength={100}
              />
              {showCategorySuggestions && filteredCategories.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {filteredCategories.map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectCategory(cat)}
                    >
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Price Type</Text>
              <View style={styles.priceTypeGrid}>
                {PRICE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.priceTypeButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      priceType === type.id && { borderColor: colors.tint, backgroundColor: colors.tint + '20' }
                    ]}
                    onPress={() => setPriceType(type.id as any)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={priceType === type.id ? colors.tint : colors.icon}
                    />
                    <Text style={[
                      styles.priceTypeLabel,
                      { color: priceType === type.id ? colors.tint : colors.text }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {priceType !== 'free' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Price {priceType === 'range' ? '(Starting)' : ''}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Enter price amount"
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Availability</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={availability}
                onChangeText={setAvailability}
                placeholder="e.g., Mon-Fri 9AM-6PM, Weekends only"
                placeholderTextColor={colors.icon}
                maxLength={255}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Contact Information</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={contactInfo}
                onChangeText={setContactInfo}
                placeholder="Phone number or email for inquiries"
                placeholderTextColor={colors.icon}
                maxLength={255}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Any other relevant information"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                maxLength={1000}
              />
              <Text style={[styles.charCount, { color: colors.icon }]}>
                {additionalInfo.length}/1000
              </Text>
            </View>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Images (Optional)</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
              Add up to 5 images (max 5MB each)
            </Text>

            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.tint }]}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity
                  style={[styles.addImageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleSelectImage}
                >
                  <Ionicons name="camera-outline" size={32} color={colors.icon} />
                  <Text style={[styles.addImageText, { color: colors.icon }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '40' }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Your submission will be reviewed within 24-48 hours. You'll be notified once it's approved.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Submit Button */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.submitButtonBottom, { backgroundColor: colors.tint }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Offering</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  priceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
    minWidth: '48%',
  },
  priceTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonBottom: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
