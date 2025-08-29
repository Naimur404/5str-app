import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { CreateCollectionRequest } from '@/types/api';

interface CreateCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCollectionRequest) => Promise<void>;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [formData, setFormData] = useState<CreateCollectionRequest>({
    name: '',
    description: '',
    is_public: true,
    cover_image: undefined,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      is_public: true,
      cover_image: undefined,
    });
    setErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Collection name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Collection name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      setImagePickerLoading(true);

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select a cover image.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Convert to base64 data URL
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        
        setFormData(prev => ({
          ...prev,
          cover_image: base64Image,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setImagePickerLoading(true);

      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a photo.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Convert to base64 data URL
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        
        setFormData(prev => ({
          ...prev,
          cover_image: base64Image,
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Cover Image',
      'Choose how you want to add a cover image for your collection',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, cover_image: undefined }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert(
        '❌ Creation Failed', 
        'Failed to create collection. Please check your connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Collection
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !formData.name.trim()}
            style={[
              styles.saveButton,
              {
                backgroundColor: loading || !formData.name.trim() 
                  ? colors.border 
                  : colors.buttonPrimary,
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Cover Image <Text style={[styles.optional, { color: colors.icon }]}>(Optional)</Text>
            </Text>
            
            <TouchableOpacity
              style={[styles.coverImageContainer, { borderColor: colors.border }]}
              onPress={showImageOptions}
              disabled={imagePickerLoading}
            >
              {formData.cover_image ? (
                <>
                  <Image
                    source={{ uri: formData.cover_image }}
                    style={styles.coverImagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeCoverImage}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF5722" />
                  </TouchableOpacity>
                </>
              ) : (
                <LinearGradient
                  colors={[colors.buttonPrimary + '20', colors.buttonPrimary + '10']}
                  style={styles.coverImagePlaceholder}
                >
                  {imagePickerLoading ? (
                    <ActivityIndicator size="large" color={colors.buttonPrimary} />
                  ) : (
                    <>
                      <Ionicons name="camera" size={32} color={colors.buttonPrimary} />
                      <Text style={[styles.coverImageText, { color: colors.buttonPrimary }]}>
                        Add Cover Image
                      </Text>
                      <Text style={[styles.coverImageSubtext, { color: colors.icon }]}>
                        Tap to select from gallery or take photo
                      </Text>
                    </>
                  )}
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          {/* Collection Name */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Collection Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.name ? '#FF5722' : colors.border,
                  color: colors.text,
                }
              ]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Enter collection name"
              placeholderTextColor={colors.icon}
              maxLength={100}
              autoCapitalize="words"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
            <Text style={[styles.charCount, { color: colors.icon }]}>
              {formData.name.length}/100
            </Text>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description <Text style={[styles.optional, { color: colors.icon }]}>(Optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.description ? '#FF5722' : colors.border,
                  color: colors.text,
                }
              ]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, description: text }));
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: '' }));
                }
              }}
              placeholder="Describe your collection..."
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
            <Text style={[styles.charCount, { color: colors.icon }]}>
              {formData.description.length}/500
            </Text>
          </View>

          {/* Privacy Setting */}
          <View style={styles.fieldContainer}>
            <View style={styles.privacyContainer}>
              <View style={styles.privacyInfo}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Make Public
                </Text>
                <Text style={[styles.privacyDescription, { color: colors.icon }]}>
                  {formData.is_public 
                    ? 'Anyone can view and follow this collection'
                    : 'Only you can view this collection'
                  }
                </Text>
              </View>
              <Switch
                value={formData.is_public}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, is_public: value }))
                }
                trackColor={{ false: colors.border, true: colors.buttonPrimary }}
                thumbColor={colors.card}
              />
            </View>
          </View>

          {/* Info Note */}
          <View style={[styles.infoNote, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.icon }]}>
              You can add businesses to your collection after creating it. Cover image and settings can be changed later.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
    fontSize: 14,
  },
  coverImageContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImagePreview: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  coverImageSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
  },
  errorText: {
    color: '#FF5722',
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyInfo: {
    flex: 1,
    marginRight: 16,
  },
  privacyDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  infoNote: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default CreateCollectionModal;
