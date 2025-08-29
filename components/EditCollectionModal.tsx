import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Collection, UpdateCollectionRequest } from '@/types/api';
import { updateCollection, deleteCollection } from '@/services/api';

interface EditCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  collection: Collection;
  onSuccess: (message: string, updatedCollection?: Collection) => void;
  onError: (message: string) => void;
  onDelete: () => void;
}

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  visible,
  onClose,
  collection,
  onSuccess,
  onError,
  onDelete,
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (visible && collection) {
      setName(collection.name || '');
      setDescription(collection.description || '');
      setIsPublic(collection.is_public || false);
    }
  }, [visible, collection]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      onError('❌ Collection name is required');
      return;
    }

    try {
      setLoading(true);
      const updateData: UpdateCollectionRequest = {
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
      };

      const response = await updateCollection(collection.id, updateData);
      
      if (response.success) {
        onSuccess('✅ Collection updated successfully!', response.data.collection);
        onClose();
      } else {
        onError('❌ Failed to update collection. Please try again.');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      onError('❌ Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await deleteCollection(collection.id);
      
      if (response.success) {
        onSuccess(`🗑️ Successfully deleted "${collection.name}" collection`);
        onDelete();
        onClose();
      } else {
        onError('❌ Failed to delete collection. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      onError('❌ Network error. Please check your connection and try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setName(collection?.name || '');
    setDescription(collection?.description || '');
    setIsPublic(collection?.is_public || false);
  };

  const hasChanges = () => {
    return (
      name.trim() !== (collection?.name || '') ||
      description.trim() !== (collection?.description || '') ||
      isPublic !== (collection?.is_public || false)
    );
  };

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
            Edit Collection
          </Text>
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={!hasChanges() || loading || !name.trim()}
            style={[
              styles.saveButton,
              {
                backgroundColor: hasChanges() && name.trim() ? colors.buttonPrimary : colors.border,
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Collection Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Collection Name *
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
              value={name}
              onChangeText={setName}
              placeholder="Enter collection name"
              placeholderTextColor={colors.icon}
              maxLength={100}
            />
            <Text style={[styles.characterCount, { color: colors.icon }]}>
              {name.length}/100
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your collection (optional)"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.characterCount, { color: colors.icon }]}>
              {description.length}/500
            </Text>
          </View>

          {/* Privacy Setting */}
          <View style={styles.section}>
            <View style={styles.privacyContainer}>
              <View style={styles.privacyInfo}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Public Collection
                </Text>
                <Text style={[styles.privacyDescription, { color: colors.icon }]}>
                  {isPublic 
                    ? 'Anyone can view and follow this collection'
                    : 'Only you can view this collection'
                  }
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.border, true: colors.buttonPrimary + '40' }}
                thumbColor={isPublic ? colors.buttonPrimary : colors.icon}
              />
            </View>
          </View>

          {/* Collection Stats */}
          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>
              Collection Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.buttonPrimary }]}>
                  {collection.businesses_count || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>
                  Businesses
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.buttonPrimary }]}>
                  {collection.followers_count || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>
                  Followers
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.buttonPrimary }]}>
                  {collection.created_at ? new Date(collection.created_at).getFullYear() : 'N/A'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>
                  Created
                </Text>
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={[styles.dangerZone, { borderColor: '#FF6B6B20' }]}>
            <Text style={[styles.dangerTitle, { color: '#FF6B6B' }]}>
              Danger Zone
            </Text>
            <Text style={[styles.dangerDescription, { color: colors.icon }]}>
              Once you delete a collection, there is no going back. This will permanently delete the collection and remove all businesses from it.
            </Text>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: '#FF6B6B' }]}
              onPress={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.deleteButtonText, { color: '#FF6B6B' }]}>
                    Delete Collection
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
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
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
    minHeight: 100,
  },
  characterCount: {
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
    marginTop: 2,
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerZone: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FF6B6B05',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditCollectionModal;
