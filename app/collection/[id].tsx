import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import CollectionSkeleton from '@/components/CollectionSkeleton';
import EditCollectionModal from '@/components/EditCollectionModal';
import ManageBusinessModal from '@/components/ManageBusinessModal';
import ProfileAvatar from '@/components/ProfileAvatar';
import SmartImage from '@/components/SmartImage';
import {
  getCollectionDetails,
  followCollection,
  unfollowCollection,
  deleteCollection,
  removeBusinessFromCollection,
  isAuthenticated,
} from '@/services/api';
import { Collection, CollectionBusiness } from '@/types/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

export default function CollectionDetailsScreen() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageBusinessModal, setShowManageBusinessModal] = useState(false);

  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams();
  const collectionId = parseInt(params.id as string);
  const { alertConfig, showSuccess, showError, showConfirm, hideAlert } = useCustomAlert();

  useEffect(() => {
    if (collectionId) {
      checkAuthAndLoadCollection();
    }
  }, [collectionId]);

  const checkAuthAndLoadCollection = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      await loadCollection();
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
      setLoading(false);
    }
  };

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await getCollectionDetails(collectionId);
      
      if (response.success) {
        console.log('Collection data:', JSON.stringify(response.data.collection, null, 2));
        console.log('Businesses array:', response.data.collection.businesses);
        setCollection(response.data.collection);
      } else {
        showError('Collection not found', 'This collection may have been deleted or is private.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      showError('Failed to load collection', 'Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCollection();
    } finally {
      setRefreshing(false);
    }
  }, [collectionId]);

  const handleFollowToggle = async () => {
    if (!collection || !isUserAuthenticated) return;

    try {
      const response = collection.is_following 
        ? await unfollowCollection(collection.id)
        : await followCollection(collection.id);
      
      if (response.success) {
        setCollection(prev => prev ? {
          ...prev,
          is_following: !prev.is_following,
          followers_count: prev.is_following 
            ? Math.max(0, prev.followers_count - 1)
            : prev.followers_count + 1
        } : null);
        
        showSuccess(
          collection.is_following ? '✅ Successfully Unfollowed' : '🔔 Now Following',
          collection.is_following 
            ? `You will no longer get updates from "${collection.name}" collection.`
            : `You will now receive updates from "${collection.name}" collection!`
        );
        
        // Auto dismiss success message
        setTimeout(() => {
          hideAlert();
        }, 3000);
      } else if (response.status === 409) {
        // Handle 409 responses (already following/unfollowing)
        const isCurrentlyFollowing = collection.is_following;
        setCollection(prev => prev ? {
          ...prev,
          is_following: !isCurrentlyFollowing
        } : null);
        
        showSuccess(
          isCurrentlyFollowing ? '✅ Already Unfollowed!' : '✅ Already Following!',
          response.message || (isCurrentlyFollowing 
            ? `You are not following "${collection.name}" collection.`
            : `You are already following "${collection.name}" collection.`)
        );
        
        // Auto dismiss success message
        setTimeout(() => {
          hideAlert();
        }, 3000);
      } else {
        showError('❌ Action Failed', response.message || 'Failed to update follow status. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showError('❌ Action Failed', 'Network error. Please check your connection and try again.');
    }
  };

  const handleDeleteCollection = () => {
    if (!collection || collection?.can_edit === false) return;

    showConfirm(
      'Delete Collection',
      'Are you sure you want to delete this collection? This action cannot be undone.',
      async () => {
        try {
          const response = await deleteCollection(collection.id);
          if (response.success) {
            showSuccess(
              '🗑️ Collection Deleted Successfully', 
              'Your collection has been successfully deleted.'
            );
            
            // Auto dismiss and go back
            setTimeout(() => {
              hideAlert();
              router.back();
            }, 2000);
          } else {
            showError('❌ Delete Failed', response.message || 'Failed to delete collection. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting collection:', error);
          showError('❌ Delete Failed', 'Failed to delete collection. Please try again.');
        }
      }
    );
  };

  const handleEditCollection = (message: string, updatedCollection?: Collection) => {
    if (updatedCollection) {
      setCollection(updatedCollection);
    }
    showSuccess('Success', message);
  };

  const handleEditError = (message: string) => {
    showError('Error', message);
  };

  const handleCollectionDeleted = () => {
    router.back();
  };

  const handleManageBusinessSuccess = (message: string) => {
    showSuccess('Success', message);
    loadCollection(); // Reload to show new businesses
  };

  const handleManageBusinessError = (message: string) => {
    showError('Error', message);
  };

  const handleRemoveBusiness = (businessId: number) => {
    if (!collection || collection?.can_edit === false) return;

    const businessToRemove = collection.businesses?.find(b => b.id === businessId);
    const businessName = businessToRemove?.name || 'this business';

    showConfirm(
      'Remove Business',
      `Are you sure you want to remove "${businessName}" from "${collection.name}" collection?`,
      async () => {
        try {
          const removedBusiness = collection.businesses?.find(b => b.id === businessId);
          const response = await removeBusinessFromCollection(collection.id, businessId);
          if (response.success) {
            setCollection(prev => prev ? {
              ...prev,
              businesses: prev.businesses?.filter(b => b.id !== businessId) || [],
              businesses_count: Math.max(0, prev.businesses_count - 1)
            } : null);
            showSuccess(
              '✅ Business Removed Successfully', 
              `"${removedBusiness?.name || 'Business'}" has been removed from "${collection.name}" collection.`
            );
          } else {
            showError('❌ Remove Failed', 'Failed to remove business from collection. Please try again.');
          }
        } catch (error) {
          console.error('Error removing business:', error);
          showError('❌ Remove Failed', 'Failed to remove business. Please check your connection and try again.');
        }
      }
    );
  };

  const handleBusinessPress = (business: any) => {
    router.push(`/business/${business.id}` as any);
  };

  const renderBusiness = ({ item }: { item: any }) => {
    console.log('Rendering business item:', JSON.stringify(item, null, 2));
    console.log('Address fields - landmark:', item.landmark, 'address:', item.address, 'location:', item.location, 'full_address:', item.full_address);
    
    return (
      <TouchableOpacity
        style={[styles.businessCard, { backgroundColor: colors.card }]}
        onPress={() => handleBusinessPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.businessImageContainer}>
          <SmartImage
            source={item.logo_image || item.image_url}
            type="business"
            style={styles.businessImage}
          />
        </View>
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={2}>
            {item.business_name || item.name}
          </Text>
          
          {item.category_name && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
              <Text style={[styles.categoryText, { color: colors.buttonPrimary }]} numberOfLines={1}>
                {item.category_name}
              </Text>
            </View>
          )}
          
          {(item.landmark || item.address || item.location || item.full_address) && (
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={14} color={colors.icon} style={{ marginRight: 4 }} />
              <Text style={[styles.businessAddress, { color: colors.icon, flex: 1 }]} numberOfLines={2}>
                {(() => {
                  const addressParts = [];
                  if (item.landmark) addressParts.push(item.landmark);
                  if (item.address && item.address !== item.landmark) addressParts.push(item.address);
                  if (item.location && !addressParts.includes(item.location)) addressParts.push(item.location);
                  if (item.full_address && !addressParts.some(part => item.full_address.includes(part))) {
                    addressParts.push(item.full_address);
                  }
                  return addressParts.join(', ') || item.address || item.location || item.full_address;
                })()}
              </Text>
            </View>
          )}

          {item.phone && (
            <View style={styles.phoneContainer}>
              <Ionicons name="call-outline" size={14} color={colors.icon} style={{ marginRight: 4 }} />
              <Text style={[styles.businessPhone, { color: colors.text }]} numberOfLines={1}>
                {item.phone}
              </Text>
            </View>
          )}
          
          {(item.overall_rating || item.rating) && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>
                {parseFloat(item.overall_rating || item.rating).toFixed(1)} stars
              </Text>
            </View>
          )}

          {item.price_range && (
            <View style={styles.priceContainer}>
              <Ionicons name="card-outline" size={14} color={colors.icon} style={{ marginRight: 4 }} />
              <Text style={[styles.priceText, { color: colors.buttonPrimary }]}>
                {'$'.repeat(item.price_range)}
              </Text>
            </View>
          )}
          
          {item.notes && (
            <View style={[styles.notesContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="chatbubble-outline" size={12} color={colors.icon} style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={[styles.businessNotes, { color: colors.text, flex: 1 }]} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>

        {(collection?.can_edit !== false) && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: '#FF5722' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveBusiness(item.id);
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={80} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Businesses Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        {collection?.can_edit !== false
          ? 'Start adding businesses to your collection'
          : 'This collection is empty'
        }
      </Text>
      {collection?.can_edit !== false && (
        <TouchableOpacity
          style={[styles.addBusinessButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => setShowManageBusinessModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.buttonText} />
          <Text style={[styles.addBusinessButtonText, { color: colors.buttonText }]}>
            Add Businesses
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading || !collection) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection</Text>
          <View style={styles.headerRight} />
        </LinearGradient>

        {/* Loading State */}
        <CollectionSkeleton variant="detail" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {collection.name}
        </Text>
        <View style={styles.headerRight}>
          {collection?.can_edit !== false && (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowEditModal(true)}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDeleteCollection}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {/* Collection Info */}
        <View style={[styles.collectionInfo, { backgroundColor: colors.card }]}>
          {/* Cover Image */}
          {collection.cover_image && (
            <Image
              source={{ uri: collection.cover_image }}
              style={styles.coverImage}
            />
          )}
          
          {/* Title and Description */}
          <View style={styles.collectionHeader}>
            <View style={styles.titleRow}>
              <Text style={[styles.collectionTitle, { color: colors.text }]}>
                {collection.name}
              </Text>
              {!collection.is_public && (
                <Ionicons name="lock-closed" size={20} color={colors.icon} />
              )}
            </View>
            
            {collection.description && (
              <Text style={[styles.collectionDescription, { color: colors.icon }]}>
                {collection.description}
              </Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="business" size={16} color={colors.icon} />
              <Text style={[styles.statText, { color: colors.icon }]}>
                {collection.businesses_count} businesses
              </Text>
            </View>
            
            {collection.is_public && (
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color={colors.icon} />
                <Text style={[styles.statText, { color: colors.icon }]}>
                  {collection.followers_count} followers
                </Text>
              </View>
            )}
          </View>

          {/* Owner and Actions */}
          <View style={styles.ownerRow}>
            {collection.user && (
              <View style={styles.ownerInfo}>
                <ProfileAvatar
                  profileImage={collection.user.profile_image || null}
                  userName={collection.user.name}
                  size={24}
                  style={styles.ownerAvatar}
                />
                <Text style={[styles.ownerName, { color: colors.text }]}>
                  {collection.user.name}
                </Text>
              </View>
            )}

            {isUserAuthenticated && !collection.can_edit && collection.is_public && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  {
                    backgroundColor: collection.is_following ? colors.border : colors.buttonPrimary,
                  }
                ]}
                onPress={handleFollowToggle}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    {
                      color: collection.is_following ? colors.text : colors.buttonText,
                    }
                  ]}
                >
                  {collection.is_following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Businesses List */}
        <View style={styles.businessesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Businesses ({collection.businesses_count || collection.businesses?.length || 0})
          </Text>
          
          {collection.businesses && collection.businesses.length > 0 ? (
            <FlatList
              data={collection.businesses}
              renderItem={renderBusiness}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      {collection?.can_edit !== false && collection.businesses && collection.businesses.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => setShowManageBusinessModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.buttonText} />
        </TouchableOpacity>
      )}

      {/* Edit Collection Modal */}
      {collection && (
        <EditCollectionModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          collection={collection}
          onSuccess={handleEditCollection}
          onError={handleEditError}
          onDelete={handleCollectionDeleted}
        />
      )}

      {/* Manage Business Modal */}
      {collection && (
        <ManageBusinessModal
          visible={showManageBusinessModal}
          onClose={() => setShowManageBusinessModal(false)}
          collectionId={collection.id}
          collectionName={collection.name}
          onSuccess={handleManageBusinessSuccess}
          onError={handleManageBusinessError}
        />
      )}

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
    </View>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  loadingSkeleton: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    opacity: 0.7,
  },
  collectionInfo: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 120,
  },
  collectionHeader: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  collectionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 14,
    marginLeft: 6,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerAvatar: {
    marginRight: 8,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  businessesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  businessCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: 120,
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  businessImageContainer: {
    marginRight: 16,
    alignSelf: 'flex-start',
  },
  businessInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  businessAddress: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 17,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  businessPhone: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  businessNotes: {
    fontSize: 14,
    marginTop: 0,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    padding: 8,
    borderRadius: 6,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addBusinessButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
