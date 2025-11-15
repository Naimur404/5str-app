import CustomAlert from '@/components/CustomAlert';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { getMySubmissions, isAuthenticated } from '@/services/api';
import { BusinessSubmissionData } from '@/types/api';
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

export default function MySubmissionsScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<BusinessSubmissionData[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [filter]);

  const checkAuthAndLoadData = async () => {
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
        return;
      }

      loadSubmissions();
    } catch (error) {
      console.error('Error checking authentication:', error);
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const status = filter !== 'all' ? filter : undefined;
      const response = await getMySubmissions('business', status);

      if (response.success) {
        setSubmissions(response.data.submissions);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
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

  const renderSubmissionCard = (submission: BusinessSubmissionData) => {
    const statusColor = getStatusColor(submission.status);
    const statusIcon = getStatusIcon(submission.status);

    return (
      <TouchableOpacity
        key={submission.id}
        style={[styles.submissionCard, { backgroundColor: colors.card }]}
        onPress={() => {
          // Navigate to submission details (optional)
          console.log('View submission:', submission.id);
        }}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Ionicons name={statusIcon as any} size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {submission.status.toUpperCase()}
          </Text>
        </View>

        {/* Business Info */}
        <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
          {submission.name}
        </Text>
        <Text style={[styles.category, { color: colors.icon }]}>{submission.category}</Text>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color={colors.icon} />
            <Text style={[styles.detailText, { color: colors.icon }]} numberOfLines={1}>
              {submission.city}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color={colors.icon} />
            <Text style={[styles.detailText, { color: colors.icon }]}>
              {new Date(submission.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
          {submission.description}
        </Text>

        {/* Admin Notes (if rejected) */}
        {submission.status === 'rejected' && submission.admin_notes && (
          <View style={[styles.adminNotes, { backgroundColor: '#F44336' + '10' }]}>
            <Ionicons name="alert-circle" size={14} color="#F44336" />
            <Text style={[styles.adminNotesText, { color: '#F44336' }]} numberOfLines={2}>
              {submission.admin_notes}
            </Text>
          </View>
        )}

        {/* Images Count */}
        {submission.images && submission.images.length > 0 && (
          <View style={styles.imagesCount}>
            <Ionicons name="images" size={14} color={colors.tint} />
            <Text style={[styles.imagesCountText, { color: colors.tint }]}>
              {submission.images.length} image{submission.images.length > 1 ? 's' : ''}
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
      ) : submissions.length === 0 ? (
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
              <Text style={[styles.statNumber, { color: colors.text }]}>{submissions.length}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                {filter === 'all' ? 'Total' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </View>
          </View>

          {submissions.map(renderSubmissionCard)}
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  submissionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  adminNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  adminNotesText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  imagesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  imagesCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
