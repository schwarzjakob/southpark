import 'leaflet/dist/leaflet.css';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

const MapComponent = () => {
  return (
    <MapContainer center={[48.137464, 11.700914]} zoom={16}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default MapComponent;
