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
import { useToast } from '@/hooks/useToast';
import { BusinessListSkeleton } from '@/components/SkeletonLoader';
import SmartImage from '@/components/SmartImage';
import Toast from '@/components/Toast';
import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Business, SearchResponse } from '@/types/api';
import { fetchWithJsonValidation } from '@/services/api';
import { addBusinessToCollection } from '@/services/api';

interface ManageBusinessModalProps {
  visible: boolean;
  onClose: () => void;
  collectionId: number;
  collectionName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh?: () => void;
}

const ManageBusinessModal: React.FC<ManageBusinessModalProps> = ({
  visible,
  onClose,
  collectionId,
  collectionName,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { toastConfig, showSuccess: showToastSuccess, showError: showToastError, hideToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBusinesses, setAddingBusinesses] = useState(false);
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
      
      // Use the search API without lat/lon as requested
      const baseParams = `q=${encodeURIComponent(query)}&type=all&sort=rating&limit=20`;
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SEARCH)}?${baseParams}`;
      
      console.log('Business Search URL:', url);
      
      const data: SearchResponse = await fetchWithJsonValidation(url);
      console.log('Business Search API response:', data);

      if (data.success && data.data && data.data.results) {
        const businesses = data.data.results.businesses?.data || [];
        setSearchResults(businesses);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching businesses:', error);
      setSearchResults([]);
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
      setAddingBusinesses(true);
      
      // Add businesses to collection one by one
      const promises = Array.from(selectedBusinesses).map(async (businessId) => {
        return addBusinessToCollection(collectionId, { business_id: businessId });
      });
      
      const results = await Promise.all(promises);
      
      // Check if all additions were successful
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);
      
      if (successful.length > 0) {
        // Use the API message from the first successful response
        const apiMessage = successful[0]?.message || 'Successfully added to collection';
        const successMessage = successful.length === selectedBusinesses.size
          ? `✅ ${apiMessage}`
          : `✅ Added ${successful.length} of ${selectedBusinesses.size} businesses. ${failed.length} failed.`;
        
        onSuccess(successMessage);
        
        // Reset modal state and close immediately
        setSelectedBusinesses(new Set());
        setSearchQuery('');
        setSearchResults([]);
        
        // Close modal immediately - let parent handle refresh
        onClose();
      } else {
        // All failed - show error toast and keep modal open
        const apiErrorMessage = failed[0]?.message || 'Failed to add businesses to collection';
        showToastError(apiErrorMessage);
        
        // Also notify parent for any additional handling if needed
        onError(`❌ ${apiErrorMessage}`);
      }
    } catch (error) {
      console.error('Error adding businesses:', error);
      const errorMessage = 'Failed to add businesses. Please try again.';
      showToastError(errorMessage);
      onError(`❌ ${errorMessage}`);
    } finally {
      setAddingBusinesses(false);
    }
  };

  const renderBusinessItem = ({ item }: { item: Business }) => {
    const isSelected = selectedBusinesses.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.businessItem,
          { 
            backgroundColor: isSelected 
              ? colors.buttonPrimary + '10' 
              : 'transparent',
          }
        ]}
        onPress={() => handleBusinessToggle(item.id)}
      >
        <SmartImage
          source={item.logo_image}
          type="business"
          style={styles.businessImage}
          fallbackIcon="storefront-outline"
          showInitials={true}
          initialsText={item.business_name}
        />
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.business_name}
          </Text>
          
          {(item.category_name || item.category?.name) && (
            <Text style={[styles.categoryText, { color: colors.icon }]} numberOfLines={1}>
              {item.category_name || item.category?.name}
            </Text>
          )}
          
          <Text style={[styles.addressText, { color: colors.icon }]} numberOfLines={1}>
            {item.full_address || item.landmark || 'Address not available'}
          </Text>
          
          {item.overall_rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {parseFloat(item.overall_rating).toFixed(1)}
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
        {searchQuery ? 'No Businesses Found' : 'Search for Businesses'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        {searchQuery 
          ? `No businesses found for "${searchQuery}". Try different keywords or check spelling.`
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
            disabled={selectedBusinesses.size === 0 || addingBusinesses}
            style={[
              styles.addButton,
              {
                backgroundColor: selectedBusinesses.size > 0 ? colors.buttonPrimary : colors.border,
              }
            ]}
          >
            {addingBusinesses ? (
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
            {loading && searchQuery.length >= 2 ? (
              <ActivityIndicator size="small" color={colors.buttonPrimary} />
            ) : searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Results List */}
        <View style={styles.content}>
          {loading ? (
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
      
      {/* Toast */}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
      />
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
    borderRadius: 16,
    marginBottom: 12,
  },
  businessImage: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 30,

  },
  businessInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  categoryText: {
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '400',
    opacity: 0.7,
  },
  addressText: {
    fontSize: 12,
    marginBottom: 6,
    opacity: 0.6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
