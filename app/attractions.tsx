import { LocationHeader } from '@/components/LocationHeader';
import TrackableAttractionCard from '@/components/TrackableAttractionCard';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAttractions } from '@/services/api';
import { AttractionListItem } from '@/types/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
} from 'react-native';

export default function AttractionsScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI } = useLocation();

  // State
  const [attractions, setAttractions] = useState<AttractionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAttractions();
    }, [])
  );

  const fetchAttractions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const coordinates = getCoordinatesForAPI();
      const response = await getAttractions(
        coordinates.latitude, 
        coordinates.longitude, 
        1, 
        20
      );

      if (response.success) {
        setAttractions(response.data.data || []);
      } else {
        setError('Failed to load attractions');
      }
    } catch (error) {
      console.error('Error fetching attractions:', error);
      setError('Failed to load attractions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttractions();
  };

  const handleAttractionPress = (attraction: AttractionListItem) => {
    router.push(`/attraction/${attraction.id}`);
  };

  const renderAttraction = ({ item, index }: { item: AttractionListItem; index: number }) => {
    return (
      <TrackableAttractionCard 
        attraction={item} 
        position={index + 1}
        section="attractions_list"
        source="attractions_page"
        onPress={() => handleAttractionPress(item)}
        style={styles.attractionCard}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Attractions Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        Try adjusting your location or check back later
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        {error}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <LocationHeader />
      
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>All Attractions</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Discover amazing places around you
        </Text>
      </View>
      
      {loading && attractions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading attractions...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={attractions}
          renderItem={renderAttraction}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          ListEmptyComponent={loading ? null : renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  attractionCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});