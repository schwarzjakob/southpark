import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { Box, Button, Typography, useTheme } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import axios from "axios";

const colors = [
  "purple",
  "orange",
  "cyan",
  "pink",
  "teal",
  "indigo",
  "lime",
  "red",
  "deepOrange",
  "deepPurple",
  "lightBlue",
  "lightGreen",
  "yellow",
];

const TimelineSlider = ({ selectedDate, setSelectedDate }) => {
  const theme = useTheme();
  const [days, setDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventRows, setEventRows] = useState([]);
  const [colorMapping, setColorMapping] = useState({});
  const ROW_HEIGHT = 24; // Height of each row in pixels
  const OFFSET = 100; // Offset for the top padding
  const BUFFER = 10; // Number of days to buffer on each side

  useEffect(() => {
    const calculateNumberOfDays = () => Math.floor(window.innerWidth / 45);

    const generateDays = (centerDate, numberOfDays) => {
      const today = dayjs(centerDate);
      const halfNumberOfDays = Math.floor(numberOfDays / 2);
      return Array.from({ length: numberOfDays }, (_, i) =>
        today.add(i - halfNumberOfDays, "day").format("YYYY-MM-DD")
      );
    };

    const updateDays = () => {
      setDays(generateDays(selectedDate, calculateNumberOfDays() + BUFFER * 2)); // Add buffer on each side to extend the range
    };

    updateDays();
    window.addEventListener("resize", updateDays);

    return () => window.removeEventListener("resize", updateDays);
  }, [selectedDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get(
          `https://southpark.tirtey.com/api/events_timeline/${selectedDate}`
        );
        const eventsData = Array.isArray(data) ? data : [];
        setEvents(eventsData);

        const newColorMapping = eventsData.reduce((acc, event, index) => {
          if (!acc[event.event_name]) {
            acc[event.event_name] = colors[index % colors.length];
          }
          return acc;
        }, {});
        setColorMapping(newColorMapping);

        // Assign rows to events
        const rows = [];
        eventsData.forEach((event) => {
          const eventStart = dayjs(event.assembly_start_date).format(
            "YYYY-MM-DD"
          );
          const eventEnd = dayjs(event.disassembly_end_date).format(
            "YYYY-MM-DD"
          );
          let assigned = false;
          for (let i = 0; i < rows.length; i++) {
            if (
              !rows[i].some(
                (e) =>
                  dayjs(eventStart).isBetween(e.start, e.end, "day", "[]") ||
                  dayjs(eventEnd).isBetween(e.start, e.end, "day", "[]") ||
                  dayjs(e.start).isBetween(eventStart, eventEnd, "day", "[]") ||
                  dayjs(e.end).isBetween(eventStart, eventEnd, "day", "[]")
              )
            ) {
              rows[i].push({ start: eventStart, end: eventEnd, event });
              event.row = i;
              assigned = true;
              break;
            }
          }
          if (!assigned) {
            rows.push([{ start: eventStart, end: eventEnd, event }]);
            event.row = rows.length - 1;
          }
        });

        setEventRows(rows);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, [selectedDate]);

  const handleLeftClick = () => {
    const newDate = dayjs(selectedDate).subtract(1, "day").format("YYYY-MM-DD");
    setSelectedDate(newDate);
    setDays(
      days.map((day) => dayjs(day).subtract(1, "day").format("YYYY-MM-DD"))
    );
  };

  const handleRightClick = () => {
    const newDate = dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD");
    setSelectedDate(newDate);
    setDays(days.map((day) => dayjs(day).add(1, "day").format("YYYY-MM-DD")));
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowLeft") handleLeftClick();
      if (event.key === "ArrowRight") handleRightClick();
    },
    [handleLeftClick, handleRightClick]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleYearClick = (year) => {
    let newDate = dayjs(selectedDate).year(year);
    const daysInMonth = newDate.daysInMonth();
    if (newDate.date() > daysInMonth) {
      newDate = newDate.date(daysInMonth);
    }
    setSelectedDate(newDate.format("YYYY-MM-DD"));
  };

  const handleMonthClick = (monthIndex) => {
    let newDate = dayjs(selectedDate).month(monthIndex);
    const daysInMonth = newDate.daysInMonth();
    if (newDate.date() > daysInMonth) {
      newDate = newDate.date(daysInMonth);
    }
    setSelectedDate(newDate.format("YYYY-MM-DD"));
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const renderYears = () => {
    const startYear = dayjs().subtract(10, "year").year();
    const endYear = dayjs().add(10, "year").year();

    return Array.from({ length: 21 }, (_, i) => {
      const year = dayjs(selectedDate)
        .add(i - 10, "year")
        .year();
      if (year < startYear || year > endYear) return null;

      const isSelected = year === dayjs(selectedDate).year();

      return (
        <Typography
          key={year}
          className={`timeline-year ${isSelected ? "selected" : ""}`}
          variant="body2"
          onClick={() => handleYearClick(year)}
          sx={{
            marginX: 1,
            fontWeight: isSelected ? "bold" : "normal",
            color: isSelected
              ? "var(--color-pure-white)"
              : "var(--color-gray-400)",
            background: isSelected ? "var(--color-primary)" : "",
            cursor: "pointer",
          }}
        >
          {year}
        </Typography>
      );
    }).filter(Boolean);
  };

  const renderMonths = (months) => {
    return months.map((month, index) => (
      <Typography
        key={month}
        variant="body2"
        onClick={() => handleMonthClick(index)}
        sx={{
          marginX: 0.5,
          padding: "0 0.5rem",
          backgroundColor:
            dayjs(selectedDate).format("MMM") === month
              ? "var(--color-primary)"
              : "normal",
          fontWeight: dayjs(selectedDate).format("MMM") === month ? "bold" : "",
          color:
            dayjs(selectedDate).format("MMM") === month
              ? "var(--color-pure-white)"
              : "inherit",
          cursor: "pointer",
        }}
      >
        {month}
      </Typography>
    ));
  };

  const renderEventSegments = (
    event,
    startIndex,
    endIndex,
    opacity,
    labelText
  ) => {
    const left = startIndex * 45;
    const width = (endIndex - startIndex + 1) * 45;

    return (
      <Box
        key={`${event.event_id}-${startIndex}`}
        className="event-row"
        sx={{
          height: "22px",
          marginBottom: "2px",
          position: "absolute",
          left: `${left}px`,
          width: `${width}px`,
          top: `${event.row * ROW_HEIGHT + 48}px`,
          border: `1px solid ${colorMapping[event.event_name]}`,
        }}
      >
        <Box
          className="event-bar"
          sx={{
            backgroundColor: colorMapping[event.event_name],
            opacity: opacity,
            height: "100%",
            position: "relative",
          }}
        >
          {labelText && (
            <Typography
              className="event-bar__label"
              sx={{
                position: "relative",
                top: "0px",
                left: 0,
                fontSize: "0.75rem",
                color: "white",
                whiteSpace: "nowrap",
                zIndex: 1,
              }}
            >
              {labelText}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderEvents = (day) => {
    const uniqueEvents = {};

    // Filter and make unique
    events.forEach((event) => {
      if (
        dayjs(day).isBetween(
          dayjs(event.assembly_start_date).startOf("day"),
          dayjs(event.disassembly_end_date).endOf("day"),
          "day",
          "[]"
        )
      ) {
        uniqueEvents[event.event_id] = event;
      }
    });

    const dayEvents = Object.values(uniqueEvents);

    // Ensure empty rows are added if necessary
    const maxRow = Math.max(...dayEvents.map((event) => event.row), 0);
    const filledRows = Array.from({ length: maxRow + 1 }, (_, index) =>
      dayEvents.find((event) => event.row === index)
    );

    // Sort events by row to maintain consistent display order
    filledRows.sort((a, b) => (a?.row ?? -1) - (b?.row ?? -1));

    return filledRows.map((event, index) => {
      if (!event) {
        return (
          <Box
            key={`empty-${index}`}
            className="event-row"
            sx={{
              height: "22px",
              marginBottom: "2px",
              position: "relative",
              backgroundColor: "transparent",
            }}
          />
        );
      }

      const phases = [
        {
          startDate: event.assembly_start_date,
          endDate: event.assembly_end_date,
          opacity: 0.05,
        },
        {
          startDate: event.runtime_start_date,
          endDate: event.runtime_end_date,
          opacity: 1,
        },
        {
          startDate: event.disassembly_start_date,
          endDate: event.disassembly_end_date,
          opacity: 0.05,
        },
      ];

      const phaseSegments = phases.map((phase, idx) => {
        const phaseStart = dayjs(phase.startDate);
        const phaseEnd = dayjs(phase.endDate);
        const startIndex = days.findIndex((d) =>
          dayjs(d).isSame(phaseStart, "day")
        );
        const endIndex = days.findIndex((d) =>
          dayjs(d).isSame(phaseEnd, "day")
        );

        if (startIndex === -1 || endIndex === -1) return null; // Phase not in the current view

        const isFirstDay = idx === 0;
        const labelText =
          dayjs(day).isSame(event.runtime_start_date, "day") && idx === 1
            ? event.event_name
            : null;

        return renderEventSegments(
          event,
          startIndex,
          endIndex,
          phase.opacity,
          labelText
        );
      });

      return phaseSegments;
    });
  };

  return (
    <Box className="timeline-wrapper">
      <Box className="timeline-arrows-container">
        <Button onClick={handleLeftClick} className="arrow-button left">
          <ArrowBackIosIcon />
        </Button>
        <Button onClick={handleRightClick} className="arrow-button right">
          <ArrowForwardIosIcon />
        </Button>
      </Box>
      <Box
        className="timeline-container"
        sx={{
          height: `${eventRows.length * ROW_HEIGHT + OFFSET}px`,
        }}
      >
        <Box
          className="timeline-slider years"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {renderYears()}
        </Box>
        <Box
          className="timeline-slider months"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {renderMonths([
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ])}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box position="relative" sx={{ flexGrow: 1 }}>
            <Box
              className="timeline-slider days"
              sx={{
                display: "flex",
                bgcolor: theme.palette.background.paper,
                height: `${eventRows.length * ROW_HEIGHT + OFFSET}px`,
                // move the days container to the left
                position: "absolute",
                left: -BUFFER * 45 - 30, // -30 to center the selected day
              }}
            >
              {days.map((day) => (
                <Box
                  key={day + selectedDate}
                  className={`timeline-date ${
                    day === selectedDate ? "selected" : ""
                  }`}
                  onClick={() => handleDayClick(day)}
                  sx={{
                    width: "45px",
                    borderLeft:
                      dayjs(day).day() === 1 ? "1px solid black" : "none",
                    backgroundColor:
                      day % 2 === 0
                        ? "var(--color-gray-100)"
                        : "var(--color-gray-200)",
                    cursor: "pointer",
                  }}
                >
                  <Typography className="timeline-date__DD">
                    {dayjs(day).format("DD")}
                  </Typography>
                  <Typography className="timeline-date__ddd">
                    {dayjs(day).format("ddd")}
                  </Typography>
                  <Box
                    className="event-bars"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      pointerEvents: "none",
                    }}
                  >
                    {renderEvents(day)}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TimelineSlider;
