import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface LocationHeaderProps {
  showChangeButton?: boolean;
  style?: object;
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({ 
  showChangeButton = true, 
  style 
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme || 'light'];
  const { getCurrentLocationInfo, isUpdating } = useLocation();
  
  const locationInfo = getCurrentLocationInfo();

  const handleLocationPress = () => {
    router.push('/location-selection');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.locationInfo}>
        <Ionicons 
          name={locationInfo.isManual ? "location" : "locate"} 
          size={16} 
          color={colors.buttonPrimary} 
        />
        <View style={styles.locationText}>
          <Text style={[styles.locationName, { color: colors.text }]} numberOfLines={1}>
            {locationInfo.name}
          </Text>
          {locationInfo.division && (
            <Text style={[styles.divisionName, { color: colors.icon }]} numberOfLines={1}>
              {locationInfo.division} Division
            </Text>
          )}
        </View>
        {isUpdating && (
          <View style={styles.updatingIndicator}>
            <Ionicons name="refresh" size={14} color={colors.buttonPrimary} />
          </View>
        )}
      </View>
      
      {showChangeButton && (
        <TouchableOpacity 
          style={[styles.changeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLocationPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.changeButtonText, { color: colors.buttonPrimary }]}>
            Change
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  divisionName: {
    fontSize: 12,
    opacity: 0.7,
  },
  updatingIndicator: {
    marginLeft: 4,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default LocationHeader;
