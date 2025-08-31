import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { AIRecommendationsSkeleton } from '@/components/SkeletonLoader';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { 
  isAuthenticated,
  fetchWithJsonValidation 
} from '@/services/api';
import { API_CONFIG, getApiUrl } from '@/constants/Api';

type AIRecommendation = {
  business_id: number;
  final_score: number;
  contributing_algorithms: string[];
  business: {
    id: number;
    business_name: string;
    slug: string;
    description: string;
    category_id: string;
    subcategory_id: string | null;
    overall_rating: string;
    total_reviews: number;
    price_range: number;
    area: string;
    landmark: string | null;
    distance?: string;
    logo_image: {
      id: number;
      business_id: string;
      image_url: string;
      image_type: string;
      sort_order: string;
      is_primary: boolean;
    } | null;
    categories?: Array<{ name: string }>;
  };
};

export default function AIRecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const router = useRouter();
  const { colorScheme } = useTheme();
  const { getCoordinatesForAPI } = useLocation();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const colors = Colors[colorScheme];

  useEffect(() => {
    checkAuthAndLoadRecommendations();
  }, []);

  const checkAuthAndLoadRecommendations = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      
      if (!authenticated) {
        showAlert({
          type: 'warning',
          title: 'Login Required',
          message: 'Please login to view AI-powered recommendations.',
          buttons: [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Login', onPress: () => router.push('/auth/login') }
          ]
        });
        setLoading(false);
        return;
      }

      await loadAIRecommendations();
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      setLoading(true);
      const coordinates = getCoordinatesForAPI();
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.RECOMMENDATIONS_ADVANCED_AI)}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&limit=20`;
      const response = await fetchWithJsonValidation(url);

      if (response.success) {
        setRecommendations(response.data.recommendations || []);
      } else {
        showAlert({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load AI recommendations. Please try again.',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
      showAlert({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load recommendations. Please check your connection.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => loadAIRecommendations() }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAIRecommendations();
  };

  const renderRecommendationCard = ({ item, index }: { item: AIRecommendation, index: number }) => {
    const business = item.business;

    return (
      <TouchableOpacity
        style={[
          styles.recommendationCard,
          {
            backgroundColor: colors.card,
            borderColor: colorScheme === 'dark' 
              ? 'rgba(59, 130, 246, 0.2)' 
              : 'rgba(99, 102, 241, 0.1)',
            shadowColor: colorScheme === 'dark' 
              ? colors.tint 
              : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          }
        ]}
        onPress={() => router.push(`/business/${business.id}` as any)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(business.logo_image?.image_url) || getFallbackImageUrl('business') }} 
          style={styles.businessImage}
        />
        
        {/* AI Score Badge with Pulse Effect */}
        <View style={[
          styles.aiBadge, 
          { 
            backgroundColor: colors.tint,
            shadowColor: colors.tint,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }
        ]}>
          <Ionicons name="sparkles" size={12} color="white" />
          <Text style={styles.confidenceText}>{Math.round(item.final_score * 100)}%</Text>
          <View style={[
            styles.aiPulse,
            { 
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(99, 102, 241, 0.2)',
            }
          ]} />
        </View>
        
        {/* Algorithm type badge with glow */}
        {item.contributing_algorithms.length > 0 && (
          <View style={[
            styles.typeBadge, 
            { 
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(16, 185, 129, 0.8)'
                : '#10B981',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
            }
          ]}>
            <Text style={styles.typeText}>{item.contributing_algorithms[0].toUpperCase()}</Text>
          </View>
        )}
        
        <View style={[
          styles.cardContent,
          {
            backgroundColor: colors.card,
          }
        ]}>
          <Text style={[
            styles.businessName, 
            { color: colors.text }
          ]} numberOfLines={1}>
            {business.business_name}
          </Text>
          <Text style={[
            styles.businessCategory, 
            { color: colors.tint }
          ]} numberOfLines={1}>
            {business.categories?.[0]?.name || 'Business'} • {business.area}
          </Text>
          {business.landmark && (
            <Text style={[
              styles.businessLandmark, 
              { color: colors.icon }
            ]} numberOfLines={1}>
              📍 {business.landmark}
            </Text>
          )}
          
          {/* AI Algorithm Analysis */}
          <View style={[
            styles.aiExplanationContainer,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(99, 102, 241, 0.05)',
              borderColor: colorScheme === 'dark'
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(99, 102, 241, 0.2)',
            }
          ]}>
            <View style={styles.aiHeader}>
              <View style={[
                styles.aiIcon,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)',
                }
              ]}>
                <Ionicons name="bulb" size={14} color={colors.tint} />
              </View>
              <Text style={[styles.aiLabel, { color: colors.tint }]}>Neural Analysis</Text>
              <View style={styles.neuralIndicator}>
                <View style={[styles.neuralDot, { backgroundColor: '#10B981' }]} />
                <Text style={[
                  styles.neuralStatus,
                  { color: colorScheme === 'dark' ? '#10B981' : '#059669' }
                ]}>
                  Active
                </Text>
              </View>
            </View>
            <Text style={[
              styles.aiExplanation, 
              { color: colorScheme === 'dark' ? colors.icon : colors.tint }
            ]} numberOfLines={2}>
              Analyzed via {item.contributing_algorithms.join(' + ')} algorithms • {Math.round(item.final_score * 100)}% confidence
            </Text>
            
            {/* Algorithm badges */}
            <View style={styles.algorithmBadges}>
              {item.contributing_algorithms.slice(0, 2).map((algorithm, algorithmIndex) => (
                <View 
                  key={algorithmIndex} 
                  style={[
                    styles.algorithmChip,
                    {
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(99, 102, 241, 0.1)',
                      borderColor: colorScheme === 'dark'
                        ? 'rgba(59, 130, 246, 0.4)'
                        : 'rgba(99, 102, 241, 0.3)',
                    }
                  ]}
                >
                  <Text style={[
                    styles.algorithmChipText,
                    { color: colors.tint }
                  ]}>
                    {algorithm}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[
                styles.rating, 
                { color: colors.text }
              ]}>
                {business.overall_rating}
              </Text>
            </View>
            <View style={styles.metaRight}>
              {business.distance && (
                <Text style={[styles.distance, { color: colors.icon }]}>
                  {parseFloat(business.distance).toFixed(1)}km
                </Text>
              )}
              <Text style={[styles.priceRange, { color: colors.icon }]}>
                {business.price_range ? `${'$'.repeat(business.price_range)}` : '$'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isUserAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.aiIconLarge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons name="bulb" size={24} color="white" />
                <View style={styles.aiGlow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>AI Picks</Text>
                <Text style={styles.headerBadge}>Powered by Neural Networks</Text>
              </View>
              <TouchableOpacity 
                style={[styles.refreshButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={onRefresh}
              >
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>
              {recommendations.length} personalized recommendations
            </Text>
          </View>
        </View>
        
        {/* Animated particles effect */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.particle, 
                { 
                  left: `${10 + i * 15}%`, 
                  animationDelay: `${i * 0.5}s`,
                  opacity: 0.3 + (i * 0.1)
                }
              ]} 
            />
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <AIRecommendationsSkeleton colors={colors} />
        ) : recommendations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.headerGradientStart, colors.headerGradientEnd]}
              style={styles.emptyIcon}
            >
              <Ionicons name="analytics" size={50} color="#8B5CF6" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Neural Network Learning Mode
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text }]}>
              Our AI algorithms are still learning your preferences.{'\n'}
              Explore more businesses to train the neural network{'\n'}
              and unlock personalized recommendations!
            </Text>
          </View>
        ) : (
          <FlatList
            data={recommendations}
            renderItem={renderRecommendationCard}
            keyExtractor={(item) => item.business.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  aiIconLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aiGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -4,
    left: -4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadge: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
    gap: 20,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  recommendationCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  businessImage: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  aiPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    opacity: 0.5,
  },
  confidenceText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  typeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -12,
    position: 'relative',
    zIndex: 5,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  businessCategory: {
    fontSize: 13,
    marginBottom: 3,
    fontWeight: '600',
  },
  businessLandmark: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '500',
  },
  aiExplanationContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  neuralIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  neuralDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  neuralStatus: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  aiExplanation: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  algorithmBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  algorithmChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  algorithmChipText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distance: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceRange: {
    fontSize: 15,
    fontWeight: '700',
  },
});
