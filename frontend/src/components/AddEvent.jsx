import React, { useState } from 'react';
import { TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert } from '@mui/material';
import axios from 'axios';

const phaseLabels = {
  assembly: 'Assembly',
  runtime: 'Runtime',
  disassembly: 'Disassembly',
};

const entranceLabels = {
  west: 'West',
  north_west: 'Northwest',
  north: 'North',
  north_east: 'Northeast',
  east: 'East',
};

function AddEvent() {
  const initialEventData = {
    name: '',
    dates: {
      assembly: { start: '', end: '' },
      runtime: { start: '', end: '' },
      disassembly: { start: '', end: '' },
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
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });

  const isValidDate = (date) => {
    return date && !isNaN(new Date(date).getTime());
  };

  const isDateRangeValid = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneYear = 365 * 24 * 60 * 60 * 1000; // One year in milliseconds
    return (end - start) <= oneYear;
  };

  const adjustDates = (dates, phase, dateType, value) => {
    const { assembly, runtime, disassembly } = dates;

    if (!isValidDate(value)) {
      return dates;
    }

    // Handle forward date propagation
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
        if (!isValidDate(disassembly.end) || new Date(dates.disassembly.start) > new Date(disassembly.end)) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }
    }

    // Handle backward date propagation
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
        if (!isValidDate(assembly.start) || new Date(value) < new Date(assembly.start)) {
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
      setFeedback({ open: true, message: response.data.message, severity: 'success' });
      handleResetDates(); // Reset the form after successful submission
  
      try {
        const optimizeResponse = await axios.post('http://127.0.0.1:5000/optimize_distance');
        console.log('Optimization triggered successfully:', optimizeResponse.data);
        setFeedback({ open: true, message: optimizeResponse.data.message, severity: 'success' });
      } catch (optimizeError) {
        console.error('Error triggering optimization:', optimizeError);
        setFeedback({ open: true, message: 'Error triggering optimization', severity: 'error' });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setFeedback({ open: true, message: 'Error creating event', severity: 'error' });
    }
  };
  

  const handleResetDates = () => {
    setEventData(initialEventData);
    setStep(1);
  };

  const handleNext = () => {
    // Validate required fields before proceeding to the next step
    if (!eventData.name || !eventData.hall || !eventData.entrance ||
      !isValidDate(eventData.dates.assembly.start) || !isValidDate(eventData.dates.assembly.end) ||
      !isValidDate(eventData.dates.runtime.start) || !isValidDate(eventData.dates.runtime.end) ||
      !isValidDate(eventData.dates.disassembly.start) || !isValidDate(eventData.dates.disassembly.end)) {
      setFeedback({ open: true, message: 'Please fill all required fields.', severity: 'warning' });
      return;
    }

    // Check if any date range exceeds one year
    for (const phase in eventData.dates) {
      const { start, end } = eventData.dates[phase];
      if (isValidDate(start) && isValidDate(end) && !isDateRangeValid(start, end)) {
        alert(`The date range for ${phaseLabels[phase]} exceeds one year.`);
        return;
      }
    }

    setStep(2);
  };

  const handleBack = () => setStep(1);

  return (
    <form onSubmit={handleSubmit} className="add-event-form">
      <h2>Add New Event</h2>
      {step === 1 && (
        <>
          <h3>Event Details</h3>
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
                <InputLabel>Hall</InputLabel>
                <Select
                  value={eventData.hall}
                  onChange={(e) => setEventData({ ...eventData, hall: e.target.value })}
                  label="Hall"
                >
                  {['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map(hall => (
                    <MenuItem key={hall} value={hall}>{hall}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required variant="outlined">
                <InputLabel>Entrance</InputLabel>
                <Select
                  value={eventData.entrance}
                  onChange={(e) => setEventData({ ...eventData, entrance: e.target.value })}
                  label="Entrance"
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
                    label="Start Date"
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
                    label="End Date"
                    type="date"
                    value={eventData.dates[phase].end}
                    onChange={(e) => handleDateChange(phase, 'end', e.target.value)}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={6}>
              <Button variant="contained" color="primary" type="submit" onClick={handleNext} fullWidth>
                Continue with Demands
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="contained" color="secondary" onClick={handleResetDates} fullWidth>
                Reset
              </Button>
            </Grid>
          </Grid>
        </>
      )}
      {step === 2 && (
        <>
          <Grid container spacing={2}>
            {Object.keys(eventData.dates).map(phase => (
              eventData.dates[phase].start && new Date(eventData.dates[phase].start) <= new Date(eventData.dates[phase].end) && (
                <React.Fragment key={phase}>
                  <Grid item xs={12}>
                    <h3>{phaseLabels[phase]}</h3>
                  </Grid>
                  {new Array((new Date(eventData.dates[phase].end) - new Date(eventData.dates[phase].start)) / (1000 * 3600 * 24) + 1).fill().map((_, index) => {
                    const date = new Date(eventData.dates[phase].start);
                    date.setDate(date.getDate() + index);
                    const dateString = date.toISOString().slice(0, 10);
                    return (
                      <Grid item xs={12} key={dateString}>
                        <TextField
                          label={`${dateString} Demand`}
                          type="number"
                          value={eventData.demands[phase][dateString] || ''}
                          onChange={(e) => handleDemandChange(phase, dateString, e.target.value)}
                          required
                          fullWidth
                          variant="outlined"
                        />
                      </Grid>
                    );
                  })}
                </React.Fragment>
              )
            ))}
            <Grid item xs={6}>
              <Button variant="contained" color="primary" type="submit" fullWidth>
                Submit Event
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="contained" color="secondary" onClick={handleResetDates} fullWidth>
                Reset
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="contained" color="secondary" onClick={handleBack} fullWidth>
                Back
              </Button>
            </Grid>
          </Grid>
        </>
      )}
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({ ...feedback, open: false })}>
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </form>
  );
}

export default AddEvent;
