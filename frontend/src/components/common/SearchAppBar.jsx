import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { InputBase, Box, Typography, Paper } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";
import GarageIcon from "@mui/icons-material/GarageRounded";
import axios from "axios";
import dayjs from "dayjs"; 

function SearchAppBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    events: [],
    parkingSpaces: [],
    message: "",
  });
  const resultsContainerRef = useRef();

  useEffect(() => {
    if (query.length < 1) {
      setResults({ events: [], parkingSpaces: [], message: "" });
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await axios.get("/api/data/search", {
          params: { q: query },
        });

        if (response.status === 204) {
          setResults({
            events: [],
            parkingSpaces: [],
            message: `No results for "${query}"`,
          });
        } else if (Array.isArray(response.data)) {
          const events = response.data
            .filter((result) => result.type === "event")
            .slice(0, 10);
          const parkingSpaces = response.data
            .filter((result) => result.type !== "event")
            .slice(0, 10);
          setResults({ events, parkingSpaces, message: "" });
        } else {
          console.error("Unexpected response format:", response.data);
          setResults({
            events: [],
            parkingSpaces: [],
            message: `No results for "${query}"`,
          });
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults({
          events: [],
          parkingSpaces: [],
          message: `Error fetching results for "${query}"`,
        });
      }
    };

    fetchResults();
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultsContainerRef.current &&
        !resultsContainerRef.current.contains(event.target)
      ) {
        setResults({ events: [], parkingSpaces: [], message: "" });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [resultsContainerRef]);

  const handleLinkClick = () => {
    setResults({ events: [], parkingSpaces: [], message: "" });
  };

  return (
    <Box position="relative">
      <div className="search-container">
        <div className="search-wrapper">
          <SearchIcon className="search-icon" />
        </div>
        <InputBase
          className="search-input"
          placeholder="Search..."
          inputProps={{ "aria-label": "search" }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {(results.events.length > 0 ||
        results.parkingSpaces.length > 0 ||
        results.message) && (
        <div className="search-results-container" ref={resultsContainerRef}>
          {results.message && (
            <Typography variant="body1">{results.message}</Typography>
          )}
          {results.events.length > 0 && (
            <>
              <Typography className="results-title" variant="body1">
                Events
              </Typography>
              {results.events.map((result) => (
                <Paper
                  key={result.id}
                  component={Link}
                  to={`/events/event/${result.id}`}
                  className="result-tile"
                  onClick={handleLinkClick}
                >
                  <Box className="search-result">
                    <Box
                      className="search-result-icon"
                      style={{ color: result.color }}
                    >
                      <EventIcon />
                    </Box>
                    <Box>
                      <Typography className="results-name" variant="body1">
                        {result.name}
                      </Typography>
                      <Typography variant="body2">
                        {dayjs(result.assembly_start_date).format("DD.MM.YYYY")}{" "}
                        -{" "}
                        {dayjs(result.disassembly_end_date).format(
                          "DD.MM.YYYY",
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </>
          )}
          {results.parkingSpaces.length > 0 && (
            <>
              <Typography className="results-title" variant="body1">
                Parking Spaces
              </Typography>
              {results.parkingSpaces.map((result) => (
                <Paper
                  key={result.id}
                  component={Link}
                  to={`/parking_space/${result.id}`}
                  className="result-tile"
                  onClick={handleLinkClick}
                >
                  <Box className="search-result">
                    <Box
                      className="search-result-icon"
                      style={{ color: result.color }}
                    >
                      <GarageIcon />
                    </Box>
                    <Typography className="results-name" variant="body1">
                      {result.name}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </>
          )}
        </div>
      )}
    </Box>
  );
}

export default SearchAppBar;
