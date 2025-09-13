import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessImage } from '@/services/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

const { width } = Dimensions.get('window');

interface BusinessImageGalleryProps {
  images: BusinessImage[];
  businessName?: string;
  style?: any;
  showImageCount?: boolean;
  onImagePress?: (image: BusinessImage, index: number) => void;
}

export default function BusinessImageGallery({
  images,
  businessName = '',
  style,
  showImageCount = true,
  onImagePress,
}: BusinessImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={{ uri: getFallbackImageUrl('business') }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  const handleImagePress = (image: BusinessImage, index: number) => {
    if (onImagePress) {
      onImagePress(image, index);
    } else {
      setSelectedImageIndex(index);
    }
  };

  const renderImageItem = ({ item, index }: { item: BusinessImage; index: number }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => handleImagePress(item, index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: getImageUrl(item.image_url) || getFallbackImageUrl('business') }}
        style={styles.image}
        resizeMode="cover"
      />
      {item.is_primary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>Primary</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFullScreenModal = () => (
    <Modal
      visible={selectedImageIndex !== null}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setSelectedImageIndex(null)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setSelectedImageIndex(null)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        
        {selectedImageIndex !== null && (
          <FlatList
            data={images}
            renderItem={({ item }) => (
              <View style={styles.fullScreenImageContainer}>
                <Image
                  source={{ uri: getImageUrl(item.image_url) || getFallbackImageUrl('business') }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedImageIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
          />
        )}
        
        {selectedImageIndex !== null && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1} of {images.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );

  // Single image display
  if (images.length === 1) {
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity onPress={() => handleImagePress(images[0], 0)} activeOpacity={0.8}>
          <Image
            source={{ uri: getImageUrl(images[0].image_url) || getFallbackImageUrl('business') }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        {renderFullScreenModal()}
      </View>
    );
  }

  // Multiple images display with scroll
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContainer}
      />
      
      {showImageCount && images.length > 1 && (
        <View style={styles.imageCountBadge}>
          <Ionicons name="images" size={16} color="white" />
          <Text style={styles.imageCountText}>{images.length}</Text>
        </View>
      )}
      
      {renderFullScreenModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  scrollContainer: {
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  fullScreenImageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});