import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { updateProfile, UpdateProfilePayload, User } from '@/services/api';
import cacheService from '@/services/cacheService';
import * as ImagePicker from 'expo-image-picker';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from './CustomAlert';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function EditProfileModal({ visible, onClose, user, onUpdate }: EditProfileModalProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showInfo, showError, showSuccess, hideAlert } = useCustomAlert();
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    city: user.city || '',
    latitude: user.current_latitude || 0,
    longitude: user.current_longitude || 0,
    profile_image: user.profile_image || '',
  });
  
  const [selectedImageUri, setSelectedImageUri] = useState<string>(user.profile_image || '');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    showInfo(
      'Select Image',
      'Choose an option to select your profile image',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      setImageLoading(true);
      
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showError('Permission Required', 'Permission to access camera is required!');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Error', 'Failed to take photo');
    } finally {
      setImageLoading(false);
    }
  };

  const openImageLibrary = async () => {
    try {
      setImageLoading(true);
      
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showError('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Error', 'Failed to pick image');
    } finally {
      setImageLoading(false);
    }
  };

  const processSelectedImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      if (asset.base64) {
        // Check image size (base64 is roughly 4/3 the size of the original)
        const imageSizeInBytes = (asset.base64.length * 3) / 4;
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB limit
        
        if (imageSizeInBytes > maxSizeInBytes) {
          showError(
            'Image Too Large', 
            'Please select an image smaller than 5MB or reduce the quality.'
          );
          return;
        }
        
        // Create data URI with base64 string for backend
        const mimeType = 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${asset.base64}`;
        
        console.log('Image converted to base64, size:', (base64Image.length / 1024 / 1024).toFixed(2), 'MB');
        
        // Store the local URI for display
        setSelectedImageUri(asset.uri);
        
        // Store the base64 string for backend submission
        handleInputChange('profile_image', base64Image);
      } else {
        showError('Error', 'Failed to convert image to base64');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      showError('Error', 'Failed to process image');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.name.trim()) {
        showError('Error', 'Name is required');
        return;
      }

      if (!formData.phone.trim()) {
        showError('Error', 'Phone number is required');
        return;
      }

      if (!formData.city.trim()) {
        showError('Error', 'City is required');
        return;
      }

      const payload: UpdateProfilePayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        profile_image: formData.profile_image, // This will be base64 string if image was selected
      };

      console.log('Updating profile with payload:', {
        ...payload,
        profile_image: payload.profile_image ? 
          `${payload.profile_image.substring(0, 50)}... (${(payload.profile_image.length / 1024).toFixed(1)}KB)` : 
          'No image'
      });

      const response = await updateProfile(payload);
      
      if (response.success) {
        // Clear and update cache with new user data
        await cacheService.setUserProfile(response.data.user);
        console.log('User profile cache updated after profile update');
        
        showSuccess('Success', 'Profile updated successfully');
        onUpdate(response.data.user);
        onClose();
      } else {
        showError('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { 
          borderBottomColor: colors.border,
          backgroundColor: colors.background
        }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: colors.tint,
                opacity: loading ? 0.7 : 1 
              }
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={[styles.content, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={[
                  styles.profileImage,
                  { borderColor: colorScheme === 'dark' ? colors.border : 'white' }
                ]} />
              ) : (
                <View style={[
                  styles.imagePlaceholder, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }
                ]}>
                  <Ionicons name="person" size={40} color={colors.icon} />
                </View>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.imagePickerButton, 
                  { 
                    backgroundColor: colors.tint,
                    borderColor: colorScheme === 'dark' ? colors.border : 'white'
                  }
                ]}
                onPress={pickImage}
                disabled={imageLoading}
              >
                {imageLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.imageText, { color: colors.icon }]}>Tap to change profile photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                <Ionicons name="person-outline" size={16} color={colors.icon} /> Full Name
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="person" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.icon}
                  keyboardAppearance={colorScheme}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                <Ionicons name="call-outline" size={16} color={colors.icon} /> Phone Number
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="call" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.icon}
                  keyboardType="phone-pad"
                  keyboardAppearance={colorScheme}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                <Ionicons name="location-outline" size={16} color={colors.icon} /> City
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="location" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  placeholder="Enter your city"
                  placeholderTextColor={colors.icon}
                  keyboardAppearance={colorScheme}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                <Ionicons name="map-outline" size={16} color={colors.icon} /> Coordinates (Optional)
              </Text>
              <View style={styles.coordinatesContainer}>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
                  <Ionicons name="navigate" size={18} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.coordinateInput, { color: colors.text }]}
                    value={formData.latitude.toString()}
                    onChangeText={(text) => handleInputChange('latitude', parseFloat(text) || 0)}
                    placeholder="Latitude"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    keyboardAppearance={colorScheme}
                  />
                </View>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
                  <Ionicons name="compass" size={18} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.coordinateInput, { color: colors.text }]}
                    value={formData.longitude.toString()}
                    onChangeText={(text) => handleInputChange('longitude', parseFloat(text) || 0)}
                    placeholder="Longitude"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    keyboardAppearance={colorScheme}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomAlert 
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    width: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
  },
  imagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  imagePickerButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imageText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  formSection: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
});
