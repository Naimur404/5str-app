import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { FavouritesPageSkeleton } from '@/components/SkeletonLoader';
import { Collection } from '@/types/api';
import {
  getUserCollections,
  addBusinessToCollection,
  createCollection,
} from '@/services/api';

interface AddToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: number;
  businessName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  visible,
  onClose,
  businessId,
  businessName,
  onSuccess,
  onError,
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      loadCollections();
      setNotes('');
      setShowCreateForm(false);
      setNewCollectionName('');
    }
  }, [visible]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await getUserCollections();
      if (response.success) {
        setCollections(response.data.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      onError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: number) => {
    try {
      setActionLoading(collectionId);
      const response = await addBusinessToCollection(collectionId, {
        business_id: businessId,
        notes: notes.trim() || undefined,
      });
      
      if (response.success) {
        onSuccess(`Added ${businessName} to collection!`);
        onClose();
      } else {
        onError('Failed to add business to collection');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      onError('Failed to add business to collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newCollectionName.trim()) return;

    try {
      setActionLoading(0); // Use 0 for create action
      
      // Create collection
      const createResponse = await createCollection({
        name: newCollectionName.trim(),
        description: '',
        is_public: true,
      });
      
      if (createResponse.success) {
        // Add business to the new collection
        const addResponse = await addBusinessToCollection(createResponse.data.collection.id, {
          business_id: businessId,
          notes: notes.trim() || undefined,
        });
        
        if (addResponse.success) {
          onSuccess(`Created collection "${newCollectionName}" and added ${businessName}!`);
          onClose();
        } else {
          onError('Collection created but failed to add business');
        }
      } else {
        onError('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      onError('Failed to create collection');
    } finally {
      setActionLoading(null);
    }
  };

  const renderCollectionItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={[styles.collectionItem, { borderBottomColor: colors.border }]}
      onPress={() => handleAddToCollection(item.id)}
      disabled={actionLoading !== null}
    >
      <View style={styles.collectionInfo}>
        <View style={styles.collectionHeader}>
          <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {!item.is_public && (
            <Ionicons name="lock-closed" size={14} color={colors.icon} />
          )}
        </View>
        
        <Text style={[styles.collectionStats, { color: colors.icon }]}>
          {item.businesses_count} businesses
        </Text>
      </View>

      {actionLoading === item.id ? (
        <ActivityIndicator size="small" color={colors.tint} />
      ) : (
        <Ionicons name="add-circle-outline" size={24} color={colors.tint} />
      )}
    </TouchableOpacity>
  );

  const renderCreateForm = () => (
    <View style={[styles.createForm, { borderTopColor: colors.border }]}>
      <Text style={[styles.createTitle, { color: colors.text }]}>
        Create New Collection
      </Text>
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          }
        ]}
        value={newCollectionName}
        onChangeText={setNewCollectionName}
        placeholder="Collection name"
        placeholderTextColor={colors.icon}
        maxLength={100}
      />
      
      <View style={styles.createActions}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => setShowCreateForm(false)}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: newCollectionName.trim() ? colors.buttonPrimary : colors.border,
            }
          ]}
          onPress={handleCreateAndAdd}
          disabled={!newCollectionName.trim() || actionLoading !== null}
        >
          {actionLoading === 0 ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <Text style={[styles.createButtonText, { color: colors.buttonText }]}>
              Create & Add
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
            Add to Collection
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Business Info */}
        <View style={[styles.businessInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={2}>
            {businessName}
          </Text>
        </View>

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <Text style={[styles.notesLabel, { color: colors.text }]}>
            Add a note (optional)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Why do you like this place?"
            placeholderTextColor={colors.icon}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Collections List */}
        <View style={styles.collectionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Collections
            </Text>
            <TouchableOpacity
              style={styles.newCollectionButton}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Ionicons name="add" size={20} color={colors.tint} />
              <Text style={[styles.newCollectionText, { color: colors.tint }]}>
                New
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <FavouritesPageSkeleton colors={colors} />
          ) : collections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Collections Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                Create your first collection to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={collections}
              renderItem={renderCollectionItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Create Form */}
        {showCreateForm && renderCreateForm()}
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
  headerRight: {
    width: 40,
  },
  businessInfo: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  collectionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  newCollectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newCollectionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  collectionStats: {
    fontSize: 12,
  },
  createForm: {
    padding: 16,
    borderTopWidth: 1,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  createActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddToCollectionModal;
