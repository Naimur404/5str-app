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
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OpeningHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface SubmitAttractionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: AttractionSubmissionData) => void;
  initialData?: {
    name?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface AttractionSubmissionData {
  name: string;
  description: string;
  type: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  entry_fee?: number;
  visiting_hours?: OpeningHour[];
  best_time_to_visit?: string;
  facilities?: string[];
  images?: string[];
  additional_info?: string;
}

const ATTRACTION_TYPES = [
  { id: 'historical', label: 'Historical', icon: 'time-outline' },
  { id: 'natural', label: 'Natural', icon: 'leaf-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'color-palette-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'happy-outline' },
  { id: 'religious', label: 'Religious', icon: 'moon-outline' },
  { id: 'educational', label: 'Educational', icon: 'school-outline' },
  { id: 'recreational', label: 'Recreational', icon: 'basketball-outline' },
];

const FACILITIES = [
  { id: 'parking', label: 'Parking' },
  { id: 'restroom', label: 'Restroom' },
  { id: 'guide_available', label: 'Guide Available' },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'cafeteria', label: 'Cafeteria' },
  { id: 'gift_shop', label: 'Gift Shop' },
  { id: 'photography_allowed', label: 'Photography Allowed' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SubmitAttractionModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: SubmitAttractionModalProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [visitingHours, setVisitingHours] = useState<OpeningHour[]>(
    DAYS.map(day => ({
      day,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setCity(initialData.city || '');
      setLatitude(initialData.latitude?.toString() || '');
      setLongitude(initialData.longitude?.toString() || '');
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('');
    setAddress('');
    setCity('');
    setLatitude('');
    setLongitude('');
    setEntryFee('');
    setBestTimeToVisit('');
    setAdditionalInfo('');
    setSelectedFacilities([]);
    setImages([]);
    setVisitingHours(
      DAYS.map(day => ({
        day,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      }))
    );
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Maximum Images', 'You can only upload up to 5 images');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImages([...images, base64Image]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facilityId)
        ? prev.filter(id => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const updateVisitingHour = (
    index: number,
    field: keyof OpeningHour,
    value: string | boolean
  ) => {
    const updated = [...visitingHours];
    updated[index] = { ...updated[index], [field]: value };
    setVisitingHours(updated);
  };

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter attraction name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter description');
      return;
    }
    if (!type) {
      Alert.alert('Error', 'Please select attraction type');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter address');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter city');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please enter coordinates');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Error', 'Latitude must be between -90 and 90');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Longitude must be between -180 and 180');
      return;
    }

    const submissionData: AttractionSubmissionData = {
      name: name.trim(),
      description: description.trim(),
      type,
      address: address.trim(),
      city: city.trim(),
      latitude: lat,
      longitude: lng,
    };

    if (entryFee && parseFloat(entryFee) >= 0) {
      submissionData.entry_fee = parseFloat(entryFee);
    }

    if (bestTimeToVisit.trim()) {
      submissionData.best_time_to_visit = bestTimeToVisit.trim();
    }

    if (selectedFacilities.length > 0) {
      submissionData.facilities = selectedFacilities;
    }

    if (images.length > 0) {
      submissionData.images = images;
    }

    if (additionalInfo.trim()) {
      submissionData.additional_info = additionalInfo.trim();
    }

    // Only include visiting hours if at least one day is not closed
    const activeHours = visitingHours.filter(h => !h.is_closed);
    if (activeHours.length > 0) {
      submissionData.visiting_hours = visitingHours;
    }

    setSubmitting(true);
    onSubmit(submissionData);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header with safe area */}
        <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Submit Attraction</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
            
            <Text style={[styles.label, { color: colors.text }]}>
              Attraction Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Historic Museum"
              placeholderTextColor={colors.icon}
              maxLength={255}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Type <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {ATTRACTION_TYPES.map(attractionType => (
                <TouchableOpacity
                  key={attractionType.id}
                  style={[
                    styles.typeChip,
                    { backgroundColor: colors.card },
                    type === attractionType.id && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setType(attractionType.id)}
                >
                  <Ionicons
                    name={attractionType.icon as any}
                    size={20}
                    color={type === attractionType.id ? 'white' : colors.icon}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: type === attractionType.id ? 'white' : colors.text },
                    ]}
                  >
                    {attractionType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text }]}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the attraction..."
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            <Text style={[styles.charCount, { color: colors.icon }]}>
              {description.length}/1000
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            
            <Text style={[styles.label, { color: colors.text }]}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={address}
              onChangeText={setAddress}
              placeholder="456 Heritage Street"
              placeholderTextColor={colors.icon}
              maxLength={500}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              City <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={city}
              onChangeText={setCity}
              placeholder="Dhaka"
              placeholderTextColor={colors.icon}
              maxLength={100}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Latitude <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="23.7808875"
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Longitude <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="90.2792371"
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Entry Fee & Best Time */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Visiting Information</Text>
            
            <Text style={[styles.label, { color: colors.text }]}>Entry Fee (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={entryFee}
              onChangeText={setEntryFee}
              placeholder="50.00"
              placeholderTextColor={colors.icon}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.text }]}>Best Time to Visit (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={bestTimeToVisit}
              onChangeText={setBestTimeToVisit}
              placeholder="Morning hours for better lighting"
              placeholderTextColor={colors.icon}
              maxLength={255}
            />
          </View>

          {/* Visiting Hours */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Visiting Hours (Optional)</Text>
            <Text style={[styles.helperText, { color: colors.icon }]}>
              Set opening and closing times for each day
            </Text>

            {visitingHours.map((hour, index) => (
              <View key={hour.day} style={styles.hourRow}>
                <View style={styles.dayContainer}>
                  <Text style={[styles.dayText, { color: colors.text }]}>
                    {hour.day.charAt(0).toUpperCase() + hour.day.slice(1)}
                  </Text>
                  <View style={styles.closedToggle}>
                    <Text style={[styles.closedLabel, { color: colors.icon }]}>Closed</Text>
                    <Switch
                      value={hour.is_closed}
                      onValueChange={value => updateVisitingHour(index, 'is_closed', value)}
                      trackColor={{ false: colors.icon, true: colors.tint }}
                      thumbColor="white"
                    />
                  </View>
                </View>

                {!hour.is_closed && (
                  <View style={styles.timeInputs}>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text }]}
                      value={hour.open_time}
                      onChangeText={value => updateVisitingHour(index, 'open_time', value)}
                      placeholder="09:00"
                      placeholderTextColor={colors.icon}
                    />
                    <Text style={[styles.timeSeparator, { color: colors.icon }]}>to</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text }]}
                      value={hour.close_time}
                      onChangeText={value => updateVisitingHour(index, 'close_time', value)}
                      placeholder="17:00"
                      placeholderTextColor={colors.icon}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Facilities (Optional)</Text>
            <Text style={[styles.helperText, { color: colors.icon }]}>
              Select available facilities
            </Text>

            <View style={styles.facilitiesGrid}>
              {FACILITIES.map(facility => (
                <TouchableOpacity
                  key={facility.id}
                  style={[
                    styles.facilityChip,
                    { backgroundColor: colors.card },
                    selectedFacilities.includes(facility.id) && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => toggleFacility(facility.id)}
                >
                  <Text
                    style={[
                      styles.facilityText,
                      { color: selectedFacilities.includes(facility.id) ? 'white' : colors.text },
                    ]}
                  >
                    {facility.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Images (Optional)</Text>
            <Text style={[styles.helperText, { color: colors.icon }]}>
              Upload up to 5 images (max 5MB each)
            </Text>

            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.tint }]}
              onPress={pickImage}
              disabled={images.length >= 5}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="white" />
              <Text style={styles.uploadButtonText}>
                {images.length >= 5 ? 'Maximum images reached' : 'Upload Image'}
              </Text>
            </TouchableOpacity>

            <View style={styles.imagesGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="Photography rules, group discounts, etc..."
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            <Text style={[styles.charCount, { color: colors.icon }]}>
              {additionalInfo.length}/1000
            </Text>
          </View>

          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>

        {/* Submit Button with safe area */}
        <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.tint }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.submitButtonText}>Submit Attraction</Text>
              </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: 'red',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  typeScroll: {
    marginBottom: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    marginBottom: 12,
  },
  hourRow: {
    marginBottom: 16,
  },
  dayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  closedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedLabel: {
    fontSize: 14,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  timeSeparator: {
    fontSize: 14,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  facilityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  facilityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
