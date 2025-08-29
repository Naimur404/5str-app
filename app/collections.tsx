import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
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
import CreateCollectionModal from '@/components/CreateCollectionModal';
import {
  getUserCollections,
  createCollection,
  followCollection,
  unfollowCollection,
  isAuthenticated,
} from '@/services/api';
import { Collection, CreateCollectionRequest } from '@/types/api';

export default function CollectionsScreen() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);

  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { alertConfig, showSuccess, showError, hideAlert } = useCustomAlert();

  useEffect(() => {
    checkAuthAndLoadCollections();
  }, []);

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
      const response = await getUserCollections();
      
      if (response.success) {
        setCollections(response.data.collections);
      } else {
        showError('Failed to load collections', 'Please try again.');
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      showError('Failed to load collections', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!isUserAuthenticated) return;
    
    setRefreshing(true);
    try {
      await loadCollections();
    } finally {
      setRefreshing(false);
    }
  }, [isUserAuthenticated]);

  const handleCreateCollection = async (data: CreateCollectionRequest) => {
    try {
      const response = await createCollection(data);
      
      if (response.success) {
        setCollections(prev => [response.data.collection, ...prev]);
        showSuccess('Collection created successfully!', 'You can now start adding businesses to your collection.');
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
        setCollections(prev => 
          prev.map(collection => 
            collection.id === collectionId 
              ? { ...collection, is_followed_by_user: true, followers_count: collection.followers_count + 1 }
              : collection
          )
        );
      }
    } catch (error) {
      console.error('Error following collection:', error);
      showError('Failed to follow collection', 'Please try again.');
    }
  };

  const handleUnfollowCollection = async (collectionId: number) => {
    try {
      const response = await unfollowCollection(collectionId);
      
      if (response.success) {
        setCollections(prev => 
          prev.map(collection => 
            collection.id === collectionId 
              ? { ...collection, is_followed_by_user: false, followers_count: Math.max(0, collection.followers_count - 1) }
              : collection
          )
        );
      }
    } catch (error) {
      console.error('Error unfollowing collection:', error);
      showError('Failed to unfollow collection', 'Please try again.');
    }
  };

  const handleCollectionPress = (collection: Collection) => {
    router.push(`/collection/${collection.id}` as any);
  };

  const handleLoginPress = () => {
    router.push('/auth/login' as any);
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <CollectionCard
      collection={item}
      onPress={() => handleCollectionPress(item)}
      onFollow={() => handleFollowCollection(item.id)}
      onUnfollow={() => handleUnfollowCollection(item.id)}
      showFollowButton={false}
      showOwner={false}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={80} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Collections Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        Create your first collection to organize your favorite businesses
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.buttonPrimary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color={colors.buttonText} />
        <Text style={[styles.createButtonText, { color: colors.buttonText }]}>
          Create Collection
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginPrompt = () => (
    <View style={styles.emptyState}>
      <Ionicons name="lock-closed-outline" size={80} color={colors.icon} />
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
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>My Collections</Text>
        </LinearGradient>

        {/* Loading Skeleton */}
        <View style={styles.content}>
          <View style={[styles.loadingSkeleton, { backgroundColor: colors.card }]} />
          <View style={[styles.loadingSkeleton, { backgroundColor: colors.card }]} />
          <View style={[styles.loadingSkeleton, { backgroundColor: colors.card }]} />
        </View>
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
        <Text style={styles.headerTitle}>My Collections</Text>
        {isUserAuthenticated && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {isUserAuthenticated === false ? (
          renderLoginPrompt()
        ) : collections.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={collections}
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
        )}
      </View>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCollection}
      />

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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
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
  loadingSkeleton: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    opacity: 0.7,
  },
});
