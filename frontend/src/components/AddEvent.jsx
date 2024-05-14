import React, { useState } from 'react';
import { TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function AddEvent() {
  const [eventData, setEventData] = useState({
    name: '',
    dates: {
      assembly: { start: '', end: '', allDates: [] },
      runtime: { start: '', end: '', allDates: [] },
      disassembly: { start: '', end: '', allDates: [] },
    },
    hall: 'A1',
    entrance: 'West',
    demands: {
      assembly: {},
      runtime: {},
      disassembly: {}
    }
  });

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
        dates.disassembly.start = new Date(new Date(dates.runtime.end).setDate(new Date(dates.runtime.end).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(disassembly.end) || new Date(dates.disassembly.start) > new Date(disassembly.end)) {
          dates.disassembly.end = dates.disassembly.start;
        }
        dates.runtime.start = new Date(new Date(value).setDate(new Date(value).getDate() + 1)).toISOString().slice(0, 10);
        if (!isValidDate(runtime.end) || new Date(dates.runtime.start) > new Date(runtime.end)) {
          dates.runtime.end = dates.runtime.start;
        }
        dates.assembly.end = new Date(new Date(dates.runtime.start).setDate(new Date(dates.runtime.start).getDate() - 1)).toISOString().slice(0, 10);
        if (!isValidDate(assembly.start) || new Date(dates.assembly.end) < new Date(assembly.start)) {
          dates.assembly.start = dates.assembly.end;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="add-event-form">
      <h2>Add New Event</h2>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Event Name"
            value={eventData.name}
            onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth required>
            <InputLabel>Hall</InputLabel>
            <Select
              value={eventData.hall}
              onChange={(e) => setEventData({ ...eventData, hall: e.target.value })}
            >
              {['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map(hall => (
                <MenuItem key={hall} value={hall}>{hall}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth required>
            <InputLabel>Entrance</InputLabel>
            <Select
              value={eventData.entrance}
              onChange={(e) => setEventData({ ...eventData, entrance: e.target.value })}
            >
              {['West', 'Nordwesten', 'Norden', 'Nordosten', 'Osten'].map(entrance => (
                <MenuItem key={entrance} value={entrance}>{entrance}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {['assembly', 'runtime', 'disassembly'].map(phase => (
          <React.Fragment key={phase}>
            <Grid item xs={12}>
              <h3>{phase.charAt(0).toUpperCase() + phase.slice(1)}</h3>
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
              />
            </Grid>
            {eventData.dates[phase].allDates?.map(date => (
              <Grid item xs={12} key={date}>
                <TextField
                  label={`${date} Demand`}
                  type="number"
                  value={eventData.demands[phase][date] || ''}
                  onChange={(e) => handleDemandChange(phase, date, e.target.value)}
                  required
                  fullWidth
                />
              </Grid>
            ))}
          </React.Fragment>
        ))}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" type="submit" fullWidth>
            Create Event
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default AddEvent;
