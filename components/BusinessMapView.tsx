import { FreeMaps, GoogleMaps } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BusinessMapViewProps {
  googleMaps?: GoogleMaps;
  freeMaps?: FreeMaps;
  businessName: string;
  fullAddress: string;
  latitude?: string;
  longitude?: string;
  colors: any;
  style?: any;
  showExpandButton?: boolean;
}

export default function BusinessMapView({
  googleMaps,
  freeMaps,
  businessName,
  fullAddress,
  latitude,
  longitude,
  colors,
  style,
  showExpandButton = true,
}: BusinessMapViewProps) {
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const [mapError, setMapError] = useState(false);
  const insets = useSafeAreaInsets();

  const handleMapPress = () => {
    if (googleMaps?.simple_url) {
      // Open Google Maps app or web
      Linking.canOpenURL(googleMaps.simple_url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(googleMaps.simple_url);
          } else {
            // Fallback to browser with view URL
            return Linking.openURL(googleMaps.view_url || googleMaps.simple_url);
          }
        })
        .catch((err) => {
          console.error('Error opening Google Maps:', err);
          Alert.alert('Error', 'Unable to open Google Maps');
        });
    } else if (freeMaps?.openstreetmap_url) {
      // Open OpenStreetMap in browser
      Linking.openURL(freeMaps.openstreetmap_url)
        .catch((err) => {
          console.error('Error opening OpenStreetMap:', err);
          Alert.alert('Error', 'Unable to open map');
        });
    } else if (latitude && longitude) {
      // Fallback to Google Maps with coordinates
      const fallbackUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(fallbackUrl)
        .catch((err) => {
          console.error('Error opening fallback map:', err);
          Alert.alert('Error', 'Unable to open map');
        });
    } else {
      Alert.alert('Error', 'Location information not available');
    }
  };

  const handleDirectionsPress = () => {
    if (googleMaps?.directions_url) {
      Linking.openURL(googleMaps.directions_url)
        .catch((err) => {
          console.error('Error opening directions:', err);
          Alert.alert('Error', 'Unable to open directions');
        });
    } else if (latitude && longitude) {
      // Fallback directions with proper format
      const fallbackUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;
      Linking.openURL(fallbackUrl)
        .catch((err) => {
          console.error('Error opening fallback directions:', err);
          Alert.alert('Error', 'Unable to open directions');
        });
    } else {
      Alert.alert('Error', 'Location information not available');
    }
  };

  const generateOpenStreetMapHTML = () => {
    const leafletData = freeMaps?.leaflet_data;
    if (!leafletData) {
      return `
        <html>
          <body style="margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center; color: #666;">
              <p>Map not available</p>
            </div>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${leafletData.center.lat}, ${leafletData.center.lng}], ${leafletData.zoom});
          
          L.tileLayer('${leafletData.tile_url}', {
            attribution: '${leafletData.attribution}'
          }).addTo(map);
          
          L.marker([${leafletData.marker.lat}, ${leafletData.marker.lng}])
            .addTo(map)
            .bindPopup('${leafletData.marker.popup}')
            .openPopup();
        </script>
      </body>
      </html>
    `;
  };

  if (mapError) {
    return (
      <View style={[styles.container, style, { backgroundColor: colors.card }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="map-outline" size={32} color={colors.icon} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Map not available
          </Text>
          <TouchableOpacity 
            style={[styles.fallbackButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={handleMapPress}
          >
            <Text style={[styles.fallbackButtonText, { color: colors.buttonText }]}>
              Open in Google Maps
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, style]}>
        <TouchableOpacity 
          style={styles.mapTouchable}
          onPress={handleMapPress}
          activeOpacity={0.8}
        >
          <WebView
            source={{ html: generateOpenStreetMapHTML() }}
            style={styles.webView}
            scrollEnabled={false}
            zoomable={false}
            onError={() => setMapError(true)}
            onHttpError={() => setMapError(true)}
            pointerEvents="none"
          />
          
          {/* Overlay to make entire area clickable */}
          <View style={styles.mapOverlay}>
            <View style={styles.mapInfo}>
              <View style={[styles.mapIconContainer, { backgroundColor: colors.buttonPrimary }]}>
                <Ionicons name="location" size={20} color="white" />
              </View>
              <View style={styles.mapTextContainer}>
                <Text style={[styles.mapTitle, { color: colors.text }]} numberOfLines={1}>
                  {businessName}
                </Text>
                <Text style={[styles.mapAddress, { color: colors.icon }]} numberOfLines={2}>
                  {fullAddress}
                </Text>
              </View>
            </View>
            
            <View style={styles.mapActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={handleDirectionsPress}
              >
                <Ionicons name="navigate" size={16} color={colors.buttonPrimary} />
                <Text style={[styles.actionButtonText, { color: colors.buttonPrimary }]}>
                  Directions
                </Text>
              </TouchableOpacity>
              
              {showExpandButton && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowFullScreenMap(true)}
                >
                  <Ionicons name="expand" size={16} color={colors.buttonPrimary} />
                  <Text style={[styles.actionButtonText, { color: colors.buttonPrimary }]}>
                    Expand
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Full Screen Map Modal */}
      <Modal
        visible={showFullScreenMap}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullScreenMap(false)}
      >
        <View style={[styles.fullScreenContainer, { paddingTop: insets.top }]}>
          <View style={[styles.fullScreenHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFullScreenMap(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>
              {businessName}
            </Text>
            <TouchableOpacity
              style={[styles.openMapsButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={handleMapPress}
            >
              <Text style={[styles.openMapsButtonText, { color: colors.buttonText }]}>
                Open
              </Text>
            </TouchableOpacity>
          </View>
          
          <WebView
            source={{ html: generateOpenStreetMapHTML() }}
            style={styles.fullScreenWebView}
            onError={() => setMapError(true)}
            onHttpError={() => setMapError(true)}
          />
        </View>
      </Modal>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  mapTouchable: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 12,
  },
  mapInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
  },
  mapIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mapTextContainer: {
    flex: 1,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  mapAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  mapActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 12,
    textAlign: 'center',
  },
  fallbackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  fallbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  openMapsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openMapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullScreenWebView: {
    flex: 1,
  },
});