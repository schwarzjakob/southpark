import React, { useEffect, useState } from 'react';
import CalendarSlider from './CalendarSlider.jsx';
import MapComponent from './MapComponent.jsx';
import DateInputComponent from './DateInputComponent.jsx';

const MapView = () => {
  return (
    <div>
      <h2>MapView</h2>
      <DateInputComponent />
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
        <div>
          <MapComponent />
        </div>
      </div>
    </div>
  );
};

export default MapView;
