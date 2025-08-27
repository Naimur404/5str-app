import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { Colors } from '@/constants/Colors';

// Bangladesh districts with coordinates
const BANGLADESH_DISTRICTS = [
  { id: 1, name: 'Dhaka', latitude: 23.8103, longitude: 90.4125, division: 'Dhaka' },
  { id: 2, name: 'Chittagong', latitude: 22.3569, longitude: 91.7832, division: 'Chittagong' },
  { id: 3, name: 'Sylhet', latitude: 24.8949, longitude: 91.8687, division: 'Sylhet' },
  { id: 4, name: 'Rajshahi', latitude: 24.3745, longitude: 88.6042, division: 'Rajshahi' },
  { id: 5, name: 'Khulna', latitude: 22.8456, longitude: 89.5403, division: 'Khulna' },
  { id: 6, name: 'Barisal', latitude: 22.7010, longitude: 90.3535, division: 'Barisal' },
  { id: 7, name: 'Rangpur', latitude: 25.7439, longitude: 89.2752, division: 'Rangpur' },
  { id: 8, name: 'Mymensingh', latitude: 24.7471, longitude: 90.4203, division: 'Mymensingh' },
  { id: 9, name: 'Comilla', latitude: 23.4682, longitude: 91.1788, division: 'Chittagong' },
  { id: 10, name: 'Gazipur', latitude: 23.9999, longitude: 90.4203, division: 'Dhaka' },
  { id: 11, name: 'Narayanganj', latitude: 23.6238, longitude: 90.4990, division: 'Dhaka' },
  { id: 12, name: 'Bogra', latitude: 24.8465, longitude: 89.3775, division: 'Rajshahi' },
  { id: 13, name: 'Jessore', latitude: 23.1695, longitude: 89.2134, division: 'Khulna' },
  { id: 14, name: 'Dinajpur', latitude: 25.6217, longitude: 88.6354, division: 'Rangpur' },
  { id: 15, name: 'Kushtia', latitude: 23.9013, longitude: 89.1206, division: 'Khulna' },
  { id: 16, name: 'Pabna', latitude: 24.0064, longitude: 89.2372, division: 'Rajshahi' },
  { id: 17, name: 'Tangail', latitude: 24.2513, longitude: 89.9167, division: 'Dhaka' },
  { id: 18, name: 'Faridpur', latitude: 23.6070, longitude: 89.8429, division: 'Dhaka' },
  { id: 19, name: 'Brahmanbaria', latitude: 23.9571, longitude: 91.1115, division: 'Chittagong' },
  { id: 20, name: 'Noakhali', latitude: 22.8696, longitude: 91.0995, division: 'Chittagong' },
  { id: 21, name: 'Feni', latitude: 23.0159, longitude: 91.3976, division: 'Chittagong' },
  { id: 22, name: 'Lakshmipur', latitude: 22.9447, longitude: 90.8282, division: 'Chittagong' },
  { id: 23, name: 'Cox\'s Bazar', latitude: 21.4272, longitude: 92.0058, division: 'Chittagong' },
  { id: 24, name: 'Rangamati', latitude: 22.6533, longitude: 92.1734, division: 'Chittagong' },
  { id: 25, name: 'Bandarban', latitude: 22.1953, longitude: 92.2183, division: 'Chittagong' },
  { id: 26, name: 'Khagrachhari', latitude: 23.1193, longitude: 91.9847, division: 'Chittagong' },
  { id: 27, name: 'Chandpur', latitude: 23.2332, longitude: 90.6712, division: 'Chittagong' },
  { id: 28, name: 'Moulvibazar', latitude: 24.4829, longitude: 91.7774, division: 'Sylhet' },
  { id: 29, name: 'Habiganj', latitude: 24.3745, longitude: 91.4156, division: 'Sylhet' },
  { id: 30, name: 'Sunamganj', latitude: 25.0658, longitude: 91.3950, division: 'Sylhet' },
  { id: 31, name: 'Narsingdi', latitude: 23.9322, longitude: 90.7151, division: 'Dhaka' },
  { id: 32, name: 'Manikganj', latitude: 23.8644, longitude: 90.0047, division: 'Dhaka' },
  { id: 33, name: 'Munshiganj', latitude: 23.5422, longitude: 90.5305, division: 'Dhaka' },
  { id: 34, name: 'Rajbari', latitude: 23.7574, longitude: 89.6444, division: 'Dhaka' },
  { id: 35, name: 'Madaripur', latitude: 23.1641, longitude: 90.1896, division: 'Dhaka' },
  { id: 36, name: 'Gopalganj', latitude: 23.0488, longitude: 89.8266, division: 'Dhaka' },
  { id: 37, name: 'Shariatpur', latitude: 23.2422, longitude: 90.4348, division: 'Dhaka' },
  { id: 38, name: 'Kishoreganj', latitude: 24.4449, longitude: 90.7760, division: 'Dhaka' },
  { id: 39, name: 'Netrokona', latitude: 24.8807, longitude: 90.7279, division: 'Mymensingh' },
  { id: 40, name: 'Sherpur', latitude: 25.0204, longitude: 90.0174, division: 'Mymensingh' },
  { id: 41, name: 'Jamalpur', latitude: 24.9375, longitude: 89.9370, division: 'Mymensingh' },
  { id: 42, name: 'Sirajganj', latitude: 24.4533, longitude: 89.7006, division: 'Rajshahi' },
  { id: 43, name: 'Natore', latitude: 24.4206, longitude: 89.0015, division: 'Rajshahi' },
  { id: 44, name: 'Joypurhat', latitude: 25.0968, longitude: 89.0227, division: 'Rajshahi' },
  { id: 45, name: 'Chapainawabganj', latitude: 24.5965, longitude: 88.2775, division: 'Rajshahi' },
  { id: 46, name: 'Naogaon', latitude: 24.7936, longitude: 88.9318, division: 'Rajshahi' },
  { id: 47, name: 'Satkhira', latitude: 22.7185, longitude: 89.0705, division: 'Khulna' },
  { id: 48, name: 'Bagerhat', latitude: 22.6602, longitude: 89.7895, division: 'Khulna' },
  { id: 49, name: 'Narail', latitude: 23.1728, longitude: 89.5126, division: 'Khulna' },
  { id: 50, name: 'Chuadanga', latitude: 23.6401, longitude: 88.8412, division: 'Khulna' },
  { id: 51, name: 'Meherpur', latitude: 23.7627, longitude: 88.6318, division: 'Khulna' },
  { id: 52, name: 'Magura', latitude: 23.4855, longitude: 89.4198, division: 'Khulna' },
  { id: 53, name: 'Jhenaidah', latitude: 23.5449, longitude: 89.1539, division: 'Khulna' },
  { id: 54, name: 'Pirojpur', latitude: 22.5841, longitude: 89.9720, division: 'Barisal' },
  { id: 55, name: 'Jhalokati', latitude: 22.6406, longitude: 90.1987, division: 'Barisal' },
  { id: 56, name: 'Patuakhali', latitude: 22.3596, longitude: 90.3298, division: 'Barisal' },
  { id: 57, name: 'Barguna', latitude: 22.1596, longitude: 90.1115, division: 'Barisal' },
  { id: 58, name: 'Bhola', latitude: 22.6859, longitude: 90.6482, division: 'Barisal' },
  { id: 59, name: 'Kurigram', latitude: 25.8055, longitude: 89.6361, division: 'Rangpur' },
  { id: 60, name: 'Lalmonirhat', latitude: 25.9923, longitude: 89.2847, division: 'Rangpur' },
  { id: 61, name: 'Nilphamari', latitude: 25.931, longitude: 88.8563, division: 'Rangpur' },
  { id: 62, name: 'Gaibandha', latitude: 25.3287, longitude: 89.5280, division: 'Rangpur' },
  { id: 63, name: 'Thakurgaon', latitude: 26.0336, longitude: 88.4616, division: 'Rangpur' },
  { id: 64, name: 'Panchagarh', latitude: 26.3411, longitude: 88.5541, division: 'Rangpur' },
];

interface DistrictItemProps {
  district: typeof BANGLADESH_DISTRICTS[0];
  onPress: () => void;
  colors: any;
}

const DistrictItem: React.FC<DistrictItemProps> = ({ district, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.districtItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.districtInfo}>
      <View style={styles.districtMainInfo}>
        <Text style={[styles.districtName, { color: colors.text }]}>
          {district.name}
        </Text>
        <Text style={[styles.divisionName, { color: colors.icon }]}>
          {district.division} Division
        </Text>
      </View>
      <Ionicons name="location-outline" size={20} color={colors.buttonPrimary} />
    </View>
  </TouchableOpacity>
);

export default function LocationSelectionScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme || 'light'];
  const { requestLocationUpdate, clearManualLocation, setManualLocation } = useLocation();
  const { showSuccess, showError } = useToastGlobal();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDistricts, setFilteredDistricts] = useState(BANGLADESH_DISTRICTS);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    filterDistricts();
  }, [searchQuery]);

  const filterDistricts = () => {
    if (!searchQuery) {
      setFilteredDistricts(BANGLADESH_DISTRICTS);
      return;
    }

    const filtered = BANGLADESH_DISTRICTS.filter(district =>
      district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.division.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredDistricts(filtered);
  };

    const handleDistrictSelect = async (district: typeof BANGLADESH_DISTRICTS[0]) => {
    try {
      // Set the manual location in the context
      setManualLocation({
        name: district.name,
        latitude: district.latitude,
        longitude: district.longitude,
        division: district.division,
      });

      showSuccess(`Location set to ${district.name}, ${district.division}`);
      router.back();
    } catch (error) {
      showError('Failed to set location. Please try again.');
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Clear any manual location first
      clearManualLocation();
      
      const result = await requestLocationUpdate();
      
      if (result.success) {
        showSuccess('Current location updated successfully');
        router.back();
      } else {
        showError(result.message || 'Failed to get current location.');
      }
    } catch (error) {
      showError('Failed to get current location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };  const handleBackPress = () => {
    router.back();
  };

  const renderDistrictItem = ({ item }: { item: typeof BANGLADESH_DISTRICTS[0] }) => (
    <DistrictItem
      district={item}
      onPress={() => handleDistrictSelect(item)}
      colors={colors}
    />
  );

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
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Ionicons name="location" size={32} color="white" style={styles.headerIcon} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Select Location</Text>
              <Text style={styles.headerSubtitle}>
                Choose your location or use current location
              </Text>
            </View>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search districts..."
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

      {/* Current Location Button */}
      <TouchableOpacity 
        style={[styles.currentLocationButton, { backgroundColor: colors.buttonPrimary }]}
        onPress={handleUseCurrentLocation}
        disabled={isGettingLocation}
      >
        <View style={styles.currentLocationContent}>
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="locate" size={24} color="white" />
          )}
          <View style={styles.currentLocationText}>
            <Text style={styles.currentLocationTitle}>
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Text>
            <Text style={styles.currentLocationSubtitle}>
              Get your location automatically
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Districts List */}
      <View style={styles.districtsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Or select manually ({filteredDistricts.length} districts)
        </Text>
        
        <FlatList
          data={filteredDistricts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDistrictItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.districtsList}
        />
      </View>
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
    marginBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerIcon: {
    opacity: 0.9,
  },
  headerTextContainer: {
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
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  currentLocationButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  currentLocationSubtitle: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
  },
  districtsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  districtsList: {
    paddingBottom: 20,
  },
  districtItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  districtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  districtMainInfo: {
    flex: 1,
  },
  districtName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  divisionName: {
    fontSize: 13,
    opacity: 0.7,
  },
});
