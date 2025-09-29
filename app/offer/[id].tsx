import { OfferDetailsSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getOfferDetails,
  OfferDetails
} from '@/services/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Image,
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
  
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <OfferDetailsSkeleton colors={colors} />
      </View>
    );
  }

  if (error || !offer) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <Ionicons name="alert-circle-outline" size={64} color={colors.icon} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Load Offer</Text>
        <Text style={[styles.errorMessage, { color: colors.icon }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={loadOfferDetails}
        >
          <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      
      {/* Hero Section with Background */}
      <View style={styles.heroSection}>
        {offer.banner_image ? (
          <Image source={{ uri: getImageUrl(offer.banner_image) }} style={styles.heroImage} />
        ) : (
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#d946ef']}
            style={styles.heroImage}
          />
        )}
        
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{getDiscountText()}</Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.offerTitle} numberOfLines={2}>{offer.title}</Text>
            <Text style={styles.offerSubtitle} numberOfLines={3}>{offer.description}</Text>
            
            <View style={styles.heroMeta}>
              <View style={styles.validityInfo}>
                <Ionicons name="time-outline" size={16} color="white" />
                <Text style={styles.validityText}>
                  {Math.ceil(offer.remaining_days)} days left
                </Text>
              </View>
              <View style={styles.usageInfo}>
                <Ionicons name="people-outline" size={16} color="white" />
                <Text style={styles.usageText}>
                  {offer.current_usage} used
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
        {/* Business Info */}
        <View style={styles.content}>
          <TouchableOpacity 
            style={[styles.businessCard, { backgroundColor: colors.card, borderColor: colors.icon + '30' }]}
            onPress={handleBusinessPress}
          >
            <Image 
              source={{ 
                uri: getImageUrl(offer.business.logo_image) || getFallbackImageUrl('business') 
              }} 
              style={styles.businessLogo} 
            />
            <View style={styles.businessInfo}>
              <Text style={[styles.businessName, { color: colors.text }]}>{offer.business.business_name}</Text>
              <Text style={[styles.viewBusiness, { color: colors.buttonPrimary }]}>View Business</Text>
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
                  <Text style={[styles.detailValue, styles.offerCode, { color: colors.buttonPrimary }]}>{offer.offer_code}</Text>
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
                backgroundColor: offer.can_be_used ? colors.buttonPrimary : colors.icon + '50',
                opacity: offer.can_be_used ? 1 : 0.6
              }
            ]}
            onPress={handleBusinessPress}
            disabled={!offer.can_be_used}
          >
            <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
              {offer.can_be_used ? 'Visit Business' : 'Offer Not Available'}
            </Text>
          </TouchableOpacity>
        </View>
    </ScrollView>
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
  // Hero Section Styles
  heroSection: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    padding: 20,
    paddingTop: 50,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  offerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  offerSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  validityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
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
    fontSize: 16,
    fontWeight: '600',
  },
});
