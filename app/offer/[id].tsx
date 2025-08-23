import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    getOfferDetails,
    OfferDetails
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function OfferDetailsScreen() {
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const offerId = parseInt(params.id as string);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (offerId) {
      loadOfferDetails();
    }
  }, [offerId]);

  const loadOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOfferDetails(offerId);
      
      if (response.success) {
        setOffer(response.data);
      } else {
        setError('Failed to load offer details');
      }
    } catch (error) {
      console.error('Error loading offer details:', error);
      setError('Unable to load offer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessPress = () => {
    if (offer?.business) {
      router.push(`/business/${offer.business.id}` as any);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDiscountText = () => {
    if (!offer) return '';
    
    if (offer.offer_type === 'percentage' && offer.discount_percentage) {
      return `${offer.discount_percentage}% OFF`;
    } else if (offer.offer_type === 'fixed' && offer.discount_amount) {
      return `৳${offer.discount_amount} OFF`;
    }
    return 'Special Offer';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading offer details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !offer) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <Ionicons name="alert-circle-outline" size={64} color={colors.icon} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Load Offer</Text>
        <Text style={[styles.errorMessage, { color: colors.icon }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.tint }]}
          onPress={loadOfferDetails}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FF6B6B' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Details</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Offer Banner */}
        <View style={styles.bannerContainer}>
          {offer.banner_image ? (
            <Image source={{ uri: offer.banner_image }} style={styles.bannerImage} />
          ) : (
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.defaultBanner}
            >
              <Ionicons name="pricetag" size={48} color="white" />
            </LinearGradient>
          )}
          
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{getDiscountText()}</Text>
          </View>
        </View>

        {/* Offer Content */}
        <View style={styles.content}>
          {/* Title and Description */}
          <View style={styles.section}>
            <Text style={[styles.offerTitle, { color: colors.text }]}>{offer.title}</Text>
            <Text style={[styles.offerDescription, { color: colors.icon }]}>{offer.description}</Text>
          </View>

          {/* Business Info */}
          <TouchableOpacity 
            style={[styles.businessCard, { backgroundColor: colors.background, borderColor: colors.icon + '30' }]}
            onPress={handleBusinessPress}
          >
            <Image 
              source={{ 
                uri: offer.business.logo_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop' 
              }} 
              style={styles.businessLogo} 
            />
            <View style={styles.businessInfo}>
              <Text style={[styles.businessName, { color: colors.text }]}>{offer.business.business_name}</Text>
              <Text style={[styles.viewBusiness, { color: colors.tint }]}>View Business</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          {/* Offer Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Offer Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.icon} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Valid Period</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(offer.valid_from)} - {formatDate(offer.valid_to)}
                </Text>
              </View>
            </View>

            {offer.minimum_spend && (
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={20} color={colors.icon} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Minimum Spend</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>৳{offer.minimum_spend}</Text>
                </View>
              </View>
            )}

            {offer.offer_code && (
              <View style={styles.detailRow}>
                <Ionicons name="ticket-outline" size={20} color={colors.icon} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Offer Code</Text>
                  <Text style={[styles.detailValue, styles.offerCode, { color: colors.tint }]}>{offer.offer_code}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color={colors.icon} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Usage</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {offer.current_usage} times used {offer.usage_limit ? `(limit: ${offer.usage_limit})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={colors.icon} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Expires In</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {Math.ceil(offer.remaining_days)} days
                </Text>
              </View>
            </View>
          </View>

          {/* Status Indicators */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
            
            <View style={styles.statusGrid}>
              <View style={[styles.statusItem, { backgroundColor: offer.is_active ? '#10B981' : '#EF4444' }]}>
                <Ionicons name={offer.is_active ? "checkmark-circle" : "close-circle"} size={20} color="white" />
                <Text style={styles.statusText}>
                  {offer.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              
              <View style={[styles.statusItem, { backgroundColor: offer.is_expired ? '#EF4444' : '#10B981' }]}>
                <Ionicons name={offer.is_expired ? "time" : "checkmark-circle"} size={20} color="white" />
                <Text style={styles.statusText}>
                  {offer.is_expired ? 'Expired' : 'Valid'}
                </Text>
              </View>
              
              <View style={[styles.statusItem, { backgroundColor: offer.can_be_used ? '#10B981' : '#6B7280' }]}>
                <Ionicons name={offer.can_be_used ? "thumbs-up" : "thumbs-down"} size={20} color="white" />
                <Text style={styles.statusText}>
                  {offer.can_be_used ? 'Usable' : 'Not Usable'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { 
                backgroundColor: offer.can_be_used ? colors.tint : colors.icon + '50',
                opacity: offer.can_be_used ? 1 : 0.6
              }
            ]}
            onPress={handleBusinessPress}
            disabled={!offer.can_be_used}
          >
            <Text style={styles.actionButtonText}>
              {offer.can_be_used ? 'Visit Business' : 'Offer Not Available'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  defaultBanner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  businessLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  viewBusiness: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  offerCode: {
    fontFamily: 'monospace',
    fontSize: 18,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
