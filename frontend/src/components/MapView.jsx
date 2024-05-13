import React, { useEffect, useState } from "react";
import CalendarSlider from "./CalendarSlider.jsx";
import MapComponent from "./MapComponent.jsx";

const MapView = () => {
  return (
    <div>
      <h2>MapView</h2>
      <div className="mapView-Container">
        <div className="mapView__item label">Events</div>
        <div className="mapView__item content">
          <CalendarSlider />
        </div>
        <div className="mapView__item label">Parking Lots</div>
        <div className="mapView__item content">
          <CalendarSlider />
        </div>
        <div className="mapView__item label">Map</div>
        <div className="mapView__item content">
          <MapComponent />
        </div>
      </div>
    </div>
  );
};

export default MapView;
