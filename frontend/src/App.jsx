import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import Footer from "./components/Footer.jsx";
import Dashboard from "./components/Dashboard.jsx";
import MapView from "./components/MapView.jsx";
import AddEvent from "./components/AddEvent.jsx";
import EventsAllocationTable from "./components/EventsAllocationTable.jsx";

import theme from "./styles/muiCustomTheme"; // Import custom mui theme

function App() {
  const [isNavOpen, setNavOpen] = useState(false);

  const toggleNav = () => {
    setNavOpen(!isNavOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <div className="App">
          <Navigation isOpen={isNavOpen} toggleNav={toggleNav} />
          <div className="grid-parent">
            <Header toggleNav={toggleNav} />
            <div className="grid-main">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/mapview" element={<MapView />} />
                <Route path="/tableview" element={<EventsAllocationTable />} />
                <Route path="/addEvent" element={<AddEvent />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
