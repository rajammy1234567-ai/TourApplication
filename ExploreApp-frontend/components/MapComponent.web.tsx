import React from 'react';

export default function MapComponent({ latitude, longitude }: { latitude: number, longitude: number }) {
  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0, width: '100%', height: '100%' }}
      loading="lazy"
      allowFullScreen
      src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
    ></iframe>
  );
}
