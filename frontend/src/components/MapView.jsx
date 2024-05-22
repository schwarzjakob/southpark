import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import TimelineSlider from './TimelineSlider.jsx'
import MapComponent from './MapComponent.jsx'
import DateInputComponent from './DateInputComponent.jsx'
import '../styles/mapView.css'
import dayjs from 'dayjs'

const MapView = () => {
  const today = dayjs().format('YYYY-MM-DD') // <-- Heutiges Datum
  const [selectedDate, setSelectedDate] = useState(today)
  return (
    <Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box
          className="mapView__title"
          display="flex"
          flexDirection="row"
          alignContent="center"
          gap={2}
        >
          <Typography variant="h3" component="h2" gutterBottom>
            Map View
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="left"
            borderColor="grey.300"
            p={1}
          >
            <DateInputComponent
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </Box>
        </Box>
        <Box
          className="map__timeline-slider"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <TimelineSlider
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </Box>
        <Box
          className="map__map-component"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <MapComponent selectedDate={selectedDate} />
        </Box>
      </Box>
    </Box>
  )
}

export default MapView
