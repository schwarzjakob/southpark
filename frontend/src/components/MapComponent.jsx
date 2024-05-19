import "leaflet/dist/leaflet.css";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

const MapComponent = () => {
  // Bounds did not work. Still in progress.
  const bounds = [
    [48.133145, 11.688606], // Southwest coordinates
    [48.33, 11.722], // Northeast coordinates
  ];

  return (
    <MapContainer center={[48.1375, 11.702]} zoom={16} bounds={bounds}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default MapComponent;
