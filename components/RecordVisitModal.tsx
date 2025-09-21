import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAttractionInteraction } from '@/hooks/useAttractionInteraction';
import { VisitCompanionType } from '@/types/api';

interface RecordVisitModalProps {
  visible: boolean;
  onClose: () => void;
  attractionId: number;
  attractionName: string;
}

const companionOptions: { type: VisitCompanionType; label: string; icon: string }[] = [
  { type: 'solo', label: 'Solo', icon: 'person' },
  { type: 'partner', label: 'Partner', icon: 'heart' },
  { type: 'friend', label: 'Friend', icon: 'people' },
  { type: 'family', label: 'Family', icon: 'home' },
  { type: 'group', label: 'Group', icon: 'people-circle' },
  { type: 'business', label: 'Business', icon: 'business' },
];

const weatherOptions = [
  { value: 'sunny', label: 'Sunny', icon: 'sunny' },
  { value: 'cloudy', label: 'Cloudy', icon: 'cloudy' },
  { value: 'rainy', label: 'Rainy', icon: 'rainy' },
  { value: 'stormy', label: 'Stormy', icon: 'thunderstorm' },
  { value: 'snowy', label: 'Snowy', icon: 'snow' },
];

export const RecordVisitModal: React.FC<RecordVisitModalProps> = ({
  visible,
  onClose,
  attractionId,
  attractionName,
}) => {
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [companions, setCompanions] = useState<VisitCompanionType[]>([]);
  const [weather, setWeather] = useState('');

  const { recordVisit, loading } = useAttractionInteraction(attractionId);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const handleCompanionToggle = (companionType: VisitCompanionType) => {
    setCompanions(prev => 
      prev.includes(companionType)
        ? prev.filter(c => c !== companionType)
        : [...prev, companionType]
    );
  };

  const handleSubmit = async () => {
    if (!visitDate) {
      Alert.alert('Error', 'Please select a visit date');
      return;
    }

    try {
      await recordVisit(
        visitDate,
        rating,
        notes || undefined,
        durationMinutes ? parseInt(durationMinutes) : undefined,
        companions.length > 0 ? companions : undefined,
        weather || undefined
      );
      
      // Reset form
      setVisitDate(new Date().toISOString().split('T')[0]);
      setRating(5);
      setNotes('');
      setDurationMinutes('');
      setCompanions([]);
      setWeather('');
      
      onClose();
    } catch (error) {
      console.error('Error recording visit:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Record Visit</ThemedText>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, { backgroundColor: primaryColor }]}
            disabled={loading}
          >
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.attractionName}>{attractionName}</ThemedText>

          {/* Visit Date */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Visit Date *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={borderColor}
            />
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Rating *</ThemedText>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.star}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#FFD700' : borderColor}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Duration (minutes)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="e.g., 120"
              placeholderTextColor={borderColor}
              keyboardType="numeric"
            />
          </View>

          {/* Companions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Companions</ThemedText>
            <View style={styles.optionsContainer}>
              {companionOptions.map(option => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.optionButton,
                    { borderColor },
                    companions.includes(option.type) && { 
                      backgroundColor: primaryColor,
                      borderColor: primaryColor 
                    }
                  ]}
                  onPress={() => handleCompanionToggle(option.type)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={companions.includes(option.type) ? 'white' : textColor}
                  />
                  <ThemedText
                    style={[
                      styles.optionText,
                      companions.includes(option.type) && { color: 'white' }
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weather */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Weather</ThemedText>
            <View style={styles.optionsContainer}>
              {weatherOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { borderColor },
                    weather === option.value && { 
                      backgroundColor: primaryColor,
                      borderColor: primaryColor 
                    }
                  ]}
                  onPress={() => setWeather(weather === option.value ? '' : option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={weather === option.value ? 'white' : textColor}
                  />
                  <ThemedText
                    style={[
                      styles.optionText,
                      weather === option.value && { color: 'white' }
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor, color: textColor }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Share your experience..."
              placeholderTextColor={borderColor}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </ThemedView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  attractionName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
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
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    padding: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    gap: 4,
  },
  optionText: {
    fontSize: 14,
  },
});