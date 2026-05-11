import React from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function MapComponent({ latitude, longitude }: { latitude: number, longitude: number }) {
  // Guard against invalid coordinates
  if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Invalid coordinates</Text>
      </View>
    );
  }

  const openInExternalMap = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load map", err));
    }
  };

  // On Android, react-native-maps crashes without a Google Maps API Key.
  // Since the user doesn't have one, we provide a safe fallback that opens the map app.
  if (Platform.OS === 'android') {
    return (
      <TouchableOpacity style={styles.fallbackContainer} onPress={openInExternalMap}>
        <View style={styles.placeholderMap}>
          <Ionicons name="map-outline" size={40} color="#0F3B82" />
          <Text style={styles.fallbackText}>View on Google Maps</Text>
          <Text style={styles.coordinatesText}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // iOS uses Apple Maps by default, which does NOT require an API key.
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={{ latitude, longitude }} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 15,
    overflow: 'hidden',
  },
  placeholderMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F3B82',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
