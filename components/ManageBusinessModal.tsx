import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { BusinessListSkeleton } from '@/components/SkeletonLoader';
import SmartImage from '@/components/SmartImage';

interface Business {
  id: number;
  name: string;
  phone: string;
  address: string;
  image_url: string | null;
  rating?: number;
  category_name?: string;
}

interface ManageBusinessModalProps {
  visible: boolean;
  onClose: () => void;
  collectionId: number;
  collectionName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ManageBusinessModal: React.FC<ManageBusinessModalProps> = ({
  visible,
  onClose,
  collectionId,
  collectionName,
  onSuccess,
  onError,
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedBusinesses(new Set());
    }
  }, [visible]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      // This would be your actual search API call
      // const response = await searchBusinesses(query);
      // For now, we'll simulate with empty results
      setSearchResults([]);
    } catch (error) {
      console.error('Error searching businesses:', error);
      onError('❌ Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessToggle = (businessId: number) => {
    const newSelected = new Set(selectedBusinesses);
    if (newSelected.has(businessId)) {
      newSelected.delete(businessId);
    } else {
      newSelected.add(businessId);
    }
    setSelectedBusinesses(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedBusinesses.size === 0) {
      onError('❌ Please select at least one business to add.');
      return;
    }

    try {
      setLoading(true);
      // Add businesses to collection logic here
      // const promises = Array.from(selectedBusinesses).map(businessId =>
      //   addBusinessToCollection(collectionId, { business_id: businessId })
      // );
      // await Promise.all(promises);
      
      onSuccess(
        `✅ Successfully Added ${selectedBusinesses.size} business${selectedBusinesses.size > 1 ? 'es' : ''} to "${collectionName}" collection!`
      );
      onClose();
    } catch (error) {
      console.error('Error adding businesses:', error);
      onError('❌ Failed to add businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBusinessItem = ({ item }: { item: Business }) => {
    const isSelected = selectedBusinesses.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.businessItem,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.buttonPrimary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleBusinessToggle(item.id)}
      >
        <SmartImage
          source={{ uri: item.image_url }}
          style={styles.businessImage}
          fallbackIcon="storefront-outline"
        />
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          {item.category_name && (
            <Text style={[styles.categoryText, { color: colors.icon }]} numberOfLines={1}>
              {item.category_name}
            </Text>
          )}
          
          <Text style={[styles.addressText, { color: colors.icon }]} numberOfLines={1}>
            {item.address}
          </Text>
          
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={[
          styles.checkboxContainer,
          { 
            backgroundColor: isSelected ? colors.buttonPrimary : 'transparent',
            borderColor: isSelected ? colors.buttonPrimary : colors.border,
          }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={colors.buttonText} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={searchQuery ? "search-outline" : "business-outline"} 
        size={48} 
        color={colors.icon} 
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No Results Found' : 'Search for Businesses'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        {searchQuery 
          ? `No businesses found for "${searchQuery}"`
          : 'Start typing to search for businesses to add to your collection'
        }
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Add Businesses
          </Text>
          <TouchableOpacity
            onPress={handleAddSelected}
            disabled={selectedBusinesses.size === 0 || loading}
            style={[
              styles.addButton,
              {
                backgroundColor: selectedBusinesses.size > 0 ? colors.buttonPrimary : colors.border,
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text style={[styles.addButtonText, { color: colors.buttonText }]}>
                Add ({selectedBusinesses.size})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Collection Info */}
        <View style={[styles.collectionInfo, { backgroundColor: colors.card }]}>
          <Ionicons name="albums" size={20} color={colors.buttonPrimary} />
          <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
            Adding to "{collectionName}"
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search businesses..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Results List */}
        <View style={styles.content}>
          {loading && searchResults.length === 0 ? (
            <BusinessListSkeleton colors={colors} />
          ) : searchResults.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderBusinessItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
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
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  collectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default ManageBusinessModal;
