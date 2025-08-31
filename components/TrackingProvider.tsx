import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import { initializeTracking, cleanupTracking } from '@/services/trackingSetup';
import { userTracker } from '@/services/userTrackingService';

/**
 * App-level tracking integration component
 * Add this to your main App.tsx or root layout
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize tracking when app starts
    initializeTracking();

    // Set up app state change listeners
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // App going to background - flush pending data
        console.log('📱 App going to background - flushing tracking data');
        userTracker.flushBatch();
      } else if (nextAppState === 'active') {
        // App coming to foreground - retry pending interactions
        console.log('📱 App coming to foreground - retrying pending interactions');
        userTracker.retryPendingInteractions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription?.remove();
      cleanupTracking();
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook for debugging tracking in development
 * Use this in your debug screens or settings
 */
export function useTrackingDebug() {
  const [stats, setStats] = React.useState<any>(null);

  const refreshStats = async () => {
    try {
      const { getTrackingStats } = await import('@/services/trackingSetup');
      const trackingStats = await getTrackingStats();
      setStats(trackingStats);
    } catch (error) {
      console.error('Failed to get tracking stats:', error);
    }
  };

  const flushNow = async () => {
    try {
      const { debugFlushTracking } = await import('@/services/trackingSetup');
      await debugFlushTracking();
      await refreshStats();
    } catch (error) {
      console.error('Failed to flush tracking:', error);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return {
    stats,
    refreshStats,
    flushNow,
  };
}

/**
 * Debug component for development
 * Add this to your settings or debug screen
 */
export function TrackingDebugPanel() {
  const { stats, refreshStats, flushNow } = useTrackingDebug();

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View style={{ padding: 16, backgroundColor: '#f0f0f0', margin: 16, borderRadius: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        Tracking Debug Panel
      </Text>
      
      {stats && (
        <View style={{ marginBottom: 12 }}>
          <Text>Pending Interactions: {stats.pendingInteractions}</Text>
          <Text>Session ID: {stats.sessionId}</Text>
          <Text>Last Flush: {stats.lastFlush || 'Never'}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', padding: 8, borderRadius: 4, flex: 1 }}
          onPress={refreshStats}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Refresh Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#FF3B30', padding: 8, borderRadius: 4, flex: 1 }}
          onPress={flushNow}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Flush Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default TrackingProvider;
