import BusinessMapView from '@/components/BusinessMapView';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AttractionMapViewProps {
  attraction: {
    name: string;
    free_maps?: {
      openstreetmap_url: string;
      leaflet_data: {
        center: {
          lat: number;
          lng: number;
        };
        zoom: number;
        marker: {
          lat: number;
          lng: number;
          popup: string;
        };
        tile_url: string;
        attribution: string;
      };
    };
    google_maps_url?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      area?: string;
      city?: string;
      district?: string;
    };
  };
  colors: any;
}

export default function AttractionMapView({ attraction, colors }: AttractionMapViewProps) {
  const fullAddress = attraction.location?.address || 
    `${attraction.location?.area ? attraction.location.area + ', ' : ''}${attraction.location?.city || ''}, ${attraction.location?.district || ''}`;

  // Primary: Use free_maps with BusinessMapView
  if (attraction.free_maps) {
    return (
      <BusinessMapView
        freeMaps={attraction.free_maps}
        businessName={attraction.name}
        fullAddress={fullAddress}
        latitude={attraction.location?.latitude?.toString()}
        longitude={attraction.location?.longitude?.toString()}
        colors={colors}
        style={{ marginTop: 12 }}
      />
    );
  }

  // Secondary: Coordinate-based fallback
  if (attraction.location?.latitude && attraction.location?.longitude) {
    return (
      <TouchableOpacity 
        style={[styles.mapPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => {
          if (attraction.location?.latitude && attraction.location?.longitude) {
            const googleMapsUrl = `https://maps.google.com/?q=${attraction.location.latitude},${attraction.location.longitude}`;
            Linking.openURL(googleMapsUrl);
          }
        }}
      >
        <View style={[styles.mapPlaceholderIcon, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name="map" size={32} color={colors.tint} />
        </View>
        <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>View Location on Map</Text>
        <Text style={[styles.mapPlaceholderSubtitle, { color: colors.icon }]}>
          Tap to open location in Maps app
        </Text>
        <View style={[styles.mapButton, { backgroundColor: colors.tint }]}>
          <Ionicons name="open" size={16} color="white" />
          <Text style={styles.mapButtonText}>Open Map</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Tertiary: Google Maps URL fallback
  if (attraction.google_maps_url) {
    return (
      <TouchableOpacity 
        style={[styles.mapPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => Linking.openURL(attraction.google_maps_url!)}
      >
        <View style={[styles.mapPlaceholderIcon, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name="map" size={32} color={colors.tint} />
        </View>
        <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>View on Google Maps</Text>
        <Text style={[styles.mapPlaceholderSubtitle, { color: colors.icon }]}>
          Tap to open in Maps app
        </Text>
        <View style={[styles.mapButton, { backgroundColor: colors.tint }]}>
          <Ionicons name="open" size={16} color="white" />
          <Text style={styles.mapButtonText}>Open Map</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // No map data available
  return (
    <View style={[styles.mapPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.mapPlaceholderIcon, { backgroundColor: colors.icon + '20' }]}>
        <Ionicons name="map-outline" size={32} color={colors.icon} />
      </View>
      <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>Map Not Available</Text>
      <Text style={[styles.mapPlaceholderSubtitle, { color: colors.icon }]}>
        Location information is not available for this attraction
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  mapPlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mapPlaceholderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});