import CustomAlert from '@/components/CustomAlert';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { getSubmissionDetails } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OpeningHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface SubmissionDetails {
  id: number;
  submission_type: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string | null;
  website: string | null;
  opening_hours: string;
  images: string;
  additional_info: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  approved_business_id: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function SubmissionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<SubmissionDetails | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const submissionId = params.id as string;
  const submissionType = params.type as 'business' | 'attraction' | 'offering';

  useEffect(() => {
    loadSubmissionDetails();
  }, []);

  const loadSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await getSubmissionDetails(submissionType, parseInt(submissionId));

      if (response.success && response.data.submission) {
        const submission = response.data.submission as any;
        setDetails(submission);

        // Parse opening hours if exists (for business submissions)
        if (submission.opening_hours && typeof submission.opening_hours === 'string') {
          try {
            const hours = JSON.parse(submission.opening_hours);
            setOpeningHours(Array.isArray(hours) ? hours : []);
          } catch (e) {
            console.error('Error parsing opening hours:', e);
          }
        }

        // Parse images if exists
        if (submission.images) {
          try {
            // Images might be a string (JSON) or already an array
            const imgs = typeof submission.images === 'string' 
              ? JSON.parse(submission.images)
              : submission.images;
            setImages(Array.isArray(imgs) ? imgs : []);
          } catch (e) {
            console.error('Error parsing images:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading submission details:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load submission details',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return colors.icon;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const capitalizeDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Submission Details</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading details...</Text>
        </View>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Submission Details</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No details available</Text>
        </View>
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

  const statusColor = getStatusColor(details.status);
  const statusIcon = getStatusIcon(details.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submission Details</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderWidth: 1.5, borderColor: statusColor }]}>
            <Ionicons name={statusIcon as any} size={22} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {details.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <Text style={[styles.businessName, { color: colors.text }]}>{details.name}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={16} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Category:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{details.category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {details.submission_type.charAt(0).toUpperCase() + details.submission_type.slice(1)}
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionLabel, { color: colors.icon }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {details.description}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.icon }]}>City:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{details.city}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="map" size={16} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Address:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{details.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={16} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Coordinates:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {details.latitude}, {details.longitude}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        {(details.phone || details.email || details.website) && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
            
            {details.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={16} color={colors.icon} />
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Phone:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{details.phone}</Text>
              </View>
            )}

            {details.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color={colors.icon} />
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Email:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{details.email}</Text>
              </View>
            )}

            {details.website && (
              <View style={styles.infoRow}>
                <Ionicons name="globe" size={16} color={colors.icon} />
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Website:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{details.website}</Text>
              </View>
            )}
          </View>
        )}

        {/* Opening Hours */}
        {openingHours.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening Hours</Text>
            
            {openingHours.map((hour, index) => (
              <View key={index} style={styles.hourRow}>
                <Text style={[styles.dayText, { color: colors.text }]}>
                  {capitalizeDay(hour.day)}
                </Text>
                {hour.is_closed ? (
                  <Text style={[styles.closedText, { color: colors.icon }]}>Closed</Text>
                ) : (
                  <Text style={[styles.timeText, { color: colors.text }]}>
                    {hour.open_time} - {hour.close_time}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Images */}
        {images.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Images ({images.length})
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}/storage/${image}` }}
                  style={styles.submissionImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Additional Info */}
        {details.additional_info && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>
            <Text style={[styles.additionalInfoText, { color: colors.text }]}>
              {details.additional_info}
            </Text>
          </View>
        )}

        {/* Admin Notes */}
        {details.admin_notes && (
          <View style={[styles.section, { backgroundColor: '#F44336' + '10' }]}>
            <View style={styles.adminNotesHeader}>
              <Ionicons name="alert-circle" size={20} color="#F44336" />
              <Text style={[styles.sectionTitle, { color: '#F44336', marginLeft: 8 }]}>
                Admin Notes
              </Text>
            </View>
            <Text style={[styles.adminNotesText, { color: '#F44336' }]}>
              {details.admin_notes}
            </Text>
          </View>
        )}

        {/* Submission Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Submission Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Submitted:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(details.created_at).toLocaleString()}
            </Text>
          </View>

          {details.reviewed_at && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-done" size={16} color={colors.icon} />
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Reviewed:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(details.reviewed_at).toLocaleString()}
              </Text>
            </View>
          )}

          {details.approved_business_id && (
            <View style={styles.infoRow}>
              <Ionicons name="business" size={16} color={colors.icon} />
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Business ID:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                #{details.approved_business_id}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  businessName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    width: 100,
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closedText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  imagesScroll: {
    marginTop: 12,
  },
  submissionImage: {
    width: 240,
    height: 180,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  additionalInfoText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  adminNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminNotesText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
