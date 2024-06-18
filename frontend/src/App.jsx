// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import Header from "./components/common/Header.jsx";
import Navigation from "./components/common/Navigation.jsx";
import Footer from "./components/common/Footer.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import MapView from "./components/map/MapView.jsx";
import AddEvent from "./components/events/AddEvent.jsx";
import EditEvent from "./components/events/EditEvent.jsx";
import ImportCSV from "./components/import/ImportCSV.jsx";
import InputDemands from "./components/events/InputDemands.jsx";
import EventsAllocationTable from "./components/events/EventsAllocationTable.jsx";
import Team from "./components/team/Team.jsx";
import MobileWarning from "./components/common/MobileWarning.jsx";
import theme from "./styles/muiCustomTheme";
import "./styles/antTheme.css";

function App() {
  const [isNavOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleNav = () => {
    setNavOpen(!isNavOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (isMobile) {
    return <MobileWarning />;
  }

  return (
    <ThemeProvider theme={theme}>
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
                <Route path="/editEvent" element={<EditEvent />} />
                <Route path="/import" element={<ImportCSV />} />
                <Route path="/input_demands" element={<InputDemands />} />
                <Route path="/user" element={<Team />} />
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
