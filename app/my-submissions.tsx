import CustomAlert from '@/components/CustomAlert';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { getMySubmissions, isAuthenticated } from '@/services/api';
import { SubmissionListItem } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';
type SubmissionTypeFilter = 'all' | 'business' | 'attraction' | 'offering';

export default function MySubmissionsScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionListItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<SubmissionTypeFilter>('all');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadSubmissions();
    }
  }, [authenticated]);

  useEffect(() => {
    filterSubmissions();
  }, [filter, typeFilter, allSubmissions]);

  const checkAuth = async () => {
    try {
      const auth = await isAuthenticated();
      setAuthenticated(auth);

      if (!auth) {
        showAlert({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in to view your submissions',
          buttons: [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Sign In', onPress: () => router.push('/auth/login' as any) },
          ],
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      // Fetch all submissions without filters
      const response = await getMySubmissions(undefined, undefined);

      if (response.success && response.data?.submissions) {
        const submissionsData = Array.isArray(response.data.submissions) ? response.data.submissions : [];
        setAllSubmissions(submissionsData);
      } else {
        setAllSubmissions([]);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      setAllSubmissions([]); // Set empty array on error
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load submissions',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...allSubmissions];

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(submission => submission.status === filter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(submission => submission.type === typeFilter);
    }

    setSubmissions(filtered);
  };

  const handleSubmissionPress = async (submission: SubmissionListItem) => {
    // Navigate to submission details page
    router.push(`/submission-details?id=${submission.id}&type=${submission.type}` as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
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

  const getSubmissionTypeLabel = (type: string) => {
    switch (type) {
      case 'business':
        return 'Business';
      case 'attraction':
        return 'Attraction';
      case 'offering':
        return 'Offering';
      default:
        return type;
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'business':
        return 'business';
      case 'attraction':
        return 'location';
      case 'offering':
        return 'pricetag';
      default:
        return 'document';
    }
  };

  const renderSubmissionCard = (submission: SubmissionListItem) => {
    const statusColor = getStatusColor(submission.status);
    const statusIcon = getStatusIcon(submission.status);
    const typeIcon = getSubmissionTypeIcon(submission.type);

    return (
      <TouchableOpacity
        key={submission.id}
        style={[styles.submissionCard, { backgroundColor: colors.card }]}
        onPress={() => handleSubmissionPress(submission)}
      >
        {/* Header with Status and Type */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon as any} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {submission.status.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.tint + '20' }]}>
            <Ionicons name={typeIcon as any} size={14} color={colors.tint} />
            <Text style={[styles.typeText, { color: colors.tint }]}>
              {getSubmissionTypeLabel(submission.type)}
            </Text>
          </View>
        </View>

        {/* Submission Info */}
        <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
          {submission.name}
        </Text>

        {/* Location Info */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.icon} />
          <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={2}>
            {submission.city}, {submission.address}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color={colors.icon} />
            <Text style={[styles.detailText, { color: colors.icon }]}>
              {new Date(submission.submitted_at).toLocaleDateString()}
            </Text>
          </View>
          {submission.reviewed_at && (
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-done" size={14} color={colors.icon} />
              <Text style={[styles.detailText, { color: colors.icon }]}>
                Reviewed
              </Text>
            </View>
          )}
        </View>

        {/* Admin Notes (if rejected) */}
        {submission.status === 'rejected' && submission.admin_notes && (
          <View style={[styles.adminNotes, { backgroundColor: '#F44336' + '10' }]}>
            <Ionicons name="alert-circle" size={14} color="#F44336" />
            <Text style={[styles.adminNotesText, { color: '#F44336' }]} numberOfLines={2}>
              {submission.admin_notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!authenticated && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Text style={styles.headerTitle}>My Submissions</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterTab,
                filter === filterType && [styles.activeFilterTab, { backgroundColor: colors.tint }],
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === filterType ? 'white' : colors.text },
                ]}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading submissions...</Text>
        </View>
      ) : !submissions || submissions.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="document-text-outline" size={64} color={colors.icon} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Submissions Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {filter === 'all'
              ? 'Start contributing by submitting businesses!'
              : `No ${filter} submissions found`}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
        >
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {submissions?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                {filter === 'all' ? 'Total' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </View>
          </View>

          {submissions?.map(renderSubmissionCard)}
        </ScrollView>
      )}

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
  filterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  activeFilterTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    padding: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsBar: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  submissionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  adminNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  adminNotesText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
});
