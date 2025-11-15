import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { getBusinessCategories, submitBusiness } from '@/services/api';
import { BusinessCategory, BusinessSubmissionOpeningHour } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface SubmitBusinessModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  prefilledBusinessName?: string;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SubmitBusinessModal({
  visible,
  onClose,
  onSuccess,
  prefilledBusinessName,
}: SubmitBusinessModalProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showError } = useToastGlobal();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form state
  const [name, setName] = useState(prefilledBusinessName || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState<BusinessSubmissionOpeningHour[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    }))
  );

  useEffect(() => {
    if (visible) {
      loadCategories();
      if (prefilledBusinessName) {
        setName(prefilledBusinessName);
      }
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await getBusinessCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission to access photos is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const base64Images = result.assets
          .filter(asset => asset.base64)
          .map(asset => `data:image/jpeg;base64,${asset.base64}`);
        
        if (images.length + base64Images.length > 10) {
          showError('Maximum 10 images allowed');
          return;
        }
        
        setImages([...images, ...base64Images]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateOpeningHour = (index: number, field: keyof BusinessSubmissionOpeningHour, value: any) => {
    const updated = [...openingHours];
    updated[index] = { ...updated[index], [field]: value };
    setOpeningHours(updated);
  };

  const validateForm = () => {
    if (!name.trim()) {
      showError('Business name is required');
      return false;
    }
    if (!description.trim()) {
      showError('Description is required');
      return false;
    }
    if (!category) {
      showError('Category is required');
      return false;
    }
    if (!address.trim()) {
      showError('Address is required');
      return false;
    }
    if (!city.trim()) {
      showError('City is required');
      return false;
    }
    if (!latitude || !longitude) {
      showError('Location coordinates are required');
      return false;
    }
    if (!phone.trim()) {
      showError('Phone number is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const data = {
        name: name.trim(),
        description: description.trim(),
        category,
        address: address.trim(),
        city: city.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone.trim(),
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        opening_hours: openingHours,
        images: images.length > 0 ? images : undefined,
        additional_info: additionalInfo.trim() || undefined,
      };

      const response = await submitBusiness(data);

      if (response.success) {
        onSuccess(response.message);
        resetForm();
        onClose();
      } else {
        showError(response.message || 'Failed to submit business');
      }
    } catch (error: any) {
      console.error('Error submitting business:', error);
      showError(error.message || 'Failed to submit business');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setAddress('');
    setCity('');
    setLatitude('');
    setLongitude('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setAdditionalInfo('');
    setImages([]);
    setOpeningHours(
      DAYS_OF_WEEK.map(day => ({
        day,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: false,
      }))
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[
          styles.header, 
          { 
            backgroundColor: colors.card, 
            borderBottomColor: colors.border,
            paddingTop: insets.top + 10,
          }
        ]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Submit Business</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="information-circle" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.tint }]}>
                Submit a business for review. We'll review it within 24-48 hours!
              </Text>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

              <Text style={[styles.label, { color: colors.text }]}>Business Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter business name"
                placeholderTextColor={colors.icon}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Describe the business in detail"
                placeholderTextColor={colors.icon}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
              {loadingCategories ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        { 
                          backgroundColor: category === cat.name ? colors.tint : colors.card,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setCategory(cat.name)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        { color: category === cat.name ? 'white' : colors.text }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>

              <Text style={[styles.label, { color: colors.text }]}>Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Full address"
                placeholderTextColor={colors.icon}
                value={address}
                onChangeText={setAddress}
              />

              <Text style={[styles.label, { color: colors.text }]}>City *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="City name"
                placeholderTextColor={colors.icon}
                value={city}
                onChangeText={setCity}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={[styles.label, { color: colors.text }]}>Latitude *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder="23.7465"
                    placeholderTextColor={colors.icon}
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={[styles.label, { color: colors.text }]}>Longitude *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder="90.3754"
                    placeholderTextColor={colors.icon}
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

              <Text style={[styles.label, { color: colors.text }]}>Phone *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="+8801712345678"
                placeholderTextColor={colors.icon}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="info@business.com"
                placeholderTextColor={colors.icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>Website</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="https://business.com"
                placeholderTextColor={colors.icon}
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Opening Hours */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening Hours</Text>
              {openingHours.map((hour, index) => (
                <View key={hour.day} style={[styles.hourRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.dayColumn}>
                    <Text style={[styles.dayText, { color: colors.text }]}>
                      {hour.day.charAt(0).toUpperCase() + hour.day.slice(1)}
                    </Text>
                    <Switch
                      value={!hour.is_closed}
                      onValueChange={(value) => updateOpeningHour(index, 'is_closed', !value)}
                      trackColor={{ false: colors.icon + '30', true: colors.tint + '30' }}
                      thumbColor={!hour.is_closed ? colors.tint : colors.icon}
                    />
                  </View>
                  {!hour.is_closed && (
                    <View style={styles.timeColumn}>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="09:00"
                        placeholderTextColor={colors.icon}
                        value={hour.open_time}
                        onChangeText={(value) => updateOpeningHour(index, 'open_time', value)}
                      />
                      <Text style={[styles.timeSeparator, { color: colors.icon }]}>to</Text>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="18:00"
                        placeholderTextColor={colors.icon}
                        value={hour.close_time}
                        onChangeText={(value) => updateOpeningHour(index, 'close_time', value)}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Images */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Images (Max 10)</Text>
              <Text style={[styles.helperText, { color: colors.icon }]}>
                Add photos of the business to help others
              </Text>

              <TouchableOpacity
                style={[styles.addImageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={pickImage}
              >
                <Ionicons name="images" size={24} color={colors.tint} />
                <Text style={[styles.addImageText, { color: colors.tint }]}>Add Images</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <Image source={{ uri: image }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF5722" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Additional Info */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>
              <Text style={[styles.helperText, { color: colors.icon }]}>
                Any other important details about the business
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Any other details (delivery, parking, special features, etc.)"
                placeholderTextColor={colors.icon}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[
          styles.footer, 
          { 
            backgroundColor: colors.card, 
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          }
        ]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit for Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dayColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  timeColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    width: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagesScroll: {
    marginTop: 12,
  },
  imagePreview: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  pointsPreview: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginTop: 8,
  },
  pointsContent: {
    flex: 1,
  },
  pointsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointsBreakdown: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
