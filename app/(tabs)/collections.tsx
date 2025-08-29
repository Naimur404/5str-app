import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import CollectionCard from '@/components/CollectionCard';
import CollectionSkeleton from '@/components/CollectionSkeleton';
import EditCollectionModal from '@/components/EditCollectionModal';
import CreateCollectionModal from '@/components/CreateCollectionModal';
import {
  getUserCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  followCollection,
  unfollowCollection,
  isAuthenticated,
  getPopularCollections,
} from '@/services/api';
import {
  Collection,
  CreateCollectionRequest,
  CollectionsResponse,
  PopularCollectionsResponse,
} from '@/types/api';

export default function CollectionsScreen() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [popularCollections, setPopularCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'popular'>('my');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { alertConfig, showError, showSuccess, showConfirm, hideAlert } = useCustomAlert();

  useEffect(() => {
    checkAuthAndLoadCollections();
    loadPopularCollections(); // Load popular collections regardless of auth
  }, []);

  useEffect(() => {
    filterCollections();
  }, [searchQuery, collections, popularCollections, activeTab]);

  const checkAuthAndLoadCollections = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);

      if (authenticated) {
        await loadCollections();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response: CollectionsResponse = await getUserCollections();
      
      if (response.success) {
        setCollections(response.data.collections);
      } else {
        showError('❌ Loading Failed', 'Failed to load your collections. Please try again.');
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      showError('❌ Network Error', 'Failed to load collections. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularCollections = async () => {
    try {
      setPopularLoading(true);
      const response: PopularCollectionsResponse = await getPopularCollections();
      
      if (response.success) {
        setPopularCollections(response.data.collections);
      } else {
        showError('❌ Failed to Load Popular Collections', 'Unable to fetch popular collections. Please try again.');
      }
    } catch (error) {
      console.error('Error loading popular collections:', error);
      showError('❌ Network Error', 'Failed to load popular collections. Please check your connection and try again.');
    } finally {
      setPopularLoading(false);
    }
  };

  const filterCollections = () => {
    if (!searchQuery.trim()) {
      setFilteredCollections(activeTab === 'my' ? collections : popularCollections);
      return;
    }

    const collectionsToFilter = activeTab === 'my' ? collections : popularCollections;
    
    const filtered = collectionsToFilter?.filter(collection =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
    
    setFilteredCollections(filtered);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Always refresh popular collections
      await loadPopularCollections();
      
      // Refresh user collections if authenticated
      if (isUserAuthenticated) {
        await loadCollections();
      }
    } finally {
      setRefreshing(false);
    }
  }, [isUserAuthenticated]);

  const handleCreateCollection = async (data: CreateCollectionRequest) => {
    try {
      const response = await createCollection(data);
      
      if (response.success) {
        setCollections(prev => [response.data.collection, ...prev]);
        showSuccess(
          '🎉 Collection Created Successfully!', 
          `Your "${response.data.collection.name}" collection is ready. Start adding your favorite businesses!`,
          [{ text: 'OK', style: 'default' }]
        );
        
        // Auto dismiss after 4 seconds for success messages
        setTimeout(() => {
          hideAlert();
        }, 4000);
      } else {
        throw new Error('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleFollowCollection = async (collectionId: number) => {
    try {
      const response = await followCollection(collectionId);
      
      if (response.success) {
        const updatedCollection = popularCollections.find(c => c.id === collectionId);
        setPopularCollections(prev => 
          prev.map(collection => 
            collection.id === collectionId 
              ? { ...collection, is_following: true, followers_count: collection.followers_count + 1 }
              : collection
          )
        );
        showSuccess(
          '🔔 Now Following!', 
          `You will now receive updates from "${updatedCollection?.name || 'this'}" collection.`,
          [{ text: 'OK', style: 'default' }]
        );
        
        // Auto dismiss success message
        setTimeout(() => {
          hideAlert();
        }, 3000);
      } else if (response.status === 409) {
        // Already following - show this as success
        const updatedCollection = popularCollections.find(c => c.id === collectionId);
        setPopularCollections(prev => 
          prev.map(collection => 
            collection.id === collectionId 
              ? { ...collection, is_following: true }
              : collection
          )
        );
        showSuccess(
          '✅ Already Following!', 
          response.message || `You are already following "${updatedCollection?.name || 'this'}" collection.`,
          [{ text: 'OK', style: 'default' }]
        );
        
        // Auto dismiss success message
        setTimeout(() => {
          hideAlert();
        }, 3000);
      } else {
        showError('❌ Follow Failed', response.message || 'Failed to follow collection. Please try again.');
      }
    } catch (error) {
      console.error('Error following collection:', error);
      showError('❌ Follow Failed', 'Failed to follow collection. Please check your connection and try again.');
    }
  };

  const handleUnfollowCollection = async (collectionId: number) => {
    try {
      const response = await unfollowCollection(collectionId);
      
      if (response.success) {
        const unfollowedCollection = popularCollections.find(c => c.id === collectionId);
        setPopularCollections(prev => 
          prev.map(collection => 
            collection.id === collectionId 
              ? { ...collection, is_following: false, followers_count: Math.max(0, collection.followers_count - 1) }
              : collection
          )
        );
        showSuccess(
          '✅ Unfollowed Successfully', 
          `You will no longer receive updates from "${unfollowedCollection?.name || 'this'}" collection.`,
          [{ text: 'OK', style: 'default' }]
        );
        
        // Auto dismiss success message
        setTimeout(() => {
          hideAlert();
        }, 3000);
      } else if (response.status === 409) {
        // Already unfollowed - show this as success
        const unfollowedCollection = popularCollections.find(c => c.id === collectionId);
        setPopularCollections(prev => 
          prev.map(collection => 
            collection.id === collectionId 
              ? { ...collection, is_following: false }
              : collection
          )
        );
        showSuccess(
          '✅ Already Unfollowed!', 
          response.message || `You are not following "${unfollowedCollection?.name || 'this'}" collection.`,
          [{ text: 'OK', style: 'default' }]
        );
        
        // Auto dismiss success message
        setTimeout(() => {
          hideAlert();
        }, 3000);
      } else {
        showError('❌ Unfollow Failed', response.message || 'Failed to unfollow collection. Please try again.');
      }
    } catch (error) {
      console.error('Error unfollowing collection:', error);
      showError('❌ Unfollow Failed', 'Failed to unfollow collection. Please check your connection and try again.');
    }
  };

  const handleCollectionPress = (collection: Collection) => {
    router.push(`/collection/${collection.id}` as any);
  };

  const handleLoginPress = () => {
    router.push('/auth/login' as any);
  };

  const handleEditCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowEditModal(true);
  };

  const handleDeleteCollection = async (collection: Collection) => {
    try {
      showConfirm(
        'Delete Collection',
        `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
        async () => {
          try {
            console.log('Attempting to delete collection:', collection.id, collection.name);
            const response = await deleteCollection(collection.id);
            console.log('Delete response:', response);
            
            if (response.success) {
              // Update the UI immediately
              setCollections(prev => prev.filter(c => c.id !== collection.id));
              
              // Show success message with auto-dismiss
              showSuccess(
                '🗑️ Collection Deleted',
                `"${collection.name}" has been successfully deleted.`,
                [{ text: 'OK', style: 'default' }]
              );
              
              // Auto dismiss after 3 seconds
              setTimeout(() => {
                hideAlert();
              }, 3000);
              
            } else {
              console.error('Delete failed - API returned success: false');
              showError(
                '❌ Delete Failed', 
                'Failed to delete collection. Please try again.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          } catch (error) {
            console.error('Error deleting collection:', error);
            showError(
              '❌ Network Error', 
              'Failed to delete collection. Please check your connection and try again.',
              [{ text: 'OK', style: 'default' }]
            );
          }
        },
        () => {
          console.log('Delete cancelled by user');
        }
      );
    } catch (error) {
      console.error('Error with delete confirmation:', error);
    }
  };

  const handleEditSuccess = (message: string, updatedCollection?: Collection) => {
    if (updatedCollection) {
      setCollections(prev => 
        prev.map(c => c.id === updatedCollection.id ? updatedCollection : c)
      );
    }
    showSuccess(
      '✅ Success', 
      message,
      [{ text: 'OK', style: 'default' }]
    );
    
    // Auto dismiss success message
    setTimeout(() => {
      hideAlert();
    }, 3000);
  };

  const handleEditError = (message: string) => {
    showError(
      '❌ Error', 
      message,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleCollectionDeleted = () => {
    if (selectedCollection) {
      setCollections(prev => prev.filter(c => c.id !== selectedCollection.id));
    }
    setShowEditModal(false);
    setSelectedCollection(null);
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <CollectionCard
      collection={item}
      onPress={() => handleCollectionPress(item)}
      onFollow={() => handleFollowCollection(item.id)}
      onUnfollow={() => handleUnfollowCollection(item.id)}
      onEdit={() => handleEditCollection(item)}
      showFollowButton={activeTab === 'popular'}
      showOwner={false}
      showActions={activeTab === 'my'}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.buttonPrimary + '20' }]}>
        <Ionicons name="albums-outline" size={48} color={colors.buttonPrimary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No Collections Found' : 'No Collections Yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Create your first collection to organize your favorite businesses'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.buttonText} />
          <Text style={[styles.createButtonText, { color: colors.buttonText }]}>
            Create Collection
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoginPrompt = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.buttonPrimary + '20' }]}>
        <Ionicons name="log-in-outline" size={48} color={colors.buttonPrimary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Sign In Required
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        Sign in to create and manage your collections
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.buttonPrimary }]}
        onPress={handleLoginPress}
      >
        <Ionicons name="log-in" size={20} color={colors.buttonText} />
        <Text style={[styles.createButtonText, { color: colors.buttonText }]}>
          Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="albums" size={32} color="white" style={styles.headerIcon} />
              <View>
                <Text style={styles.headerTitle}>My Collections</Text>
                <Text style={styles.headerSubtitle}>Loading your collections...</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Loading Skeleton */}
        <CollectionSkeleton variant="card" count={3} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="albums" size={32} color="white" style={styles.headerIcon} />
            <View style={styles.titleInfo}>
              <Text style={styles.headerTitle}>
                {activeTab === 'my' ? 'My Collections' : 'Popular Collections'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'my' 
                  ? (isUserAuthenticated 
                      ? `${collections.length} collection${collections.length !== 1 ? 's' : ''}`
                      : 'Login to view your collections'
                    )
                  : `${popularCollections.length} popular collection${popularCollections.length !== 1 ? 's' : ''}`
                }
              </Text>
            </View>
          </View>
          {isUserAuthenticated && activeTab === 'my' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Search ${activeTab === 'my' ? 'your' : 'popular'} collections...`}
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my' && styles.activeTab,
            activeTab === 'my' && { borderBottomColor: colors.tint }
          ]}
          onPress={() => {
            setActiveTab('my');
            setSearchQuery('');
          }}
        >
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={activeTab === 'my' ? colors.tint : colors.icon} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'my' ? colors.tint : colors.text }
          ]}>
            My Collections
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'popular' && styles.activeTab,
            activeTab === 'popular' && { borderBottomColor: colors.tint }
          ]}
          onPress={() => {
            setActiveTab('popular');
            setSearchQuery('');
          }}
        >
          <Ionicons 
            name="trending-up-outline" 
            size={20} 
            color={activeTab === 'popular' ? colors.tint : colors.icon} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'popular' ? colors.tint : colors.text }
          ]}>
            Popular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'my' ? (
          // My Collections Tab
          isUserAuthenticated === false ? (
            renderLoginPrompt()
          ) : loading ? (
            <CollectionSkeleton variant="card" count={3} />
          ) : filteredCollections.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredCollections}
              renderItem={renderCollection}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.tint}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )
        ) : (
          // Popular Collections Tab
          popularLoading ? (
            <CollectionSkeleton variant="card" count={4} />
          ) : filteredCollections.length === 0 && searchQuery ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="search-outline" size={40} color={colors.tint} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Results Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text }]}>
                No popular collections match your search "{searchQuery}".
              </Text>
            </View>
          ) : popularCollections.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="trending-up-outline" size={40} color={colors.tint} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Popular Collections
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text }]}>
                There are no popular collections available at the moment.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCollections}
              renderItem={renderCollection}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.tint}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )
        )}
      </View>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCollection}
      />

      {/* Edit Collection Modal */}
      {selectedCollection && (
        <EditCollectionModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCollection(null);
          }}
          collection={selectedCollection}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
          onDelete={handleCollectionDeleted}
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
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 165,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    opacity: 0.9,
  },
  titleInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 16,
  },
});
