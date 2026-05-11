import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

export default function MapComponent({ latitude, longitude }: { latitude: number, longitude: number }) {
  // Guard against invalid coordinates
  if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }

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
