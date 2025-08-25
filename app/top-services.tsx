import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getTopServices, TopServicesResponse } from '@/services/api';
import { TopService } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import * as Location from 'expo-location';

interface ServiceCardProps {
  service: TopService;
  onPress: () => void;
  colors: any;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.serviceCard, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.serviceRow}>
      <View style={styles.serviceImageContainer}>
        <View style={[styles.iconContainer, { backgroundColor: service.color_code }]}>
          {service.icon_image ? (
            <Image 
              source={{ uri: service.icon_image }} 
              style={styles.serviceIcon}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="storefront-outline" size={32} color="#FFFFFF" />
          )}
        </View>
      </View>

      <View style={styles.serviceContent}>
        <View style={styles.serviceMainInfo}>
          <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
            {service.name}
          </Text>
          <Text style={[styles.businessCount, { color: colors.icon }]} numberOfLines={1}>
            {service.total_businesses} {service.total_businesses === 1 ? 'business' : 'businesses'}
          </Text>
        </View>
        
        <View style={styles.badgeContainer}>
          {service.is_featured && (
            <View style={[styles.badge, styles.featuredBadge]}>
              <Text style={styles.badgeText}>Featured</Text>
            </View>
          )}
          {service.is_popular && (
            <View style={[styles.badge, styles.popularBadge]}>
              <Text style={styles.badgeText}>Popular</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.serviceActions}>
        <View style={[styles.businessCountBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
          <Text style={[styles.businessCountBadgeText, { color: colors.buttonPrimary }]}>
            {service.total_businesses}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.icon} 
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  </TouchableOpacity>
);

export default function TopServicesScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [services, setServices] = useState<TopService[]>([]);
  const [filteredServices, setFilteredServices] = useState<TopService[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    radius_km: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTopServices = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);

      // Get user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show nearby services.');
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const response = await getTopServices(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        50, // Show more services on dedicated page
        15 // 15km radius
      );

      if (response.success) {
        setServices(response.data.services);
        setLocation(response.data.location);
      } else {
        Alert.alert('Error', 'Failed to load top services. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching top services:', error);
      Alert.alert('Error', 'Unable to load services. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, services]);

  const filterServices = () => {
    let filtered = services;

    if (searchQuery) {
      filtered = filtered.filter((service: TopService) => {
        return service.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredServices(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTopServices(false);
  };

  const handleServicePress = (service: TopService) => {
    router.push(`/category/${service.id}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderServiceItem = ({ item }: { item: TopService }) => (
    <ServiceCard
      service={item}
      onPress={() => handleServicePress(item)}
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
            <Ionicons name="storefront" size={32} color="white" style={styles.headerIcon} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Top Services</Text>
              <Text style={styles.headerSubtitle}>
                {location 
                  ? `${services.length} services within ${location.radius_km}km`
                  : 'Discover popular services near you'
                }
              </Text>
            </View>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search services..."
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

      {/* Location Info */}
      {location && (
        <View style={[styles.locationInfo, { backgroundColor: colors.background }]}>
          <View style={styles.locationRow}>
            <Ionicons 
              name="location-outline" 
              size={16} 
              color={colors.buttonPrimary} 
            />
            <Text style={[styles.locationText, { color: colors.icon }]}>
              Your location • {location.radius_km}km radius
            </Text>
          </View>
        </View>
      )}

      {/* Services List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading services...
          </Text>
        </View>
      ) : filteredServices.length > 0 ? (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderServiceItem}
          contentContainerStyle={styles.servicesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.buttonPrimary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.icon + '20' }]}>
            <Ionicons 
              name={searchQuery ? "search-outline" : "storefront-outline"} 
              size={48} 
              color={colors.icon} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'No Results Found' : 'No Services Found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'We couldn\'t find any services in your area.'
            }
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={[styles.exploreButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.exploreButtonText, { color: colors.buttonText }]}>
                Clear Search
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    backgroundColor: 'white',
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
  locationInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  servicesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    padding: 12,
  },
  serviceImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    width: 32,
    height: 32,
  },
  serviceContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceMainInfo: {
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  businessCount: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredBadge: {
    backgroundColor: '#FF3B30',
  },
  popularBadge: {
    backgroundColor: '#30D158',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  serviceActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
    paddingVertical: 4,
  },
  businessCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  businessCountBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
