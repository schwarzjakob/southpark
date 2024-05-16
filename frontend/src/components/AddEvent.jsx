import React, { useState } from 'react';
import { TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import axios from 'axios';  // Import axios for making HTTP requests

const phaseLabels = {
  assembly: 'Aufbau',
  runtime: 'Laufzeit',
  disassembly: 'Abbau',
};

const entranceLabels = {
  west: 'Westen',
  north_west: 'Nordwesten',
  north: 'Norden',
  north_east: 'Nordosten',
  east: 'Osten',
};

function AddEvent() {
  const initialEventData = {
    name: '',
    dates: {
      assembly: { start: '', end: '', allDates: [] },
      runtime: { start: '', end: '', allDates: [] },
      disassembly: { start: '', end: '', allDates: [] },
    },
    hall: 'A1',
    entrance: 'west',
    demands: {
      assembly: {},
      runtime: {},
      disassembly: {}
    }
  };

  const [eventData, setEventData] = useState(initialEventData);

  const isValidDate = (date) => {
    return date && !isNaN(new Date(date).getTime());
  };

  const adjustDates = (dates, phase, dateType, value) => {
    const { assembly, runtime, disassembly } = dates;

    // Handle forwards propagation
    if (dateType === 'start') {
      if (phase === 'assembly') {
        if (!isValidDate(assembly.end) || new Date(value) > new Date(assembly.end)) {
          dates.assembly.end = value;
        }
        dates.runtime.start = new Date(new Date(dates.assembly.end).setDate(new Date(dates.assembly.end).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(runtime.end) || new Date(dates.runtime.start) > new Date(runtime.end)) {
          dates.runtime.end = dates.runtime.start;
        }
        dates.disassembly.start = new Date(new Date(dates.runtime.end).setDate(new Date(dates.runtime.end).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(disassembly.end) || new Date(dates.disassembly.start) > new Date(disassembly.end)) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }

      if (phase === 'runtime') {
        dates.assembly.end = new Date(new Date(value).setDate(new Date(value).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(assembly.start) || new Date(dates.assembly.end) < new Date(assembly.start)) {
          dates.assembly.start = dates.assembly.end;
        }
        if (!isValidDate(runtime.end) || new Date(value) > new Date(runtime.end)) {
          dates.runtime.end = value;
        }
        dates.disassembly.start = new Date(new Date(dates.runtime.end).setDate(new Date(dates.runtime.end).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(disassembly.end) || new Date(dates.disassembly.start) > new Date(disassembly.end)) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }

      if (phase === 'disassembly') {
        dates.runtime.end = new Date(new Date(value).setDate(new Date(value).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(runtime.start) || new Date(dates.runtime.end) < new Date(runtime.start)) {
          dates.runtime.start = dates.runtime.end;
        }
        dates.assembly.end = new Date(new Date(dates.runtime.start).setDate(new Date(dates.runtime.start).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(assembly.start) || new Date(dates.assembly.end) < new Date(assembly.start)) {
          dates.assembly.start = dates.assembly.end;
        }
      }
    }

    // Handle backwards propagation
    if (dateType === 'end') {
      if (phase === 'disassembly') {
        if (!isValidDate(disassembly.start) || new Date(value) < new Date(disassembly.start)) {
          dates.disassembly.start = value;
        }
        dates.runtime.end = new Date(new Date(dates.disassembly.start).setDate(new Date(dates.disassembly.start).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(runtime.start) || new Date(dates.runtime.end) < new Date(runtime.start)) {
          dates.runtime.start = dates.runtime.end;
        }
        dates.assembly.end = new Date(new Date(dates.runtime.start).setDate(new Date(dates.runtime.start).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(assembly.start) || new Date(dates.assembly.end) < new Date(assembly.start)) {
          dates.assembly.start = dates.assembly.end;
        }
      }

      if (phase === 'runtime') {
        dates.disassembly.start = new Date(new Date(value).setDate(new Date(value).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(disassembly.end) || new Date(dates.disassembly.start) > new Date(disassembly.end)) {
          dates.disassembly.end = dates.disassembly.start;
        }
        if (!isValidDate(runtime.start) || new Date(value) < new Date(runtime.start)) {
          dates.runtime.start = value;
        }
        dates.assembly.end = new Date(new Date(dates.runtime.start).setDate(new Date(dates.runtime.start).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(assembly.start) || new Date(dates.assembly.end) < new Date(assembly.start)) {
          dates.assembly.start = dates.assembly.end;
        }
      }

      if (phase === 'assembly') {
        if (!isValidDate(assembly.start)) {
          dates.assembly.start = value;
        }
        dates.runtime.start = new Date(new Date(value).setDate(new Date(value).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(runtime.end) || new Date(dates.runtime.start) > new Date(runtime.end)) {
          dates.runtime.end = dates.runtime.start;
        }
        dates.disassembly.start = new Date(new Date(dates.runtime.end).setDate(new Date(dates.runtime.end).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(disassembly.end) || new Date(dates.disassembly.start) > new Date(disassembly.end)) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }
    }

    // Recalculate date ranges for all phases
    Object.keys(dates).forEach(phase => {
      if (isValidDate(dates[phase].start) && isValidDate(dates[phase].end)) {
        dates[phase].allDates = calculateDateRange(dates[phase].start, dates[phase].end);
      }
    });

    return dates;
  };

  const handleDateChange = (phase, dateType, value) => {
    setEventData(prevState => {
      const updatedDates = { ...prevState.dates };
      updatedDates[phase][dateType] = value;
      const adjustedDates = adjustDates(updatedDates, phase, dateType, value);

      return {
        ...prevState,
        dates: adjustedDates
      };
    });
  };

  const calculateDateRange = (startDate, endDate) => {
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const dateArray = [];
    while (currentDate <= end) {
      dateArray.push(new Date(currentDate).toISOString().slice(0, 10));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  const handleDemandChange = (phase, date, value) => {
    setEventData(prevState => ({
      ...prevState,
      demands: {
        ...prevState.demands,
        [phase]: {
          ...prevState.demands[phase],
          [date]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:5000/add_event', eventData);
      console.log('Event created successfully:', response.data);
      handleResetDates(); // Reset the form after successful submission
    } catch (error) {
      console.error('Error creating event:', error);
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/optimize_distance');
      console.log('Optimization triggered successfully:', response.data);
    } catch (error) {
      console.error('Error triggering optimization:', error);
    }
  };

  const handleResetDates = () => {
    setEventData(initialEventData);
  };

  return (
    <form onSubmit={handleSubmit} className="add-event-form">
      <h2>Add New Event</h2>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Event"
            value={eventData.name}
            onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth required variant="outlined">
            <InputLabel>Halle</InputLabel>
            <Select
              value={eventData.hall}
              onChange={(e) => setEventData({ ...eventData, hall: e.target.value })}
              label="Halle"
            >
              {['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map(hall => (
                <MenuItem key={hall} value={hall}>{hall}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth required variant="outlined">
            <InputLabel>Eingang</InputLabel>
            <Select
              value={eventData.entrance}
              onChange={(e) => setEventData({ ...eventData, entrance: e.target.value })}
              label="Eingang"
            >
              {Object.entries(entranceLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {Object.keys(phaseLabels).map(phase => (
          <React.Fragment key={phase}>
            <Grid item xs={12}>
              <h3>{phaseLabels[phase]}</h3>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Startdatum"
                type="date"
                value={eventData.dates[phase].start}
                onChange={(e) => handleDateChange(phase, 'start', e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Enddatum"
                type="date"
                value={eventData.dates[phase].end}
                onChange={(e) => handleDateChange(phase, 'end', e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            {eventData.dates[phase].allDates?.map(date => (
              <Grid item xs={12} key={date}>
                <TextField
                  label={`${date} Bedarf`}
                  type="number"
                  value={eventData.demands[phase][date] || ''}
                  onChange={(e) => handleDemandChange(phase, date, e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            ))}
          </React.Fragment>
        ))}
        <Grid item xs={6}>
          <Button variant="contained" color="primary" type="submit" fullWidth>
            Event anlegen
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="contained" color="secondary" fullWidth onClick={handleResetDates}>
            Zurücksetzen
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default AddEvent;
