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
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { updateProfile, UpdateProfilePayload, User } from '@/services/api';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.icon + '20' }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, { opacity: loading ? 0.5 : 1 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <Text style={[styles.saveText, { color: colors.tint }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.profileImage} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.icon + '20' }]}>
                  <Ionicons name="person" size={40} color={colors.icon} />
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.imagePickerButton, { backgroundColor: colors.tint }]}
                onPress={pickImage}
                disabled={imageLoading}
              >
                {imageLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.imageText, { color: colors.icon }]}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.icon + '30',
                  color: colors.text
                }]}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.icon + '30',
                  color: colors.text
                }]}
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.icon}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>City</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.icon + '30',
                  color: colors.text
                }]}
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="Enter your city"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Coordinates (Optional)</Text>
              <View style={styles.coordinatesContainer}>
                <TextInput
                  style={[styles.coordinateInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.icon + '30',
                    color: colors.text
                  }]}
                  value={formData.latitude.toString()}
                  onChangeText={(text) => handleInputChange('latitude', parseFloat(text) || 0)}
                  placeholder="Latitude"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.coordinateInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.icon + '30',
                    color: colors.text
                  }]}
                  value={formData.longitude.toString()}
                  onChangeText={(text) => handleInputChange('longitude', parseFloat(text) || 0)}
                  placeholder="Longitude"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
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
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    fontSize: 14,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
});
